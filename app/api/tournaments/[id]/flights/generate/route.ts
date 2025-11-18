/**
 * Generate Flights for Tournament
 * POST /api/tournaments/[id]/flights/generate
 * Automatically generates flights based on handicaps and player count
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const generateFlightsSchema = z.object({
  playersPerFlight: z.number().min(2).max(4).default(4),
  intervalMinutes: z.number().min(5).max(15).default(10),
  startTime: z.string().datetime(),
  startHole: z.number().min(1).max(18).default(1),
  groupingStrategy: z.enum(['handicap', 'random', 'pairs']).default('handicap'),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: tournamentId } = await context.params
    const body = await request.json()
    const validated = generateFlightsSchema.parse(body)

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Get all confirmed registrations with player data
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        status: 'CONFIRMED',
      },
      include: {
        player: true,
      },
      orderBy: {
        player: {
          handicapIndex: 'asc', // Sort by handicap for grouping
        },
      },
    })

    if (registrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No confirmed registrations found' },
        { status: 400 }
      )
    }

    // Delete existing flights
    await prisma.flight.deleteMany({
      where: { tournamentId },
    })

    // Group players into flights
    const flights: any[] = []
    const startTime = new Date(validated.startTime)

    let currentFlightPlayers: typeof registrations = []
    let flightNumber = 1

    for (let i = 0; i < registrations.length; i++) {
      currentFlightPlayers.push(registrations[i])

      // Create flight when we have enough players or it's the last player
      if (
        currentFlightPlayers.length === validated.playersPerFlight ||
        i === registrations.length - 1
      ) {
        // Calculate start time for this flight
        const flightStartTime = new Date(startTime)
        flightStartTime.setMinutes(
          startTime.getMinutes() + (flightNumber - 1) * validated.intervalMinutes
        )

        // Create flight
        const flight = await prisma.flight.create({
          data: {
            tournamentId,
            flightNumber,
            startTime: flightStartTime,
            startHole: validated.startHole,
          },
        })

        // Assign players to this flight
        for (const registration of currentFlightPlayers) {
          await prisma.registration.update({
            where: { id: registration.id },
            data: { flightId: flight.id },
          })
        }

        flights.push({
          flightNumber,
          startTime: flightStartTime,
          players: currentFlightPlayers.map((r) => ({
            name: `${r.player.firstName} ${r.player.lastName}`,
            handicap: r.playingHandicap?.toString(),
          })),
        })

        // Reset for next flight
        currentFlightPlayers = []
        flightNumber++
      }
    }

    return NextResponse.json({
      success: true,
      message: `${flights.length} Flights generiert`,
      data: {
        flightCount: flights.length,
        totalPlayers: registrations.length,
        flights: flights.map((f) => ({
          flightNumber: f.flightNumber,
          startTime: f.startTime,
          playerCount: f.players.length,
        })),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Flight generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate flights' },
      { status: 500 }
    )
  }
}
