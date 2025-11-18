# Developer Onboarding Guide

Welcome to the Golf Tournament Management System! This comprehensive guide will help you understand the architecture, set up your development environment, and become productive quickly.

## Table of Contents

1. [Welcome & Introduction](#welcome--introduction)
2. [Local Development Setup](#local-development-setup)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Code Standards & Best Practices](#code-standards--best-practices)
6. [Adding New Features](#adding-new-features)
7. [Database Management](#database-management)
8. [Testing Guide](#testing-guide)
9. [API Documentation](#api-documentation)
10. [Debugging Guide](#debugging-guide)
11. [Contributing Guidelines](#contributing-guidelines)

---

## Welcome & Introduction

### Project Overview

The Golf Tournament Management System is a modern, enterprise-grade web application designed for golf clubs to manage tournaments, scoring, player registrations, and real-time leaderboards. Built for **Golfplatz Siek**, this system handles:

- **800+ members** and concurrent multi-tournament management
- **Real-time scoring** with mobile-first UX
- **Live leaderboards** using Server-Sent Events (SSE)
- **DSGVO compliance** (EU data protection)
- **Integration** with PC Caddie and WHS/DGV handicap systems
- **Multi-club support** with white-label capabilities

### Vision

Our vision is to create the most developer-friendly, maintainable, and scalable golf tournament management platform that:

- Follows **Domain-Driven Design** principles for clean architecture
- Practices **Test-Driven Development** for reliability
- Maintains **100% type safety** across the stack
- Provides **excellent DX** (Developer Experience)

### Tech Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework with SSR |
| **Language** | TypeScript 5.7 (strict mode) | Type safety across frontend & backend |
| **Database** | PostgreSQL 16 + Prisma ORM | Relational DB with type-safe ORM |
| **UI** | Tailwind CSS + shadcn/ui | Utility-first CSS + accessible components |
| **Email** | Brevo (Sendinblue) | Transactional & marketing emails |
| **Payment** | Stripe | Payment processing |
| **Real-time** | Server-Sent Events (SSE) | Live leaderboard updates |
| **Push Notifications** | Web Push API + VAPID | Browser notifications |
| **Testing** | Vitest + Testing Library + Playwright | Unit, integration, and E2E tests |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Deployment** | Docker + Docker Compose | Containerized deployment |

### Architecture Philosophy

#### Domain-Driven Design (DDD)

We organize code around business domains, not technical concerns:

- **Entities** (e.g., Tournament, Player, Scorecard) represent core business concepts
- **Value Objects** (e.g., HandicapIndex, TournamentFormat) are immutable, validated types
- **Aggregates** enforce business rules and maintain consistency
- **Repositories** abstract data persistence
- **Domain Services** contain complex business logic

#### Test-Driven Development (TDD)

We write tests first, then implementation:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass the test
3. **Refactor**: Improve code while keeping tests green

**Benefits**:
- Forces clear requirements
- Prevents regressions
- Enables confident refactoring
- Serves as living documentation

### Getting Started in 5 Minutes

```bash
# 1. Clone and install
git clone <repository-url>
cd golf-turnament
pnpm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Start database
docker-compose up -d db

# 4. Setup database
pnpm prisma migrate dev
pnpm db:seed

# 5. Start development server
pnpm dev

# 6. Run tests
pnpm test
```

Open [http://localhost:3000](http://localhost:3000) and you're ready to go!

---

## Local Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js 20+** ([Download](https://nodejs.org/))
  ```bash
  node --version  # Should be >= 20.0.0
  ```

- **pnpm 9+** (Package manager)
  ```bash
  npm install -g pnpm@latest
  pnpm --version  # Should be >= 9.0.0
  ```

- **PostgreSQL 16+** ([Download](https://www.postgresql.org/download/))
  ```bash
  psql --version  # Should be >= 16.0
  ```

- **Docker** (Optional but recommended) ([Download](https://www.docker.com/))
  ```bash
  docker --version
  docker-compose --version
  ```

- **Git** ([Download](https://git-scm.com/))
  ```bash
  git --version
  ```

### Clone Repository

```bash
# Using HTTPS
git clone https://github.com/your-org/golf-tournament.git
cd golf-tournament

# Or using SSH
git clone git@github.com:your-org/golf-tournament.git
cd golf-tournament
```

### Install Dependencies

We use **pnpm** for faster, disk-efficient package management:

```bash
pnpm install
```

**Why pnpm?**
- 3x faster than npm
- Saves disk space with content-addressable storage
- Strict dependency resolution (no phantom dependencies)

### Environment Setup

#### Create Environment File

```bash
cp .env.example .env
```

#### Configure Environment Variables

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/golf_tournament?schema=public"

# NextAuth (for authentication)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"

# Brevo Email Service (optional for local dev)
BREVO_API_KEY="your-brevo-api-key"
BREVO_SENDER_EMAIL="noreply@golfplatz-siek.de"
BREVO_SENDER_NAME="Golfplatz Siek"

# Stripe Payment (optional for local dev)
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxx"

# Web Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@golf-siek.de"

# Feature Flags
FEATURE_QR_SCORING="true"
FEATURE_LIVE_LEADERBOARD="true"
```

**Generate Secrets:**

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# VAPID Keys (for push notifications)
pnpm generate-vapid
```

### Database Setup

#### Option A: Docker Compose (Recommended)

Easiest way to get PostgreSQL running:

```bash
# Start PostgreSQL in Docker
docker-compose up -d db

# Verify it's running
docker-compose ps

# View logs
docker-compose logs -f db
```

The database will be available at `localhost:5432` with credentials from `docker-compose.yml`.

#### Option B: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database
createdb golf_tournament

# Or using psql
psql -U postgres
CREATE DATABASE golf_tournament;
\q
```

Update your `.env` with the correct connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/golf_tournament?schema=public"
```

#### Run Migrations

Apply database schema:

```bash
pnpm prisma migrate dev
```

This will:
1. Create database tables
2. Generate Prisma Client
3. Apply all migrations

#### Seed Database

Populate with sample data:

```bash
pnpm db:seed
```

This creates:
- Sample tournaments
- Test players
- Scorecards with sample scores
- Flights and registrations

### Run Development Server

```bash
pnpm dev
```

The application will be available at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3000/api](http://localhost:3000/api)

**Hot Module Replacement (HMR)** is enabled - changes to code will update instantly.

### Run Tests

```bash
# Unit tests (watch mode)
pnpm test

# Unit tests (single run)
pnpm test --run

# With UI
pnpm test:ui

# E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

### Verify Setup

Check that everything is working:

1. **Health Check**: Visit [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - Should return `{ "status": "ok" }`

2. **Database**: Open Prisma Studio
   ```bash
   pnpm db:studio
   ```
   - Visit [http://localhost:5555](http://localhost:5555)
   - Verify seed data exists

3. **Tests**: Run test suite
   ```bash
   pnpm test --run
   ```
   - All tests should pass

4. **TypeScript**: Check for type errors
   ```bash
   pnpm type-check
   ```
   - Should complete with no errors

Congratulations! Your development environment is ready.

---

## Project Structure

Understanding the folder structure is crucial for navigating the codebase:

```
golf-turnament/
├── app/                          # Next.js App Router (routes & pages)
│   ├── api/                      # API Routes (backend)
│   │   ├── health/               # Health check endpoint
│   │   ├── tournaments/          # Tournament CRUD & operations
│   │   │   ├── route.ts          # GET /api/tournaments, POST /api/tournaments
│   │   │   └── [id]/             # Dynamic tournament routes
│   │   │       ├── route.ts      # GET, PATCH, DELETE /api/tournaments/:id
│   │   │       ├── register/     # POST /api/tournaments/:id/register
│   │   │       ├── leaderboard/  # GET /api/tournaments/:id/leaderboard (SSE)
│   │   │       ├── flights/      # Flight management
│   │   │       └── photos/       # Tournament photos
│   │   ├── players/              # Player management
│   │   ├── emails/               # Email operations
│   │   ├── photos/               # Photo upload & management
│   │   ├── albums/               # Photo albums
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── reports/              # Report generation
│   │   ├── clubs/                # Multi-club management
│   │   ├── push/                 # Push notification endpoints
│   │   ├── payment/              # Stripe payment
│   │   ├── qr/                   # QR code generation & check-in
│   │   ├── webhooks/             # Brevo & Stripe webhooks
│   │   └── cron/                 # Scheduled jobs
│   ├── tournaments/              # Tournament pages (UI)
│   │   ├── page.tsx              # List all tournaments
│   │   ├── [id]/                 # Tournament detail pages
│   │   │   ├── page.tsx          # Tournament detail view
│   │   │   └── leaderboard/      # Live leaderboard view
│   │   └── new/                  # Create tournament
│   ├── scoring/                  # Mobile scoring interface
│   │   └── [scorecardId]/        # Score entry page
│   ├── admin/                    # Admin pages
│   │   ├── tournaments/          # Tournament management
│   │   ├── notifications/        # Push notification center
│   │   └── photos/               # Photo moderation
│   ├── analytics/                # Analytics dashboard
│   ├── gallery/                  # Photo gallery
│   ├── profile/                  # User profile
│   ├── register/                 # Player registration
│   ├── reports/                  # Report viewer
│   ├── offline/                  # PWA offline page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx            # Button component
│   │   ├── card.tsx              # Card component
│   │   ├── dialog.tsx            # Modal dialog
│   │   ├── dropdown-menu.tsx     # Dropdown menu
│   │   ├── select.tsx            # Select input
│   │   ├── tabs.tsx              # Tabs component
│   │   ├── toast.tsx             # Toast notifications
│   │   └── ...                   # Other UI primitives
│   ├── analytics/                # Analytics components
│   ├── club/                     # Club management components
│   ├── gallery/                  # Photo gallery components
│   ├── push/                     # Push notification components
│   ├── pwa/                      # PWA components (install prompt)
│   └── reports/                  # Report components
│
├── domain/                       # Domain Layer (DDD - Business Logic)
│   ├── entities/                 # Aggregate Roots & Entities
│   │   ├── tournament.ts         # Tournament aggregate
│   │   ├── tournament.test.ts    # Tournament tests (TDD)
│   │   ├── scorecard.ts          # Scorecard aggregate
│   │   ├── scorecard.test.ts     # Scorecard tests
│   │   ├── club.ts               # Club aggregate
│   │   ├── club.test.ts          # Club tests
│   │   ├── photo.ts              # Photo entity
│   │   ├── photo.test.ts         # Photo tests
│   │   ├── analytics-metric.ts   # Analytics metric entity
│   │   └── analytics-metric.test.ts
│   ├── value-objects/            # Value Objects (immutable)
│   │   ├── handicap-index.ts     # WHS Handicap Index
│   │   ├── handicap-index.test.ts
│   │   ├── tournament-format.ts  # Tournament format
│   │   ├── club-slug.ts          # Club URL slug
│   │   ├── club-slug.test.ts
│   │   ├── photo-metadata.ts     # Photo metadata
│   │   └── photo-metadata.test.ts
│   └── services/                 # Domain Services
│       ├── analytics-calculator.ts     # Analytics calculations
│       └── analytics-calculator.test.ts
│
├── infrastructure/               # Infrastructure Layer
│   ├── repositories/             # Data access (Repository pattern)
│   │   └── tournament-repository.ts
│   └── services/                 # External services & integrations
│       ├── email-service.ts      # Brevo email integration
│       ├── contact-sync-service.ts  # Contact sync
│       ├── push-service.ts       # Web push notifications
│       ├── push-service.test.ts
│       ├── analytics-service.ts  # Analytics service
│       ├── analytics-service.test.ts
│       ├── report-service.ts     # PDF/Excel report generation
│       ├── report-service.test.ts
│       ├── image-service.ts      # Image processing
│       ├── image-service.test.ts
│       ├── club-service.ts       # Multi-club service
│       └── club-service.test.ts
│
├── lib/                          # Shared Utilities & Helpers
│   ├── prisma.ts                 # Prisma client singleton
│   ├── utils.ts                  # Utility functions (cn, etc.)
│   ├── brevo.ts                  # Brevo client
│   ├── stripe.ts                 # Stripe client
│   ├── push-manager.ts           # Push notification manager
│   ├── notification-templates.ts # Notification templates
│   ├── notification-helpers.ts   # Notification helpers
│   ├── features.ts               # Feature flags
│   ├── theming.ts                # Theme utilities
│   └── club-context.ts           # Club context helpers
│
├── hooks/                        # React hooks
│   └── use-offline-scores.ts     # Offline scoring hook
│
├── prisma/                       # Database Schema & Migrations
│   ├── schema.prisma             # Prisma schema definition
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Migration history
│       ├── 20240101_init/        # Initial migration
│       ├── 20240115_photos/      # Photo system
│       ├── 20240120_analytics/   # Analytics tables
│       ├── 20240125_clubs/       # Multi-club support
│       └── create-default-club.ts
│
├── public/                       # Static Assets
│   ├── icons/                    # PWA icons
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── README.md
│   ├── uploads/                  # Uploaded files
│   │   └── photos/               # Photo uploads
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
│
├── tests/                        # Test Files
│   ├── setup.ts                  # Vitest setup & config
│   └── e2e/                      # Playwright E2E tests
│
├── docs/                         # Documentation
│   ├── architecture/             # Architecture Decision Records
│   │   ├── ADR-001-tech-stack.md
│   │   ├── ADR-002-domain-model.md
│   │   ├── ADR-003-multi-tenancy.md
│   │   ├── ADR-004-photo-storage.md
│   │   ├── ADR-005-notification-system.md
│   │   └── ADR-006-analytics-architecture.md
│   ├── API.md                    # API documentation
│   ├── API_REFERENCE.md          # Detailed API reference
│   ├── BREVO-SETUP.md            # Brevo integration guide
│   ├── PWA-SETUP.md              # PWA setup guide
│   ├── FEATURES.md               # Feature documentation
│   ├── PUSH_NOTIFICATIONS.md     # Push notification guide
│   ├── PUSH_NOTIFICATIONS_QUICK_START.md
│   ├── PHASE_3_4_IMPLEMENTATION.md
│   ├── DEVELOPER_GUIDE.md        # This file
│   ├── COMPONENTS.md             # Component library docs
│   ├── DATABASE.md               # Database schema docs
│   ├── BEST_PRACTICES.md         # Best practices guide
│   ├── FAQ.md                    # FAQ & troubleshooting
│   └── CODING_STANDARDS.md       # Coding standards
│
├── scripts/                      # Utility Scripts
│   └── generate-vapid-keys.ts    # Generate VAPID keys for push
│
├── .github/                      # GitHub Configuration
│   └── workflows/                # GitHub Actions
│       ├── ci.yml                # CI pipeline
│       └── deploy.yml            # Deployment workflow
│
├── .env.example                  # Example environment variables
├── .env                          # Local environment (gitignored)
├── .gitignore                    # Git ignore rules
├── .eslintrc.json                # ESLint configuration
├── Dockerfile                    # Production Docker image
├── docker-compose.yml            # Docker Compose for local dev
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Vitest test configuration
├── playwright.config.ts          # Playwright E2E configuration
├── postcss.config.mjs            # PostCSS configuration
├── package.json                  # Dependencies & scripts
├── pnpm-lock.yaml                # Lockfile
└── README.md                     # Project overview
```

### Directory Purpose Explanation

#### `/app` - Application Routes

Next.js 14 App Router directory. Contains both **pages** (UI) and **API routes** (backend).

- **Pages**: React components that render at specific URLs
- **API Routes**: `route.ts` files that handle HTTP requests
- **Layouts**: Shared layouts across pages
- **Server Components**: Default for better performance
- **Client Components**: Marked with `'use client'` for interactivity

#### `/components` - Reusable Components

React components used across multiple pages:

- **Separated by feature**: analytics, club, gallery, etc.
- **`ui/` directory**: Base UI components from shadcn/ui
- **Presentational components**: Focus on rendering, not business logic

#### `/domain` - Domain Layer (Core Business Logic)

**Most important directory** - contains pure business logic:

- **Entities**: Objects with identity (Tournament, Scorecard, Player)
- **Value Objects**: Immutable, validated types (HandicapIndex, TournamentFormat)
- **Domain Services**: Complex business logic that doesn't belong in entities
- **No framework dependencies**: Pure TypeScript, fully testable
- **Each entity has tests**: TDD approach

#### `/infrastructure` - External Integrations

Implements interfaces defined by domain layer:

- **Repositories**: Data persistence using Prisma
- **Services**: External APIs (Brevo, Stripe, image processing)
- **Adapters**: Convert between domain models and external formats

#### `/lib` - Shared Utilities

Utility functions and shared configurations:

- **Singletons**: Prisma client, Stripe client, Brevo client
- **Helpers**: Formatting, validation, feature flags
- **Framework agnostic**: Can be used anywhere

#### `/prisma` - Database

Database schema and migrations:

- **schema.prisma**: Single source of truth for database structure
- **migrations/**: Version-controlled schema changes
- **seed.ts**: Development/test data

---

## Architecture Overview

### Domain-Driven Design (DDD)

We structure code around **business domains**, not technical layers.

#### Bounded Contexts

Our system has these main bounded contexts:

1. **Tournament Management** (Core Domain)
   - Creating and managing tournaments
   - Opening/closing registration
   - Tournament lifecycle

2. **Player Management** (Core Domain)
   - Player profiles and handicaps
   - Tournament registration
   - Player statistics

3. **Scoring** (Core Domain)
   - Score entry and validation
   - Stableford/stroke play calculations
   - Leaderboard generation

4. **Photo Gallery** (Supporting Domain)
   - Photo uploads and moderation
   - Albums and galleries
   - Tournament photo association

5. **Analytics** (Supporting Domain)
   - Metrics collection and reporting
   - Dashboard data aggregation
   - Trend analysis

6. **Multi-Club Management** (Supporting Domain)
   - Club profiles and branding
   - Subscription management
   - Member roles

7. **Communication** (Supporting Domain)
   - Email notifications
   - Push notifications
   - SMS (future)

#### Entities vs Value Objects

**Entities** have identity and lifecycle:

```typescript
// Tournament is an Entity
export class Tournament {
  private constructor(private props: TournamentProps) {}

  getId(): string {
    return this.props.id  // Has unique identity
  }

  openForRegistration(): void {
    // Changes state (mutation)
    this.props.status = 'OPEN_FOR_REGISTRATION'
    this.props.updatedAt = new Date()
  }
}
```

**Value Objects** are immutable and defined by their values:

```typescript
// HandicapIndex is a Value Object
export class HandicapIndex {
  private constructor(private readonly value: number) {
    Object.freeze(this)  // Immutable
  }

  static create(value: number): HandicapIndex {
    if (value < -10.0 || value > 54.0) {
      throw new Error('Invalid handicap index')
    }
    return new HandicapIndex(Math.round(value * 10) / 10)
  }

  getValue(): number {
    return this.value
  }

  equals(other: HandicapIndex): boolean {
    return this.value === other.value  // Equality by value
  }
}
```

**Key Differences**:

| Aspect | Entity | Value Object |
|--------|--------|--------------|
| **Identity** | Has unique ID | Defined by values |
| **Mutability** | Can change state | Immutable |
| **Equality** | By ID | By value |
| **Lifecycle** | Created, updated, deleted | Created, replaced |
| **Examples** | Tournament, Player, Scorecard | HandicapIndex, Email, Money |

#### Aggregates

**Aggregates** are clusters of entities that form a consistency boundary:

- **Tournament Aggregate**:
  - Tournament (root)
  - Flights
  - Sponsors

- **Scorecard Aggregate**:
  - Scorecard (root)
  - Individual hole scores (as JSON)

**Rules**:
1. External objects can only reference the **aggregate root** by ID
2. Changes within an aggregate are **atomic**
3. Changes across aggregates are **eventually consistent** (via events)

Example:

```typescript
// ✅ Good: Reference by ID
class Registration {
  tournamentId: string  // Reference to Tournament aggregate root
  playerId: string      // Reference to Player aggregate root
}

// ❌ Bad: Holding full objects
class Registration {
  tournament: Tournament  // Don't do this!
  player: Player          // Don't do this!
}
```

#### Repository Pattern

Repositories abstract data access:

```typescript
interface TournamentRepository {
  save(tournament: Tournament): Promise<void>
  findById(id: string): Promise<Tournament | null>
  findAll(): Promise<Tournament[]>
  delete(id: string): Promise<void>
}
```

**Benefits**:
- Domain layer doesn't know about Prisma
- Easy to test with in-memory implementations
- Can swap database without changing domain code

Implementation in `/infrastructure/repositories/`:

```typescript
export class PrismaTournamentRepository implements TournamentRepository {
  async save(tournament: Tournament): Promise<void> {
    const data = tournament.toJSON()
    await prisma.tournament.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    })
  }

  async findById(id: string): Promise<Tournament | null> {
    const data = await prisma.tournament.findUnique({ where: { id } })
    return data ? Tournament.fromPersistence(data) : null
  }
}
```

#### Domain Events (Prepared for Future)

Domain events represent things that happened:

```typescript
// Future implementation
interface TournamentCreatedEvent {
  type: 'TournamentCreated'
  tournamentId: string
  name: string
  occurredAt: Date
}

interface RegistrationConfirmedEvent {
  type: 'RegistrationConfirmed'
  tournamentId: string
  playerId: string
  occurredAt: Date
}
```

Events enable:
- **Decoupling**: Other modules react to events
- **Audit log**: Complete history of what happened
- **Event sourcing**: Rebuild state from events

### Test-Driven Development (TDD)

We practice TDD for all domain logic.

#### Red-Green-Refactor Cycle

1. **Red**: Write a failing test

```typescript
// domain/entities/tournament.test.ts
describe('Tournament', () => {
  it('should create tournament with valid data', () => {
    const tournament = Tournament.create({
      name: 'Club Championship 2025',
      format: 'STABLEFORD',
      category: 'CLUB_CHAMPIONSHIP',
      tournamentDate: new Date('2025-06-15'),
      registrationStart: new Date('2025-05-01'),
      registrationEnd: new Date('2025-06-01'),
    })

    expect(tournament.getStatus()).toBe('DRAFT')
    expect(tournament.getName()).toBe('Club Championship 2025')
  })
})
```

2. **Green**: Write minimal code to pass

```typescript
// domain/entities/tournament.ts
export class Tournament {
  static create(params: CreateTournamentParams): Tournament {
    return new Tournament({
      id: generateId(),
      name: params.name,
      format: params.format,
      category: params.category,
      status: 'DRAFT',
      tournamentDate: params.tournamentDate,
      registrationStart: params.registrationStart,
      registrationEnd: params.registrationEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
      // ... other fields
    })
  }
}
```

3. **Refactor**: Improve code quality

```typescript
// Extract validation
static create(params: CreateTournamentParams): Tournament {
  validateTournamentDates(params)
  validatePlayerLimits(params)
  validateHandicapLimits(params)

  return new Tournament(createTournamentProps(params))
}
```

#### Test Pyramid Strategy

```
        /\
       /  \
      / E2E \        Few (slow, expensive)
     /______\
    /        \
   /Integration\     Some (medium speed)
  /____________\
 /              \
/  Unit Tests    \   Many (fast, cheap)
/_________________\
```

- **Unit Tests** (70%): Test domain logic in isolation
- **Integration Tests** (20%): Test API routes, repositories
- **E2E Tests** (10%): Test critical user flows

### Design Patterns Used

#### 1. Repository Pattern

**Purpose**: Separate domain logic from data access

**Example**:
```typescript
// Domain defines interface
interface TournamentRepository {
  save(tournament: Tournament): Promise<void>
  findById(id: string): Promise<Tournament | null>
}

// Infrastructure implements
class PrismaTournamentRepository implements TournamentRepository {
  // Prisma-specific implementation
}
```

#### 2. Factory Pattern

**Purpose**: Create complex objects with validation

**Example**:
```typescript
// Domain factory
export class Tournament {
  static create(params: CreateTournamentParams): Tournament {
    // Validation and construction logic
    return new Tournament(props)
  }

  // Constructor is private
  private constructor(props: TournamentProps) {}
}

// Test factory
export function createTestTournament(overrides?: Partial<CreateTournamentParams>) {
  return Tournament.create({
    name: 'Test Tournament',
    format: 'STABLEFORD',
    // ... defaults
    ...overrides,
  })
}
```

#### 3. Strategy Pattern

**Purpose**: Switch between different algorithms/behaviors

**Example**:
```typescript
// Notification strategies
interface NotificationStrategy {
  send(message: Notification): Promise<void>
}

class EmailNotificationStrategy implements NotificationStrategy {
  async send(message: Notification): Promise<void> {
    await emailService.send(message)
  }
}

class PushNotificationStrategy implements NotificationStrategy {
  async send(message: Notification): Promise<void> {
    await pushService.send(message)
  }
}

// Usage
const strategy = config.preferPush
  ? new PushNotificationStrategy()
  : new EmailNotificationStrategy()

await strategy.send(notification)
```

#### 4. Observer Pattern

**Purpose**: Real-time updates to multiple subscribers

**Example**:
```typescript
// Server-Sent Events for leaderboard
export async function GET(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const leaderboard = await getLeaderboard()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(leaderboard)}\n\n`))

      // Subscribe to updates
      const interval = setInterval(async () => {
        const updated = await getLeaderboard()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(updated)}\n\n`))
      }, 5000)

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

---

## Code Standards & Best Practices

### TypeScript Standards

#### Strict Mode Enabled

We enforce strict TypeScript configuration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "strictNullChecks": true
  }
}
```

#### No `any` Types

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value
}

// ✅ Good
interface DataStructure {
  value: string
}

function processData(data: DataStructure): string {
  return data.value
}

// ✅ Also good: Use unknown when type is truly unknown
function processUnknown(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value)
  }
  throw new Error('Invalid data structure')
}
```

#### Prefer Interfaces Over Types

```typescript
// ✅ Good: Use interfaces for objects
interface Tournament {
  id: string
  name: string
  format: TournamentFormat
}

// ✅ Good: Types for unions, primitives, functions
type TournamentStatus = 'DRAFT' | 'OPEN_FOR_REGISTRATION' | 'COMPLETED'
type FormatType = 'STROKE_PLAY' | 'STABLEFORD'
type ValidationFunction = (value: string) => boolean
```

#### Use Zod for Runtime Validation

```typescript
import { z } from 'zod'

// Define schema
const TournamentCreateSchema = z.object({
  name: z.string().min(3).max(100),
  format: z.enum(['STROKE_PLAY', 'STABLEFORD', 'MATCH_PLAY']),
  tournamentDate: z.coerce.date(),
  maxPlayers: z.number().int().positive().optional(),
})

// Type inference
type TournamentCreateInput = z.infer<typeof TournamentCreateSchema>

// Validation
const result = TournamentCreateSchema.safeParse(input)
if (!result.success) {
  return { error: result.error.format() }
}
```

### React/Next.js Best Practices

#### Server Components by Default

```typescript
// ✅ Good: Default to Server Components
export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id)

  return (
    <div>
      <h1>{tournament.name}</h1>
      {/* Server-rendered, no JavaScript sent to client */}
    </div>
  )
}
```

#### Client Components Only When Needed

```typescript
// ✅ Use 'use client' only for interactivity
'use client'

import { useState } from 'react'

export function InteractiveCounter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

**When to use Client Components:**
- State (`useState`, `useReducer`)
- Effects (`useEffect`)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `navigator`)
- Custom hooks that use the above

#### Use Server Actions for Mutations

```typescript
// app/actions/tournament.ts
'use server'

export async function createTournament(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    format: formData.get('format') as TournamentFormat,
    // ...
  }

  // Validate
  const validated = TournamentCreateSchema.parse(data)

  // Save
  const tournament = await prisma.tournament.create({
    data: validated,
  })

  revalidatePath('/tournaments')
  return tournament
}
```

```typescript
// app/tournaments/new/page.tsx
import { createTournament } from '@/app/actions/tournament'

export default function NewTournamentPage() {
  return (
    <form action={createTournament}>
      <input name="name" required />
      <select name="format" required>
        <option value="STABLEFORD">Stableford</option>
        <option value="STROKE_PLAY">Stroke Play</option>
      </select>
      <button type="submit">Create</button>
    </form>
  )
}
```

#### Proper Error Boundaries

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
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Database Best Practices

#### Prisma Best Practices

**Use Transactions for Related Changes:**

```typescript
// ✅ Good: Atomic updates
await prisma.$transaction(async (tx) => {
  const tournament = await tx.tournament.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
  })

  await tx.scorecard.createMany({
    data: registrations.map(r => ({
      tournamentId: id,
      playerId: r.playerId,
      status: 'NOT_STARTED',
    })),
  })
})
```

**Query Optimization:**

```typescript
// ❌ Bad: N+1 query problem
const tournaments = await prisma.tournament.findMany()
for (const tournament of tournaments) {
  const registrations = await prisma.registration.findMany({
    where: { tournamentId: tournament.id }
  })
  // ...
}

// ✅ Good: Use include
const tournaments = await prisma.tournament.findMany({
  include: {
    registrations: {
      include: {
        player: true,
      },
    },
  },
})
```

**Use Select for Performance:**

```typescript
// ❌ Bad: Fetching unnecessary data
const players = await prisma.player.findMany()

// ✅ Good: Select only needed fields
const players = await prisma.player.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
})
```

#### Migration Strategy

**Development:**
```bash
# Create migration
pnpm prisma migrate dev --name add_photo_moderation

# Reset database (loses data)
pnpm prisma migrate reset
```

**Production:**
```bash
# Apply migrations
pnpm prisma migrate deploy

# Never use migrate dev in production!
```

### Testing Standards

#### Every Domain Entity Has Tests

```typescript
// domain/entities/tournament.test.ts
import { describe, it, expect } from 'vitest'
import { Tournament } from './tournament'

describe('Tournament', () => {
  describe('create', () => {
    it('should create tournament with valid data', () => {
      const tournament = Tournament.create({
        name: 'Test Tournament',
        format: 'STABLEFORD',
        category: 'MONTHLY_MEDAL',
        tournamentDate: new Date('2025-06-15'),
        registrationStart: new Date('2025-05-01'),
        registrationEnd: new Date('2025-06-01'),
      })

      expect(tournament.getStatus()).toBe('DRAFT')
      expect(tournament.getName()).toBe('Test Tournament')
    })

    it('should throw error if tournament date is before registration end', () => {
      expect(() => {
        Tournament.create({
          name: 'Test',
          format: 'STABLEFORD',
          category: 'CASUAL',
          tournamentDate: new Date('2025-05-15'),
          registrationStart: new Date('2025-05-01'),
          registrationEnd: new Date('2025-06-01'), // After tournament date!
        })
      }).toThrow('Tournament date must be after registration end date')
    })
  })

  describe('openForRegistration', () => {
    it('should open draft tournament for registration', () => {
      const tournament = createTestTournament()

      tournament.openForRegistration()

      expect(tournament.getStatus()).toBe('OPEN_FOR_REGISTRATION')
    })

    it('should throw error if not in draft status', () => {
      const tournament = createTestTournament()
      tournament.openForRegistration()

      expect(() => {
        tournament.openForRegistration()
      }).toThrow('Can only open draft tournaments for registration')
    })
  })
})
```

#### API Endpoints Have Integration Tests

```typescript
// app/api/tournaments/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testApiHandler } from '@/tests/test-utils'
import { GET, POST } from './route'

describe('GET /api/tournaments', () => {
  it('should return list of tournaments', async () => {
    const response = await testApiHandler(GET, {
      url: '/api/tournaments',
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('POST /api/tournaments', () => {
  it('should create tournament with valid data', async () => {
    const response = await testApiHandler(POST, {
      url: '/api/tournaments',
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Tournament',
        format: 'STABLEFORD',
        tournamentDate: '2025-06-15',
        registrationStart: '2025-05-01',
        registrationEnd: '2025-06-01',
      }),
    })

    expect(response.status).toBe(201)
    const tournament = await response.json()
    expect(tournament.name).toBe('Test Tournament')
  })

  it('should return 400 with invalid data', async () => {
    const response = await testApiHandler(POST, {
      url: '/api/tournaments',
      method: 'POST',
      body: JSON.stringify({
        name: 'X', // Too short
      }),
    })

    expect(response.status).toBe(400)
  })
})
```

#### Critical Flows Have E2E Tests

```typescript
// tests/e2e/tournament-lifecycle.spec.ts
import { test, expect } from '@playwright/test'

test('complete tournament lifecycle', async ({ page }) => {
  // Create tournament
  await page.goto('/tournaments/new')
  await page.fill('[name="name"]', 'E2E Test Tournament')
  await page.selectOption('[name="format"]', 'STABLEFORD')
  await page.fill('[name="tournamentDate"]', '2025-06-15')
  await page.click('button[type="submit"]')

  // Verify created
  await expect(page).toHaveURL(/\/tournaments\/\w+/)
  await expect(page.locator('h1')).toContainText('E2E Test Tournament')

  // Open for registration
  await page.click('button:has-text("Open for Registration")')
  await expect(page.locator('[data-status]')).toHaveText('OPEN_FOR_REGISTRATION')

  // Register player
  await page.click('button:has-text("Register")')
  await page.fill('[name="playerName"]', 'Test Player')
  await page.fill('[name="email"]', 'test@example.com')
  await page.click('button[type="submit"]')

  // Verify registration
  await expect(page.locator('[data-testid="player-list"]')).toContainText('Test Player')
})
```

#### Mock External Services

```typescript
// tests/mocks/brevo.ts
import { vi } from 'vitest'

export const mockBrevoClient = {
  sendTransacEmail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
  createContact: vi.fn().mockResolvedValue({ id: 1 }),
}

// In test
import { mockBrevoClient } from '@/tests/mocks/brevo'

vi.mock('@/lib/brevo', () => ({
  brevoClient: mockBrevoClient,
}))

it('should send confirmation email', async () => {
  await sendRegistrationConfirmation(registration)

  expect(mockBrevoClient.sendTransacEmail).toHaveBeenCalledWith({
    to: [{ email: 'test@example.com' }],
    templateId: expect.any(Number),
    params: expect.objectContaining({
      tournamentName: 'Test Tournament',
    }),
  })
})
```

### Git Workflow

#### Branch Naming

```bash
# Feature branches
git checkout -b feature/multi-club-support
git checkout -b feature/photo-gallery

# Bug fixes
git checkout -b fix/leaderboard-calculation
git checkout -b fix/email-template-formatting

# Documentation
git checkout -b docs/api-reference
git checkout -b docs/developer-guide
```

#### Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring (no behavior change)
- `test`: Adding or updating tests
- `chore`: Build process, dependencies
- `perf`: Performance improvements
- `style`: Code style changes (formatting)

**Examples:**

```bash
git commit -m "feat(tournaments): add multi-day tournament support"
git commit -m "fix(scoring): correct stableford calculation for par 3s"
git commit -m "docs: add API authentication section"
git commit -m "test(domain): add tournament aggregate tests"
git commit -m "refactor(leaderboard): extract calculation logic"
git commit -m "chore(deps): upgrade Next.js to 14.2.22"
```

#### Pull Request Template

When creating PRs, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

---

## Adding New Features

This section provides step-by-step guides for common development tasks.

### 1. Adding a New Domain Entity

**Example**: Adding a `Coach` entity

#### Step 1: Write Tests First (TDD)

```typescript
// domain/entities/coach.test.ts
import { describe, it, expect } from 'vitest'
import { Coach } from './coach'

describe('Coach', () => {
  describe('create', () => {
    it('should create coach with valid certification', () => {
      const coach = Coach.create({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        certification: 'PGA_CLASS_A',
        certificationDate: new Date('2020-01-15'),
      })

      expect(coach.getFullName()).toBe('John Smith')
      expect(coach.isActive()).toBe(true)
    })

    it('should throw error if certification is expired', () => {
      expect(() => {
        Coach.create({
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          certification: 'PGA_CLASS_A',
          certificationDate: new Date('2010-01-15'), // Expired
        })
      }).toThrow('Certification has expired')
    })
  })

  describe('assignToTournament', () => {
    it('should assign coach to tournament', () => {
      const coach = createTestCoach()

      coach.assignToTournament('tournament-123')

      expect(coach.getAssignedTournaments()).toContain('tournament-123')
    })
  })
})
```

#### Step 2: Implement Entity

```typescript
// domain/entities/coach.ts
export type CertificationType = 'PGA_CLASS_A' | 'PGA_CLASS_M' | 'DGV_GOLF_TEACHER'

export interface CoachProps {
  id: string
  firstName: string
  lastName: string
  email: string
  certification: CertificationType
  certificationDate: Date
  active: boolean
  assignedTournaments: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateCoachParams {
  firstName: string
  lastName: string
  email: string
  certification: CertificationType
  certificationDate: Date
}

export class Coach {
  private constructor(private props: CoachProps) {}

  static create(params: CreateCoachParams): Coach {
    // Validate certification date
    const yearsValid = 5
    const expirationDate = new Date(params.certificationDate)
    expirationDate.setFullYear(expirationDate.getFullYear() + yearsValid)

    if (new Date() > expirationDate) {
      throw new Error('Certification has expired')
    }

    // Validate email
    if (!params.email.includes('@')) {
      throw new Error('Invalid email address')
    }

    return new Coach({
      id: generateId(),
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      certification: params.certification,
      certificationDate: params.certificationDate,
      active: true,
      assignedTournaments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Getters
  getId(): string {
    return this.props.id
  }

  getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`
  }

  isActive(): boolean {
    return this.props.active
  }

  getAssignedTournaments(): string[] {
    return [...this.props.assignedTournaments]
  }

  // Domain logic
  assignToTournament(tournamentId: string): void {
    if (!this.props.active) {
      throw new Error('Cannot assign inactive coach to tournament')
    }

    if (this.props.assignedTournaments.includes(tournamentId)) {
      throw new Error('Coach already assigned to this tournament')
    }

    this.props.assignedTournaments.push(tournamentId)
    this.props.updatedAt = new Date()
  }

  unassignFromTournament(tournamentId: string): void {
    const index = this.props.assignedTournaments.indexOf(tournamentId)
    if (index === -1) {
      throw new Error('Coach not assigned to this tournament')
    }

    this.props.assignedTournaments.splice(index, 1)
    this.props.updatedAt = new Date()
  }

  deactivate(): void {
    this.props.active = false
    this.props.updatedAt = new Date()
  }

  // Serialization
  toJSON(): CoachProps {
    return { ...this.props }
  }
}

function generateId(): string {
  return `coach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

#### Step 3: Add to Prisma Schema

```prisma
// prisma/schema.prisma

enum CertificationType {
  PGA_CLASS_A
  PGA_CLASS_M
  DGV_GOLF_TEACHER
}

model Coach {
  id                String            @id @default(cuid())
  firstName         String
  lastName          String
  email             String            @unique
  phone             String?

  certification     CertificationType
  certificationDate DateTime

  active            Boolean           @default(true)

  // Relations
  tournaments       TournamentCoach[]

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([email])
  @@index([active])
}

model TournamentCoach {
  id           String     @id @default(cuid())

  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  coachId      String
  coach        Coach      @relation(fields: [coachId], references: [id], onDelete: Cascade)

  role         String?    // "head_coach", "assistant", etc.

  createdAt    DateTime   @default(now())

  @@unique([tournamentId, coachId])
  @@index([tournamentId])
  @@index([coachId])
}

// Also add to Tournament model
model Tournament {
  // ... existing fields
  coaches TournamentCoach[]
}
```

#### Step 4: Run Migration

```bash
pnpm prisma migrate dev --name add_coach_entity
```

#### Step 5: Create Repository

```typescript
// infrastructure/repositories/coach-repository.ts
import { prisma } from '@/lib/prisma'
import { Coach } from '@/domain/entities/coach'

export interface CoachRepository {
  save(coach: Coach): Promise<void>
  findById(id: string): Promise<Coach | null>
  findByEmail(email: string): Promise<Coach | null>
  findAll(activeOnly?: boolean): Promise<Coach[]>
  delete(id: string): Promise<void>
}

export class PrismaCoachRepository implements CoachRepository {
  async save(coach: Coach): Promise<void> {
    const data = coach.toJSON()

    await prisma.coach.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        certification: data.certification,
        certificationDate: data.certificationDate,
        active: data.active,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        certification: data.certification,
        certificationDate: data.certificationDate,
        active: data.active,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findById(id: string): Promise<Coach | null> {
    const data = await prisma.coach.findUnique({
      where: { id },
    })

    if (!data) return null

    return Coach.fromPersistence(data)
  }

  async findByEmail(email: string): Promise<Coach | null> {
    const data = await prisma.coach.findUnique({
      where: { email },
    })

    return data ? Coach.fromPersistence(data) : null
  }

  async findAll(activeOnly = false): Promise<Coach[]> {
    const data = await prisma.coach.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { lastName: 'asc' },
    })

    return data.map(d => Coach.fromPersistence(d))
  }

  async delete(id: string): Promise<void> {
    await prisma.coach.delete({ where: { id } })
  }
}
```

### 2. Adding a New API Endpoint

**Example**: Adding `GET /api/coaches` endpoint

#### Step 1: Define Zod Schema

```typescript
// app/api/coaches/schemas.ts
import { z } from 'zod'

export const CoachCreateSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  certification: z.enum(['PGA_CLASS_A', 'PGA_CLASS_M', 'DGV_GOLF_TEACHER']),
  certificationDate: z.coerce.date(),
})

export const CoachUpdateSchema = CoachCreateSchema.partial()

export const CoachQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})
```

#### Step 2: Write Integration Test

```typescript
// app/api/coaches/route.test.ts
import { describe, it, expect } from 'vitest'
import { GET, POST } from './route'

describe('GET /api/coaches', () => {
  it('should return list of coaches', async () => {
    const request = new Request('http://localhost/api/coaches')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should filter active coaches', async () => {
    const request = new Request('http://localhost/api/coaches?activeOnly=true')
    const response = await GET(request)

    const data = await response.json()
    expect(data.every((c: any) => c.active === true)).toBe(true)
  })
})

describe('POST /api/coaches', () => {
  it('should create coach with valid data', async () => {
    const request = new Request('http://localhost/api/coaches', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        certification: 'PGA_CLASS_A',
        certificationDate: '2020-01-15',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const coach = await response.json()
    expect(coach.email).toBe('john@example.com')
  })

  it('should return 400 with invalid data', async () => {
    const request = new Request('http://localhost/api/coaches', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'J', // Too short
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

#### Step 3: Implement Route Handler

```typescript
// app/api/coaches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaCoachRepository } from '@/infrastructure/repositories/coach-repository'
import { Coach } from '@/domain/entities/coach'
import { CoachCreateSchema, CoachQuerySchema } from './schemas'

const repository = new PrismaCoachRepository()

/**
 * Get all coaches
 *
 * @route GET /api/coaches
 * @query activeOnly - Filter active coaches only (boolean)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 * @returns Coach[]
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = CoachQuerySchema.parse({
      activeOnly: searchParams.get('activeOnly'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    // Fetch coaches
    const coaches = await repository.findAll(query.activeOnly)

    // Pagination
    const page = query.page || 1
    const limit = query.limit || 50
    const start = (page - 1) * limit
    const end = start + limit

    const paginatedCoaches = coaches.slice(start, end)

    return NextResponse.json({
      data: paginatedCoaches.map(c => c.toJSON()),
      meta: {
        total: coaches.length,
        page,
        limit,
        totalPages: Math.ceil(coaches.length / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch coaches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coaches' },
      { status: 500 }
    )
  }
}

/**
 * Create a new coach
 *
 * @route POST /api/coaches
 * @body CoachCreateSchema
 * @returns Coach
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json()
    const validated = CoachCreateSchema.parse(body)

    // Create coach entity
    const coach = Coach.create(validated)

    // Persist
    await repository.save(coach)

    return NextResponse.json(coach.toJSON(), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.format() },
        { status: 400 }
      )
    }

    console.error('Failed to create coach:', error)
    return NextResponse.json(
      { error: 'Failed to create coach' },
      { status: 500 }
    )
  }
}
```

#### Step 4: Add Individual Coach Endpoint

```typescript
// app/api/coaches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaCoachRepository } from '@/infrastructure/repositories/coach-repository'
import { CoachUpdateSchema } from '../schemas'

const repository = new PrismaCoachRepository()

/**
 * Get coach by ID
 *
 * @route GET /api/coaches/:id
 * @returns Coach
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coach = await repository.findById(params.id)

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(coach.toJSON())
  } catch (error) {
    console.error('Failed to fetch coach:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach' },
      { status: 500 }
    )
  }
}

/**
 * Update coach
 *
 * @route PATCH /api/coaches/:id
 * @body CoachUpdateSchema
 * @returns Coach
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coach = await repository.findById(params.id)

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = CoachUpdateSchema.parse(body)

    // Update coach (implement update methods on entity)
    if (validated.firstName) coach.updateFirstName(validated.firstName)
    if (validated.lastName) coach.updateLastName(validated.lastName)
    // ... other updates

    await repository.save(coach)

    return NextResponse.json(coach.toJSON())
  } catch (error) {
    // Error handling...
  }
}

/**
 * Delete coach
 *
 * @route DELETE /api/coaches/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await repository.delete(params.id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete coach:', error)
    return NextResponse.json(
      { error: 'Failed to delete coach' },
      { status: 500 }
    )
  }
}
```

#### Step 5: Update API Documentation

Add to `docs/API_REFERENCE.md`:

```markdown
### Coaches

#### GET /api/coaches

Get list of coaches.

**Query Parameters:**
- `activeOnly` (boolean, optional): Filter active coaches only
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "coach_123",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@example.com",
      "certification": "PGA_CLASS_A",
      "certificationDate": "2020-01-15T00:00:00Z",
      "active": true
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

#### POST /api/coaches

Create a new coach.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "certification": "PGA_CLASS_A",
  "certificationDate": "2020-01-15"
}
```

**Response:** (201 Created)
```json
{
  "id": "coach_123",
  "firstName": "John",
  "lastName": "Smith",
  ...
}
```
```

### 3. Adding a New UI Component

**Example**: Adding a `CoachCard` component

#### Step 1: Create Component

```typescript
// components/coach-card.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CoachCardProps {
  coach: {
    id: string
    firstName: string
    lastName: string
    email: string
    certification: string
    active: boolean
  }
  onAssign?: (coachId: string) => void
  onRemove?: (coachId: string) => void
}

export function CoachCard({ coach, onAssign, onRemove }: CoachCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{coach.firstName} {coach.lastName}</CardTitle>
            <CardDescription>{coach.email}</CardDescription>
          </div>
          <Badge variant={coach.active ? 'default' : 'secondary'}>
            {coach.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Certification:</span>{' '}
            {coach.certification}
          </div>

          {(onAssign || onRemove) && (
            <div className="flex gap-2 mt-4">
              {onAssign && (
                <Button onClick={() => onAssign(coach.id)} size="sm">
                  Assign to Tournament
                </Button>
              )}
              {onRemove && (
                <Button
                  onClick={() => onRemove(coach.id)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Step 2: Add Component Tests

```typescript
// components/coach-card.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoachCard } from './coach-card'

describe('CoachCard', () => {
  const mockCoach = {
    id: 'coach-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    certification: 'PGA_CLASS_A',
    active: true,
  }

  it('should render coach information', () => {
    render(<CoachCard coach={mockCoach} />)

    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('PGA_CLASS_A')).toBeInTheDocument()
  })

  it('should show active badge for active coach', () => {
    render(<CoachCard coach={mockCoach} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should show inactive badge for inactive coach', () => {
    render(<CoachCard coach={{ ...mockCoach, active: false }} />)

    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('should call onAssign when assign button clicked', () => {
    const onAssign = vi.fn()
    render(<CoachCard coach={mockCoach} onAssign={onAssign} />)

    fireEvent.click(screen.getByText('Assign to Tournament'))

    expect(onAssign).toHaveBeenCalledWith('coach-1')
  })
})
```

#### Step 3: Document Props with JSDoc

```typescript
/**
 * CoachCard - Display coach information in a card format
 *
 * @component
 * @example
 * ```tsx
 * <CoachCard
 *   coach={coach}
 *   onAssign={(id) => handleAssign(id)}
 * />
 * ```
 *
 * @param {CoachCardProps} props - Component props
 * @param {Object} props.coach - Coach data
 * @param {string} props.coach.id - Unique coach identifier
 * @param {string} props.coach.firstName - Coach first name
 * @param {string} props.coach.lastName - Coach last name
 * @param {string} props.coach.email - Coach email address
 * @param {string} props.coach.certification - Certification type
 * @param {boolean} props.coach.active - Whether coach is active
 * @param {Function} [props.onAssign] - Callback when assign button clicked
 * @param {Function} [props.onRemove] - Callback when remove button clicked
 *
 * @accessibility
 * - Semantic HTML structure
 * - ARIA labels on interactive elements
 * - Keyboard navigation support
 */
export function CoachCard({ coach, onAssign, onRemove }: CoachCardProps) {
  // ...
}
```

#### Step 4: Use in Page

```typescript
// app/coaches/page.tsx
import { CoachCard } from '@/components/coach-card'

export default async function CoachesPage() {
  const coaches = await getCoaches()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Coaches</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coaches.map(coach => (
          <CoachCard
            key={coach.id}
            coach={coach}
            onAssign={handleAssign}
          />
        ))}
      </div>
    </div>
  )
}
```

### 4. Adding a New Service

**Example**: Adding a `CoachingService`

#### Step 1: Write Service Tests

```typescript
// infrastructure/services/coaching-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { CoachingService } from './coaching-service'
import { InMemoryCoachRepository } from '@/tests/mocks/repositories'
import { createTestCoach } from '@/tests/factories/coach-factory'

describe('CoachingService', () => {
  let service: CoachingService
  let repository: InMemoryCoachRepository

  beforeEach(() => {
    repository = new InMemoryCoachRepository()
    service = new CoachingService(repository)
  })

  describe('assignCoachToTournament', () => {
    it('should assign coach to tournament', async () => {
      const coach = createTestCoach()
      await repository.save(coach)

      await service.assignCoachToTournament(coach.getId(), 'tournament-123')

      const updated = await repository.findById(coach.getId())
      expect(updated?.getAssignedTournaments()).toContain('tournament-123')
    })

    it('should throw error if coach not found', async () => {
      await expect(
        service.assignCoachToTournament('nonexistent', 'tournament-123')
      ).rejects.toThrow('Coach not found')
    })
  })

  describe('getAvailableCoaches', () => {
    it('should return coaches not assigned to tournament', async () => {
      const coach1 = createTestCoach()
      const coach2 = createTestCoach()
      coach1.assignToTournament('tournament-123')

      await repository.save(coach1)
      await repository.save(coach2)

      const available = await service.getAvailableCoaches('tournament-123')

      expect(available).toHaveLength(1)
      expect(available[0].getId()).toBe(coach2.getId())
    })
  })
})
```

#### Step 2: Implement Service Class

```typescript
// infrastructure/services/coaching-service.ts
import { Coach } from '@/domain/entities/coach'
import { CoachRepository } from '@/infrastructure/repositories/coach-repository'

export class CoachingService {
  constructor(private repository: CoachRepository) {}

  /**
   * Assign a coach to a tournament
   */
  async assignCoachToTournament(
    coachId: string,
    tournamentId: string
  ): Promise<void> {
    const coach = await this.repository.findById(coachId)

    if (!coach) {
      throw new Error('Coach not found')
    }

    coach.assignToTournament(tournamentId)
    await this.repository.save(coach)
  }

  /**
   * Get coaches available for a tournament (not already assigned)
   */
  async getAvailableCoaches(tournamentId: string): Promise<Coach[]> {
    const allCoaches = await this.repository.findAll(true) // Active only

    return allCoaches.filter(coach =>
      !coach.getAssignedTournaments().includes(tournamentId)
    )
  }

  /**
   * Get all coaches assigned to a tournament
   */
  async getTournamentCoaches(tournamentId: string): Promise<Coach[]> {
    const allCoaches = await this.repository.findAll(true)

    return allCoaches.filter(coach =>
      coach.getAssignedTournaments().includes(tournamentId)
    )
  }

  /**
   * Remove coach from tournament
   */
  async removeCoachFromTournament(
    coachId: string,
    tournamentId: string
  ): Promise<void> {
    const coach = await this.repository.findById(coachId)

    if (!coach) {
      throw new Error('Coach not found')
    }

    coach.unassignFromTournament(tournamentId)
    await this.repository.save(coach)
  }
}
```

#### Step 3: Add Dependency Injection

```typescript
// lib/services.ts
import { CoachingService } from '@/infrastructure/services/coaching-service'
import { PrismaCoachRepository } from '@/infrastructure/repositories/coach-repository'

// Singleton instances
let coachingServiceInstance: CoachingService | null = null

export function getCoachingService(): CoachingService {
  if (!coachingServiceInstance) {
    const repository = new PrismaCoachRepository()
    coachingServiceInstance = new CoachingService(repository)
  }
  return coachingServiceInstance
}
```

#### Step 4: Document Public Methods

```typescript
/**
 * Coaching Service
 *
 * Handles business logic related to coach management and tournament assignments.
 *
 * @example
 * ```typescript
 * const service = getCoachingService()
 * await service.assignCoachToTournament('coach-123', 'tournament-456')
 * ```
 */
export class CoachingService {
  /**
   * Assign a coach to a tournament
   *
   * @param coachId - The coach's unique identifier
   * @param tournamentId - The tournament's unique identifier
   * @throws {Error} If coach not found
   * @throws {Error} If coach is inactive
   * @throws {Error} If coach already assigned to tournament
   */
  async assignCoachToTournament(
    coachId: string,
    tournamentId: string
  ): Promise<void> {
    // ...
  }
}
```

---

## Database Management

### Prisma Workflow

#### Edit Schema

```bash
# Open schema file
vim prisma/schema.prisma
```

Add or modify models:

```prisma
model Example {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Create Migration

```bash
# Development migration (with name)
pnpm prisma migrate dev --name add_example_table

# This will:
# 1. Create SQL migration file in prisma/migrations/
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

#### Generate Prisma Client

After schema changes:

```bash
pnpm prisma generate
```

This regenerates the type-safe Prisma Client.

#### View Database

```bash
# Open Prisma Studio (GUI)
pnpm db:studio

# Or use psql
psql -U postgres -d golf_tournament
```

### Schema Design Best Practices

#### Naming Conventions

- **Tables**: Singular, PascalCase (`Tournament`, `Player`, not `tournaments`)
- **Fields**: camelCase (`firstName`, `tournamentDate`)
- **Relations**: Descriptive (`tournament`, `registrations`, not `t` or `regs`)
- **Enums**: PascalCase with UPPER_SNAKE values

```prisma
enum TournamentStatus {
  DRAFT
  OPEN_FOR_REGISTRATION
  IN_PROGRESS
  COMPLETED
}

model Tournament {
  id              String           @id @default(cuid())
  name            String
  status          TournamentStatus @default(DRAFT)
  registrations   Registration[]
}
```

#### Index Strategy

Add indexes for:
- Foreign keys (Prisma auto-indexes)
- Frequently queried fields
- Fields used in WHERE, ORDER BY, JOIN

```prisma
model Player {
  id          String @id @default(cuid())
  email       String @unique
  memberNumber String? @unique

  @@index([email])          // Frequently queried
  @@index([memberNumber])   // Lookups
}
```

#### Relationship Patterns

**One-to-Many:**

```prisma
model Tournament {
  id            String         @id @default(cuid())
  registrations Registration[]
}

model Registration {
  id           String     @id @default(cuid())
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  @@index([tournamentId])
}
```

**Many-to-Many:**

```prisma
model Tournament {
  id      String              @id @default(cuid())
  players TournamentPlayer[]
}

model Player {
  id          String              @id @default(cuid())
  tournaments TournamentPlayer[]
}

model TournamentPlayer {
  id           String     @id @default(cuid())
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  playerId     String
  player       Player     @relation(fields: [playerId], references: [id])

  @@unique([tournamentId, playerId])
  @@index([tournamentId])
  @@index([playerId])
}
```

#### JSON Field Usage

Use JSON for flexible, non-queryable data:

```prisma
model Tournament {
  teesUsed        Json  // { "men": "white", "women": "red" }
  sponsorPackages Json? // Flexible sponsor data
}
```

**When to use JSON:**
- Data structure varies
- Don't need to query/filter by these fields
- Embedded objects (not separate entities)

**When NOT to use JSON:**
- Need to query/filter
- Referential integrity required
- Data should be normalized

### Migrations

#### Development Migrations

```bash
# Create and apply migration
pnpm prisma migrate dev --name add_feature

# Reset database (LOSES ALL DATA)
pnpm prisma migrate reset

# Apply pending migrations
pnpm prisma migrate dev
```

#### Production Migrations

```bash
# Deploy migrations (safe for production)
pnpm prisma migrate deploy

# This only applies migrations, doesn't create new ones
```

**Important**: Never use `migrate dev` in production!

#### Rollback Strategy

Prisma doesn't support automatic rollbacks. To revert:

1. **Create a new migration** that undoes changes:

```bash
pnpm prisma migrate dev --name revert_feature
```

2. **Manually edit migration SQL** before applying:

```sql
-- migration.sql
ALTER TABLE "Tournament" DROP COLUMN "newField";
```

#### Data Migrations

For schema changes that require data transformation:

```typescript
// prisma/migrations/20240115_transform_data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Fetch data
  const tournaments = await prisma.tournament.findMany()

  // Transform
  for (const tournament of tournaments) {
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        newField: transformOldField(tournament.oldField),
      },
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run after migration:

```bash
pnpm prisma migrate dev --name transform_data
tsx prisma/migrations/20240115_transform_data.ts
```

#### Breaking Changes

When making breaking changes:

1. **Add new field** (migration 1)
2. **Populate new field** (data migration)
3. **Update application** to use new field
4. **Remove old field** (migration 2)

This ensures zero-downtime deployments.

---

## Testing Guide

### Unit Tests (Vitest)

Unit tests focus on testing **individual functions/classes** in isolation.

#### Running Tests

```bash
# Watch mode (recommended during development)
pnpm test

# Single run
pnpm test --run

# With coverage
pnpm test --coverage

# Specific file
pnpm test domain/entities/tournament.test.ts

# With UI
pnpm test:ui
```

#### Writing Domain Entity Tests

```typescript
// domain/entities/tournament.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Tournament } from './tournament'
import { createTestTournament } from '@/tests/factories/tournament-factory'

describe('Tournament', () => {
  describe('create', () => {
    it('should create tournament with valid data', () => {
      const tournament = Tournament.create({
        name: 'Club Championship',
        format: 'STABLEFORD',
        category: 'CLUB_CHAMPIONSHIP',
        tournamentDate: new Date('2025-06-15'),
        registrationStart: new Date('2025-05-01'),
        registrationEnd: new Date('2025-06-01'),
      })

      expect(tournament.getStatus()).toBe('DRAFT')
      expect(tournament.getName()).toBe('Club Championship')
      expect(tournament.getFormat()).toBe('STABLEFORD')
    })

    it('should throw error if tournament date is before registration end', () => {
      expect(() => {
        Tournament.create({
          name: 'Test',
          format: 'STABLEFORD',
          category: 'CASUAL',
          tournamentDate: new Date('2025-05-15'),
          registrationStart: new Date('2025-05-01'),
          registrationEnd: new Date('2025-06-01'), // After tournament!
        })
      }).toThrow('Tournament date must be after registration end date')
    })

    it('should throw error if registration start is after end', () => {
      expect(() => {
        Tournament.create({
          name: 'Test',
          format: 'STABLEFORD',
          category: 'CASUAL',
          tournamentDate: new Date('2025-06-15'),
          registrationStart: new Date('2025-06-01'),
          registrationEnd: new Date('2025-05-01'), // Before start!
        })
      }).toThrow('Registration start must be before registration end')
    })
  })

  describe('openForRegistration', () => {
    it('should change status from DRAFT to OPEN_FOR_REGISTRATION', () => {
      const tournament = createTestTournament()

      tournament.openForRegistration()

      expect(tournament.getStatus()).toBe('OPEN_FOR_REGISTRATION')
    })

    it('should throw error if not in DRAFT status', () => {
      const tournament = createTestTournament()
      tournament.openForRegistration()

      expect(() => {
        tournament.openForRegistration()
      }).toThrow('Can only open draft tournaments for registration')
    })
  })

  describe('canPlayerRegister', () => {
    it('should allow player with valid handicap', () => {
      const tournament = createTestTournament({
        requireHandicap: true,
        maxHandicap: 36,
      })

      const result = tournament.canPlayerRegister(25.5)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should reject player with handicap exceeding maximum', () => {
      const tournament = createTestTournament({
        maxHandicap: 28,
      })

      const result = tournament.canPlayerRegister(35.5)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('exceeds maximum')
    })
  })
})
```

#### Test Factories

Create factories for test data:

```typescript
// tests/factories/tournament-factory.ts
import { Tournament, CreateTournamentParams } from '@/domain/entities/tournament'

export function createTestTournament(
  overrides?: Partial<CreateTournamentParams>
): Tournament {
  const defaults: CreateTournamentParams = {
    name: 'Test Tournament',
    format: 'STABLEFORD',
    category: 'CASUAL',
    tournamentDate: new Date('2025-06-15'),
    registrationStart: new Date('2025-05-01'),
    registrationEnd: new Date('2025-06-01'),
    minPlayers: 4,
    requireHandicap: true,
    allowGuests: true,
  }

  return Tournament.create({ ...defaults, ...overrides })
}
```

Usage:

```typescript
it('should test something', () => {
  // Default tournament
  const tournament1 = createTestTournament()

  // Customize specific fields
  const tournament2 = createTestTournament({
    name: 'Special Tournament',
    maxPlayers: 100,
  })
})
```

### Integration Tests

Integration tests verify that **multiple components work together** correctly.

#### API Route Tests

```typescript
// app/api/tournaments/route.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testApiHandler } from '@/tests/test-utils'
import { prisma } from '@/lib/prisma'
import { GET, POST } from './route'

describe('GET /api/tournaments', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.tournament.deleteMany()
  })

  it('should return empty array when no tournaments', async () => {
    const request = new Request('http://localhost/api/tournaments')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual([])
  })

  it('should return tournaments ordered by date', async () => {
    // Create test data
    await prisma.tournament.createMany({
      data: [
        {
          name: 'Future Tournament',
          format: 'STABLEFORD',
          category: 'CASUAL',
          status: 'DRAFT',
          tournamentDate: new Date('2025-08-01'),
          registrationStart: new Date('2025-07-01'),
          registrationEnd: new Date('2025-07-25'),
          minPlayers: 4,
        },
        {
          name: 'Upcoming Tournament',
          format: 'STROKE_PLAY',
          category: 'MONTHLY_MEDAL',
          status: 'OPEN_FOR_REGISTRATION',
          tournamentDate: new Date('2025-06-15'),
          registrationStart: new Date('2025-05-01'),
          registrationEnd: new Date('2025-06-01'),
          minPlayers: 4,
        },
      ],
    })

    const request = new Request('http://localhost/api/tournaments')
    const response = await GET(request)

    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Upcoming Tournament') // Earlier date first
  })
})

describe('POST /api/tournaments', () => {
  it('should create tournament with valid data', async () => {
    const tournamentData = {
      name: 'New Tournament',
      format: 'STABLEFORD',
      category: 'CLUB_CHAMPIONSHIP',
      tournamentDate: '2025-06-15',
      registrationStart: '2025-05-01',
      registrationEnd: '2025-06-01',
      maxPlayers: 120,
      entryFee: 25.00,
    }

    const request = new Request('http://localhost/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const tournament = await response.json()
    expect(tournament.name).toBe('New Tournament')
    expect(tournament.status).toBe('DRAFT')

    // Verify in database
    const dbTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
    })
    expect(dbTournament).not.toBeNull()
  })

  it('should return 400 with validation errors', async () => {
    const invalidData = {
      name: 'X', // Too short
    }

    const request = new Request('http://localhost/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error).toBe('Validation failed')
  })
})
```

### E2E Tests (Playwright)

E2E tests verify **complete user workflows** through the UI.

#### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run specific test file
pnpm test:e2e tests/e2e/tournament-lifecycle.spec.ts

# Debug mode
pnpm test:e2e --debug
```

#### Writing E2E Tests

```typescript
// tests/e2e/tournament-lifecycle.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Tournament Lifecycle', () => {
  test('should create, open, and complete tournament', async ({ page }) => {
    // Navigate to new tournament page
    await page.goto('/tournaments/new')

    // Fill out form
    await page.fill('[name="name"]', 'E2E Test Tournament')
    await page.selectOption('[name="format"]', 'STABLEFORD')
    await page.selectOption('[name="category"]', 'MONTHLY_MEDAL')
    await page.fill('[name="tournamentDate"]', '2025-06-15')
    await page.fill('[name="registrationStart"]', '2025-05-01')
    await page.fill('[name="registrationEnd"]', '2025-06-01')
    await page.fill('[name="maxPlayers"]', '100')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to tournament detail page
    await expect(page).toHaveURL(/\/tournaments\/\w+/)
    await expect(page.locator('h1')).toContainText('E2E Test Tournament')
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('DRAFT')

    // Open for registration
    await page.click('button:has-text("Open for Registration")')
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('OPEN_FOR_REGISTRATION')

    // Navigate to leaderboard (should be empty)
    await page.click('a:has-text("Leaderboard")')
    await expect(page.locator('h1')).toContainText('Leaderboard')
    await expect(page.locator('[data-testid="leaderboard-empty"]')).toBeVisible()
  })

  test('should submit score and see updated leaderboard', async ({ page }) => {
    // Assume tournament exists and is in progress
    const tournamentId = 'test-tournament-id'
    const scorecardId = 'test-scorecard-id'

    // Navigate to scoring page
    await page.goto(`/scoring/${scorecardId}`)

    // Enter scores for each hole
    for (let hole = 1; hole <= 18; hole++) {
      await page.fill(`[name="hole-${hole}"]`, '4')
    }

    // Submit scorecard
    await page.fill('[name="markerName"]', 'Test Marker')
    await page.click('button:has-text("Submit Scorecard")')

    // Should show confirmation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Navigate to leaderboard
    await page.goto(`/tournaments/${tournamentId}/leaderboard`)

    // Should see player on leaderboard
    await expect(page.locator('[data-testid="leaderboard-row"]')).toHaveCount(1)
  })
})
```

#### Page Object Pattern

For complex pages, use Page Object pattern:

```typescript
// tests/e2e/pages/tournament-page.ts
import { Page } from '@playwright/test'

export class TournamentPage {
  constructor(private page: Page) {}

  async goto(tournamentId: string) {
    await this.page.goto(`/tournaments/${tournamentId}`)
  }

  async openForRegistration() {
    await this.page.click('button:has-text("Open for Registration")')
  }

  async getStatus() {
    return await this.page.locator('[data-testid="status-badge"]').textContent()
  }

  async navigateToLeaderboard() {
    await this.page.click('a:has-text("Leaderboard")')
  }
}

// Usage in test
test('tournament operations', async ({ page }) => {
  const tournamentPage = new TournamentPage(page)

  await tournamentPage.goto('test-id')
  await tournamentPage.openForRegistration()

  const status = await tournamentPage.getStatus()
  expect(status).toBe('OPEN_FOR_REGISTRATION')
})
```

---

## API Documentation

### RESTful API Patterns

We follow REST best practices for all API endpoints.

#### URL Structure

```
/api/{resource}/{id?}/{sub-resource?}/{action?}
```

Examples:
```
GET    /api/tournaments           # List tournaments
POST   /api/tournaments           # Create tournament
GET    /api/tournaments/:id       # Get tournament
PATCH  /api/tournaments/:id       # Update tournament
DELETE /api/tournaments/:id       # Delete tournament

GET    /api/tournaments/:id/leaderboard  # Get leaderboard (SSE)
POST   /api/tournaments/:id/register     # Register player
POST   /api/tournaments/:id/flights/generate  # Generate flights
```

#### HTTP Methods

- **GET**: Retrieve resource(s)
- **POST**: Create new resource
- **PATCH**: Partial update of resource
- **PUT**: Full replacement of resource (rarely used)
- **DELETE**: Remove resource

#### Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Semantic error (business rule violation) |
| 500 | Internal Server Error | Server error |

#### Error Responses

Consistent error format:

```typescript
// Validation error (400)
{
  "error": "Validation failed",
  "details": {
    "name": {
      "_errors": ["String must contain at least 3 character(s)"]
    }
  }
}

// Not found (404)
{
  "error": "Tournament not found"
}

// Business rule violation (422)
{
  "error": "Cannot open registration for completed tournament"
}

// Server error (500)
{
  "error": "Internal server error"
}
```

#### Pagination

For list endpoints:

```typescript
GET /api/tournaments?page=2&limit=20

Response:
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### Filtering and Sorting

```typescript
// Filter by status
GET /api/tournaments?status=OPEN_FOR_REGISTRATION

// Filter by date range
GET /api/tournaments?startDate=2025-06-01&endDate=2025-06-30

// Sort
GET /api/tournaments?sortBy=tournamentDate&order=asc

// Combine
GET /api/tournaments?status=OPEN_FOR_REGISTRATION&sortBy=name&order=desc&page=1&limit=10
```

### API Endpoint Template

When creating new API endpoints, follow this template:

```typescript
/**
 * [HTTP Method] [Endpoint URL]
 *
 * [Brief description]
 *
 * @route [METHOD] /api/[path]
 * @auth [Required/Optional] ([ROLE1, ROLE2])
 * @param {string} [param] - [Description]
 * @query {string} [queryParam] - [Description]
 * @body {SchemaName}
 * @returns {ReturnType}
 * @throws {400} Validation error
 * @throws {404} Resource not found
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/tournaments', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     name: 'Club Championship',
 *     format: 'STABLEFORD',
 *   }),
 * })
 * ```
 */
export async function METHOD(
  request: NextRequest,
  context?: { params: Record<string, string> }
) {
  try {
    // 1. Extract and validate input
    // 2. Business logic
    // 3. Return response
  } catch (error) {
    // Error handling
  }
}
```

---

## Debugging Guide

### Development Tools

#### VSCode Debugger Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

Usage:
1. Set breakpoints in code
2. Press F5 or go to Run > Start Debugging
3. Select configuration

#### Chrome DevTools

- **Network tab**: Inspect API calls
- **Console**: View logs and errors
- **Application tab**: Inspect localStorage, cookies, service workers
- **Lighthouse**: Performance audits

#### React DevTools

Install [React Developer Tools](https://react.dev/learn/react-developer-tools) extension.

Features:
- Component tree inspection
- Props and state viewing
- Profiler for performance

#### Prisma Studio

Visual database editor:

```bash
pnpm db:studio
```

- Browse all tables
- Edit records
- Run queries
- View relationships

### Logging Best Practices

#### Server-Side Logging

```typescript
// ✅ Good: Structured logging
console.log('[TournamentService] Creating tournament:', {
  name: data.name,
  format: data.format,
  date: data.tournamentDate,
})

// ❌ Bad: Unstructured
console.log('creating tournament')
```

#### Client-Side Logging

```typescript
// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('[LeaderboardComponent] Received update:', data)
}
```

#### Error Logging

```typescript
try {
  // Operation
} catch (error) {
  console.error('[TournamentAPI] Failed to create tournament:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context: { userId, tournamentData },
  })

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error)
  }

  throw error
}
```

### Common Issues

#### Database Connection Errors

**Error**: `Can't reach database server`

**Solutions**:
1. Check PostgreSQL is running: `docker-compose ps`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`
4. Restart database: `docker-compose restart db`

#### Type Errors

**Error**: `Property 'X' does not exist on type 'Y'`

**Solutions**:
1. Regenerate Prisma Client: `pnpm prisma generate`
2. Restart TypeScript server in VSCode: Cmd+Shift+P > "Restart TS Server"
3. Check for typos in property names
4. Ensure types are imported correctly

#### Build Errors

**Error**: `Module not found` or `Cannot find module`

**Solutions**:
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check import paths are correct
4. Verify file exists at import path

#### Runtime Errors

**Error**: `X is not a function` or `Cannot read property of undefined`

**Solutions**:
1. Add null checks: `data?.property`
2. Ensure async data is loaded before use
3. Check console for full stack trace
4. Add defensive programming: type guards, validation

#### Test Failures

**Error**: Tests failing unexpectedly

**Solutions**:
1. Clear test cache: `pnpm test --clearCache`
2. Run tests in isolation: `pnpm test path/to/test.ts`
3. Check for test interdependencies
4. Verify mock data is correct
5. Add more descriptive assertions

---

## Contributing Guidelines

### Pull Request Process

1. **Create Feature Branch**

```bash
git checkout -b feature/my-new-feature
```

2. **Write Tests First** (TDD)

Write failing tests that define the behavior you want.

3. **Implement Feature**

Write code to make tests pass.

4. **Update Documentation**

Update relevant documentation files.

5. **Run All Tests**

```bash
pnpm test --run
pnpm test:e2e
pnpm type-check
```

6. **Create Pull Request**

Use the PR template and provide:
- Clear description
- Type of change
- Testing done
- Screenshots (if UI changes)

7. **Code Review**

Address reviewer feedback.

8. **Merge to Main**

After approval, squash and merge.

### Code Review Checklist

**For Authors:**

- [ ] Tests added/updated and passing
- [ ] TypeScript strict mode passing
- [ ] No console.logs (except intentional logging)
- [ ] Documentation updated
- [ ] No security vulnerabilities introduced
- [ ] Performance considered
- [ ] Accessibility considered (for UI changes)
- [ ] Error handling implemented
- [ ] Edge cases handled

**For Reviewers:**

- [ ] Code follows established patterns
- [ ] Tests are comprehensive
- [ ] No obvious bugs or issues
- [ ] Naming is clear and consistent
- [ ] Comments explain "why", not "what"
- [ ] No unnecessary complexity
- [ ] Performance implications acceptable
- [ ] Security best practices followed

### Commit Message Guidelines

Follow Conventional Commits:

```bash
feat(tournaments): add multi-day tournament support

- Add startDate and endDate to Tournament entity
- Update API to accept date ranges
- Add validation for date sequences

Closes #123
```

**Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/tooling

---

## Summary

You now have a comprehensive understanding of:

- Project structure and organization
- Domain-Driven Design and TDD practices
- Development environment setup
- Adding new features (entities, APIs, components, services)
- Database management with Prisma
- Testing strategies (unit, integration, E2E)
- API design patterns
- Debugging techniques
- Contributing guidelines

### Next Steps

1. **Read related documentation**:
   - [API Reference](./API_REFERENCE.md) - Complete API documentation
   - [Database Schema](./DATABASE.md) - Database structure and relationships
   - [Components](./COMPONENTS.md) - Component library documentation
   - [Best Practices](./BEST_PRACTICES.md) - Advanced best practices

2. **Explore the codebase**:
   - Start with `/domain/entities` to understand business logic
   - Look at `/app/api` for API patterns
   - Check `/components` for UI components

3. **Start contributing**:
   - Pick an issue from the backlog
   - Follow TDD: write test first
   - Submit your first PR!

### Getting Help

- **Documentation**: Check `/docs` directory
- **Code examples**: Look at existing implementations
- **Ask the team**: Don't hesitate to ask questions

Welcome to the team! Happy coding! ⛳
