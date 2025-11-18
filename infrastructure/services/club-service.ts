/**
 * Club Service
 * Infrastructure service for club management
 */

import { PrismaClient, ClubTier as PrismaClubTier, ClubMemberRole } from '@prisma/client'
import { Club, ClubTier, FeatureLimits } from '@/domain/entities/club'

export interface CreateClubData {
  name: string
  slug: string
  email: string
  description?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  logo?: string
  website?: string
  primaryColor?: string
  secondaryColor?: string
  customDomain?: string
  tier?: ClubTier
}

export interface UpdateClubBrandingData {
  primaryColor?: string
  secondaryColor?: string
  logo?: string
}

export interface SyncSubscriptionData {
  subscriptionId?: string | null
  tier?: ClubTier
  activeUntil?: Date | null
  trialEndsAt?: Date | null
}

export interface ClubLimits {
  tournaments: {
    current: number
    limit: number | null
    withinLimit: boolean
  }
  players: {
    current: number
    limit: number | null
    withinLimit: boolean
  }
}

export interface PaginationOptions {
  page: number
  limit: number
  isActive?: boolean
  tier?: ClubTier
  search?: string
}

export interface PaginatedResult<T> {
  clubs: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const TIER_LIMITS: Record<ClubTier, FeatureLimits> = {
  FREE: {
    maxTournaments: 2,
    maxPlayers: 50,
    customDomain: false,
    whiteLabel: false,
    analytics: 'basic',
    support: 'email',
  },
  BASIC: {
    maxTournaments: 10,
    maxPlayers: 200,
    customDomain: true,
    whiteLabel: false,
    analytics: 'standard',
    support: 'email',
  },
  PREMIUM: {
    maxTournaments: 50,
    maxPlayers: 1000,
    customDomain: true,
    whiteLabel: true,
    analytics: 'advanced',
    support: 'priority',
  },
  ENTERPRISE: {
    maxTournaments: null,
    maxPlayers: null,
    customDomain: true,
    whiteLabel: true,
    analytics: 'advanced',
    support: 'dedicated',
  },
}

export class ClubService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new club
   */
  async createClub(data: CreateClubData) {
    // Check if slug already exists
    const existing = await this.prisma.club.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      throw new Error(`Club with slug "${data.slug}" already exists`)
    }

    // Set trial period (30 days for new clubs)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    return this.prisma.club.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        description: data.description || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        country: data.country || 'DE',
        logo: data.logo || null,
        website: data.website || null,
        primaryColor: data.primaryColor || '#16a34a',
        secondaryColor: data.secondaryColor || null,
        customDomain: data.customDomain || null,
        tier: (data.tier || 'FREE') as PrismaClubTier,
        trialEndsAt,
        features: {},
        isActive: true,
        isSuspended: false,
      },
    })
  }

  /**
   * Get club by ID
   */
  async getClubById(id: string) {
    return this.prisma.club.findUnique({
      where: { id },
    })
  }

  /**
   * Get club by slug
   */
  async getClubBySlug(slug: string) {
    return this.prisma.club.findUnique({
      where: { slug },
    })
  }

  /**
   * Get club by custom domain
   */
  async getClubByDomain(domain: string) {
    return this.prisma.club.findFirst({
      where: { customDomain: domain },
    })
  }

  /**
   * Update club
   */
  async updateClub(id: string, data: Partial<CreateClubData>) {
    return this.prisma.club.update({
      where: { id },
      data,
    })
  }

  /**
   * Update club branding
   */
  async updateClubBranding(clubId: string, branding: UpdateClubBrandingData) {
    return this.prisma.club.update({
      where: { id: clubId },
      data: branding,
    })
  }

  /**
   * Get club features based on tier
   */
  async getClubFeatures(clubId: string): Promise<FeatureLimits> {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { tier: true, features: true },
    })

    if (!club) {
      throw new Error(`Club not found: ${clubId}`)
    }

    return TIER_LIMITS[club.tier as ClubTier]
  }

  /**
   * Validate club limits
   */
  async validateClubLimits(clubId: string): Promise<ClubLimits> {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { tier: true },
    })

    if (!club) {
      throw new Error(`Club not found: ${clubId}`)
    }

    const limits = TIER_LIMITS[club.tier as ClubTier]

    // Count tournaments
    const tournamentCount = await this.prisma.tournament.count({
      where: { clubId },
    })

    // Count players (unique players across all tournaments)
    const playerCount = await this.prisma.player.count({
      where: {
        registrations: {
          some: {
            tournament: {
              clubId,
            },
          },
        },
      },
    })

    return {
      tournaments: {
        current: tournamentCount,
        limit: limits.maxTournaments,
        withinLimit: limits.maxTournaments === null || tournamentCount < limits.maxTournaments,
      },
      players: {
        current: playerCount,
        limit: limits.maxPlayers,
        withinLimit: limits.maxPlayers === null || playerCount < limits.maxPlayers,
      },
    }
  }

  /**
   * Suspend club
   */
  async suspendClub(clubId: string, reason: string) {
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        isSuspended: true,
        isActive: false,
      },
    })
  }

  /**
   * Reactivate club
   */
  async reactivateClub(clubId: string) {
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        isSuspended: false,
        isActive: true,
      },
    })
  }

  /**
   * Sync Stripe subscription
   */
  async syncStripeSubscription(clubId: string, data: SyncSubscriptionData) {
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        subscriptionId: data.subscriptionId,
        tier: data.tier as PrismaClubTier | undefined,
        activeUntil: data.activeUntil,
        trialEndsAt: data.trialEndsAt,
      },
    })
  }

  /**
   * Add club member
   */
  async addClubMember(clubId: string, userId: string, role: string = 'MEMBER') {
    return this.prisma.clubMember.create({
      data: {
        clubId,
        userId,
        role: role as ClubMemberRole,
      },
    })
  }

  /**
   * Remove club member
   */
  async removeClubMember(clubId: string, userId: string) {
    return this.prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })
  }

  /**
   * Get club members
   */
  async getClubMembers(clubId: string) {
    return this.prisma.clubMember.findMany({
      where: { clubId },
      include: {
        user: true,
      },
    })
  }

  /**
   * Update member role
   */
  async updateMemberRole(clubId: string, userId: string, role: string) {
    return this.prisma.clubMember.update({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      data: {
        role: role as ClubMemberRole,
      },
    })
  }

  /**
   * Get all clubs (with pagination)
   */
  async getAllClubs(options: PaginationOptions): Promise<PaginatedResult<any>> {
    const { page, limit, isActive, tier, search } = options

    const where: any = {}

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (tier) {
      where.tier = tier
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.club.count({ where }),
    ])

    return {
      clubs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get club statistics
   */
  async getClubStats(clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { tier: true },
    })

    if (!club) {
      throw new Error(`Club not found: ${clubId}`)
    }

    const [tournaments, players, members] = await Promise.all([
      this.prisma.tournament.count({ where: { clubId } }),
      this.prisma.player.count({
        where: {
          registrations: {
            some: {
              tournament: {
                clubId,
              },
            },
          },
        },
      }),
      this.prisma.clubMember.count({ where: { clubId } }),
    ])

    return {
      tournaments,
      players,
      members,
      tier: club.tier,
    }
  }

  /**
   * Delete club (soft delete - suspend instead)
   */
  async deleteClub(clubId: string) {
    return this.suspendClub(clubId, 'Deleted by admin')
  }

  /**
   * Check if user is club member
   */
  async isClubMember(clubId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    return !!member
  }

  /**
   * Get user's clubs
   */
  async getUserClubs(userId: string) {
    const memberships = await this.prisma.clubMember.findMany({
      where: { userId },
      include: {
        club: true,
      },
    })

    return memberships.map((m) => ({
      ...m.club,
      role: m.role,
    }))
  }

  /**
   * Check if user has role in club
   */
  async hasRole(clubId: string, userId: string, roles: string[]): Promise<boolean> {
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    })

    if (!member) return false

    return roles.includes(member.role)
  }
}
