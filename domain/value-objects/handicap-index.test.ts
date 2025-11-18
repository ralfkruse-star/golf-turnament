import { describe, it, expect } from 'vitest'
import { HandicapIndex } from './handicap-index'

describe('HandicapIndex', () => {
  describe('create', () => {
    it('should create a valid handicap index', () => {
      const hcp = HandicapIndex.create(18.5)
      expect(hcp.getValue()).toBe(18.5)
    })

    it('should round to 1 decimal place', () => {
      const hcp = HandicapIndex.create(18.47)
      expect(hcp.getValue()).toBe(18.5)
    })

    it('should accept minimum value -10.0', () => {
      const hcp = HandicapIndex.create(-10.0)
      expect(hcp.getValue()).toBe(-10.0)
    })

    it('should accept maximum value 54.0', () => {
      const hcp = HandicapIndex.create(54.0)
      expect(hcp.getValue()).toBe(54.0)
    })

    it('should throw error for value below -10.0', () => {
      expect(() => HandicapIndex.create(-10.1)).toThrow(
        'Invalid handicap index'
      )
    })

    it('should throw error for value above 54.0', () => {
      expect(() => HandicapIndex.create(54.1)).toThrow(
        'Invalid handicap index'
      )
    })

    it('should throw error for NaN', () => {
      expect(() => HandicapIndex.create(NaN)).toThrow('Invalid handicap index')
    })
  })

  describe('calculatePlayingHandicap', () => {
    it('should calculate playing handicap correctly', () => {
      const hcp = HandicapIndex.create(18.0)
      // Example: Slope 130, Rating 72.5, Par 72
      // (18.0 × 130 / 113) + (72.5 - 72) = 20.7 + 0.5 = 21.2 → rounds to 21
      const playing = hcp.calculatePlayingHandicap(130, 72.5, 72)
      expect(playing).toBe(21)
    })

    it('should handle plus handicaps', () => {
      const hcp = HandicapIndex.create(-2.0)
      const playing = hcp.calculatePlayingHandicap(113, 72.0, 72)
      expect(playing).toBe(-2)
    })
  })

  describe('equals', () => {
    it('should return true for equal handicaps', () => {
      const hcp1 = HandicapIndex.create(18.5)
      const hcp2 = HandicapIndex.create(18.5)
      expect(hcp1.equals(hcp2)).toBe(true)
    })

    it('should return false for different handicaps', () => {
      const hcp1 = HandicapIndex.create(18.5)
      const hcp2 = HandicapIndex.create(20.0)
      expect(hcp1.equals(hcp2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should format with 1 decimal place', () => {
      const hcp = HandicapIndex.create(18.5)
      expect(hcp.toString()).toBe('18.5')
    })

    it('should include trailing zero', () => {
      const hcp = HandicapIndex.create(18.0)
      expect(hcp.toString()).toBe('18.0')
    })
  })
})
