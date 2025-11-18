# Incident Response Runbook

Standard procedures for responding to production incidents.

---

## Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 - Critical** | Complete outage | Immediate | Site down, database unavailable, data loss |
| **P1 - High** | Major feature broken | < 15 min | Payment processing down, user registration broken |
| **P2 - Medium** | Feature degraded | < 1 hour | Slow performance, partial feature failure |
| **P3 - Low** | Minor issue | < 4 hours | UI bug, non-critical feature issue |
| **P4 - Informational** | No immediate impact | Next sprint | Feature request, minor improvements |

---

## Incident Response Process

### Phase 1: Detection & Alert (0-5 minutes)

**Automated Detection:**
- Monitoring alerts (Sentry, UptimeRobot)
- Health check failures
- Error rate spikes
- Performance degradation

**Manual Detection:**
- User reports
- Support tickets
- Social media
- Team member notice

**Actions:**
1. Acknowledge alert
2. Assess severity
3. Create incident ticket
4. Notify on-call team

### Phase 2: Investigation (5-15 minutes)

**Quick Checks:**

```bash
# Health endpoint
curl https://yourdomain.com/api/health

# Recent deployments
vercel list | head -5

# Error logs
tail -100 /var/log/golf-tournament/app.log

# Database connectivity
psql -h <host> -U postgres -d golf_tournament -c "SELECT 1"

# External services
curl https://api.stripe.com/v1/charges -H "Authorization: Bearer $STRIPE_KEY"
curl https://api.brevo.com/v3/account -H "api-key: $BREVO_KEY"
```

**Investigation Checklist:**
- [ ] When did it start?
- [ ] What changed recently? (deployments, config, etc.)
- [ ] Is it affecting all users or specific subset?
- [ ] What's the error rate?
- [ ] Are external services down?
- [ ] Is database accessible?

### Phase 3: Communication (15-30 minutes)

**Internal Communication:**

```markdown
🚨 **INCIDENT ALERT** - P[X]

**What:** [Brief description]
**Impact:** [Number of users affected]
**Started:** [Time]
**Status:** Investigating

**Team:**
- Incident Commander: [Name]
- Tech Lead: [Name]
- Communications: [Name]

**War Room:** [Zoom/Slack link]
```

**External Communication (Status Page):**

```markdown
**[INVESTIGATING]**
We're currently investigating an issue with [service].
Some users may experience [impact].
We'll provide an update within 15 minutes.

Updated: [Timestamp]
```

### Phase 4: Mitigation (30-60 minutes)

**Quick Wins:**
1. **Rollback** (if deployment-related)
2. **Scale up** (if resource-constrained)
3. **Restart services** (if memory leak/hanging)
4. **Failover** (if hardware/region failure)
5. **Enable degraded mode** (if external service down)

**Example: Service Degradation**

```bash
# Enable maintenance mode
curl -X POST https://yourdomain.com/api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled":true,"message":"Experiencing technical difficulties"}'

# Scale up ECS tasks
aws ecs update-service \
  --cluster golf-tournament-prod \
  --service golf-tournament-service \
  --desired-count 10

# Clear cache
redis-cli FLUSHALL

# Restart application
docker-compose restart app
```

### Phase 5: Resolution (1-2 hours)

**Verify Fix:**
- Health checks passing
- Error rate back to normal
- User flows working
- Smoke tests passing
- Monitoring stable for 15+ minutes

**Re-enable Services:**
```bash
# Disable maintenance mode
curl -X POST https://yourdomain.com/api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled":false}'

# Scale back to normal
aws ecs update-service \
  --cluster golf-tournament-prod \
  --service golf-tournament-service \
  --desired-count 2
```

**Update Communications:**

```markdown
**[RESOLVED]**
The issue has been resolved. All systems are operational.

**Summary:**
- Started: [Time]
- Resolved: [Time]
- Duration: [X] minutes
- Impact: [Brief description]

We're conducting a post-mortem and will share findings.
```

### Phase 6: Post-Mortem (24-48 hours later)

**Template:** See [Post-Mortem Template](#post-mortem-template)

---

## Common Incident Scenarios

### Scenario 1: Complete Site Outage

**Symptoms:**
- Health check fails
- Users cannot access site
- Error rate: 100%

**Quick Diagnostics:**

```bash
# Check if site is accessible
curl -I https://yourdomain.com

# Check DNS resolution
dig yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check load balancer
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check application containers
docker-compose ps
```

**Common Causes:**
1. **Deployment failure** → Rollback
2. **Database down** → Restart database
3. **SSL expired** → Renew certificate
4. **DNS misconfiguration** → Fix DNS records
5. **DDoS attack** → Enable CloudFlare protection

### Scenario 2: Database Connection Pool Exhausted

**Symptoms:**
- Intermittent errors
- "Too many connections" errors
- Slow response times

**Quick Fix:**

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'golf_tournament';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'golf_tournament'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';

-- Adjust connection pool
-- Update DATABASE_URL to limit connections
-- postgresql://user:pass@host:5432/db?connection_limit=20
```

**Long-term Fix:**
- Implement PgBouncer
- Increase max_connections in PostgreSQL
- Optimize application queries

### Scenario 3: High Error Rate

**Symptoms:**
- Error rate > 5%
- Sentry alerts
- User complaints

**Investigation:**

```bash
# Check Sentry
# Group errors by type
# Identify pattern

# Check logs
tail -1000 /var/log/golf-tournament/app.log | grep ERROR

# Check specific error
grep "Cannot read property" /var/log/golf-tournament/app.log | head -20
```

**Common Causes:**
1. **Deployment bug** → Rollback
2. **External service down** → Enable fallback
3. **Rate limiting** → Increase limits or add backoff
4. **Database query timeout** → Optimize query

### Scenario 4: Slow Performance

**Symptoms:**
- P95 latency > 1000ms
- User complaints about slowness
- Timeout errors

**Quick Diagnostics:**

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Check database queries
psql -d golf_tournament -c "
  SELECT calls, mean_exec_time, query
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10
"

# Check server resources
top -bn1 | head -20
df -h
free -m

# Check cache hit rate
redis-cli INFO stats | grep keyspace
```

**Quick Fixes:**
- Restart application (clear memory)
- Scale up resources
- Clear cache
- Kill slow queries

### Scenario 5: Payment Processing Failure

**Symptoms:**
- Users cannot complete payments
- Stripe webhook failures
- Payment confirmation emails not sent

**Investigation:**

```bash
# Check Stripe status
curl https://status.stripe.com/

# Check webhook logs
curl https://dashboard.stripe.com/webhooks

# Check application logs
grep "stripe" /var/log/golf-tournament/app.log | tail -50

# Test Stripe connection
curl https://api.stripe.com/v1/charges \
  -u $STRIPE_SECRET_KEY:
```

**Resolution:**
1. Verify Stripe API keys
2. Check webhook signature validation
3. Verify webhook endpoint accessible
4. Retry failed webhooks manually

### Scenario 6: Email Delivery Failure

**Symptoms:**
- Users not receiving emails
- Brevo API errors
- Email bounce rate spike

**Investigation:**

```bash
# Check Brevo status
curl https://status.brevo.com/

# Check API connectivity
curl -X GET https://api.brevo.com/v3/account \
  -H "api-key: $BREVO_API_KEY"

# Check recent emails
curl -X GET "https://api.brevo.com/v3/smtp/emails?limit=10" \
  -H "api-key: $BREVO_API_KEY"

# Check logs
grep "brevo\|email" /var/log/golf-tournament/app.log | tail -50
```

**Common Causes:**
1. **API key expired** → Rotate key
2. **Rate limit exceeded** → Upgrade plan or reduce send rate
3. **Domain not verified** → Verify domain
4. **Bounced emails** → Clean email list

---

## Incident Communication Guidelines

### Internal Communication

**War Room Protocol:**
- Single Slack channel per incident
- Clear roles assigned (Commander, Tech Lead, Comms)
- Regular updates every 15 minutes
- No speculation, only facts
- Keep stakeholders informed

**Update Template:**
```markdown
**Status Update [HH:MM]**
- What we know: [Facts]
- What we're doing: [Actions]
- Next update: [Time]
- ETA to resolution: [Estimate]
```

### External Communication

**Status Page Updates:**
- Update within 15 minutes of detection
- Updates every 30 minutes minimum
- Clear, non-technical language
- Set expectations

**Social Media:**
- Acknowledge issue quickly
- Direct users to status page
- Show empathy
- Thank users for patience

**Email to Affected Users (Post-Resolution):**
```markdown
Subject: Service Disruption - [Date]

Dear [Name],

We experienced a service disruption today that may have affected your use of our platform.

What happened:
- [Non-technical explanation]
- Duration: [X] minutes
- Impact: [What didn't work]

What we're doing:
- [Actions taken]
- [Prevention measures]

We apologize for any inconvenience. If you have questions, please contact support@yourdomain.com.

Thank you for your patience and understanding.
```

---

## Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** [Date]
**Authors:** [Names]
**Status:** [Draft / Under Review / Final]

## Executive Summary
[2-3 sentence summary of what happened and impact]

## Impact
- **Duration:** [Start time] to [End time] ([X] minutes)
- **Users Affected:** [Number or percentage]
- **Revenue Impact:** $[Amount] (if applicable)
- **Severity:** P[X]

## Timeline
All times in [Timezone]

| Time | Event |
|------|-------|
| HH:MM | First alert / user report |
| HH:MM | Incident declared |
| HH:MM | Team assembled |
| HH:MM | Root cause identified |
| HH:MM | Mitigation started |
| HH:MM | Service restored |
| HH:MM | Incident closed |

## Root Cause
[Detailed technical explanation of what went wrong]

### Contributing Factors
1. [Factor 1]
2. [Factor 2]

## Resolution
[What was done to fix the issue]

## Detection
- **How detected:** [Monitoring / User report / Other]
- **Time to detect:** [X] minutes
- **Could we detect faster:** [Yes/No - How?]

## Response Evaluation
### What Went Well
1. [Item 1]
2. [Item 2]

### What Could Be Improved
1. [Item 1]
2. [Item 2]

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| [Action 1] | [Name] | [Date] | High |
| [Action 2] | [Name] | [Date] | Medium |

## Lessons Learned
1. [Lesson 1]
2. [Lesson 2]

## Appendix
- Relevant logs
- Screenshots
- Related tickets
```

---

## Incident Metrics to Track

- **MTTD** (Mean Time To Detect): Time from incident start to detection
- **MTTA** (Mean Time To Acknowledge): Time from detection to acknowledgment
- **MTTR** (Mean Time To Resolve): Time from detection to resolution
- **Incident Frequency**: Number of incidents per month
- **Severity Distribution**: P0/P1/P2/P3 breakdown

**Target Metrics:**
- MTTD: < 5 minutes
- MTTA: < 2 minutes
- MTTR: < 30 minutes (P0), < 1 hour (P1)
- P0/P1 incidents: < 2 per month

---

## Tools and Resources

### Monitoring Tools
- **Sentry:** Error tracking
- **UptimeRobot:** Uptime monitoring
- **CloudWatch:** AWS metrics
- **Grafana:** Dashboards

### Communication Tools
- **Status Page:** [URL]
- **Incident Channel:** #incidents
- **War Room:** [Zoom link]
- **On-Call Schedule:** [PagerDuty/OpsGenie]

### Runbooks
- [Database Migration](./database-migration.md)
- [Rollback Procedure](./rollback-procedure.md)
- [Backup and Restore](./backup-restore.md)

---

## Emergency Contacts

| Role | Name | Phone | Email | Escalation |
|------|------|-------|-------|------------|
| On-Call Engineer | [Name] | [Phone] | [Email] | Primary |
| DevOps Lead | [Name] | [Phone] | [Email] | Secondary |
| Engineering Manager | [Name] | [Phone] | [Email] | Escalation |
| CTO | [Name] | [Phone] | [Email] | Final |

### External Contacts
- **AWS Support:** [Account #] - [Phone]
- **Stripe Support:** support@stripe.com
- **Brevo Support:** support@brevo.com

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Owner:** DevOps Team
