/**
 * POST /api/albums - Create new album
 * GET /api/albums - List albums
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, photoIds, isPublic } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create album
    const album = await prisma.album.create({
      data: {
        title,
        description,
        isPublic: isPublic ?? true,
      },
    })

    // Associate photos with album if provided
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      await prisma.photo.updateMany({
        where: {
          id: {
            in: photoIds,
          },
        },
        data: {
          albumId: album.id,
        },
      })

      // Set first photo as cover if not specified
      await prisma.album.update({
        where: { id: album.id },
        data: {
          coverPhotoId: photoIds[0],
        },
      })
    }

    return NextResponse.json({
      success: true,
      album,
    })
  } catch (error) {
    console.error('Failed to create album:', error)
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filtering
    const isPublic = searchParams.get('isPublic')

    const where: any = {}
    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    // Fetch albums
    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          photos: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
            },
          },
          _count: {
            select: {
              photos: true,
            },
          },
        },
      }),
      prisma.album.count({ where }),
    ])

    return NextResponse.json({
      albums,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}
