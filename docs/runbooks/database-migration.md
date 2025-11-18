# Database Migration Runbook

Step-by-step procedures for database schema migrations in production.

---

## Overview

This runbook covers:
- Pre-migration checklist
- Migration execution
- Rollback procedures
- Post-migration verification
- Troubleshooting common issues

**Audience:** DevOps, Database Administrators, Senior Developers

**Prerequisites:**
- Production database access
- Prisma CLI installed
- Backup verified and tested

---

## Pre-Migration Checklist

### 1. Preparation (24-48 hours before)

- [ ] **Review Migration Files**
  ```bash
  # List all pending migrations
  pnpm prisma migrate status

  # Review migration SQL
  cat prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql
  ```

- [ ] **Test on Staging**
  ```bash
  # Apply to staging
  DATABASE_URL="<staging-url>" pnpm prisma migrate deploy

  # Verify application works
  # Run integration tests
  pnpm test:integration
  ```

- [ ] **Estimate Downtime**
  - Simple migrations (add column, index): < 1 minute
  - Medium migrations (alter table, add FK): 1-5 minutes
  - Complex migrations (data transformation): 5-30 minutes

- [ ] **Create Backup**
  ```bash
  # Full database backup
  pg_dump -Fc -h <host> -U <user> -d golf_tournament > backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump

  # Verify backup
  pg_restore --list backup_pre_migration_*.dump | head -20

  # Upload to S3
  aws s3 cp backup_pre_migration_*.dump s3://golf-tournament-backups/migrations/
  ```

- [ ] **Notify Stakeholders**
  - Send email 24 hours before
  - Post in status page
  - Update monitoring alerts

- [ ] **Prepare Rollback Plan**
  - Document rollback steps
  - Prepare rollback SQL (if applicable)
  - Test rollback on staging

### 2. Communication Template

**Subject:** Scheduled Maintenance - Database Migration

```
Dear Team,

We will be performing a database migration on:
- Date: [DATE]
- Time: [TIME] [TIMEZONE]
- Duration: Approximately [DURATION] minutes
- Impact: [NONE / DEGRADED PERFORMANCE / DOWNTIME]

What to expect:
- [Description of changes]
- [Impact on users]

Rollback plan:
- [Brief description]

We will send updates:
- 1 hour before
- When maintenance starts
- When maintenance completes

Thank you for your patience.
```

---

## Migration Types

### Type A: Zero-Downtime Migrations

**Characteristics:**
- Adding new columns (with default values)
- Adding new tables
- Adding indexes (CONCURRENTLY)

**Procedure:**

1. **Deploy Migration** (no downtime required)
   ```bash
   # Connect to production
   ssh production-server

   # Set database URL
   export DATABASE_URL="postgresql://..."

   # Apply migration
   pnpm prisma migrate deploy

   # Verify
   pnpm prisma migrate status
   ```

2. **Deploy Application** (rolling update)
   ```bash
   # Deploy new version (supports old and new schema)
   git tag v1.2.0
   git push origin v1.2.0

   # Vercel/Railway auto-deploys
   # Or manually trigger deployment
   ```

3. **Verify**
   ```bash
   # Check health endpoint
   curl https://yourdomain.com/api/health

   # Check logs
   tail -f /var/log/golf-tournament/app.log
   ```

### Type B: Low-Downtime Migrations

**Characteristics:**
- Altering columns (non-breaking)
- Adding constraints
- Removing deprecated columns/tables

**Procedure:**

1. **Enable Maintenance Mode**
   ```bash
   # Set environment variable
   export MAINTENANCE_MODE=true

   # Or use feature flag
   # Users see "Under Maintenance" page
   ```

2. **Wait for Active Connections to Drain**
   ```sql
   -- Check active connections
   SELECT pid, usename, application_name, state, query
   FROM pg_stat_activity
   WHERE datname = 'golf_tournament'
     AND state = 'active';

   -- Wait for queries to complete (max 60 seconds)
   ```

3. **Apply Migration**
   ```bash
   pnpm prisma migrate deploy
   ```

4. **Deploy Application**
   ```bash
   # Deploy new version
   ./deploy.sh
   ```

5. **Disable Maintenance Mode**
   ```bash
   unset MAINTENANCE_MODE
   ```

6. **Verify**
   ```bash
   # Check health
   curl https://yourdomain.com/api/health

   # Monitor errors
   # Check Sentry for any new errors
   ```

### Type C: High-Downtime Migrations

**Characteristics:**
- Major schema changes
- Data transformations
- Full table rewrites

**Procedure:**

1. **Schedule Downtime** (low-traffic window)
   - Ideal: 2-4 AM local time
   - Weekend preferred

2. **Enable Maintenance Mode**
   ```bash
   # Stop application
   docker-compose stop app

   # Or set maintenance mode
   export MAINTENANCE_MODE=true
   ```

3. **Create Backup**
   ```bash
   pg_dump -Fc golf_tournament > backup_pre_migration.dump
   ```

4. **Apply Migration**
   ```bash
   pnpm prisma migrate deploy

   # Or manually apply SQL
   psql -h <host> -U <user> -d golf_tournament -f migration.sql
   ```

5. **Verify Migration**
   ```sql
   -- Check table structure
   \d+ "Tournament"

   -- Verify data
   SELECT COUNT(*) FROM "Tournament";

   -- Check indexes
   SELECT * FROM pg_indexes WHERE tablename = 'Tournament';
   ```

6. **Deploy Application**
   ```bash
   ./deploy.sh
   ```

7. **Start Application**
   ```bash
   docker-compose up -d app
   ```

8. **Verify**
   ```bash
   # Wait for app to start
   sleep 30

   # Check health
   curl https://yourdomain.com/api/health

   # Smoke tests
   ./scripts/smoke-tests.sh
   ```

9. **Disable Maintenance Mode**
   ```bash
   unset MAINTENANCE_MODE
   ```

10. **Monitor**
    - Watch error rates in Sentry
    - Monitor response times
    - Check database performance
    - Review user reports

---

## Rollback Procedures

### Scenario 1: Migration Failed

**If migration fails during execution:**

```bash
# 1. Check error message
pnpm prisma migrate status

# 2. Resolve the conflict manually
psql -h <host> -U <user> -d golf_tournament

# 3. Mark migration as applied
pnpm prisma migrate resolve --applied <migration-name>

# Or mark as rolled back
pnpm prisma migrate resolve --rolled-back <migration-name>

# 4. Try again
pnpm prisma migrate deploy
```

### Scenario 2: Application Errors After Migration

**If application has errors after successful migration:**

1. **Immediate Actions**
   ```bash
   # Enable maintenance mode
   export MAINTENANCE_MODE=true

   # Check logs
   tail -100 /var/log/golf-tournament/app.log

   # Check Sentry
   # Look for recent errors related to database queries
   ```

2. **Assess Severity**
   - **Critical** (site down): Immediate rollback
   - **High** (major feature broken): Rollback within 15 minutes
   - **Medium** (minor issues): Fix forward or rollback
   - **Low** (cosmetic): Fix forward

3. **Rollback Database** (if needed)
   ```bash
   # Stop application
   docker-compose stop app

   # Restore from backup
   pg_restore -d golf_tournament backup_pre_migration.dump

   # Verify restore
   psql -d golf_tournament -c "SELECT COUNT(*) FROM \"Tournament\""
   ```

4. **Rollback Application**
   ```bash
   # Deploy previous version
   git checkout v1.1.0
   ./deploy.sh

   # Or via platform
   vercel rollback
   ```

5. **Verify Rollback**
   ```bash
   curl https://yourdomain.com/api/health
   ./scripts/smoke-tests.sh
   ```

6. **Disable Maintenance Mode**
   ```bash
   unset MAINTENANCE_MODE
   ```

### Scenario 3: Partial Migration Success

**If migration partially succeeded (some tables updated, others failed):**

```bash
# 1. Assess current state
pnpm prisma migrate status

# 2. Check which migrations were applied
psql -d golf_tournament -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10"

# 3. Manually fix the database state
# Option A: Complete the migration manually
psql -d golf_tournament -f prisma/migrations/XXX/migration.sql

# Option B: Restore from backup and start over
pg_restore -d golf_tournament backup_pre_migration.dump

# 4. Reset migration state
pnpm prisma migrate resolve --rolled-back <migration-name>

# 5. Try migration again
pnpm prisma migrate deploy
```

---

## Post-Migration Verification

### 1. Database Health Checks

```sql
-- Check table counts
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Check for bloated tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;

-- Check query performance
SELECT
  calls,
  mean_exec_time,
  max_exec_time,
  query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 2. Application Health Checks

```bash
# Health endpoint
curl https://yourdomain.com/api/health

# Create tournament (test write)
curl -X POST https://yourdomain.com/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Tournament","format":"STABLEFORD","tournamentDate":"2025-12-31"}'

# Get tournaments (test read)
curl https://yourdomain.com/api/tournaments

# Check logs
tail -100 /var/log/golf-tournament/app.log | grep ERROR

# Check error rate in Sentry
# Should be < 1% of requests
```

### 3. Performance Checks

```bash
# Response time
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/tournaments

# Database query time
psql -d golf_tournament -c "SELECT mean_exec_time, query FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"

# Connection count
psql -d golf_tournament -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'golf_tournament'"
```

### 4. User Impact

- Monitor error rates (Sentry)
- Check support tickets
- Review user feedback
- Monitor social media mentions

---

## Troubleshooting

### Issue: Migration Hanging

**Symptoms:** Migration doesn't complete after 5+ minutes

**Causes:**
- Table locked by long-running query
- Large table rewrite
- Deadlock

**Solution:**

```sql
-- Find blocking queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Kill blocking query (use with caution!)
SELECT pg_terminate_backend(<blocking_pid>);
```

### Issue: Out of Disk Space

**Symptoms:** Migration fails with "no space left on device"

**Solution:**

```bash
# Check disk space
df -h

# Find large tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Clean up WAL files (if safe)
SELECT pg_switch_wal();

# Increase disk size (cloud provider)
# Then resize filesystem
resize2fs /dev/xvda1
```

### Issue: Constraint Violation

**Symptoms:** Migration fails with "violates foreign key constraint" or "violates check constraint"

**Solution:**

```sql
-- Identify violating rows
SELECT * FROM "Tournament"
WHERE "clubId" NOT IN (SELECT id FROM "Club");

-- Fix data
UPDATE "Tournament"
SET "clubId" = (SELECT id FROM "Club" LIMIT 1)
WHERE "clubId" NOT IN (SELECT id FROM "Club");

-- Or delete invalid rows
DELETE FROM "Tournament"
WHERE "clubId" NOT IN (SELECT id FROM "Club");

-- Retry migration
```

---

## Migration Best Practices

### 1. Always Test First

- Test on local database
- Test on staging environment
- Test with production-like data volume

### 2. Use Transactions

```sql
BEGIN;
  -- Your migration SQL
  ALTER TABLE "Tournament" ADD COLUMN "newField" TEXT;
  -- Verify
  SELECT * FROM "Tournament" LIMIT 1;
COMMIT;
-- Or ROLLBACK if something went wrong
```

### 3. Create Indexes Concurrently

```sql
-- Bad (locks table)
CREATE INDEX idx_tournament_date ON "Tournament"("tournamentDate");

-- Good (doesn't lock table)
CREATE INDEX CONCURRENTLY idx_tournament_date ON "Tournament"("tournamentDate");
```

### 4. Avoid Expensive Operations During Peak Hours

- Table rewrites
- Adding NOT NULL constraints
- Changing column types

### 5. Monitor Migration Progress

```sql
-- For long-running migrations
SELECT
  now() - query_start as runtime,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND query LIKE '%ALTER TABLE%';
```

### 6. Document Everything

- What changed
- Why it changed
- How to rollback
- Performance impact

---

## Emergency Contacts

- **On-Call DevOps:** [phone/pager]
- **Database Team:** [email/slack]
- **Engineering Lead:** [phone/email]
- **Incident Commander:** [phone/email]

---

## Related Runbooks

- [Backup and Restore](./backup-restore.md)
- [Rollback Procedure](./rollback-procedure.md)
- [Incident Response](./incident-response.md)

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Owner:** DevOps Team
