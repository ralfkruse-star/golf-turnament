/**
 * Test Database Utilities
 * Handles database seeding and cleanup for tests
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

/**
 * Clean all data from the database
 * Use with caution - this deletes everything!
 */
export async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.notificationLog.deleteMany()
  await prisma.pushSubscription.deleteMany()
  await prisma.report.deleteMany()
  await prisma.analyticsMetric.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.album.deleteMany()
  await prisma.sponsor.deleteMany()
  await prisma.scorecard.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.flight.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.course.deleteMany()
  await prisma.clubMember.deleteMany()
  await prisma.club.deleteMany()
  await prisma.player.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.syncLog.deleteMany()
  await prisma.verificationToken.deleteMany()
}

/**
 * Seed the database with test data
 */
export async function seedTestData() {
  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  const playerUser = await prisma.user.create({
    data: {
      email: 'player@test.com',
      name: 'Test Player',
      role: 'PLAYER',
      emailVerified: new Date(),
    },
  })

  // Create test club
  const club = await prisma.club.create({
    data: {
      name: 'Test Golf Club',
      slug: 'test-golf-club',
      email: 'info@testgolfclub.com',
      tier: 'PREMIUM',
      isActive: true,
      features: {
        qrScoring: true,
        liveLeaderboard: true,
        photoGallery: true,
        analytics: true,
      },
    },
  })

  // Add admin as club owner
  await prisma.clubMember.create({
    data: {
      clubId: club.id,
      userId: adminUser.id,
      role: 'OWNER',
    },
  })

  // Create test course
  const course = await prisma.course.create({
    data: {
      name: 'Test Championship Course',
      clubId: club.id,
      holes: 18,
      par: 72,
      tees: [
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
        {
          name: 'Ladies',
          color: 'red',
          rating: 72.8,
          slope: 128,
          yardage: 5800,
        },
      ],
      holeDetails: Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        par: i % 3 === 0 ? 5 : i % 2 === 0 ? 4 : 3,
        handicap: i + 1,
        yardages: {
          black: 400 + i * 10,
          white: 360 + i * 10,
          red: 320 + i * 10,
        },
      })),
    },
  })

  // Create test players
  const players = await Promise.all([
    prisma.player.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        handicapIndex: 10.5,
        gender: 'MALE',
        membershipType: 'MEMBER',
        consentGiven: true,
        consentDate: new Date(),
        userId: playerUser.id,
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        handicapIndex: 15.2,
        gender: 'FEMALE',
        membershipType: 'MEMBER',
        consentGiven: true,
        consentDate: new Date(),
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@test.com',
        handicapIndex: 5.8,
        gender: 'MALE',
        membershipType: 'GUEST',
        consentGiven: true,
        consentDate: new Date(),
      },
    }),
  ])

  // Create test tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Test Monthly Medal',
      description: 'Test tournament for automated testing',
      format: 'STABLEFORD',
      category: 'MONTHLY_MEDAL',
      status: 'OPEN_FOR_REGISTRATION',
      tournamentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      registrationStart: new Date(),
      registrationEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      courseId: course.id,
      clubId: club.id,
      teesUsed: { men: 'white', women: 'red' },
      maxPlayers: 120,
      minPlayers: 4,
      entryFee: 25.0,
      autoGenerateFlights: true,
      flightsPerTee: 10,
      allowGuests: true,
      requireHandicap: true,
      maxHandicap: 36.0,
      createdBy: adminUser.id,
    },
  })

  return {
    users: { adminUser, playerUser },
    club,
    course,
    players,
    tournament,
  }
}

/**
 * Create a test tournament with specific parameters
 */
export async function createTestTournament(
  clubId: string,
  courseId: string,
  creatorId: string,
  overrides: Partial<any> = {}
) {
  return prisma.tournament.create({
    data: {
      name: overrides.name || 'Test Tournament',
      description: overrides.description || 'A test tournament',
      format: overrides.format || 'STABLEFORD',
      category: overrides.category || 'CASUAL',
      status: overrides.status || 'DRAFT',
      tournamentDate: overrides.tournamentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationStart: overrides.registrationStart || new Date(),
      registrationEnd: overrides.registrationEnd || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      courseId,
      clubId,
      teesUsed: overrides.teesUsed || { men: 'white', women: 'red' },
      maxPlayers: overrides.maxPlayers || 100,
      minPlayers: overrides.minPlayers || 4,
      entryFee: overrides.entryFee || 20.0,
      autoGenerateFlights: overrides.autoGenerateFlights !== undefined ? overrides.autoGenerateFlights : true,
      flightsPerTee: overrides.flightsPerTee || 10,
      allowGuests: overrides.allowGuests !== undefined ? overrides.allowGuests : true,
      requireHandicap: overrides.requireHandicap !== undefined ? overrides.requireHandicap : true,
      createdBy: creatorId,
      ...overrides,
    },
  })
}

/**
 * Create test players in bulk
 */
export async function createTestPlayers(count: number = 10) {
  const players = []
  for (let i = 0; i < count; i++) {
    const player = await prisma.player.create({
      data: {
        firstName: `Player${i}`,
        lastName: `Test${i}`,
        email: `player${i}@test.com`,
        handicapIndex: Math.random() * 30 + 5, // 5-35
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        membershipType: i % 3 === 0 ? 'GUEST' : 'MEMBER',
        consentGiven: true,
        consentDate: new Date(),
      },
    })
    players.push(player)
  }
  return players
}

/**
 * Create test registrations for a tournament
 */
export async function createTestRegistrations(
  tournamentId: string,
  playerIds: string[]
) {
  const registrations = []
  for (const playerId of playerIds) {
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) continue

    const registration = await prisma.registration.create({
      data: {
        tournamentId,
        playerId,
        status: 'CONFIRMED',
        playingHandicap: player.handicapIndex,
        tee: player.gender === 'FEMALE' ? 'red' : 'white',
        paid: Math.random() > 0.3, // 70% paid
      },
    })
    registrations.push(registration)
  }
  return registrations
}

/**
 * Reset database to clean state and seed with test data
 */
export async function resetDatabase() {
  await cleanDatabase()
  return await seedTestData()
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  await prisma.$disconnect()
}

export { prisma }
