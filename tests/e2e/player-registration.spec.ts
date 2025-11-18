/**
 * E2E Tests: Player Registration Flow
 */

import { test, expect } from '@playwright/test'
import { PlayerRegistrationPage } from './page-objects/PlayerRegistrationPage'
import { resetDatabase } from '../helpers/test-db'
import { PLAYER_FIXTURES } from '../fixtures/players'

test.describe('Player Registration', () => {
  let registrationPage: PlayerRegistrationPage

  test.beforeEach(async ({ page }) => {
    // Reset database before each test
    await resetDatabase()
    registrationPage = new PlayerRegistrationPage(page)
    await registrationPage.navigateToRegistration()
  })

  test('should complete full registration flow successfully', async () => {
    const playerData = {
      ...PLAYER_FIXTURES.midHandicapper,
      email: `test-${Date.now()}@test.com`, // Ensure unique email
    }

    await registrationPage.completeRegistration({
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      email: playerData.email,
      phone: playerData.phone,
      handicapIndex: playerData.handicapIndex,
      membershipType: playerData.membershipType,
      acceptMarketing: true,
    })

    await registrationPage.verifyRegistrationSuccess()
    await registrationPage.waitForToast('Registration successful')
  })

  test('should validate email format', async () => {
    await registrationPage.fillPersonalInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
    })

    await registrationPage.submitRegistration()

    const error = await registrationPage.getErrorMessage('email')
    expect(error).toContain('valid email')
  })

  test('should validate handicap index range', async () => {
    await registrationPage.fillPersonalInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
    })

    // Try invalid handicap (too high)
    await registrationPage.fillHandicapInfo({ handicapIndex: 60 })
    await registrationPage.submitRegistration()

    const error = await registrationPage.getErrorMessage('handicapIndex')
    expect(error).toContain('54.0')
  })

  test('should require DSGVO consent', async () => {
    await registrationPage.fillPersonalInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
    })

    await registrationPage.fillHandicapInfo({ handicapIndex: 15.0 })

    // Don't check DSGVO consent
    await registrationPage.submitRegistration()

    const error = await registrationPage.getErrorMessage('consentGiven')
    expect(error).toContain('consent')
  })

  test('should allow guest registration', async () => {
    const guestData = {
      ...PLAYER_FIXTURES.guestPlayer,
      email: `guest-${Date.now()}@test.com`,
    }

    await registrationPage.completeRegistration({
      firstName: guestData.firstName,
      lastName: guestData.lastName,
      email: guestData.email,
      phone: guestData.phone,
      handicapIndex: guestData.handicapIndex,
      membershipType: 'GUEST',
    })

    await registrationPage.verifyRegistrationSuccess()
  })

  test('should validate unique email', async () => {
    const playerData = PLAYER_FIXTURES.midHandicapper

    // First registration
    await registrationPage.completeRegistration({
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      email: playerData.email,
      handicapIndex: playerData.handicapIndex,
    })

    await registrationPage.verifyRegistrationSuccess()

    // Try to register again with same email
    await registrationPage.navigateToRegistration()
    await registrationPage.completeRegistration({
      firstName: 'Different',
      lastName: 'Name',
      email: playerData.email, // Same email
      handicapIndex: 20.0,
    })

    const error = await registrationPage.getErrorMessage('email')
    expect(error).toContain('already registered')
  })

  test('should validate phone number format', async () => {
    await registrationPage.fillPersonalInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '123', // Invalid phone
    })

    await registrationPage.fillHandicapInfo({ handicapIndex: 15.0 })
    await registrationPage.acceptDSGVO()
    await registrationPage.submitRegistration()

    const error = await registrationPage.getErrorMessage('phone')
    expect(error).toContain('valid phone')
  })

  test('should allow optional marketing consent', async () => {
    const playerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john-${Date.now()}@test.com`,
      handicapIndex: 15.0,
    }

    // Without marketing consent
    await registrationPage.completeRegistration({
      ...playerData,
      acceptMarketing: false,
    })

    await registrationPage.verifyRegistrationSuccess()

    // Verify can register with marketing consent
    await registrationPage.navigateToRegistration()
    await registrationPage.completeRegistration({
      firstName: 'Jane',
      lastName: 'Doe',
      email: `jane-${Date.now()}@test.com`,
      handicapIndex: 18.0,
      acceptMarketing: true,
    })

    await registrationPage.verifyRegistrationSuccess()
  })

  test('should handle low handicap players', async () => {
    const lowHandicapData = {
      ...PLAYER_FIXTURES.lowHandicapper,
      email: `low-${Date.now()}@test.com`,
    }

    await registrationPage.completeRegistration({
      firstName: lowHandicapData.firstName,
      lastName: lowHandicapData.lastName,
      email: lowHandicapData.email,
      handicapIndex: lowHandicapData.handicapIndex, // 2.5
    })

    await registrationPage.verifyRegistrationSuccess()
  })

  test('should handle high handicap players', async () => {
    const highHandicapData = {
      ...PLAYER_FIXTURES.highHandicapper,
      email: `high-${Date.now()}@test.com`,
    }

    await registrationPage.completeRegistration({
      firstName: highHandicapData.firstName,
      lastName: highHandicapData.lastName,
      email: highHandicapData.email,
      handicapIndex: highHandicapData.handicapIndex, // 28.4
    })

    await registrationPage.verifyRegistrationSuccess()
  })

  test('should validate required fields', async () => {
    await registrationPage.submitRegistration()

    // Should show errors for all required fields
    expect(await registrationPage.getErrorMessage('firstName')).toBeTruthy()
    expect(await registrationPage.getErrorMessage('lastName')).toBeTruthy()
    expect(await registrationPage.getErrorMessage('email')).toBeTruthy()
    expect(await registrationPage.getErrorMessage('handicapIndex')).toBeTruthy()
  })
})
