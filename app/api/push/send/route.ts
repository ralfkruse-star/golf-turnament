/**
 * POST /api/push/send
 * Send push notification (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

const sendSchema = z.object({
  target: z.enum(['user', 'tournament', 'topic']),
  targetId: z.string(),
  notification: z.object({
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(300),
    icon: z.string().optional(),
    badge: z.string().optional(),
    url: z.string().optional(),
    tag: z.string().optional(),
    image: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN' && user?.role !== 'TOURNAMENT_MANAGER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { target, targetId, notification } = sendSchema.parse(body)

    const pushService = getPushService(prisma)
    let result

    switch (target) {
      case 'user':
        result = await pushService.sendNotification(targetId, notification)
        break
      case 'tournament':
        result = await pushService.sendToTournament(targetId, notification)
        break
      case 'topic':
        result = await pushService.sendBroadcast(targetId, notification)
        break
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Notification sent to ${result.delivered} subscriber(s)`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Send notification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
      },
      { status: 500 }
    )
  }
}
