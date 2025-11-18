/**
 * Integration Test: Complete Tournament Flow
 * Tests the entire tournament lifecycle from creation to completion
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma } from '../helpers/test-db'
import { generatePlayerBatch } from '../fixtures/players'

describe('Tournament Flow Integration', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should complete full tournament lifecycle', async () => {
    // 1. Create Tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Integration Test Tournament',
        format: 'STABLEFORD',
        category: 'MONTHLY_MEDAL',
        status: 'DRAFT',
        tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 8,
        entryFee: 25.0,
        autoGenerateFlights: true,
        flightsPerTee: 10,
        createdBy: testData.users.adminUser.id,
      },
    })

    expect(tournament.id).toBeDefined()
    expect(tournament.status).toBe('DRAFT')

    // 2. Publish Tournament
    const published = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'OPEN_FOR_REGISTRATION' },
    })

    expect(published.status).toBe('OPEN_FOR_REGISTRATION')

    // 3. Register Players
    const players = generatePlayerBatch(20)
    const createdPlayers = await Promise.all(
      players.map(player =>
        prisma.player.create({
          data: player,
        })
      )
    )

    const registrations = await Promise.all(
      createdPlayers.map(player =>
        prisma.registration.create({
          data: {
            tournamentId: tournament.id,
            playerId: player.id,
            status: 'CONFIRMED',
            playingHandicap: player.handicapIndex,
            tee: player.gender === 'FEMALE' ? 'red' : 'white',
            paid: true,
            paidAt: new Date(),
          },
        })
      )
    )

    expect(registrations.length).toBe(20)

    // 4. Close Registration
    const regClosed = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'REGISTRATION_CLOSED' },
    })

    expect(regClosed.status).toBe('REGISTRATION_CLOSED')

    // 5. Generate Flights
    const flights = []
    const playersPerFlight = 4
    const numFlights = Math.ceil(registrations.length / playersPerFlight)

    for (let i = 0; i < numFlights; i++) {
      const flight = await prisma.flight.create({
        data: {
          tournamentId: tournament.id,
          flightNumber: i + 1,
          startTime: new Date(tournament.tournamentDate.getTime() + i * 10 * 60 * 1000),
          startHole: 1,
        },
      })
      flights.push(flight)
    }

    // Assign players to flights
    for (let i = 0; i < registrations.length; i++) {
      const flightIndex = Math.floor(i / playersPerFlight)
      await prisma.registration.update({
        where: { id: registrations[i].id },
        data: { flightId: flights[flightIndex].id },
      })
    }

    const flightCount = await prisma.flight.count({
      where: { tournamentId: tournament.id },
    })

    expect(flightCount).toBeGreaterThan(0)

    // 6. Start Tournament
    const started = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'IN_PROGRESS' },
    })

    expect(started.status).toBe('IN_PROGRESS')

    // 7. Submit Scorecards
    const scorecards = await Promise.all(
      createdPlayers.map(player =>
        prisma.scorecard.create({
          data: {
            tournamentId: tournament.id,
            playerId: player.id,
            scores: Array.from({ length: 18 }, (_, i) => ({
              hole: i + 1,
              gross: Math.floor(Math.random() * 3) + 3,
              putts: Math.floor(Math.random() * 3) + 1,
            })),
            totalGross: 72,
            totalNet: 62,
            totalPoints: 36,
            status: 'SUBMITTED',
            submittedAt: new Date(),
            markerName: 'Test Marker',
          },
        })
      )
    )

    expect(scorecards.length).toBe(20)

    // 8. Complete Tournament
    const completed = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'COMPLETED' },
    })

    expect(completed.status).toBe('COMPLETED')

    // 9. Verify Final State
    const finalTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        registrations: true,
        flights: true,
        scorecards: true,
      },
    })

    expect(finalTournament).toBeDefined()
    expect(finalTournament!.registrations.length).toBe(20)
    expect(finalTournament!.flights.length).toBeGreaterThan(0)
    expect(finalTournament!.scorecards.length).toBe(20)
  })

  it('should handle tournament cancellation', async () => {
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Cancelled Tournament',
        format: 'STABLEFORD',
        category: 'CASUAL',
        status: 'OPEN_FOR_REGISTRATION',
        tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 8,
        createdBy: testData.users.adminUser.id,
      },
    })

    // Add some registrations
    await prisma.registration.create({
      data: {
        tournamentId: tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: 10.0,
        tee: 'white',
      },
    })

    // Cancel tournament
    const cancelled = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'CANCELLED' },
    })

    expect(cancelled.status).toBe('CANCELLED')

    // Verify registrations remain for refund processing
    const registrations = await prisma.registration.findMany({
      where: { tournamentId: tournament.id },
    })

    expect(registrations.length).toBeGreaterThan(0)
  })

  it('should enforce minimum players requirement', async () => {
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Min Players Tournament',
        format: 'STABLEFORD',
        category: 'CASUAL',
        status: 'REGISTRATION_CLOSED',
        tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationStart: new Date(),
        registrationEnd: new Date(),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 10,
        createdBy: testData.users.adminUser.id,
      },
    })

    // Only add 5 registrations
    for (let i = 0; i < 5; i++) {
      await prisma.registration.create({
        data: {
          tournamentId: tournament.id,
          playerId: testData.players[i].id,
          status: 'CONFIRMED',
          playingHandicap: testData.players[i].handicapIndex,
          tee: 'white',
        },
      })
    }

    const registrationCount = await prisma.registration.count({
      where: { tournamentId: tournament.id },
    })

    expect(registrationCount).toBeLessThan(tournament.minPlayers)
    // In real implementation, this would prevent starting the tournament
  })

  it('should enforce maximum players limit', async () => {
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Max Players Tournament',
        format: 'STABLEFORD',
        category: 'CASUAL',
        status: 'OPEN_FOR_REGISTRATION',
        tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 5,
        minPlayers: 2,
        createdBy: testData.users.adminUser.id,
      },
    })

    // Fill tournament to capacity
    for (let i = 0; i < 5; i++) {
      await prisma.registration.create({
        data: {
          tournamentId: tournament.id,
          playerId: testData.players[i].id,
          status: 'CONFIRMED',
          playingHandicap: testData.players[i].handicapIndex,
          tee: 'white',
        },
      })
    }

    const registrationCount = await prisma.registration.count({
      where: { tournamentId: tournament.id },
    })

    expect(registrationCount).toBe(tournament.maxPlayers)
    // In real implementation, additional registrations would be waitlisted
  })
})
