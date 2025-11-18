/**
 * POST /api/photos/upload
 * Upload single photo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ImageService } from '@/infrastructure/services/image-service'
import { Photo, PhotoCategory } from '@/domain/entities/photo'
import { z } from 'zod'

const imageService = new ImageService()

const uploadSchema = z.object({
  caption: z.string().max(500).optional(),
  category: z.nativeEnum(PhotoCategory).optional(),
  tournamentId: z.string().optional(),
  albumId: z.string().optional(),
  isPublic: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = formData.get('caption') as string | null
    const category = formData.get('category') as string | null
    const tournamentId = formData.get('tournamentId') as string | null
    const albumId = formData.get('albumId') as string | null
    const isPublic = formData.get('isPublic') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image
    const processedImage = await imageService.processImage(
      buffer,
      file.name
    )

    // Create photo domain entity
    const photoEntity = Photo.create({
      filename: processedImage.filename,
      originalName: file.name,
      mimeType: processedImage.mimeType,
      fileSize: processedImage.fileSize,
      width: processedImage.width,
      height: processedImage.height,
      url: processedImage.url,
      thumbnailUrl: processedImage.thumbnailUrl,
      mediumUrl: processedImage.mediumUrl,
      caption: caption || undefined,
      category: (category as PhotoCategory) || PhotoCategory.TOURNAMENT,
      tournamentId: tournamentId || undefined,
      albumId: albumId || undefined,
      uploadedBy: session.user.id,
      isPublic: isPublic === 'true',
      metadata: processedImage.metadata?.toJSON(),
    })

    // Save to database
    const photo = await prisma.photo.create({
      data: {
        filename: photoEntity.getFilename(),
        originalName: photoEntity.getOriginalName(),
        mimeType: photoEntity.getMimeType(),
        fileSize: photoEntity.getFileSize(),
        width: photoEntity.getWidth(),
        height: photoEntity.getHeight(),
        url: photoEntity.getUrl(),
        thumbnailUrl: photoEntity.getThumbnailUrl(),
        mediumUrl: photoEntity.getMediumUrl(),
        caption: photoEntity.getCaption(),
        category: photoEntity.getCategory(),
        tournamentId: photoEntity.getTournamentId(),
        albumId: photoEntity.getAlbumId(),
        uploadedBy: session.user.id,
        isPublic: photoEntity.isPublic(),
        isFeatured: photoEntity.isFeatured(),
        approved: false,
        takenAt: processedImage.metadata?.getTakenAt(),
      },
    })

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        mediumUrl: photo.mediumUrl,
        caption: photo.caption,
        category: photo.category,
        width: photo.width,
        height: photo.height,
      },
    })
  } catch (error) {
    console.error('Photo upload error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
