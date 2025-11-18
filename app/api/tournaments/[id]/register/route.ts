/**
 * Tournament Registration API
 * POST /api/tournaments/[id]/register - Register player for tournament
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { PrismaTournamentRepository } from '@/infrastructure/repositories/tournament-repository'
import { emailService } from '@/infrastructure/services/email-service'
import { contactSyncService } from '@/infrastructure/services/contact-sync-service'

const tournamentRepository = new PrismaTournamentRepository()

const registerSchema = z.object({
  playerId: z.string(),
  tee: z.string().optional(),
  specialRequests: z.string().optional(),
  cart: z.boolean().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: tournamentId } = await context.params
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Get tournament
    const tournament = await tournamentRepository.findById(tournamentId)

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tournament not found',
        },
        { status: 404 }
      )
    }

    // Check if tournament is accepting registrations
    if (!tournament.isAcceptingRegistrations()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tournament is not accepting registrations',
        },
        { status: 400 }
      )
    }

    // Get player
    const player = await prisma.player.findUnique({
      where: { id: validatedData.playerId },
    })

    if (!player) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player not found',
        },
        { status: 404 }
      )
    }

    // Check if player can register based on handicap
    const canRegister = tournament.canPlayerRegister(Number(player.handicapIndex))

    if (!canRegister.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: canRegister.reason,
        },
        { status: 400 }
      )
    }

    // Check if tournament is full
    const currentRegistrations = await prisma.registration.count({
      where: {
        tournamentId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    })

    if (tournament.isFull(currentRegistrations)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tournament is full',
        },
        { status: 400 }
      )
    }

    // Check if already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId: validatedData.playerId,
        },
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player is already registered for this tournament',
        },
        { status: 400 }
      )
    }

    const tournamentData = tournament.toJSON()

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        tournamentId,
        playerId: validatedData.playerId,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: validatedData.tee,
        specialRequests: validatedData.specialRequests,
        cart: validatedData.cart,
        paid: !tournamentData.entryFee, // Auto-paid if no fee
        paidAt: !tournamentData.entryFee ? new Date() : undefined,
      },
      include: {
        tournament: true,
        player: true,
      },
    })

    // Send confirmation email
    try {
      await emailService.sendTournamentRegistrationConfirmation(
        {
          email: player.email,
          name: `${player.firstName} ${player.lastName}`,
        },
        {
          playerName: `${player.firstName} ${player.lastName}`,
          tournamentName: registration.tournament.name,
          tournamentDate: registration.tournament.tournamentDate,
          registrationNumber: registration.id,
          entryFee: tournamentData.entryFee,
          paymentStatus: registration.paid ? 'paid' : 'pending',
          paymentLink: registration.paid
            ? undefined
            : `${process.env.NEXTAUTH_URL}/tournaments/${tournamentId}/payment/${registration.id}`,
        }
      )
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Continue - registration is still valid even if email fails
    }

    // Sync to Brevo contact list
    try {
      await contactSyncService.syncPlayer(player)
    } catch (syncError) {
      console.error('Failed to sync contact to Brevo:', syncError)
      // Continue - registration is still valid
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: registration.id,
          tournamentId: registration.tournamentId,
          playerId: registration.playerId,
          status: registration.status,
          paid: registration.paid,
          registeredAt: registration.registeredAt,
        },
        message: 'Registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error creating registration:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register for tournament',
      },
      { status: 500 }
    )
  }
}
