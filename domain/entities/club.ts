/**
 * Club Aggregate Root
 * Core domain entity for multi-club/multi-tenant management
 */

export type ClubTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'

export interface ClubBranding {
  primaryColor: string
  secondaryColor: string | null
  logo: string | null
}

export interface FeatureLimits {
  maxTournaments: number | null // null = unlimited
  maxPlayers: number | null
  customDomain: boolean
  whiteLabel: boolean
  analytics: 'basic' | 'standard' | 'advanced'
  support: 'email' | 'priority' | 'dedicated'
}

export interface ClubProps {
  id: string
  name: string
  slug: string
  description: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string
  logo: string | null
  website: string | null
  primaryColor: string
  secondaryColor: string | null
  customDomain: string | null
  tier: ClubTier
  subscriptionId: string | null
  trialEndsAt: Date | null
  activeUntil: Date | null
  isActive: boolean
  isSuspended: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateClubParams {
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

const TIER_HIERARCHY: Record<ClubTier, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
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

export class Club {
  private constructor(private props: ClubProps) {}

  static create(params: CreateClubParams): Club {
    // Validate name
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Club name is required')
    }

    // Validate slug
    if (!params.slug || params.slug.trim().length === 0) {
      throw new Error('Club slug is required')
    }

    if (params.slug.length < 3 || params.slug.length > 50) {
      throw new Error('Slug must be between 3 and 50 characters')
    }

    if (!/^[a-z0-9-]+$/.test(params.slug)) {
      throw new Error('Invalid slug format. Use only lowercase letters, numbers, and hyphens')
    }

    // Validate email
    if (!params.email || !this.isValidEmail(params.email)) {
      throw new Error('Invalid email address')
    }

    // Validate custom domain if provided
    if (params.customDomain && !this.isValidDomain(params.customDomain)) {
      throw new Error('Invalid custom domain format')
    }

    const id = generateId()
    const now = new Date()

    return new Club({
      id,
      name: params.name,
      slug: params.slug,
      description: params.description || null,
      email: params.email,
      phone: params.phone || null,
      address: params.address || null,
      city: params.city || null,
      postalCode: params.postalCode || null,
      country: params.country || 'DE',
      logo: params.logo || null,
      website: params.website || null,
      primaryColor: params.primaryColor || '#16a34a',
      secondaryColor: params.secondaryColor || null,
      customDomain: params.customDomain || null,
      tier: params.tier || 'FREE',
      subscriptionId: null,
      trialEndsAt: null,
      activeUntil: null,
      isActive: true,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Getters
  getId(): string {
    return this.props.id
  }

  getName(): string {
    return this.props.name
  }

  getSlug(): string {
    return this.props.slug
  }

  getEmail(): string {
    return this.props.email
  }

  getDescription(): string | null {
    return this.props.description
  }

  getTier(): ClubTier {
    return this.props.tier
  }

  getCustomDomain(): string | null {
    return this.props.customDomain
  }

  getSubscriptionId(): string | null {
    return this.props.subscriptionId
  }

  getTrialEndsAt(): Date | null {
    return this.props.trialEndsAt
  }

  getActiveUntil(): Date | null {
    return this.props.activeUntil
  }

  isActive(): boolean {
    return this.props.isActive
  }

  isSuspended(): boolean {
    return this.props.isSuspended
  }

  getBranding(): ClubBranding {
    return {
      primaryColor: this.props.primaryColor,
      secondaryColor: this.props.secondaryColor,
      logo: this.props.logo,
    }
  }

  // Domain Logic

  /**
   * Upgrade club tier
   */
  upgradeTier(newTier: ClubTier): void {
    if (newTier === this.props.tier) {
      throw new Error(`Club is already on ${newTier} tier`)
    }

    if (TIER_HIERARCHY[newTier] < TIER_HIERARCHY[this.props.tier]) {
      throw new Error('Cannot downgrade tier. Please contact support.')
    }

    this.props.tier = newTier
    this.props.updatedAt = new Date()
  }

  /**
   * Get feature limits for current tier
   */
  getFeatureLimits(): FeatureLimits {
    return TIER_LIMITS[this.props.tier]
  }

  /**
   * Check if club can create a tournament
   */
  canCreateTournament(currentCount: number): { allowed: boolean; reason?: string } {
    const limits = this.getFeatureLimits()

    if (limits.maxTournaments === null) {
      return { allowed: true }
    }

    if (currentCount >= limits.maxTournaments) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${limits.maxTournaments} tournaments for the ${this.props.tier} tier. Please upgrade to create more.`,
      }
    }

    return { allowed: true }
  }

  /**
   * Check if club can add a player
   */
  canAddPlayer(currentCount: number): { allowed: boolean; reason?: string } {
    const limits = this.getFeatureLimits()

    if (limits.maxPlayers === null) {
      return { allowed: true }
    }

    if (currentCount >= limits.maxPlayers) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${limits.maxPlayers} players for the ${this.props.tier} tier. Please upgrade to add more.`,
      }
    }

    return { allowed: true }
  }

  /**
   * Update club branding
   */
  updateBranding(branding: {
    primaryColor?: string
    secondaryColor?: string
    logo?: string
  }): void {
    if (branding.primaryColor !== undefined) {
      if (!this.isValidColor(branding.primaryColor)) {
        throw new Error('Invalid color format. Use hex format like #ff0000')
      }
      this.props.primaryColor = branding.primaryColor
    }

    if (branding.secondaryColor !== undefined) {
      if (branding.secondaryColor && !this.isValidColor(branding.secondaryColor)) {
        throw new Error('Invalid color format. Use hex format like #ff0000')
      }
      this.props.secondaryColor = branding.secondaryColor
    }

    if (branding.logo !== undefined) {
      if (branding.logo && !this.isValidUrl(branding.logo)) {
        throw new Error('Invalid logo URL')
      }
      this.props.logo = branding.logo
    }

    this.props.updatedAt = new Date()
  }

  /**
   * Set custom domain
   */
  setCustomDomain(domain: string): void {
    const limits = this.getFeatureLimits()

    if (!limits.customDomain) {
      throw new Error('Custom domains require BASIC tier or higher')
    }

    if (!Club.isValidDomain(domain)) {
      throw new Error('Invalid custom domain format')
    }

    this.props.customDomain = domain
    this.props.updatedAt = new Date()
  }

  /**
   * Remove custom domain
   */
  removeCustomDomain(): void {
    this.props.customDomain = null
    this.props.updatedAt = new Date()
  }

  /**
   * Suspend club
   */
  suspend(reason: string): void {
    if (this.props.isSuspended) {
      throw new Error('Club is already suspended')
    }

    this.props.isSuspended = true
    this.props.isActive = false
    this.props.updatedAt = new Date()
  }

  /**
   * Reactivate club
   */
  reactivate(): void {
    if (!this.props.isSuspended) {
      throw new Error('Club is not suspended')
    }

    this.props.isSuspended = false
    this.props.isActive = true
    this.props.updatedAt = new Date()
  }

  /**
   * Set subscription ID
   */
  setSubscription(subscriptionId: string): void {
    this.props.subscriptionId = subscriptionId
    this.props.updatedAt = new Date()
  }

  /**
   * Set trial end date
   */
  setTrialEndDate(date: Date): void {
    this.props.trialEndsAt = date
    this.props.updatedAt = new Date()
  }

  /**
   * Set active until date
   */
  setActiveUntil(date: Date): void {
    this.props.activeUntil = date
    this.props.updatedAt = new Date()
  }

  /**
   * Check if trial is active
   */
  isTrialActive(): boolean {
    if (!this.props.trialEndsAt) return false
    return new Date() < this.props.trialEndsAt
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(): boolean {
    if (!this.props.activeUntil) return false
    return new Date() < this.props.activeUntil
  }

  // Validation helpers
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidDomain(domain: string): boolean {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    return domainRegex.test(domain)
  }

  private isValidColor(color: string): boolean {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    return hexRegex.test(color)
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Serialization
  toJSON(): ClubProps {
    return { ...this.props }
  }
}

// Helper function (would be replaced with proper ID generation)
function generateId(): string {
  return `club_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
