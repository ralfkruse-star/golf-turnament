# Testing Guide

Comprehensive testing documentation for the Golf Tournament Management System.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Patterns](#test-patterns)
6. [Debugging](#debugging)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

## Overview

The Golf Tournament Management System has a comprehensive test suite covering:

- **Unit Tests**: Domain logic, services, and utilities (50+ tests)
- **Integration Tests**: API flows and database operations (30+ tests)
- **E2E Tests**: Complete user journeys using Playwright (50+ tests)
- **Performance Tests**: Load testing for critical features

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical API flows
- **E2E Tests**: All major user journeys
- **Performance Tests**: Core features with 100+ concurrent users

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── page-objects/             # Page object models
│   │   ├── BasePage.ts
│   │   ├── PlayerRegistrationPage.ts
│   │   ├── TournamentPage.ts
│   │   ├── ScorecardPage.ts
│   │   ├── AdminTournamentPage.ts
│   │   ├── PhotoGalleryPage.ts
│   │   └── LeaderboardPage.ts
│   ├── player-registration.spec.ts
│   ├── tournament-registration.spec.ts
│   ├── scoring.spec.ts
│   ├── photo-upload.spec.ts
│   ├── admin-tournament.spec.ts
│   ├── admin-analytics.spec.ts
│   ├── multi-club.spec.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── integration/                  # Integration tests (Vitest)
│   ├── tournament-flow.test.ts
│   ├── payment-flow.test.ts
│   ├── notification-flow.test.ts
│   ├── photo-flow.test.ts
│   └── analytics-flow.test.ts
├── performance/                  # Performance tests
│   ├── leaderboard-load.test.ts
│   └── photo-upload.test.ts
├── helpers/                      # Test utilities
│   ├── test-db.ts               # Database helpers
│   ├── test-auth.ts             # Authentication helpers
│   └── test-data.ts             # Data factories
├── fixtures/                     # Test data
│   ├── tournaments.ts
│   ├── players.ts
│   ├── clubs.ts
│   └── test-image.jpg
└── setup.ts                      # Global test setup
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Setup test database
createdb golf_tournament_test

# Run migrations
DATABASE_URL="postgresql://user:pass@localhost:5432/golf_tournament_test" pnpm prisma migrate deploy
```

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test

# Run specific test file
pnpm test domain/entities/tournament.test.ts

# Run with UI
pnpm test:ui
```

### Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific integration test
pnpm test tests/integration/tournament-flow.test.ts
```

### E2E Tests

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run with browser visible
pnpm test:e2e:headed

# Run with Playwright UI
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# Run specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Run mobile tests
pnpm test:e2e:mobile

# Run specific test file
pnpm test:e2e tests/e2e/player-registration.spec.ts
```

### Performance Tests

```bash
# Run performance tests
pnpm test:performance

# Run specific performance test
pnpm test tests/performance/leaderboard-load.test.ts
```

### All Tests

```bash
# Run complete test suite
pnpm test:all

# Run CI test suite
pnpm test:ci
```

## Writing Tests

### Unit Tests Example

```typescript
import { describe, it, expect } from 'vitest'
import { Tournament } from '@/domain/entities/tournament'

describe('Tournament', () => {
  it('should create valid tournament', () => {
    const tournament = new Tournament({
      name: 'Test Tournament',
      format: 'STABLEFORD',
      // ... other props
    })

    expect(tournament.isValid()).toBe(true)
  })

  it('should enforce minimum players', () => {
    const tournament = new Tournament({
      minPlayers: 10,
      // ...
    })

    expect(tournament.canStart(5)).toBe(false)
    expect(tournament.canStart(10)).toBe(true)
  })
})
```

### Integration Tests Example

```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma } from '../helpers/test-db'

describe('Tournament Flow Integration', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should complete full tournament lifecycle', async () => {
    // Create tournament
    const tournament = await prisma.tournament.create({
      data: { /* ... */ }
    })

    // Add registrations
    // Generate flights
    // Submit scorecards
    // Complete tournament

    expect(tournament.status).toBe('COMPLETED')
  })
})
```

### E2E Tests Example

```typescript
import { test, expect } from '@playwright/test'
import { PlayerRegistrationPage } from './page-objects/PlayerRegistrationPage'
import { resetDatabase } from '../helpers/test-db'

test.describe('Player Registration', () => {
  let registrationPage: PlayerRegistrationPage

  test.beforeEach(async ({ page }) => {
    await resetDatabase()
    registrationPage = new PlayerRegistrationPage(page)
    await registrationPage.navigateToRegistration()
  })

  test('should complete registration flow', async () => {
    await registrationPage.completeRegistration({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      handicapIndex: 15.0,
    })

    await registrationPage.verifyRegistrationSuccess()
  })
})
```

## Test Patterns

### Page Object Pattern (E2E)

Always use page objects for E2E tests:

```typescript
export class TournamentPage extends BasePage {
  async navigateToTournaments() {
    await this.goto('/tournaments')
  }

  async registerForTournament() {
    await this.click('[data-testid="register-button"]')
  }

  async getTournamentDetails() {
    return {
      name: await this.getText('[data-testid="tournament-name"]'),
      date: await this.getText('[data-testid="tournament-date"]'),
    }
  }
}
```

### Factory Pattern (Test Data)

Use factories for generating test data:

```typescript
export function tournamentFactory(overrides?: Partial<Tournament>) {
  return {
    name: `Test Tournament ${Date.now()}`,
    format: 'STABLEFORD',
    category: 'MONTHLY_MEDAL',
    ...overrides,
  }
}

// Usage
const tournament = await prisma.tournament.create({
  data: tournamentFactory({ name: 'Custom Name' })
})
```

### Database Reset Pattern

Always reset database before each test:

```typescript
beforeEach(async () => {
  testData = await resetDatabase()
})
```

### Authentication Pattern

Use helper functions for authentication:

```typescript
import { createAndAuthenticatePlayer } from '../helpers/test-auth'

test('authenticated test', async ({ page }) => {
  await createAndAuthenticatePlayer(page)
  // Now page is authenticated
})
```

## Debugging

### Debugging E2E Tests

```bash
# Run with browser visible
pnpm test:e2e:headed

# Run in debug mode (step through)
pnpm test:e2e:debug

# Run specific test with trace
pnpm test:e2e --trace on

# View trace
npx playwright show-trace trace.zip
```

### Debugging Unit/Integration Tests

```bash
# Run in debug mode
node --inspect-brk ./node_modules/.bin/vitest run

# Use console.log (temporary)
console.log('Debug info:', variable)

# Use vitest UI
pnpm test:ui
```

### Common Issues

**Database connection errors:**
```bash
# Ensure test database exists
createdb golf_tournament_test

# Run migrations
DATABASE_URL="..." pnpm prisma migrate deploy
```

**Test timeout:**
```typescript
// Increase timeout for specific test
test('slow test', async () => {
  // ...
}, { timeout: 60000 }) // 60 seconds
```

**Flaky tests:**
```typescript
// Use proper waits
await page.waitForSelector('[data-testid="element"]')
await page.waitForURL('/expected-path')

// Use retry logic
await expect(async () => {
  const count = await getCount()
  expect(count).toBe(5)
}).toPass({ timeout: 5000 })
```

## CI/CD Integration

### GitHub Actions

The CI pipeline runs automatically on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Workflow includes:**
1. Code quality checks (ESLint, Prettier, TypeScript)
2. Unit tests with coverage
3. Integration tests
4. E2E tests (Chromium only in CI)
5. Build verification
6. Security scanning
7. Database schema validation

### Running Locally Like CI

```bash
pnpm test:ci
```

### Test Reports

- **Coverage Report**: `coverage/lcov-report/index.html`
- **Playwright Report**: `playwright-report/index.html`
- **Test Results**: `test-results/`

## Best Practices

### General

1. **Test Naming**: Use descriptive test names
   ```typescript
   ✅ it('should prevent duplicate tournament registration')
   ❌ it('test 1')
   ```

2. **AAA Pattern**: Arrange, Act, Assert
   ```typescript
   // Arrange
   const tournament = createTestTournament()

   // Act
   const result = tournament.register(player)

   // Assert
   expect(result).toBe(true)
   ```

3. **Test Independence**: Each test should run independently
   ```typescript
   // Reset state before each test
   beforeEach(async () => {
     await resetDatabase()
   })
   ```

4. **Use Data Test IDs**: Always use `data-testid` attributes
   ```tsx
   <button data-testid="submit-button">Submit</button>
   ```

### E2E Tests

1. **Page Objects**: Always use page objects, never raw selectors in tests
2. **Wait Strategies**: Use proper waits, avoid arbitrary delays
3. **Screenshots**: Enable screenshots on failure
4. **Parallel Execution**: Keep tests independent for parallelization

### Integration Tests

1. **Database Cleanup**: Always clean up after tests
2. **Mock External Services**: Mock Stripe, Brevo, etc.
3. **Test Realistic Flows**: Test complete user journeys

### Performance

1. **Keep Tests Fast**: Unit tests < 1s, E2E tests < 5s
2. **Parallel Execution**: Run tests in parallel when possible
3. **Selective Testing**: Use `.only` during development (remove before commit)

### Coverage

1. **Meaningful Coverage**: Focus on critical paths, not just coverage %
2. **Edge Cases**: Test error conditions and edge cases
3. **Integration Over Isolation**: Prefer integration tests for critical flows

## Test Data Management

### Fixtures

Use fixtures for consistent test data:

```typescript
import { PLAYER_FIXTURES } from '../fixtures/players'

const lowHandicapper = PLAYER_FIXTURES.lowHandicapper
```

### Factories

Use factories for dynamic test data:

```typescript
import { playerFactory } from '../helpers/test-data'

const player = await prisma.player.create({
  data: playerFactory({ handicapIndex: 5.0 })
})
```

### Database Seeding

The `resetDatabase()` helper:
- Cleans all tables
- Seeds essential data (users, club, course, tournament, players)
- Returns test data for use in tests

## Continuous Improvement

### Adding New Tests

1. Identify the feature to test
2. Choose appropriate test type (unit/integration/e2e)
3. Create test file in correct directory
4. Write tests following patterns above
5. Ensure tests pass locally
6. Ensure tests pass in CI

### Maintaining Tests

1. **Keep Tests Updated**: Update tests when features change
2. **Remove Obsolete Tests**: Delete tests for removed features
3. **Refactor Test Code**: Keep test code clean and maintainable
4. **Review Test Failures**: Don't ignore failing tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review existing similar tests
3. Check test output and error messages
4. Review CI logs for failures
5. Ask the team for help

---

**Last Updated**: 2024-11-18
**Maintained By**: Development Team
