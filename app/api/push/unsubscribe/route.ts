/**
 * POST /api/push/unsubscribe
 * Unsubscribe from push notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint } = unsubscribeSchema.parse(body)

    const pushService = getPushService(prisma)
    await pushService.unsubscribe(endpoint)

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
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

    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unsubscribe from push notifications',
      },
      { status: 500 }
    )
  }
}
