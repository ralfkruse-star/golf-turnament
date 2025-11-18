/**
 * POST /api/analytics/notification-closed
 * Track when notifications are dismissed
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tag, timestamp } = body

    // Log analytics
    console.log('[Analytics] Notification closed:', { tag, timestamp })

    // Track dismissal rate, engagement metrics, etc.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
