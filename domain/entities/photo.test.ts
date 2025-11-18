import { describe, it, expect, beforeEach } from 'vitest'
import { Photo, PhotoCategory } from './photo'

describe('Photo Domain Entity', () => {
  let validParams: any

  beforeEach(() => {
    validParams = {
      filename: 'test-photo.jpg',
      originalName: 'My Golf Shot.jpg',
      mimeType: 'image/jpeg',
      fileSize: 5 * 1024 * 1024, // 5MB
      width: 1920,
      height: 1080,
      url: '/uploads/photos/test-photo.jpg',
      category: PhotoCategory.TOURNAMENT,
      uploadedBy: 'user_123',
    }
  })

  describe('create', () => {
    it('should create a valid photo', () => {
      const photo = Photo.create(validParams)

      expect(photo.getFilename()).toBe('test-photo.jpg')
      expect(photo.getOriginalName()).toBe('My Golf Shot.jpg')
      expect(photo.getMimeType()).toBe('image/jpeg')
      expect(photo.getFileSize()).toBe(5 * 1024 * 1024)
      expect(photo.getWidth()).toBe(1920)
      expect(photo.getHeight()).toBe(1080)
      expect(photo.getUrl()).toBe('/uploads/photos/test-photo.jpg')
      expect(photo.getCategory()).toBe(PhotoCategory.TOURNAMENT)
      expect(photo.isApproved()).toBe(false)
      expect(photo.isPublic()).toBe(true)
    })

    it('should default to unapproved status', () => {
      const photo = Photo.create(validParams)
      expect(photo.isApproved()).toBe(false)
    })

    it('should default to public visibility', () => {
      const photo = Photo.create(validParams)
      expect(photo.isPublic()).toBe(true)
    })

    it('should throw error if file size exceeds 10MB', () => {
      const invalidParams = {
        ...validParams,
        fileSize: 11 * 1024 * 1024, // 11MB
      }

      expect(() => Photo.create(invalidParams)).toThrow(
        'File size must not exceed 10MB'
      )
    })

    it('should throw error if file size is zero or negative', () => {
      expect(() => Photo.create({ ...validParams, fileSize: 0 })).toThrow(
        'File size must be greater than 0'
      )

      expect(() => Photo.create({ ...validParams, fileSize: -100 })).toThrow(
        'File size must be greater than 0'
      )
    })

    it('should throw error for invalid mime type', () => {
      const invalidParams = {
        ...validParams,
        mimeType: 'image/gif',
      }

      expect(() => Photo.create(invalidParams)).toThrow(
        'Invalid mime type. Allowed: image/jpeg, image/png, image/webp'
      )
    })

    it('should accept jpeg mime type', () => {
      const photo = Photo.create({ ...validParams, mimeType: 'image/jpeg' })
      expect(photo.getMimeType()).toBe('image/jpeg')
    })

    it('should accept png mime type', () => {
      const photo = Photo.create({ ...validParams, mimeType: 'image/png' })
      expect(photo.getMimeType()).toBe('image/png')
    })

    it('should accept webp mime type', () => {
      const photo = Photo.create({ ...validParams, mimeType: 'image/webp' })
      expect(photo.getMimeType()).toBe('image/webp')
    })

    it('should throw error if width is less than minimum', () => {
      expect(() => Photo.create({ ...validParams, width: 50 })).toThrow(
        'Image dimensions must be at least 100x100'
      )
    })

    it('should throw error if height is less than minimum', () => {
      expect(() => Photo.create({ ...validParams, height: 50 })).toThrow(
        'Image dimensions must be at least 100x100'
      )
    })

    it('should throw error if width exceeds maximum', () => {
      expect(() => Photo.create({ ...validParams, width: 5000 })).toThrow(
        'Image dimensions must not exceed 4000x4000'
      )
    })

    it('should throw error if height exceeds maximum', () => {
      expect(() => Photo.create({ ...validParams, height: 5000 })).toThrow(
        'Image dimensions must not exceed 4000x4000'
      )
    })

    it('should accept minimum valid dimensions', () => {
      const photo = Photo.create({ ...validParams, width: 100, height: 100 })
      expect(photo.getWidth()).toBe(100)
      expect(photo.getHeight()).toBe(100)
    })

    it('should accept maximum valid dimensions', () => {
      const photo = Photo.create({ ...validParams, width: 4000, height: 4000 })
      expect(photo.getWidth()).toBe(4000)
      expect(photo.getHeight()).toBe(4000)
    })

    it('should throw error if caption exceeds 500 characters', () => {
      const longCaption = 'a'.repeat(501)
      expect(() =>
        Photo.create({ ...validParams, caption: longCaption })
      ).toThrow('Caption must not exceed 500 characters')
    })

    it('should accept caption at maximum length', () => {
      const maxCaption = 'a'.repeat(500)
      const photo = Photo.create({ ...validParams, caption: maxCaption })
      expect(photo.getCaption()).toBe(maxCaption)
    })

    it('should accept empty caption', () => {
      const photo = Photo.create({ ...validParams, caption: '' })
      expect(photo.getCaption()).toBe('')
    })

    it('should accept undefined caption', () => {
      const photo = Photo.create({ ...validParams, caption: undefined })
      expect(photo.getCaption()).toBeUndefined()
    })
  })

  describe('setCaption', () => {
    it('should update caption', () => {
      const photo = Photo.create(validParams)
      photo.setCaption('Updated caption')
      expect(photo.getCaption()).toBe('Updated caption')
    })

    it('should throw error if new caption exceeds 500 characters', () => {
      const photo = Photo.create(validParams)
      const longCaption = 'a'.repeat(501)
      expect(() => photo.setCaption(longCaption)).toThrow(
        'Caption must not exceed 500 characters'
      )
    })
  })

  describe('approve', () => {
    it('should approve photo', () => {
      const photo = Photo.create(validParams)
      photo.approve('moderator_123')
      expect(photo.isApproved()).toBe(true)
    })

    it('should not allow approving already approved photo', () => {
      const photo = Photo.create(validParams)
      photo.approve('moderator_123')
      expect(() => photo.approve('moderator_123')).toThrow(
        'Photo is already approved'
      )
    })
  })

  describe('reject', () => {
    it('should reject (unapprove) photo', () => {
      const photo = Photo.create(validParams)
      photo.approve('moderator_123')
      photo.reject()
      expect(photo.isApproved()).toBe(false)
    })
  })

  describe('setVisibility', () => {
    it('should set photo to private', () => {
      const photo = Photo.create(validParams)
      photo.setVisibility(false)
      expect(photo.isPublic()).toBe(false)
    })

    it('should set photo to public', () => {
      const photo = Photo.create({ ...validParams, isPublic: false })
      photo.setVisibility(true)
      expect(photo.isPublic()).toBe(true)
    })
  })

  describe('setFeatured', () => {
    it('should mark photo as featured', () => {
      const photo = Photo.create(validParams)
      photo.setFeatured(true)
      expect(photo.isFeatured()).toBe(true)
    })

    it('should unmark photo as featured', () => {
      const photo = Photo.create(validParams)
      photo.setFeatured(true)
      photo.setFeatured(false)
      expect(photo.isFeatured()).toBe(false)
    })
  })

  describe('setThumbnailUrl', () => {
    it('should set thumbnail URL', () => {
      const photo = Photo.create(validParams)
      photo.setThumbnailUrl('/uploads/photos/test-photo-thumb.jpg')
      expect(photo.getThumbnailUrl()).toBe('/uploads/photos/test-photo-thumb.jpg')
    })
  })

  describe('setMediumUrl', () => {
    it('should set medium URL', () => {
      const photo = Photo.create(validParams)
      photo.setMediumUrl('/uploads/photos/test-photo-medium.jpg')
      expect(photo.getMediumUrl()).toBe('/uploads/photos/test-photo-medium.jpg')
    })
  })

  describe('associateWithTournament', () => {
    it('should associate photo with tournament', () => {
      const photo = Photo.create(validParams)
      photo.associateWithTournament('tournament_123')
      expect(photo.getTournamentId()).toBe('tournament_123')
    })

    it('should allow changing tournament association', () => {
      const photo = Photo.create(validParams)
      photo.associateWithTournament('tournament_123')
      photo.associateWithTournament('tournament_456')
      expect(photo.getTournamentId()).toBe('tournament_456')
    })
  })

  describe('associateWithAlbum', () => {
    it('should associate photo with album', () => {
      const photo = Photo.create(validParams)
      photo.associateWithAlbum('album_123')
      expect(photo.getAlbumId()).toBe('album_123')
    })

    it('should allow removing album association', () => {
      const photo = Photo.create(validParams)
      photo.associateWithAlbum('album_123')
      photo.associateWithAlbum(undefined)
      expect(photo.getAlbumId()).toBeUndefined()
    })
  })

  describe('metadata', () => {
    it('should return metadata', () => {
      const photo = Photo.create(validParams)
      const metadata = photo.getMetadata()
      expect(metadata).toEqual({
        takenAt: undefined,
        cameraModel: undefined,
        focalLength: undefined,
        aperture: undefined,
        shutterSpeed: undefined,
        iso: undefined,
      })
    })
  })
})
