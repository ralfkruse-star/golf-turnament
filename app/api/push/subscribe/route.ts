/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  topics: z.array(z.string()).optional().default([]),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    // Allow anonymous subscriptions but prefer authenticated
    const userId = session?.user?.id

    const body = await request.json()
    const { subscription, topics } = subscribeSchema.parse(body)

    const userAgent = request.headers.get('user-agent') || undefined

    const pushService = getPushService(prisma)

    // If no userId, we'll still store the subscription for later association
    const result = await pushService.subscribe(
      subscription,
      userId || 'anonymous',
      userAgent,
      topics
    )

    return NextResponse.json({
      success: true,
      subscriptionId: result.id,
      message: 'Successfully subscribed to push notifications',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Push subscription error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to subscribe to push notifications',
      },
      { status: 500 }
    )
  }
}
