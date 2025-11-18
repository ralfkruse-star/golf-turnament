/**
 * Feature Gating System
 * Controls access to features based on club tier
 */

import { ClubTier } from '@/domain/entities/club'
import { PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

export type Feature =
  | 'custom_domain'
  | 'white_label'
  | 'advanced_analytics'
  | 'priority_support'
  | 'email_notifications'
  | 'sms_notifications'
  | 'custom_branding'
  | 'api_access'
  | 'export_data'
  | 'multi_course'
  | 'scoring_app'
  | 'live_leaderboard'
  | 'photo_gallery'
  | 'sponsor_management'
  | 'flight_management'
  | 'handicap_calculation'

interface FeatureAccess {
  [key: string]: ClubTier[]
}

/**
 * Feature access matrix
 * Maps features to the tiers that have access
 */
const FEATURE_ACCESS: FeatureAccess = {
  custom_domain: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
  white_label: ['PREMIUM', 'ENTERPRISE'],
  advanced_analytics: ['PREMIUM', 'ENTERPRISE'],
  priority_support: ['PREMIUM', 'ENTERPRISE'],
  email_notifications: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
  sms_notifications: ['PREMIUM', 'ENTERPRISE'],
  custom_branding: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
  api_access: ['PREMIUM', 'ENTERPRISE'],
  export_data: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
  multi_course: ['PREMIUM', 'ENTERPRISE'],
  scoring_app: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
  live_leaderboard: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
  photo_gallery: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
  sponsor_management: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
  flight_management: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
  handicap_calculation: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
}

/**
 * Check if a club has access to a specific feature
 */
export async function hasFeature(clubId: string, feature: Feature): Promise<boolean> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { tier: true, isSuspended: true, isActive: true },
  })

  if (!club || club.isSuspended || !club.isActive) {
    return false
  }

  const allowedTiers = FEATURE_ACCESS[feature]
  if (!allowedTiers) {
    return false
  }

  return allowedTiers.includes(club.tier as ClubTier)
}

/**
 * Check if a club has access to multiple features
 */
export async function hasFeatures(
  clubId: string,
  features: Feature[]
): Promise<Record<Feature, boolean>> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { tier: true, isSuspended: true, isActive: true },
  })

  const result: Record<string, boolean> = {}

  if (!club || club.isSuspended || !club.isActive) {
    features.forEach((feature) => {
      result[feature] = false
    })
    return result as Record<Feature, boolean>
  }

  features.forEach((feature) => {
    const allowedTiers = FEATURE_ACCESS[feature]
    result[feature] = allowedTiers ? allowedTiers.includes(club.tier as ClubTier) : false
  })

  return result as Record<Feature, boolean>
}

/**
 * Get all features available for a club
 */
export async function getAvailableFeatures(clubId: string): Promise<Feature[]> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { tier: true, isSuspended: true, isActive: true },
  })

  if (!club || club.isSuspended || !club.isActive) {
    return []
  }

  const availableFeatures: Feature[] = []

  Object.entries(FEATURE_ACCESS).forEach(([feature, tiers]) => {
    if (tiers.includes(club.tier as ClubTier)) {
      availableFeatures.push(feature as Feature)
    }
  })

  return availableFeatures
}

/**
 * Check if club can create a tournament
 */
export async function canCreateTournament(clubId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { tier: true, isSuspended: true, isActive: true },
  })

  if (!club) {
    return { allowed: false, reason: 'Club not found' }
  }

  if (club.isSuspended) {
    return { allowed: false, reason: 'Club is suspended' }
  }

  if (!club.isActive) {
    return { allowed: false, reason: 'Club is not active' }
  }

  // Check tournament limits
  const limits: Record<ClubTier, number | null> = {
    FREE: 2,
    BASIC: 10,
    PREMIUM: 50,
    ENTERPRISE: null, // unlimited
  }

  const limit = limits[club.tier as ClubTier]

  if (limit === null) {
    return { allowed: true }
  }

  const tournamentCount = await prisma.tournament.count({
    where: { clubId },
  })

  if (tournamentCount >= limit) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${limit} tournaments for the ${club.tier} tier. Please upgrade to create more.`,
    }
  }

  return { allowed: true }
}

/**
 * Check if club can add a player
 */
export async function canAddPlayer(clubId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { tier: true, isSuspended: true, isActive: true },
  })

  if (!club) {
    return { allowed: false, reason: 'Club not found' }
  }

  if (club.isSuspended) {
    return { allowed: false, reason: 'Club is suspended' }
  }

  if (!club.isActive) {
    return { allowed: false, reason: 'Club is not active' }
  }

  // Check player limits
  const limits: Record<ClubTier, number | null> = {
    FREE: 50,
    BASIC: 200,
    PREMIUM: 1000,
    ENTERPRISE: null, // unlimited
  }

  const limit = limits[club.tier as ClubTier]

  if (limit === null) {
    return { allowed: true }
  }

  const playerCount = await prisma.player.count({
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

  if (playerCount >= limit) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${limit} players for the ${club.tier} tier. Please upgrade to add more.`,
    }
  }

  return { allowed: true }
}

/**
 * Get usage statistics for a club
 */
export async function getClubUsage(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { tier: true },
  })

  if (!club) {
    throw new Error('Club not found')
  }

  const tier = club.tier as ClubTier

  // Define limits
  const tournamentLimits: Record<ClubTier, number | null> = {
    FREE: 2,
    BASIC: 10,
    PREMIUM: 50,
    ENTERPRISE: null,
  }

  const playerLimits: Record<ClubTier, number | null> = {
    FREE: 50,
    BASIC: 200,
    PREMIUM: 1000,
    ENTERPRISE: null,
  }

  // Get current usage
  const [tournamentCount, playerCount] = await Promise.all([
    prisma.tournament.count({ where: { clubId } }),
    prisma.player.count({
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
  ])

  return {
    tournaments: {
      used: tournamentCount,
      limit: tournamentLimits[tier],
      percentage:
        tournamentLimits[tier] === null ? 0 : (tournamentCount / tournamentLimits[tier]!) * 100,
    },
    players: {
      used: playerCount,
      limit: playerLimits[tier],
      percentage: playerLimits[tier] === null ? 0 : (playerCount / playerLimits[tier]!) * 100,
    },
  }
}

/**
 * Check if club is within all limits
 */
export async function validateClubLimits(clubId: string): Promise<{
  valid: boolean
  violations: string[]
}> {
  const violations: string[] = []

  const tournamentCheck = await canCreateTournament(clubId)
  if (!tournamentCheck.allowed && tournamentCheck.reason) {
    violations.push(tournamentCheck.reason)
  }

  const playerCheck = await canAddPlayer(clubId)
  if (!playerCheck.allowed && playerCheck.reason) {
    violations.push(playerCheck.reason)
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

/**
 * Get tier comparison for upgrade prompts
 */
export function getTierComparison() {
  return {
    FREE: {
      name: 'Free',
      price: 0,
      tournaments: 2,
      players: 50,
      features: [
        'Basic tournament management',
        'Live leaderboard',
        'Scoring app',
        'Email notifications',
        'Flight management',
        'Handicap calculation',
      ],
    },
    BASIC: {
      name: 'Basic',
      price: 29,
      tournaments: 10,
      players: 200,
      features: [
        'Everything in Free',
        'Custom branding',
        'Photo gallery',
        'Sponsor management',
        'Export data',
        'Email support',
      ],
    },
    PREMIUM: {
      name: 'Premium',
      price: 99,
      tournaments: 50,
      players: 1000,
      features: [
        'Everything in Basic',
        'Custom domain',
        'White-label branding',
        'Advanced analytics',
        'SMS notifications',
        'API access',
        'Priority support',
        'Multi-course support',
      ],
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 'Custom',
      tournaments: 'Unlimited',
      players: 'Unlimited',
      features: [
        'Everything in Premium',
        'Unlimited tournaments',
        'Unlimited players',
        'Custom features',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations',
      ],
    },
  }
}
