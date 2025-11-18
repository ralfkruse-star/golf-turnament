/**
 * Club Branding API
 * PATCH /api/clubs/[slug]/branding - Update club branding
 */

import { NextRequest, NextResponse } from 'next/server'
import { ClubService } from '@/infrastructure/services/club-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clubService = new ClubService(prisma)

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.null()),
  logo: z.string().url().optional().or(z.null()),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate input
    const validatedData = brandingSchema.parse(body)

    // Get club
    const club = await clubService.getClubBySlug(slug)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Update branding
    const updatedClub = await clubService.updateClubBranding(club.id, validatedData)

    return NextResponse.json(updatedClub)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating branding:', error)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
