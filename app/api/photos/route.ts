/**
 * GET /api/photos
 * List photos with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PhotoCategory } from '@/domain/entities/photo'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filtering
    const category = searchParams.get('category') as PhotoCategory | null
    const tournamentId = searchParams.get('tournamentId')
    const albumId = searchParams.get('albumId')
    const approved = searchParams.get('approved')
    const isPublic = searchParams.get('isPublic')
    const isFeatured = searchParams.get('isFeatured')

    // Build where clause
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (tournamentId) {
      where.tournamentId = tournamentId
    }

    if (albumId) {
      where.albumId = albumId
    }

    if (approved !== null && approved !== undefined) {
      where.approved = approved === 'true'
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (isFeatured !== null && isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true'
    }

    // Fetch photos
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          uploader: {
            select: {
              name: true,
              email: true,
            },
          },
          tournament: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.photo.count({ where }),
    ])

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}
