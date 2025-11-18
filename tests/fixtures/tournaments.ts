/**
 * Tournament Fixtures
 * Predefined tournament data for testing
 */

import { TournamentFormat, TournamentCategory, TournamentStatus } from '@prisma/client'

export const TOURNAMENT_FIXTURES = {
  monthlyMedal: {
    name: 'Monthly Medal - November',
    description: 'Monthly competition for club members',
    format: 'STABLEFORD' as TournamentFormat,
    category: 'MONTHLY_MEDAL' as TournamentCategory,
    status: 'OPEN_FOR_REGISTRATION' as TournamentStatus,
    entryFee: 25.0,
    maxPlayers: 120,
    minPlayers: 8,
    allowGuests: false,
    requireHandicap: true,
    maxHandicap: 36.0,
  },

  clubChampionship: {
    name: 'Club Championship 2024',
    description: 'Annual club championship - 36 holes stroke play',
    format: 'STROKE_PLAY' as TournamentFormat,
    category: 'CLUB_CHAMPIONSHIP' as TournamentCategory,
    status: 'REGISTRATION_CLOSED' as TournamentStatus,
    entryFee: 50.0,
    maxPlayers: 80,
    minPlayers: 16,
    allowGuests: false,
    requireHandicap: true,
    maxHandicap: 28.0,
  },

  corporateEvent: {
    name: 'Corporate Golf Day',
    description: 'Corporate golf event with scramble format',
    format: 'SCRAMBLE' as TournamentFormat,
    category: 'CORPORATE_EVENT' as TournamentCategory,
    status: 'DRAFT' as TournamentStatus,
    entryFee: 150.0,
    maxPlayers: 64,
    minPlayers: 16,
    allowGuests: true,
    requireHandicap: false,
  },

  charityEvent: {
    name: 'Charity Pro-Am',
    description: 'Charity golf event supporting local causes',
    format: 'BEST_BALL' as TournamentFormat,
    category: 'CHARITY' as TournamentCategory,
    status: 'OPEN_FOR_REGISTRATION' as TournamentStatus,
    entryFee: 75.0,
    maxPlayers: 100,
    minPlayers: 20,
    allowGuests: true,
    requireHandicap: true,
  },

  casualRound: {
    name: 'Weekend Social Golf',
    description: 'Casual weekend round',
    format: 'STABLEFORD' as TournamentFormat,
    category: 'CASUAL' as TournamentCategory,
    status: 'OPEN_FOR_REGISTRATION' as TournamentStatus,
    entryFee: 0,
    maxPlayers: 40,
    minPlayers: 4,
    allowGuests: true,
    requireHandicap: false,
  },
}

export const TOURNAMENT_WITH_SPONSORS = {
  ...TOURNAMENT_FIXTURES.charityEvent,
  sponsors: [
    {
      name: 'Local Bank',
      tier: 'PLATINUM',
      website: 'https://localbank.com',
      contactEmail: 'marketing@localbank.com',
    },
    {
      name: 'Golf Equipment Store',
      tier: 'GOLD',
      website: 'https://golfstore.com',
      contactEmail: 'info@golfstore.com',
    },
    {
      name: 'Restaurant',
      tier: 'HOLE_SPONSOR',
      website: 'https://restaurant.com',
      contactEmail: 'events@restaurant.com',
    },
  ],
}
