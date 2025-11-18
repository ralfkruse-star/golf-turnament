# Backup and Restore Runbook

Procedures for backing up and restoring the Golf Tournament Management System.

---

## Overview

**Backup Strategy:**
- **Full database backups:** Daily at 2 AM UTC
- **Incremental WAL archiving:** Continuous
- **Photo backups:** Daily sync to backup bucket
- **Retention:** 30 days for daily, 90 days for monthly
- **Storage:** AWS S3 (or compatible)

**RTO/RPO Targets:**
- **RTO (Recovery Time Objective):** 1 hour
- **RPO (Recovery Point Objective):** 5 minutes (via WAL archiving)

---

## Automated Backups

### Database Backup Script

Location: `/opt/golf-tournament/scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/postgresql
S3_BUCKET=golf-tournament-backups
RETENTION_DAYS=30

# Database connection
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-golf_tournament}
DB_USER=${DB_USER:-postgres}

# Backup filename
BACKUP_FILE="${BACKUP_DIR}/golf_tournament_${TIMESTAMP}.dump"

echo "[$(date)] Starting database backup..."

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Create dump
PGPASSWORD=${DB_PASSWORD} pg_dump \
  -h ${DB_HOST} \
  -p ${DB_PORT} \
  -U ${DB_USER} \
  -d ${DB_NAME} \
  -Fc \
  -f ${BACKUP_FILE}

# Compress
gzip ${BACKUP_FILE}

# Verify backup
if pg_restore --list ${BACKUP_FILE}.gz | head -20; then
  echo "[$(date)] Backup verification successful"
else
  echo "[$(date)] Backup verification failed!"
  exit 1
fi

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://${S3_BUCKET}/daily/ \
  --storage-class STANDARD_IA

echo "[$(date)] Backup uploaded to S3"

# Cleanup old local backups
find ${BACKUP_DIR} -name "*.dump.gz" -mtime +7 -delete

# Cleanup old S3 backups
aws s3 ls s3://${S3_BUCKET}/daily/ | \
  while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date --date="${RETENTION_DAYS} days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo $line | awk '{print $4}')
      if [[ $fileName != "" ]]; then
        aws s3 rm s3://${S3_BUCKET}/daily/$fileName
      fi
    fi
  done

echo "[$(date)] Backup complete: ${BACKUP_FILE}.gz"
```

### Photo Backup Script

Location: `/opt/golf-tournament/scripts/backup-photos.sh`

```bash
#!/bin/bash
set -e

S3_SOURCE=s3://golf-tournament-photos-prod
S3_BACKUP=s3://golf-tournament-photos-backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "[$(date)] Starting photo backup..."

# Incremental sync
aws s3 sync ${S3_SOURCE} ${S3_BACKUP} \
  --storage-class GLACIER_INSTANT_RETRIEVAL \
  --exclude "*.tmp"

# Create monthly snapshot
DAY_OF_MONTH=$(date +%d)
if [ "$DAY_OF_MONTH" == "01" ]; then
  aws s3 sync ${S3_BACKUP} s3://golf-tournament-photos-snapshots/${TIMESTAMP}/ \
    --storage-class GLACIER
  echo "[$(date)] Monthly snapshot created"
fi

echo "[$(date)] Photo backup complete"
```

### Cron Schedule

```cron
# Database backup (daily at 2 AM)
0 2 * * * /opt/golf-tournament/scripts/backup-database.sh >> /var/log/backup-database.log 2>&1

# Photo backup (daily at 3 AM)
0 3 * * * /opt/golf-tournament/scripts/backup-photos.sh >> /var/log/backup-photos.log 2>&1

# Weekly backup verification (Sundays at 4 AM)
0 4 * * 0 /opt/golf-tournament/scripts/verify-backups.sh >> /var/log/verify-backups.log 2>&1
```

---

## Manual Backup Procedures

### Full Database Backup

```bash
# Standard backup
pg_dump -Fc -h <host> -U postgres -d golf_tournament > backup_$(date +%Y%m%d_%H%M%S).dump

# With compression
pg_dump -Fc -Z9 -h <host> -U postgres -d golf_tournament > backup_$(date +%Y%m%d_%H%M%S).dump

# SQL format (human-readable)
pg_dump -h <host> -U postgres -d golf_tournament > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp backup_*.dump s3://golf-tournament-backups/manual/
```

### Table-Specific Backup

```bash
# Backup specific table
pg_dump -Fc -h <host> -U postgres -d golf_tournament -t Tournament > tournaments_backup.dump

# Multiple tables
pg_dump -Fc -h <host> -U postgres -d golf_tournament \
  -t Tournament -t Player -t Scorecard > critical_tables_backup.dump
```

### Schema-Only Backup

```bash
# Schema without data
pg_dump --schema-only -h <host> -U postgres -d golf_tournament > schema_$(date +%Y%m%d).sql
```

---

## Restore Procedures

### Full Database Restore

**Scenario 1: Complete Database Loss**

```bash
# 1. Download latest backup from S3
aws s3 cp s3://golf-tournament-backups/daily/golf_tournament_20250115_020000.dump.gz .

# 2. Decompress
gunzip golf_tournament_20250115_020000.dump.gz

# 3. Stop application
docker-compose stop app

# 4. Drop existing database (if exists)
psql -h <host> -U postgres -c "DROP DATABASE IF EXISTS golf_tournament"

# 5. Create new database
psql -h <host> -U postgres -c "CREATE DATABASE golf_tournament"

# 6. Restore backup
pg_restore \
  -h <host> \
  -U postgres \
  -d golf_tournament \
  -v \
  golf_tournament_20250115_020000.dump

# 7. Verify restore
psql -h <host> -U postgres -d golf_tournament -c "SELECT COUNT(*) FROM \"Tournament\""

# 8. Run any missing migrations
pnpm prisma migrate deploy

# 9. Restart application
docker-compose up -d app

# 10. Verify application
curl http://localhost/api/health
```

**Time:** 30-60 minutes (depends on database size)

**Scenario 2: Table-Level Restore**

```bash
# 1. Backup current table (just in case)
pg_dump -Fc -h <host> -U postgres -d golf_tournament -t Tournament > tournament_before_restore.dump

# 2. Download backup
aws s3 cp s3://golf-tournament-backups/daily/golf_tournament_20250115_020000.dump.gz .
gunzip golf_tournament_20250115_020000.dump.gz

# 3. Restore specific table
pg_restore \
  -h <host> \
  -U postgres \
  -d golf_tournament \
  -t Tournament \
  --clean \
  --if-exists \
  golf_tournament_20250115_020000.dump

# 4. Verify
psql -h <host> -U postgres -d golf_tournament -c "SELECT COUNT(*) FROM \"Tournament\""
```

**Time:** 5-15 minutes

### Point-in-Time Recovery (PITR)

**Requires:**
- Base backup
- WAL archives

**Procedure:**

```bash
# 1. Stop PostgreSQL
sudo systemctl stop postgresql

# 2. Rename data directory
sudo mv /var/lib/postgresql/14/main /var/lib/postgresql/14/main.old

# 3. Restore base backup
sudo -u postgres pg_basebackup -h <host> -D /var/lib/postgresql/14/main

# 4. Create recovery configuration
cat > /var/lib/postgresql/14/main/postgresql.auto.conf << EOF
restore_command = 'aws s3 cp s3://golf-tournament-backups/wal/%f %p'
recovery_target_time = '2025-01-15 12:30:00'
recovery_target_action = 'promote'
EOF

# 5. Create recovery signal file
touch /var/lib/postgresql/14/main/recovery.signal

# 6. Start PostgreSQL
sudo systemctl start postgresql

# 7. Monitor recovery
tail -f /var/log/postgresql/postgresql-14-main.log

# 8. Verify database state
psql -h <host> -U postgres -d golf_tournament -c "SELECT NOW()"
```

**Time:** 1-2 hours

---

## Backup Verification

### Automated Verification Script

```bash
#!/bin/bash
# /opt/golf-tournament/scripts/verify-backups.sh

LATEST_BACKUP=$(aws s3 ls s3://golf-tournament-backups/daily/ | tail -1 | awk '{print $4}')

echo "Verifying backup: $LATEST_BACKUP"

# Download
aws s3 cp s3://golf-tournament-backups/daily/$LATEST_BACKUP /tmp/

# Decompress
gunzip /tmp/$LATEST_BACKUP

# Verify with pg_restore
BACKUP_FILE="${LATEST_BACKUP%.gz}"
if pg_restore --list /tmp/$BACKUP_FILE | head -20; then
  echo "✅ Backup verification successful"

  # Try restoring to test database
  psql -c "DROP DATABASE IF EXISTS golf_tournament_test"
  psql -c "CREATE DATABASE golf_tournament_test"
  pg_restore -d golf_tournament_test /tmp/$BACKUP_FILE

  # Verify data
  TABLE_COUNT=$(psql -d golf_tournament_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
  echo "Tables restored: $TABLE_COUNT"

  # Cleanup
  psql -c "DROP DATABASE golf_tournament_test"
  rm /tmp/$BACKUP_FILE

  echo "✅ Full verification successful"
else
  echo "❌ Backup verification failed!"
  exit 1
fi
```

### Manual Verification

```bash
# List backup contents
pg_restore --list backup.dump | head -50

# Check backup size
ls -lh backup.dump

# Verify tables in backup
pg_restore --list backup.dump | grep "TABLE DATA"

# Count rows per table (requires restore to test database)
psql -d golf_tournament_test -c "
  SELECT
    schemaname,
    tablename,
    n_live_tup
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC
"
```

---

## Disaster Recovery Scenarios

### Scenario 1: Accidental Data Deletion

**Example:** Admin accidentally deletes all tournaments

```bash
# 1. Immediate action: Prevent further changes
# Enable maintenance mode
export MAINTENANCE_MODE=true

# 2. Assess damage
psql -d golf_tournament -c "SELECT COUNT(*) FROM \"Tournament\""

# 3. Restore from backup (table-level)
# Get last backup before deletion
aws s3 ls s3://golf-tournament-backups/daily/ | grep $(date +%Y%m%d)

# Download and restore Tournament table
aws s3 cp s3://golf-tournament-backups/daily/golf_tournament_20250115_020000.dump.gz .
gunzip golf_tournament_20250115_020000.dump.gz
pg_restore -d golf_tournament -t Tournament --clean --if-exists golf_tournament_20250115_020000.dump

# 4. Verify
psql -d golf_tournament -c "SELECT COUNT(*) FROM \"Tournament\""

# 5. Re-enable application
unset MAINTENANCE_MODE
```

### Scenario 2: Database Corruption

**Symptoms:** Cannot start database, corruption errors in logs

```bash
# 1. Attempt repair
sudo -u postgres pg_resetwal /var/lib/postgresql/14/main

# 2. If repair fails, restore from backup
# Follow "Full Database Restore" procedure above

# 3. Consider PITR if recent data is critical
# Follow "Point-in-Time Recovery" procedure
```

### Scenario 3: Ransomware/Security Breach

```bash
# 1. Immediate isolation
# Disconnect database from network
# Stop all applications

# 2. Assess compromise
# Check for data exfiltration
# Review audit logs

# 3. Full restore from clean backup
# Ensure backup predates compromise
# Restore to new infrastructure

# 4. Security hardening
# Rotate all secrets
# Update security groups
# Patch vulnerabilities

# 5. Gradual re-enable
# Test thoroughly
# Monitor closely
```

---

## Backup Monitoring

### Metrics to Track

```bash
# Backup success rate (should be 100%)
aws s3 ls s3://golf-tournament-backups/daily/ | wc -l

# Backup size trend
aws s3 ls s3://golf-tournament-backups/daily/ --recursive | \
  awk '{sum+=$3} END {print sum/1024/1024/1024 " GB"}'

# Time to complete
grep "Backup complete" /var/log/backup-database.log | \
  tail -1 | awk '{print $2}'

# Last successful backup
aws s3 ls s3://golf-tournament-backups/daily/ | tail -1
```

### Alerts to Configure

- Backup failed (no backup in last 25 hours)
- Backup size anomaly (>50% change)
- Backup duration >1 hour
- S3 bucket approaching quota
- Verification failed

---

## Backup Best Practices

1. **Test Restores Regularly**
   - Monthly restore test to staging
   - Quarterly DR drill
   - Document restore time

2. **3-2-1 Rule**
   - 3 copies of data
   - 2 different storage types
   - 1 offsite copy

3. **Encrypt Backups**
   ```bash
   # Encrypt before upload
   gpg --encrypt backup.dump
   aws s3 cp backup.dump.gpg s3://golf-tournament-backups/
   ```

4. **Monitor Backup Jobs**
   - Set up alerts
   - Review logs daily
   - Track metrics

5. **Document Everything**
   - What is backed up
   - Where it's stored
   - How to restore
   - Who has access

---

## Emergency Contacts

- **Database Admin:** [phone/email]
- **DevOps Lead:** [phone/email]
- **Security Team:** [phone/email]
- **AWS Support:** [account number]

---

## Related Runbooks

- [Database Migration](./database-migration.md)
- [Rollback Procedure](./rollback-procedure.md)
- [Incident Response](./incident-response.md)

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Owner:** DevOps Team
