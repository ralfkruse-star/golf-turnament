/**
 * E2E Tests: Multi-Club Support
 */

import { test, expect } from '@playwright/test'
import { BasePage } from './page-objects/BasePage'
import { resetDatabase, prisma } from '../helpers/test-db'
import { createTestSession } from '../helpers/test-auth'
import { CLUB_FIXTURES } from '../fixtures/clubs'

test.describe('Multi-Club Support', () => {
  let testData: any
  let clubPage: BasePage

  test.beforeEach(async ({ page }) => {
    testData = await resetDatabase()
    clubPage = new BasePage(page)
  })

  test('should create new club', async ({ page }) => {
    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    await clubPage.goto('/admin/clubs/create')

    await clubPage.fill('[name="name"]', 'New Golf Club')
    await clubPage.fill('[name="slug"]', 'new-golf-club')
    await clubPage.fill('[name="email"]', 'info@newgolfclub.com')
    await clubPage.fill('[name="phone"]', '+49123456789')
    await clubPage.selectOption('[name="tier"]', 'BASIC')

    await clubPage.click('[data-testid="create-club"]')
    await clubPage.waitForToast('Club created successfully')
  })

  test('should configure club branding', async ({ page }) => {
    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    await clubPage.goto(`/admin/clubs/${testData.club.id}/settings`)

    await clubPage.fill('[name="primaryColor"]', '#16a34a')
    await clubPage.fill('[name="secondaryColor"]', '#15803d')

    // Upload logo (would need actual file)
    // await clubPage.uploadFile('[name="logo"]', 'path/to/logo.png')

    await clubPage.click('[data-testid="save-branding"]')
    await clubPage.waitForToast('Branding updated')
  })

  test('should access club via subdomain', async ({ page, context }) => {
    // Create club with custom subdomain
    const club = await prisma.club.create({
      data: {
        ...CLUB_FIXTURES.premiumClub,
        slug: 'test-subdomain-club',
        customDomain: 'test-subdomain.golf-tournament.com',
      },
    })

    // In a real test, you'd need to configure DNS or hosts file
    // For now, we'll just verify the slug routing works
    await clubPage.goto(`/${club.slug}`)

    const clubName = await clubPage.getText('[data-testid="club-name"]')
    expect(clubName).toContain(club.name)
  })

  test('should isolate data between clubs', async ({ page }) => {
    // Create second club
    const club2 = await prisma.club.create({
      data: {
        ...CLUB_FIXTURES.basicClub,
        slug: 'club-2-test',
        email: 'info@club2.com',
      },
    })

    // Create course for club2
    const course2 = await prisma.course.create({
      data: {
        name: 'Club 2 Course',
        clubId: club2.id,
        holes: 18,
        par: 72,
        tees: [],
        holeDetails: [],
      },
    })

    // Create tournament for club2
    const tournament2 = await prisma.tournament.create({
      data: {
        name: 'Club 2 Tournament',
        format: 'STABLEFORD',
        category: 'CASUAL',
        status: 'OPEN_FOR_REGISTRATION',
        tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        courseId: course2.id,
        clubId: club2.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 4,
        createdBy: testData.users.adminUser.id,
      },
    })

    // Access club 1 tournaments
    await clubPage.goto(`/${testData.club.slug}/tournaments`)
    const club1Tournaments = await clubPage.page.locator('[data-testid^="tournament-"]').all()

    // Should only show club 1 tournaments, not club 2
    const club2TournamentVisible = await clubPage.isVisible(`text=${tournament2.name}`)
    expect(club2TournamentVisible).toBeFalsy()
  })

  test('should enforce tier limits - FREE tier', async ({ page }) => {
    const freeClub = await prisma.club.create({
      data: {
        ...CLUB_FIXTURES.freeClub,
        maxTournaments: 3,
      },
    })

    // Create course
    const course = await prisma.course.create({
      data: {
        name: 'Free Club Course',
        clubId: freeClub.id,
        holes: 18,
        par: 72,
        tees: [],
        holeDetails: [],
      },
    })

    // Create 3 tournaments (at limit)
    for (let i = 0; i < 3; i++) {
      await prisma.tournament.create({
        data: {
          name: `Tournament ${i + 1}`,
          format: 'STABLEFORD',
          category: 'CASUAL',
          status: 'DRAFT',
          tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          registrationStart: new Date(),
          registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          courseId: course.id,
          clubId: freeClub.id,
          teesUsed: { men: 'white', women: 'red' },
          maxPlayers: 50,
          minPlayers: 4,
          createdBy: testData.users.adminUser.id,
        },
      })
    }

    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    // Try to create 4th tournament
    await clubPage.goto(`/${freeClub.slug}/admin/tournaments/create`)
    await clubPage.fill('[name="name"]', 'Tournament 4')
    await clubPage.click('[data-testid="save-tournament"]')

    // Should show limit reached error
    await clubPage.waitForToast('Tournament limit reached')
  })

  test('should show feature availability by tier', async ({ page }) => {
    const basicClub = await prisma.club.create({
      data: CLUB_FIXTURES.basicClub,
    })

    await clubPage.goto(`/${basicClub.slug}/admin/settings`)

    // Analytics should not be available for BASIC tier
    const analyticsDisabled = await clubPage.isVisible('[data-testid="analytics-disabled"]')
    expect(analyticsDisabled).toBeTruthy()
  })

  test('should manage club members', async ({ page }) => {
    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    await clubPage.goto(`/admin/clubs/${testData.club.id}/members`)

    // Add new member
    await clubPage.click('[data-testid="add-member"]')
    await clubPage.fill('[name="email"]', testData.users.playerUser.email)
    await clubPage.selectOption('[name="role"]', 'MANAGER')
    await clubPage.click('[data-testid="invite-member"]')

    await clubPage.waitForToast('Member added')
  })

  test('should upgrade club subscription', async ({ page }) => {
    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    // Create basic club
    const basicClub = await prisma.club.create({
      data: CLUB_FIXTURES.basicClub,
    })

    await clubPage.goto(`/admin/clubs/${basicClub.id}/subscription`)

    // Click upgrade to premium
    await clubPage.click('[data-testid="upgrade-premium"]')

    // Should redirect to payment (Stripe checkout)
    await clubPage.waitForURL(/checkout/, { timeout: 10000 })
  })

  test('should show trial expiration warning', async ({ page }) => {
    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    const trialClub = await prisma.club.create({
      data: {
        ...CLUB_FIXTURES.trialClub,
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days left
      },
    })

    await clubPage.goto(`/${trialClub.slug}/admin`)

    const warningVisible = await clubPage.isVisible('[data-testid="trial-warning"]')
    expect(warningVisible).toBeTruthy()
  })

  test('should suspend inactive club', async ({ page }) => {
    const inactiveClub = await prisma.club.create({
      data: {
        ...CLUB_FIXTURES.inactiveClub,
        isSuspended: true,
      },
    })

    await clubPage.goto(`/${inactiveClub.slug}`)

    const suspendedMessage = await clubPage.isVisible('[data-testid="club-suspended"]')
    expect(suspendedMessage).toBeTruthy()
  })

  test('should allow club admin to customize email templates', async ({ page }) => {
    const admin = testData.users.adminUser
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: await createTestSession(admin.id),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    await clubPage.goto(`/admin/clubs/${testData.club.id}/email-templates`)

    await clubPage.click('[data-testid="edit-welcome-email"]')
    await clubPage.fill('[name="subject"]', 'Welcome to {{clubName}}')
    await clubPage.fill('[name="body"]', 'Custom welcome message')
    await clubPage.click('[data-testid="save-template"]')

    await clubPage.waitForToast('Template saved')
  })
})
