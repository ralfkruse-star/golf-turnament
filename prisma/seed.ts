import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default course (Golfplatz Siek)
  const course = await prisma.course.upsert({
    where: { id: 'default-course' },
    update: {},
    create: {
      id: 'default-course',
      name: 'Golfplatz Siek',
      location: 'Siek, Schleswig-Holstein, Germany',
      holes: 18,
      par: 72,
      tees: [
        {
          name: 'Championship',
          color: 'black',
          rating: 74.2,
          slope: 142,
          yardage: 6800,
        },
        {
          name: 'Men',
          color: 'white',
          rating: 71.5,
          slope: 135,
          yardage: 6200,
        },
        {
          name: 'Women',
          color: 'red',
          rating: 73.8,
          slope: 130,
          yardage: 5400,
        },
      ],
      holeDetails: Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        par: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4][i],
        handicap: i + 1,
        yardages: {
          black: [420, 380, 180, 520, 400, 390, 160, 540, 410][i % 9] || 400,
          white: [380, 350, 160, 490, 370, 360, 140, 510, 380][i % 9] || 370,
          red: [320, 300, 130, 450, 310, 300, 110, 470, 320][i % 9] || 310,
        },
      })),
    },
  })

  console.log('✅ Created course:', course.name)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@golfplatz-siek.de' },
    update: {},
    create: {
      email: 'admin@golfplatz-siek.de',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create sample players
  const players = await Promise.all([
    prisma.player.upsert({
      where: { email: 'max.mustermann@example.com' },
      update: {},
      create: {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 151 12345678',
        handicapIndex: 18.5,
        membershipType: 'MEMBER',
        memberNumber: 'M-001',
        consentGiven: true,
        consentDate: new Date(),
        gender: 'MALE',
        homeClub: 'Golfplatz Siek',
      },
    }),
    prisma.player.upsert({
      where: { email: 'anna.schmidt@example.com' },
      update: {},
      create: {
        firstName: 'Anna',
        lastName: 'Schmidt',
        email: 'anna.schmidt@example.com',
        phone: '+49 151 87654321',
        handicapIndex: 24.2,
        membershipType: 'MEMBER',
        memberNumber: 'M-002',
        consentGiven: true,
        consentDate: new Date(),
        gender: 'FEMALE',
        homeClub: 'Golfplatz Siek',
      },
    }),
    prisma.player.upsert({
      where: { email: 'peter.mueller@example.com' },
      update: {},
      create: {
        firstName: 'Peter',
        lastName: 'Müller',
        email: 'peter.mueller@example.com',
        phone: '+49 151 11122233',
        handicapIndex: 12.3,
        membershipType: 'MEMBER',
        memberNumber: 'M-003',
        consentGiven: true,
        consentDate: new Date(),
        gender: 'MALE',
        homeClub: 'Golfplatz Siek',
      },
    }),
  ])

  console.log(`✅ Created ${players.length} sample players`)

  // Create sample tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Herbst-Clubmeisterschaft 2025',
      description: 'Jährliche Clubmeisterschaft - Stableford',
      format: 'STABLEFORD',
      category: 'CLUB_CHAMPIONSHIP',
      status: 'OPEN_FOR_REGISTRATION',
      tournamentDate: new Date('2025-09-15T09:00:00'),
      registrationStart: new Date('2025-08-01T00:00:00'),
      registrationEnd: new Date('2025-09-10T23:59:59'),
      courseId: course.id,
      teesUsed: {
        men: 'white',
        women: 'red',
      },
      maxPlayers: 120,
      minPlayers: 4,
      entryFee: 35.0,
      autoGenerateFlights: true,
      flightsPerTee: 10,
      allowGuests: false,
      requireHandicap: true,
      maxHandicap: 36.0,
      createdBy: adminUser.id,
    },
  })

  console.log('✅ Created sample tournament:', tournament.name)

  // Register players for tournament
  const registrations = await Promise.all(
    players.map((player, index) =>
      prisma.registration.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          status: 'CONFIRMED',
          playingHandicap: player.handicapIndex,
          tee: player.gender === 'MALE' ? 'white' : 'red',
          paid: true,
          paidAt: new Date(),
          cart: index === 0, // First player wants a cart
        },
      })
    )
  )

  console.log(`✅ Registered ${registrations.length} players for tournament`)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
