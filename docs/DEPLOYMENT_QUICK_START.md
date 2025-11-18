# Quick Start Deployment Guide

Get the Golf Tournament Management System deployed to production in under 30 minutes.

---

## Prerequisites

- [ ] GitHub account
- [ ] Domain name (optional, can use provided subdomain)
- [ ] Credit card for service signups (some have free tiers)

**Services You'll Need:**
1. **Vercel** (hosting) - Free tier available
2. **Neon** (database) - Free tier: 0.5 GB storage
3. **Stripe** (payments) - Free, pay per transaction
4. **Brevo** (emails) - Free tier: 300 emails/day

---

## Step 1: Database Setup (5 minutes)

### Create Neon PostgreSQL Database

1. **Sign up at [neon.tech](https://neon.tech)**
   - Click "Sign up" → Continue with GitHub (recommended)

2. **Create Database**
   - Click "Create Project"
   - Name: `golf-tournament-prod`
   - Region: Choose closest to your users
   - Postgres Version: 16
   - Click "Create Project"

3. **Get Connection String**
   - Copy the connection string (starts with `postgresql://`)
   - Example: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - **Save this - you'll need it in Step 3**

✅ **Database ready!**

---

## Step 2: Service Setup (10 minutes)

### A. Stripe (Payments)

1. **Sign up at [stripe.com](https://stripe.com)**
2. **Get API Keys**
   - Go to Developers → API Keys
   - Copy **Publishable key**: `pk_test_xxx`
   - Copy **Secret key**: `sk_test_xxx`
   - **Save these for Step 3**

3. **Enable Test Mode**
   - Toggle "Test mode" in top right
   - We'll use test mode initially

### B. Brevo (Emails)

1. **Sign up at [brevo.com](https://www.brevo.com)**
2. **Get API Key**
   - Go to Settings → SMTP & API → API Keys
   - Click "Generate a new API key"
   - Name: "Golf Tournament"
   - Copy key: `xkeysib-xxx`
   - **Save this for Step 3**

3. **Add Sender** (optional, can do later)
   - Settings → Senders & IP → Add a Sender
   - Email: `noreply@yourdomain.com`
   - Name: "Golf Club"

✅ **Services configured!**

---

## Step 3: Deploy to Vercel (10 minutes)

### A. Push Code to GitHub

If not already done:

```bash
# In your project directory
git add .
git commit -m "Initial commit"
git push origin main
```

### B. Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)**
   - Click "Sign Up" → Continue with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `pnpm build` (default is fine)
   - Output Directory: `.next` (default is fine)
   - Install Command: `pnpm install` (default is fine)

4. **Add Environment Variables**
   Click "Environment Variables" and add these:

   ```env
   # Database
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

   # NextAuth (generate secret below)
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=your-generated-secret-here

   # Brevo (from Step 2B)
   BREVO_API_KEY=xkeysib-xxx
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   BREVO_SENDER_NAME=Golf Club

   # Stripe (from Step 2A)
   STRIPE_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx

   # VAPID (generate below)
   VAPID_PUBLIC_KEY=your-generated-key
   VAPID_PRIVATE_KEY=your-generated-key
   VAPID_SUBJECT=mailto:admin@yourdomain.com

   # Cron (generate below)
   CRON_SECRET=your-random-secret

   # Multi-Club
   NEXT_PUBLIC_MAIN_DOMAIN=your-project.vercel.app
   ```

   **Generate Secrets:**

   ```bash
   # NEXTAUTH_SECRET
   openssl rand -base64 32

   # CRON_SECRET
   openssl rand -hex 32

   # VAPID Keys (from your project)
   pnpm generate-vapid
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - ✅ **Your app is live!**

### C. Run Database Migrations

After deployment, run migrations:

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm prisma migrate deploy

# Verify
pnpm prisma studio
```

Or use Vercel CLI:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Run migrations
vercel env pull .env.production
pnpm prisma migrate deploy
```

✅ **Database migrated!**

---

## Step 4: Configure Webhooks (5 minutes)

### Stripe Webhooks

1. **Get Your Webhook URL**
   - Your URL: `https://your-project.vercel.app/api/webhooks/stripe`

2. **Add Webhook in Stripe**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-project.vercel.app/api/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Click "Add endpoint"

3. **Get Webhook Secret**
   - Click on your webhook
   - Copy "Signing secret": `whsec_xxx`
   - Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET=whsec_xxx`
   - Redeploy to apply changes

### Brevo Webhooks (Optional)

1. Go to Brevo → Transactional → Settings → Webhooks
2. Add URL: `https://your-project.vercel.app/api/webhooks/brevo`
3. Select events: delivered, opened, clicked, bounced

✅ **Webhooks configured!**

---

## Step 5: Verification (5 minutes)

### Test Your Deployment

1. **Health Check**
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
   Expected: `{"status":"ok","database":"connected"}`

2. **Visit Your Site**
   - Open: `https://your-project.vercel.app`
   - ✅ Homepage loads

3. **Create Test User**
   - Click "Sign Up"
   - Create account with email/password
   - ✅ User created

4. **Create Test Tournament**
   - Click "Tournaments" → "Create Tournament"
   - Fill in details
   - ✅ Tournament created

5. **Test Payment Flow**
   - Try subscribing to a plan
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
   - ✅ Payment succeeds

✅ **Everything works!**

---

## Step 6: Custom Domain (Optional, 5 minutes)

### Add Your Domain

1. **In Vercel Dashboard**
   - Go to Project → Settings → Domains
   - Click "Add"
   - Enter: `yourdomain.com`
   - Click "Add"

2. **Configure DNS**
   - Vercel will show DNS records to add
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add the CNAME record:
     ```
     Type: CNAME
     Name: @  (or blank)
     Value: cname.vercel-dns.com
     ```

3. **Add Wildcard for Multi-Club**
   ```
   Type: CNAME
   Name: *
   Value: cname.vercel-dns.com
   ```

4. **Update Environment Variable**
   - In Vercel, update:
     ```env
     NEXTAUTH_URL=https://yourdomain.com
     NEXT_PUBLIC_MAIN_DOMAIN=yourdomain.com
     ```
   - Redeploy

5. **Wait for SSL**
   - Vercel auto-provisions SSL (1-5 minutes)
   - ✅ Your site is live on your domain!

---

## Step 7: Production Checklist

Before going live with real users:

### Required:

- [ ] **Switch Stripe to Live Mode**
  - Get live API keys from Stripe
  - Update `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Update webhook to use live mode

- [ ] **Configure Real Email Sender**
  - Verify your domain in Brevo
  - Add SPF/DKIM DNS records (provided by Brevo)

- [ ] **Set Up Monitoring**
  - Sign up for [Sentry](https://sentry.io) (error tracking)
  - Sign up for [UptimeRobot](https://uptimerobot.com) (uptime monitoring)
  - Add Sentry DSN to environment variables

- [ ] **Enable Backups**
  - Neon has automatic backups (check retention period)
  - Consider additional backup strategy

### Recommended:

- [ ] **Add CloudFlare** (Free)
  - Better DDoS protection
  - Faster global performance
  - Analytics

- [ ] **Create Email Templates** in Brevo
  - Registration confirmation
  - Tournament reminders
  - Results notifications

- [ ] **Set Up Cron Jobs** (Vercel Pro required, or use alternatives)
  - Notification reminders
  - Cleanup tasks

- [ ] **Load Testing**
  - Test with expected user load
  - Verify performance

---

## Common Issues

### Build Fails

**Error: `Cannot find module '@prisma/client'`**

Solution:
```bash
# Ensure Prisma generate runs during build
# Add to package.json:
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### Database Connection Fails

**Error: `Can't reach database server`**

Solutions:
1. Check DATABASE_URL is correct
2. Ensure `?sslmode=require` is in connection string
3. Verify Neon database is running (check dashboard)

### Prisma Migration Fails

**Error: `Environment variable not found: DATABASE_URL`**

Solution:
```bash
# Pull environment variables from Vercel
vercel env pull .env.production

# Then run migration
pnpm prisma migrate deploy
```

### Webhooks Not Working

**Stripe webhook returns 401**

Solution:
1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Check webhook signing (Stripe Dashboard → Developers → Webhooks → View logs)
3. Ensure webhook URL is correct: `https://yourdomain.com/api/webhooks/stripe`

---

## Next Steps

### Upgrade Your Setup

**From Free Tier to Production:**

1. **Upgrade Neon**
   - Free: 0.5 GB, 1 branch
   - Pro: $19/mo - 100 GB, unlimited branches, better performance

2. **Upgrade Vercel**
   - Free: Hobby use only
   - Pro: $20/mo/user - Commercial use, cron jobs, analytics

3. **Upgrade Brevo**
   - Free: 300 emails/day
   - Starter: $25/mo - 20,000 emails/mo, better deliverability

### Add More Features

- **Analytics**: Add Google Analytics or Plausible
- **Customer Support**: Add Intercom or Crisp chat
- **Documentation**: Create help docs for your users
- **Mobile App**: Build iOS/Android apps

### Scale Your Application

When you outgrow the quick start setup:

1. **Add Redis Cache**
   - [Upstash Redis](https://upstash.com) - Serverless Redis
   - Improves performance significantly

2. **Optimize Images**
   - Use CloudFlare Images or Imgix
   - Better image optimization than Next.js default

3. **Add Read Replicas**
   - Neon supports read replicas
   - Distribute read load

4. **Multi-Region Deployment**
   - Deploy to multiple Vercel regions
   - Better global performance

---

## Cost Breakdown

### Free Tier (Good for Testing)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Vercel | Hobby | $0 | Hobby use only |
| Neon | Free | $0 | 0.5 GB storage |
| Stripe | Pay-as-you-go | $0 | 2.9% + 30¢ per transaction |
| Brevo | Free | $0 | 300 emails/day |
| **Total** | | **$0/mo** | Good for 0-100 users |

### Small Production (1-1000 users)

| Service | Plan | Cost | Features |
|---------|------|------|----------|
| Vercel | Pro | $20 | Commercial use, cron jobs |
| Neon | Pro | $19 | 100 GB, better performance |
| Stripe | Pay-as-you-go | ~$50 | 2.9% + 30¢ per transaction |
| Brevo | Starter | $25 | 20K emails/month |
| CloudFlare | Free | $0 | CDN, DDoS protection |
| Sentry | Dev | $0 | 5K errors/month |
| **Total** | | **~$114/mo** | Good for 100-1000 active users |

### Medium Production (1000-10000 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Neon | Pro (scaled) | $50-100 |
| Stripe | Pay-as-you-go | ~$200 |
| Brevo | Business | $65 |
| CloudFlare | Pro | $20 |
| Sentry | Team | $26 |
| **Total** | | **~$381-431/mo** |

---

## Getting Help

### Documentation

- **Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **API Documentation**: [API.md](./API.md)
- **Features**: [FEATURES.md](./FEATURES.md)

### Support

- **GitHub Issues**: [github.com/your-repo/issues](https://github.com)
- **Email**: support@yourdomain.com
- **Discord**: [discord.gg/yourserver](https://discord.gg)

### Service Documentation

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Brevo**: [developers.brevo.com](https://developers.brevo.com)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)

---

## Summary

You've successfully deployed the Golf Tournament Management System!

**What you accomplished:**
✅ PostgreSQL database on Neon
✅ Application deployed on Vercel
✅ Stripe payments configured
✅ Brevo emails configured
✅ Webhooks set up
✅ Custom domain (optional)
✅ SSL certificate (automatic)

**Total time:** 30-45 minutes

**Your app is now:**
- 🌐 Live on the internet
- 🔒 Secured with SSL
- 📧 Sending emails
- 💳 Processing payments
- 📊 Ready for users

**Next actions:**
1. Test thoroughly with test data
2. Switch Stripe to live mode when ready
3. Invite your first real users
4. Monitor performance and errors
5. Scale as you grow

Happy deploying! ⛳
