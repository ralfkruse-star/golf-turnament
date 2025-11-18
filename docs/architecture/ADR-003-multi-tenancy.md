# ADR-003: Multi-Tenancy Architecture

**Status**: Accepted
**Date**: 2025-01-15
**Decision Makers**: Development Team
**Context**: Multi-club support (Phase 4)

## Context

We need to support multiple golf clubs using the same platform while maintaining:
- Data isolation between clubs
- Customizable branding (white-label)
- Different feature sets per subscription tier
- Efficient resource utilization

## Decision

We will implement **multi-tenancy with a shared database and discriminator column** approach.

### Architecture

**Club Model**:
```prisma
model Club {
  id        String   @id
  slug      String   @unique  // URL identifier
  name      String
  tier      ClubTier
  features  Json     // Feature flags

  // Branding
  logo           String?
  primaryColor   String?
  customDomain   String? @unique

  // Relations
  tournaments Tournament[]
  courses     Course[]
  members     ClubMember[]
}
```

**Discriminator Pattern**:
All multi-tenant tables include `clubId`:
```prisma
model Tournament {
  id      String  @id
  clubId  String?
  club    Club?   @relation(...)
  // ...
}
```

**Routing Strategy**:
- **Subdomain**: `{clubslug}.tournament-platform.com`
- **Path**: `tournament-platform.com/{clubslug}/tournaments`
- **Custom Domain**: `tournaments.golf-club.com`

### Implementation

**Middleware for Club Context**:
```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const clubSlug = extractClubSlug(hostname)

  request.headers.set('x-club-slug', clubSlug)
  return NextResponse.next()
}
```

**Club Context Hook**:
```typescript
export function useClub() {
  const params = useParams()
  const clubSlug = params.clubSlug || getClubSlugFromHeaders()
  return getClubBySlug(clubSlug)
}
```

**Data Isolation**:
```typescript
// Always filter by clubId
const tournaments = await prisma.tournament.findMany({
  where: {
    clubId: currentClub.id,
    status: 'OPEN_FOR_REGISTRATION',
  },
})
```

## Alternatives Considered

### Alternative 1: Separate Databases Per Club
- **Pros**: Complete isolation, easier to backup individual clubs
- **Cons**: Expensive, complex migrations, harder to aggregate data
- **Rejected**: Not cost-effective for small clubs

### Alternative 2: Schema-based Multi-tenancy
- **Pros**: Better isolation than discriminator, easier queries
- **Cons**: PostgreSQL schema limit, complex migrations
- **Rejected**: Adds unnecessary complexity

### Alternative 3: Separate Application Instances
- **Pros**: Complete isolation, independent scaling
- **Cons**: Very expensive, maintenance nightmare
- **Rejected**: Not scalable

## Consequences

### Positive
- Cost-effective for clubs of all sizes
- Easy to add new clubs
- Shared infrastructure and maintenance
- Cross-club analytics possible
- Easy migration path for existing single-tenant

### Negative
- Must be careful with data isolation
- Query complexity increases
- Potential for data leaks if not careful
- Performance considerations with large number of clubs

### Mitigations
- Strict access control checks
- Row-level security (future)
- Comprehensive integration tests for data isolation
- Performance monitoring and optimization

## Implementation Notes

1. **Add clubId to all tables** in phases
2. **Default club** for existing data
3. **Middleware** to inject club context
4. **Feature flags** per club tier
5. **Billing integration** with Stripe

## Related Decisions
- ADR-001: Technology Stack
- ADR-006: Analytics Architecture (club-specific metrics)
