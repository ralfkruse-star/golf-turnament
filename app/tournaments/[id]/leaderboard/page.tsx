/**
 * Live Leaderboard Page
 * Real-time tournament standings with SSE
 */

'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type LeaderboardEntry = {
  position: number
  playerId: string
  playerName: string
  handicap: string
  totalGross?: number | null
  totalNet?: number | null
  totalPoints?: number | null
  status: string
  holesCompleted: number
  thru: string
}

type LeaderboardData = {
  tournamentId: string
  updatedAt: string
  playerCount: number
  leaderboard: LeaderboardEntry[]
}

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [tournamentId, setTournamentId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => {
      setTournamentId(id)
    })
  }, [params])

  useEffect(() => {
    if (!tournamentId) return

    // Connect to SSE endpoint
    const eventSource = new EventSource(
      `/api/tournaments/${tournamentId}/leaderboard`
    )

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      const newData = JSON.parse(event.data)
      setData(newData)
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [tournamentId])

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-pulse">Lade Leaderboard...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Live Leaderboard</h1>
              <p className="text-sm text-muted-foreground">
                {data.playerCount} Spieler • Aktualisiert:{' '}
                {new Date(data.updatedAt).toLocaleTimeString('de-DE')}
              </p>
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Rangliste</CardTitle>
            <CardDescription>Sortiert nach Stableford-Punkten</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="p-3 font-semibold">Pos</th>
                    <th className="p-3 font-semibold">Spieler</th>
                    <th className="p-3 font-semibold text-center">HCP</th>
                    <th className="p-3 font-semibold text-center">Thru</th>
                    <th className="p-3 font-semibold text-center">Punkte</th>
                    <th className="p-3 font-semibold text-center">Brutto</th>
                    <th className="p-3 font-semibold text-center">Netto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((entry, idx) => {
                    const isLeader = entry.position === 1
                    const isTopThree = entry.position <= 3

                    return (
                      <tr
                        key={entry.playerId}
                        className={`
                          border-b hover:bg-muted/50 transition-colors
                          ${isLeader ? 'bg-primary/10 font-semibold' : ''}
                        `}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={isTopThree ? 'text-lg' : ''}>
                              {entry.position}
                              {isTopThree && entry.position === 1 && ' 🥇'}
                              {isTopThree && entry.position === 2 && ' 🥈'}
                              {isTopThree && entry.position === 3 && ' 🥉'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className={isLeader ? 'font-bold' : ''}>
                              {entry.playerName}
                            </div>
                            {entry.status === 'IN_PROGRESS' && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Spielt
                              </Badge>
                            )}
                            {entry.status === 'SUBMITTED' && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Abgegeben
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {entry.handicap}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{entry.thru}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-lg font-bold text-primary">
                            {entry.totalPoints || '-'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {entry.totalGross || '-'}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {entry.totalNet || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {data.leaderboard.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  Noch keine Scorecards abgegeben
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
