import { describe, it, expect } from 'vitest'
import { PhotoMetadata } from './photo-metadata'

describe('PhotoMetadata Value Object', () => {
  describe('create', () => {
    it('should create empty metadata', () => {
      const metadata = PhotoMetadata.create({})
      expect(metadata.getTakenAt()).toBeUndefined()
      expect(metadata.getCameraModel()).toBeUndefined()
      expect(metadata.getFocalLength()).toBeUndefined()
      expect(metadata.getAperture()).toBeUndefined()
      expect(metadata.getShutterSpeed()).toBeUndefined()
      expect(metadata.getISO()).toBeUndefined()
    })

    it('should create metadata with all fields', () => {
      const takenAt = new Date('2025-01-15T10:30:00Z')
      const metadata = PhotoMetadata.create({
        takenAt,
        cameraModel: 'Canon EOS R5',
        focalLength: 50,
        aperture: 2.8,
        shutterSpeed: '1/500',
        iso: 400,
      })

      expect(metadata.getTakenAt()).toEqual(takenAt)
      expect(metadata.getCameraModel()).toBe('Canon EOS R5')
      expect(metadata.getFocalLength()).toBe(50)
      expect(metadata.getAperture()).toBe(2.8)
      expect(metadata.getShutterSpeed()).toBe('1/500')
      expect(metadata.getISO()).toBe(400)
    })

    it('should create metadata with partial fields', () => {
      const metadata = PhotoMetadata.create({
        cameraModel: 'Sony A7III',
        iso: 800,
      })

      expect(metadata.getCameraModel()).toBe('Sony A7III')
      expect(metadata.getISO()).toBe(800)
      expect(metadata.getFocalLength()).toBeUndefined()
    })
  })

  describe('fromEXIF', () => {
    it('should extract metadata from EXIF data', () => {
      const exifData = {
        tags: {
          DateTime: 1705315800, // Unix timestamp
          Make: 'Canon',
          Model: 'EOS R5',
          FocalLength: 50,
          FNumber: 2.8,
          ExposureTime: 0.002, // 1/500
          ISO: 400,
        },
      }

      const metadata = PhotoMetadata.fromEXIF(exifData as any)

      expect(metadata.getCameraModel()).toBe('Canon EOS R5')
      expect(metadata.getFocalLength()).toBe(50)
      expect(metadata.getAperture()).toBe(2.8)
      expect(metadata.getISO()).toBe(400)
    })

    it('should handle missing EXIF fields gracefully', () => {
      const exifData = {
        tags: {
          Make: 'Nikon',
        },
      }

      const metadata = PhotoMetadata.fromEXIF(exifData as any)

      expect(metadata.getCameraModel()).toBe('Nikon')
      expect(metadata.getFocalLength()).toBeUndefined()
      expect(metadata.getISO()).toBeUndefined()
    })

    it('should handle empty EXIF data', () => {
      const metadata = PhotoMetadata.fromEXIF({ tags: {} } as any)

      expect(metadata.getTakenAt()).toBeUndefined()
      expect(metadata.getCameraModel()).toBeUndefined()
    })

    it('should format exposure time as shutter speed', () => {
      const exifData = {
        tags: {
          ExposureTime: 0.004, // 1/250
        },
      }

      const metadata = PhotoMetadata.fromEXIF(exifData as any)
      expect(metadata.getShutterSpeed()).toBe('1/250')
    })

    it('should handle slow shutter speeds', () => {
      const exifData = {
        tags: {
          ExposureTime: 2.5,
        },
      }

      const metadata = PhotoMetadata.fromEXIF(exifData as any)
      expect(metadata.getShutterSpeed()).toBe('2.5s')
    })

    it('should combine Make and Model for camera', () => {
      const exifData = {
        tags: {
          Make: 'Sony',
          Model: 'A7III',
        },
      }

      const metadata = PhotoMetadata.fromEXIF(exifData as any)
      expect(metadata.getCameraModel()).toBe('Sony A7III')
    })

    it('should use only Model if Make is missing', () => {
      const exifData = {
        tags: {
          Model: 'iPhone 13 Pro',
        },
      }

      const metadata = PhotoMetadata.fromEXIF(exifData as any)
      expect(metadata.getCameraModel()).toBe('iPhone 13 Pro')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const takenAt = new Date('2025-01-15T10:30:00Z')
      const metadata = PhotoMetadata.create({
        takenAt,
        cameraModel: 'Canon EOS R5',
        focalLength: 50,
        aperture: 2.8,
        shutterSpeed: '1/500',
        iso: 400,
      })

      const json = metadata.toJSON()
      expect(json).toEqual({
        takenAt,
        cameraModel: 'Canon EOS R5',
        focalLength: 50,
        aperture: 2.8,
        shutterSpeed: '1/500',
        iso: 400,
      })
    })
  })

  describe('equality', () => {
    it('should compare metadata equality', () => {
      const takenAt = new Date('2025-01-15T10:30:00Z')
      const metadata1 = PhotoMetadata.create({
        takenAt,
        cameraModel: 'Canon EOS R5',
        iso: 400,
      })

      const metadata2 = PhotoMetadata.create({
        takenAt,
        cameraModel: 'Canon EOS R5',
        iso: 400,
      })

      expect(metadata1.equals(metadata2)).toBe(true)
    })

    it('should detect differences in metadata', () => {
      const metadata1 = PhotoMetadata.create({
        cameraModel: 'Canon EOS R5',
        iso: 400,
      })

      const metadata2 = PhotoMetadata.create({
        cameraModel: 'Sony A7III',
        iso: 400,
      })

      expect(metadata1.equals(metadata2)).toBe(false)
    })
  })
})
