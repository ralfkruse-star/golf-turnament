/**
 * Email Testing API
 * Send test emails to verify Brevo integration
 * Development/Admin only!
 */

import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/infrastructure/services/email-service'
import { isBrevoConfigured } from '@/lib/brevo'

export async function POST(request: NextRequest) {
  try {
    // Check if Brevo is configured
    if (!isBrevoConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Brevo is not configured. Set BREVO_API_KEY environment variable.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { type, recipient } = body

    if (!recipient || !recipient.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipient email is required',
        },
        { status: 400 }
      )
    }

    // Send test email based on type
    switch (type) {
      case 'registration-confirmation':
        await emailService.sendTournamentRegistrationConfirmation(recipient, {
          playerName: recipient.name || 'Max Mustermann',
          tournamentName: 'Test-Turnier 2025',
          tournamentDate: new Date('2025-12-01T09:00:00'),
          registrationNumber: 'REG-TEST-12345',
          entryFee: 35.0,
          paymentStatus: 'pending',
          paymentLink: 'https://example.com/payment',
        })
        break

      case 'tournament-reminder':
        await emailService.sendTournamentReminder(recipient, {
          playerName: recipient.name || 'Max Mustermann',
          tournamentName: 'Test-Turnier 2025',
          tournamentDate: new Date('2025-12-01T09:00:00'),
          startTime: '09:00',
          flightNumber: 3,
          startingHole: 1,
        })
        break

      case 'tournament-results':
        await emailService.sendTournamentResults(recipient, {
          playerName: recipient.name || 'Max Mustermann',
          tournamentName: 'Test-Turnier 2025',
          position: 2,
          totalGross: 85,
          totalNet: 67,
          totalPoints: 42,
          participantCount: 48,
          resultsUrl: 'https://example.com/results',
        })
        break

      case 'scorecard-submitted':
        await emailService.sendScorecardSubmitted(recipient, {
          playerName: recipient.name || 'Max Mustermann',
          tournamentName: 'Test-Turnier 2025',
          totalGross: 85,
          totalNet: 67,
          totalPoints: 42,
          submittedAt: new Date(),
        })
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown email type: ${type}`,
            availableTypes: [
              'registration-confirmation',
              'tournament-reminder',
              'tournament-results',
              'scorecard-submitted',
            ],
          },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipient.email}`,
      type,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email',
      },
      { status: 500 }
    )
  }
}
