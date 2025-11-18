/**
 * Leaderboard API with Server-Sent Events
 * GET /api/tournaments/[id]/leaderboard - Real-time leaderboard updates
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: tournamentId } = await context.params

  // Check if client wants SSE
  const accept = request.headers.get('accept')
  const wantsSSE = accept?.includes('text/event-stream')

  if (!wantsSSE) {
    // Regular JSON response
    const leaderboard = await fetchLeaderboard(tournamentId)
    return Response.json({ success: true, data: leaderboard })
  }

  // Server-Sent Events stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const initialData = await fetchLeaderboard(tournamentId)
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
      )

      // Set up interval to send updates
      const interval = setInterval(async () => {
        try {
          const data = await fetchLeaderboard(tournamentId)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )
        } catch (error) {
          console.error('Error fetching leaderboard:', error)
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch data' })}\n\n`)
          )
        }
      }, 5000) // Update every 5 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function fetchLeaderboard(tournamentId: string) {
  // Fetch all scorecards for this tournament
  const scorecards = await prisma.scorecard.findMany({
    where: {
      tournamentId,
      status: {
        in: ['IN_PROGRESS', 'SUBMITTED', 'VERIFIED'],
      },
    },
    include: {
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          handicapIndex: true,
        },
      },
    },
    orderBy: [
      { totalPoints: 'desc' }, // Stableford: highest points wins
      { totalNet: 'asc' },      // Stroke play: lowest net wins
    ],
  })

  // Transform to leaderboard format
  const leaderboard = scorecards.map((scorecard, index) => ({
    position: index + 1,
    playerId: scorecard.player.id,
    playerName: `${scorecard.player.firstName} ${scorecard.player.lastName}`,
    handicap: scorecard.player.handicapIndex.toString(),
    totalGross: scorecard.totalGross,
    totalNet: scorecard.totalNet,
    totalPoints: scorecard.totalPoints,
    status: scorecard.status,
    holesCompleted: Array.isArray(scorecard.scores) ? scorecard.scores.length : 0,
    thru: Array.isArray(scorecard.scores) ? `${scorecard.scores.length}` : '-',
  }))

  return {
    tournamentId,
    updatedAt: new Date().toISOString(),
    playerCount: leaderboard.length,
    leaderboard,
  }
}
