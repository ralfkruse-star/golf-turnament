# Coding Standards

Coding standards and style guide for the Golf Tournament Management System.

## Table of Contents

1. [File Naming](#file-naming)
2. [Variable Naming](#variable-naming)
3. [Function Naming](#function-naming)
4. [Class Naming](#class-naming)
5. [Import Order](#import-order)
6. [Code Organization](#code-organization)
7. [Comment Standards](#comment-standards)
8. [TypeScript Standards](#typescript-standards)
9. [React Standards](#react-standards)
10. [Testing Standards](#testing-standards)

---

## File Naming

### Convention: kebab-case

```
✅ tournament-repository.ts
✅ handicap-index.ts
✅ use-tournament.ts
❌ TournamentRepository.ts
❌ handicap_index.ts
```

### Component Files: PascalCase.tsx

```
✅ TournamentCard.tsx
✅ PhotoGallery.tsx
✅ LeaderboardTable.tsx
❌ tournament-card.tsx
❌ photo_gallery.tsx
```

### Test Files: .test.ts or .spec.ts

```
✅ tournament.test.ts
✅ handicap-index.test.ts
✅ tournament-api.spec.ts
❌ tournament-tests.ts
```

### Directory Names: kebab-case

```
✅ /domain/value-objects/
✅ /infrastructure/repositories/
✅ /components/ui/
❌ /Domain/ValueObjects/
❌ /infrastructure/Repositories/
```

---

## Variable Naming

### Convention: camelCase

```typescript
// ✅ Good
const tournamentId = 'cm123abc'
const maxPlayers = 120
const isRegistrationOpen = true

// ❌ Bad
const TournamentId = 'cm123abc'  // PascalCase for variables
const max_players = 120          // snake_case
const IsRegistrationOpen = true  // PascalCase
```

### Boolean Variables: Prefix with is/has/can/should

```typescript
// ✅ Good
const isActive = true
const hasRegistrations = players.length > 0
const canRegister = tournament.isAcceptingRegistrations()
const shouldSendEmail = user.emailConsent

// ❌ Bad
const active = true            // Unclear type
const registrations = true     // Confusing
const register = true          // Verb, not state
```

### Constants: UPPER_SNAKE_CASE

```typescript
// ✅ Good
const MAX_PLAYERS_PER_FLIGHT = 4
const DEFAULT_HANDICAP_INDEX = 36
const API_BASE_URL = 'https://api.example.com'

// ❌ Bad
const maxPlayersPerFlight = 4  // Looks like a variable
const defaultHandicapIndex = 36
```

### Arrays: Plural Names

```typescript
// ✅ Good
const tournaments = await getTournaments()
const players = registration.getPlayers()
const handicapIndexes = players.map(p => p.handicapIndex)

// ❌ Bad
const tournamentList = await getTournaments()  // Redundant 'List'
const player = registration.getPlayers()       // Singular for array
```

---

## Function Naming

### Convention: camelCase, Verb-Noun Pattern

```typescript
// ✅ Good
function createTournament(data: TournamentData): Tournament
function getTournaments(filters: TournamentFilters): Tournament[]
function calculateStablefordPoints(scores: Score[]): number
function validateHandicapIndex(value: number): boolean
function openForRegistration(tournament: Tournament): void

// ❌ Bad
function tournament(data: TournamentData)      // Missing verb
function TournamentCreate(data)                // PascalCase
function get_tournaments()                     // snake_case
```

### Boolean Functions: Prefix with is/has/can/should

```typescript
// ✅ Good
function isValidEmail(email: string): boolean
function hasRegistrations(tournament: Tournament): boolean
function canPlayerRegister(player: Player, tournament: Tournament): boolean
function shouldSendReminder(tournament: Tournament): boolean

// ❌ Bad
function validEmail(email: string): boolean      // Missing 'is'
function checkRegistrations(tournament): boolean // Vague
```

### Async Functions: Don't prefix with 'async'

```typescript
// ✅ Good
async function getTournament(id: string): Promise<Tournament>
async function createPlayer(data: PlayerData): Promise<Player>

// ❌ Bad
async function asyncGetTournament(id: string)  // Redundant 'async'
async function getTournamentAsync(id: string)  // Redundant suffix
```

---

## Class Naming

### Convention: PascalCase

```typescript
// ✅ Good
class Tournament { }
class HandicapIndex { }
class TournamentRepository { }
class EmailService { }

// ❌ Bad
class tournament { }           // camelCase
class handicap_index { }       // snake_case
class tournamentRepository { } // camelCase
```

### Domain Entities: Singular Nouns

```typescript
// ✅ Good
class Player { }
class Scorecard { }
class Registration { }

// ❌ Bad
class Players { }       // Plural
class PlayerEntity { }  // Redundant suffix
```

### Services: Suffix with 'Service'

```typescript
// ✅ Good
class EmailService { }
class AnalyticsService { }
class CoachingService { }

// ❌ Bad
class Email { }          // Unclear purpose
class Analytics { }      // Could be data class
```

### Repositories: Suffix with 'Repository'

```typescript
// ✅ Good
class TournamentRepository { }
class PlayerRepository { }

// ❌ Bad
class TournamentRepo { }    // Abbreviated
class Tournaments { }       // Unclear purpose
```

---

## Import Order

### Standard Order

```typescript
// 1. External libraries
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

// 2. Internal absolute imports (domain, infrastructure)
import { Tournament } from '@/domain/entities/tournament'
import { TournamentRepository } from '@/infrastructure/repositories/tournament-repository'

// 3. Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 4. Utilities
import { cn } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

// 5. Types
import type { TournamentData } from '@/types'

// 6. Relative imports (if any)
import { helper } from './helper'
```

### Group and Sort

```typescript
// ✅ Good: Grouped and alphabetically sorted
import { format, parseISO, subDays } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { Tournament } from '@/domain/entities/tournament'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

// ❌ Bad: Random order
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Tournament } from '@/domain/entities/tournament'
import { format } from 'date-fns'
```

---

## Code Organization

### File Structure

```typescript
// 1. Imports
import { ... } from '...'

// 2. Types and Interfaces
interface TournamentProps { }
type TournamentStatus = ...

// 3. Constants
const MAX_PLAYERS = 120

// 4. Main Code
export class Tournament {
  // Private fields first
  private constructor(private props: TournamentProps) { }

  // Static methods
  static create(params: CreateParams): Tournament { }

  // Public methods
  public getStatus(): TournamentStatus { }

  // Private methods
  private validate(): void { }
}

// 5. Helper Functions (at end)
function generateId(): string { }
```

### Function Length

**Keep functions focused and small (< 50 lines)**:

```typescript
// ✅ Good: Small, focused function
function calculateStablefordPoints(
  grossScore: number,
  par: number,
  playingHandicap: number
): number {
  const netScore = grossScore - playingHandicap
  const scoreVsPar = netScore - par

  if (scoreVsPar <= -2) return 4  // Eagle or better
  if (scoreVsPar === -1) return 3  // Birdie
  if (scoreVsPar === 0) return 2   // Par
  if (scoreVsPar === 1) return 1   // Bogey
  return 0  // Double bogey or worse
}

// ❌ Bad: Long function doing too much
function processScorecard(scorecard: Scorecard, tournament: Tournament) {
  // 100+ lines of mixed logic
  // Validation
  // Calculation
  // Persistence
  // Email sending
  // Analytics tracking
}
```

### Extract Complex Logic

```typescript
// ✅ Good: Extracted to named function
function registerPlayer(tournament: Tournament, player: Player) {
  if (!canPlayerRegister(tournament, player)) {
    throw new Error('Cannot register')
  }

  const registration = createRegistration(tournament, player)
  sendConfirmationEmail(registration)
  return registration
}

function canPlayerRegister(tournament: Tournament, player: Player): boolean {
  return (
    tournament.isAcceptingRegistrations() &&
    !tournament.isFull() &&
    tournament.meetsHandicapRequirement(player.handicapIndex)
  )
}

// ❌ Bad: Complex inline logic
function registerPlayer(tournament: Tournament, player: Player) {
  if (
    tournament.status === 'OPEN_FOR_REGISTRATION' &&
    (!tournament.maxPlayers || currentCount < tournament.maxPlayers) &&
    (!tournament.requireHandicap || player.handicapIndex !== undefined) &&
    (!tournament.maxHandicap || player.handicapIndex <= tournament.maxHandicap)
  ) {
    // Long registration logic...
  }
}
```

---

## Comment Standards

### JSDoc for Public APIs

```typescript
/**
 * Create a new tournament
 *
 * @param params - Tournament creation parameters
 * @returns Newly created tournament
 * @throws {Error} If validation fails
 *
 * @example
 * ```typescript
 * const tournament = Tournament.create({
 *   name: 'Club Championship 2025',
 *   format: 'STABLEFORD',
 *   tournamentDate: new Date('2025-06-15'),
 * })
 * ```
 */
static create(params: CreateTournamentParams): Tournament {
  // Implementation
}
```

### Explain "Why", Not "What"

```typescript
// ✅ Good: Explains reasoning
// Calculate playing handicap at registration time to ensure consistency
// even if the player's index changes before the tournament
const playingHandicap = calculatePlayingHandicap(
  player.handicapIndex,
  course.slopeRating,
  course.courseRating
)

// ❌ Bad: States the obvious
// Calculate playing handicap
const playingHandicap = calculatePlayingHandicap(...)
```

### TODOs with Context

```typescript
// ✅ Good: TODO with context and ticket
// TODO(GOLF-123): Implement SMS notifications when budget approved
// Currently using email only

// ❌ Bad: Vague TODO
// TODO: fix this
```

### Avoid Commented-Out Code

```typescript
// ❌ Bad: Commented-out code
function getTournaments() {
  // const old = await fetchOldWay()
  // return transform(old)

  return await prisma.tournament.findMany()
}

// ✅ Good: Remove it (use git history if needed)
function getTournaments() {
  return await prisma.tournament.findMany()
}
```

---

## TypeScript Standards

### Strict Mode

Always use strict mode:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### No `any` Type

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value
}

// ✅ Good: Specific type
interface DataStructure {
  value: string
}

function processData(data: DataStructure) {
  return data.value
}

// ✅ Also good: Unknown with type guard
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value)
  }
  throw new Error('Invalid data')
}
```

### Prefer Interfaces for Objects

```typescript
// ✅ Good: Interface for objects
interface Tournament {
  id: string
  name: string
  status: TournamentStatus
}

// ✅ Good: Type for unions/primitives
type TournamentStatus = 'DRAFT' | 'OPEN' | 'COMPLETED'
type ID = string
```

### Use Strict Null Checks

```typescript
// ✅ Good: Explicit null handling
function getTournament(id: string): Tournament | null {
  const tournament = await findTournament(id)
  return tournament ?? null
}

// Usage
const tournament = getTournament('123')
if (tournament) {
  // TypeScript knows tournament is not null here
  console.log(tournament.name)
}

// ❌ Bad: Returning undefined implicitly
function getTournament(id: string): Tournament {
  return findTournament(id)  // Might be undefined!
}
```

---

## React Standards

### Server Components by Default

```typescript
// ✅ Good: Server Component (default)
export default async function TournamentList() {
  const tournaments = await getTournaments()
  return <div>{tournaments.map(...)}</div>
}

// ✅ Good: Client Component when needed
'use client'

export function InteractiveComponent() {
  const [state, setState] = useState(false)
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### Component Naming: PascalCase

```typescript
// ✅ Good
export function TournamentCard({ tournament }: Props) { }
export function LeaderboardTable({ data }: Props) { }

// ❌ Bad
export function tournamentCard({ tournament }: Props) { }  // camelCase
export function tournament_card({ tournament }: Props) { }  // snake_case
```

### Props Interface: {ComponentName}Props

```typescript
// ✅ Good
interface TournamentCardProps {
  tournament: Tournament
  onSelect?: (id: string) => void
}

export function TournamentCard({ tournament, onSelect }: TournamentCardProps) {
  return <Card>...</Card>
}

// ❌ Bad
interface Props { }  // Too generic
interface ITournamentCardProps { }  // Unnecessary I prefix
```

### Destructure Props

```typescript
// ✅ Good: Destructured props
export function TournamentCard({ tournament, onSelect }: Props) {
  return <Card onClick={() => onSelect?.(tournament.id)}>
    {tournament.name}
  </Card>
}

// ❌ Bad: Using props object
export function TournamentCard(props: Props) {
  return <Card onClick={() => props.onSelect?.(props.tournament.id)}>
    {props.tournament.name}
  </Card>
}
```

---

## Testing Standards

### Test File Naming

```
✅ tournament.test.ts          // Domain entity
✅ tournament-repository.test.ts // Infrastructure
✅ route.test.ts               // API route
❌ test-tournament.ts
❌ tournament.spec.ts          // Use .test.ts
```

### Describe Blocks: Entity/Function Name

```typescript
// ✅ Good
describe('Tournament', () => {
  describe('create', () => {
    it('should create tournament with valid data', () => { })
    it('should throw error if dates invalid', () => { })
  })

  describe('openForRegistration', () => {
    it('should change status to OPEN_FOR_REGISTRATION', () => { })
  })
})

// ❌ Bad
describe('Tests', () => {  // Too vague
  it('works', () => { })   // Unclear
})
```

### Test Descriptions: Should Statements

```typescript
// ✅ Good
it('should create tournament with valid data', () => { })
it('should throw error if tournament date is before registration end', () => { })
it('should return empty array when no tournaments exist', () => { })

// ❌ Bad
it('creates tournament', () => { })        // Missing 'should'
it('test tournament creation', () => { })  // Unclear
it('works', () => { })                     // Too vague
```

### Arrange-Act-Assert Pattern

```typescript
it('should calculate stableford points correctly', () => {
  // Arrange
  const grossScore = 5
  const par = 4
  const playingHandicap = 1

  // Act
  const points = calculateStablefordPoints(grossScore, par, playingHandicap)

  // Assert
  expect(points).toBe(2)
})
```

---

## Additional Resources

- **TypeScript Style Guide**: https://google.github.io/styleguide/tsguide.html
- **React Best Practices**: https://react.dev/learn
- **Clean Code Principles**: "Clean Code" by Robert C. Martin

---

*Last Updated: 2025-01-15*
