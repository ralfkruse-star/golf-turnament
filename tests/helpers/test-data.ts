/**
 * Test Data Factories
 * Provides factory functions for creating test data
 */

import { Prisma } from '@prisma/client'

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`
}

/**
 * Generate random phone number
 */
export function randomPhone(): string {
  return `+49${Math.floor(Math.random() * 9000000000 + 1000000000)}`
}

/**
 * Generate random handicap index (5.0 - 36.0)
 */
export function randomHandicap(): number {
  return Math.round((Math.random() * 31 + 5) * 10) / 10
}

/**
 * Player factory
 */
export function playerFactory(overrides?: Partial<Prisma.PlayerCreateInput>): Prisma.PlayerCreateInput {
  const firstName = overrides?.firstName || `Player${Math.random().toString(36).substring(7)}`
  const lastName = overrides?.lastName || `Test${Math.random().toString(36).substring(7)}`

  return {
    firstName,
    lastName,
    email: overrides?.email || randomEmail(),
    phone: overrides?.phone || randomPhone(),
    handicapIndex: overrides?.handicapIndex || randomHandicap(),
    gender: overrides?.gender || 'MALE',
    membershipType: overrides?.membershipType || 'MEMBER',
    consentGiven: overrides?.consentGiven !== undefined ? overrides.consentGiven : true,
    consentDate: overrides?.consentDate || new Date(),
    ...overrides,
  }
}

/**
 * Tournament factory
 */
export function tournamentFactory(
  courseId: string,
  clubId: string,
  creatorId: string,
  overrides?: Partial<Prisma.TournamentCreateInput>
): Prisma.TournamentCreateInput {
  const now = new Date()
  const tournamentDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  return {
    name: overrides?.name || `Test Tournament ${Date.now()}`,
    description: overrides?.description || 'A test tournament',
    format: overrides?.format || 'STABLEFORD',
    category: overrides?.category || 'MONTHLY_MEDAL',
    status: overrides?.status || 'DRAFT',
    tournamentDate: overrides?.tournamentDate || tournamentDate,
    registrationStart: overrides?.registrationStart || now,
    registrationEnd: overrides?.registrationEnd || new Date(tournamentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    course: { connect: { id: courseId } },
    club: { connect: { id: clubId } },
    creator: { connect: { id: creatorId } },
    teesUsed: overrides?.teesUsed || { men: 'white', women: 'red' },
    maxPlayers: overrides?.maxPlayers || 100,
    minPlayers: overrides?.minPlayers || 4,
    entryFee: overrides?.entryFee || 25.0,
    autoGenerateFlights: overrides?.autoGenerateFlights !== undefined ? overrides.autoGenerateFlights : true,
    flightsPerTee: overrides?.flightsPerTee || 10,
    allowGuests: overrides?.allowGuests !== undefined ? overrides.allowGuests : true,
    requireHandicap: overrides?.requireHandicap !== undefined ? overrides.requireHandicap : true,
    ...overrides,
  }
}

/**
 * Registration factory
 */
export function registrationFactory(
  tournamentId: string,
  playerId: string,
  overrides?: Partial<Prisma.RegistrationCreateInput>
): Prisma.RegistrationCreateInput {
  return {
    tournament: { connect: { id: tournamentId } },
    player: { connect: { id: playerId } },
    status: overrides?.status || 'CONFIRMED',
    playingHandicap: overrides?.playingHandicap || randomHandicap(),
    tee: overrides?.tee || 'white',
    paid: overrides?.paid !== undefined ? overrides.paid : true,
    ...overrides,
  }
}

/**
 * Scorecard factory
 */
export function scorecardFactory(
  tournamentId: string,
  playerId: string,
  overrides?: Partial<any>
): any {
  const scores = Array.from({ length: 18 }, (_, i) => ({
    hole: i + 1,
    gross: overrides?.scores?.[i]?.gross || Math.floor(Math.random() * 3) + 3, // 3-5
    putts: overrides?.scores?.[i]?.putts || Math.floor(Math.random() * 3) + 1, // 1-3
    fairwayHit: overrides?.scores?.[i]?.fairwayHit !== undefined ? overrides.scores[i].fairwayHit : Math.random() > 0.5,
    greenInRegulation: overrides?.scores?.[i]?.greenInRegulation !== undefined ? overrides.scores[i].greenInRegulation : Math.random() > 0.5,
  }))

  const totalGross = scores.reduce((sum, s) => sum + s.gross, 0)

  return {
    tournamentId,
    playerId,
    scores,
    totalGross,
    totalNet: overrides?.totalNet || totalGross - 10,
    totalPoints: overrides?.totalPoints || 36,
    status: overrides?.status || 'SUBMITTED',
    startedAt: overrides?.startedAt || new Date(),
    submittedAt: overrides?.submittedAt || new Date(),
  }
}

/**
 * Club factory
 */
export function clubFactory(overrides?: Partial<Prisma.ClubCreateInput>): Prisma.ClubCreateInput {
  const slug = overrides?.slug || `club-${Date.now()}-${Math.random().toString(36).substring(7)}`

  return {
    name: overrides?.name || `Test Golf Club ${slug}`,
    slug,
    email: overrides?.email || `info@${slug}.com`,
    tier: overrides?.tier || 'BASIC',
    isActive: overrides?.isActive !== undefined ? overrides.isActive : true,
    features: overrides?.features || {
      qrScoring: true,
      liveLeaderboard: true,
    },
    ...overrides,
  }
}

/**
 * Course factory
 */
export function courseFactory(clubId: string, overrides?: Partial<Prisma.CourseCreateInput>): Prisma.CourseCreateInput {
  return {
    name: overrides?.name || `Test Course ${Date.now()}`,
    club: { connect: { id: clubId } },
    holes: overrides?.holes || 18,
    par: overrides?.par || 72,
    tees: overrides?.tees || [
      {
        name: 'Championship',
        color: 'black',
        rating: 74.2,
        slope: 142,
        yardage: 7200,
      },
      {
        name: 'Regular',
        color: 'white',
        rating: 71.5,
        slope: 135,
        yardage: 6500,
      },
    ],
    holeDetails: overrides?.holeDetails || Array.from({ length: 18 }, (_, i) => ({
      hole: i + 1,
      par: i % 3 === 0 ? 5 : i % 2 === 0 ? 4 : 3,
      handicap: i + 1,
      yardages: {
        black: 400 + i * 10,
        white: 360 + i * 10,
      },
    })),
    ...overrides,
  }
}

/**
 * Photo factory
 */
export function photoFactory(
  uploaderId: string,
  overrides?: Partial<any>
): any {
  return {
    filename: overrides?.filename || `test-photo-${Date.now()}.jpg`,
    originalName: overrides?.originalName || 'test-photo.jpg',
    mimeType: overrides?.mimeType || 'image/jpeg',
    fileSize: overrides?.fileSize || 1024000,
    width: overrides?.width || 1920,
    height: overrides?.height || 1080,
    url: overrides?.url || `/uploads/test-photo-${Date.now()}.jpg`,
    category: overrides?.category || 'TOURNAMENT',
    uploadedBy: uploaderId,
    approved: overrides?.approved !== undefined ? overrides.approved : false,
    isPublic: overrides?.isPublic !== undefined ? overrides.isPublic : true,
    ...overrides,
  }
}

/**
 * Generate realistic score for a hole
 */
export function generateScore(par: number, handicap: number): number {
  const skillFactor = Math.max(0, 1 - handicap / 40)
  const randomness = Math.random()

  if (randomness < 0.05 * skillFactor) return par - 2 // Eagle
  if (randomness < 0.15 * skillFactor) return par - 1 // Birdie
  if (randomness < 0.5) return par // Par
  if (randomness < 0.8) return par + 1 // Bogey
  if (randomness < 0.95) return par + 2 // Double bogey
  return par + 3 // Triple bogey or worse
}

/**
 * Generate realistic 18-hole scorecard
 */
export function generateRealisticScorecard(handicap: number) {
  const pars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4] // Typical par 72

  return pars.map((par, i) => ({
    hole: i + 1,
    par,
    gross: generateScore(par, handicap),
    putts: Math.floor(Math.random() * 3) + 1,
    fairwayHit: par > 3 && Math.random() > handicap / 54,
    greenInRegulation: Math.random() > handicap / 54,
  }))
}
