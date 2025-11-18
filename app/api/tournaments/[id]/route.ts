/**
 * Tournament Detail API Routes
 * GET /api/tournaments/[id] - Get tournament by ID
 * PATCH /api/tournaments/[id] - Update tournament
 * DELETE /api/tournaments/[id] - Delete tournament
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaTournamentRepository } from '@/infrastructure/repositories/tournament-repository'

const tournamentRepository = new PrismaTournamentRepository()

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tournaments/[id]
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const tournament = await tournamentRepository.findById(id)

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tournament not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tournament.toJSON(),
    })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tournament',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tournaments/[id]
 * Update tournament status (open, close, start, complete, cancel)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const actionSchema = z.object({
      action: z.enum(['open', 'close', 'start', 'complete', 'cancel']),
    })

    const { action } = actionSchema.parse(body)

    const tournament = await tournamentRepository.findById(id)

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tournament not found',
        },
        { status: 404 }
      )
    }

    // Execute domain action
    switch (action) {
      case 'open':
        tournament.openForRegistration()
        break
      case 'close':
        tournament.closeRegistration()
        break
      case 'start':
        tournament.start()
        break
      case 'complete':
        tournament.complete()
        break
      case 'cancel':
        tournament.cancel()
        break
    }

    // Persist changes
    await tournamentRepository.save(tournament)

    return NextResponse.json({
      success: true,
      data: tournament.toJSON(),
    })
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    console.error('Error updating tournament:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update tournament',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tournaments/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const tournament = await tournamentRepository.findById(id)

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tournament not found',
        },
        { status: 404 }
      )
    }

    await tournamentRepository.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Tournament deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete tournament',
      },
      { status: 500 }
    )
  }
}
