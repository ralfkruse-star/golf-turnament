/**
 * Club Fixtures
 * Predefined club data for testing
 */

import { ClubTier } from '@prisma/client'

export const CLUB_FIXTURES = {
  freeClub: {
    name: 'Free Golf Club',
    slug: 'free-golf-club',
    email: 'info@freegolfclub.com',
    phone: '+49123456789',
    address: 'Test Street 1',
    city: 'Hamburg',
    postalCode: '20095',
    country: 'DE',
    tier: 'FREE' as ClubTier,
    isActive: true,
    features: {
      qrScoring: false,
      liveLeaderboard: false,
      photoGallery: false,
      analytics: false,
      whiteLabel: false,
    },
    maxTournaments: 3,
    maxPlayers: 50,
  },

  basicClub: {
    name: 'Basic Golf Club',
    slug: 'basic-golf-club',
    email: 'info@basicgolfclub.com',
    phone: '+49123456790',
    address: 'Test Street 2',
    city: 'Munich',
    postalCode: '80331',
    country: 'DE',
    tier: 'BASIC' as ClubTier,
    isActive: true,
    features: {
      qrScoring: true,
      liveLeaderboard: true,
      photoGallery: false,
      analytics: false,
      whiteLabel: false,
    },
    maxTournaments: 12,
    maxPlayers: 200,
  },

  premiumClub: {
    name: 'Premium Golf Club',
    slug: 'premium-golf-club',
    email: 'info@premiumgolfclub.com',
    phone: '+49123456791',
    address: 'Test Street 3',
    city: 'Berlin',
    postalCode: '10115',
    country: 'DE',
    tier: 'PREMIUM' as ClubTier,
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    isActive: true,
    features: {
      qrScoring: true,
      liveLeaderboard: true,
      photoGallery: true,
      analytics: true,
      whiteLabel: false,
      pushNotifications: true,
    },
    maxTournaments: null, // unlimited
    maxPlayers: null, // unlimited
  },

  enterpriseClub: {
    name: 'Enterprise Golf Club',
    slug: 'enterprise-golf-club',
    email: 'info@enterprisegolfclub.com',
    phone: '+49123456792',
    address: 'Test Street 4',
    city: 'Frankfurt',
    postalCode: '60311',
    country: 'DE',
    tier: 'ENTERPRISE' as ClubTier,
    customDomain: 'golf.enterprise-club.com',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    isActive: true,
    features: {
      qrScoring: true,
      liveLeaderboard: true,
      photoGallery: true,
      analytics: true,
      whiteLabel: true,
      pushNotifications: true,
      apiAccess: true,
      dedicatedSupport: true,
    },
    maxTournaments: null,
    maxPlayers: null,
  },

  inactiveClub: {
    name: 'Inactive Golf Club',
    slug: 'inactive-golf-club',
    email: 'info@inactivegolfclub.com',
    tier: 'BASIC' as ClubTier,
    isActive: false,
    isSuspended: true,
    features: {},
  },

  trialClub: {
    name: 'Trial Golf Club',
    slug: 'trial-golf-club',
    email: 'info@trialgolfclub.com',
    tier: 'PREMIUM' as ClubTier,
    isActive: true,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    features: {
      qrScoring: true,
      liveLeaderboard: true,
      photoGallery: true,
      analytics: true,
    },
  },
}

export const CLUB_WITH_COURSES = {
  club: CLUB_FIXTURES.premiumClub,
  courses: [
    {
      name: 'Championship Course',
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
          name: 'Tournament',
          color: 'blue',
          rating: 72.5,
          slope: 138,
          yardage: 6800,
        },
        {
          name: 'Regular',
          color: 'white',
          rating: 70.8,
          slope: 132,
          yardage: 6400,
        },
        {
          name: 'Forward',
          color: 'red',
          rating: 71.2,
          slope: 128,
          yardage: 5600,
        },
      ],
    },
    {
      name: 'Executive Course',
      holes: 9,
      par: 36,
      tees: [
        {
          name: 'Regular',
          color: 'white',
          rating: 34.5,
          slope: 120,
          yardage: 2800,
        },
      ],
    },
  ],
}
