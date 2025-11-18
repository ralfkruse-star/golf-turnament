/**
 * Flight Management Page
 * View and manage tournament flights
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Flight = {
  id: string
  flightNumber: number
  startTime: Date
  startHole: number
  players: {
    id: string
    name: string
    handicap: string
    tee?: string
    cart: boolean
  }[]
}

export default function FlightManagementPage() {
  const params = useParams()
  const tournamentId = params.id as string

  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchFlights()
  }, [])

  const fetchFlights = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/flights`)
      const data = await response.json()

      if (data.success) {
        setFlights(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch flights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFlights = async () => {
    setGenerating(true)

    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)

      const response = await fetch(`/api/tournaments/${tournamentId}/flights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playersPerFlight: 4,
          intervalMinutes: 10,
          startTime: tomorrow.toISOString(),
          startHole: 1,
          groupingStrategy: 'handicap',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`${data.data.flightCount} Flights erfolgreich generiert!`)
        fetchFlights()
      } else {
        alert(`Fehler: ${data.error}`)
      }
    } catch (error) {
      alert('Netzwerkfehler')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Lade Flights...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Flight-Verwaltung</h1>
            <p className="text-muted-foreground mt-2">
              {flights.length} Flights • {flights.reduce((sum, f) => sum + f.players.length, 0)} Spieler
            </p>
          </div>
          <Button onClick={handleGenerateFlights} disabled={generating} size="lg">
            {generating ? 'Generiere...' : 'Flights generieren'}
          </Button>
        </div>

        {flights.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Noch keine Flights generiert
              </p>
              <Button onClick={handleGenerateFlights} disabled={generating}>
                Jetzt generieren
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => (
              <Card key={flight.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Flight {flight.flightNumber}</CardTitle>
                      <CardDescription>
                        {new Date(flight.startTime).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        Uhr • Loch {flight.startHole}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{flight.players.length} Spieler</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {flight.players.map((player, idx) => (
                      <div
                        key={player.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold">{player.name}</div>
                          {idx === 0 && <Badge variant="outline">1</Badge>}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-muted-foreground">HCP: {player.handicap}</div>
                          {player.tee && (
                            <div className="text-muted-foreground">Abschlag: {player.tee}</div>
                          )}
                          {player.cart && <Badge variant="secondary" className="text-xs">Cart</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Print View */}
        {flights.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Druckansicht</CardTitle>
              <CardDescription>Startliste für den Starter</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                🖨️ Startliste drucken
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
