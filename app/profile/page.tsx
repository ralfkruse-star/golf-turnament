/**
 * Player Profile Page
 * View and edit player profile, view tournament history
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PlayerProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  handicapIndex: string
  membershipType: string
  memberNumber?: string
  homeClub?: string
  memberSince?: string
  stats?: {
    tournamentsPlayed: number
    bestFinish: number
    avgGross: number
    avgNet: number
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch actual player profile from API
    // For now, mock data
    setTimeout(() => {
      setProfile({
        id: 'player-123',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 151 12345678',
        handicapIndex: '18.5',
        membershipType: 'MEMBER',
        memberNumber: 'M-001',
        homeClub: 'Golfplatz Siek',
        memberSince: '2023-01-15',
        stats: {
          tournamentsPlayed: 12,
          bestFinish: 2,
          avgGross: 87,
          avgNet: 69,
        },
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">Lade Profil...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Kein Profil gefunden</p>
            <Button onClick={() => window.location.href = '/register'}>
              Jetzt registrieren
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">
                  {profile.firstName} {profile.lastName}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {profile.email}
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-1">
                {getMembershipLabel(profile.membershipType)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{profile.handicapIndex}</div>
                <div className="text-sm text-muted-foreground">Handicap</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{profile.stats?.tournamentsPlayed || 0}</div>
                <div className="text-sm text-muted-foreground">Turniere</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {profile.stats?.bestFinish ? `#${profile.stats.bestFinish}` : '-'}
                </div>
                <div className="text-sm text-muted-foreground">Beste Platzierung</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{profile.stats?.avgNet || '-'}</div>
                <div className="text-sm text-muted-foreground">Ø Netto</div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button className="flex-1">Profil bearbeiten</Button>
              <Button variant="outline">Handicap aktualisieren</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tournament History */}
        <Card>
          <CardHeader>
            <CardTitle>Turnier-Historie</CardTitle>
            <CardDescription>Ihre letzten Turnierteilnahmen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Herbst-Clubmeisterschaft', date: '15.09.2024', position: 2, points: 42 },
                { name: 'Sommer-Cup', date: '12.07.2024', position: 8, points: 38 },
                { name: 'Frühlingsturnier', date: '20.04.2024', position: 5, points: 40 },
              ].map((tournament, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-semibold">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">{tournament.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      Platz {tournament.position}
                      {tournament.position <= 3 && (
                        <span className="ml-2">
                          {tournament.position === 1 && '🥇'}
                          {tournament.position === 2 && '🥈'}
                          {tournament.position === 3 && '🥉'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.points} Punkte
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              Alle Turniere anzeigen
            </Button>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Persönliche Daten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Telefon</dt>
                <dd className="mt-1">{profile.phone || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Mitgliedsnummer</dt>
                <dd className="mt-1">{profile.memberNumber || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Heimatclub</dt>
                <dd className="mt-1">{profile.homeClub || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Mitglied seit</dt>
                <dd className="mt-1">
                  {profile.memberSince
                    ? new Date(profile.memberSince).toLocaleDateString('de-DE')
                    : '-'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getMembershipLabel(type: string): string {
  const labels: Record<string, string> = {
    MEMBER: 'Mitglied',
    GUEST: 'Gast',
    CORPORATE: 'Firmenmitglied',
    TRIAL: 'Schnuppermitglied',
  }
  return labels[type] || type
}
