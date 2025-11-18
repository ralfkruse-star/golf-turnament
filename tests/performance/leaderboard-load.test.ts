/**
 * Performance Test: Leaderboard with Large Player Count
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma, createTestPlayers } from '../helpers/test-db'

describe('Leaderboard Performance', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should load leaderboard with 100+ players efficiently', async () => {
    const players = await createTestPlayers(150)

    // Create registrations
    await prisma.registration.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    // Create scorecards
    const scorecards = await prisma.scorecard.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        scores: Array.from({ length: 18 }, (_, i) => ({
          hole: i + 1,
          gross: Math.floor(Math.random() * 3) + 3,
        })),
        totalGross: Math.floor(Math.random() * 20) + 70,
        totalNet: Math.floor(Math.random() * 20) + 60,
        totalPoints: Math.floor(Math.random() * 15) + 25,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    // Measure query performance
    const startTime = performance.now()

    const leaderboard = await prisma.scorecard.findMany({
      where: {
        tournamentId: testData.tournament.id,
        status: 'SUBMITTED',
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            handicapIndex: true,
          },
        },
      },
      orderBy: {
        totalPoints: 'desc',
      },
      take: 100,
    })

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(leaderboard.length).toBeGreaterThan(0)
    expect(queryTime).toBeLessThan(1000) // Should complete in less than 1 second
  })

  it('should paginate leaderboard efficiently', async () => {
    const players = await createTestPlayers(200)

    await prisma.registration.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    await prisma.scorecard.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        scores: [],
        totalGross: Math.floor(Math.random() * 20) + 70,
        totalPoints: Math.floor(Math.random() * 15) + 25,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    const pageSize = 20
    const startTime = performance.now()

    // Get first page
    const page1 = await prisma.scorecard.findMany({
      where: { tournamentId: testData.tournament.id },
      include: { player: true },
      orderBy: { totalPoints: 'desc' },
      take: pageSize,
      skip: 0,
    })

    // Get second page
    const page2 = await prisma.scorecard.findMany({
      where: { tournamentId: testData.tournament.id },
      include: { player: true },
      orderBy: { totalPoints: 'desc' },
      take: pageSize,
      skip: pageSize,
    })

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(page1.length).toBe(pageSize)
    expect(page2.length).toBe(pageSize)
    expect(queryTime).toBeLessThan(500) // Both queries in < 500ms
  })

  it('should calculate rankings efficiently for large tournament', async () => {
    const players = await createTestPlayers(120)

    await prisma.scorecard.createMany({
      data: players.map((player, index) => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        scores: [],
        totalGross: 72 + index,
        totalPoints: 40 - Math.floor(index / 3),
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    const startTime = performance.now()

    // Get scorecards with rankings
    const scorecards = await prisma.scorecard.findMany({
      where: {
        tournamentId: testData.tournament.id,
        status: 'SUBMITTED',
      },
      include: {
        player: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    })

    // Add ranking
    const leaderboardWithRankings = scorecards.map((scorecard, index) => ({
      ...scorecard,
      position: index + 1,
    }))

    const endTime = performance.now()
    const processingTime = endTime - startTime

    expect(leaderboardWithRankings.length).toBe(120)
    expect(leaderboardWithRankings[0].position).toBe(1)
    expect(processingTime).toBeLessThan(1000)
  })

  it('should filter leaderboard by division efficiently', async () => {
    const players = await createTestPlayers(150)

    await prisma.scorecard.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        scores: [],
        totalGross: Math.floor(Math.random() * 20) + 70,
        totalPoints: Math.floor(Math.random() * 15) + 25,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    const startTime = performance.now()

    // Filter by handicap division (0-18)
    const divisionLeaderboard = await prisma.scorecard.findMany({
      where: {
        tournamentId: testData.tournament.id,
        status: 'SUBMITTED',
        player: {
          handicapIndex: {
            lte: 18,
          },
        },
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            handicapIndex: true,
          },
        },
      },
      orderBy: {
        totalPoints: 'desc',
      },
    })

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(divisionLeaderboard.length).toBeGreaterThan(0)
    expect(queryTime).toBeLessThan(800)
  })

  it('should handle concurrent leaderboard queries', async () => {
    const players = await createTestPlayers(100)

    await prisma.scorecard.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        scores: [],
        totalGross: Math.floor(Math.random() * 20) + 70,
        totalPoints: Math.floor(Math.random() * 15) + 25,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    const startTime = performance.now()

    // Simulate 10 concurrent requests
    const queries = Array.from({ length: 10 }, () =>
      prisma.scorecard.findMany({
        where: { tournamentId: testData.tournament.id },
        include: { player: true },
        orderBy: { totalPoints: 'desc' },
        take: 50,
      })
    )

    const results = await Promise.all(queries)

    const endTime = performance.now()
    const totalTime = endTime - startTime

    expect(results.length).toBe(10)
    expect(totalTime).toBeLessThan(3000) // All 10 queries in < 3 seconds
  })
})
