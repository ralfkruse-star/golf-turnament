/**
 * Migration Script: Create Default Club
 *
 * This script:
 * 1. Creates a default club for existing data
 * 2. Assigns all existing tournaments to the default club
 * 3. Assigns all existing courses to the default club
 * 4. Creates a default admin user as club owner
 *
 * Run with: tsx prisma/migrations/create-default-club.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration: Create default club...\n')

  try {
    // Check if default club already exists
    const existingClub = await prisma.club.findUnique({
      where: { slug: 'golfplatz-siek' },
    })

    if (existingClub) {
      console.log('✅ Default club already exists:', existingClub.name)
      console.log('   Club ID:', existingClub.id)
      return existingClub
    }

    // Create default club
    console.log('Creating default club...')
    const defaultClub = await prisma.club.create({
      data: {
        name: 'Golfplatz Siek',
        slug: 'golfplatz-siek',
        description: 'Default golf club',
        email: 'info@golfplatz-siek.de',
        phone: '+49 (0) 4107 1234',
        address: 'Siek',
        city: 'Siek',
        postalCode: '22964',
        country: 'DE',
        primaryColor: '#16a34a',
        secondaryColor: null,
        tier: 'PREMIUM', // Start with PREMIUM for existing club
        features: {},
        isActive: true,
        isSuspended: false,
        // Set trial to expire in 90 days
        trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    })

    console.log('✅ Default club created:', defaultClub.name)
    console.log('   Club ID:', defaultClub.id)
    console.log('   Slug:', defaultClub.slug)
    console.log('   Tier:', defaultClub.tier)

    // Migrate existing tournaments
    console.log('\nMigrating existing tournaments...')
    const tournamentUpdate = await prisma.tournament.updateMany({
      where: { clubId: null },
      data: { clubId: defaultClub.id },
    })
    console.log(`✅ Migrated ${tournamentUpdate.count} tournaments to default club`)

    // Migrate existing courses
    console.log('\nMigrating existing courses...')
    const courseUpdate = await prisma.course.updateMany({
      where: { clubId: null },
      data: { clubId: defaultClub.id },
    })
    console.log(`✅ Migrated ${courseUpdate.count} courses to default club`)

    // Find admin users and add them to the club
    console.log('\nAdding admin users to default club...')
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
    })

    for (const admin of adminUsers) {
      try {
        await prisma.clubMember.create({
          data: {
            clubId: defaultClub.id,
            userId: admin.id,
            role: 'OWNER',
          },
        })
        console.log(`✅ Added ${admin.email} as OWNER`)
      } catch (error) {
        // Ignore if already exists
        console.log(`   ${admin.email} already a member`)
      }
    }

    // If no admin users, create a default one
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found. Please create an admin user manually.')
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update environment variables if needed')
    console.log('2. Configure custom domain (optional)')
    console.log('3. Update branding colors (optional)')
    console.log('4. Set up Stripe subscription (optional)')

    return defaultClub
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
