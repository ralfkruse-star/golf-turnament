/**
 * PATCH /api/push/preferences
 * Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'

const preferencesSchema = z.object({
  subscriptionId: z.string(),
  topics: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, topics, enabled } = preferencesSchema.parse(body)

    const pushService = getPushService(prisma)

    const preferences: { topics?: string[]; enabled?: boolean } = {}
    if (topics !== undefined) preferences.topics = topics
    if (enabled !== undefined) preferences.enabled = enabled

    const result = await pushService.updatePreferences(subscriptionId, preferences)

    return NextResponse.json({
      success: true,
      subscription: result,
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

    console.error('Update preferences error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update preferences',
      },
      { status: 500 }
    )
  }
}
