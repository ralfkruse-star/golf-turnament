import { describe, it, expect } from 'vitest'
import { ClubSlug } from './club-slug'

describe('ClubSlug', () => {
  describe('create', () => {
    it('should create a valid slug', () => {
      const slug = ClubSlug.create('golfplatz-siek')
      expect(slug.getValue()).toBe('golfplatz-siek')
    })

    it('should create slug with numbers', () => {
      const slug = ClubSlug.create('golf-club-2024')
      expect(slug.getValue()).toBe('golf-club-2024')
    })

    it('should throw error for empty slug', () => {
      expect(() => ClubSlug.create('')).toThrow('Slug cannot be empty')
    })

    it('should throw error for slug that is too short', () => {
      expect(() => ClubSlug.create('ab')).toThrow('Slug must be between 3 and 50 characters')
    })

    it('should throw error for slug that is too long', () => {
      const longSlug = 'a'.repeat(51)
      expect(() => ClubSlug.create(longSlug)).toThrow('Slug must be between 3 and 50 characters')
    })

    it('should throw error for slug with uppercase letters', () => {
      expect(() => ClubSlug.create('GolfClub')).toThrow('Invalid slug format')
    })

    it('should throw error for slug with spaces', () => {
      expect(() => ClubSlug.create('golf club')).toThrow('Invalid slug format')
    })

    it('should throw error for slug with special characters', () => {
      expect(() => ClubSlug.create('golf@club')).toThrow('Invalid slug format')
    })

    it('should throw error for slug with underscores', () => {
      expect(() => ClubSlug.create('golf_club')).toThrow('Invalid slug format')
    })

    it('should throw error for slug starting with hyphen', () => {
      expect(() => ClubSlug.create('-golfclub')).toThrow('Invalid slug format')
    })

    it('should throw error for slug ending with hyphen', () => {
      expect(() => ClubSlug.create('golfclub-')).toThrow('Invalid slug format')
    })

    it('should throw error for slug with consecutive hyphens', () => {
      expect(() => ClubSlug.create('golf--club')).toThrow('Invalid slug format')
    })
  })

  describe('fromString', () => {
    it('should create slug from string with spaces', () => {
      const slug = ClubSlug.fromString('Golf Club Siek')
      expect(slug.getValue()).toBe('golf-club-siek')
    })

    it('should create slug from string with mixed case', () => {
      const slug = ClubSlug.fromString('GolfPlatz SIEK')
      expect(slug.getValue()).toBe('golfplatz-siek')
    })

    it('should remove special characters', () => {
      const slug = ClubSlug.fromString('Golf & Country Club!')
      expect(slug.getValue()).toBe('golf-country-club')
    })

    it('should handle multiple spaces', () => {
      const slug = ClubSlug.fromString('Golf   Club   Siek')
      expect(slug.getValue()).toBe('golf-club-siek')
    })

    it('should handle leading and trailing spaces', () => {
      const slug = ClubSlug.fromString('  Golf Club  ')
      expect(slug.getValue()).toBe('golf-club')
    })

    it('should handle umlauts', () => {
      const slug = ClubSlug.fromString('Golfclub München')
      expect(slug.getValue()).toBe('golfclub-muenchen')
    })

    it('should handle numbers', () => {
      const slug = ClubSlug.fromString('Golf Club 2024')
      expect(slug.getValue()).toBe('golf-club-2024')
    })

    it('should throw error if result is too short', () => {
      expect(() => ClubSlug.fromString('ab')).toThrow('Generated slug is too short')
    })

    it('should truncate long slugs to 50 characters', () => {
      const longName = 'a'.repeat(100)
      const slug = ClubSlug.fromString(longName)
      expect(slug.getValue().length).toBe(50)
    })

    it('should throw error if result is empty after sanitization', () => {
      expect(() => ClubSlug.fromString('!!!')).toThrow('Cannot generate valid slug from input')
    })
  })

  describe('isValid', () => {
    it('should return true for valid slug', () => {
      expect(ClubSlug.isValid('golfplatz-siek')).toBe(true)
    })

    it('should return true for slug with numbers', () => {
      expect(ClubSlug.isValid('golf-club-123')).toBe(true)
    })

    it('should return false for empty slug', () => {
      expect(ClubSlug.isValid('')).toBe(false)
    })

    it('should return false for slug with uppercase', () => {
      expect(ClubSlug.isValid('GolfClub')).toBe(false)
    })

    it('should return false for slug with spaces', () => {
      expect(ClubSlug.isValid('golf club')).toBe(false)
    })

    it('should return false for slug with special characters', () => {
      expect(ClubSlug.isValid('golf@club')).toBe(false)
    })

    it('should return false for too short slug', () => {
      expect(ClubSlug.isValid('ab')).toBe(false)
    })

    it('should return false for too long slug', () => {
      expect(ClubSlug.isValid('a'.repeat(51))).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for equal slugs', () => {
      const slug1 = ClubSlug.create('golfplatz-siek')
      const slug2 = ClubSlug.create('golfplatz-siek')
      expect(slug1.equals(slug2)).toBe(true)
    })

    it('should return false for different slugs', () => {
      const slug1 = ClubSlug.create('golfplatz-siek')
      const slug2 = ClubSlug.create('golf-club-berlin')
      expect(slug1.equals(slug2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string value', () => {
      const slug = ClubSlug.create('golfplatz-siek')
      expect(slug.toString()).toBe('golfplatz-siek')
    })
  })
})
