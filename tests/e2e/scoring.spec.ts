/**
 * E2E Tests: Scoring and Scorecard Submission
 */

import { test, expect } from '@playwright/test'
import { ScorecardPage } from './page-objects/ScorecardPage'
import { LeaderboardPage } from './page-objects/LeaderboardPage'
import { resetDatabase, prisma } from '../helpers/test-db'
import { createAndAuthenticatePlayer } from '../helpers/test-auth'

test.describe('Scoring and Scorecards', () => {
  let scorecardPage: ScorecardPage
  let leaderboardPage: LeaderboardPage
  let testData: any

  test.beforeEach(async ({ page }) => {
    testData = await resetDatabase()
    scorecardPage = new ScorecardPage(page)
    leaderboardPage = new LeaderboardPage(page)

    // Authenticate as player
    const player = await createAndAuthenticatePlayer(page)

    // Create registration for player
    await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: testData.players[0].handicapIndex,
        tee: 'white',
      },
    })

    // Update tournament to IN_PROGRESS
    await prisma.tournament.update({
      where: { id: testData.tournament.id },
      data: { status: 'IN_PROGRESS' },
    })
  })

  test('should start a new scorecard', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    const status = await scorecardPage.getScorecardStatus()
    expect(status).toBe('IN_PROGRESS')
  })

  test('should enter scores for all 18 holes', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    const scores = [4, 5, 3, 6, 4, 5, 3, 5, 4, 4, 5, 3, 4, 4, 3, 6, 4, 4]
    await scorecardPage.complete18Holes(scores)

    const totalGross = await scorecardPage.getTotalGross()
    expect(totalGross).toBe(scores.reduce((a, b) => a + b, 0))
  })

  test('should calculate stableford points correctly', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    // Enter realistic scores
    await scorecardPage.enterFullHole(1, { score: 4, putts: 2 }) // Par
    await scorecardPage.enterFullHole(2, { score: 3, putts: 1 }) // Birdie
    await scorecardPage.enterFullHole(3, { score: 4, putts: 2 }) // Bogey (par 3)

    const totalPoints = await scorecardPage.getTotalPoints()
    expect(totalPoints).toBeGreaterThan(0)
  })

  test('should track putts and stats', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    await scorecardPage.enterFullHole(1, {
      score: 4,
      putts: 2,
      fairwayHit: true,
      gir: true,
    })

    // Stats should be visible
    const isVisible = await scorecardPage.isVisible('[data-testid="stats-summary"]')
    expect(isVisible).toBeTruthy()
  })

  test('should require marker name before submission', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    // Complete all holes
    const scores = Array(18).fill(4)
    await scorecardPage.complete18Holes(scores)

    // Try to submit without marker
    await scorecardPage.submitScorecard()

    const error = await scorecardPage.isVisible('[data-testid="marker-required"]')
    expect(error).toBeTruthy()
  })

  test('should submit scorecard successfully', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    // Complete all holes
    const scores = [4, 5, 3, 6, 4, 5, 3, 5, 4, 4, 5, 3, 4, 4, 3, 6, 4, 4]
    await scorecardPage.complete18Holes(scores)

    // Enter marker and submit
    await scorecardPage.enterMarkerName('John Doe')
    await scorecardPage.submitScorecard()
    await scorecardPage.confirmSubmission()

    await scorecardPage.verifySubmitted()
    await scorecardPage.waitForToast('Scorecard submitted')
  })

  test('should show scorecard on leaderboard after submission', async () => {
    // Submit scorecard
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    const scores = Array(18).fill(4) // 72 total
    await scorecardPage.complete18Holes(scores)

    await scorecardPage.enterMarkerName('Marker Name')
    await scorecardPage.submitScorecard()
    await scorecardPage.confirmSubmission()
    await scorecardPage.verifySubmitted()

    // Check leaderboard
    await leaderboardPage.navigateToLeaderboard(testData.tournament.id)

    const playerScore = await leaderboardPage.getPlayerScore(testData.players[0].id)
    expect(playerScore).toBe(72)
  })

  test('should calculate net score with handicap', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    const scores = Array(18).fill(4) // 72 gross
    await scorecardPage.complete18Holes(scores)

    const totalNet = await scorecardPage.getTotalNet()
    const totalGross = await scorecardPage.getTotalGross()

    expect(totalNet).toBeLessThan(totalGross)
  })

  test('should prevent editing submitted scorecard', async () => {
    // Create submitted scorecard
    await prisma.scorecard.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        scores: Array(18).fill({ hole: 1, gross: 4 }),
        totalGross: 72,
        totalNet: 62,
        totalPoints: 36,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        markerName: 'Test Marker',
      },
    })

    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    // Should be read-only
    const isReadOnly = await scorecardPage.isVisible('[data-testid="scorecard-readonly"]')
    expect(isReadOnly).toBeTruthy()
  })

  test('should download scorecard as PDF', async ({ page }) => {
    // Create completed scorecard
    await prisma.scorecard.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        scores: Array(18).fill({ hole: 1, gross: 4 }),
        totalGross: 72,
        totalNet: 62,
        totalPoints: 36,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })

    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    const download = await scorecardPage.downloadScorecard()
    expect(download).toBeTruthy()
  })

  test('should handle incomplete rounds', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    // Only fill first 9 holes
    for (let i = 1; i <= 9; i++) {
      await scorecardPage.enterScore(i, 4)
    }

    // Should show incomplete warning
    await scorecardPage.submitScorecard()

    const warning = await scorecardPage.isVisible('[data-testid="incomplete-round"]')
    expect(warning).toBeTruthy()
  })

  test('should auto-save progress', async () => {
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    await scorecardPage.startScorecard()

    // Enter a few scores
    await scorecardPage.enterScore(1, 4)
    await scorecardPage.enterScore(2, 5)
    await scorecardPage.enterScore(3, 3)

    // Wait for auto-save
    await scorecardPage.page.waitForTimeout(2000)

    // Reload page
    await scorecardPage.navigateToScorecard(
      testData.tournament.id,
      testData.players[0].id
    )

    // Scores should be preserved
    const status = await scorecardPage.getScorecardStatus()
    expect(status).toBe('IN_PROGRESS')
  })
})
