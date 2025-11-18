# Best Practices Guide

Best practices for developing, deploying, and maintaining the Golf Tournament Management System.

## Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Security Best Practices](#security-best-practices)
3. [Accessibility Guidelines](#accessibility-guidelines)
4. [SEO Optimization](#seo-optimization)
5. [Error Handling](#error-handling)
6. [Logging and Monitoring](#logging-and-monitoring)
7. [Testing Strategies](#testing-strategies)
8. [Code Quality](#code-quality)
9. [Deployment](#deployment)
10. [Maintenance](#maintenance)

---

## Performance Optimization

### Next.js Optimization

**Use Server Components by Default**:
```typescript
// ✅ Good: Server Component (default)
export default async function TournamentList() {
  const tournaments = await getTournaments()
  return <div>{tournaments.map(...)}</div>
}

// ❌ Bad: Unnecessary Client Component
'use client'
export default function TournamentList() {
  const [tournaments, setTournaments] = useState([])
  useEffect(() => { fetchTournaments() }, [])
  return <div>{tournaments.map(...)}</div>
}
```

**Image Optimization**:
```typescript
import Image from 'next/image'

// ✅ Good: Optimized images
<Image
  src="/tournament-photo.jpg"
  alt="Tournament photo"
  width={800}
  height={600}
  priority  // For above-the-fold images
/>

// ❌ Bad: Regular img tag
<img src="/tournament-photo.jpg" alt="Tournament photo" />
```

**Dynamic Imports**:
```typescript
import dynamic from 'next/dynamic'

// Lazy load heavy components
const PhotoGallery = dynamic(() => import('@/components/gallery/photo-gallery'), {
  loading: () => <Spinner />,
  ssr: false,  // If not needed on server
})
```

**Route Caching**:
```typescript
// app/tournaments/[id]/page.tsx
export const revalidate = 60  // Revalidate every 60 seconds

export default async function TournamentPage({ params }) {
  const tournament = await getTournament(params.id)
  return <div>...</div>
}
```

### Database Optimization

**Query Optimization**:
```typescript
// ✅ Good: Eager loading with include
const tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    registrations: {
      include: { player: true },
      where: { status: 'CONFIRMED' },
    },
  },
})

// ❌ Bad: N+1 query problem
const tournament = await prisma.tournament.findUnique({ where: { id } })
const registrations = await Promise.all(
  tournament.registrationIds.map(id =>
    prisma.registration.findUnique({ where: { id } })
  )
)
```

**Connection Pooling**:
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Index Usage**:
```prisma
model Tournament {
  id     String   @id
  status String
  date   DateTime

  @@index([status, date])  // Composite index for common queries
}
```

### Frontend Performance

**Bundle Size**:
```bash
# Analyze bundle size
pnpm build
# Check .next/analyze/ output
```

**Code Splitting**:
```typescript
// Split by route automatically (Next.js default)
// Split heavy libraries
const Chart = dynamic(() => import('recharts').then(mod => mod.LineChart))
```

**Memoization**:
```typescript
import { memo, useMemo, useCallback } from 'react'

// Memo expensive calculations
const expensiveValue = useMemo(() => {
  return calculateStablefordPoints(scores)
}, [scores])

// Memo callbacks
const handleClick = useCallback(() => {
  console.log('Clicked')
}, [])

// Memo components
const TournamentCard = memo(({ tournament }) => {
  return <Card>...</Card>
})
```

---

## Security Best Practices

### Authentication & Authorization

**Always Check Permissions**:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with delete
}
```

**Protect API Routes**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')

  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

### Input Validation

**Always Validate Input**:
```typescript
import { z } from 'zod'

const TournamentSchema = z.object({
  name: z.string().min(3).max(200),
  email: z.string().email(),
  handicapIndex: z.number().min(-10).max(54),
})

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const validated = TournamentSchema.parse(body)
    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 })
    }
  }
}
```

**SQL Injection Protection**:
```typescript
// ✅ Good: Parameterized queries (Prisma does this automatically)
await prisma.player.findMany({
  where: { email: userInput },
})

// ❌ Bad: String concatenation (DON'T DO THIS)
await prisma.$queryRaw(`SELECT * FROM Player WHERE email = '${userInput}'`)
```

**XSS Protection**:
```typescript
// React escapes by default, but be careful with dangerouslySetInnerHTML
// ✅ Good
<div>{userInput}</div>

// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// If you must use HTML, sanitize it
import DOMPurify from 'isomorphic-dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Environment Variables

**Never Commit Secrets**:
```bash
# ✅ Good: Use .env (gitignored)
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_..."

# ❌ Bad: Hardcoded secrets
const stripeKey = "sk_live_123..."  // NEVER DO THIS
```

**Validate Environment**:
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
})

export const env = envSchema.parse(process.env)
```

### CSRF Protection

Next.js and NextAuth.js handle CSRF automatically for form submissions and API routes.

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
})

export async function POST(request: Request) {
  // Apply rate limiting
  await limiter(request)

  // Process request
}
```

---

## Accessibility Guidelines

### Semantic HTML

```typescript
// ✅ Good: Semantic HTML
<article>
  <header>
    <h1>Tournament Name</h1>
  </header>
  <main>
    <section>
      <h2>Details</h2>
      <p>...</p>
    </section>
  </main>
</article>

// ❌ Bad: Divs everywhere
<div>
  <div>Tournament Name</div>
  <div>
    <div>Details</div>
    <div>...</div>
  </div>
</div>
```

### ARIA Labels

```typescript
// Buttons with icons
<button aria-label="Delete tournament">
  <TrashIcon />
</button>

// Navigation
<nav aria-label="Main navigation">
  <ul>...</ul>
</nav>

// Forms
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" />
```

### Keyboard Navigation

```typescript
// Ensure all interactive elements are keyboard accessible
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  onClick={handleClick}
>
  Click me
</div>
```

### Color Contrast

Use WCAG AA compliant color contrast (4.5:1 for normal text, 3:1 for large text).

```typescript
// ✅ Good: High contrast
<div className="bg-white text-gray-900">Content</div>

// ❌ Bad: Low contrast
<div className="bg-gray-200 text-gray-300">Content</div>
```

### Screen Readers

```typescript
// Announce dynamic content
<div role="status" aria-live="polite">
  {scoreUpdated && 'Score updated successfully'}
</div>

// Hide decorative content
<img src="/decorative.jpg" alt="" role="presentation" />

// Screen reader only text
<span className="sr-only">
  Tournament status: {tournament.status}
</span>
```

---

## SEO Optimization

### Metadata

```typescript
// app/tournaments/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const tournament = await getTournament(params.id)

  return {
    title: `${tournament.name} | Golf Tournament`,
    description: tournament.description,
    openGraph: {
      title: tournament.name,
      description: tournament.description,
      images: [tournament.imageUrl],
    },
  }
}
```

### Structured Data

```typescript
export default function TournamentPage({ tournament }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    startDate: tournament.tournamentDate,
    location: {
      '@type': 'Place',
      name: tournament.course.name,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div>...</div>
    </>
  )
}
```

### Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tournaments = await getTournaments()

  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
    },
    {
      url: 'https://example.com/tournaments',
      lastModified: new Date(),
    },
    ...tournaments.map(t => ({
      url: `https://example.com/tournaments/${t.id}`,
      lastModified: t.updatedAt,
    })),
  ]
}
```

---

## Error Handling

### API Error Handling

```typescript
export async function POST(request: Request) {
  try {
    // Validate input
    const body = await request.json()
    const validated = schema.parse(body)

    // Business logic
    const result = await createTournament(validated)

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.format() },
        { status: 400 }
      )
    }

    // Domain errors
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Unknown errors
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Error Boundaries

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
```

### Global Error Handler

```typescript
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Application Error</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

---

## Logging and Monitoring

### Structured Logging

```typescript
interface LogContext {
  userId?: string
  tournamentId?: string
  action: string
  [key: string]: any
}

function log(level: 'info' | 'warn' | 'error', message: string, context?: LogContext) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, LogRocket)
    console.log(JSON.stringify(logEntry))
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context)
  }
}

// Usage
log('info', 'Tournament created', {
  action: 'create_tournament',
  tournamentId: tournament.id,
  userId: user.id,
})
```

### Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

export function trackError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    })
  } else {
    console.error('Error:', error, context)
  }
}

// Usage
try {
  await createTournament(data)
} catch (error) {
  trackError(error as Error, {
    action: 'create_tournament',
    data,
  })
  throw error
}
```

### Performance Monitoring

```typescript
// Measure critical operations
export async function getTournamentLeaderboard(tournamentId: string) {
  const startTime = Date.now()

  try {
    const leaderboard = await calculateLeaderboard(tournamentId)

    const duration = Date.now() - startTime
    log('info', 'Leaderboard calculated', {
      tournamentId,
      duration,
      playerCount: leaderboard.length,
    })

    return leaderboard
  } catch (error) {
    trackError(error as Error, {
      tournamentId,
      duration: Date.now() - startTime,
    })
    throw error
  }
}
```

---

## Testing Strategies

### Test Pyramid

```
     /\
    /E2E\       10% - End-to-end tests (slow, expensive)
   /______\
  /        \
 /Integration\ 20% - Integration tests (medium speed)
/____________\
/              \
/  Unit Tests   \ 70% - Unit tests (fast, cheap)
/________________\
```

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { Tournament } from '@/domain/entities/tournament'

describe('Tournament', () => {
  describe('openForRegistration', () => {
    it('should change status from DRAFT to OPEN_FOR_REGISTRATION', () => {
      const tournament = createTestTournament({ status: 'DRAFT' })

      tournament.openForRegistration()

      expect(tournament.getStatus()).toBe('OPEN_FOR_REGISTRATION')
    })

    it('should throw error if not in DRAFT status', () => {
      const tournament = createTestTournament({ status: 'COMPLETED' })

      expect(() => {
        tournament.openForRegistration()
      }).toThrow('Can only open draft tournaments')
    })
  })
})
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('POST /api/tournaments', () => {
  beforeEach(async () => {
    await prisma.tournament.deleteMany()
  })

  afterEach(async () => {
    await prisma.tournament.deleteMany()
  })

  it('should create tournament with valid data', async () => {
    const response = await fetch('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(validTournamentData),
    })

    expect(response.status).toBe(201)
    const tournament = await response.json()
    expect(tournament.data.name).toBe(validTournamentData.name)

    // Verify in database
    const dbTournament = await prisma.tournament.findUnique({
      where: { id: tournament.data.id },
    })
    expect(dbTournament).not.toBeNull()
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('create tournament flow', async ({ page }) => {
  // Navigate to create page
  await page.goto('/tournaments/new')

  // Fill form
  await page.fill('[name="name"]', 'E2E Test Tournament')
  await page.selectOption('[name="format"]', 'STABLEFORD')
  await page.fill('[name="tournamentDate"]', '2025-06-15')

  // Submit
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page).toHaveURL(/\/tournaments\/\w+/)
  await expect(page.locator('h1')).toContainText('E2E Test Tournament')
})
```

---

## Code Quality

### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pre-commit Hooks

```bash
# Install husky
pnpm add -D husky lint-staged

# .husky/pre-commit
#!/bin/sh
pnpm lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate configured
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured
- [ ] Performance monitoring enabled
- [ ] Backups configured
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set

### Docker Deployment

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment-Specific Configuration

```typescript
// lib/config.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableErrorTracking: process.env.NODE_ENV === 'production',
}
```

---

## Maintenance

### Database Backups

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250115.sql
```

### Monitoring

Monitor:
- API response times
- Error rates
- Database query performance
- Memory usage
- Disk space
- SSL certificate expiration

### Updates

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Update Next.js
pnpm update next react react-dom

# Update Prisma
pnpm update prisma @prisma/client
pnpm prisma generate
```

---

*Last Updated: 2025-01-15*
