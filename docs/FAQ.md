# FAQ & Troubleshooting Guide

Frequently asked questions and common issues with solutions.

## Table of Contents

- [General Questions](#general-questions)
- [Development Setup](#development-setup)
- [Common Errors](#common-errors)
- [Database Issues](#database-issues)
- [API Issues](#api-issues)
- [Testing Issues](#testing-issues)
- [Deployment Issues](#deployment-issues)
- [Performance](#performance)

---

## General Questions

### How do I add a new feature?

Follow the TDD approach:

1. **Write tests first** for the feature
2. **Implement domain logic** in `/domain`
3. **Create API endpoint** in `/app/api`
4. **Build UI components** in `/components` or `/app`
5. **Update documentation**

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md#adding-new-features) for detailed steps.

### Why Domain-Driven Design?

DDD provides:
- Clear separation of concerns
- Testable business logic
- Maintainable codebase
- Scalable architecture

Domain logic in `/domain` is framework-independent and fully testable.

### How is authentication handled?

We use NextAuth.js v5:
- Session-based authentication
- Multiple providers (Email, OAuth)
- Role-based access control
- Secure session management

See [Authentication docs](./API_REFERENCE.md#authentication).

### Can I use this for multiple clubs?

Yes! Phase 4 implements multi-club support with:
- Club-specific branding
- Feature flags per subscription tier
- Data isolation
- Custom domains

See [ADR-003: Multi-Tenancy](./architecture/ADR-003-multi-tenancy.md).

---

## Development Setup

### "Command not found: pnpm"

**Solution**: Install pnpm globally:

```bash
npm install -g pnpm@latest
```

Or enable with corepack (Node 16.13+):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### "Cannot connect to database"

**Solution**: Ensure PostgreSQL is running:

**Using Docker**:
```bash
docker-compose up -d db
docker-compose ps  # Verify it's running
```

**Using local PostgreSQL**:
```bash
# Mac
brew services start postgresql@16

# Linux
sudo systemctl start postgresql

# Check connection
psql -U postgres -d golf_tournament
```

Verify `DATABASE_URL` in `.env` is correct.

### "Module not found" errors after pull

**Solution**: Reinstall dependencies:

```bash
rm -rf node_modules
pnpm install
```

Also regenerate Prisma Client:

```bash
pnpm prisma generate
```

### TypeScript errors in VSCode

**Solution**: Restart TypeScript server:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "TypeScript: Restart TS Server"
3. Select and run

If that doesn't help:
```bash
pnpm type-check
```

### "Next.js cache causing issues"

**Solution**: Clear Next.js cache:

```bash
rm -rf .next
pnpm dev
```

---

## Common Errors

### Error: "Prisma schema validation failed"

**Cause**: Invalid Prisma schema syntax

**Solution**:

1. Check `prisma/schema.prisma` for syntax errors
2. Ensure all relations are properly defined
3. Run validation:

```bash
pnpm prisma validate
```

4. If valid, regenerate client:

```bash
pnpm prisma generate
```

### Error: "Cannot find module '@/...' "

**Cause**: Import path alias not resolved

**Solution**:

1. Check `tsconfig.json` has path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. Restart TypeScript server (see above)

### Error: "Hydration mismatch"

**Cause**: Server-rendered HTML doesn't match client render

**Common causes**:
- Using `localStorage` in Server Component
- Random values without seed
- Date formatting differences

**Solution**:

1. Move client-side logic to Client Component:

```typescript
'use client'  // Add this directive

export function MyComponent() {
  // Now can use localStorage, etc.
}
```

2. For dates, use consistent formatting:

```typescript
import { format } from 'date-fns'

// ✅ Good: Consistent formatting
const formatted = format(date, 'yyyy-MM-dd')

// ❌ Bad: May differ between server and client
const formatted = date.toLocaleDateString()
```

### Error: "Zod validation failed"

**Cause**: Input data doesn't match schema

**Solution**:

1. Check error details:

```typescript
try {
  const validated = schema.parse(input)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.format())  // See which fields failed
  }
}
```

2. Ensure input data matches expected types:

```typescript
const TournamentSchema = z.object({
  name: z.string().min(3),  // Must be string with 3+ chars
  maxPlayers: z.number().int().positive().optional(),  // Must be positive integer or undefined
})
```

---

## Database Issues

### "Migration failed" error

**Cause**: Schema change conflicts with existing data

**Solution**:

**Development**:
```bash
# Reset database (LOSES DATA)
pnpm prisma migrate reset

# Or create new migration
pnpm prisma migrate dev --create-only
# Edit migration SQL if needed
pnpm prisma migrate dev
```

**Production**:
```bash
# NEVER use migrate reset in production!
# Create data migration if needed
pnpm prisma migrate deploy
```

### "Foreign key constraint violation"

**Cause**: Trying to reference non-existent record

**Solution**:

1. Check that referenced record exists:

```typescript
// ❌ Bad: Assumes tournament exists
await prisma.registration.create({
  data: {
    tournamentId: 'nonexistent-id',  // Error!
    playerId: 'player-123',
  },
})

// ✅ Good: Verify tournament exists first
const tournament = await prisma.tournament.findUnique({
  where: { id: tournamentId },
})

if (!tournament) {
  throw new Error('Tournament not found')
}

await prisma.registration.create({
  data: {
    tournamentId: tournament.id,
    playerId: 'player-123',
  },
})
```

### Database is slow

**Solution**:

1. **Check for missing indexes**:

```prisma
model Player {
  email String

  @@index([email])  // Add index for frequently queried fields
}
```

2. **Use `select` to fetch only needed fields**:

```typescript
// ✅ Good: Fetch only needed fields
const players = await prisma.player.findMany({
  select: { id: true, firstName: true, lastName: true },
})

// ❌ Bad: Fetches all fields
const players = await prisma.player.findMany()
```

3. **Use database aggregations**:

```typescript
// ✅ Good: Aggregate in database
const count = await prisma.tournament.count({
  where: { status: 'OPEN_FOR_REGISTRATION' },
})

// ❌ Bad: Fetch all and count in memory
const tournaments = await prisma.tournament.findMany({
  where: { status: 'OPEN_FOR_REGISTRATION' },
})
const count = tournaments.length
```

4. **Analyze queries**:

```sql
EXPLAIN ANALYZE SELECT * FROM "Tournament" WHERE status = 'OPEN_FOR_REGISTRATION';
```

---

## API Issues

### API route returns 404

**Cause**: Route file not named correctly or in wrong location

**Solution**:

API routes must be named `route.ts`:

```
✅ app/api/tournaments/route.ts
✅ app/api/tournaments/[id]/route.ts
❌ app/api/tournaments/index.ts
❌ app/api/tournaments/[id].ts
```

### CORS errors

**Cause**: Making requests from different origin without CORS headers

**Solution**:

Add CORS headers to API routes:

```typescript
export async function GET(request: Request) {
  const response = NextResponse.json({ data: '...' })

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')

  return response
}
```

Or use middleware for all routes.

### "Session is null" in API route

**Cause**: Session not available in API route

**Solution**:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use session.user
}
```

---

## Testing Issues

### Tests failing: "Cannot find module"

**Cause**: Import paths not resolved in test environment

**Solution**:

Update `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### Prisma client not available in tests

**Solution**:

Mock Prisma in tests:

```typescript
import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tournament: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))
```

Or use a test database:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
})
```

### E2E tests hanging

**Cause**: Page not fully loaded or async operation not complete

**Solution**:

Use proper waits:

```typescript
import { test, expect } from '@playwright/test'

test('my test', async ({ page }) => {
  await page.goto('/tournaments')

  // ✅ Good: Wait for element
  await page.waitForSelector('[data-testid="tournament-list"]')

  // ✅ Good: Wait for network idle
  await page.waitForLoadState('networkidle')

  // ✅ Good: Expect with retry
  await expect(page.locator('h1')).toContainText('Tournaments')
})
```

---

## Deployment Issues

### Build fails in production

**Cause**: Environment variables not set or TypeScript errors

**Solution**:

1. **Check environment variables**:

Ensure all required env vars are set in production:

```bash
# Verify in production environment
echo $DATABASE_URL
echo $NEXTAUTH_SECRET
```

2. **Type check locally**:

```bash
pnpm type-check
```

3. **Test production build locally**:

```bash
pnpm build
pnpm start
```

### Database migrations not applied

**Cause**: Forgot to run migrations in production

**Solution**:

Run migrations before starting app:

```bash
pnpm prisma migrate deploy
pnpm start
```

In Dockerfile:

```dockerfile
RUN pnpm prisma generate
RUN pnpm prisma migrate deploy
CMD ["pnpm", "start"]
```

### Images not loading in production

**Cause**: Image optimization not configured

**Solution**:

Configure image domains in `next.config.ts`:

```typescript
export default {
  images: {
    domains: ['cdn.example.com', 'your-domain.com'],
  },
}
```

---

## Performance

### Why is the leaderboard slow?

**Cause**: Complex calculations or N+1 queries

**Solution**:

1. **Use database aggregations**:

```typescript
// ✅ Good: Calculate in database
const leaderboard = await prisma.scorecard.findMany({
  where: { tournamentId },
  include: { player: true },
  orderBy: { totalPoints: 'desc' },
})

// ❌ Bad: Fetch all and sort in memory
const scorecards = await prisma.scorecard.findMany({ where: { tournamentId } })
const sorted = scorecards.sort((a, b) => b.totalPoints - a.totalPoints)
```

2. **Cache results**:

```typescript
import { unstable_cache } from 'next/cache'

export const getLeaderboard = unstable_cache(
  async (tournamentId: string) => calculateLeaderboard(tournamentId),
  ['leaderboard'],
  { revalidate: 60 }  // Cache for 60 seconds
)
```

3. **Use Server-Sent Events** for real-time updates instead of polling.

### How to reduce bundle size?

**Solution**:

1. **Analyze bundle**:

```bash
pnpm build
# Check .next/analyze/
```

2. **Dynamic imports**:

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  ssr: false,
})
```

3. **Tree shaking**:

```typescript
// ✅ Good: Import specific functions
import { format } from 'date-fns'

// ❌ Bad: Import entire library
import * as dateFns from 'date-fns'
```

---

## Getting Help

### Where can I find more information?

- **Documentation**: `/docs` directory
- **Code Examples**: Look at existing implementations
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

### How do I report a bug?

1. Check if issue already exists in GitHub Issues
2. Provide:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (Node version, OS, etc.)
   - Error messages and stack traces

### How do I request a feature?

1. Check roadmap and existing issues
2. Create detailed feature request with:
   - Use case
   - Proposed solution
   - Alternative solutions considered
   - Mockups/examples if applicable

---

*Last Updated: 2025-01-15*
