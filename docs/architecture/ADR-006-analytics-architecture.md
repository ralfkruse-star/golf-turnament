# ADR-006: Analytics Architecture

**Status**: Accepted
**Date**: 2025-01-15
**Decision Makers**: Development Team
**Context**: Analytics and reporting (Phase 3)

## Context

We need analytics for:
- **Tournament Metrics**: Participation, completion rates
- **Player Analytics**: Performance trends, handicap changes
- **Revenue Tracking**: Entry fees, payment conversions
- **Usage Metrics**: Feature adoption, user engagement
- **Club Performance**: Multi-club comparison

## Decision

We will implement a **custom analytics system** with:
1. Database table for metrics (`AnalyticsMetric`)
2. Aggregation services for dashboards
3. Report generation (PDF/Excel)
4. Real-time metrics via SSE

### Data Model

```prisma
model AnalyticsMetric {
  id         String     @id
  metricType MetricType
  date       DateTime
  value      Decimal
  count      Int?
  metadata   Json?

  // Dimensions
  tournamentId String?
  playerId     String?
  clubId       String?

  @@index([metricType, date])
  @@index([clubId, date])
}
```

### Metric Types

```typescript
enum MetricType {
  // Tournament
  TOURNAMENT_PARTICIPATION
  REGISTRATION_CONVERSION
  SCORECARD_COMPLETION

  // Player
  PLAYER_PERFORMANCE
  AVERAGE_SCORE
  HANDICAP_CHANGE

  // Business
  REVENUE
  PAYMENT_CONVERSION

  // Engagement
  NOTIFICATION_DELIVERED
  NOTIFICATION_CLICKED
  PHOTO_UPLOADS
}
```

### Collection Strategy

**Event-based Collection**:
```typescript
async function trackTournamentRegistration(registration: Registration) {
  await prisma.analyticsMetric.create({
    data: {
      metricType: 'TOURNAMENT_PARTICIPATION',
      date: new Date(),
      value: 1,
      tournamentId: registration.tournamentId,
      playerId: registration.playerId,
      metadata: {
        registrationDate: registration.registeredAt,
        paymentMethod: registration.paymentMethod,
      },
    },
  })
}
```

**Scheduled Aggregation**:
```typescript
// Run daily via cron
async function aggregateDailyMetrics() {
  const yesterday = subDays(new Date(), 1)

  // Revenue
  const revenue = await prisma.registration.aggregate({
    where: {
      paidAt: {
        gte: startOfDay(yesterday),
        lt: endOfDay(yesterday),
      },
    },
    _sum: { entryFee: true },
    _count: true,
  })

  await prisma.analyticsMetric.create({
    data: {
      metricType: 'REVENUE',
      date: yesterday,
      value: revenue._sum.entryFee || 0,
      count: revenue._count,
    },
  })
}
```

### Dashboard Queries

**Optimized Aggregations**:
```typescript
async function getDashboardMetrics(clubId: string, dateRange: DateRange) {
  const metrics = await prisma.analyticsMetric.groupBy({
    by: ['metricType', 'date'],
    where: {
      clubId,
      date: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
    _sum: { value: true, count: true },
  })

  return formatDashboardData(metrics)
}
```

**Caching Strategy**:
```typescript
import { unstable_cache } from 'next/cache'

export const getCachedDashboard = unstable_cache(
  async (clubId: string) => getDashboardMetrics(clubId),
  ['dashboard-metrics'],
  { revalidate: 300 } // 5 minutes
)
```

## Alternatives Considered

### Alternative 1: Google Analytics
- **Pros**: Free, powerful, familiar
- **Cons**: Not for backend metrics, DSGVO concerns, client-side only
- **Rejected**: Need server-side analytics

### Alternative 2: Plausible/Fathom
- **Pros**: Privacy-friendly, DSGVO compliant, easy setup
- **Cons**: Limited custom events, subscription cost
- **Rejected**: Need more custom metrics

### Alternative 3: Third-party BI Tool (Metabase, Redash)
- **Pros**: Powerful queries, visualizations
- **Cons**: Additional infrastructure, complexity
- **Rejected**: Overkill for current needs

## Consequences

### Positive
- Full control over metrics
- Custom reports and dashboards
- DSGVO compliant (data stays in our DB)
- Real-time capabilities
- No external dependencies

### Negative
- Need to build visualization layer
- Database storage grows over time
- Manual metric definition
- No out-of-box funnel analysis

### Mitigations
- Use recharts for visualizations
- Archive old metrics periodically
- Document metric definitions
- Can integrate BI tool later if needed

## Implementation Notes

1. **Metric Collection**: Event-driven + scheduled aggregation
2. **Storage**: PostgreSQL (leveraging existing DB)
3. **Retention**: Keep raw data for 1 year, aggregated data indefinitely
4. **Visualization**: Recharts library
5. **Export**: PDF (jsPDF) and Excel (ExcelJS)

## Performance Considerations

- Index on `(metricType, date, clubId)`
- Use database aggregations (not in-memory)
- Cache dashboard queries
- Partition table if it grows very large

## Related Decisions
- ADR-001: Technology Stack (PostgreSQL)
- ADR-003: Multi-tenancy (club-specific analytics)
- ADR-005: Notifications (notification analytics)
