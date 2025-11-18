/**
 * Club Members API
 * GET /api/clubs/[slug]/members - Get club members
 * POST /api/clubs/[slug]/members - Add member to club
 */

import { NextRequest, NextResponse } from 'next/server'
import { ClubService } from '@/infrastructure/services/club-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clubService = new ClubService(prisma)

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'MEMBER']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get club
    const club = await clubService.getClubBySlug(slug)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Get members
    const members = await clubService.getClubMembers(club.id)

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate input
    const validatedData = addMemberSchema.parse(body)

    // Get club
    const club = await clubService.getClubBySlug(slug)
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Add member
    const member = await clubService.addClubMember(
      club.id,
      validatedData.userId,
      validatedData.role || 'MEMBER'
    )

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
