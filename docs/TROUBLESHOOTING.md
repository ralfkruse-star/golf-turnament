# Troubleshooting Guide

Common issues and solutions for the Golf Tournament Management System.

---

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Database Issues](#database-issues)
3. [Application Errors](#application-errors)
4. [External Service Issues](#external-service-issues)
5. [Performance Issues](#performance-issues)
6. [Authentication Issues](#authentication-issues)
7. [Email Issues](#email-issues)
8. [Payment Issues](#payment-issues)
9. [Photo Upload Issues](#photo-upload-issues)
10. [Push Notification Issues](#push-notification-issues)

---

## Deployment Issues

### Build Fails with "Cannot find module '@prisma/client'"

**Symptoms:**
```
Error: Cannot find module '@prisma/client'
```

**Cause:** Prisma client not generated during build

**Solution:**

Update `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

Or ensure build command includes generation:
```bash
pnpm install && pnpm prisma generate && pnpm build
```

---

### Build Succeeds but Runtime Error

**Symptoms:**
- Build completes
- Application crashes on startup
- Error in logs: "MODULE_NOT_FOUND"

**Cause:** Dependency not installed or wrong NODE_ENV

**Solution:**

```bash
# Check installed dependencies
pnpm list

# Verify NODE_ENV
echo $NODE_ENV
# Should be "production"

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile

# Rebuild
pnpm build
```

---

### Vercel Deployment Times Out

**Symptoms:**
- Build exceeds time limit (45 seconds free, 15 min paid)

**Causes:**
- Large dependencies
- Complex build process
- Database migration during build

**Solutions:**

1. **Optimize build:**
   ```json
   // next.config.ts
   {
     "experimental": {
       "optimizePackageImports": ["lucide-react"]
     }
   }
   ```

2. **Move migrations out of build:**
   - Run migrations separately
   - Use deployment hooks

3. **Upgrade Vercel plan** (if needed)

---

### Environment Variables Not Working

**Symptoms:**
- Variables undefined at runtime
- Config errors

**Debugging:**

```typescript
// Check if variable exists
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')

// List all env vars (be careful not to expose secrets!)
console.log('Env vars:', Object.keys(process.env).sort())
```

**Solutions:**

1. **Verify variable naming:**
   - Client variables MUST start with `NEXT_PUBLIC_`
   - Server variables don't need prefix

2. **Check platform:**
   - Vercel: Settings → Environment Variables
   - Railway: Variables tab
   - Docker: .env file or docker-compose

3. **Redeploy after changes:**
   - Env changes require redeployment
   - Restart services

---

## Database Issues

### "Connection refused" or "ECONNREFUSED"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causes:**
1. Database not running
2. Wrong host/port
3. Firewall blocking connection
4. Wrong DATABASE_URL

**Solutions:**

```bash
# Check if database is running
docker-compose ps db
# Or
sudo systemctl status postgresql

# Test connection
psql -h <host> -p <port> -U <user> -d <database>

# Verify DATABASE_URL
echo $DATABASE_URL
# Format: postgresql://user:pass@host:port/database

# Check firewall
telnet <host> 5432
# Or
nc -zv <host> 5432

# Fix DATABASE_URL
# Correct format examples:
# Local: postgresql://postgres:postgres@localhost:5432/golf_tournament
# Neon: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
# Supabase: postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?pgbouncer=true
```

---

### "Too many connections"

**Symptoms:**
```
Error: sorry, too many clients already
```

**Cause:** Connection pool exhausted

**Immediate Fix:**

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'golf_tournament';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'golf_tournament'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
```

**Long-term Solutions:**

1. **Use connection pooling (PgBouncer):**
   ```bash
   # Install PgBouncer
   sudo apt-get install pgbouncer

   # Configure
   # /etc/pgbouncer/pgbouncer.ini
   [databases]
   golf_tournament = host=localhost port=5432 dbname=golf_tournament

   [pgbouncer]
   pool_mode = transaction
   max_client_conn = 1000
   default_pool_size = 20
   ```

2. **Increase max_connections:**
   ```sql
   -- Check current max
   SHOW max_connections;

   -- Increase (requires restart)
   ALTER SYSTEM SET max_connections = 200;
   -- Then restart PostgreSQL
   ```

3. **Limit connections in DATABASE_URL:**
   ```
   postgresql://user:pass@host:5432/db?connection_limit=10
   ```

---

### Slow Database Queries

**Symptoms:**
- Requests timing out
- High P95/P99 latency
- Database CPU at 100%

**Diagnosis:**

```sql
-- Find slow queries
SELECT
  calls,
  mean_exec_time,
  max_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

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

-- Find table scans (bad performance)
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;
```

**Solutions:**

1. **Add indexes:**
   ```sql
   -- Create index concurrently (no table lock)
   CREATE INDEX CONCURRENTLY idx_tournament_status
     ON "Tournament"(status);

   CREATE INDEX CONCURRENTLY idx_tournament_date
     ON "Tournament"("tournamentDate");

   -- Composite index
   CREATE INDEX CONCURRENTLY idx_tournament_status_date
     ON "Tournament"(status, "tournamentDate");
   ```

2. **Optimize queries:**
   ```typescript
   // Bad: N+1 query problem
   const tournaments = await prisma.tournament.findMany()
   for (const t of tournaments) {
     const players = await prisma.player.findMany({
       where: { tournamentId: t.id }
     })
   }

   // Good: Use include
   const tournaments = await prisma.tournament.findMany({
     include: {
       players: true
     }
   })
   ```

3. **Add database caching:**
   ```typescript
   import { redis } from '@/lib/redis'

   async function getTournament(id: string) {
     // Check cache
     const cached = await redis.get(`tournament:${id}`)
     if (cached) return JSON.parse(cached)

     // Query database
     const tournament = await prisma.tournament.findUnique({ where: { id } })

     // Cache for 5 minutes
     await redis.setex(`tournament:${id}`, 300, JSON.stringify(tournament))

     return tournament
   }
   ```

---

### Migration Fails

**Symptoms:**
```
Error: P3005 The database schema is not empty
```

**Solutions:**

```bash
# Option 1: Force reset (DEV ONLY!)
pnpm prisma migrate reset

# Option 2: Resolve migration status
pnpm prisma migrate resolve --applied <migration_name>
# Or
pnpm prisma migrate resolve --rolled-back <migration_name>

# Option 3: Manual fix
psql -d golf_tournament
# Fix conflicts manually
# Then mark migration as applied
pnpm prisma migrate resolve --applied <migration_name>

# Option 4: Fresh database
# Backup data first!
dropdb golf_tournament
createdb golf_tournament
pnpm prisma migrate deploy
```

---

## Application Errors

### 500 Internal Server Error

**Symptoms:**
- Generic 500 error
- No specific error message

**Debugging:**

```bash
# Check application logs
tail -100 /var/log/golf-tournament/app.log

# Or platform logs
vercel logs
railway logs

# Check Sentry
# Look for recent errors

# Enable debug logging
export LOG_LEVEL=debug
pnpm start
```

**Common Causes:**

1. **Unhandled promise rejection:**
   ```typescript
   // Bad
   async function handler() {
     const data = await fetch('/api')
     // If fetch fails, unhandled rejection!
   }

   // Good
   async function handler() {
     try {
       const data = await fetch('/api')
     } catch (error) {
       console.error('Fetch failed:', error)
       throw error // Or handle gracefully
     }
   }
   ```

2. **Missing environment variable:**
   ```typescript
   // Add validation
   if (!process.env.DATABASE_URL) {
     throw new Error('DATABASE_URL is required')
   }
   ```

---

### "CORS policy" Error

**Symptoms:**
```
Access to fetch at 'https://api.yourdomain.com' from origin 'https://yourdomain.com'
has been blocked by CORS policy
```

**Solution:**

Add CORS headers in API routes:

```typescript
// app/api/tournaments/route.ts
export async function GET(request: Request) {
  const response = await getTournaments()

  return new NextResponse(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Or specific domain
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}

// Handle OPTIONS request
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
```

Or use middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}
```

---

### Memory Leak / High Memory Usage

**Symptoms:**
- Memory usage growing over time
- Application crashes with "JavaScript heap out of memory"

**Diagnosis:**

```bash
# Check memory usage
docker stats

# Or Node.js memory
node --max-old-space-size=4096 app.js

# Enable heap snapshot
node --inspect app.js
# Connect Chrome DevTools
```

**Common Causes:**

1. **Event listener leaks:**
   ```typescript
   // Bad
   useEffect(() => {
     window.addEventListener('resize', handleResize)
     // Missing cleanup!
   })

   // Good
   useEffect(() => {
     window.addEventListener('resize', handleResize)
     return () => {
       window.removeEventListener('resize', handleResize)
     }
   }, [])
   ```

2. **Large data in memory:**
   ```typescript
   // Bad: Loading all tournaments in memory
   const tournaments = await prisma.tournament.findMany()

   // Good: Paginate
   const tournaments = await prisma.tournament.findMany({
     take: 20,
     skip: page * 20
   })
   ```

3. **Connection leaks:**
   ```typescript
   // Always close connections
   try {
     const result = await fetch('/api')
   } finally {
     // Clean up
   }
   ```

---

## External Service Issues

### Stripe Webhook Verification Failed

**Symptoms:**
```
Webhook signature verification failed
```

**Causes:**
1. Wrong webhook secret
2. Request body consumed before verification
3. Incorrect webhook endpoint configuration

**Solution:**

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  // Get raw body (important!)
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle checkout
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
```

**Verify webhook in Stripe Dashboard:**
- Go to Webhooks
- Click on your endpoint
- Check "Recent events" tab
- Review failure logs

---

### Brevo Email Not Sending

**Symptoms:**
- Emails not received
- API returns success but no email

**Debugging:**

```typescript
// Test Brevo connection
import { ApiClient } from '@getbrevo/brevo'

const client = new ApiClient()
client.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY

// Test account
const accountApi = new AccountApi(client)
const account = await accountApi.getAccount()
console.log('Brevo account:', account)

// Send test email
const transactionalEmailsApi = new TransactionalEmailsApi(client)
const result = await transactionalEmailsApi.sendTransacEmail({
  sender: {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME
  },
  to: [{ email: 'test@example.com' }],
  subject: 'Test Email',
  htmlContent: '<p>Test</p>'
})
console.log('Email result:', result)
```

**Common Issues:**

1. **Sender not verified:**
   - Go to Brevo → Settings → Senders & IP
   - Verify sender email/domain

2. **API key wrong environment:**
   - Check if using test vs production key
   - Verify key hasn't expired

3. **Rate limit exceeded:**
   - Check plan limits
   - Review sending rate

4. **Email in spam:**
   - Set up SPF/DKIM records
   - Improve email content
   - Check sender reputation

---

## Performance Issues

### Slow Page Load

**Symptoms:**
- Pages taking > 3 seconds to load
- Poor Lighthouse scores

**Diagnosis:**

```bash
# Measure performance
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# curl-format.txt
time_namelookup: %{time_namelookup}\n
time_connect: %{time_connect}\n
time_appconnect: %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect: %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total: %{time_total}\n

# Use Chrome DevTools
# Network tab → Disable cache → Reload
# Check waterfall for bottlenecks
```

**Solutions:**

1. **Optimize images:**
   ```typescript
   import Image from 'next/image'

   // Use Next.js Image component
   <Image
     src="/photo.jpg"
     width={800}
     height={600}
     alt="Tournament"
     priority // For above-the-fold images
   />
   ```

2. **Code splitting:**
   ```typescript
   // Dynamic import
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Spinner />,
     ssr: false // If not needed for SEO
   })
   ```

3. **Cache static assets:**
   ```typescript
   // next.config.ts
   {
     async headers() {
       return [
         {
           source: '/_next/static/:path*',
           headers: [
             {
               key: 'Cache-Control',
               value: 'public, max-age=31536000, immutable'
             }
           ]
         }
       ]
     }
   }
   ```

4. **Use CDN:**
   - Enable CloudFlare
   - Use Vercel's edge network
   - Cache API responses

---

### High API Latency

**Symptoms:**
- API responses > 500ms
- Timeout errors

**Diagnosis:**

```typescript
// Add timing logs
const start = Date.now()

// Your API logic
const result = await prisma.tournament.findMany()

console.log(`Query took: ${Date.now() - start}ms`)
```

**Solutions:**

1. **Database query optimization** (see Database Issues)

2. **Add caching:**
   ```typescript
   // Cache GET responses
   export const revalidate = 60 // 60 seconds

   export async function GET() {
     const data = await fetchData()
     return Response.json(data)
   }
   ```

3. **Parallel requests:**
   ```typescript
   // Bad: Sequential
   const tournaments = await getTournaments()
   const players = await getPlayers()

   // Good: Parallel
   const [tournaments, players] = await Promise.all([
     getTournaments(),
     getPlayers()
   ])
   ```

---

## Authentication Issues

### "Invalid credentials" Error

**Symptoms:**
- Cannot log in
- Correct password rejected

**Debugging:**

```typescript
// Check hashed password
import bcrypt from 'bcryptjs'

const password = 'user-password'
const hashedFromDB = '...'

const isMatch = await bcrypt.compare(password, hashedFromDB)
console.log('Password match:', isMatch)
```

**Common Issues:**

1. **Case sensitivity:**
   - Emails are case-insensitive
   - Ensure lowercase comparison

2. **Whitespace:**
   - Trim input: `email.trim().toLowerCase()`

3. **Wrong user table:**
   - Verify querying correct table
   - Check user exists

---

### Session Expires Too Quickly

**Symptoms:**
- Users logged out frequently

**Solution:**

```typescript
// next-auth configuration
export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
}
```

---

## Email Issues

### Emails Going to Spam

**Causes:**
- No SPF/DKIM records
- Poor sender reputation
- Spam-like content

**Solutions:**

1. **Set up SPF:**
   ```
   TXT @ "v=spf1 include:spf.sendinblue.com mx ~all"
   ```

2. **Set up DKIM** (provided by Brevo)

3. **Improve content:**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use plain text alternative
   - Balance text/image ratio

4. **Warm up domain:**
   - Start with small send volumes
   - Gradually increase

---

## Payment Issues

### Payment Declined

**User-facing message:**
```
Your payment was declined. Please try a different payment method or contact your bank.
```

**Common Causes:**
1. Insufficient funds
2. Card expired
3. Incorrect CVC
4. Address mismatch
5. Card declined by issuer

**Testing:**
Use Stripe test cards:
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- Insufficient funds: 4000 0000 0000 9995

---

## Photo Upload Issues

### "File too large"

**Solution:**

```typescript
// Increase limit in API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}

// Or use middleware to check size
export async function POST(request: Request) {
  const contentLength = request.headers.get('content-length')
  if (parseInt(contentLength!) > 10 * 1024 * 1024) {
    return new Response('File too large', { status: 413 })
  }
}
```

---

### Image Upload to S3 Fails

**Symptoms:**
```
AccessDenied: Access Denied
```

**Solutions:**

1. **Check IAM permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::golf-tournament-photos/*"
       }
     ]
   }
   ```

2. **Verify credentials:**
   ```bash
   aws s3 ls s3://golf-tournament-photos/
   ```

3. **Check CORS:**
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com"],
       "AllowedMethods": ["PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

---

## Push Notification Issues

### Notifications Not Received

**Debugging:**

```typescript
// Test subscription
const subscription = await registration.pushManager.getSubscription()
console.log('Subscription:', subscription)

// Test sending
await fetch('/api/push/test', {
  method: 'POST',
  body: JSON.stringify({ subscription })
})
```

**Common Issues:**

1. **VAPID keys wrong:**
   - Regenerate: `pnpm generate-vapid`
   - Update environment variables
   - Redeploy

2. **Service worker not registered:**
   ```typescript
   // Check registration
   if ('serviceWorker' in navigator) {
     const registration = await navigator.serviceWorker.register('/sw.js')
     console.log('SW registered:', registration)
   }
   ```

3. **Permissions denied:**
   - User must grant permission
   - Check browser settings
   - Some browsers block in incognito mode

---

## Getting Help

### Before Asking for Help

1. **Check logs:**
   - Application logs
   - Database logs
   - Platform logs (Vercel/Railway)
   - Sentry errors

2. **Review recent changes:**
   - Deployments
   - Config changes
   - Database migrations

3. **Search existing issues:**
   - GitHub issues
   - Stack Overflow
   - Documentation

### When Asking for Help

**Include:**
- **What you're trying to do**
- **What's happening** (error messages, logs)
- **What you've tried**
- **Environment** (platform, versions)
- **Relevant code** (formatted, minimal example)

**Good Issue Report:**
```markdown
## Problem
Users can't submit scorecards. Getting 500 error.

## Error Message
```
Error: Cannot read property 'id' of undefined
  at submitScorecard (scorecard.ts:45)
```

## Environment
- Platform: Vercel
- Node: 20.x
- Next.js: 14.2.22
- Database: Neon PostgreSQL

## Steps to Reproduce
1. Create tournament
2. Register player
3. Try to submit scorecard
4. Error occurs

## What I've Tried
- Checked database connection (working)
- Reviewed Sentry logs
- Tested locally (works fine)
- Deployed to staging (same error)

## Code
```typescript
// scorecard.ts:45
const tournament = await prisma.tournament.findUnique({
  where: { id: scorecardData.tournamentId }
})
// tournament is undefined here
```
```

---

## Support Channels

- **Documentation:** [/docs](/docs)
- **GitHub Issues:** [github.com/your-repo/issues](https://github.com)
- **Discord:** [discord.gg/yourserver](https://discord.gg)
- **Email:** support@yourdomain.com

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Owner:** Engineering Team
