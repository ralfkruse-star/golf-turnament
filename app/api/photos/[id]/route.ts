/**
 * GET /api/photos/[id] - Get single photo
 * PATCH /api/photos/[id] - Update photo
 * DELETE /api/photos/[id] - Delete photo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ImageService } from '@/infrastructure/services/image-service'
import { Photo } from '@/domain/entities/photo'

const imageService = new ImageService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
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
            tournamentDate: true,
          },
        },
        album: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ photo })
  } catch (error) {
    console.error('Failed to fetch photo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
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

    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      caption,
      category,
      isPublic,
      isFeatured,
      approved,
      tournamentId,
      albumId,
    } = body

    // Check permissions
    const isOwner = photo.uploadedBy === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'TOURNAMENT_MANAGER'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Only admins can approve photos
    if (approved !== undefined && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can approve photos' },
        { status: 403 }
      )
    }

    // Update photo
    const updated = await prisma.photo.update({
      where: { id: params.id },
      data: {
        caption: caption !== undefined ? caption : undefined,
        category: category !== undefined ? category : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
        approved: approved !== undefined ? approved : undefined,
        moderatedBy: approved !== undefined ? session.user.id : undefined,
        moderatedAt: approved !== undefined ? new Date() : undefined,
        tournamentId: tournamentId !== undefined ? tournamentId : undefined,
        albumId: albumId !== undefined ? albumId : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      photo: updated,
    })
  } catch (error) {
    console.error('Failed to update photo:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update photo' },
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

    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = photo.uploadedBy === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'TOURNAMENT_MANAGER'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete image files
    await imageService.deleteImage(photo.url)

    // Delete from database
    await prisma.photo.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
