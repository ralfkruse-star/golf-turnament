# Application Rollback Procedure

Step-by-step guide for rolling back application deployments.

---

## Overview

This runbook covers:
- When to rollback
- Pre-rollback checklist
- Platform-specific rollback procedures
- Post-rollback verification
- Root cause analysis

**Audience:** DevOps, SRE, Engineering Team

**SLA:** Rollback should complete within 15 minutes of decision

---

## When to Rollback

### Rollback Triggers

**Automatic Rollback:**
- Health check fails for 5+ consecutive checks
- Error rate > 10% for 5 minutes
- P95 latency > 5000ms for 5 minutes
- Database connection failures > 50%

**Manual Rollback Decision:**
- Critical feature completely broken
- Data corruption detected
- Security vulnerability introduced
- Performance degradation > 50%
- User-reported critical issues

### Rollback Decision Matrix

| Severity | Impact | Action | Timeline |
|----------|--------|--------|----------|
| P0 - Critical | Site down | Immediate rollback | < 5 minutes |
| P1 - High | Major feature broken | Rollback recommended | < 15 minutes |
| P2 - Medium | Minor feature broken | Fix forward or rollback | < 1 hour |
| P3 - Low | Cosmetic issues | Fix forward | Next deployment |

---

## Pre-Rollback Checklist

- [ ] **Confirm the issue is deployment-related**
  - Check deployment timeline vs error spike
  - Review recent changes
  - Verify it wasn't a pre-existing issue

- [ ] **Identify target version**
  - Last known good version
  - Check production tag/commit
  - Verify version is available

- [ ] **Notify team**
  - Post in incident channel
  - Tag on-call engineer
  - Update status page

- [ ] **Document decision**
  - Why rolling back
  - Expected impact
  - Alternative solutions considered

---

## Rollback Procedures by Platform

### Vercel Rollback

**Method 1: Dashboard**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select project "golf-tournament"
3. Go to "Deployments" tab
4. Find last known good deployment
5. Click three dots → "Promote to Production"
6. Confirm rollback

**Time:** 2-3 minutes

**Method 2: CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# List recent deployments
vercel list

# Rollback to specific deployment
vercel alias set <deployment-url> yourdomain.com

# Or use rollback command
vercel rollback
```

**Time:** 1-2 minutes

**Verification:**

```bash
# Check deployment
curl -I https://yourdomain.com

# Check version (if you have version header)
curl -I https://yourdomain.com | grep X-Version

# Check health
curl https://yourdomain.com/api/health
```

### Railway Rollback

**Method 1: Dashboard**

1. Go to [railway.app](https://railway.app)
2. Select project
3. Click "Deployments"
4. Find last good deployment
5. Click "Redeploy"

**Method 2: CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# List deployments
railway status

# Rollback
railway rollback
```

**Method 3: Git Revert**

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Railway auto-deploys
# Wait 2-3 minutes for build
```

**Time:** 3-5 minutes

### AWS ECS Rollback

**Method 1: Task Definition Rollback**

```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix golf-tournament-prod \
  --sort DESC

# Get current service
aws ecs describe-services \
  --cluster golf-tournament-prod \
  --services golf-tournament-service

# Update service to previous task definition
aws ecs update-service \
  --cluster golf-tournament-prod \
  --service golf-tournament-service \
  --task-definition golf-tournament-prod:5

# Wait for deployment
aws ecs wait services-stable \
  --cluster golf-tournament-prod \
  --services golf-tournament-service
```

**Time:** 5-10 minutes

**Method 2: Container Image Rollback**

```bash
# Re-tag and push previous image
docker tag golf-tournament:v1.5.0 <ecr-url>:latest
docker push <ecr-url>:latest

# Force new deployment
aws ecs update-service \
  --cluster golf-tournament-prod \
  --service golf-tournament-service \
  --force-new-deployment
```

**Time:** 5-10 minutes

### DigitalOcean App Platform Rollback

**Dashboard:**

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Select app
3. Click "Deployments"
4. Find last good deployment
5. Click "Rollback to this deployment"

**CLI:**

```bash
# List deployments
doctl apps list-deployments <app-id>

# Rollback
doctl apps create-deployment <app-id> \
  --deployment-id <previous-deployment-id>
```

**Time:** 3-5 minutes

### Docker Compose Rollback

**Using Git Tags:**

```bash
# SSH to server
ssh production-server

# Navigate to app directory
cd /opt/golf-tournament

# Check current version
git describe --tags

# Fetch all tags
git fetch --tags

# Checkout previous version
git checkout v1.5.0

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost/api/health
```

**Time:** 5-10 minutes

**Using Image Tags:**

```bash
# Update docker-compose.yml to use previous image
sed -i 's/golf-tournament:v1.6.0/golf-tournament:v1.5.0/' docker-compose.yml

# Pull previous image
docker-compose pull

# Restart services
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost/api/health
```

**Time:** 3-5 minutes

---

## Database Rollback

### Scenario 1: Schema Changes in Deployment

**If deployment includes database migrations:**

```bash
# Check migration status
pnpm prisma migrate status

# If migration was applied, need to:
# 1. Rollback application first
# 2. Then rollback database (see database-migration runbook)

# Restore from backup
pg_restore -d golf_tournament backup_pre_migration.dump

# Or manually revert migration
psql -d golf_tournament -f prisma/migrations/XXX/down.sql
```

### Scenario 2: No Schema Changes

If no schema changes, application rollback is sufficient.

---

## Post-Rollback Verification

### 1. Immediate Checks (0-5 minutes)

```bash
# Health check
curl https://yourdomain.com/api/health
# Expected: {"status":"ok","database":"connected"}

# Version check
curl https://yourdomain.com/api/version
# Verify version is correct

# Error rate check
# Open Sentry dashboard
# Verify error rate has dropped

# Response time check
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
```

### 2. Smoke Tests (5-10 minutes)

```bash
# Run automated smoke tests
./scripts/smoke-tests.sh

# Or manual tests:
# 1. Login
# 2. Create tournament
# 3. Register player
# 4. Submit scorecard
# 5. View leaderboard
```

### 3. Monitoring (10-30 minutes)

- **Sentry:** Monitor for new errors
- **Logs:** Check for unusual patterns
- **Metrics:**
  - Request rate back to normal
  - Error rate < 1%
  - P95 latency < 500ms
- **Database:**
  - Connection count normal
  - Query performance stable

### 4. User Verification (30+ minutes)

- Monitor support channels
- Check social media
- Review user feedback
- Test critical user flows

---

## Communication

### During Rollback

**Status Page Update:**
```
[INVESTIGATING] We're experiencing issues with our latest deployment.
We're rolling back to the previous version. Expected resolution: 15 minutes.
```

**Team Channel:**
```
@here Rolling back deployment due to [reason]
Target version: v1.5.0
ETA: 5 minutes
Will update when complete
```

### After Rollback

**Status Page Update:**
```
[RESOLVED] Rollback complete. All systems operational.
We're investigating the root cause and will deploy a fix soon.
```

**Team Channel:**
```
Rollback complete ✅
Version: v1.5.0
Health check: PASS
Smoke tests: PASS
Error rate: Back to normal

Next steps:
1. Root cause analysis
2. Fix and test
3. Redeploy when ready
```

**Post-Mortem Email:**
```
Subject: Post-Mortem: Rollback on [DATE]

What happened:
- [Description of issue]
- [Impact on users]

Timeline:
- XX:XX - Deployment started
- XX:XX - Issues detected
- XX:XX - Rollback decision made
- XX:XX - Rollback complete

Root cause:
- [Technical details]

Prevention:
- [Action items]

Thanks to [team members] for quick response.
```

---

## Root Cause Analysis

### Immediate Analysis (< 1 hour after rollback)

1. **Compare Deployments**
   ```bash
   git diff v1.5.0 v1.6.0
   ```

2. **Review Changes**
   - Code changes
   - Dependency updates
   - Configuration changes
   - Database migrations

3. **Check Logs**
   - Application logs
   - Database logs
   - Load balancer logs
   - Error tracking (Sentry)

4. **Identify Root Cause**
   - What broke?
   - Why did it break?
   - Why didn't we catch it earlier?

### Post-Mortem (24-48 hours after rollback)

**Template:**

```markdown
# Post-Mortem: Production Rollback - [DATE]

## Summary
[One-paragraph summary of what happened]

## Impact
- Duration: XX minutes
- Affected users: XX%
- Error rate: XX%
- Revenue impact: $XX

## Timeline
- HH:MM - Deployment started
- HH:MM - First error detected
- HH:MM - Alerts triggered
- HH:MM - Rollback decision
- HH:MM - Rollback complete
- HH:MM - Full recovery

## Root Cause
[Detailed technical explanation]

## Detection
- How we detected: [Alert/User report/Monitoring]
- Time to detect: XX minutes
- Could we detect faster? [Yes/No - how?]

## Response
- Time to rollback decision: XX minutes
- Time to complete rollback: XX minutes
- What went well?
- What could be improved?

## Prevention
1. [Action item 1] - Owner: [Name] - Due: [Date]
2. [Action item 2] - Owner: [Name] - Due: [Date]
3. [Action item 3] - Owner: [Name] - Due: [Date]

## Lessons Learned
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]
```

---

## Rollback Checklist Summary

### Before Rollback
- [ ] Confirm issue is deployment-related
- [ ] Identify target version
- [ ] Notify team and stakeholders
- [ ] Document decision

### During Rollback
- [ ] Execute platform-specific rollback
- [ ] Update status page
- [ ] Monitor rollback progress

### After Rollback
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor metrics (30 min)
- [ ] Update communications
- [ ] Schedule post-mortem

### Follow-up
- [ ] Conduct root cause analysis
- [ ] Document findings
- [ ] Create action items
- [ ] Update runbooks if needed
- [ ] Plan redeployment

---

## Common Issues and Solutions

### Issue: Rollback Doesn't Fix the Problem

**Possible causes:**
- Issue was pre-existing
- Database state changed
- External service failure
- Infrastructure issue

**Solution:**
- Check database state
- Review external service status
- Check infrastructure metrics
- May need deeper investigation

### Issue: Can't Find Previous Version

**Solution:**
```bash
# Check git tags
git tag -l

# Check Docker registry
docker images

# Check platform deployments
vercel list
railway deployments

# If lost, deploy from known good commit
git checkout <commit-hash>
./deploy.sh
```

### Issue: Database Schema Incompatible

**Solution:**
- Can't rollback app without rolling back database
- Follow database-migration runbook
- May need to apply compatibility migrations
- Consider emergency hotfix instead

---

## Emergency Contacts

- **On-Call Engineer:** [phone/pager]
- **DevOps Lead:** [phone/email]
- **Engineering Manager:** [phone/email]
- **Incident Commander:** [phone/email]

---

## Related Runbooks

- [Database Migration](./database-migration.md)
- [Backup and Restore](./backup-restore.md)
- [Incident Response](./incident-response.md)

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Owner:** DevOps Team
