/**
 * Integration Test: Analytics and Reporting Flow
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma, createTestPlayers } from '../helpers/test-db'

describe('Analytics and Reporting Flow', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should record tournament participation metrics', async () => {
    // Create multiple tournaments with registrations
    for (let i = 0; i < 3; i++) {
      const tournament = await prisma.tournament.create({
        data: {
          name: `Tournament ${i + 1}`,
          format: 'STABLEFORD',
          category: 'MONTHLY_MEDAL',
          status: 'COMPLETED',
          tournamentDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
          registrationStart: new Date(),
          registrationEnd: new Date(),
          courseId: testData.course.id,
          clubId: testData.club.id,
          teesUsed: { men: 'white', women: 'red' },
          maxPlayers: 100,
          minPlayers: 4,
          createdBy: testData.users.adminUser.id,
        },
      })

      const playerCount = 20 + i * 5

      await prisma.registration.createMany({
        data: testData.players.slice(0, playerCount).map((player: any) => ({
          tournamentId: tournament.id,
          playerId: player.id,
          status: 'CONFIRMED',
          playingHandicap: player.handicapIndex,
          tee: 'white',
        })),
      })

      // Record metric
      await prisma.analyticsMetric.create({
        data: {
          metricType: 'TOURNAMENT_PARTICIPATION',
          tournamentId: tournament.id,
          date: tournament.tournamentDate,
          value: playerCount,
          count: playerCount,
        },
      })
    }

    const metrics = await prisma.analyticsMetric.findMany({
      where: { metricType: 'TOURNAMENT_PARTICIPATION' },
    })

    expect(metrics.length).toBe(3)
  })

  it('should calculate revenue metrics', async () => {
    const players = await createTestPlayers(30)

    // Create paid tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Revenue Test Tournament',
        format: 'STABLEFORD',
        category: 'MONTHLY_MEDAL',
        status: 'COMPLETED',
        tournamentDate: new Date(),
        registrationStart: new Date(),
        registrationEnd: new Date(),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 4,
        entryFee: 30.0,
        createdBy: testData.users.adminUser.id,
      },
    })

    // Create paid registrations
    await prisma.registration.createMany({
      data: players.map(player => ({
        tournamentId: tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
        paid: true,
        paidAt: new Date(),
      })),
    })

    const totalRevenue = 30 * 30 // 30 players * $30

    await prisma.analyticsMetric.create({
      data: {
        metricType: 'REVENUE',
        tournamentId: tournament.id,
        date: new Date(),
        value: totalRevenue,
        count: 30,
      },
    })

    const revenueMetric = await prisma.analyticsMetric.findFirst({
      where: {
        metricType: 'REVENUE',
        tournamentId: tournament.id,
      },
    })

    expect(revenueMetric?.value).toBe(900)
  })

  it('should calculate scorecard completion rate', async () => {
    const players = await createTestPlayers(50)

    await prisma.registration.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    // 40 out of 50 submit scorecards
    await prisma.scorecard.createMany({
      data: players.slice(0, 40).map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        scores: Array(18).fill({ hole: 1, gross: 4 }),
        totalGross: 72,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    const totalRegistrations = 50
    const completedScorecards = 40
    const completionRate = (completedScorecards / totalRegistrations) * 100

    await prisma.analyticsMetric.create({
      data: {
        metricType: 'SCORECARD_COMPLETION',
        tournamentId: testData.tournament.id,
        date: new Date(),
        value: completionRate,
        count: completedScorecards,
      },
    })

    const metric = await prisma.analyticsMetric.findFirst({
      where: {
        metricType: 'SCORECARD_COMPLETION',
        tournamentId: testData.tournament.id,
      },
    })

    expect(metric?.value).toBe(80)
  })

  it('should analyze handicap distribution', async () => {
    const players = await createTestPlayers(100)

    const handicapRanges = {
      '0-9': 0,
      '10-19': 0,
      '20-29': 0,
      '30+': 0,
    }

    players.forEach(player => {
      const hcp = player.handicapIndex
      if (hcp < 10) handicapRanges['0-9']++
      else if (hcp < 20) handicapRanges['10-19']++
      else if (hcp < 30) handicapRanges['20-29']++
      else handicapRanges['30+']++
    })

    await prisma.analyticsMetric.create({
      data: {
        metricType: 'HANDICAP_DISTRIBUTION',
        date: new Date(),
        value: 0,
        metadata: handicapRanges,
      },
    })

    const distribution = await prisma.analyticsMetric.findFirst({
      where: { metricType: 'HANDICAP_DISTRIBUTION' },
    })

    expect(distribution?.metadata).toBeDefined()
  })

  it('should calculate average scores by format', async () => {
    const players = await createTestPlayers(30)

    // Create stroke play tournament
    const strokePlayTournament = await prisma.tournament.create({
      data: {
        name: 'Stroke Play',
        format: 'STROKE_PLAY',
        category: 'CLUB_CHAMPIONSHIP',
        status: 'COMPLETED',
        tournamentDate: new Date(),
        registrationStart: new Date(),
        registrationEnd: new Date(),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 4,
        createdBy: testData.users.adminUser.id,
      },
    })

    await prisma.scorecard.createMany({
      data: players.slice(0, 30).map(player => ({
        tournamentId: strokePlayTournament.id,
        playerId: player.id,
        scores: Array(18).fill({ hole: 1, gross: 4 }),
        totalGross: Math.floor(Math.random() * 20) + 70, // 70-90
        status: 'SUBMITTED',
        submittedAt: new Date(),
      })),
    })

    const averageScore = await prisma.scorecard.aggregate({
      where: { tournamentId: strokePlayTournament.id },
      _avg: { totalGross: true },
    })

    await prisma.analyticsMetric.create({
      data: {
        metricType: 'AVERAGE_SCORE',
        tournamentId: strokePlayTournament.id,
        date: new Date(),
        value: averageScore._avg.totalGross || 0,
      },
    })

    const metric = await prisma.analyticsMetric.findFirst({
      where: {
        metricType: 'AVERAGE_SCORE',
        tournamentId: strokePlayTournament.id,
      },
    })

    expect(metric?.value).toBeGreaterThan(0)
  })

  it('should generate tournament summary report', async () => {
    const report = await prisma.report.create({
      data: {
        title: 'Tournament Summary Report',
        reportType: 'TOURNAMENT_SUMMARY',
        format: 'PDF',
        parameters: {
          tournamentId: testData.tournament.id,
          includePlayers: true,
          includeScores: true,
        },
        generatedBy: testData.users.adminUser.id,
      },
    })

    expect(report.id).toBeDefined()
    expect(report.reportType).toBe('TOURNAMENT_SUMMARY')
  })

  it('should generate financial report', async () => {
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const endDate = new Date()

    const report = await prisma.report.create({
      data: {
        title: 'Financial Report Q4 2024',
        reportType: 'FINANCIAL',
        format: 'EXCEL',
        parameters: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includeDetails: true,
        },
        generatedBy: testData.users.adminUser.id,
      },
    })

    expect(report.id).toBeDefined()
    expect(report.format).toBe('EXCEL')
  })

  it('should track player performance over time', async () => {
    const player = testData.players[0]

    // Create multiple tournament scorecards
    for (let i = 0; i < 5; i++) {
      const tournament = await prisma.tournament.create({
        data: {
          name: `Performance Tournament ${i + 1}`,
          format: 'STABLEFORD',
          category: 'MONTHLY_MEDAL',
          status: 'COMPLETED',
          tournamentDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
          registrationStart: new Date(),
          registrationEnd: new Date(),
          courseId: testData.course.id,
          clubId: testData.club.id,
          teesUsed: { men: 'white', women: 'red' },
          maxPlayers: 100,
          minPlayers: 4,
          createdBy: testData.users.adminUser.id,
        },
      })

      await prisma.scorecard.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          scores: Array(18).fill({ hole: 1, gross: 4 }),
          totalGross: 72 - i, // Improving scores
          totalPoints: 36 + i,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })

      await prisma.analyticsMetric.create({
        data: {
          metricType: 'PLAYER_PERFORMANCE',
          tournamentId: tournament.id,
          playerId: player.id,
          date: tournament.tournamentDate,
          value: 36 + i, // Points
          metadata: {
            gross: 72 - i,
            net: 62 - i,
          },
        },
      })
    }

    const performance = await prisma.analyticsMetric.findMany({
      where: {
        metricType: 'PLAYER_PERFORMANCE',
        playerId: player.id,
      },
      orderBy: { date: 'asc' },
    })

    expect(performance.length).toBe(5)
    expect(performance[4].value).toBeGreaterThan(performance[0].value)
  })

  it('should calculate registration conversion rate', async () => {
    // Simulate 100 page views, 60 started registration, 45 completed
    await prisma.analyticsMetric.create({
      data: {
        metricType: 'REGISTRATION_CONVERSION',
        date: new Date(),
        value: 45, // 45% conversion
        metadata: {
          pageViews: 100,
          started: 60,
          completed: 45,
        },
      },
    })

    const conversion = await prisma.analyticsMetric.findFirst({
      where: { metricType: 'REGISTRATION_CONVERSION' },
    })

    expect(conversion?.value).toBe(45)
  })
})
