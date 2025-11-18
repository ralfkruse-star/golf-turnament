/**
 * Club Features API
 * GET /api/clubs/[slug]/features - Get available features for club
 */

import { NextRequest, NextResponse } from 'next/server'
import { ClubService } from '@/infrastructure/services/club-service'
import { prisma } from '@/lib/prisma'
import { getAvailableFeatures } from '@/lib/features'

const clubService = new ClubService(prisma)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get club
    const club = await clubService.getClubBySlug(slug)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Get features for tier
    const tierFeatures = await clubService.getClubFeatures(club.id)

    // Get available features
    const availableFeatures = await getAvailableFeatures(club.id)

    return NextResponse.json({
      tier: club.tier,
      limits: tierFeatures,
      features: availableFeatures,
    })
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}
