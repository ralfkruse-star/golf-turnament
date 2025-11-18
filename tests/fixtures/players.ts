/**
 * Player Fixtures
 * Predefined player data for testing
 */

import { Gender, MembershipType } from '@prisma/client'

export const PLAYER_FIXTURES = {
  lowHandicapper: {
    firstName: 'Tiger',
    lastName: 'Woods',
    email: 'tiger.woods@test.com',
    phone: '+491234567890',
    handicapIndex: 2.5,
    gender: 'MALE' as Gender,
    membershipType: 'MEMBER' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  midHandicapper: {
    firstName: 'Rory',
    lastName: 'McIlroy',
    email: 'rory.mcilroy@test.com',
    phone: '+491234567891',
    handicapIndex: 12.8,
    gender: 'MALE' as Gender,
    membershipType: 'MEMBER' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  highHandicapper: {
    firstName: 'Phil',
    lastName: 'Mickelson',
    email: 'phil.mickelson@test.com',
    phone: '+491234567892',
    handicapIndex: 28.4,
    gender: 'MALE' as Gender,
    membershipType: 'MEMBER' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  femaleLowHandicapper: {
    firstName: 'Annika',
    lastName: 'Sorenstam',
    email: 'annika.sorenstam@test.com',
    phone: '+491234567893',
    handicapIndex: 4.2,
    gender: 'FEMALE' as Gender,
    membershipType: 'MEMBER' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  femaleMidHandicapper: {
    firstName: 'Lexi',
    lastName: 'Thompson',
    email: 'lexi.thompson@test.com',
    phone: '+491234567894',
    handicapIndex: 15.6,
    gender: 'FEMALE' as Gender,
    membershipType: 'MEMBER' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  guestPlayer: {
    firstName: 'John',
    lastName: 'Guest',
    email: 'john.guest@test.com',
    phone: '+491234567895',
    handicapIndex: 18.5,
    gender: 'MALE' as Gender,
    membershipType: 'GUEST' as MembershipType,
    homeClub: 'Other Golf Club',
    consentGiven: true,
  },

  corporatePlayer: {
    firstName: 'Corporate',
    lastName: 'Sponsor',
    email: 'corporate.sponsor@test.com',
    phone: '+491234567896',
    handicapIndex: 24.0,
    gender: 'MALE' as Gender,
    membershipType: 'CORPORATE' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  trialMember: {
    firstName: 'Trial',
    lastName: 'Member',
    email: 'trial.member@test.com',
    phone: '+491234567897',
    handicapIndex: 20.0,
    gender: 'MALE' as Gender,
    membershipType: 'TRIAL' as MembershipType,
    homeClub: 'Test Golf Club',
    consentGiven: true,
  },

  noConsentPlayer: {
    firstName: 'No',
    lastName: 'Consent',
    email: 'no.consent@test.com',
    phone: '+491234567898',
    handicapIndex: 15.0,
    gender: 'MALE' as Gender,
    membershipType: 'MEMBER' as MembershipType,
    consentGiven: false,
  },

  noHandicapPlayer: {
    firstName: 'No',
    lastName: 'Handicap',
    email: 'no.handicap@test.com',
    phone: '+491234567899',
    handicapIndex: 54.0, // Max handicap
    gender: 'MALE' as Gender,
    membershipType: 'GUEST' as MembershipType,
    consentGiven: true,
  },
}

/**
 * Generate a batch of realistic test players
 */
export function generatePlayerBatch(count: number = 50) {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  const genders: Gender[] = ['MALE', 'FEMALE']
  const membershipTypes: MembershipType[] = ['MEMBER', 'GUEST', 'CORPORATE', 'TRIAL']

  return Array.from({ length: count }, (_, i) => ({
    firstName: firstNames[i % firstNames.length],
    lastName: `${lastNames[i % lastNames.length]}${i}`,
    email: `player${i}@test.com`,
    phone: `+4915${String(i).padStart(9, '0')}`,
    handicapIndex: Math.round((Math.random() * 35 + 2) * 10) / 10, // 2.0 - 37.0
    gender: genders[i % 2],
    membershipType: membershipTypes[i % 4],
    homeClub: 'Test Golf Club',
    consentGiven: true,
    consentDate: new Date(),
  }))
}
