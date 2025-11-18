/**
 * Tournament Aggregate Root
 * Core domain entity for tournament management
 */

import { TournamentFormat } from '../value-objects/tournament-format'

export type TournamentStatus =
  | 'DRAFT'
  | 'OPEN_FOR_REGISTRATION'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

export type TournamentCategory =
  | 'CLUB_CHAMPIONSHIP'
  | 'MONTHLY_MEDAL'
  | 'CORPORATE_EVENT'
  | 'CHARITY'
  | 'MEMBER_GUEST'
  | 'PRO_AM'
  | 'CASUAL'

export interface TournamentProps {
  id: string
  name: string
  description?: string
  format: TournamentFormat
  category: TournamentCategory
  status: TournamentStatus
  tournamentDate: Date
  registrationStart: Date
  registrationEnd: Date
  maxPlayers?: number
  minPlayers: number
  entryFee?: number
  requireHandicap: boolean
  maxHandicap?: number
  allowGuests: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateTournamentParams {
  name: string
  description?: string
  format: TournamentFormat
  category: TournamentCategory
  tournamentDate: Date
  registrationStart: Date
  registrationEnd: Date
  maxPlayers?: number
  minPlayers?: number
  entryFee?: number
  requireHandicap?: boolean
  maxHandicap?: number
  allowGuests?: boolean
}

export class Tournament {
  private constructor(private props: TournamentProps) {}

  static create(params: CreateTournamentParams): Tournament {
    // Validate dates
    if (params.tournamentDate <= params.registrationEnd) {
      throw new Error('Tournament date must be after registration end date')
    }

    if (params.registrationStart >= params.registrationEnd) {
      throw new Error('Registration start must be before registration end')
    }

    // Validate player limits
    const minPlayers = params.minPlayers ?? 4
    if (minPlayers < 1) {
      throw new Error('Minimum players must be at least 1')
    }

    if (params.maxPlayers && params.maxPlayers < minPlayers) {
      throw new Error('Maximum players must be greater than minimum players')
    }

    // Validate handicap
    if (params.maxHandicap && (params.maxHandicap < 0 || params.maxHandicap > 54)) {
      throw new Error('Maximum handicap must be between 0 and 54')
    }

    const id = generateId()
    const now = new Date()

    return new Tournament({
      id,
      name: params.name,
      description: params.description,
      format: params.format,
      category: params.category,
      status: 'DRAFT',
      tournamentDate: params.tournamentDate,
      registrationStart: params.registrationStart,
      registrationEnd: params.registrationEnd,
      maxPlayers: params.maxPlayers,
      minPlayers,
      entryFee: params.entryFee,
      requireHandicap: params.requireHandicap ?? true,
      maxHandicap: params.maxHandicap,
      allowGuests: params.allowGuests ?? true,
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

  getStatus(): TournamentStatus {
    return this.props.status
  }

  getFormat(): TournamentFormat {
    return this.props.format
  }

  getTournamentDate(): Date {
    return this.props.tournamentDate
  }

  getMaxPlayers(): number | undefined {
    return this.props.maxPlayers
  }

  // Domain logic

  /**
   * Open tournament for registration
   */
  openForRegistration(): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('Can only open draft tournaments for registration')
    }

    const now = new Date()
    if (now > this.props.registrationEnd) {
      throw new Error('Cannot open registration after registration end date')
    }

    this.props.status = 'OPEN_FOR_REGISTRATION'
    this.props.updatedAt = new Date()
  }

  /**
   * Close registration
   */
  closeRegistration(): void {
    if (this.props.status !== 'OPEN_FOR_REGISTRATION') {
      throw new Error('Can only close tournaments that are open for registration')
    }

    this.props.status = 'REGISTRATION_CLOSED'
    this.props.updatedAt = new Date()
  }

  /**
   * Start tournament
   */
  start(): void {
    if (this.props.status !== 'REGISTRATION_CLOSED') {
      throw new Error('Can only start tournaments with closed registration')
    }

    this.props.status = 'IN_PROGRESS'
    this.props.updatedAt = new Date()
  }

  /**
   * Complete tournament
   */
  complete(): void {
    if (this.props.status !== 'IN_PROGRESS') {
      throw new Error('Can only complete tournaments that are in progress')
    }

    this.props.status = 'COMPLETED'
    this.props.updatedAt = new Date()
  }

  /**
   * Cancel tournament
   */
  cancel(): void {
    if (['COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(this.props.status)) {
      throw new Error('Cannot cancel completed, cancelled, or archived tournaments')
    }

    this.props.status = 'CANCELLED'
    this.props.updatedAt = new Date()
  }

  /**
   * Check if tournament is full
   */
  isFull(currentPlayerCount: number): boolean {
    if (!this.props.maxPlayers) return false
    return currentPlayerCount >= this.props.maxPlayers
  }

  /**
   * Check if player can register based on handicap
   */
  canPlayerRegister(playerHandicap?: number): { allowed: boolean; reason?: string } {
    // Check if handicap is required
    if (this.props.requireHandicap && playerHandicap === undefined) {
      return { allowed: false, reason: 'Handicap is required for this tournament' }
    }

    // Check max handicap
    if (
      playerHandicap !== undefined &&
      this.props.maxHandicap !== undefined &&
      playerHandicap > this.props.maxHandicap
    ) {
      return {
        allowed: false,
        reason: `Handicap ${playerHandicap} exceeds maximum of ${this.props.maxHandicap}`,
      }
    }

    return { allowed: true }
  }

  /**
   * Check if tournament is accepting registrations
   */
  isAcceptingRegistrations(): boolean {
    return this.props.status === 'OPEN_FOR_REGISTRATION'
  }

  // Serialization
  toJSON(): TournamentProps {
    return { ...this.props }
  }
}

// Helper function (would be replaced with proper ID generation)
function generateId(): string {
  return `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
