/**
 * E2E Tests: Admin Tournament Management
 */

import { test, expect } from '@playwright/test'
import { AdminTournamentPage } from './page-objects/AdminTournamentPage'
import { resetDatabase, createTestPlayers, prisma } from '../helpers/test-db'
import { createAndAuthenticateAdmin } from '../helpers/test-auth'

test.describe('Admin Tournament Management', () => {
  let adminPage: AdminTournamentPage
  let testData: any

  test.beforeEach(async ({ page }) => {
    testData = await resetDatabase()
    adminPage = new AdminTournamentPage(page)
    await createAndAuthenticateAdmin(page)
  })

  test('should create new tournament successfully', async () => {
    await adminPage.navigateToCreateTournament()

    const tournamentDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    const regStart = new Date()
    const regEnd = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)

    await adminPage.fillBasicInfo({
      name: 'New Test Tournament',
      description: 'A newly created tournament',
      format: 'STABLEFORD',
      category: 'MONTHLY_MEDAL',
      tournamentDate: tournamentDate.toISOString().split('T')[0],
    })

    await adminPage.fillRegistrationDates({
      registrationStart: regStart.toISOString().split('T')[0],
      registrationEnd: regEnd.toISOString().split('T')[0],
    })

    await adminPage.selectCourse(testData.course.id)

    await adminPage.setLimits({
      maxPlayers: 120,
      minPlayers: 8,
      entryFee: 30,
      maxHandicap: 36,
    })

    await adminPage.configureFlights({
      autoGenerate: true,
      minutesPerFlight: 10,
    })

    await adminPage.saveTournament()
    await adminPage.waitForToast('Tournament created successfully')
  })

  test('should edit existing tournament', async () => {
    await adminPage.navigateToEditTournament(testData.tournament.id)

    await adminPage.fillBasicInfo({
      name: 'Updated Tournament Name',
      format: 'STROKE_PLAY',
      category: 'CLUB_CHAMPIONSHIP',
      tournamentDate: new Date().toISOString().split('T')[0],
    })

    await adminPage.saveTournament()
    await adminPage.waitForToast('Tournament updated')
  })

  test('should publish tournament', async () => {
    // Create draft tournament
    const draftTournament = await prisma.tournament.create({
      data: {
        name: 'Draft Tournament',
        format: 'STABLEFORD',
        category: 'CASUAL',
        status: 'DRAFT',
        tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 4,
        createdBy: testData.users.adminUser.id,
      },
    })

    await adminPage.navigateToEditTournament(draftTournament.id)
    await adminPage.publishTournament()
    await adminPage.waitForToast('Tournament published')

    // Verify status changed
    const updated = await prisma.tournament.findUnique({
      where: { id: draftTournament.id },
    })
    expect(updated?.status).toBe('OPEN_FOR_REGISTRATION')
  })

  test('should generate flights automatically', async () => {
    // Create tournament with registrations
    const players = await createTestPlayers(40)

    await prisma.registration.createMany({
      data: players.map(player => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.generateFlights()
    await adminPage.waitForToast('Flights generated')

    await adminPage.viewFlights()
    const flightCount = await adminPage.getFlightCount()
    expect(flightCount).toBeGreaterThan(0)
  })

  test('should view and manage registrations', async () => {
    // Create registrations
    await prisma.registration.createMany({
      data: testData.players.map((player: any) => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
        paid: false,
      })),
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.viewRegistrations()

    const count = await adminPage.getRegistrationCount()
    expect(count).toBe(testData.players.length)
  })

  test('should mark player as paid', async () => {
    const registration = await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: 10.0,
        tee: 'white',
        paid: false,
      },
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.viewRegistrations()
    await adminPage.markPlayerPaid(registration.id)
    await adminPage.waitForToast('Payment recorded')

    const updated = await prisma.registration.findUnique({
      where: { id: registration.id },
    })
    expect(updated?.paid).toBeTruthy()
  })

  test('should cancel registration', async () => {
    const registration = await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: 10.0,
        tee: 'white',
      },
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.viewRegistrations()
    await adminPage.cancelRegistration(registration.id)
    await adminPage.waitForToast('Registration cancelled')

    const updated = await prisma.registration.findUnique({
      where: { id: registration.id },
    })
    expect(updated?.status).toBe('CANCELLED')
  })

  test('should export registrations to Excel', async () => {
    await prisma.registration.createMany({
      data: testData.players.map((player: any) => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.viewRegistrations()

    const download = await adminPage.exportRegistrations()
    expect(download).toBeTruthy()
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('should filter registrations by status', async () => {
    await prisma.registration.createMany({
      data: [
        {
          tournamentId: testData.tournament.id,
          playerId: testData.players[0].id,
          status: 'CONFIRMED',
          playingHandicap: 10.0,
          tee: 'white',
        },
        {
          tournamentId: testData.tournament.id,
          playerId: testData.players[1].id,
          status: 'PENDING',
          playingHandicap: 15.0,
          tee: 'white',
        },
        {
          tournamentId: testData.tournament.id,
          playerId: testData.players[2].id,
          status: 'CANCELLED',
          playingHandicap: 20.0,
          tee: 'white',
        },
      ],
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.viewRegistrations()
    await adminPage.filterRegistrationsByStatus('CONFIRMED')

    // Should show only confirmed registrations
    const count = await adminPage.getRegistrationCount()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('should search registrations by player name', async () => {
    await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: 10.0,
        tee: 'white',
      },
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.viewRegistrations()
    await adminPage.searchRegistrations(testData.players[0].firstName)

    const isVisible = await adminPage.isVisible(`text=${testData.players[0].firstName}`)
    expect(isVisible).toBeTruthy()
  })

  test('should start tournament', async () => {
    // Tournament must be in REGISTRATION_CLOSED status
    await prisma.tournament.update({
      where: { id: testData.tournament.id },
      data: { status: 'REGISTRATION_CLOSED' },
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.startTournament()
    await adminPage.waitForToast('Tournament started')

    const updated = await prisma.tournament.findUnique({
      where: { id: testData.tournament.id },
    })
    expect(updated?.status).toBe('IN_PROGRESS')
  })

  test('should complete tournament', async () => {
    // Tournament must be IN_PROGRESS
    await prisma.tournament.update({
      where: { id: testData.tournament.id },
      data: { status: 'IN_PROGRESS' },
    })

    await adminPage.navigateToEditTournament(testData.tournament.id)
    await adminPage.completeTournament()
    await adminPage.waitForToast('Tournament completed')

    const updated = await prisma.tournament.findUnique({
      where: { id: testData.tournament.id },
    })
    expect(updated?.status).toBe('COMPLETED')
  })

  test('should validate minimum players before starting', async () => {
    // Create tournament with min 10 players
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Min Players Test',
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

    // Only 2 registrations
    await prisma.registration.createMany({
      data: [
        {
          tournamentId: tournament.id,
          playerId: testData.players[0].id,
          status: 'CONFIRMED',
          playingHandicap: 10.0,
          tee: 'white',
        },
        {
          tournamentId: tournament.id,
          playerId: testData.players[1].id,
          status: 'CONFIRMED',
          playingHandicap: 15.0,
          tee: 'white',
        },
      ],
    })

    await adminPage.navigateToEditTournament(tournament.id)
    await adminPage.startTournament()

    // Should show error
    await adminPage.waitForToast('Minimum 10 players required')
  })
})
