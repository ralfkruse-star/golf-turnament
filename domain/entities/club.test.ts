import { describe, it, expect, beforeEach } from 'vitest'
import { Club, ClubTier } from './club'

describe('Club', () => {
  let validParams: any

  beforeEach(() => {
    validParams = {
      name: 'Golfplatz Siek',
      slug: 'golfplatz-siek',
      email: 'info@golfplatz-siek.de',
      tier: 'FREE' as ClubTier,
    }
  })

  describe('create', () => {
    it('should create a valid club', () => {
      const club = Club.create(validParams)

      expect(club.getName()).toBe('Golfplatz Siek')
      expect(club.getSlug()).toBe('golfplatz-siek')
      expect(club.getEmail()).toBe('info@golfplatz-siek.de')
      expect(club.getTier()).toBe('FREE')
      expect(club.isActive()).toBe(true)
      expect(club.isSuspended()).toBe(false)
    })

    it('should default to FREE tier if not specified', () => {
      const { tier, ...paramsWithoutTier } = validParams
      const club = Club.create(paramsWithoutTier)
      expect(club.getTier()).toBe('FREE')
    })

    it('should throw error if name is empty', () => {
      const invalidParams = { ...validParams, name: '' }
      expect(() => Club.create(invalidParams)).toThrow('Club name is required')
    })

    it('should throw error if slug is empty', () => {
      const invalidParams = { ...validParams, slug: '' }
      expect(() => Club.create(invalidParams)).toThrow('Club slug is required')
    })

    it('should throw error if slug contains invalid characters', () => {
      const invalidParams = { ...validParams, slug: 'invalid slug!' }
      expect(() => Club.create(invalidParams)).toThrow('Invalid slug format')
    })

    it('should throw error if slug is too short', () => {
      const invalidParams = { ...validParams, slug: 'ab' }
      expect(() => Club.create(invalidParams)).toThrow('Slug must be between 3 and 50 characters')
    })

    it('should throw error if slug is too long', () => {
      const invalidParams = { ...validParams, slug: 'a'.repeat(51) }
      expect(() => Club.create(invalidParams)).toThrow('Slug must be between 3 and 50 characters')
    })

    it('should throw error if email is invalid', () => {
      const invalidParams = { ...validParams, email: 'not-an-email' }
      expect(() => Club.create(invalidParams)).toThrow('Invalid email address')
    })

    it('should validate custom domain format if provided', () => {
      const invalidParams = { ...validParams, customDomain: 'not a domain!' }
      expect(() => Club.create(invalidParams)).toThrow('Invalid custom domain format')
    })

    it('should accept valid custom domain', () => {
      const params = { ...validParams, customDomain: 'golf.example.com' }
      const club = Club.create(params)
      expect(club.getCustomDomain()).toBe('golf.example.com')
    })

    it('should accept optional description', () => {
      const params = { ...validParams, description: 'Best golf club in town' }
      const club = Club.create(params)
      expect(club.getDescription()).toBe('Best golf club in town')
    })
  })

  describe('tier management', () => {
    it('should upgrade tier', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      club.upgradeTier('PREMIUM')
      expect(club.getTier()).toBe('PREMIUM')
    })

    it('should throw error when downgrading tier', () => {
      const club = Club.create({ ...validParams, tier: 'PREMIUM' })
      expect(() => club.upgradeTier('FREE')).toThrow('Cannot downgrade tier')
    })

    it('should throw error when upgrading to same tier', () => {
      const club = Club.create({ ...validParams, tier: 'BASIC' })
      expect(() => club.upgradeTier('BASIC')).toThrow('Club is already on BASIC tier')
    })
  })

  describe('feature limits', () => {
    it('should return correct limits for FREE tier', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      const limits = club.getFeatureLimits()

      expect(limits.maxTournaments).toBe(2)
      expect(limits.maxPlayers).toBe(50)
      expect(limits.customDomain).toBe(false)
      expect(limits.whiteLabel).toBe(false)
    })

    it('should return correct limits for BASIC tier', () => {
      const club = Club.create({ ...validParams, tier: 'BASIC' })
      const limits = club.getFeatureLimits()

      expect(limits.maxTournaments).toBe(10)
      expect(limits.maxPlayers).toBe(200)
      expect(limits.customDomain).toBe(true)
      expect(limits.whiteLabel).toBe(false)
    })

    it('should return correct limits for PREMIUM tier', () => {
      const club = Club.create({ ...validParams, tier: 'PREMIUM' })
      const limits = club.getFeatureLimits()

      expect(limits.maxTournaments).toBe(50)
      expect(limits.maxPlayers).toBe(1000)
      expect(limits.customDomain).toBe(true)
      expect(limits.whiteLabel).toBe(true)
    })

    it('should return unlimited for ENTERPRISE tier', () => {
      const club = Club.create({ ...validParams, tier: 'ENTERPRISE' })
      const limits = club.getFeatureLimits()

      expect(limits.maxTournaments).toBeNull()
      expect(limits.maxPlayers).toBeNull()
      expect(limits.customDomain).toBe(true)
      expect(limits.whiteLabel).toBe(true)
    })
  })

  describe('limit validation', () => {
    it('should allow creating tournament within limits', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      const result = club.canCreateTournament(1)
      expect(result.allowed).toBe(true)
    })

    it('should prevent creating tournament beyond limits', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      const result = club.canCreateTournament(2)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('limit of 2 tournaments')
    })

    it('should allow unlimited tournaments for ENTERPRISE', () => {
      const club = Club.create({ ...validParams, tier: 'ENTERPRISE' })
      const result = club.canCreateTournament(1000)
      expect(result.allowed).toBe(true)
    })

    it('should allow adding player within limits', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      const result = club.canAddPlayer(49)
      expect(result.allowed).toBe(true)
    })

    it('should prevent adding player beyond limits', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      const result = club.canAddPlayer(50)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('limit of 50 players')
    })
  })

  describe('branding', () => {
    it('should update branding colors', () => {
      const club = Club.create(validParams)
      club.updateBranding({
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      })

      expect(club.getBranding().primaryColor).toBe('#ff0000')
      expect(club.getBranding().secondaryColor).toBe('#00ff00')
    })

    it('should validate color format', () => {
      const club = Club.create(validParams)
      expect(() =>
        club.updateBranding({
          primaryColor: 'not-a-color',
        })
      ).toThrow('Invalid color format')
    })

    it('should allow updating logo', () => {
      const club = Club.create(validParams)
      club.updateBranding({
        logo: 'https://example.com/logo.png',
      })

      expect(club.getBranding().logo).toBe('https://example.com/logo.png')
    })

    it('should validate logo URL format', () => {
      const club = Club.create(validParams)
      expect(() =>
        club.updateBranding({
          logo: 'not-a-url',
        })
      ).toThrow('Invalid logo URL')
    })

    it('should use default colors if not set', () => {
      const club = Club.create(validParams)
      const branding = club.getBranding()

      expect(branding.primaryColor).toBe('#16a34a')
      expect(branding.secondaryColor).toBeNull()
    })
  })

  describe('custom domain', () => {
    it('should set custom domain for BASIC tier and above', () => {
      const club = Club.create({ ...validParams, tier: 'BASIC' })
      club.setCustomDomain('golf.example.com')

      expect(club.getCustomDomain()).toBe('golf.example.com')
    })

    it('should throw error when setting custom domain on FREE tier', () => {
      const club = Club.create({ ...validParams, tier: 'FREE' })
      expect(() => club.setCustomDomain('golf.example.com')).toThrow(
        'Custom domains require BASIC tier or higher'
      )
    })

    it('should validate domain format', () => {
      const club = Club.create({ ...validParams, tier: 'BASIC' })
      expect(() => club.setCustomDomain('invalid domain')).toThrow('Invalid custom domain format')
    })

    it('should remove custom domain', () => {
      const club = Club.create({
        ...validParams,
        tier: 'BASIC',
        customDomain: 'golf.example.com',
      })
      club.removeCustomDomain()

      expect(club.getCustomDomain()).toBeNull()
    })
  })

  describe('suspension', () => {
    it('should suspend club', () => {
      const club = Club.create(validParams)
      club.suspend('Payment failed')

      expect(club.isSuspended()).toBe(true)
    })

    it('should reactivate suspended club', () => {
      const club = Club.create(validParams)
      club.suspend('Payment failed')
      club.reactivate()

      expect(club.isSuspended()).toBe(false)
      expect(club.isActive()).toBe(true)
    })

    it('should throw error when suspending already suspended club', () => {
      const club = Club.create(validParams)
      club.suspend('Payment failed')

      expect(() => club.suspend('Duplicate')).toThrow('Club is already suspended')
    })

    it('should throw error when reactivating active club', () => {
      const club = Club.create(validParams)
      expect(() => club.reactivate()).toThrow('Club is not suspended')
    })
  })

  describe('subscription', () => {
    it('should set subscription ID', () => {
      const club = Club.create(validParams)
      club.setSubscription('sub_123456789')

      expect(club.getSubscriptionId()).toBe('sub_123456789')
    })

    it('should set trial end date', () => {
      const club = Club.create(validParams)
      const trialEnd = new Date('2025-12-31')
      club.setTrialEndDate(trialEnd)

      expect(club.getTrialEndsAt()).toEqual(trialEnd)
    })

    it('should check if trial is active', () => {
      const club = Club.create(validParams)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      club.setTrialEndDate(futureDate)

      expect(club.isTrialActive()).toBe(true)
    })

    it('should check if trial is expired', () => {
      const club = Club.create(validParams)
      const pastDate = new Date('2020-01-01')
      club.setTrialEndDate(pastDate)

      expect(club.isTrialActive()).toBe(false)
    })

    it('should set active until date', () => {
      const club = Club.create(validParams)
      const activeUntil = new Date('2025-12-31')
      club.setActiveUntil(activeUntil)

      expect(club.getActiveUntil()).toEqual(activeUntil)
    })

    it('should check if subscription is active', () => {
      const club = Club.create(validParams)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      club.setActiveUntil(futureDate)

      expect(club.isSubscriptionActive()).toBe(true)
    })

    it('should check if subscription is expired', () => {
      const club = Club.create(validParams)
      const pastDate = new Date('2020-01-01')
      club.setActiveUntil(pastDate)

      expect(club.isSubscriptionActive()).toBe(false)
    })
  })
})
