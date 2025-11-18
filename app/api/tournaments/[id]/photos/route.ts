/**
 * GET /api/tournaments/[id]/photos
 * Get photos for a specific tournament
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Fetch photos
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: {
          tournamentId: params.id,
          // Only show approved and public photos by default
          approved: true,
          isPublic: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          uploader: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.photo.count({
        where: {
          tournamentId: params.id,
          approved: true,
          isPublic: true,
        },
      }),
    ])

    return NextResponse.json({
      tournament,
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch tournament photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament photos' },
      { status: 500 }
    )
  }
}
