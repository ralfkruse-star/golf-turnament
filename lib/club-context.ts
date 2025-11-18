/**
 * Club Context Helpers
 * Functions to retrieve club information from request context
 */

import { headers, cookies } from 'next/headers'
import { prisma } from './prisma'

export interface ClubContext {
  id: string
  slug: string
  name: string
  tier: string
  primaryColor: string
  secondaryColor: string | null
  logo: string | null
}

/**
 * Get club ID from request headers/cookies (Server Component)
 */
export async function getClubId(): Promise<string | null> {
  const headersList = await headers()
  const clubId = headersList.get('x-club-id')

  if (clubId) {
    return clubId
  }

  const cookieStore = await cookies()
  const clubIdCookie = cookieStore.get('club-id')

  return clubIdCookie?.value || null
}

/**
 * Get club slug from request headers/cookies (Server Component)
 */
export async function getClubSlug(): Promise<string | null> {
  const headersList = await headers()
  const clubSlug = headersList.get('x-club-slug')

  if (clubSlug) {
    return clubSlug
  }

  const cookieStore = await cookies()
  const clubSlugCookie = cookieStore.get('club-slug')

  return clubSlugCookie?.value || null
}

/**
 * Get full club context (Server Component)
 */
export async function getClubContext(): Promise<ClubContext | null> {
  const clubId = await getClubId()

  if (!clubId) {
    return null
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      primaryColor: true,
      secondaryColor: true,
      logo: true,
    },
  })

  return club as ClubContext | null
}

/**
 * Require club context - throws if not found (Server Component)
 */
export async function requireClubContext(): Promise<ClubContext> {
  const context = await getClubContext()

  if (!context) {
    throw new Error('Club context is required but not found')
  }

  return context
}

/**
 * Get club context by slug (Server Component)
 */
export async function getClubContextBySlug(slug: string): Promise<ClubContext | null> {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      primaryColor: true,
      secondaryColor: true,
      logo: true,
    },
  })

  return club as ClubContext | null
}
