/**
 * Club Stats API
 * GET /api/clubs/[slug]/stats - Get club statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { ClubService } from '@/infrastructure/services/club-service'
import { prisma } from '@/lib/prisma'
import { getClubUsage } from '@/lib/features'

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

    // Get stats
    const stats = await clubService.getClubStats(club.id)

    // Get usage
    const usage = await getClubUsage(club.id)

    return NextResponse.json({
      ...stats,
      usage,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
