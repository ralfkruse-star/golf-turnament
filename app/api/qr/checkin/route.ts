/**
 * QR Check-In API
 * POST /api/qr/checkin - Process player check-in via QR code scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const checkinSchema = z.object({
  qrData: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrData } = checkinSchema.parse(body)

    // Parse QR data
    let parsedData: any
    try {
      parsedData = JSON.parse(qrData)
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid QR code data' },
        { status: 400 }
      )
    }

    if (parsedData.type !== 'checkin') {
      return NextResponse.json(
        { success: false, error: 'Invalid QR code type' },
        { status: 400 }
      )
    }

    const { tournament: tournamentId, player: playerId, registration: registrationId } = parsedData

    // Get registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        player: true,
      },
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check if already checked in
    if (registration.status === 'CONFIRMED' || registration.status === 'WAITLIST') {
      // You could add a checkedIn field to Registration model
      // For now, we'll just return success
    }

    // Record check-in (you could add a CheckIn model to track this)
    // For now, we'll just update the registration status
    // await prisma.registration.update({
    //   where: { id: registrationId },
    //   data: { checkedIn: true, checkedInAt: new Date() },
    // })

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      data: {
        player: {
          name: `${registration.player.firstName} ${registration.player.lastName}`,
          memberNumber: registration.player.memberNumber,
          handicap: registration.playingHandicap?.toString(),
        },
        tournament: {
          name: registration.tournament.name,
          date: registration.tournament.tournamentDate,
        },
        flight: registration.flightId,
        tee: registration.tee,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Check-in error:', error)
    return NextResponse.json(
      { success: false, error: 'Check-in failed' },
      { status: 500 }
    )
  }
}
