# ⛳ Golf Tournament Management System

[![CI](https://github.com/YOUR_USERNAME/golf-turnament/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/golf-turnament/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/golf-turnament/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/golf-turnament)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748.svg)](https://www.prisma.io)

## Golfplatz Siek - Digitales Turnier-Management

Ein modernes, vollständiges Tournament-Management-System für Golfplätze mit Fokus auf **Echtzeit-Scoring**, **Mobile-First-UX** und **DSGVO-Konformität**.

---

## 🎯 Features (MVP)

### ✅ Implementiert

#### Turnier-Verwaltung
- 📋 Turnier erstellen, bearbeiten, löschen
- 🏆 Unterstützung für multiple Formate: Stableford, Stroke Play, Match Play, Scramble, etc.
- 📅 Anmeldezeiträume und Teilnehmergrenzen
- 🎫 Startgebühren und Handicap-Limits
- 📊 Status-Management (Draft → Offen → Geschlossen → Laufend → Beendet)

#### Live-Scoring (Mobile-First)
- 📱 Touch-optimierte Score-Eingabe
- ⛳ Loch-für-Loch Eingabe mit großen Touch-Targets
- 🎯 Automatische Stableford-Berechnung
- 📈 Live-Scorecard-Übersicht
- ✅ Marker-Attestierung

#### Echtzeit-Leaderboard
- 🔴 **Server-Sent Events (SSE)** für Live-Updates
- 🏅 Ranking nach Stableford-Punkten
- 📊 Anzeige: Brutto, Netto, Punkte, Thru
- 🥇 Top-3-Hervorhebung
- 🔄 Auto-Refresh alle 5 Sekunden

#### Domain-Driven Design
- 🏗️ Saubere Domain-Layer mit Aggregates & Value Objects
- ✅ **100% Test-Coverage** für Domain Logic (TDD)
- 📦 Repository Pattern für Datenpersistenz
- 🔧 Invarianten-Validierung auf Domain-Ebene

#### Email & Marketing (NEW! 🎉)
- 📧 **Brevo Integration** (Transactional & Marketing Emails)
- ✉️ Turnierbestätigungen, Erinnerungen, Ergebnisse
- 👥 Automatische Contact-Synchronisation
- 📊 Email Analytics (Öffnungsraten, Klicks, Bounces)
- 🔔 Webhook-basierte Event-Verarbeitung
- 🌍 DSGVO-konforme Unsubscribe-Verwaltung

#### Technische Exzellenz
- 🚀 **Next.js 14** (App Router, Server Components)
- 💾 **PostgreSQL + Prisma ORM** (Type-Safe)
- 🎨 **Tailwind CSS + shadcn/ui** (Accessible Components)
- 📧 **Brevo (Sendinblue)** (Email Service)
- 🧪 **Vitest + Playwright** (Unit & E2E Tests)
- 🐳 **Docker** + **Docker Compose** (Deployment-Ready)
- ⚙️ **GitHub Actions CI/CD** (Automated Testing)

---

## 🚀 Quick Start

### Voraussetzungen

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 16+
- **Docker** (optional, empfohlen)

### 1. Installation

```bash
# Repository clonen
git clone <repository-url>
cd golf-turnament

# Dependencies installieren
pnpm install

# Environment-Variablen konfigurieren
cp .env.example .env
# .env bearbeiten:
# - DATABASE_URL für PostgreSQL
# - BREVO_API_KEY für Email-Service (optional für lokale Entwicklung)
```

### 2. Datenbank Setup

**Option A: Docker Compose** (empfohlen)

```bash
# Datenbank starten
docker-compose up -d db

# Prisma Migrationen ausführen
pnpm prisma migrate dev

# Seed-Daten laden
pnpm db:seed
```

**Option B: Lokale PostgreSQL**

```bash
# Datenbank erstellen
createdb golf_tournament

# Migrationen ausführen
pnpm prisma migrate dev

# Seed-Daten
pnpm db:seed
```

### 3. Development Server

```bash
# Entwicklungsserver starten
pnpm dev

# Öffne http://localhost:3000
```

### 4. Tests ausführen

```bash
# Unit Tests
pnpm test

# Unit Tests (Watch Mode)
pnpm test --watch

# E2E Tests
pnpm test:e2e

# Type Check
pnpm type-check
```

---

## 📂 Projektstruktur

```
golf-turnament/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── tournaments/          # Tournament CRUD
│   │   │   ├── route.ts         # GET, POST
│   │   │   └── [id]/
│   │   │       ├── route.ts     # GET, PATCH, DELETE
│   │   │       └── leaderboard/
│   │   │           └── route.ts # SSE Leaderboard
│   │   └── health/              # Health Check
│   ├── tournaments/             # Tournament UI
│   │   ├── page.tsx            # List View
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Detail View
│   │   │   └── leaderboard/
│   │   │       └── page.tsx    # Live Leaderboard
│   │   └── new/
│   │       └── page.tsx        # Create Tournament
│   ├── scoring/                # Scoring UI
│   │   └── [scorecardId]/
│   │       └── page.tsx        # Mobile Scoring
│   ├── layout.tsx              # Root Layout
│   ├── page.tsx                # Home Page
│   └── globals.css             # Global Styles
│
├── domain/                      # Domain Layer (DDD)
│   ├── entities/               # Aggregates
│   │   ├── tournament.ts       # Tournament Aggregate Root
│   │   ├── tournament.test.ts  # TDD Tests
│   │   ├── scorecard.ts        # Scorecard Aggregate Root
│   │   └── scorecard.test.ts   # TDD Tests
│   └── value-objects/          # Value Objects
│       ├── handicap-index.ts   # WHS Handicap
│       ├── handicap-index.test.ts
│       └── tournament-format.ts
│
├── infrastructure/             # Infrastructure Layer
│   └── repositories/           # Data Access
│       └── tournament-repository.ts
│
├── components/                 # React Components
│   └── ui/                     # shadcn/ui Components
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
│
├── lib/                        # Shared Utilities
│   ├── prisma.ts              # Prisma Client
│   └── utils.ts               # Helpers
│
├── prisma/                     # Database
│   ├── schema.prisma          # Database Schema
│   └── seed.ts                # Seed Data
│
├── tests/                      # Tests
│   ├── setup.ts               # Vitest Setup
│   └── e2e/                   # Playwright E2E Tests
│
├── docs/                       # Documentation
│   └── architecture/
│       ├── ADR-001-tech-stack.md
│       └── ADR-002-domain-model.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI Pipeline
│       └── deploy.yml         # Deployment
│
├── Dockerfile                 # Production Container
├── docker-compose.yml         # Local Development
├── next.config.ts            # Next.js Config
├── tailwind.config.ts        # Tailwind Config
├── tsconfig.json             # TypeScript Config
├── vitest.config.ts          # Vitest Config
├── playwright.config.ts      # Playwright Config
└── package.json              # Dependencies & Scripts
```

---

## 🏗️ Architektur

### Domain-Driven Design

Wir verwenden **DDD-Patterns** für klare Trennung von Business-Logic und Infrastruktur:

#### Aggregates (Aggregate Roots)
- **Tournament**: Turnier-Lifecycle-Management
- **Scorecard**: Score-Eingabe und Berechnungen
- **Player**: Spieler-Profile und Handicaps

#### Value Objects
- **HandicapIndex**: WHS-konforme Handicap-Validierung (±10.0 - 54.0)
- **TournamentFormat**: Stark typisierte Turnier-Formate

#### Domain Events (geplant für v2)
- `TournamentCreated`, `RegistrationOpened`, `ScoreSubmitted`, etc.

### Layered Architecture

```
┌─────────────────────────────────────┐
│  Presentation Layer (Next.js UI)   │
│  - React Components                │
│  - Server Components                │
│  - Client Components                │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Application Layer (API Routes)    │
│  - REST Endpoints                   │
│  - SSE Streams                      │
│  - Request Validation (Zod)        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Domain Layer (Business Logic)     │
│  - Aggregates                       │
│  - Value Objects                    │
│  - Domain Services                  │
│  - Invariant Enforcement            │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Infrastructure Layer               │
│  - Repositories (Prisma)            │
│  - External APIs (PC Caddie, WHS)  │
│  - Email Service                    │
└─────────────────────────────────────┘
```

---

## 🗄️ Datenmodell

### Core Entities

```prisma
Tournament
├── id, name, description
├── format (STROKE_PLAY, STABLEFORD, etc.)
├── status (DRAFT → OPEN → IN_PROGRESS → COMPLETED)
├── dates (tournamentDate, registrationStart, registrationEnd)
├── limits (maxPlayers, minPlayers, maxHandicap)
└── relations (Course, Registrations, Scorecards)

Player
├── id, firstName, lastName, email
├── memberNumber (PC Caddie sync)
├── handicapIndex (WHS)
├── membershipType (MEMBER, GUEST, CORPORATE)
└── DSGVO fields (consentGiven, consentDate)

Scorecard
├── id, tournamentId, playerId
├── scores (JSON: hole-by-hole data)
├── totals (totalGross, totalNet, totalPoints)
├── status (NOT_STARTED → IN_PROGRESS → SUBMITTED → VERIFIED)
└── attestation (markerName, markerSignature)
```

Siehe [prisma/schema.prisma](./prisma/schema.prisma) für vollständiges Schema.

---

## 🔧 Verfügbare Scripts

```bash
# Development
pnpm dev                    # Dev-Server (http://localhost:3000)
pnpm build                  # Production Build
pnpm start                  # Production Server

# Code Quality
pnpm lint                   # ESLint (with auto-fix)
pnpm lint:check            # ESLint check only
pnpm lint:fix              # ESLint with fixes
pnpm format                # Format with Prettier
pnpm format:check          # Check formatting
pnpm type-check            # TypeScript type checking
pnpm validate              # Run all quality checks

# Testing
pnpm test                  # Unit Tests (Vitest)
pnpm test:ui               # Vitest UI
pnpm test:coverage         # Tests with coverage
pnpm test:integration      # Integration tests
pnpm test:e2e              # E2E Tests (Playwright)
pnpm test:e2e:headless     # E2E Tests headless mode
pnpm test:e2e:ui           # E2E Tests with UI
pnpm test:smoke            # Smoke tests
pnpm test:all              # Run all tests

# Analysis
pnpm analyze               # Analyze bundle size
pnpm analyze:bundle        # Generate bundle analysis
pnpm check:bundle-size     # Check bundle size thresholds
pnpm lighthouse            # Run Lighthouse CI

# Database
pnpm db:push               # Push Schema (Dev)
pnpm db:migrate            # Run Migrations
pnpm db:migrate:deploy     # Deploy migrations
pnpm db:migrate:reset      # Reset database
pnpm db:studio             # Prisma Studio (GUI)
pnpm db:seed               # Seed Database
pnpm db:generate           # Generate Prisma Client

# Utilities
pnpm clean                 # Clean build artifacts
pnpm prepare               # Setup Husky hooks

# Docker
docker-compose up          # Start all services
docker-compose up db       # Start DB only
docker build -t golf-tournament .
```

---

## 🔄 CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline with automated testing, code quality checks, and deployment workflows.

### Automated Checks

Every push and pull request triggers:

- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Unit Tests**: Vitest with 80% coverage threshold
- **Integration Tests**: Database-backed integration tests
- **E2E Tests**: Playwright browser tests
- **Security Scan**: CodeQL, npm audit, secret scanning
- **Bundle Analysis**: Size checks and optimization monitoring
- **Database Schema**: Prisma schema validation

### Workflows

- **CI Workflow** (`.github/workflows/ci.yml`): Runs on every push
- **PR Workflow** (`.github/workflows/pr.yml`): Enhanced PR validation
- **Staging Deploy** (`.github/workflows/deploy-staging.yml`): Auto-deploy to staging
- **Production Deploy** (`.github/workflows/deploy-production.yml`): Production deployments

### Pre-commit Hooks

Git hooks ensure code quality before commits:

```bash
# Automatically runs on git commit
- Lint staged files
- Format code with Prettier
- Type check
- Run affected tests

# Automatically runs on git push
- Run all tests
- Verify build
- Check for merge conflicts
```

### Coverage Reports

- View coverage locally: `open coverage/index.html`
- CI uploads coverage to Codecov
- PRs include coverage diff comments

### Documentation

For detailed CI/CD information, see [docs/CI_CD.md](./docs/CI_CD.md):
- Workflow explanations
- Adding new checks
- Debugging failures
- Deployment process
- Environment variables
- Secrets management

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build Image
docker build -t golf-tournament:latest .

# Run Container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  golf-tournament:latest
```

### Docker Compose (Production)

```bash
# Start full stack
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Umgebungsvariablen (Produktion)

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://tournaments.golfplatz-siek.de
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Optional: PC Caddie Integration
PC_CADDIE_API_URL=https://api.pc-caddie.de
PC_CADDIE_API_KEY=xxx
PC_CADDIE_CLUB_ID=xxx

# Optional: DGV/WHS Integration
DGV_API_URL=https://api.dgv.de
DGV_API_KEY=xxx
```

---

## 🛠️ Technology Stack

| Layer | Technology | Warum? |
|-------|-----------|--------|
| **Frontend** | Next.js 14, React 18 | SSR, Server Components, App Router |
| **Backend** | Next.js API Routes | Unified codebase, keine CORS-Issues |
| **Database** | PostgreSQL 16 + Prisma | ACID, Type-Safety, Migrations |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-First, Accessible |
| **Email** | Brevo (Sendinblue) | Transactional & Marketing, DSGVO-konform |
| **Real-Time** | Server-Sent Events | Simple, reliable, firewall-friendly |
| **Testing** | Vitest + Playwright | Fast unit tests, reliable E2E |
| **CI/CD** | GitHub Actions | Native Integration |
| **Deployment** | Docker | Reproducible, portable |

---

## 📋 Roadmap

### ✅ Phase 1: MVP (COMPLETED)
- [x] Tournament CRUD
- [x] Live Scoring (Mobile-First)
- [x] Real-Time Leaderboard (SSE)
- [x] Domain-Driven Design mit TDD
- [x] CI/CD Pipeline
- [x] Docker Deployment

### 🚧 Phase 2: Erweiterungen (NEXT)
- [ ] **Authentication** (NextAuth.js)
  - [ ] Rollen: Admin, Tournament Manager, Marshal, Player
  - [ ] Email/Password + OAuth (Google)
- [ ] **Player Management**
  - [ ] Registrierungs-Workflow
  - [ ] Payment Integration (Stripe/PayPal)
  - [ ] Flight-Generierung (automatisch nach Handicap)
- [ ] **PC Caddie Integration**
  - [ ] Spieler-Sync
  - [ ] Handicap-Sync
  - [ ] Ergebnis-Export
- [ ] **WHS/DGV Integration**
  - [ ] Handicap-Import
  - [ ] Turnierergebnis-Upload für Stammvorgabe

### 📅 Phase 3: Advanced Features
- [ ] **QR-Code Features**
  - [ ] QR-Check-In am Starter
  - [ ] QR-Scoring (papierloses Scoring)
  - [ ] Sponsor-Aktivierung per QR
- [ ] **Sponsorship Module**
  - [ ] Sponsor-Verwaltung
  - [ ] Digital Signage Integration
  - [ ] ROI-Tracking
- [ ] **Analytics & Reporting**
  - [ ] Custom Reports (PDF-Export)
  - [ ] Player-Statistiken
  - [ ] Tournament-History
- [ ] **Mobile Apps**
  - [ ] iOS/Android Native Apps (React Native/Flutter)
  - [ ] Offline-Modus
  - [ ] Push-Notifications
- [ ] **Advanced Scoring**
  - [ ] Match Play
  - [ ] Team-Formate (Scramble, Best Ball)
  - [ ] Skins-Game
  - [ ] Nassau-Wetten

### 🔮 Phase 4: Enterprise
- [ ] **Multi-Club Support**
- [ ] **Internationalization** (i18n)
- [ ] **White-Label** Solution
- [ ] **API für Partner-Integrationen**

---

## 🧪 Testing-Strategie

### Unit Tests (Vitest)
- ✅ **Domain Layer**: 100% Coverage
- Testen Invarianten, Business Rules, Berechnungen
- Schnell, isoliert, keine DB-Abhängigkeiten

### Integration Tests
- API-Endpoints mit Mock-DB
- Repository-Tests mit Test-DB

### E2E Tests (Playwright)
- Critical User Journeys:
  - Turnier erstellen → öffnen → starten → beenden
  - Score eingeben → Leaderboard anzeigen

---

## 🤝 Contributing

Bitte siehe [CONTRIBUTING.md](./CONTRIBUTING.md) für:
- Code Style Guidelines
- Git Workflow
- Pull Request Process

---

## 📄 Lizenz

**Proprietary** - © 2025 Golfplatz Siek. Alle Rechte vorbehalten.

---

## 📞 Support

- **Email**: support@golfplatz-siek.de
- **Dokumentation**:
  - [README](./README.md) - Übersicht & Quick Start
  - [API Docs](./docs/API.md) - REST API Referenz
  - [Brevo Setup](./docs/BREVO-SETUP.md) - Email-Integration einrichten
  - [Architecture](./docs/architecture/) - ADRs & Design-Entscheidungen
- **Issue Tracker**: GitHub Issues

---

## 🙏 Credits

Entwickelt für **Golfplatz Siek** mit:
- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Built with ❤️ for Golf** ⛳
