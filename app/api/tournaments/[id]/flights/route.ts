/**
 * Tournament Flights API
 * GET /api/tournaments/[id]/flights - Get all flights for tournament
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: tournamentId } = await context.params

    // Get flights with registrations and players
    const flights = await prisma.flight.findMany({
      where: { tournamentId },
      include: {
        registrations: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        flightNumber: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: flights.map((flight) => ({
        id: flight.id,
        flightNumber: flight.flightNumber,
        startTime: flight.startTime,
        startHole: flight.startHole,
        players: flight.registrations.map((reg) => ({
          id: reg.player.id,
          name: `${reg.player.firstName} ${reg.player.lastName}`,
          handicap: reg.playingHandicap?.toString(),
          tee: reg.tee,
          cart: reg.cart,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching flights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flights' },
      { status: 500 }
    )
  }
}
