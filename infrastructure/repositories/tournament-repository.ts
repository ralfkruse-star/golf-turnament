/**
 * Tournament Repository
 * Infrastructure layer for persisting Tournament aggregates
 */

import { prisma } from '@/lib/prisma'
import { Tournament, CreateTournamentParams } from '@/domain/entities/tournament'
import { TournamentFormat } from '@/domain/value-objects/tournament-format'
import type { Prisma } from '@prisma/client'

export interface TournamentRepository {
  save(tournament: Tournament): Promise<void>
  findById(id: string): Promise<Tournament | null>
  findAll(filters?: TournamentFilters): Promise<Tournament[]>
  findActive(): Promise<Tournament[]>
  delete(id: string): Promise<void>
}

export interface TournamentFilters {
  status?: string[]
  dateFrom?: Date
  dateTo?: Date
  category?: string
  clubId?: string
}

export class PrismaTournamentRepository implements TournamentRepository {
  async save(tournament: Tournament): Promise<void> {
    const data = tournament.toJSON()

    await prisma.tournament.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        format: data.format.getValue(),
        category: data.category,
        status: data.status,
        tournamentDate: data.tournamentDate,
        registrationStart: data.registrationStart,
        registrationEnd: data.registrationEnd,
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        entryFee: data.entryFee ? new Prisma.Decimal(data.entryFee) : null,
        requireHandicap: data.requireHandicap,
        maxHandicap: data.maxHandicap ? new Prisma.Decimal(data.maxHandicap) : null,
        allowGuests: data.allowGuests,
        teesUsed: {},
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        name: data.name,
        description: data.description,
        format: data.format.getValue(),
        category: data.category,
        status: data.status,
        tournamentDate: data.tournamentDate,
        registrationStart: data.registrationStart,
        registrationEnd: data.registrationEnd,
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        entryFee: data.entryFee ? new Prisma.Decimal(data.entryFee) : null,
        requireHandicap: data.requireHandicap,
        maxHandicap: data.maxHandicap ? new Prisma.Decimal(data.maxHandicap) : null,
        allowGuests: data.allowGuests,
        updatedAt: data.updatedAt,
      },
    })
  }

  async findById(id: string): Promise<Tournament | null> {
    const record = await prisma.tournament.findUnique({
      where: { id },
    })

    if (!record) return null

    return this.toDomain(record)
  }

  async findAll(filters?: TournamentFilters): Promise<Tournament[]> {
    const where: any = {}

    // IMPORTANT: Filter by clubId for multi-tenancy
    if (filters?.clubId) {
      where.clubId = filters.clubId
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.tournamentDate = {}
      if (filters.dateFrom) {
        where.tournamentDate.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.tournamentDate.lte = filters.dateTo
      }
    }

    if (filters?.category) {
      where.category = filters.category
    }

    const records = await prisma.tournament.findMany({
      where,
      orderBy: { tournamentDate: 'desc' },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findActive(clubId?: string): Promise<Tournament[]> {
    const where: any = {
      status: {
        in: ['OPEN_FOR_REGISTRATION', 'REGISTRATION_CLOSED', 'IN_PROGRESS'],
      },
    }

    // IMPORTANT: Filter by clubId for multi-tenancy
    if (clubId) {
      where.clubId = clubId
    }

    const records = await prisma.tournament.findMany({
      where,
      orderBy: { tournamentDate: 'asc' },
    })

    return records.map((r) => this.toDomain(r))
  }

  async delete(id: string): Promise<void> {
    await prisma.tournament.delete({
      where: { id },
    })
  }

  private toDomain(record: any): Tournament {
    const params: CreateTournamentParams = {
      name: record.name,
      description: record.description || undefined,
      format: TournamentFormat.fromString(record.format),
      category: record.category,
      tournamentDate: record.tournamentDate,
      registrationStart: record.registrationStart,
      registrationEnd: record.registrationEnd,
      maxPlayers: record.maxPlayers || undefined,
      minPlayers: record.minPlayers,
      entryFee: record.entryFee ? Number(record.entryFee) : undefined,
      requireHandicap: record.requireHandicap,
      maxHandicap: record.maxHandicap ? Number(record.maxHandicap) : undefined,
      allowGuests: record.allowGuests,
    }

    const tournament = Tournament.create(params)

    // Reconstruct with correct ID and status
    const tournamentData = tournament.toJSON()
    tournamentData.id = record.id
    tournamentData.status = record.status
    tournamentData.createdAt = record.createdAt
    tournamentData.updatedAt = record.updatedAt

    // Use reflection to set private props (not ideal, but necessary for reconstitution)
    return Object.assign(Object.create(Tournament.prototype), { props: tournamentData })
  }
}
