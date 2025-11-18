/**
 * Individual Club API Routes
 * GET /api/clubs/[slug] - Get club by slug
 * PATCH /api/clubs/[slug] - Update club
 * DELETE /api/clubs/[slug] - Delete (suspend) club
 */

import { NextRequest, NextResponse } from 'next/server'
import { ClubService } from '@/infrastructure/services/club-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clubService = new ClubService(prisma)

const updateClubSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
})

/**
 * GET /api/clubs/[slug]
 * Get club by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const club = await clubService.getClubBySlug(slug)

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    return NextResponse.json(club)
  } catch (error) {
    console.error('Error fetching club:', error)
    return NextResponse.json({ error: 'Failed to fetch club' }, { status: 500 })
  }
}

/**
 * PATCH /api/clubs/[slug]
 * Update club
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateClubSchema.parse(body)

    // Get club first
    const club = await clubService.getClubBySlug(slug)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Update club
    const updatedClub = await clubService.updateClub(club.id, validatedData)

    return NextResponse.json(updatedClub)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating club:', error)
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 })
  }
}

/**
 * DELETE /api/clubs/[slug]
 * Delete (suspend) club
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get club first
    const club = await clubService.getClubBySlug(slug)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Soft delete by suspending
    await clubService.suspendClub(club.id, 'Deleted by admin')

    return NextResponse.json({ message: 'Club deleted successfully' })
  } catch (error) {
    console.error('Error deleting club:', error)
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 })
  }
}
