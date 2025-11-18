/**
 * POST /api/push/test
 * Send test notification to current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pushService = getPushService(prisma)

    const result = await pushService.sendNotification(session.user.id, {
      title: 'Test Notification',
      body: 'This is a test push notification from Golf Tournament Management',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      url: '/profile',
      tag: 'test-notification',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      result,
      message: result.delivered > 0
        ? 'Test notification sent successfully'
        : 'No active subscriptions found',
    })
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test notification',
      },
      { status: 500 }
    )
  }
}
