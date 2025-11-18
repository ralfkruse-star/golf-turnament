/**
 * POST /api/photos/batch-upload
 * Upload multiple photos in a batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ImageService } from '@/infrastructure/services/image-service'
import { Photo, PhotoCategory } from '@/domain/entities/photo'

const imageService = new ImageService()

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
    const files = formData.getAll('files') as File[]
    const category = (formData.get('category') as string) || PhotoCategory.TOURNAMENT
    const tournamentId = formData.get('tournamentId') as string | null
    const albumId = formData.get('albumId') as string | null
    const isPublic = (formData.get('isPublic') as string) !== 'false'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Process all files
    const results = await Promise.allSettled(
      files.map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`)
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
          category: category as PhotoCategory,
          tournamentId: tournamentId || undefined,
          albumId: albumId || undefined,
          uploadedBy: session.user.id,
          isPublic,
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

        return {
          id: photo.id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          originalName: file.name,
        }
      })
    )

    // Separate successful and failed uploads
    const successful: any[] = []
    const failed: any[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value)
      } else {
        failed.push({
          filename: files[index].name,
          error: result.reason.message,
        })
      }
    })

    return NextResponse.json({
      success: true,
      uploaded: successful.length,
      failed: failed.length,
      photos: successful,
      errors: failed,
    })
  } catch (error) {
    console.error('Batch upload error:', error)

    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    )
  }
}
