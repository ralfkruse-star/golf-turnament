/**
 * Image Processing Service
 * Handles image upload, resizing, optimization, and EXIF extraction
 */

import sharp from 'sharp'
import exifParser from 'exif-parser'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { PhotoMetadata } from '@/domain/value-objects/photo-metadata'

export interface ProcessedImage {
  filename: string
  url: string
  thumbnailUrl: string
  mediumUrl: string
  width: number
  height: number
  fileSize: number
  mimeType: string
  metadata?: PhotoMetadata
}

export interface ProcessImageOptions {
  uploadDir?: string
  quality?: number
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
}

export class ImageService {
  private readonly defaultUploadDir: string
  private readonly defaultQuality = 85
  private readonly thumbnailSize = 200
  private readonly mediumSize = 800

  constructor() {
    this.defaultUploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'photos'
    )
  }

  /**
   * Process uploaded image: optimize, generate thumbnails, extract EXIF
   */
  async processImage(
    buffer: Buffer,
    originalName: string,
    options: ProcessImageOptions = {}
  ): Promise<ProcessedImage> {
    const uploadDir = options.uploadDir || this.defaultUploadDir
    const quality = options.quality || this.defaultQuality

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const filename = this.generateFilename(originalName)
    const fullPath = path.join(uploadDir, filename)
    const thumbPath = path.join(uploadDir, `thumb-${filename}`)
    const mediumPath = path.join(uploadDir, `medium-${filename}`)

    // Get image metadata
    const imageMetadata = await sharp(buffer).metadata()
    const format = imageMetadata.format || 'jpeg'
    const mimeType = `image/${format}`

    // Process and save original (optimized)
    const processedImage = sharp(buffer)

    if (format === 'jpeg' || format === 'jpg') {
      await processedImage.jpeg({ quality, progressive: true }).toFile(fullPath)
    } else if (format === 'png') {
      await processedImage.png({ quality }).toFile(fullPath)
    } else if (format === 'webp') {
      await processedImage.webp({ quality }).toFile(fullPath)
    } else {
      // Convert to JPEG for other formats
      await processedImage.jpeg({ quality, progressive: true }).toFile(fullPath)
    }

    // Get file size
    const stats = await fs.stat(fullPath)
    const fileSize = stats.size

    // Generate thumbnail
    const thumbnailMetadata = await this.generateThumbnail(buffer, thumbPath)

    // Generate medium size
    const mediumMetadata = await this.generateMediumSize(buffer, mediumPath)

    // Extract EXIF data
    const exifData = await this.extractEXIF(buffer)
    const photoMetadata = exifData ? PhotoMetadata.fromEXIF(exifData) : undefined

    // Generate URLs (relative to public directory)
    const baseUrl = uploadDir.replace(path.join(process.cwd(), 'public'), '')
    const url = path.join(baseUrl, filename).replace(/\\/g, '/')
    const thumbnailUrl = path.join(baseUrl, `thumb-${filename}`).replace(/\\/g, '/')
    const mediumUrl = path.join(baseUrl, `medium-${filename}`).replace(/\\/g, '/')

    return {
      filename,
      url,
      thumbnailUrl,
      mediumUrl,
      width: imageMetadata.width || 0,
      height: imageMetadata.height || 0,
      fileSize,
      mimeType,
      metadata: photoMetadata,
    }
  }

  /**
   * Generate thumbnail (200x200, cover fit)
   */
  async generateThumbnail(
    buffer: Buffer,
    outputPath: string
  ): Promise<ImageMetadata> {
    const thumbnail = await sharp(buffer)
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: this.defaultQuality })
      .toFile(outputPath)

    return {
      width: thumbnail.width,
      height: thumbnail.height,
      format: thumbnail.format,
      size: thumbnail.size,
    }
  }

  /**
   * Generate medium size (800x800, inside fit to preserve aspect ratio)
   */
  async generateMediumSize(
    buffer: Buffer,
    outputPath: string
  ): Promise<ImageMetadata> {
    const medium = await sharp(buffer)
      .resize(this.mediumSize, this.mediumSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: this.defaultQuality, progressive: true })
      .toFile(outputPath)

    return {
      width: medium.width,
      height: medium.height,
      format: medium.format,
      size: medium.size,
    }
  }

  /**
   * Extract EXIF data from image buffer
   */
  async extractEXIF(buffer: Buffer): Promise<any> {
    try {
      // EXIF parser only works with JPEG
      const parser = exifParser.create(buffer)
      const result = parser.parse()
      return result
    } catch (error) {
      // Image doesn't have EXIF data or is not JPEG
      return { tags: {} }
    }
  }

  /**
   * Delete image and all its variants
   */
  async deleteImage(url: string): Promise<void> {
    // Convert URL back to file path
    const publicDir = path.join(process.cwd(), 'public')
    const fullPath = path.join(publicDir, url)
    const dir = path.dirname(fullPath)
    const filename = path.basename(fullPath)

    // Delete original
    if (existsSync(fullPath)) {
      await fs.unlink(fullPath)
    }

    // Delete thumbnail
    const thumbPath = path.join(dir, `thumb-${filename}`)
    if (existsSync(thumbPath)) {
      await fs.unlink(thumbPath)
    }

    // Delete medium
    const mediumPath = path.join(dir, `medium-${filename}`)
    if (existsSync(mediumPath)) {
      await fs.unlink(mediumPath)
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}${ext}`
  }
}
