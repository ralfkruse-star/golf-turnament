# ADR-001: Technology Stack Selection

**Status**: Accepted
**Date**: 2025-11-18
**Decision Makers**: Development Team
**Context**: Golf Tournament Management System for Golfplatz Siek

## Context

We need to select a technology stack for building a modern, scalable, and maintainable golf tournament management system with the following requirements:

- Real-time leaderboard updates
- Mobile-first player experience
- Integration with PC Caddie (existing club management system)
- WHS/DGV handicap integration
- DSGVO compliance (EU data protection)
- Support for 800+ members
- Multi-tournament concurrent handling
- QR-code based features (check-in, scoring)

## Decision

### Frontend & Backend Framework
**Next.js 14 (App Router)** with TypeScript

**Rationale**:
- Full-stack framework (Frontend + API in one codebase)
- Server-Side Rendering (SSR) for SEO and initial load performance
- App Router with Server Components reduces client-side JavaScript
- Built-in API routes eliminate need for separate backend
- Excellent TypeScript support
- Large ecosystem and community
- Vercel deployment or self-hosted flexibility

### Database
**PostgreSQL 16** with **Prisma ORM**

**Rationale**:
- PostgreSQL: Industry standard, ACID compliant, excellent JSON support
- Prisma: Type-safe database access, automatic migrations, introspection
- Strong support for complex relationships (tournaments, players, scores)
- JSONB for flexible sponsor/event metadata
- EU-hostable (DSGVO requirement)

### UI Framework
**React 18** with **Tailwind CSS** + **shadcn/ui**

**Rationale**:
- React: Component reusability, large ecosystem
- Tailwind: Utility-first, responsive design, small bundle size
- shadcn/ui: Accessible, customizable components (no bloated library)
- Mobile-first approach out of the box

### Real-time Communication
**Server-Sent Events (SSE)** for leaderboards

**Rationale**:
- Simpler than WebSockets for one-way server→client updates
- Native browser support, automatic reconnection
- Works over HTTP (firewall-friendly)
- Lower resource consumption than polling
- Perfect for live scoring updates

### Authentication
**NextAuth.js v5**

**Rationale**:
- Native Next.js integration
- Multiple provider support (Email, OAuth)
- JWT + Database sessions
- DSGVO-compliant session handling
- Role-based access control (Admin, Marshal, Player)

### Testing
- **Vitest**: Unit and integration tests (faster than Jest)
- **Testing Library**: Component testing
- **Playwright**: E2E testing

### CI/CD
**GitHub Actions**

**Rationale**:
- Native GitHub integration
- Free for public repos, affordable for private
- Docker support
- Parallel job execution

### Deployment
**Docker** + **EU-based hosting** (Hetzner Cloud / AWS eu-central-1)

**Rationale**:
- Docker: Reproducible deployments, easy scaling
- EU hosting: DSGVO compliance requirement
- Hetzner: Cost-effective, EU-based, excellent performance
- AWS fallback: Enterprise-grade if needed

### Monitoring & Logging
**Sentry** (Errors) + **Plausible Analytics** (Privacy-friendly)

**Rationale**:
- Sentry: Industry standard error tracking, EU-hostable
- Plausible: DSGVO-compliant analytics (no cookies required)

## Alternatives Considered

### Alternative 1: Separate Frontend/Backend
- React SPA + Express.js/NestJS backend
- **Rejected**: More complexity, slower development, separate deployments

### Alternative 2: Ruby on Rails / Laravel
- Mature frameworks with rapid development
- **Rejected**: Smaller talent pool, less modern real-time capabilities

### Alternative 3: Firebase / Supabase
- Backend-as-a-Service solutions
- **Rejected**: Vendor lock-in, DSGVO concerns, less control

## Consequences

### Positive
- Single codebase for frontend + backend
- Type safety across the stack
- Excellent developer experience
- Fast iteration cycles
- Easy EU-DSGVO compliance
- Strong ecosystem support

### Negative
- Next.js learning curve for team members unfamiliar with it
- Server-side rendering complexity for highly dynamic content
- Vendor considerations if using Vercel (mitigated by self-hosting option)

### Neutral
- Node.js ecosystem (not as mature as Java/C# for enterprise)
- Need to handle database migrations carefully with Prisma

## Implementation Notes

1. Use **pnpm** for package management (faster, disk-efficient)
2. Enable **strict TypeScript** mode
3. Implement **API versioning** from day one (/api/v1/...)
4. Use **feature flags** for gradual rollouts
5. Set up **database backups** on day one

## Related Decisions
- ADR-002: Domain Model & Bounded Contexts
- ADR-003: Database Schema Design
- ADR-004: API Design (REST vs GraphQL)
- ADR-005: Real-time Architecture
