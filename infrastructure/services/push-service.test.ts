/**
 * Push Service Tests
 * Test suite for Web Push notification service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PushService } from './push-service'
import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'

// Mock web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}))

// Mock Prisma
const mockPrisma = {
  pushSubscription: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  notificationLog: {
    create: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient

describe('PushService', () => {
  let pushService: PushService

  beforeEach(() => {
    vi.clearAllMocks()
    pushService = new PushService(mockPrisma)
  })

  describe('initialize', () => {
    it('should set VAPID details with valid keys', () => {
      const vapidKeys = {
        publicKey: 'test-public-key',
        privateKey: 'test-private-key',
        subject: 'mailto:test@example.com',
      }

      pushService.initialize(vapidKeys)

      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        vapidKeys.subject,
        vapidKeys.publicKey,
        vapidKeys.privateKey
      )
    })

    it('should throw error if VAPID keys are missing', () => {
      expect(() => {
        pushService.initialize({
          publicKey: '',
          privateKey: '',
          subject: '',
        })
      }).toThrow('VAPID keys not configured')
    })
  })

  describe('subscribe', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    }

    it('should store push subscription in database', async () => {
      const userId = 'user-123'
      const userAgent = 'Mozilla/5.0...'

      mockPrisma.pushSubscription.create = vi.fn().mockResolvedValue({
        id: 'sub-123',
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.keys.p256dh,
        auth: mockSubscription.keys.auth,
        userId,
        userAgent,
        enabled: true,
        topics: [],
      })

      const result = await pushService.subscribe(
        mockSubscription,
        userId,
        userAgent
      )

      expect(mockPrisma.pushSubscription.create).toHaveBeenCalledWith({
        data: {
          endpoint: mockSubscription.endpoint,
          p256dh: mockSubscription.keys.p256dh,
          auth: mockSubscription.keys.auth,
          userId,
          userAgent,
          enabled: true,
          topics: [],
        },
      })

      expect(result).toEqual({
        id: 'sub-123',
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.keys.p256dh,
        auth: mockSubscription.keys.auth,
        userId,
        userAgent,
        enabled: true,
        topics: [],
      })
    })

    it('should handle duplicate subscriptions by updating existing one', async () => {
      const userId = 'user-123'

      mockPrisma.pushSubscription.create = vi.fn().mockRejectedValue({
        code: 'P2002', // Prisma unique constraint error
      })

      mockPrisma.pushSubscription.update = vi.fn().mockResolvedValue({
        id: 'sub-123',
        endpoint: mockSubscription.endpoint,
        userId,
      })

      mockPrisma.pushSubscription.findUnique = vi.fn().mockResolvedValue({
        id: 'sub-123',
      })

      await pushService.subscribe(mockSubscription, userId)

      expect(mockPrisma.pushSubscription.update).toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    it('should remove subscription from database', async () => {
      const endpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint'

      mockPrisma.pushSubscription.delete = vi.fn().mockResolvedValue({
        id: 'sub-123',
        endpoint,
      })

      await pushService.unsubscribe(endpoint)

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint },
      })
    })

    it('should handle non-existent subscription gracefully', async () => {
      mockPrisma.pushSubscription.delete = vi.fn().mockRejectedValue({
        code: 'P2025', // Record not found
      })

      await expect(
        pushService.unsubscribe('non-existent-endpoint')
      ).resolves.not.toThrow()
    })
  })

  describe('sendNotification', () => {
    const mockNotification = {
      title: 'Test Notification',
      body: 'This is a test',
      icon: '/icon.png',
      url: '/tournaments/123',
    }

    beforeEach(() => {
      pushService.initialize({
        publicKey: 'test-public',
        privateKey: 'test-private',
        subject: 'mailto:test@example.com',
      })
    })

    it('should send notification to user subscriptions', async () => {
      const userId = 'user-123'

      mockPrisma.pushSubscription.findMany = vi.fn().mockResolvedValue([
        {
          id: 'sub-1',
          endpoint: 'endpoint-1',
          p256dh: 'p256dh-1',
          auth: 'auth-1',
          enabled: true,
        },
        {
          id: 'sub-2',
          endpoint: 'endpoint-2',
          p256dh: 'p256dh-2',
          auth: 'auth-2',
          enabled: true,
        },
      ])

      webpush.sendNotification = vi.fn().mockResolvedValue({ statusCode: 201 })

      mockPrisma.notificationLog.create = vi.fn()

      const result = await pushService.sendNotification(userId, mockNotification)

      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          enabled: true,
        },
      })

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2)
      expect(result.delivered).toBe(2)
      expect(result.failed).toBe(0)
    })

    it('should handle failed deliveries and cleanup stale subscriptions', async () => {
      const userId = 'user-123'

      mockPrisma.pushSubscription.findMany = vi.fn().mockResolvedValue([
        {
          id: 'sub-1',
          endpoint: 'endpoint-1',
          p256dh: 'p256dh-1',
          auth: 'auth-1',
          enabled: true,
        },
      ])

      // Simulate 410 Gone - subscription expired
      webpush.sendNotification = vi.fn().mockRejectedValue({
        statusCode: 410,
      })

      mockPrisma.pushSubscription.delete = vi.fn()
      mockPrisma.notificationLog.create = vi.fn()

      const result = await pushService.sendNotification(userId, mockNotification)

      expect(result.delivered).toBe(0)
      expect(result.failed).toBe(1)
      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: 'endpoint-1' },
      })
    })

    it('should retry failed deliveries for temporary errors', async () => {
      const userId = 'user-123'

      mockPrisma.pushSubscription.findMany = vi.fn().mockResolvedValue([
        {
          id: 'sub-1',
          endpoint: 'endpoint-1',
          p256dh: 'p256dh-1',
          auth: 'auth-1',
          enabled: true,
        },
      ])

      // Fail first, succeed second
      webpush.sendNotification = vi
        .fn()
        .mockRejectedValueOnce({ statusCode: 500 })
        .mockResolvedValueOnce({ statusCode: 201 })

      mockPrisma.notificationLog.create = vi.fn()

      const result = await pushService.sendNotification(userId, mockNotification)

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2)
      expect(result.delivered).toBe(1)
      expect(result.failed).toBe(0)
    })
  })

  describe('sendBroadcast', () => {
    const mockNotification = {
      title: 'Broadcast',
      body: 'Tournament announcement',
    }

    beforeEach(() => {
      pushService.initialize({
        publicKey: 'test-public',
        privateKey: 'test-private',
        subject: 'mailto:test@example.com',
      })
    })

    it('should send to all subscriptions with specific topic', async () => {
      const topic = 'tournaments'

      mockPrisma.pushSubscription.findMany = vi.fn().mockResolvedValue([
        {
          id: 'sub-1',
          endpoint: 'endpoint-1',
          p256dh: 'p256dh-1',
          auth: 'auth-1',
          topics: ['tournaments', 'scores'],
          enabled: true,
        },
        {
          id: 'sub-2',
          endpoint: 'endpoint-2',
          p256dh: 'p256dh-2',
          auth: 'auth-2',
          topics: ['announcements'],
          enabled: true,
        },
      ])

      webpush.sendNotification = vi.fn().mockResolvedValue({ statusCode: 201 })
      mockPrisma.notificationLog.create = vi.fn()

      const result = await pushService.sendBroadcast(topic, mockNotification)

      // Should only send to subscriptions with the topic
      expect(webpush.sendNotification).toHaveBeenCalledTimes(1)
      expect(result.delivered).toBe(1)
    })
  })

  describe('sendToTournament', () => {
    const mockNotification = {
      title: 'Tournament Update',
      body: 'Tournament starting soon',
    }

    beforeEach(() => {
      pushService.initialize({
        publicKey: 'test-public',
        privateKey: 'test-private',
        subject: 'mailto:test@example.com',
      })
    })

    it('should send to all tournament participants', async () => {
      const tournamentId = 'tournament-123'

      // Mock finding registered players
      mockPrisma.$queryRaw = vi.fn().mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ])

      mockPrisma.pushSubscription.findMany = vi.fn().mockResolvedValue([
        {
          id: 'sub-1',
          endpoint: 'endpoint-1',
          p256dh: 'p256dh-1',
          auth: 'auth-1',
          userId: 'user-1',
          enabled: true,
        },
        {
          id: 'sub-2',
          endpoint: 'endpoint-2',
          p256dh: 'p256dh-2',
          auth: 'auth-2',
          userId: 'user-2',
          enabled: true,
        },
      ])

      webpush.sendNotification = vi.fn().mockResolvedValue({ statusCode: 201 })
      mockPrisma.notificationLog.create = vi.fn()

      const result = await pushService.sendToTournament(
        tournamentId,
        mockNotification
      )

      expect(result.delivered).toBe(2)
    })
  })

  describe('updatePreferences', () => {
    it('should update subscription topics', async () => {
      const subscriptionId = 'sub-123'
      const topics = ['tournaments', 'scores', 'announcements']

      mockPrisma.pushSubscription.update = vi.fn().mockResolvedValue({
        id: subscriptionId,
        topics,
      })

      await pushService.updatePreferences(subscriptionId, { topics })

      expect(mockPrisma.pushSubscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: { topics },
      })
    })

    it('should enable/disable subscription', async () => {
      const subscriptionId = 'sub-123'

      mockPrisma.pushSubscription.update = vi.fn().mockResolvedValue({
        id: subscriptionId,
        enabled: false,
      })

      await pushService.updatePreferences(subscriptionId, { enabled: false })

      expect(mockPrisma.pushSubscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: { enabled: false },
      })
    })
  })
})
