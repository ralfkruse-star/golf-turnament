/**
 * GET /api/albums/[id] - Get album with photos
 * PATCH /api/albums/[id] - Update album
 * DELETE /api/albums/[id] - Delete album
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const album = await prisma.album.findUnique({
      where: { id: params.id },
      include: {
        photos: {
          where: {
            approved: true,
            isPublic: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ album })
  } catch (error) {
    console.error('Failed to fetch album:', error)
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, coverPhotoId, isPublic } = body

    const album = await prisma.album.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        coverPhotoId: coverPhotoId !== undefined ? coverPhotoId : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      album,
    })
  } catch (error) {
    console.error('Failed to update album:', error)
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove album association from photos (don't delete photos)
    await prisma.photo.updateMany({
      where: {
        albumId: params.id,
      },
      data: {
        albumId: null,
      },
    })

    // Delete album
    await prisma.album.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Album deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete album:', error)
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}
