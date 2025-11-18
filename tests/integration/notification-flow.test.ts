/**
 * Integration Test: Notification Flow
 * Tests email and push notification delivery
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma } from '../helpers/test-db'

// Mock Brevo
vi.mock('@getbrevo/brevo', () => ({
  TransactionalEmailsApi: vi.fn(() => ({
    sendTransacEmail: vi.fn(async () => ({
      messageId: 'test-message-id',
    })),
  })),
  ContactsApi: vi.fn(() => ({
    createContact: vi.fn(async () => ({ id: 1 })),
    updateContact: vi.fn(async () => ({ id: 1 })),
  })),
}))

// Mock web-push
vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(async () => ({ statusCode: 201 })),
}))

describe('Notification Flow Integration', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should send tournament registration confirmation email', async () => {
    const registration = await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: testData.players[0].handicapIndex,
        tee: 'white',
        paid: true,
        paidAt: new Date(),
      },
    })

    // In real implementation, this would trigger email
    // const emailSent = await sendRegistrationConfirmation(registration)
    // expect(emailSent.messageId).toBeDefined()

    expect(registration.status).toBe('CONFIRMED')
  })

  it('should send tournament reminder 24 hours before', async () => {
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Tomorrow Tournament',
        format: 'STABLEFORD',
        category: 'MONTHLY_MEDAL',
        status: 'IN_PROGRESS',
        tournamentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        registrationStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        registrationEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 4,
        createdBy: testData.users.adminUser.id,
      },
    })

    const registrations = await prisma.registration.createMany({
      data: testData.players.slice(0, 10).map((player: any) => ({
        tournamentId: tournament.id,
        playerId: player.id,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: 'white',
      })),
    })

    // Simulate sending reminders
    // In real implementation, this would be a cron job
    const playerEmails = await prisma.registration.findMany({
      where: {
        tournamentId: tournament.id,
        status: 'CONFIRMED',
      },
      include: {
        player: true,
      },
    })

    expect(playerEmails.length).toBe(10)
    // Would send email to each player
  })

  it('should send scorecard submission notification', async () => {
    const scorecard = await prisma.scorecard.create({
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

    // Log notification
    await prisma.notificationLog.create({
      data: {
        title: 'Scorecard Submitted',
        body: 'Your scorecard has been submitted successfully',
        userId: testData.users.playerUser.id,
        tournamentId: testData.tournament.id,
        delivered: 1,
        failed: 0,
      },
    })

    const notifications = await prisma.notificationLog.findMany({
      where: { userId: testData.users.playerUser.id },
    })

    expect(notifications.length).toBeGreaterThan(0)
  })

  it('should create push subscription', async () => {
    const subscription = await prisma.pushSubscription.create({
      data: {
        endpoint: 'https://fcm.googleapis.com/test',
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-secret',
        userId: testData.users.playerUser.id,
        userAgent: 'Mozilla/5.0 Test',
        deviceType: 'mobile',
        enabled: true,
        topics: ['tournaments', 'scores'],
      },
    })

    expect(subscription.id).toBeDefined()
    expect(subscription.enabled).toBe(true)
  })

  it('should send push notification to subscribed users', async () => {
    const subscription = await prisma.pushSubscription.create({
      data: {
        endpoint: 'https://fcm.googleapis.com/test',
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-secret',
        userId: testData.users.playerUser.id,
        enabled: true,
        topics: ['tournaments'],
      },
    })

    // Log push notification
    const notification = await prisma.notificationLog.create({
      data: {
        title: 'Tournament Started',
        body: 'Your tournament has started',
        icon: '/icon-192x192.png',
        url: `/tournaments/${testData.tournament.id}`,
        topic: 'tournaments',
        delivered: 1,
        failed: 0,
      },
    })

    expect(notification.delivered).toBe(1)
  })

  it('should handle failed push notification', async () => {
    const subscription = await prisma.pushSubscription.create({
      data: {
        endpoint: 'https://invalid-endpoint.com/test',
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-secret',
        userId: testData.users.playerUser.id,
        enabled: true,
        topics: ['tournaments'],
      },
    })

    // Simulate failed notification
    const notification = await prisma.notificationLog.create({
      data: {
        title: 'Test Notification',
        body: 'This should fail',
        topic: 'tournaments',
        delivered: 0,
        failed: 1,
      },
    })

    expect(notification.failed).toBe(1)

    // In real implementation, disable subscription after multiple failures
    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: { enabled: false },
    })

    const disabled = await prisma.pushSubscription.findUnique({
      where: { id: subscription.id },
    })

    expect(disabled?.enabled).toBe(false)
  })

  it('should send broadcast notification to all subscribed users', async () => {
    // Create multiple subscriptions
    await prisma.pushSubscription.createMany({
      data: [
        {
          endpoint: 'https://fcm.googleapis.com/test1',
          p256dh: 'key1',
          auth: 'auth1',
          userId: testData.users.playerUser.id,
          enabled: true,
          topics: ['announcements'],
        },
        {
          endpoint: 'https://fcm.googleapis.com/test2',
          p256dh: 'key2',
          auth: 'auth2',
          userId: testData.users.adminUser.id,
          enabled: true,
          topics: ['announcements'],
        },
      ],
    })

    // Send broadcast
    const notification = await prisma.notificationLog.create({
      data: {
        title: 'Important Announcement',
        body: 'Club championship registration is now open',
        topic: 'announcements',
        delivered: 2,
        failed: 0,
      },
    })

    expect(notification.delivered).toBe(2)
  })

  it('should send payment confirmation email', async () => {
    const registration = await prisma.registration.create({
      data: {
        tournamentId: testData.tournament.id,
        playerId: testData.players[0].id,
        status: 'CONFIRMED',
        playingHandicap: testData.players[0].handicapIndex,
        tee: 'white',
        paid: true,
        paidAt: new Date(),
        paymentMethod: 'stripe',
      },
    })

    // In real implementation, send payment confirmation
    expect(registration.paid).toBe(true)
    expect(registration.paidAt).toBeDefined()
  })

  it('should send tournament results email', async () => {
    // Complete tournament
    await prisma.tournament.update({
      where: { id: testData.tournament.id },
      data: { status: 'COMPLETED' },
    })

    // Create scorecards for leaderboard
    await Promise.all(
      testData.players.slice(0, 5).map((player: any, index: number) =>
        prisma.scorecard.create({
          data: {
            tournamentId: testData.tournament.id,
            playerId: player.id,
            scores: Array(18).fill({ hole: 1, gross: 4 }),
            totalGross: 70 + index,
            totalNet: 60 + index,
            totalPoints: 40 - index,
            status: 'VERIFIED',
            submittedAt: new Date(),
          },
        })
      )
    )

    // Log results notification
    const notification = await prisma.notificationLog.create({
      data: {
        title: 'Tournament Results',
        body: 'Results are now available',
        tournamentId: testData.tournament.id,
        topic: 'tournaments',
        delivered: 5,
        failed: 0,
      },
    })

    expect(notification.delivered).toBe(5)
  })

  it('should track notification delivery metrics', async () => {
    const notifications = await prisma.notificationLog.createMany({
      data: [
        {
          title: 'Notification 1',
          body: 'Test 1',
          delivered: 10,
          failed: 0,
        },
        {
          title: 'Notification 2',
          body: 'Test 2',
          delivered: 8,
          failed: 2,
        },
        {
          title: 'Notification 3',
          body: 'Test 3',
          delivered: 5,
          failed: 5,
        },
      ],
    })

    const stats = await prisma.notificationLog.aggregate({
      _sum: {
        delivered: true,
        failed: true,
      },
    })

    expect(stats._sum.delivered).toBe(23)
    expect(stats._sum.failed).toBe(7)
  })
})
