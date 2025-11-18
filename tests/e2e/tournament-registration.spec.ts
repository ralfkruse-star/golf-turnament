/**
 * E2E Tests: Tournament Registration Flow
 */

import { test, expect } from '@playwright/test'
import { TournamentPage } from './page-objects/TournamentPage'
import { resetDatabase, createTestTournament, prisma } from '../helpers/test-db'
import { createAndAuthenticatePlayer } from '../helpers/test-auth'

test.describe('Tournament Registration', () => {
  let tournamentPage: TournamentPage
  let testData: any

  test.beforeEach(async ({ page }) => {
    testData = await resetDatabase()
    tournamentPage = new TournamentPage(page)

    // Authenticate as player
    await createAndAuthenticatePlayer(page)
  })

  test('should browse available tournaments', async () => {
    await tournamentPage.navigateToTournaments()

    const tournaments = await tournamentPage.getTournamentCards()
    expect(tournaments.length).toBeGreaterThan(0)
  })

  test('should filter tournaments by status', async () => {
    // Create tournaments with different statuses
    await createTestTournament(
      testData.club.id,
      testData.course.id,
      testData.users.adminUser.id,
      { name: 'Draft Tournament', status: 'DRAFT' }
    )

    await createTestTournament(
      testData.club.id,
      testData.course.id,
      testData.users.adminUser.id,
      { name: 'Open Tournament', status: 'OPEN_FOR_REGISTRATION' }
    )

    await tournamentPage.navigateToTournaments()
    await tournamentPage.filterByStatus('OPEN_FOR_REGISTRATION')

    const tournaments = await tournamentPage.getTournamentCards()
    expect(tournaments.length).toBeGreaterThan(0)
  })

  test('should register for tournament successfully', async () => {
    await tournamentPage.navigateToTournaments()

    // Click on the test tournament
    const details = await tournamentPage.getTournamentDetails()
    expect(details.name).toBeTruthy()

    await tournamentPage.registerForTournament()
    await tournamentPage.selectTee('white')
    await tournamentPage.confirmRegistration()

    await tournamentPage.verifyRegistrationConfirmed()
    await tournamentPage.waitForToast('Successfully registered')
  })

  test('should handle registration with cart request', async () => {
    await tournamentPage.navigateToTournament(testData.tournament.id)

    await tournamentPage.registerForTournament()
    await tournamentPage.selectTee('white')
    await tournamentPage.requestCart()
    await tournamentPage.confirmRegistration()

    await tournamentPage.verifyRegistrationConfirmed()
  })

  test('should handle registration with special requests', async () => {
    await tournamentPage.navigateToTournament(testData.tournament.id)

    await tournamentPage.registerForTournament()
    await tournamentPage.selectTee('white')
    await tournamentPage.addSpecialRequests('Would like to play with John Doe')
    await tournamentPage.confirmRegistration()

    await tournamentPage.verifyRegistrationConfirmed()
  })

  test('should prevent duplicate registration', async () => {
    const player = testData.players[0]

    // Create registration manually
    await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      },
    })

    await tournamentPage.navigateToTournament(testData.tournament.id)

    // Should show already registered
    const isRegistered = await tournamentPage.isVisible('[data-testid="already-registered"]')
    expect(isRegistered).toBeTruthy()
  })

  test('should show tournament is full', async () => {
    // Create tournament with max 2 players
    const fullTournament = await createTestTournament(
      testData.club.id,
      testData.course.id,
      testData.users.adminUser.id,
      { maxPlayers: 2, status: 'OPEN_FOR_REGISTRATION' }
    )

    // Register 2 players
    await prisma.registration.createMany({
      data: [
        {
          tournamentId: fullTournament.id,
          playerId: testData.players[0].id,
          status: 'CONFIRMED',
          playingHandicap: 10.0,
          tee: 'white',
        },
        {
          tournamentId: fullTournament.id,
          playerId: testData.players[1].id,
          status: 'CONFIRMED',
          playingHandicap: 15.0,
          tee: 'white',
        },
      ],
    })

    await tournamentPage.navigateToTournament(fullTournament.id)

    const isFull = await tournamentPage.isVisible('[data-testid="tournament-full"]')
    expect(isFull).toBeTruthy()
  })

  test('should search tournaments', async () => {
    await createTestTournament(
      testData.club.id,
      testData.course.id,
      testData.users.adminUser.id,
      { name: 'Unique Championship 2024' }
    )

    await tournamentPage.navigateToTournaments()
    await tournamentPage.searchTournaments('Unique Championship')

    const tournaments = await tournamentPage.getTournamentCards()
    expect(tournaments.length).toBeGreaterThanOrEqual(1)
  })

  test('should filter tournaments by category', async () => {
    await createTestTournament(
      testData.club.id,
      testData.course.id,
      testData.users.adminUser.id,
      { category: 'CLUB_CHAMPIONSHIP' }
    )

    await tournamentPage.navigateToTournaments()
    await tournamentPage.filterByCategory('CLUB_CHAMPIONSHIP')

    const tournaments = await tournamentPage.getTournamentCards()
    expect(tournaments.length).toBeGreaterThan(0)
  })

  test('should view registered players', async () => {
    // Add some registrations
    await prisma.registration.createMany({
      data: testData.players.slice(0, 5).map((player: any) => ({
        tournamentId: testData.tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    await tournamentPage.navigateToTournament(testData.tournament.id)
    await tournamentPage.viewRegisteredPlayers()

    const count = await tournamentPage.getRegisteredPlayersCount()
    expect(count).toBe(5)
  })

  test('should show correct spots available', async () => {
    const tournament = await createTestTournament(
      testData.club.id,
      testData.course.id,
      testData.users.adminUser.id,
      { maxPlayers: 100 }
    )

    // Register 10 players
    await prisma.registration.createMany({
      data: testData.players.slice(0, 10).map((player: any) => ({
        tournamentId: tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    await tournamentPage.navigateToTournament(tournament.id)
    const details = await tournamentPage.getTournamentDetails()

    expect(details.spotsAvailable).toContain('90') // 100 - 10 = 90
  })
})
