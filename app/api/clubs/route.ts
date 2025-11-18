/**
 * Club API Routes
 * GET /api/clubs - List all clubs (admin only)
 * POST /api/clubs - Create new club (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ClubService } from '@/infrastructure/services/club-service'
import { prisma } from '@/lib/prisma'
import { ClubSlug } from '@/domain/value-objects/club-slug'
import { z } from 'zod'

const clubService = new ClubService(prisma)

// Validation schema
const createClubSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email('Invalid email'),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  tier: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
})

/**
 * GET /api/clubs
 * List all clubs with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isActive = searchParams.get('isActive') === 'true' ? true : undefined
    const tier = searchParams.get('tier') || undefined
    const search = searchParams.get('search') || undefined

    const result = await clubService.getAllClubs({
      page,
      limit,
      isActive,
      tier: tier as any,
      search,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 })
  }
}

/**
 * POST /api/clubs
 * Create a new club
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createClubSchema.parse(body)

    // Validate slug format using value object
    try {
      ClubSlug.create(validatedData.slug)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create club
    const club = await clubService.createClub(validatedData)

    return NextResponse.json(club, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    if (error.message?.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error('Error creating club:', error)
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 })
  }
}
