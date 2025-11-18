/**
 * QR Code Generation API
 * POST /api/qr/generate - Generate QR code for player check-in or scoring
 */

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const generateQRSchema = z.object({
  type: z.enum(['checkin', 'scoring', 'registration']),
  tournamentId: z.string().optional(),
  playerId: z.string().optional(),
  registrationId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = generateQRSchema.parse(body)

    let qrData: string

    switch (validated.type) {
      case 'checkin':
        if (!validated.tournamentId || !validated.playerId) {
          return NextResponse.json(
            { success: false, error: 'tournamentId and playerId required for check-in' },
            { status: 400 }
          )
        }

        // Verify registration exists
        const registration = await prisma.registration.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId: validated.tournamentId,
              playerId: validated.playerId,
            },
          },
        })

        if (!registration) {
          return NextResponse.json(
            { success: false, error: 'Registration not found' },
            { status: 404 }
          )
        }

        // Generate QR data for check-in
        qrData = JSON.stringify({
          type: 'checkin',
          tournament: validated.tournamentId,
          player: validated.playerId,
          registration: registration.id,
          timestamp: Date.now(),
        })
        break

      case 'scoring':
        if (!validated.tournamentId || !validated.playerId) {
          return NextResponse.json(
            { success: false, error: 'tournamentId and playerId required for scoring' },
            { status: 400 }
          )
        }

        // Verify scorecard exists
        const scorecard = await prisma.scorecard.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId: validated.tournamentId,
              playerId: validated.playerId,
            },
          },
        })

        if (!scorecard) {
          return NextResponse.json(
            { success: false, error: 'Scorecard not found' },
            { status: 404 }
          )
        }

        // Generate QR data for scoring
        qrData = JSON.stringify({
          type: 'scoring',
          scorecard: scorecard.id,
          tournament: validated.tournamentId,
          player: validated.playerId,
          timestamp: Date.now(),
        })
        break

      case 'registration':
        if (!validated.registrationId) {
          return NextResponse.json(
            { success: false, error: 'registrationId required for registration QR' },
            { status: 400 }
          )
        }

        qrData = JSON.stringify({
          type: 'registration',
          registration: validated.registrationId,
          timestamp: Date.now(),
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid QR type' },
          { status: 400 }
        )
    }

    // Generate QR code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      data: JSON.parse(qrData),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('QR generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
