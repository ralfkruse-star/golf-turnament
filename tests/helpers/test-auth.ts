/**
 * Test Authentication Helpers
 * Provides utilities for authenticating users in tests
 */

import { Page } from '@playwright/test'
import { prisma } from './test-db'

export interface TestUser {
  id: string
  email: string
  name: string
  role: string
}

/**
 * Create a test session for a user
 * Returns session token that can be used to authenticate requests
 */
export async function createTestSession(userId: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: `test-session-${userId}-${Date.now()}`,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })
  return session.sessionToken
}

/**
 * Authenticate a Playwright page with a user session
 */
export async function authenticatePlaywright(
  page: Page,
  userId: string
): Promise<void> {
  const sessionToken = await createTestSession(userId)

  // Set the session cookie
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Date.now() / 1000 + 30 * 24 * 60 * 60, // 30 days
    },
  ])
}

/**
 * Login via UI (for E2E tests that need to test the login flow)
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string = 'password123'
): Promise<void> {
  await page.goto('/auth/signin')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 5000 })
}

/**
 * Get authentication headers for API requests
 */
export async function getAuthHeaders(userId: string): Promise<Record<string, string>> {
  const sessionToken = await createTestSession(userId)
  return {
    Cookie: `next-auth.session-token=${sessionToken}`,
  }
}

/**
 * Create admin user and authenticate
 */
export async function createAndAuthenticateAdmin(page: Page) {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!admin) {
    throw new Error('No admin user found. Run seedTestData first.')
  }

  await authenticatePlaywright(page, admin.id)
  return admin
}

/**
 * Create player user and authenticate
 */
export async function createAndAuthenticatePlayer(page: Page) {
  const player = await prisma.user.findFirst({
    where: { role: 'PLAYER' },
  })

  if (!player) {
    throw new Error('No player user found. Run seedTestData first.')
  }

  await authenticatePlaywright(page, player.id)
  return player
}

/**
 * Clear all sessions for a user
 */
export async function clearUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  })
}

/**
 * Verify user is authenticated
 */
export async function verifyAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies()
  return cookies.some(cookie => cookie.name === 'next-auth.session-token')
}
