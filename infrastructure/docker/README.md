# Docker Production Deployment

Complete production-ready Docker Compose setup for the Golf Tournament Management System.

## Features

- ✅ Next.js application with auto-restart
- ✅ PostgreSQL 16 with optimized configuration
- ✅ PgBouncer connection pooling
- ✅ Redis caching
- ✅ Nginx reverse proxy with SSL
- ✅ Automated backups to S3
- ✅ Cron jobs for scheduled tasks
- ✅ Prometheus + Grafana monitoring
- ✅ Health checks for all services
- ✅ Resource limits and logging

## Quick Start

### 1. Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

### 2. Build Application Image

```bash
# From project root
docker build -t golf-tournament:latest .
```

### 3. Create Environment File

```bash
cd infrastructure/docker
cp .env.example .env
# Edit .env with your values
```

### 4. Create Required Directories

```bash
mkdir -p nginx/ssl
mkdir -p postgres
mkdir -p backup
mkdir -p cron
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
```

### 5. Deploy

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 6. Run Migrations

```bash
docker-compose -f docker-compose.production.yml exec app pnpm prisma migrate deploy
```

### 7. Verify

```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Check application health
curl http://localhost/api/health
```

## Configuration Files

### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;

    upstream app {
        server app:3000;
        keepalive 32;
    }

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com *.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Proxy settings
        location / {
            limit_req zone=general burst=20 nodelay;

            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=5 nodelay;

            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files caching
        location /_next/static/ {
            proxy_pass http://app;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### PostgreSQL Configuration

Create `postgres/postgresql.conf`:

```conf
# Connection Settings
max_connections = 200
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Query Tuning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Performance
shared_preload_libraries = 'pg_stat_statements'
```

Create `postgres/init-db.sh`:

```bash
#!/bin/bash
set -e

# Create application user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create app user
    CREATE USER app_user WITH PASSWORD '${DB_APP_PASSWORD}';

    -- Grant permissions
    GRANT CONNECT ON DATABASE golf_tournament TO app_user;
    GRANT USAGE ON SCHEMA public TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

    -- Set default privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

    -- Install extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
EOSQL

echo "Database initialized successfully"
```

### Backup Script

Create `backup/backup.sh`:

```bash
#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/golf_tournament_${TIMESTAMP}.dump"

echo "Starting backup at ${TIMESTAMP}"

# Create backup
pg_dump -Fc -f "${BACKUP_FILE}"

# Compress
gzip "${BACKUP_FILE}"

# Upload to S3
if [ -n "$S3_BUCKET" ]; then
    aws s3 cp "${BACKUP_FILE}.gz" "s3://${S3_BUCKET}/daily/"
    echo "Backup uploaded to S3"
fi

# Clean up old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "*.dump.gz" -mtime +${BACKUP_KEEP_DAYS} -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Create `backup/restore.sh`:

```bash
#!/bin/sh
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: restore.sh <backup-file>"
    exit 1
fi

echo "Restoring from ${BACKUP_FILE}"

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "${BACKUP_FILE}" | pg_restore -d "${PGDATABASE}" -c --if-exists
else
    pg_restore -d "${PGDATABASE}" -c --if-exists "${BACKUP_FILE}"
fi

echo "Restore completed"
```

### Cron Jobs

Create `cron/crontab`:

```cron
# Notification reminders (every 15 minutes)
*/15 * * * * curl -X POST -H "Authorization: Bearer ${CRON_SECRET}" ${APP_URL}/api/cron/notifications

# Cleanup tasks (daily at 2 AM)
0 2 * * * curl -X POST -H "Authorization: Bearer ${CRON_SECRET}" ${APP_URL}/api/cron/cleanup
```

### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'golf-tournament-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'
```

## Management Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f app
```

### Restart Service

```bash
docker-compose -f docker-compose.production.yml restart app
```

### Scale Application

```bash
# Run 3 instances of app
docker-compose -f docker-compose.production.yml up -d --scale app=3
```

### Execute Commands

```bash
# Open shell in app container
docker-compose -f docker-compose.production.yml exec app sh

# Run Prisma Studio
docker-compose -f docker-compose.production.yml exec app pnpm prisma studio

# Run database migrations
docker-compose -f docker-compose.production.yml exec app pnpm prisma migrate deploy
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d golf_tournament

# Create backup
docker-compose -f docker-compose.production.yml exec backup /backup.sh

# Restore backup
docker-compose -f docker-compose.production.yml exec backup /restore.sh /backups/golf_tournament_20250115_020000.dump.gz
```

### Monitoring

```bash
# View Prometheus metrics
open http://localhost:9090

# View Grafana dashboards
open http://localhost:3001
# Default credentials: admin / admin (set in .env)
```

## Updating

```bash
# 1. Build new image
docker build -t golf-tournament:latest .

# 2. Pull new image (if using registry)
docker pull your-registry/golf-tournament:latest

# 3. Update services
docker-compose -f docker-compose.production.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.production.yml exec app pnpm prisma migrate deploy
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs app

# Check environment variables
docker-compose -f docker-compose.production.yml exec app env

# Verify database connection
docker-compose -f docker-compose.production.yml exec app pnpm prisma db pull
```

### Database connection issues

```bash
# Check if database is running
docker-compose -f docker-compose.production.yml ps db

# Check database logs
docker-compose -f docker-compose.production.yml logs db

# Test connection
docker-compose -f docker-compose.production.yml exec db psql -U postgres -c "SELECT 1"
```

### High memory usage

```bash
# Check resource usage
docker stats

# Restart services
docker-compose -f docker-compose.production.yml restart
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use SSL certificates (Let's Encrypt recommended)
- [ ] Configure firewall (only expose ports 80, 443)
- [ ] Set up regular backups
- [ ] Enable monitoring and alerts
- [ ] Review and update security headers in Nginx
- [ ] Use secrets management for sensitive data
- [ ] Enable rate limiting
- [ ] Keep Docker and images updated

## Performance Tuning

### Optimize PostgreSQL

Edit `postgres/postgresql.conf` based on your server:

```conf
# For 4 GB RAM
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB
```

### Optimize Nginx

```nginx
# Increase worker processes
worker_processes 4;

# Tune worker connections
worker_connections 2048;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### Scale Application

```bash
# Run multiple app instances behind nginx
docker-compose -f docker-compose.production.yml up -d --scale app=4
```

## Cost Estimation

**Server Requirements:**
- **Small** (100-1000 users): 2 vCPU, 4 GB RAM - ~$20-40/month
- **Medium** (1000-10000 users): 4 vCPU, 8 GB RAM - ~$40-80/month
- **Large** (10000+ users): 8 vCPU, 16 GB RAM - ~$80-160/month

**Additional Costs:**
- Storage: ~$0.10/GB/month
- Bandwidth: ~$0.05-0.10/GB
- Backups: ~$0.023/GB/month (S3 Standard-IA)

## Support

- Documentation: [/docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)
- Troubleshooting: [/docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md)
- Issues: GitHub Issues
