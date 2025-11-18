# Monitoring Guide

Comprehensive monitoring setup for the Golf Tournament Management System.

---

## Overview

**Monitoring Stack:**
- **Error Tracking:** Sentry
- **Uptime Monitoring:** UptimeRobot or Better Uptime
- **Application Metrics:** Custom metrics + CloudWatch/Vercel Analytics
- **Log Aggregation:** CloudWatch Logs or Papertrail
- **Dashboards:** Grafana or Platform-native (Vercel/Railway)

**Key Metrics:**
- Uptime: > 99.9%
- Error Rate: < 1%
- P95 Latency: < 500ms
- Database Response Time: < 100ms

---

## Error Tracking (Sentry)

### Setup

**1. Create Sentry Account**
- Sign up at [sentry.io](https://sentry.io)
- Create new project: "Golf Tournament Management"
- Platform: Next.js

**2. Install Sentry**
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**3. Configure Sentry**

`sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Ignore known errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured'
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive query params
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]')
    }
    return event
  }
})
```

`sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Capture unhandled rejections
  integrations: [
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ]
})
```

**4. Add Custom Context**
```typescript
// In your authentication middleware
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name
})

// In tournament endpoints
Sentry.setTag('tournament_id', tournament.id)
Sentry.setContext('tournament', {
  name: tournament.name,
  status: tournament.status,
  playerCount: tournament.players.length
})
```

**5. Environment Variables**
```env
# Client-side (public)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Server-side (private)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=golf-tournament
```

### Alert Rules

**Critical Errors (Immediate Notification):**
- New error type (first occurrence)
- Error rate > 10% for 5 minutes
- Any P0 tagged errors
- Database connection failures
- Payment processing errors

**High Priority (15 min delay):**
- Error rate > 5% for 15 minutes
- Same error occurring > 100 times/hour
- P95 latency > 1000ms

**Configure in Sentry:**
1. Go to Alerts → Create Alert Rule
2. Set conditions and thresholds
3. Add notification channels (email, Slack, PagerDuty)

### Sentry Dashboards

**Key Metrics to Monitor:**
- Total errors (last 24h)
- Error rate trend
- Most common errors
- Errors by endpoint
- Errors by user
- Errors by browser/device
- Release comparison

---

## Uptime Monitoring

### Option A: UptimeRobot (Free)

**Setup:**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTPS
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
   - Timeout: 30 seconds

**Monitors to Create:**
- Main site: `https://yourdomain.com`
- Health endpoint: `https://yourdomain.com/api/health`
- API endpoints: `https://yourdomain.com/api/tournaments`

**Alert Contacts:**
- Email: your-email@domain.com
- SMS: +1-xxx-xxx-xxxx
- Slack webhook: https://hooks.slack.com/services/xxx

### Option B: Better Uptime (Paid)

**Features:**
- Status page
- Incident management
- More check locations
- Better alerting

**Setup:**
1. Sign up at [betteruptime.com](https://betteruptime.com)
2. Create monitors (similar to UptimeRobot)
3. Set up escalation policies
4. Create public status page

---

## Application Metrics

### Health Check Endpoint

`app/api/health/route.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - startTime

    // Check external services (optional)
    const [stripeHealth, brevoHealth] = await Promise.all([
      checkStripe(),
      checkBrevo()
    ])

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      checks: {
        database: {
          status: 'healthy',
          responseTime: dbResponseTime
        },
        stripe: stripeHealth,
        brevo: brevoHealth
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

async function checkStripe() {
  try {
    await stripe.balance.retrieve()
    return { status: 'healthy' }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

async function checkBrevo() {
  try {
    // Lightweight API call
    await brevoClient.get('/account')
    return { status: 'healthy' }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

### Custom Metrics Endpoint

`app/api/metrics/route.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.METRICS_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Gather metrics
    const [
      activeTournaments,
      totalPlayers,
      scorecardsPending,
      activeConnections
    ] = await Promise.all([
      prisma.tournament.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.player.count(),
      prisma.scorecard.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()`
    ])

    // Prometheus format
    const metrics = `
# HELP golf_active_tournaments Number of active tournaments
# TYPE golf_active_tournaments gauge
golf_active_tournaments ${activeTournaments}

# HELP golf_total_players Total number of registered players
# TYPE golf_total_players gauge
golf_total_players ${totalPlayers}

# HELP golf_scorecards_pending Number of scorecards in progress
# TYPE golf_scorecards_pending gauge
golf_scorecards_pending ${scorecardsPending}

# HELP golf_db_connections Number of active database connections
# TYPE golf_db_connections gauge
golf_db_connections ${activeConnections[0].count}
    `.trim()

    return new NextResponse(metrics, {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    return new NextResponse('Error collecting metrics', { status: 500 })
  }
}
```

---

## Log Aggregation

### CloudWatch Logs (AWS)

**Setup:**
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

**Log Groups:**
- `/golf-tournament/application`
- `/golf-tournament/database`
- `/golf-tournament/nginx`

### Papertrail (Alternative)

**Setup:**
```bash
# Install remote_syslog2
wget https://github.com/papertrail/remote_syslog2/releases/download/v0.21/remote-syslog2_0.21_amd64.deb
sudo dpkg -i remote-syslog2_0.21_amd64.deb

# Configure
sudo vi /etc/log_files.yml
---
files:
  - /var/log/golf-tournament/*.log
destination:
  host: logs.papertrailapp.com
  port: XXXXX
  protocol: tls

# Start service
sudo service remote_syslog start
```

### Log Analysis Queries

**Common Queries:**

```bash
# Error rate by endpoint
grep ERROR app.log | awk '{print $6}' | sort | uniq -c | sort -rn

# Slow queries (>1s)
grep "duration.*[1-9][0-9][0-9][0-9]ms" app.log

# Failed authentication attempts
grep "authentication failed" app.log | wc -l

# Top users by request count
grep "/api/" app.log | awk '{print $8}' | sort | uniq -c | sort -rn | head -10
```

---

## Dashboards

### Grafana Setup

**1. Install Grafana**
```bash
# Docker
docker run -d \
  -p 3001:3000 \
  --name grafana \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana

# Or use Grafana Cloud (free tier)
```

**2. Add Data Sources**
- Prometheus (for metrics)
- CloudWatch (for AWS metrics)
- PostgreSQL (for database metrics)

**3. Create Dashboards**

**Application Dashboard:**
- Request rate (req/min)
- Error rate (%)
- P50/P95/P99 latency
- Active users
- Top endpoints by traffic

**Database Dashboard:**
- Connection count
- Query duration (avg, max)
- Slow queries (>1s)
- Cache hit rate
- Table sizes

**Business Metrics Dashboard:**
- Active tournaments
- Total players
- Scorecards submitted (today)
- Revenue (today, this month)
- New registrations

**Example Panel (Request Rate):**
```promql
# Prometheus query
rate(http_requests_total[5m])

# Or from custom metrics
golf_active_tournaments
```

### Pre-built Dashboards

**Import these Grafana dashboards:**
- PostgreSQL: Dashboard ID 9628
- Node.js: Dashboard ID 11159
- Nginx: Dashboard ID 12483

---

## Alert Configuration

### Alert Levels

**Critical (Page immediately):**
- Site down (health check fails 3 consecutive times)
- Error rate > 10%
- Database unreachable
- Payment processing failure

**High (Notify within 15 min):**
- Error rate > 5%
- P95 latency > 1000ms
- Disk usage > 90%
- Memory usage > 90%

**Medium (Notify within 1 hour):**
- Error rate > 2%
- P95 latency > 500ms
- Unusual traffic patterns

**Low (Daily digest):**
- Slow queries
- Deprecated API usage
- Certificate expiring (30 days)

### Alert Channels

**PagerDuty (Recommended for On-Call):**
```bash
# Integrate with PagerDuty
# Set up escalation policies
# Primary: On-call engineer
# Secondary: Engineering lead (after 15 min)
# Tertiary: Engineering manager (after 30 min)
```

**Slack Alerts:**
```bash
# Critical alerts: #alerts-critical
# High priority: #alerts-high
# Medium/Low: #alerts-general
```

**Email Alerts:**
- Send to on-call distribution list
- Include runbook links
- Clear action items

### Alert Template

```markdown
🚨 **[CRITICAL]** Database Connection Failure

**Service:** golf-tournament-prod
**Started:** 2025-01-15 14:23:45 UTC
**Duration:** 3 minutes

**Details:**
- Health check failed: 3/3 attempts
- Error: "Connection refused"
- Last successful check: 14:20:12 UTC

**Runbook:** docs/runbooks/incident-response.md#database-down

**Actions:**
1. Check database status
2. Verify network connectivity
3. Review recent changes

**Dashboard:** https://grafana.yourdomain.com/d/incident-123
```

---

## Performance Monitoring

### Key Performance Indicators (KPIs)

**Application:**
- Request rate: Target 1000 req/min
- Error rate: < 1%
- P50 latency: < 100ms
- P95 latency: < 500ms
- P99 latency: < 1000ms

**Database:**
- Query duration (avg): < 50ms
- Slow queries (>1s): < 10/hour
- Connection count: < 80% of max
- Cache hit rate: > 95%

**Infrastructure:**
- CPU usage: < 70%
- Memory usage: < 80%
- Disk usage: < 85%
- Network throughput: monitored

### Web Vitals Monitoring

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Add to Application:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## Database Monitoring

### PostgreSQL Metrics

**1. Connection Monitoring**
```sql
-- Current connections
SELECT count(*) as connections,
       state,
       wait_event_type
FROM pg_stat_activity
WHERE datname = 'golf_tournament'
GROUP BY state, wait_event_type;

-- Long-running queries
SELECT pid,
       now() - query_start as duration,
       state,
       query
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < now() - interval '1 minute'
ORDER BY duration DESC;
```

**2. Performance Metrics**
```sql
-- Slow queries
SELECT calls,
       mean_exec_time,
       max_exec_time,
       stddev_exec_time,
       query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table bloat
SELECT schemaname,
       tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       n_live_tup as rows,
       n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**3. Cache Hit Rate**
```sql
-- Should be > 95%
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
```

---

## Monitoring Best Practices

1. **Set Realistic Thresholds**
   - Based on historical data
   - Account for traffic patterns
   - Avoid alert fatigue

2. **Create Runbooks for Alerts**
   - Every alert should link to runbook
   - Include common causes
   - Document resolution steps

3. **Regular Review**
   - Weekly: Review alert frequency
   - Monthly: Adjust thresholds
   - Quarterly: Update runbooks

4. **Test Alerts**
   - Verify alert delivery
   - Test escalation policies
   - Practice incident response

5. **Monitor the Monitors**
   - Ensure monitoring is working
   - Check for missed alerts
   - Verify dashboard accuracy

---

## Monitoring Checklist

### Daily
- [ ] Check error rate (< 1%)
- [ ] Review critical alerts
- [ ] Check disk space
- [ ] Verify backups ran successfully

### Weekly
- [ ] Review slow queries
- [ ] Check database performance
- [ ] Review security alerts
- [ ] Update dashboards

### Monthly
- [ ] Review alert thresholds
- [ ] Update monitoring docs
- [ ] Test disaster recovery
- [ ] Audit user access

---

## Tools Summary

| Tool | Purpose | Cost | Setup Time |
|------|---------|------|------------|
| **Sentry** | Error tracking | Free tier (5K errors/mo) | 30 min |
| **UptimeRobot** | Uptime monitoring | Free (50 monitors) | 15 min |
| **Grafana** | Dashboards | Free (self-host) | 2 hours |
| **CloudWatch** | AWS metrics/logs | Pay per use | 1 hour |
| **Papertrail** | Log aggregation | Free tier (50MB/mo) | 30 min |
| **PagerDuty** | On-call management | $29/user/mo | 1 hour |

**Recommended Starter Stack (Free):**
- Sentry (errors)
- UptimeRobot (uptime)
- Vercel Analytics (performance)
- CloudWatch or Papertrail (logs)
- Grafana Cloud (dashboards)

**Total Cost:** $0-50/month

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Owner:** DevOps Team
