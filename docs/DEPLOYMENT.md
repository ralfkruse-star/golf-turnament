# Production Deployment Guide

Complete guide for deploying the Golf Tournament Management System to production.

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Architecture Overview](#architecture-overview)
4. [Deployment Options Comparison](#deployment-options-comparison)
5. [Pre-Deployment Checklist](#pre-deployment-checklist)
6. [Platform-Specific Guides](#platform-specific-guides)
   - [Vercel Deployment](#vercel-deployment)
   - [Railway Deployment](#railway-deployment)
   - [AWS Deployment](#aws-deployment)
   - [DigitalOcean Deployment](#digitalocean-deployment)
7. [Database Setup](#database-setup)
8. [Environment Variables Guide](#environment-variables-guide)
9. [External Services Setup](#external-services-setup)
10. [DNS & Domain Setup](#dns--domain-setup)
11. [Cron Jobs Setup](#cron-jobs-setup)
12. [Monitoring & Logging](#monitoring--logging)
13. [Security Hardening](#security-hardening)
14. [Performance Optimization](#performance-optimization)
15. [Backup & Disaster Recovery](#backup--disaster-recovery)
16. [Scaling Strategy](#scaling-strategy)
17. [Post-Deployment](#post-deployment)

---

## Introduction

The Golf Tournament Management System is a Next.js 14 application designed for production deployment with enterprise-grade reliability, security, and performance.

### Key Features

- **Multi-Club Support**: Subdomain-based multi-tenancy (club1.yourdomain.com, club2.yourdomain.com)
- **Real-Time Updates**: Server-Sent Events (SSE) for live leaderboards
- **PWA Support**: Progressive Web App with offline capabilities
- **Push Notifications**: Web push notifications for tournament updates
- **Payment Processing**: Stripe integration for subscriptions and payments
- **Email Service**: Brevo (Sendinblue) for transactional and marketing emails
- **Photo Management**: Tournament photo galleries with S3-compatible storage
- **Analytics**: Comprehensive analytics dashboard

### System Requirements

**Minimum Requirements:**
- **Node.js**: 20.0.0 or higher
- **Package Manager**: pnpm 9.0.0 or higher
- **Database**: PostgreSQL 16.0 or higher
- **Memory**: 512 MB RAM minimum (2 GB recommended)
- **CPU**: 1 vCPU minimum (2 vCPU recommended)
- **Storage**: 10 GB minimum (50 GB recommended for photos)

**Recommended Production Requirements:**
- **Node.js**: 20.x LTS
- **PostgreSQL**: 16.x with connection pooling (PgBouncer)
- **Memory**: 4 GB RAM
- **CPU**: 4 vCPU
- **Storage**: 100 GB SSD
- **Bandwidth**: Unmetered or 1 TB/month minimum

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CDN / CloudFlare                      │
│                    (Static Assets, Images)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer / Ingress                  │
│              (SSL Termination, DDoS Protection)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                  (Multiple Instances)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Instance 1  │  │  Instance 2  │  │  Instance N  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   PostgreSQL     │  │  Redis Cache     │  │  S3 Storage  │
│   (Primary +     │  │  (Optional)      │  │  (Photos)    │
│    Replica)      │  │                  │  │              │
└──────────────────┘  └──────────────────┘  └──────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  • Stripe (Payments)                                         │
│  • Brevo (Emails)                                           │
│  • Sentry (Error Tracking)                                  │
│  • Uptime Monitoring                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Options Comparison

| Feature | Vercel | Railway | AWS (ECS) | DigitalOcean |
|---------|--------|---------|-----------|--------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Cost (Small)** | $20/mo | $5-20/mo | $30-50/mo | $12-25/mo |
| **Cost (Medium)** | $150/mo | $50-100/mo | $100-200/mo | $50-100/mo |
| **Cost (Large)** | $400+/mo | $200+/mo | $300+/mo | $150+/mo |
| **Auto-Scaling** | ✅ Built-in | ✅ Limited | ✅ Full control | ⚠️ Manual |
| **Serverless** | ✅ Yes | ❌ No | ⚠️ Optional | ❌ No |
| **Database** | ⚠️ External | ✅ Built-in | ✅ RDS | ✅ Managed |
| **Cron Jobs** | ✅ Native | ✅ Native | ⚠️ EventBridge | ⚠️ External |
| **Custom Domain** | ✅ Easy | ✅ Easy | ✅ Route53 | ✅ Easy |
| **SSL** | ✅ Auto | ✅ Auto | ✅ ACM | ✅ Auto |
| **Monitoring** | ⚠️ Basic | ⚠️ Basic | ✅ CloudWatch | ⚠️ Basic |
| **Best For** | Startups | Small Teams | Enterprise | Mid-size |

**Recommendation:**
- **Start with Vercel or Railway** for quick deployment and easy management
- **Migrate to AWS or DigitalOcean** when you need more control or cost optimization
- **Use AWS** if you need enterprise features (VPC, compliance, advanced monitoring)

---

## Pre-Deployment Checklist

### Essential Tasks

- [ ] **Environment Variables**: All required variables configured
- [ ] **Database**: PostgreSQL 16+ provisioned and accessible
- [ ] **Stripe Account**: Created and configured with products/prices
- [ ] **Brevo Account**: Created with API key and email templates
- [ ] **Domain**: Registered and DNS accessible
- [ ] **SSL Certificates**: Auto-provisioning enabled or certificates ready
- [ ] **Backup Strategy**: Automated backups configured
- [ ] **Monitoring**: Error tracking and uptime monitoring setup

### Security Tasks

- [ ] **Secrets**: Generated secure random values for all secrets
- [ ] **VAPID Keys**: Generated for push notifications
- [ ] **Rate Limiting**: Configured to prevent abuse
- [ ] **CORS**: Configured for your domains only
- [ ] **CSP Headers**: Content Security Policy configured
- [ ] **Firewall**: Database not publicly accessible
- [ ] **DDoS Protection**: CloudFlare or equivalent enabled

### Performance Tasks

- [ ] **CDN**: Configured for static assets
- [ ] **Image Optimization**: Next.js image optimization enabled
- [ ] **Database Indexes**: Verified on production schema
- [ ] **Connection Pooling**: PgBouncer or equivalent configured
- [ ] **Caching**: Redis or equivalent (optional but recommended)

### Testing Tasks

- [ ] **Build**: Production build completes successfully
- [ ] **Migrations**: Database migrations tested
- [ ] **Smoke Tests**: Critical paths tested
- [ ] **Load Testing**: Performance under expected load verified
- [ ] **Email**: Test emails delivered successfully
- [ ] **Payments**: Test payment flow works (Stripe test mode)
- [ ] **Push Notifications**: Test notifications delivered

---

## Platform-Specific Guides

### Vercel Deployment

Vercel is the easiest and fastest way to deploy Next.js applications.

#### Step 1: Prerequisites

1. Create a [Vercel account](https://vercel.com/signup)
2. Install Vercel CLI (optional):
   ```bash
   pnpm add -g vercel
   ```

#### Step 2: Database Setup

Vercel doesn't include a database, so you'll need an external PostgreSQL provider:

**Option A: Neon (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string (includes pooler connection)
4. Example: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

**Option B: Supabase**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy connection string (use pooler for production)
5. Example: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?pgbouncer=true`

**Option C: Railway**
1. Create account at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Copy `DATABASE_URL` from variables tab

#### Step 3: Deploy via Git

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `pnpm build`
     - Output Directory: `.next`
     - Install Command: `pnpm install`

3. **Set Node.js Version**
   - In project settings → General → Node.js Version
   - Select: `20.x`

#### Step 4: Environment Variables

Add all environment variables in Vercel Dashboard → Settings → Environment Variables:

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Brevo
BREVO_API_KEY=xkeysib-xxx
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Your Golf Club

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# VAPID (Push Notifications)
VAPID_PUBLIC_KEY=<generate-with-pnpm-generate-vapid>
VAPID_PRIVATE_KEY=<generate-with-pnpm-generate-vapid>
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Cron Jobs
CRON_SECRET=<generate-random-secret>

# Multi-Club
NEXT_PUBLIC_MAIN_DOMAIN=yourdomain.com
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
```

**Optional Variables:**
```env
# Brevo Templates (IDs from Brevo dashboard)
BREVO_TEMPLATE_REGISTRATION_CONFIRMATION=1
BREVO_TEMPLATE_TOURNAMENT_REMINDER=2
BREVO_TEMPLATE_TOURNAMENT_STARTED=3
BREVO_TEMPLATE_TOURNAMENT_RESULTS=4
BREVO_TEMPLATE_SCORECARD_SUBMITTED=5
BREVO_TEMPLATE_PAYMENT_CONFIRMATION=6
BREVO_TEMPLATE_WELCOME=7

# Brevo Contact Lists
BREVO_LIST_ALL_MEMBERS=2
BREVO_LIST_ACTIVE_PLAYERS=3
BREVO_LIST_TOURNAMENT_PARTICIPANTS=4

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Feature Flags
FEATURE_QR_SCORING=true
FEATURE_LIVE_LEADERBOARD=true
FEATURE_SPONSOR_ACTIVATION=true
```

#### Step 5: Database Migration

Run migrations from your local machine or CI/CD:

```bash
# Set DATABASE_URL to production
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm prisma migrate deploy

# Verify
pnpm prisma db pull
```

#### Step 6: Custom Domain

1. **Add Domain in Vercel**
   - Go to Project → Settings → Domains
   - Add your domain: `yourdomain.com`
   - Add wildcard for multi-club: `*.yourdomain.com`

2. **Configure DNS**
   - Add CNAME record: `yourdomain.com` → `cname.vercel-dns.com`
   - Add CNAME record: `*.yourdomain.com` → `cname.vercel-dns.com`
   - Add A record (alternative): `yourdomain.com` → `76.76.21.21`

3. **SSL Certificate**
   - Vercel automatically provisions SSL via Let's Encrypt
   - Wait 1-5 minutes for certificate provisioning

#### Step 7: Webhook Configuration

**Stripe Webhooks:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
4. Copy webhook secret and add to environment variables

**Brevo Webhooks:**
1. Go to Brevo → Transactional → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/brevo`
3. Select events:
   - Email delivered
   - Email opened
   - Email clicked
   - Email bounced
   - Email spam

#### Step 8: Cron Jobs

Vercel supports cron jobs via `vercel.json`:

Create `/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Note**: Cron jobs require Vercel Pro plan ($20/month per user).

#### Step 9: Verify Deployment

1. **Check Build Logs**
   - Go to Deployments → Latest → View Logs
   - Verify no errors

2. **Test Application**
   - Open `https://yourdomain.com`
   - Verify homepage loads
   - Test authentication
   - Test creating a tournament

3. **Check Health Endpoint**
   ```bash
   curl https://yourdomain.com/api/health
   ```
   Expected response:
   ```json
   {"status":"ok","database":"connected","timestamp":"2025-01-01T00:00:00.000Z"}
   ```

---

### Railway Deployment

Railway provides a simple PaaS with built-in PostgreSQL and straightforward deployment.

#### Step 1: Prerequisites

1. Create a [Railway account](https://railway.app)
2. Install Railway CLI (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

#### Step 2: Create Project

**Via Dashboard:**
1. Go to [railway.app/new](https://railway.app/new)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize GitHub and select repository

**Via CLI:**
```bash
cd /path/to/golf-turnament
railway init
railway link
```

#### Step 3: Add PostgreSQL

1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision database and set `DATABASE_URL` automatically

**Note**: Railway automatically injects `DATABASE_URL` into your application.

#### Step 4: Configure Build Settings

Railway auto-detects Next.js, but you can customize:

1. Go to Service → Settings
2. Configure:
   - **Build Command**: `pnpm install && pnpm prisma generate && pnpm build`
   - **Start Command**: `pnpm start`
   - **Watch Paths**: `/**`

#### Step 5: Environment Variables

Add variables in Railway Dashboard → Service → Variables:

```env
# NextAuth
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<generate-secret>

# Brevo
BREVO_API_KEY=xkeysib-xxx
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Your Golf Club

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# VAPID
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Cron
CRON_SECRET=<random-secret>

# Multi-Club
NEXT_PUBLIC_MAIN_DOMAIN=yourdomain.com
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
```

**Railway Variables:**
- `${{RAILWAY_PUBLIC_DOMAIN}}` - Auto-generated public URL
- `${{DATABASE_URL}}` - Automatically set by PostgreSQL service

#### Step 6: Database Migration

**Option A: Via CLI**
```bash
railway run pnpm prisma migrate deploy
```

**Option B: Via Build Hook**
Add to `package.json`:
```json
{
  "scripts": {
    "build": "prisma migrate deploy && next build"
  }
}
```

#### Step 7: Custom Domain

1. Go to Service → Settings → Networking
2. Click "Generate Domain" for Railway subdomain
3. For custom domain:
   - Click "Add Custom Domain"
   - Enter `yourdomain.com`
   - Add DNS records (Railway provides instructions)
4. For wildcard (multi-club):
   - Add `*.yourdomain.com`
   - Configure CNAME: `*.yourdomain.com` → `railway-provided-cname`

#### Step 8: Cron Jobs

Railway supports cron via separate services:

1. **Create Cron Service**
   - In project, click "+ New"
   - Select "Empty Service"
   - Name it "cron-jobs"

2. **Add Dockerfile for Cron**
   Create `Dockerfile.cron`:
   ```dockerfile
   FROM node:20-alpine

   WORKDIR /app

   COPY package.json pnpm-lock.yaml ./
   RUN npm install -g pnpm && pnpm install --frozen-lockfile

   COPY . .

   # Install supercronic
   RUN apk add --no-cache curl
   RUN curl -fsSLO https://github.com/aptible/supercronic/releases/download/v0.2.27/supercronic-linux-amd64 \
       && chmod +x supercronic-linux-amd64 \
       && mv supercronic-linux-amd64 /usr/local/bin/supercronic

   COPY crontab /app/crontab

   CMD ["supercronic", "/app/crontab"]
   ```

3. **Create Crontab**
   Create `crontab`:
   ```
   # Notification reminders every 15 minutes
   */15 * * * * curl -X POST https://yourdomain.com/api/cron/notifications -H "Authorization: Bearer ${CRON_SECRET}"

   # Cleanup daily at 2 AM
   0 2 * * * curl -X POST https://yourdomain.com/api/cron/cleanup -H "Authorization: Bearer ${CRON_SECRET}"
   ```

4. **Deploy Cron Service**
   ```bash
   railway up --service cron-jobs
   ```

#### Step 9: Scaling

Configure scaling in Railway Dashboard:

1. Go to Service → Settings → Deploy
2. Configure:
   - **Instances**: 1-5 (horizontal scaling)
   - **Memory**: 512 MB - 8 GB
   - **CPU**: Shared or dedicated
3. Railway auto-scales based on usage

---

### AWS Deployment

AWS provides full control with ECS Fargate for serverless containers.

#### Step 1: Prerequisites

1. AWS Account with admin access
2. AWS CLI installed and configured
   ```bash
   aws configure
   ```
3. Docker installed locally
4. Domain registered (can use Route53)

#### Step 2: Architecture

```
Route53 (DNS)
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate (Multiple Tasks)
    ↓
RDS PostgreSQL (Multi-AZ)
    ↓
S3 (Photo Storage)
    ↓
CloudFront (CDN)
```

#### Step 3: Database Setup (RDS)

1. **Create RDS PostgreSQL Instance**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier golf-tournament-prod \
     --db-instance-class db.t3.medium \
     --engine postgres \
     --engine-version 16.1 \
     --master-username postgres \
     --master-user-password <secure-password> \
     --allocated-storage 100 \
     --storage-type gp3 \
     --multi-az \
     --backup-retention-period 7 \
     --vpc-security-group-ids sg-xxx \
     --db-subnet-group-name default \
     --publicly-accessible false \
     --enable-performance-insights
   ```

2. **Create Parameter Group** (recommended settings)
   ```bash
   aws rds create-db-parameter-group \
     --db-parameter-group-name golf-tournament-pg16 \
     --db-parameter-group-family postgres16 \
     --description "Optimized for Golf Tournament App"

   # Set parameters
   aws rds modify-db-parameter-group \
     --db-parameter-group-name golf-tournament-pg16 \
     --parameters \
       "ParameterName=shared_buffers,ParameterValue=256MB,ApplyMethod=pending-reboot" \
       "ParameterName=max_connections,ParameterValue=200,ApplyMethod=pending-reboot" \
       "ParameterName=work_mem,ParameterValue=4MB,ApplyMethod=immediate"
   ```

3. **Get Connection String**
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier golf-tournament-prod \
     --query 'DBInstances[0].Endpoint.Address' \
     --output text
   ```

   Connection string format:
   ```
   postgresql://postgres:<password>@<endpoint>:5432/postgres
   ```

#### Step 4: S3 Bucket for Photos

```bash
# Create bucket
aws s3 mb s3://golf-tournament-photos-prod --region us-east-1

# Configure CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com", "https://*.yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket golf-tournament-photos-prod \
  --cors-configuration file://cors.json

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket golf-tournament-photos-prod \
  --versioning-configuration Status=Enabled

# Configure lifecycle
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket golf-tournament-photos-prod \
  --lifecycle-configuration file://lifecycle.json
```

#### Step 5: Create ECR Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name golf-tournament \
  --region us-east-1

# Get repository URI
REPO_URI=$(aws ecr describe-repositories \
  --repository-names golf-tournament \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo $REPO_URI
# Output: 123456789012.dkr.ecr.us-east-1.amazonaws.com/golf-tournament
```

#### Step 6: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $REPO_URI

# Build image
docker build -t golf-tournament:latest .

# Tag image
docker tag golf-tournament:latest $REPO_URI:latest
docker tag golf-tournament:latest $REPO_URI:v1.0.0

# Push image
docker push $REPO_URI:latest
docker push $REPO_URI:v1.0.0
```

#### Step 7: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name golf-tournament-prod \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1,base=1 \
    capacityProvider=FARGATE_SPOT,weight=4
```

#### Step 8: Create Task Definition

Create `task-definition.json`:
```json
{
  "family": "golf-tournament-prod",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "golf-tournament",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/golf-tournament:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_MAIN_DOMAIN",
          "value": "yourdomain.com"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:golf-tournament/database-url"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:golf-tournament/nextauth-secret"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:golf-tournament/stripe-secret"
        },
        {
          "name": "BREVO_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:golf-tournament/brevo-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/golf-tournament-prod",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

#### Step 9: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name golf-tournament-alb \
  --subnets subnet-xxx subnet-yyy subnet-zzz \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
  --name golf-tournament-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener (HTTP → HTTPS redirect)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}

# Create listener (HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

#### Step 10: Create ECS Service

```bash
aws ecs create-service \
  --cluster golf-tournament-prod \
  --service-name golf-tournament-service \
  --task-definition golf-tournament-prod:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=<target-group-arn>,containerName=golf-tournament,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --enable-execute-command
```

#### Step 11: Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/golf-tournament-prod/golf-tournament-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/golf-tournament-prod/golf-tournament-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json

# scaling-policy.json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

#### Step 12: CloudFront CDN

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

`cloudfront-config.json`:
```json
{
  "CallerReference": "golf-tournament-prod-20250101",
  "Aliases": {
    "Quantity": 2,
    "Items": ["yourdomain.com", "*.yourdomain.com"]
  },
  "DefaultRootObject": "",
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "alb-origin",
        "DomainName": "golf-tournament-alb-xxx.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      },
      {
        "Id": "s3-origin",
        "DomainName": "golf-tournament-photos-prod.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "alb-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "CachedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "all"
      },
      "Headers": {
        "Quantity": 3,
        "Items": ["Host", "Accept", "Authorization"]
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 31536000
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "/_next/static/*",
        "TargetOriginId": "alb-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 31536000,
        "DefaultTTL": 31536000,
        "MaxTTL": 31536000
      }
    ]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/xxx",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true
}
```

#### Step 13: EventBridge for Cron Jobs

```bash
# Create EventBridge rule for notifications (every 15 min)
aws events put-rule \
  --name golf-tournament-notifications \
  --schedule-expression "rate(15 minutes)" \
  --state ENABLED

# Add target (ECS task)
aws events put-targets \
  --rule golf-tournament-notifications \
  --targets file://notification-target.json

# notification-target.json
{
  "Targets": [
    {
      "Id": "1",
      "Arn": "arn:aws:ecs:us-east-1:123456789012:cluster/golf-tournament-prod",
      "RoleArn": "arn:aws:iam::123456789012:role/ecsEventsRole",
      "EcsParameters": {
        "TaskDefinitionArn": "arn:aws:ecs:us-east-1:123456789012:task-definition/golf-tournament-cron:1",
        "TaskCount": 1,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "awsvpcConfiguration": {
            "Subnets": ["subnet-xxx"],
            "SecurityGroups": ["sg-xxx"],
            "AssignPublicIp": "DISABLED"
          }
        }
      },
      "Input": "{\"command\":\"notifications\"}"
    }
  ]
}
```

---

### DigitalOcean Deployment

DigitalOcean App Platform provides a simple PaaS with good pricing.

#### Step 1: Prerequisites

1. DigitalOcean account
2. `doctl` CLI (optional)
   ```bash
   snap install doctl
   doctl auth init
   ```

#### Step 2: Create PostgreSQL Database

1. **Via Dashboard:**
   - Go to Databases → Create Database
   - Select PostgreSQL 16
   - Plan: Basic ($15/mo) or Production ($60/mo)
   - Region: Choose closest to users
   - Click "Create Database"

2. **Get Connection Details:**
   - Go to database → Connection Details
   - Copy connection string
   - Format: `postgresql://user:pass@host:25060/dbname?sslmode=require`

#### Step 3: Create App

1. **Via Dashboard:**
   - Go to Apps → Create App
   - Select "GitHub" as source
   - Authorize and select repository
   - Select branch: `main`

2. **Configure App:**
   - Name: `golf-tournament`
   - Region: Same as database
   - Plan: Professional ($12/mo) or higher

3. **Configure Build:**
   ```yaml
   name: golf-tournament
   region: nyc
   services:
   - name: web
     github:
       repo: your-username/golf-tournament
       branch: main
       deploy_on_push: true
     build_command: pnpm install && pnpm prisma generate && pnpm build
     run_command: pnpm start
     environment_slug: node-js
     instance_size_slug: professional-xs
     instance_count: 2
     http_port: 3000
     health_check:
       http_path: /api/health
     envs:
     - key: NODE_ENV
       value: production
     - key: DATABASE_URL
       value: ${golf-tournament-db.DATABASE_URL}
     # Other env vars...

   databases:
   - name: golf-tournament-db
     engine: PG
     version: "16"
     production: true
   ```

#### Step 4: Environment Variables

Add in App Settings → Environment Variables:

```env
DATABASE_URL=${golf-tournament-db.DATABASE_URL}
NEXTAUTH_URL=${APP_URL}
NEXTAUTH_SECRET=<generate>
BREVO_API_KEY=<from-brevo>
STRIPE_SECRET_KEY=<from-stripe>
# ... all other variables
```

#### Step 5: Custom Domain

1. Go to App → Settings → Domains
2. Add domain: `yourdomain.com`
3. Add wildcard: `*.yourdomain.com`
4. Configure DNS:
   - Add CNAME: `yourdomain.com` → `<app-name>.ondigitalocean.app`
   - Add CNAME: `*.yourdomain.com` → `<app-name>.ondigitalocean.app`

#### Step 6: Spaces (S3-Compatible Storage)

For photo storage:

1. **Create Space:**
   - Go to Spaces → Create Space
   - Name: `golf-tournament-photos`
   - Region: Same as app
   - CDN: Enabled

2. **Create API Keys:**
   - Go to API → Spaces Keys → Generate New Key
   - Save access key and secret

3. **Configure CORS:**
   ```bash
   # Install s3cmd
   sudo apt-get install s3cmd

   # Configure
   s3cmd --configure

   # Create CORS file
   cat > cors.xml << EOF
   <CORSConfiguration>
     <CORSRule>
       <AllowedOrigin>https://yourdomain.com</AllowedOrigin>
       <AllowedOrigin>https://*.yourdomain.com</AllowedOrigin>
       <AllowedMethod>GET</AllowedMethod>
       <AllowedMethod>PUT</AllowedMethod>
       <AllowedMethod>POST</AllowedMethod>
       <AllowedMethod>DELETE</AllowedMethod>
       <AllowedHeader>*</AllowedHeader>
       <MaxAgeSeconds>3000</MaxAgeSeconds>
     </CORSRule>
   </CORSConfiguration>
   EOF

   # Apply CORS
   s3cmd setcors cors.xml s3://golf-tournament-photos
   ```

4. **Add Environment Variables:**
   ```env
   S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
   S3_BUCKET=golf-tournament-photos
   S3_ACCESS_KEY_ID=<spaces-key>
   S3_SECRET_ACCESS_KEY=<spaces-secret>
   S3_REGION=nyc3
   ```

#### Step 7: Cron Jobs

DigitalOcean doesn't have native cron support. Use external services:

**Option A: EasyCron**
1. Sign up at easycron.com
2. Create cron jobs:
   - URL: `https://yourdomain.com/api/cron/notifications`
   - Schedule: Every 15 minutes
   - Add header: `Authorization: Bearer ${CRON_SECRET}`

**Option B: GitHub Actions**
```yaml
# .github/workflows/cron.yml
name: Cron Jobs

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

jobs:
  notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger notification cron
        run: |
          curl -X POST https://yourdomain.com/api/cron/notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Database Setup

### PostgreSQL Requirements

**Minimum Version:** PostgreSQL 16.0

**Required Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
```

### Connection Pooling

For production, always use connection pooling to prevent exhausting database connections.

**Option A: PgBouncer (Recommended)**

```ini
# pgbouncer.ini
[databases]
golf_tournament = host=localhost port=5432 dbname=golf_tournament

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 50
max_user_connections = 50
server_reset_query = DISCARD ALL
server_check_delay = 30
```

**Option B: Prisma Connection Pool**

```env
# Use Prisma's built-in pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**Option C: External Pooler (Neon, Supabase)**

```env
# Neon provides pooling automatically
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Supabase with pgbouncer
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?pgbouncer=true"
```

### Database Migrations

**Initial Setup:**
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Verify
pnpm prisma db pull
```

**Rolling Updates:**
```bash
# Create new migration locally
pnpm prisma migrate dev --name add_new_feature

# Test migration
pnpm prisma migrate deploy --preview-feature

# Deploy to production
pnpm prisma migrate deploy
```

### Backup Strategy

**Automated Backups:**

1. **Daily Full Backups**
   ```bash
   # Backup script
   #!/bin/bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR=/backups/postgresql

   pg_dump -Fc -h localhost -U postgres golf_tournament > \
     $BACKUP_DIR/golf_tournament_$TIMESTAMP.dump

   # Compress
   gzip $BACKUP_DIR/golf_tournament_$TIMESTAMP.dump

   # Upload to S3
   aws s3 cp $BACKUP_DIR/golf_tournament_$TIMESTAMP.dump.gz \
     s3://golf-tournament-backups/daily/

   # Delete backups older than 30 days
   find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete
   ```

2. **Continuous WAL Archiving**
   ```sql
   -- postgresql.conf
   wal_level = replica
   archive_mode = on
   archive_command = 'aws s3 cp %p s3://golf-tournament-backups/wal/%f'
   ```

3. **Point-in-Time Recovery**
   ```bash
   # Restore base backup
   pg_restore -Fc -d golf_tournament backup.dump

   # Recover to specific point in time
   # Create recovery.conf
   cat > recovery.conf << EOF
   restore_command = 'aws s3 cp s3://golf-tournament-backups/wal/%f %p'
   recovery_target_time = '2025-01-15 12:00:00'
   EOF
   ```

### Performance Tuning

**Recommended Settings for Medium Load:**

```sql
-- Memory settings
shared_buffers = '256MB'
effective_cache_size = '1GB'
work_mem = '4MB'
maintenance_work_mem = '64MB'

-- Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = '16MB'
default_statistics_target = 100

-- Query tuning
random_page_cost = 1.1  -- For SSD
effective_io_concurrency = 200

-- Connection settings
max_connections = 200
```

**Essential Indexes:**

```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY abs(correlation) DESC;

-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_tournaments_status ON "Tournament"(status);
CREATE INDEX CONCURRENTLY idx_tournaments_date ON "Tournament"("tournamentDate");
CREATE INDEX CONCURRENTLY idx_scorecards_tournament ON "Scorecard"("tournamentId");
CREATE INDEX CONCURRENTLY idx_scorecards_player ON "Scorecard"("playerId");
CREATE INDEX CONCURRENTLY idx_registrations_tournament ON "Registration"("tournamentId");

-- Composite indexes
CREATE INDEX CONCURRENTLY idx_tournaments_status_date
  ON "Tournament"(status, "tournamentDate");

-- Text search index
CREATE INDEX CONCURRENTLY idx_players_name_trgm
  ON "Player" USING gin (
    (LOWER("firstName") || ' ' || LOWER("lastName")) gin_trgm_ops
  );
```

---

## Environment Variables Guide

### Required Variables

| Variable | Description | Example | How to Generate |
|----------|-------------|---------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | From database provider |
| `NEXTAUTH_URL` | Public URL of application | `https://yourdomain.com` | Your domain |
| `NEXTAUTH_SECRET` | NextAuth encryption key | `<random-32-char-string>` | `openssl rand -base64 32` |
| `BREVO_API_KEY` | Brevo API key | `xkeysib-xxx` | From Brevo dashboard |
| `BREVO_SENDER_EMAIL` | Sender email address | `noreply@yourdomain.com` | Your domain email |
| `BREVO_SENDER_NAME` | Sender name | `Golf Club` | Your club name |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxx` | From Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_xxx` | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxx` | From Stripe webhook config |
| `VAPID_PUBLIC_KEY` | VAPID public key for push | `<generated>` | `pnpm generate-vapid` |
| `VAPID_PRIVATE_KEY` | VAPID private key for push | `<generated>` | `pnpm generate-vapid` |
| `VAPID_SUBJECT` | VAPID contact email | `mailto:admin@yourdomain.com` | Your contact email |
| `CRON_SECRET` | Secret for cron job auth | `<random-string>` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_MAIN_DOMAIN` | Main domain for multi-club | `yourdomain.com` | Your domain |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BREVO_TEMPLATE_*` | Email template IDs | None (uses default templates) |
| `BREVO_LIST_*` | Contact list IDs | None |
| `STRIPE_PRICE_*` | Subscription price IDs | None |
| `SENTRY_DSN` | Sentry error tracking DSN | None |
| `FEATURE_QR_SCORING` | Enable QR scoring | `true` |
| `FEATURE_LIVE_LEADERBOARD` | Enable live leaderboard | `true` |
| `UPLOAD_MAX_SIZE` | Max photo upload size | `10485760` (10MB) |
| `NODE_ENV` | Environment | `production` |

### Generating Secrets

**NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
# Output: aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/==
```

**CRON_SECRET:**
```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**VAPID Keys:**
```bash
# From project root
pnpm generate-vapid

# Output:
# VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Environment-Specific Values

**Development (.env.local):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/golf_tournament_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-not-for-production"
STRIPE_SECRET_KEY="sk_test_xxx"  # Use test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
```

**Staging (.env.staging):**
```env
DATABASE_URL="postgresql://user:pass@staging-db:5432/golf_tournament_staging"
NEXTAUTH_URL="https://staging.yourdomain.com"
NEXTAUTH_SECRET="<staging-specific-secret>"
STRIPE_SECRET_KEY="sk_test_xxx"  # Still use test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
```

**Production (.env.production):**
```env
DATABASE_URL="postgresql://user:pass@prod-db:5432/golf_tournament_prod?sslmode=require"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="<production-secret>"
STRIPE_SECRET_KEY="sk_live_xxx"  # Use live keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"  # Production webhook
```

### Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.example` for templates
   - Add `.env*` to `.gitignore` (except `.env.example`)

2. **Use secret management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Platform-specific (Vercel, Railway)

3. **Rotate secrets regularly**
   - Database passwords: Every 90 days
   - API keys: Every 180 days
   - NEXTAUTH_SECRET: Every 365 days

4. **Use different secrets per environment**
   - Never reuse production secrets in staging/dev
   - Use different Stripe accounts for test vs live

5. **Limit secret access**
   - Use IAM roles when possible
   - Principle of least privilege
   - Audit secret access regularly

---

## External Services Setup

### Stripe Configuration

#### Step 1: Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification (required for live mode)
3. Add bank account for payouts

#### Step 2: Get API Keys

1. Go to Dashboard → Developers → API Keys
2. Copy keys:
   - **Publishable key**: `pk_live_xxx` (for frontend)
   - **Secret key**: `sk_live_xxx` (for backend)
3. For testing, use test keys: `pk_test_xxx`, `sk_test_xxx`

#### Step 3: Create Products and Prices

**For Multi-Club Subscriptions:**

```bash
# Create products
stripe products create \
  --name "Basic Plan" \
  --description "Single club, up to 100 members"

stripe products create \
  --name "Premium Plan" \
  --description "Single club, unlimited members, advanced features"

stripe products create \
  --name "Enterprise Plan" \
  --description "Multiple clubs, white-label, priority support"

# Create prices
stripe prices create \
  --product prod_xxx \
  --unit-amount 2900 \
  --currency usd \
  --recurring interval=month

# Get price IDs and add to env:
# STRIPE_PRICE_BASIC=price_xxx
# STRIPE_PRICE_PREMIUM=price_xxx
# STRIPE_PRICE_ENTERPRISE=price_xxx
```

#### Step 4: Configure Webhooks

1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret: `whsec_xxx`
5. Add to environment variables: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

#### Step 5: Test Cards

For testing payments:

| Card Number | Description | Result |
|-------------|-------------|--------|
| 4242 4242 4242 4242 | Visa | Success |
| 4000 0000 0000 9995 | Visa | Declined (insufficient funds) |
| 4000 0000 0000 0002 | Visa | Declined (card declined) |
| 4000 0025 0000 3155 | Visa | Requires authentication (3D Secure) |

Use any future expiration date, any 3-digit CVC, any 5-digit ZIP code.

---

### Brevo (Sendinblue) Setup

#### Step 1: Create Brevo Account

1. Sign up at [brevo.com](https://www.brevo.com)
2. Verify email address
3. Choose plan (Free tier: 300 emails/day, Starter: $25/month)

#### Step 2: Get API Key

1. Go to Settings → SMTP & API → API Keys
2. Click "Generate a new API key"
3. Name it: "Golf Tournament Production"
4. Copy key: `xkeysib-xxx`
5. Add to environment: `BREVO_API_KEY=xkeysib-xxx`

#### Step 3: Configure Sender

1. Go to Settings → Senders & IP
2. Add sender email: `noreply@yourdomain.com`
3. Verify domain (DNS records):
   ```
   TXT: _verificationcode.yourdomain.com → <brevo-verification-code>
   ```
4. Add to environment:
   ```env
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   BREVO_SENDER_NAME=Golf Club Name
   ```

#### Step 4: Create Email Templates

Create 7 templates in Brevo Dashboard → Templates:

**1. Registration Confirmation**
- Name: `Tournament Registration Confirmation`
- Subject: `Registered for {{params.tournamentName}}`
- Body:
  ```html
  <h1>Registration Confirmed!</h1>
  <p>Dear {{params.playerName}},</p>
  <p>You have successfully registered for <strong>{{params.tournamentName}}</strong>.</p>
  <ul>
    <li><strong>Date:</strong> {{params.tournamentDate}}</li>
    <li><strong>Format:</strong> {{params.format}}</li>
    <li><strong>Start Time:</strong> {{params.startTime}}</li>
  </ul>
  <p>See you on the course!</p>
  ```

**2. Tournament Reminder**
- Name: `Tournament Reminder`
- Subject: `Reminder: {{params.tournamentName}} starts tomorrow`
- Body:
  ```html
  <h1>Tournament Tomorrow!</h1>
  <p>Dear {{params.playerName}},</p>
  <p>Friendly reminder that you're registered for <strong>{{params.tournamentName}}</strong> tomorrow.</p>
  <p><strong>What to bring:</strong></p>
  <ul>
    <li>Golf clubs</li>
    <li>Golf shoes</li>
    <li>Your smartphone (for digital scoring)</li>
  </ul>
  <p>Check-in opens 30 minutes before your tee time.</p>
  ```

**3. Tournament Started**
- Name: `Tournament Started`
- Subject: `{{params.tournamentName}} has started!`

**4. Tournament Results**
- Name: `Tournament Results`
- Subject: `Results: {{params.tournamentName}}`

**5. Scorecard Submitted**
- Name: `Scorecard Submitted`
- Subject: `Your scorecard has been submitted`

**6. Payment Confirmation**
- Name: `Payment Confirmation`
- Subject: `Payment received - {{params.amount}}`

**7. Welcome Email**
- Name: `Welcome to Golf Tournament System`
- Subject: `Welcome aboard!`

After creating templates, add their IDs to environment:
```env
BREVO_TEMPLATE_REGISTRATION_CONFIRMATION=1
BREVO_TEMPLATE_TOURNAMENT_REMINDER=2
BREVO_TEMPLATE_TOURNAMENT_STARTED=3
BREVO_TEMPLATE_TOURNAMENT_RESULTS=4
BREVO_TEMPLATE_SCORECARD_SUBMITTED=5
BREVO_TEMPLATE_PAYMENT_CONFIRMATION=6
BREVO_TEMPLATE_WELCOME=7
```

#### Step 5: Create Contact Lists

1. Go to Contacts → Lists
2. Create lists:
   - **All Members**: All registered users
   - **Active Players**: Users who participated in last 6 months
   - **Tournament Participants**: Currently registered for tournaments

3. Add list IDs to environment:
   ```env
   BREVO_LIST_ALL_MEMBERS=2
   BREVO_LIST_ACTIVE_PLAYERS=3
   BREVO_LIST_TOURNAMENT_PARTICIPANTS=4
   ```

#### Step 6: Configure DKIM/SPF

For better email deliverability:

1. Go to Settings → Senders & IP → Domains
2. Click on your domain
3. Add DNS records:

   **SPF Record:**
   ```
   TXT @ "v=spf1 include:spf.sendinblue.com mx ~all"
   ```

   **DKIM Records:** (Brevo provides these)
   ```
   TXT mail._domainkey.yourdomain.com "v=DKIM1; k=rsa; p=MIGfMA..."
   TXT mail2._domainkey.yourdomain.com "v=DKIM1; k=rsa; p=MIGfMA..."
   ```

4. Verify records (can take up to 48 hours)

#### Step 7: Webhook Configuration (Optional)

For email event tracking:

1. Go to Settings → SMTP & API → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/brevo`
3. Select events:
   - `delivered`
   - `opened`
   - `click`
   - `bounced`
   - `spam`
   - `unsubscribed`

---

### Photo Storage (S3-Compatible)

#### Option A: AWS S3

**1. Create Bucket:**
```bash
aws s3 mb s3://golf-tournament-photos-prod --region us-east-1
```

**2. Configure CORS:**
```bash
aws s3api put-bucket-cors \
  --bucket golf-tournament-photos-prod \
  --cors-configuration file://cors.json
```

`cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com", "https://*.yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

**3. Create IAM User:**
```bash
# Create user
aws iam create-user --user-name golf-tournament-s3

# Create policy
cat > s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::golf-tournament-photos-prod",
        "arn:aws:s3:::golf-tournament-photos-prod/*"
      ]
    }
  ]
}
EOF

# Attach policy
aws iam put-user-policy \
  --user-name golf-tournament-s3 \
  --policy-name S3Access \
  --policy-document file://s3-policy.json

# Create access keys
aws iam create-access-key --user-name golf-tournament-s3
```

**4. Environment Variables:**
```env
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_BUCKET=golf-tournament-photos-prod
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_REGION=us-east-1
```

#### Option B: CloudFlare R2

**1. Create R2 Bucket:**
1. Go to CloudFlare Dashboard → R2
2. Click "Create bucket"
3. Name: `golf-tournament-photos`
4. Location: Automatic

**2. Create API Token:**
1. Click "Manage R2 API Tokens"
2. Create API token
3. Permissions: Object Read & Write
4. Copy Access Key ID and Secret Access Key

**3. Configure CORS:**
1. Go to bucket settings
2. CORS Policy:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com", "https://*.yourdomain.com"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

**4. Environment Variables:**
```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET=golf-tournament-photos
S3_ACCESS_KEY_ID=<r2-access-key-id>
S3_SECRET_ACCESS_KEY=<r2-secret-key>
S3_REGION=auto
```

**Benefits of R2:**
- No egress fees (free bandwidth)
- S3-compatible API
- Integrated with CloudFlare CDN
- Cheaper than AWS S3

---

## DNS & Domain Setup

### Step 1: Register Domain

Register domain at:
- **Namecheap** - Good pricing
- **Google Domains** - Simple interface
- **CloudFlare Registrar** - Lowest prices
- **Route53** (AWS) - Best for AWS deployments

### Step 2: Configure DNS

**For Vercel:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: 3600
```

**For Custom Setup:**
```
Type: A
Name: @
Value: <your-load-balancer-ip>
TTL: 3600

Type: CNAME
Name: *
Value: yourdomain.com
TTL: 3600

Type: CNAME
Name: www
Value: yourdomain.com
TTL: 3600
```

### Step 3: SSL Certificate

**Option A: Let's Encrypt (Free)**
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate (wildcard)
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  --email admin@yourdomain.com \
  --agree-tos \
  -d yourdomain.com \
  -d *.yourdomain.com

# Certbot will ask you to add DNS TXT record:
# _acme-challenge.yourdomain.com → <verification-string>

# Certificates stored in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Auto-renewal (crontab)
0 0 * * * certbot renew --quiet
```

**Option B: AWS Certificate Manager (Free for AWS)**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# ACM will provide DNS records to add
# Add CNAME records to verify ownership
```

**Option C: CloudFlare (Automatic)**
- CloudFlare automatically provides SSL when you use their DNS
- Enable "Full (strict)" mode in SSL/TLS settings

### Step 4: Subdomain Configuration for Multi-Club

Each club gets their own subdomain: `club1.yourdomain.com`, `club2.yourdomain.com`

**Wildcard DNS:**
```
Type: CNAME
Name: *
Value: yourdomain.com (or your deployment endpoint)
TTL: 3600
```

**Application Routing:**
The application automatically detects subdomain and routes to correct club:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const subdomain = hostname?.split('.')[0]

  // club1.yourdomain.com → Club ID: club1
  // yourdomain.com → Main landing page
}
```

---

## Cron Jobs Setup

The application requires cron jobs for scheduled tasks:

1. **Notification Reminders** (`/api/cron/notifications`)
   - Frequency: Every 15 minutes
   - Purpose: Send tournament reminders, scorecard reminders

2. **Cleanup Tasks** (`/api/cron/cleanup`)
   - Frequency: Daily at 2 AM
   - Purpose: Clean up expired sessions, old photos, unused data

### Platform-Specific Configuration

**Vercel:**
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Railway:**
Use GitHub Actions (see above)

**AWS EventBridge:**
```bash
# Notification cron (every 15 min)
aws events put-rule \
  --name golf-notifications \
  --schedule-expression "rate(15 minutes)"

# Cleanup cron (daily at 2 AM UTC)
aws events put-rule \
  --name golf-cleanup \
  --schedule-expression "cron(0 2 * * ? *)"
```

**External: EasyCron**
1. Sign up at easycron.com (free tier: 5 cron jobs)
2. Create cron:
   - URL: `https://yourdomain.com/api/cron/notifications`
   - Schedule: `*/15 * * * *`
   - Add header: `Authorization: Bearer <CRON_SECRET>`

### Security

Always protect cron endpoints:

```typescript
// app/api/cron/notifications/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Execute cron logic
  // ...
}
```

### Monitoring Cron Execution

Add logging to track cron job execution:

```typescript
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // Execute cron logic
    const result = await sendNotificationReminders()

    // Log success
    await prisma.cronLog.create({
      data: {
        jobName: 'notifications',
        status: 'success',
        duration: Date.now() - startTime,
        result: result
      }
    })

    return Response.json({ success: true, result })
  } catch (error) {
    // Log failure
    await prisma.cronLog.create({
      data: {
        jobName: 'notifications',
        status: 'error',
        duration: Date.now() - startTime,
        error: error.message
      }
    })

    throw error
  }
}
```

---

## Monitoring & Logging

### Error Tracking (Sentry)

**Setup:**
```bash
npm install --save @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Configuration:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

**Environment Variables:**
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Uptime Monitoring

**Option A: UptimeRobot (Free)**
1. Sign up at uptimerobot.com
2. Add monitor:
   - Type: HTTP(S)
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
3. Add alerts via email, SMS, Slack

**Option B: Better Uptime**
1. Sign up at betteruptime.com
2. Create status page
3. Monitor multiple endpoints
4. Incident management

**Health Check Endpoint:**
```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`

    return Response.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    })
  } catch (error) {
    return Response.json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    }, { status: 503 })
  }
}
```

### Application Logs

**Structured Logging with Pino:**
```bash
pnpm add pino pino-pretty
```

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
  },
})

// Usage
logger.info({ tournamentId: '123' }, 'Tournament created')
logger.error({ error: err }, 'Failed to process payment')
```

### Metrics and Analytics

**Key Metrics to Track:**
1. **Application Metrics:**
   - Request rate (req/s)
   - Error rate (%)
   - P95 latency (ms)
   - Concurrent users

2. **Business Metrics:**
   - Active clubs
   - Tournaments created
   - Players registered
   - Scorecards submitted
   - Payment conversion rate

3. **Infrastructure Metrics:**
   - CPU usage (%)
   - Memory usage (%)
   - Database connections
   - Query duration (ms)

**Custom Dashboard (Grafana):**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

---

## Security Hardening

### Rate Limiting

Prevent abuse and DDoS attacks:

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export default function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit

        return isRateLimited ? reject() : resolve()
      }),
  }
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
})

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    await limiter.check(10, ip) // 10 requests per minute
  } catch {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // Handle request
}
```

### CORS Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Set CORS headers
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://*.yourdomain.com'
  ]

  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.some(allowed =>
    allowed === origin || new RegExp(allowed.replace('*', '.*')).test(origin)
  )) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}
```

### Content Security Policy

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://*.amazonaws.com https://*.cloudflarestorage.com;
      font-src 'self';
      connect-src 'self' https://api.stripe.com https://api.brevo.com;
      frame-src https://js.stripe.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

### Database Security

**1. Network Security:**
```bash
# AWS Security Group (only allow from application)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-yyy  # Only allow from app security group
```

**2. Connection Security:**
```env
# Always use SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

**3. Least Privilege:**
```sql
-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure-password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE golf_tournament TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM app_user;
```

### Secrets Management

**AWS Secrets Manager:**
```bash
# Store secret
aws secretsmanager create-secret \
  --name golf-tournament/database-url \
  --secret-string "postgresql://..."

# Retrieve secret in application
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

const client = new SecretsManagerClient({ region: "us-east-1" })
const response = await client.send(
  new GetSecretValueCommand({ SecretId: "golf-tournament/database-url" })
)
const secret = JSON.parse(response.SecretString)
```

---

## Performance Optimization

### CDN for Static Assets

**CloudFlare:**
1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers
4. Enable "Auto Minify" (JS, CSS, HTML)
5. Enable "Brotli" compression
6. Set cache rules:
   - Static assets (images, CSS, JS): Cache everything
   - API routes: Bypass cache

**AWS CloudFront:**
```bash
# Create distribution
aws cloudfront create-distribution --cli-input-json file://distribution-config.json
```

### Image Optimization

Next.js provides built-in image optimization:

```typescript
// next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      's3.amazonaws.com',
      'golf-tournament-photos-prod.s3.amazonaws.com',
      'r2.cloudflarestorage.com'
    ],
  },
}
```

### Caching Strategy

**Redis for Session/Data Cache:**
```bash
# Install Redis
pnpm add ioredis

# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

```typescript
// lib/redis.ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Cache tournament data
export async function getTournament(id: string) {
  // Check cache first
  const cached = await redis.get(`tournament:${id}`)
  if (cached) {
    return JSON.parse(cached)
  }

  // Fetch from database
  const tournament = await prisma.tournament.findUnique({
    where: { id }
  })

  // Cache for 5 minutes
  await redis.setex(`tournament:${id}`, 300, JSON.stringify(tournament))

  return tournament
}
```

**Cache Invalidation:**
```typescript
// Invalidate cache on update
export async function updateTournament(id: string, data: any) {
  await prisma.tournament.update({
    where: { id },
    data
  })

  // Invalidate cache
  await redis.del(`tournament:${id}`)
}
```

### Database Query Optimization

**1. Use Indexes:**
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_tournaments_status_date
  ON "Tournament"(status, "tournamentDate");

CREATE INDEX CONCURRENTLY idx_scorecards_tournament_status
  ON "Scorecard"("tournamentId", status);
```

**2. Use Database Queries Instead of Application Logic:**
```typescript
// Bad: Fetch all and filter in JS
const tournaments = await prisma.tournament.findMany()
const active = tournaments.filter(t => t.status === 'IN_PROGRESS')

// Good: Filter in database
const active = await prisma.tournament.findMany({
  where: { status: 'IN_PROGRESS' }
})
```

**3. Use Select to Limit Fields:**
```typescript
// Bad: Fetch all fields
const tournaments = await prisma.tournament.findMany()

// Good: Only fetch needed fields
const tournaments = await prisma.tournament.findMany({
  select: {
    id: true,
    name: true,
    tournamentDate: true,
    status: true
  }
})
```

**4. Pagination:**
```typescript
// Cursor-based pagination (recommended)
const tournaments = await prisma.tournament.findMany({
  take: 20,
  skip: 1,
  cursor: {
    id: lastSeenId
  },
  orderBy: {
    tournamentDate: 'desc'
  }
})
```

### Connection Pooling

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Backup & Disaster Recovery

### Backup Strategy

**1. Database Backups:**

**Automated Daily Backups:**
```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/postgresql
S3_BUCKET=golf-tournament-backups

# Full backup
pg_dump -Fc -h $DB_HOST -U $DB_USER -d $DB_NAME > \
  $BACKUP_DIR/backup_$TIMESTAMP.dump

# Compress
gzip $BACKUP_DIR/backup_$TIMESTAMP.dump

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.dump.gz \
  s3://$S3_BUCKET/daily/ \
  --storage-class STANDARD_IA

# Delete local backups older than 7 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +7 -delete

# Delete S3 backups older than 30 days
aws s3 ls s3://$S3_BUCKET/daily/ | \
  awk '{if ($1 < "'$(date -d '30 days ago' +%Y-%m-%d)'") print $4}' | \
  xargs -I {} aws s3 rm s3://$S3_BUCKET/daily/{}
```

**Continuous WAL Archiving:**
```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://golf-tournament-backups/wal/%f'
archive_timeout = 300  # Force switch every 5 minutes
```

**2. Photo Backups:**

```bash
#!/bin/bash
# backup-photos.sh

S3_SOURCE=s3://golf-tournament-photos-prod
S3_BACKUP=s3://golf-tournament-photos-backup

# Sync to backup bucket (incremental)
aws s3 sync $S3_SOURCE $S3_BACKUP \
  --storage-class GLACIER_INSTANT_RETRIEVAL

# Create snapshot
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
aws s3 cp $S3_BACKUP s3://golf-tournament-photos-snapshots/$TIMESTAMP/ \
  --recursive \
  --storage-class GLACIER
```

### Restore Procedures

**Database Restore:**

```bash
# 1. Stop application
docker-compose stop app

# 2. Download backup
aws s3 cp s3://golf-tournament-backups/daily/backup_20250115_020000.dump.gz \
  /tmp/backup.dump.gz

# 3. Decompress
gunzip /tmp/backup.dump.gz

# 4. Restore
pg_restore -h localhost -U postgres -d golf_tournament_new \
  /tmp/backup.dump

# 5. Verify
psql -h localhost -U postgres -d golf_tournament_new -c "SELECT COUNT(*) FROM \"Tournament\""

# 6. Switch to new database (update DATABASE_URL)
# 7. Restart application
docker-compose up -d app
```

**Point-in-Time Recovery:**

```bash
# 1. Restore base backup
pg_restore -d golf_tournament /tmp/backup.dump

# 2. Create recovery.conf
cat > recovery.conf << EOF
restore_command = 'aws s3 cp s3://golf-tournament-backups/wal/%f %p'
recovery_target_time = '2025-01-15 12:30:00'
recovery_target_action = promote
EOF

# 3. Place recovery.conf in data directory
# 4. Start PostgreSQL (will replay WAL to specified time)
```

### Disaster Recovery Plan

**RTO/RPO Targets:**
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 5 minutes

**Disaster Scenarios:**

**1. Database Failure:**
- Time to detect: 1 minute (health checks)
- Time to failover: 5 minutes (automated)
- Data loss: Maximum 5 minutes (last WAL archive)

**2. Application Failure:**
- Time to detect: 1 minute
- Time to redeploy: 10 minutes
- Data loss: None

**3. Region Failure:**
- Time to detect: 5 minutes
- Time to failover: 30 minutes (manual DNS change)
- Data loss: 5-15 minutes (cross-region replication lag)

**4. Data Corruption:**
- Time to detect: Varies (monitoring required)
- Time to restore: 1-2 hours (from backup)
- Data loss: Depends on backup schedule (daily backups)

**Disaster Recovery Checklist:**

```markdown
## Incident Response Checklist

### Phase 1: Detection (0-5 minutes)
- [ ] Alert received via monitoring
- [ ] Verify incident (check multiple sources)
- [ ] Assess severity (P0-P4)
- [ ] Create incident ticket
- [ ] Notify stakeholders

### Phase 2: Investigation (5-15 minutes)
- [ ] Check application health endpoint
- [ ] Check database connectivity
- [ ] Review recent deployments/changes
- [ ] Check logs for errors
- [ ] Identify root cause

### Phase 3: Mitigation (15-30 minutes)
- [ ] If deployment issue: Roll back to previous version
- [ ] If database issue: Failover to replica
- [ ] If external service: Enable fallback/degraded mode
- [ ] Verify application recovery

### Phase 4: Resolution (30-60 minutes)
- [ ] Restore full functionality
- [ ] Verify all services healthy
- [ ] Monitor for recurring issues
- [ ] Update incident ticket

### Phase 5: Post-Mortem (24-48 hours later)
- [ ] Document timeline
- [ ] Identify root cause
- [ ] Create action items to prevent recurrence
- [ ] Update runbooks
- [ ] Share learnings with team
```

---

## Scaling Strategy

### Horizontal Scaling

**Application Layer:**

1. **Multiple Instances:**
   - Run 2-10 instances behind load balancer
   - Stateless design (no session storage on server)
   - Use Redis for shared session state

2. **Auto-Scaling Rules:**
   ```bash
   # AWS Auto Scaling
   - Scale out: CPU > 70% for 5 minutes
   - Scale in: CPU < 30% for 10 minutes
   - Min instances: 2
   - Max instances: 10
   ```

**Database Layer:**

1. **Read Replicas:**
   ```bash
   # Create read replica
   aws rds create-db-instance-read-replica \
     --db-instance-identifier golf-tournament-replica \
     --source-db-instance-identifier golf-tournament-prod \
     --db-instance-class db.t3.medium
   ```

2. **Connection Routing:**
   ```typescript
   // lib/prisma.ts
   export const prismaWrite = new PrismaClient({
     datasources: {
       db: { url: process.env.DATABASE_URL }
     }
   })

   export const prismaRead = new PrismaClient({
     datasources: {
       db: { url: process.env.DATABASE_REPLICA_URL }
     }
   })

   // Usage
   // Writes go to primary
   await prismaWrite.tournament.create({ ... })

   // Reads go to replica
   const tournaments = await prismaRead.tournament.findMany()
   ```

### Vertical Scaling

**When to Scale Vertically:**
- Database hitting CPU/memory limits
- Complex queries taking too long
- Connection pool exhaustion

**Instance Sizes:**

| Users | CPU | Memory | Database Instance |
|-------|-----|--------|-------------------|
| 0-1K | 1 vCPU | 2 GB | db.t3.small |
| 1K-5K | 2 vCPU | 4 GB | db.t3.medium |
| 5K-20K | 4 vCPU | 16 GB | db.t3.xlarge |
| 20K-50K | 8 vCPU | 32 GB | db.m5.2xlarge |
| 50K+ | 16 vCPU | 64 GB | db.m5.4xlarge |

### Caching Layer

**Redis for Frequently Accessed Data:**

```typescript
// Cache tournament list
export async function getTournaments() {
  const cacheKey = 'tournaments:list:active'

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Fetch from database
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    orderBy: { tournamentDate: 'desc' }
  })

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(tournaments))

  return tournaments
}
```

### Queue System for Background Jobs

**BullMQ for Job Processing:**

```bash
pnpm add bullmq
```

```typescript
// lib/queue.ts
import { Queue, Worker } from 'bullmq'
import { redis } from './redis'

// Create queue
export const emailQueue = new Queue('emails', {
  connection: redis
})

// Add job
await emailQueue.add('send-tournament-reminder', {
  tournamentId: '123',
  recipients: ['user@example.com']
})

// Process jobs (separate worker process)
const worker = new Worker('emails', async job => {
  if (job.name === 'send-tournament-reminder') {
    await sendTournamentReminderEmail(job.data)
  }
}, {
  connection: redis,
  concurrency: 10
})
```

### CDN for Global Distribution

**CloudFlare for Global Performance:**
- Edge caching (300+ locations worldwide)
- Automatic image optimization
- Brotli compression
- HTTP/3 support

**Configuration:**
```typescript
// next.config.ts
export default {
  images: {
    loader: 'cloudflare',
    path: 'https://yourdomain.com/cdn-cgi/image/',
  },
}
```

---

## Post-Deployment

### Smoke Tests

Run these tests immediately after deployment:

```bash
# 1. Health check
curl https://yourdomain.com/api/health
# Expected: {"status":"ok","database":"connected"}

# 2. Authentication
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
# Expected: 200 OK with session token

# 3. Create tournament (requires auth)
curl -X POST https://yourdomain.com/api/tournaments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tournament","tournamentDate":"2025-12-31","format":"STABLEFORD"}'
# Expected: 201 Created with tournament object

# 4. Leaderboard SSE
curl -N https://yourdomain.com/api/tournaments/123/leaderboard
# Expected: SSE stream with leaderboard data

# 5. Webhook endpoints
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "stripe-signature: test" \
  -d '{}'
# Expected: 400 Bad Request (webhook verification failed - expected)
```

### Monitoring Setup

**1. Configure Alerts:**

**Sentry Alerts:**
- Error rate > 1% for 5 minutes
- P95 latency > 1000ms for 10 minutes
- Any P0/P1 errors

**Uptime Alerts:**
- Health check fails 3 times in 5 minutes
- Response time > 5 seconds

**Infrastructure Alerts:**
- CPU > 80% for 10 minutes
- Memory > 90% for 5 minutes
- Disk usage > 85%
- Database connections > 80% of max

**2. Create Dashboard:**

Key metrics to display:
- Request rate (req/min)
- Error rate (%)
- P50, P95, P99 latency
- Active users
- Database query time
- Cache hit rate

**3. Set up Log Aggregation:**

```bash
# CloudWatch Logs (AWS)
aws logs create-log-group --log-group-name /app/golf-tournament

# Or Papertrail, Logtail, etc.
```

### Documentation Updates

Update the following docs:

1. **Deployment Log:**
   ```markdown
   # Deployment Log

   ## 2025-01-15 - v1.0.0 Production Launch
   - Deployed to: Vercel
   - Database: Neon (us-east-1)
   - Domain: yourdomain.com
   - SSL: Auto (Let's Encrypt)
   - Monitoring: Sentry + UptimeRobot
   - Backups: Daily at 2 AM UTC
   ```

2. **Runbook:** Document common operational tasks

3. **Incident Response:** Update contact information and procedures

### Performance Baseline

Establish performance baselines:

```bash
# Load testing with k6
k6 run load-test.js

# Results:
# - P50 latency: 150ms
# - P95 latency: 350ms
# - P99 latency: 800ms
# - Max throughput: 500 req/s
# - Error rate: 0.01%
```

### Security Audit

**Post-Deployment Security Checklist:**

- [ ] SSL/TLS certificate valid and auto-renewing
- [ ] All secrets rotated from defaults
- [ ] Database not publicly accessible
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] CSP headers set
- [ ] Security headers (X-Frame-Options, etc.) set
- [ ] Dependency vulnerabilities scanned (`npm audit`)
- [ ] Firewall rules configured
- [ ] Backup and restore tested

---

## Summary

This deployment guide covers:

✅ **4 Platform Options**: Vercel, Railway, AWS, DigitalOcean
✅ **Complete Database Setup**: PostgreSQL, migrations, backups
✅ **External Services**: Stripe, Brevo, S3/R2
✅ **DNS & SSL**: Custom domains, wildcard subdomains
✅ **Cron Jobs**: Platform-specific configuration
✅ **Monitoring**: Sentry, uptime monitoring, logging
✅ **Security**: Rate limiting, CORS, CSP, secrets management
✅ **Performance**: CDN, caching, connection pooling
✅ **Disaster Recovery**: Backup strategy, RTO/RPO, restore procedures
✅ **Scaling**: Horizontal and vertical scaling strategies

**Recommended Path for First Deployment:**
1. Start with **Vercel** for easy deployment
2. Use **Neon** for PostgreSQL (serverless, great free tier)
3. Set up **Stripe** in test mode first
4. Configure **Brevo** for emails
5. Use **CloudFlare** for DNS and CDN
6. Add **Sentry** for error tracking
7. Set up **UptimeRobot** for monitoring
8. Test everything thoroughly before going live
9. Plan for scaling as you grow

**Next Steps:**
- See [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) for rapid deployment
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See [MONITORING.md](./MONITORING.md) for detailed monitoring setup
- See runbooks in `/docs/runbooks/` for operational procedures

---

**Questions or Issues?**
- GitHub Issues: [github.com/your-repo/issues](https://github.com)
- Email: support@yourdomain.com
- Documentation: [docs.yourdomain.com](https://docs.yourdomain.com)
