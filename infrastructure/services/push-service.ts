/**
 * Push Notification Service
 * Handles Web Push notifications using VAPID protocol
 */

import webpush, { PushSubscription as WebPushSubscription } from 'web-push'
import { PrismaClient, Prisma } from '@prisma/client'

export interface VapidKeys {
  publicKey: string
  privateKey: string
  subject: string
}

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  image?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface SendResult {
  delivered: number
  failed: number
  errors: Array<{
    endpoint: string
    error: string
  }>
}

export class PushService {
  private prisma: PrismaClient
  private initialized = false

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Initialize web-push with VAPID keys
   */
  initialize(vapidKeys: VapidKeys): void {
    if (!vapidKeys.publicKey || !vapidKeys.privateKey || !vapidKeys.subject) {
      throw new Error('VAPID keys not configured')
    }

    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    )

    this.initialized = true
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(
    subscription: PushSubscriptionData,
    userId: string,
    userAgent?: string,
    topics: string[] = []
  ) {
    try {
      const result = await this.prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId,
          userAgent,
          enabled: true,
          topics,
        },
      })

      return result
    } catch (error) {
      // Handle duplicate subscription (unique constraint violation)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Update existing subscription
        const existing = await this.prisma.pushSubscription.findUnique({
          where: { endpoint: subscription.endpoint },
        })

        if (existing) {
          return await this.prisma.pushSubscription.update({
            where: { id: existing.id },
            data: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              userId,
              userAgent,
              enabled: true,
              lastUsedAt: new Date(),
            },
          })
        }
      }

      throw error
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(endpoint: string): Promise<void> {
    try {
      await this.prisma.pushSubscription.delete({
        where: { endpoint },
      })
    } catch (error) {
      // Ignore if subscription doesn't exist
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return
      }
      throw error
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendNotification(
    userId: string,
    notification: PushNotification
  ): Promise<SendResult> {
    if (!this.initialized) {
      throw new Error('PushService not initialized. Call initialize() first.')
    }

    // Get all active subscriptions for user
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        userId,
        enabled: true,
      },
    })

    const result = await this.sendToSubscriptions(subscriptions, notification)

    // Log notification
    await this.prisma.notificationLog.create({
      data: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        url: notification.url,
        userId,
        delivered: result.delivered,
        failed: result.failed,
        metadata: notification.data,
      },
    })

    return result
  }

  /**
   * Send broadcast notification to topic subscribers
   */
  async sendBroadcast(
    topic: string,
    notification: PushNotification
  ): Promise<SendResult> {
    if (!this.initialized) {
      throw new Error('PushService not initialized. Call initialize() first.')
    }

    // Get all subscriptions for topic
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        enabled: true,
        topics: {
          has: topic,
        },
      },
    })

    const result = await this.sendToSubscriptions(subscriptions, notification)

    // Log notification
    await this.prisma.notificationLog.create({
      data: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        url: notification.url,
        topic,
        delivered: result.delivered,
        failed: result.failed,
        metadata: notification.data,
      },
    })

    return result
  }

  /**
   * Send notification to all tournament participants
   */
  async sendToTournament(
    tournamentId: string,
    notification: PushNotification
  ): Promise<SendResult> {
    if (!this.initialized) {
      throw new Error('PushService not initialized. Call initialize() first.')
    }

    // Get all registered players for tournament
    const registrations = await this.prisma.$queryRaw<Array<{ userId: string }>>`
      SELECT DISTINCT u."id" as "userId"
      FROM "Registration" r
      JOIN "Player" p ON p."id" = r."playerId"
      JOIN "User" u ON u."id" = p."userId"
      WHERE r."tournamentId" = ${tournamentId}
      AND r."status" != 'CANCELLED'
      AND u."id" IS NOT NULL
    `

    const userIds = registrations.map((r) => r.userId)

    // Get all subscriptions for these users
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        userId: { in: userIds },
        enabled: true,
      },
    })

    const result = await this.sendToSubscriptions(subscriptions, notification)

    // Log notification
    await this.prisma.notificationLog.create({
      data: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        url: notification.url,
        tournamentId,
        delivered: result.delivered,
        failed: result.failed,
        metadata: notification.data,
      },
    })

    return result
  }

  /**
   * Update subscription preferences
   */
  async updatePreferences(
    subscriptionId: string,
    preferences: {
      topics?: string[]
      enabled?: boolean
    }
  ) {
    return await this.prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: preferences,
    })
  }

  /**
   * Send notifications to multiple subscriptions
   * Handles retries and cleanup of stale subscriptions
   */
  private async sendToSubscriptions(
    subscriptions: Array<{
      id: string
      endpoint: string
      p256dh: string
      auth: string
    }>,
    notification: PushNotification
  ): Promise<SendResult> {
    const result: SendResult = {
      delivered: 0,
      failed: 0,
      errors: [],
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/badge-72x72.png',
      url: notification.url || '/',
      tag: notification.tag || 'notification',
      image: notification.image,
      data: notification.data || {},
      actions: notification.actions || [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' },
      ],
    })

    for (const sub of subscriptions) {
      const pushSubscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await this.sendWithRetry(pushSubscription, payload)
        result.delivered++

        // Update last used timestamp
        await this.prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        })
      } catch (error: unknown) {
        result.failed++

        const err = error as { statusCode?: number; message?: string }
        const statusCode = err.statusCode

        // Handle stale subscriptions
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid - remove it
          await this.prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          })

          result.errors.push({
            endpoint: sub.endpoint,
            error: 'Subscription expired or invalid (cleaned up)',
          })
        } else {
          result.errors.push({
            endpoint: sub.endpoint,
            error: err.message || 'Unknown error',
          })
        }
      }
    }

    return result
  }

  /**
   * Send push notification with retry logic
   */
  private async sendWithRetry(
    subscription: WebPushSubscription,
    payload: string,
    maxRetries = 2
  ): Promise<void> {
    let lastError: unknown

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await webpush.sendNotification(subscription, payload)
        return
      } catch (error: unknown) {
        lastError = error
        const err = error as { statusCode?: number }

        // Don't retry on permanent failures
        if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 400) {
          throw error
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
        }
      }
    }

    throw lastError
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId: string) {
    return await this.prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Cleanup stale subscriptions (older than 90 days without use)
   */
  async cleanupStaleSubscriptions(): Promise<number> {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const result = await this.prisma.pushSubscription.deleteMany({
      where: {
        lastUsedAt: {
          lt: ninetyDaysAgo,
        },
      },
    })

    return result.count
  }
}

// Singleton instance
let pushServiceInstance: PushService | null = null

/**
 * Get or create PushService instance
 */
export function getPushService(prisma?: PrismaClient): PushService {
  if (!pushServiceInstance) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization')
    }
    pushServiceInstance = new PushService(prisma)

    // Initialize with environment variables
    if (
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
    ) {
      pushServiceInstance.initialize({
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
        subject: process.env.VAPID_SUBJECT,
      })
    }
  }

  return pushServiceInstance
}
