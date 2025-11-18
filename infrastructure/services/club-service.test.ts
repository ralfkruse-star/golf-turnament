import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ClubService } from './club-service'
import { ClubTier } from '@/domain/entities/club'

// Mock Prisma client
const mockPrisma = {
  club: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  clubMember: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  tournament: {
    count: vi.fn(),
  },
  player: {
    count: vi.fn(),
  },
}

describe('ClubService', () => {
  let clubService: ClubService

  beforeEach(() => {
    vi.clearAllMocks()
    clubService = new ClubService(mockPrisma as any)
  })

  describe('createClub', () => {
    it('should create a new club', async () => {
      const clubData = {
        name: 'Golfplatz Siek',
        slug: 'golfplatz-siek',
        email: 'info@golfplatz-siek.de',
        tier: 'FREE' as ClubTier,
      }

      mockPrisma.club.findUnique.mockResolvedValue(null)
      mockPrisma.club.create.mockResolvedValue({
        id: 'club_123',
        ...clubData,
        description: null,
        logo: null,
        website: null,
        phone: null,
        address: null,
        city: null,
        postalCode: null,
        country: 'DE',
        primaryColor: '#16a34a',
        secondaryColor: null,
        customDomain: null,
        subscriptionId: null,
        trialEndsAt: null,
        activeUntil: null,
        maxTournaments: null,
        maxPlayers: null,
        features: {},
        settings: null,
        isActive: true,
        isSuspended: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await clubService.createClub(clubData)

      expect(result.id).toBe('club_123')
      expect(result.name).toBe('Golfplatz Siek')
      expect(mockPrisma.club.create).toHaveBeenCalledOnce()
    })

    it('should throw error if slug already exists', async () => {
      const clubData = {
        name: 'Golfplatz Siek',
        slug: 'golfplatz-siek',
        email: 'info@golfplatz-siek.de',
      }

      mockPrisma.club.findUnique.mockResolvedValue({ id: 'existing_club' })

      await expect(clubService.createClub(clubData)).rejects.toThrow('already exists')
    })

    it('should set trial period for new clubs', async () => {
      const clubData = {
        name: 'Test Club',
        slug: 'test-club',
        email: 'test@club.com',
      }

      mockPrisma.club.findUnique.mockResolvedValue(null)
      mockPrisma.club.create.mockResolvedValue({
        id: 'club_123',
        ...clubData,
        tier: 'FREE',
        trialEndsAt: new Date(),
      } as any)

      await clubService.createClub(clubData)

      expect(mockPrisma.club.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trialEndsAt: expect.any(Date),
          }),
        })
      )
    })
  })

  describe('getClubBySlug', () => {
    it('should return club by slug', async () => {
      const mockClub = {
        id: 'club_123',
        name: 'Golfplatz Siek',
        slug: 'golfplatz-siek',
        email: 'info@golfplatz-siek.de',
      }

      mockPrisma.club.findUnique.mockResolvedValue(mockClub)

      const result = await clubService.getClubBySlug('golfplatz-siek')

      expect(result).toEqual(mockClub)
      expect(mockPrisma.club.findUnique).toHaveBeenCalledWith({
        where: { slug: 'golfplatz-siek' },
      })
    })

    it('should return null if club not found', async () => {
      mockPrisma.club.findUnique.mockResolvedValue(null)

      const result = await clubService.getClubBySlug('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getClubByDomain', () => {
    it('should return club by custom domain', async () => {
      const mockClub = {
        id: 'club_123',
        customDomain: 'golf.example.com',
      }

      mockPrisma.club.findFirst.mockResolvedValue(mockClub)

      const result = await clubService.getClubByDomain('golf.example.com')

      expect(result).toEqual(mockClub)
      expect(mockPrisma.club.findFirst).toHaveBeenCalledWith({
        where: { customDomain: 'golf.example.com' },
      })
    })

    it('should return null if no club with domain', async () => {
      mockPrisma.club.findFirst.mockResolvedValue(null)

      const result = await clubService.getClubByDomain('unknown.com')

      expect(result).toBeNull()
    })
  })

  describe('updateClubBranding', () => {
    it('should update club branding', async () => {
      const branding = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        logo: 'https://example.com/logo.png',
      }

      mockPrisma.club.update.mockResolvedValue({
        id: 'club_123',
        ...branding,
      } as any)

      const result = await clubService.updateClubBranding('club_123', branding)

      expect(result.primaryColor).toBe('#ff0000')
      expect(mockPrisma.club.update).toHaveBeenCalledWith({
        where: { id: 'club_123' },
        data: branding,
      })
    })
  })

  describe('getClubFeatures', () => {
    it('should return features for FREE tier', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'FREE',
        features: {},
      })

      const features = await clubService.getClubFeatures('club_123')

      expect(features.maxTournaments).toBe(2)
      expect(features.maxPlayers).toBe(50)
      expect(features.customDomain).toBe(false)
      expect(features.whiteLabel).toBe(false)
    })

    it('should return features for PREMIUM tier', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'PREMIUM',
        features: {},
      })

      const features = await clubService.getClubFeatures('club_123')

      expect(features.maxTournaments).toBe(50)
      expect(features.maxPlayers).toBe(1000)
      expect(features.customDomain).toBe(true)
      expect(features.whiteLabel).toBe(true)
    })

    it('should throw error if club not found', async () => {
      mockPrisma.club.findUnique.mockResolvedValue(null)

      await expect(clubService.getClubFeatures('invalid')).rejects.toThrow('not found')
    })
  })

  describe('validateClubLimits', () => {
    it('should validate tournament limits for FREE tier', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'FREE',
      })
      mockPrisma.tournament.count.mockResolvedValue(1)

      const result = await clubService.validateClubLimits('club_123')

      expect(result.tournaments.withinLimit).toBe(true)
      expect(result.tournaments.current).toBe(1)
      expect(result.tournaments.limit).toBe(2)
    })

    it('should detect tournament limit exceeded', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'FREE',
      })
      mockPrisma.tournament.count.mockResolvedValue(2)

      const result = await clubService.validateClubLimits('club_123')

      expect(result.tournaments.withinLimit).toBe(false)
    })

    it('should validate player limits for FREE tier', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'FREE',
      })
      mockPrisma.tournament.count.mockResolvedValue(0)
      mockPrisma.player.count.mockResolvedValue(30)

      const result = await clubService.validateClubLimits('club_123')

      expect(result.players.withinLimit).toBe(true)
      expect(result.players.current).toBe(30)
      expect(result.players.limit).toBe(50)
    })

    it('should return unlimited for ENTERPRISE tier', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'ENTERPRISE',
      })
      mockPrisma.tournament.count.mockResolvedValue(100)
      mockPrisma.player.count.mockResolvedValue(500)

      const result = await clubService.validateClubLimits('club_123')

      expect(result.tournaments.withinLimit).toBe(true)
      expect(result.tournaments.limit).toBeNull()
      expect(result.players.withinLimit).toBe(true)
      expect(result.players.limit).toBeNull()
    })
  })

  describe('suspendClub', () => {
    it('should suspend a club', async () => {
      mockPrisma.club.update.mockResolvedValue({
        id: 'club_123',
        isSuspended: true,
        isActive: false,
      } as any)

      const result = await clubService.suspendClub('club_123', 'Payment failed')

      expect(result.isSuspended).toBe(true)
      expect(mockPrisma.club.update).toHaveBeenCalledWith({
        where: { id: 'club_123' },
        data: {
          isSuspended: true,
          isActive: false,
        },
      })
    })
  })

  describe('reactivateClub', () => {
    it('should reactivate a suspended club', async () => {
      mockPrisma.club.update.mockResolvedValue({
        id: 'club_123',
        isSuspended: false,
        isActive: true,
      } as any)

      const result = await clubService.reactivateClub('club_123')

      expect(result.isSuspended).toBe(false)
      expect(result.isActive).toBe(true)
    })
  })

  describe('syncStripeSubscription', () => {
    it('should update club with subscription data', async () => {
      const subscriptionData = {
        subscriptionId: 'sub_123',
        tier: 'PREMIUM' as ClubTier,
        activeUntil: new Date('2025-12-31'),
      }

      mockPrisma.club.update.mockResolvedValue({
        id: 'club_123',
        ...subscriptionData,
      } as any)

      const result = await clubService.syncStripeSubscription('club_123', subscriptionData)

      expect(result.subscriptionId).toBe('sub_123')
      expect(result.tier).toBe('PREMIUM')
      expect(mockPrisma.club.update).toHaveBeenCalledWith({
        where: { id: 'club_123' },
        data: subscriptionData,
      })
    })

    it('should handle subscription cancellation', async () => {
      const subscriptionData = {
        subscriptionId: null,
        activeUntil: null,
      }

      mockPrisma.club.update.mockResolvedValue({
        id: 'club_123',
        subscriptionId: null,
        activeUntil: null,
      } as any)

      const result = await clubService.syncStripeSubscription('club_123', subscriptionData)

      expect(result.subscriptionId).toBeNull()
    })
  })

  describe('addClubMember', () => {
    it('should add member to club', async () => {
      mockPrisma.clubMember.create.mockResolvedValue({
        id: 'member_123',
        clubId: 'club_123',
        userId: 'user_123',
        role: 'MEMBER',
      } as any)

      const result = await clubService.addClubMember('club_123', 'user_123', 'MEMBER')

      expect(result.userId).toBe('user_123')
      expect(result.role).toBe('MEMBER')
    })
  })

  describe('removeClubMember', () => {
    it('should remove member from club', async () => {
      mockPrisma.clubMember.delete.mockResolvedValue({} as any)

      await clubService.removeClubMember('club_123', 'user_123')

      expect(mockPrisma.clubMember.delete).toHaveBeenCalledWith({
        where: {
          clubId_userId: {
            clubId: 'club_123',
            userId: 'user_123',
          },
        },
      })
    })
  })

  describe('getClubMembers', () => {
    it('should return all club members', async () => {
      const mockMembers = [
        { id: 'member_1', userId: 'user_1', role: 'OWNER' },
        { id: 'member_2', userId: 'user_2', role: 'ADMIN' },
      ]

      mockPrisma.clubMember.findMany.mockResolvedValue(mockMembers)

      const result = await clubService.getClubMembers('club_123')

      expect(result).toEqual(mockMembers)
      expect(mockPrisma.clubMember.findMany).toHaveBeenCalledWith({
        where: { clubId: 'club_123' },
        include: { user: true },
      })
    })
  })

  describe('getAllClubs', () => {
    it('should return paginated clubs', async () => {
      const mockClubs = [
        { id: 'club_1', name: 'Club 1' },
        { id: 'club_2', name: 'Club 2' },
      ]

      mockPrisma.club.findMany.mockResolvedValue(mockClubs)
      mockPrisma.club.count.mockResolvedValue(2)

      const result = await clubService.getAllClubs({ page: 1, limit: 10 })

      expect(result.clubs).toEqual(mockClubs)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('should filter by active status', async () => {
      mockPrisma.club.findMany.mockResolvedValue([])
      mockPrisma.club.count.mockResolvedValue(0)

      await clubService.getAllClubs({ page: 1, limit: 10, isActive: true })

      expect(mockPrisma.club.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })
  })

  describe('getClubStats', () => {
    it('should return club statistics', async () => {
      mockPrisma.club.findUnique.mockResolvedValue({
        id: 'club_123',
        tier: 'BASIC',
      })
      mockPrisma.tournament.count.mockResolvedValue(5)
      mockPrisma.player.count.mockResolvedValue(120)
      mockPrisma.clubMember.count.mockResolvedValue(3)

      const stats = await clubService.getClubStats('club_123')

      expect(stats.tournaments).toBe(5)
      expect(stats.players).toBe(120)
      expect(stats.members).toBe(3)
      expect(stats.tier).toBe('BASIC')
    })
  })
})
