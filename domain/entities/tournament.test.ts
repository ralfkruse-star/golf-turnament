import { describe, it, expect, beforeEach } from 'vitest'
import { Tournament } from './tournament'
import { TournamentFormat } from '../value-objects/tournament-format'

describe('Tournament', () => {
  let validParams: any

  beforeEach(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const twoWeeks = new Date()
    twoWeeks.setDate(twoWeeks.getDate() + 14)

    validParams = {
      name: 'Club Championship 2025',
      description: 'Annual club championship',
      format: TournamentFormat.STABLEFORD,
      category: 'CLUB_CHAMPIONSHIP' as const,
      registrationStart: tomorrow,
      registrationEnd: nextWeek,
      tournamentDate: twoWeeks,
      maxPlayers: 120,
      minPlayers: 4,
      entryFee: 35.0,
      requireHandicap: true,
      maxHandicap: 36.0,
      allowGuests: false,
    }
  })

  describe('create', () => {
    it('should create a valid tournament', () => {
      const tournament = Tournament.create(validParams)

      expect(tournament.getName()).toBe('Club Championship 2025')
      expect(tournament.getStatus()).toBe('DRAFT')
      expect(tournament.getFormat()).toBe(TournamentFormat.STABLEFORD)
    })

    it('should default status to DRAFT', () => {
      const tournament = Tournament.create(validParams)
      expect(tournament.getStatus()).toBe('DRAFT')
    })

    it('should throw error if tournament date is before registration end', () => {
      const invalidParams = {
        ...validParams,
        tournamentDate: new Date(),
      }

      expect(() => Tournament.create(invalidParams)).toThrow(
        'Tournament date must be after registration end date'
      )
    })

    it('should throw error if registration start is after registration end', () => {
      const invalidParams = {
        ...validParams,
        registrationStart: validParams.registrationEnd,
        registrationEnd: validParams.registrationStart,
      }

      expect(() => Tournament.create(invalidParams)).toThrow(
        'Registration start must be before registration end'
      )
    })

    it('should throw error if max players is less than min players', () => {
      const invalidParams = {
        ...validParams,
        minPlayers: 100,
        maxPlayers: 50,
      }

      expect(() => Tournament.create(invalidParams)).toThrow(
        'Maximum players must be greater than minimum players'
      )
    })

    it('should throw error if max handicap is invalid', () => {
      const invalidParams = {
        ...validParams,
        maxHandicap: 60,
      }

      expect(() => Tournament.create(invalidParams)).toThrow(
        'Maximum handicap must be between 0 and 54'
      )
    })
  })

  describe('state transitions', () => {
    it('should transition from DRAFT to OPEN_FOR_REGISTRATION', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      expect(tournament.getStatus()).toBe('OPEN_FOR_REGISTRATION')
    })

    it('should not allow opening if not in DRAFT status', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()

      expect(() => tournament.openForRegistration()).toThrow(
        'Can only open draft tournaments for registration'
      )
    })

    it('should close registration', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      tournament.closeRegistration()
      expect(tournament.getStatus()).toBe('REGISTRATION_CLOSED')
    })

    it('should start tournament after registration closed', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      tournament.closeRegistration()
      tournament.start()
      expect(tournament.getStatus()).toBe('IN_PROGRESS')
    })

    it('should complete tournament', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      tournament.closeRegistration()
      tournament.start()
      tournament.complete()
      expect(tournament.getStatus()).toBe('COMPLETED')
    })

    it('should allow cancellation from DRAFT', () => {
      const tournament = Tournament.create(validParams)
      tournament.cancel()
      expect(tournament.getStatus()).toBe('CANCELLED')
    })

    it('should allow cancellation from OPEN_FOR_REGISTRATION', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      tournament.cancel()
      expect(tournament.getStatus()).toBe('CANCELLED')
    })

    it('should not allow cancellation of completed tournament', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      tournament.closeRegistration()
      tournament.start()
      tournament.complete()

      expect(() => tournament.cancel()).toThrow(
        'Cannot cancel completed, cancelled, or archived tournaments'
      )
    })
  })

  describe('registration rules', () => {
    it('should check if tournament is full', () => {
      const tournament = Tournament.create({ ...validParams, maxPlayers: 10 })
      expect(tournament.isFull(9)).toBe(false)
      expect(tournament.isFull(10)).toBe(true)
      expect(tournament.isFull(11)).toBe(true)
    })

    it('should never be full if no max players set', () => {
      const tournament = Tournament.create({ ...validParams, maxPlayers: undefined })
      expect(tournament.isFull(1000)).toBe(false)
    })

    it('should reject player without handicap if required', () => {
      const tournament = Tournament.create({ ...validParams, requireHandicap: true })
      const result = tournament.canPlayerRegister(undefined)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Handicap is required')
    })

    it('should accept player without handicap if not required', () => {
      const tournament = Tournament.create({ ...validParams, requireHandicap: false })
      const result = tournament.canPlayerRegister(undefined)
      expect(result.allowed).toBe(true)
    })

    it('should reject player with handicap exceeding max', () => {
      const tournament = Tournament.create({ ...validParams, maxHandicap: 28.0 })
      const result = tournament.canPlayerRegister(30.0)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('exceeds maximum')
    })

    it('should accept player with valid handicap', () => {
      const tournament = Tournament.create({ ...validParams, maxHandicap: 36.0 })
      const result = tournament.canPlayerRegister(24.5)
      expect(result.allowed).toBe(true)
    })
  })

  describe('isAcceptingRegistrations', () => {
    it('should return true when status is OPEN_FOR_REGISTRATION', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      expect(tournament.isAcceptingRegistrations()).toBe(true)
    })

    it('should return false when status is DRAFT', () => {
      const tournament = Tournament.create(validParams)
      expect(tournament.isAcceptingRegistrations()).toBe(false)
    })

    it('should return false when status is COMPLETED', () => {
      const tournament = Tournament.create(validParams)
      tournament.openForRegistration()
      tournament.closeRegistration()
      tournament.start()
      tournament.complete()
      expect(tournament.isAcceptingRegistrations()).toBe(false)
    })
  })
})
