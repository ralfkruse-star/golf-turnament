# ADR-002: Domain Model & Bounded Contexts

**Status**: Accepted
**Date**: 2025-11-18
**Context**: Domain-Driven Design for Golf Tournament Management

## Context

We need to define clear bounded contexts and domain models to ensure:
- Separation of concerns
- Scalability
- Maintainability
- Clear ownership of business logic

## Bounded Contexts

### 1. **Tournament Management** (Core Domain)
**Responsibility**: Creating, configuring, and managing tournaments

**Aggregates**:
- `Tournament` (Aggregate Root)
  - TournamentId
  - Name, Date, Format (Stroke Play, Stableford, Match Play)
  - Course Setup (Tees, Par, Slope Rating)
  - Flights/Divisions
  - Registration Settings (Open/Closed, Max Players)
  - Sponsorship Slots
  - Status (Draft, Open, InProgress, Completed, Archived)

**Value Objects**:
- `TournamentFormat` (Stroke, Stableford, Nassau, etc.)
- `DateRange` (Start, End)
- `RegistrationWindow`

**Domain Services**:
- `TournamentFactory`: Create tournaments with validation
- `FlightGenerator`: Auto-generate flights based on handicaps

---

### 2. **Player Management** (Core Domain)
**Responsibility**: Managing player profiles, registrations, handicaps

**Aggregates**:
- `Player` (Aggregate Root)
  - PlayerId
  - MemberNumber (PC Caddie sync)
  - Name, Email, Phone
  - Handicap Index (WHS)
  - MembershipStatus (Member, Guest, Corporate)
  - ConsentGiven (DSGVO)

- `Registration` (Aggregate Root)
  - RegistrationId
  - TournamentId (reference)
  - PlayerId (reference)
  - Flight/Division assignment
  - Payment Status
  - Special Requests

**Value Objects**:
- `HandicapIndex` (validated WHS)
- `ContactInfo` (Email, Phone)
- `MembershipType`

**Domain Events**:
- `PlayerRegistered`
- `HandicapUpdated`
- `RegistrationCancelled`

---

### 3. **Scoring** (Core Domain)
**Responsibility**: Recording and calculating scores

**Aggregates**:
- `Scorecard` (Aggregate Root)
  - ScorecardId
  - TournamentId, PlayerId
  - Holes (1-18): Gross Score, Stableford Points, Putts
  - CoursePlayed (which tees)
  - AttestedBy (marker signature)
  - Status (InProgress, Submitted, Verified)

- `Leaderboard` (Read Model)
  - Calculated standings
  - Real-time rankings
  - Category winners

**Domain Services**:
- `ScoreCalculator`: Calculate Stableford, Net, Gross
- `HandicapAdjuster`: Apply playing handicap per hole
- `LeaderboardUpdater`: Recalculate standings on score updates

**Domain Events**:
- `ScoreSubmitted`
- `ScorecardCompleted`
- `LeaderboardUpdated`

---

### 4. **Handicap & WHS Integration** (Supporting Domain)
**Responsibility**: Sync with DGV/WHS systems

**External System Integration**:
- Sync handicaps from PC Caddie
- Post tournament results to WHS
- Validate handicap indexes

**Services**:
- `WHS_Sync_Service`: Fetch/update handicaps
- `PC_Caddie_Adapter`: Integration layer

---

### 5. **Sponsorship** (Supporting Domain)
**Responsibility**: Managing sponsor visibility and activation

**Aggregates**:
- `Sponsor` (Aggregate Root)
  - SponsorId
  - Name, Logo, Contact
  - Package Type (Platinum, Gold, Silver)
  - Activation Points (Holes, Digital Board, QR)

**Value Objects**:
- `SponsorPackage`
- `ActivationSlot` (Hole number, QR location)

---

### 6. **Communication** (Supporting Domain)
**Responsibility**: Sending notifications, emails, SMS

**Services**:
- `EmailService`: Transactional emails
- `SMSService`: Time-sensitive notifications
- `PushNotificationService`: Mobile app alerts

**Events Consumed**:
- `PlayerRegistered` → Send confirmation email
- `TournamentStarting` → Send reminder SMS
- `LeaderboardUpdated` → Push notification

---

## Domain Event Flow

```
PlayerRegistered
  → TournamentManagement.UpdateParticipantCount
  → Communication.SendConfirmationEmail
  → PaymentService.CreateInvoice (if applicable)

ScoreSubmitted
  → Scoring.CalculateStableford
  → Scoring.UpdateLeaderboard
  → Communication.NotifyRealTimeSubscribers (SSE)

TournamentCompleted
  → Scoring.FinalizeResults
  → WHS.PostScoresToHandicapSystem
  → Communication.SendResultsEmail
```

---

## Aggregate Design Rules

1. **Aggregates are consistency boundaries**
   - Changes within an aggregate are atomic
   - Changes across aggregates are eventually consistent (use domain events)

2. **Aggregate roots only**
   - External references only to aggregate roots via ID
   - Example: Scorecard references `TournamentId` and `PlayerId`, not full objects

3. **Small aggregates**
   - Prefer smaller aggregates for better concurrency
   - Example: `Scorecard` is separate from `Tournament`

4. **Invariants enforcement**
   - Tournament can't start if <4 players registered
   - Scorecard can't be submitted with missing holes
   - Handicap Index must be between -10.0 and 54.0

---

## Repository Pattern

Each aggregate root gets a repository:

```typescript
interface TournamentRepository {
  save(tournament: Tournament): Promise<void>
  findById(id: TournamentId): Promise<Tournament | null>
  findActive(): Promise<Tournament[]>
}

interface ScorecardRepository {
  save(scorecard: Scorecard): Promise<void>
  findByTournamentAndPlayer(tournamentId, playerId): Promise<Scorecard>
  findByTournament(tournamentId): Promise<Scorecard[]>
}
```

---

## Anti-Corruption Layer

**PC Caddie Integration**:
- PC Caddie uses different data models
- We create an adapter layer to translate:
  - PC Caddie Member → Our Player model
  - PC Caddie HCP → Our HandicapIndex value object
  - PC Caddie Event → Our Tournament model (optional sync)

---

## Consequences

### Positive
- Clear separation of concerns
- Domain logic in domain layer (not in API controllers)
- Testable business logic
- Event-driven architecture enables async processing
- Easy to add new features without impacting existing code

### Negative
- More upfront design effort
- Team needs DDD knowledge
- Potential over-engineering for simple CRUD

### Mitigations
- Start with core aggregates (Tournament, Player, Scorecard)
- Add domain events incrementally
- Refactor to DDD patterns as complexity grows

## Implementation Notes

1. Use TypeScript classes for Aggregates and Value Objects
2. Domain logic in `/src/domain/` folder
3. Infrastructure (Prisma repos) in `/src/infrastructure/`
4. API layer in `/src/app/api/` (Next.js routes)
5. Use Zod for runtime validation of value objects
