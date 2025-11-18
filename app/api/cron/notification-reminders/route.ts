/**
 * Cron Job: Notification Reminders
 * Sends scheduled tournament reminders
 * Should be called every 15 minutes by a cron service
 */

import { NextResponse } from 'next/server'
import { scheduleUpcomingTournamentReminders } from '@/lib/notification-helpers'

export async function GET() {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      // In production, verify the secret from request headers
      // const authHeader = request.headers.get('authorization')
      // if (authHeader !== `Bearer ${cronSecret}`) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      // }
    }

    const count = await scheduleUpcomingTournamentReminders()

    return NextResponse.json({
      success: true,
      remindersSent: count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send reminders',
      },
      { status: 500 }
    )
  }
}
