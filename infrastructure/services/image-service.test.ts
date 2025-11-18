import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ImageService } from './image-service'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

describe('ImageService', () => {
  let imageService: ImageService
  const testUploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos', 'test')

  beforeEach(async () => {
    imageService = new ImageService()
    // Create test directory
    await fs.mkdir(testUploadDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testUploadDir)) {
      await fs.rm(testUploadDir, { recursive: true, force: true })
    }
  })

  describe('processImage', () => {
    it('should process image and generate thumbnails', async () => {
      // Create a simple test image buffer (1x1 red pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const result = await imageService.processImage(
        testImageBuffer,
        'test-image.png',
        { uploadDir: testUploadDir }
      )

      expect(result.filename).toMatch(/^[0-9]+-[a-z0-9]+\.png$/)
      expect(result.url).toContain('/uploads/photos/test/')
      expect(result.thumbnailUrl).toContain('/uploads/photos/test/thumb-')
      expect(result.mediumUrl).toContain('/uploads/photos/test/medium-')
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
      expect(result.fileSize).toBeGreaterThan(0)

      // Verify files exist
      const fullPath = path.join(testUploadDir, result.filename)
      const thumbPath = path.join(testUploadDir, `thumb-${result.filename}`)
      const mediumPath = path.join(testUploadDir, `medium-${result.filename}`)

      expect(existsSync(fullPath)).toBe(true)
      expect(existsSync(thumbPath)).toBe(true)
      expect(existsSync(mediumPath)).toBe(true)
    })

    it('should extract EXIF data if available', async () => {
      // For this test, we'll just verify the structure is correct
      // Real EXIF extraction would require a proper JPEG with EXIF data
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const result = await imageService.processImage(
        testImageBuffer,
        'test.png',
        { uploadDir: testUploadDir }
      )

      expect(result.metadata).toBeDefined()
    })

    it('should generate unique filenames', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const result1 = await imageService.processImage(
        testImageBuffer,
        'same-name.png',
        { uploadDir: testUploadDir }
      )

      const result2 = await imageService.processImage(
        testImageBuffer,
        'same-name.png',
        { uploadDir: testUploadDir }
      )

      expect(result1.filename).not.toBe(result2.filename)
    })

    it('should optimize JPEG images with quality 85', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const result = await imageService.processImage(
        testImageBuffer,
        'test.jpg',
        { uploadDir: testUploadDir }
      )

      // Verify the file was created and is optimized
      expect(result.filename).toMatch(/\.jpg$/)
      expect(result.fileSize).toBeLessThan(testImageBuffer.length * 10) // Should be optimized
    })
  })

  describe('generateThumbnail', () => {
    it('should generate 200x200 thumbnail', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const thumbnailPath = path.join(testUploadDir, 'thumb-test.png')
      const metadata = await imageService.generateThumbnail(
        testImageBuffer,
        thumbnailPath
      )

      expect(metadata.width).toBeLessThanOrEqual(200)
      expect(metadata.height).toBeLessThanOrEqual(200)
      expect(existsSync(thumbnailPath)).toBe(true)
    })
  })

  describe('generateMediumSize', () => {
    it('should generate 800x800 medium size image', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const mediumPath = path.join(testUploadDir, 'medium-test.png')
      const metadata = await imageService.generateMediumSize(
        testImageBuffer,
        mediumPath
      )

      expect(metadata.width).toBeLessThanOrEqual(800)
      expect(metadata.height).toBeLessThanOrEqual(800)
      expect(existsSync(mediumPath)).toBe(true)
    })
  })

  describe('extractEXIF', () => {
    it('should handle images without EXIF data', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const exifData = await imageService.extractEXIF(testImageBuffer)
      expect(exifData).toBeDefined()
      expect(exifData.tags).toBeDefined()
    })
  })

  describe('deleteImage', () => {
    it('should delete image and its variants', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      )

      const result = await imageService.processImage(
        testImageBuffer,
        'to-delete.png',
        { uploadDir: testUploadDir }
      )

      // Verify files exist
      const fullPath = path.join(testUploadDir, result.filename)
      const thumbPath = path.join(testUploadDir, `thumb-${result.filename}`)
      const mediumPath = path.join(testUploadDir, `medium-${result.filename}`)

      expect(existsSync(fullPath)).toBe(true)
      expect(existsSync(thumbPath)).toBe(true)
      expect(existsSync(mediumPath)).toBe(true)

      // Delete
      await imageService.deleteImage(result.url)

      // Verify files are deleted
      expect(existsSync(fullPath)).toBe(false)
      expect(existsSync(thumbPath)).toBe(false)
      expect(existsSync(mediumPath)).toBe(false)
    })
  })
})
