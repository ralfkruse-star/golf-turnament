import { describe, it, expect, beforeEach } from 'vitest'
import { Scorecard, HoleScore } from './scorecard'

describe('Scorecard', () => {
  const mockCourseInfo = {
    holes: Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4][i],
      handicap: [10, 4, 16, 2, 8, 12, 18, 6, 14, 11, 17, 7, 1, 9, 15, 13, 3, 5][i],
    })),
  }

  describe('create', () => {
    it('should create a new scorecard', () => {
      const scorecard = Scorecard.create('tournament-1', 'player-1', 18)

      expect(scorecard.getId()).toBeDefined()
      expect(scorecard.getStatus()).toBe('NOT_STARTED')
      expect(scorecard.getScores()).toEqual([])
    })

    it('should throw error for invalid handicap', () => {
      expect(() => Scorecard.create('t1', 'p1', 60)).toThrow('Invalid handicap')
      expect(() => Scorecard.create('t1', 'p1', -15)).toThrow('Invalid handicap')
    })
  })

  describe('start', () => {
    it('should start a new scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)
      scorecard.start()
      expect(scorecard.getStatus()).toBe('IN_PROGRESS')
    })

    it('should not allow starting already started scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)
      scorecard.start()
      expect(() => scorecard.start()).toThrow('already been started')
    })
  })

  describe('recordHoleScore', () => {
    it('should record a hole score', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      const holeScore: HoleScore = {
        hole: 1,
        par: 4,
        gross: 5,
        putts: 2,
        fairwayHit: true,
        greenInRegulation: false,
      }

      scorecard.recordHoleScore(holeScore)

      const scores = scorecard.getScores()
      expect(scores).toHaveLength(1)
      expect(scores[0].hole).toBe(1)
      expect(scores[0].gross).toBe(5)
    })

    it('should auto-start scorecard when recording first score', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)
      expect(scorecard.getStatus()).toBe('NOT_STARTED')

      scorecard.recordHoleScore({ hole: 1, par: 4, gross: 5 })

      expect(scorecard.getStatus()).toBe('IN_PROGRESS')
    })

    it('should update existing hole score', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      scorecard.recordHoleScore({ hole: 1, par: 4, gross: 5 })
      scorecard.recordHoleScore({ hole: 1, par: 4, gross: 4 })

      const scores = scorecard.getScores()
      expect(scores).toHaveLength(1)
      expect(scores[0].gross).toBe(4)
    })

    it('should keep scores sorted by hole number', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      scorecard.recordHoleScore({ hole: 5, par: 4, gross: 5 })
      scorecard.recordHoleScore({ hole: 1, par: 4, gross: 4 })
      scorecard.recordHoleScore({ hole: 3, par: 3, gross: 3 })

      const scores = scorecard.getScores()
      expect(scores[0].hole).toBe(1)
      expect(scores[1].hole).toBe(3)
      expect(scores[2].hole).toBe(5)
    })

    it('should throw error for invalid hole number', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      expect(() =>
        scorecard.recordHoleScore({ hole: 0, par: 4, gross: 5 })
      ).toThrow('Hole number must be between 1 and 18')

      expect(() =>
        scorecard.recordHoleScore({ hole: 19, par: 4, gross: 5 })
      ).toThrow('Hole number must be between 1 and 18')
    })

    it('should throw error for invalid gross score', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      expect(() =>
        scorecard.recordHoleScore({ hole: 1, par: 4, gross: 0 })
      ).toThrow('Gross score must be between 1 and 15')

      expect(() =>
        scorecard.recordHoleScore({ hole: 1, par: 4, gross: 20 })
      ).toThrow('Gross score must be between 1 and 15')
    })

    it('should throw error if scorecard is already submitted', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      // Record all 18 holes
      for (let i = 1; i <= 18; i++) {
        scorecard.recordHoleScore({ hole: i, par: 4, gross: 4 })
      }

      scorecard.submit('John Doe', mockCourseInfo)

      expect(() =>
        scorecard.recordHoleScore({ hole: 1, par: 4, gross: 5 })
      ).toThrow('Cannot record scores on submitted')
    })
  })

  describe('calculateTotals', () => {
    it('should calculate total gross score', () => {
      const scorecard = Scorecard.create('t1', 'p1', 0)

      // Record perfect par round (72)
      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      scorecard.calculateTotals(mockCourseInfo)

      expect(scorecard.getTotalGross()).toBe(72)
    })

    it('should calculate Stableford points correctly for 18 handicap', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      // Player shoots gross par (72) with handicap 18 = 36 points (par in Stableford)
      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      scorecard.calculateTotals(mockCourseInfo)

      // With 18 handicap, getting 1 stroke on each hole
      // Gross par = Net birdie = 3 points per hole × 18 holes = 54 points
      expect(scorecard.getTotalPoints()).toBe(54)
    })

    it('should calculate Stableford points for scratch golfer', () => {
      const scorecard = Scorecard.create('t1', 'p1', 0)

      // Scratch golfer shoots par
      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      scorecard.calculateTotals(mockCourseInfo)

      // Par for par = 2 points per hole × 18 holes = 36 points
      expect(scorecard.getTotalPoints()).toBe(36)
    })

    it('should calculate zero points for double bogey or worse', () => {
      const scorecard = Scorecard.create('t1', 'p1', 0)

      // Record double bogey on hole 1 (par 4)
      scorecard.recordHoleScore({ hole: 1, par: 4, gross: 6 })

      scorecard.calculateTotals(mockCourseInfo)

      const hole1 = scorecard.getHoleScore(1)
      // Double bogey = 0 points
      // We can't directly test per-hole points, but total should reflect it
      expect(scorecard.getTotalPoints()).toBe(0)
    })
  })

  describe('submit', () => {
    it('should submit complete scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      // Record all 18 holes
      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      scorecard.submit('John Doe', mockCourseInfo)

      expect(scorecard.getStatus()).toBe('SUBMITTED')
      expect(scorecard.getTotalGross()).toBeDefined()
      expect(scorecard.getTotalPoints()).toBeDefined()
    })

    it('should not submit incomplete scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      // Only record 9 holes
      for (let i = 1; i <= 9; i++) {
        scorecard.recordHoleScore({ hole: i, par: 4, gross: 4 })
      }

      expect(() => scorecard.submit('John Doe', mockCourseInfo)).toThrow(
        'All 18 holes must be scored'
      )
    })

    it('should require marker name', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      expect(() => scorecard.submit('', mockCourseInfo)).toThrow(
        'Marker name is required'
      )
    })

    it('should not allow submitting from wrong status', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      expect(() => scorecard.submit('John Doe', mockCourseInfo)).toThrow(
        'Can only submit scorecards that are in progress'
      )
    })
  })

  describe('verify', () => {
    it('should verify submitted scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      scorecard.submit('John Doe', mockCourseInfo)
      scorecard.verify()

      expect(scorecard.getStatus()).toBe('VERIFIED')
    })

    it('should not verify non-submitted scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      expect(() => scorecard.verify()).toThrow('Can only verify submitted scorecards')
    })
  })

  describe('disqualify', () => {
    it('should disqualify in-progress scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)
      scorecard.start()
      scorecard.disqualify()

      expect(scorecard.getStatus()).toBe('DISQUALIFIED')
    })

    it('should disqualify submitted scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      mockCourseInfo.holes.forEach((hole) => {
        scorecard.recordHoleScore({ hole: hole.hole, par: hole.par, gross: hole.par })
      })

      scorecard.submit('John Doe', mockCourseInfo)
      scorecard.disqualify()

      expect(scorecard.getStatus()).toBe('DISQUALIFIED')
    })
  })

  describe('isComplete', () => {
    it('should return false for incomplete scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      for (let i = 1; i <= 9; i++) {
        scorecard.recordHoleScore({ hole: i, par: 4, gross: 4 })
      }

      expect(scorecard.isComplete()).toBe(false)
    })

    it('should return true for complete scorecard', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      for (let i = 1; i <= 18; i++) {
        scorecard.recordHoleScore({ hole: i, par: 4, gross: 4 })
      }

      expect(scorecard.isComplete()).toBe(true)
    })
  })

  describe('getHoleScore', () => {
    it('should return score for existing hole', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)
      scorecard.recordHoleScore({ hole: 5, par: 4, gross: 6 })

      const score = scorecard.getHoleScore(5)

      expect(score).toBeDefined()
      expect(score?.gross).toBe(6)
    })

    it('should return undefined for non-existing hole', () => {
      const scorecard = Scorecard.create('t1', 'p1', 18)

      const score = scorecard.getHoleScore(5)

      expect(score).toBeUndefined()
    })
  })
})
