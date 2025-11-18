/**
 * Tournament API Routes
 * GET /api/tournaments - List tournaments
 * POST /api/tournaments - Create tournament
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaTournamentRepository } from '@/infrastructure/repositories/tournament-repository'
import { Tournament } from '@/domain/entities/tournament'
import { TournamentFormat } from '@/domain/value-objects/tournament-format'

const tournamentRepository = new PrismaTournamentRepository()

// Validation schema
const createTournamentSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().optional(),
  format: z.enum([
    'STROKE_PLAY',
    'STABLEFORD',
    'MATCH_PLAY',
    'SCRAMBLE',
    'BEST_BALL',
    'FOUR_BALL',
    'NASSAU',
  ]),
  category: z.enum([
    'CLUB_CHAMPIONSHIP',
    'MONTHLY_MEDAL',
    'CORPORATE_EVENT',
    'CHARITY',
    'MEMBER_GUEST',
    'PRO_AM',
    'CASUAL',
  ]),
  tournamentDate: z.string().datetime(),
  registrationStart: z.string().datetime(),
  registrationEnd: z.string().datetime(),
  maxPlayers: z.number().int().positive().optional(),
  minPlayers: z.number().int().positive().optional(),
  entryFee: z.number().nonnegative().optional(),
  requireHandicap: z.boolean().optional(),
  maxHandicap: z.number().min(0).max(54).optional(),
  allowGuests: z.boolean().optional(),
})

/**
 * GET /api/tournaments
 * List all tournaments with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')

    const filters: any = {}

    if (status) {
      filters.status = status.split(',')
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }

    if (category) {
      filters.category = category
    }

    const tournaments = await tournamentRepository.findAll(filters)

    return NextResponse.json({
      success: true,
      data: tournaments.map((t) => t.toJSON()),
    })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tournaments',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tournaments
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createTournamentSchema.parse(body)

    // Create tournament domain object
    const tournament = Tournament.create({
      name: validatedData.name,
      description: validatedData.description,
      format: TournamentFormat.fromString(validatedData.format),
      category: validatedData.category,
      tournamentDate: new Date(validatedData.tournamentDate),
      registrationStart: new Date(validatedData.registrationStart),
      registrationEnd: new Date(validatedData.registrationEnd),
      maxPlayers: validatedData.maxPlayers,
      minPlayers: validatedData.minPlayers,
      entryFee: validatedData.entryFee,
      requireHandicap: validatedData.requireHandicap,
      maxHandicap: validatedData.maxHandicap,
      allowGuests: validatedData.allowGuests,
    })

    // Persist to database
    await tournamentRepository.save(tournament)

    return NextResponse.json(
      {
        success: true,
        data: tournament.toJSON(),
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    console.error('Error creating tournament:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tournament',
      },
      { status: 500 }
    )
  }
}
