/**
 * Admin Dashboard
 * Overview of tournaments, players, and stats
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type DashboardStats = {
  tournaments: {
    total: number
    active: number
    draft: number
    completed: number
  }
  players: {
    total: number
    newThisMonth: number
    members: number
    guests: number
  }
  registrations: {
    total: number
    thisMonth: number
    pendingPayment: number
  }
  revenue: {
    total: number
    thisMonth: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch actual stats from API
    // Mock data for now
    setTimeout(() => {
      setStats({
        tournaments: { total: 24, active: 3, draft: 2, completed: 19 },
        players: { total: 847, newThisMonth: 23, members: 812, guests: 35 },
        registrations: { total: 1247, thisMonth: 127, pendingPayment: 8 },
        revenue: { total: 43750, thisMonth: 4450 },
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Lade Dashboard...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Übersicht über Turniere, Spieler und Statistiken
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aktive Turniere</CardDescription>
            <CardTitle className="text-4xl">{stats?.tournaments.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.tournaments.draft} Entwürfe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Spieler gesamt</CardDescription>
            <CardTitle className="text-4xl">{stats?.players.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600">
              +{stats?.players.newThisMonth} diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Anmeldungen (Monat)</CardDescription>
            <CardTitle className="text-4xl">{stats?.registrations.thisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600">
              {stats?.registrations.pendingPayment} offene Zahlungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Umsatz (Monat)</CardDescription>
            <CardTitle className="text-4xl">
              {stats?.revenue.thisMonth.toLocaleString('de-DE')}€
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.revenue.total.toLocaleString('de-DE')}€ gesamt
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tournaments */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Aktuelle Turniere</CardTitle>
                <CardDescription>Laufende und geplante Turniere</CardDescription>
              </div>
              <Link href="/admin/tournaments">
                <Button variant="outline" size="sm">Alle</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Herbst-Clubmeisterschaft', status: 'IN_PROGRESS', players: 48 },
                { name: 'Winter-Cup 2025', status: 'OPEN_FOR_REGISTRATION', players: 23 },
                { name: 'Neujahrsturnier', status: 'DRAFT', players: 0 },
              ].map((tournament, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.players} Spieler
                    </div>
                  </div>
                  <Badge variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'outline'}>
                    {tournament.status === 'IN_PROGRESS' && 'Läuft'}
                    {tournament.status === 'OPEN_FOR_REGISTRATION' && 'Offen'}
                    {tournament.status === 'DRAFT' && 'Entwurf'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Neueste Anmeldungen</CardTitle>
                <CardDescription>Letzte 24 Stunden</CardDescription>
              </div>
              <Link href="/admin/registrations">
                <Button variant="outline" size="sm">Alle</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { player: 'Max Mustermann', tournament: 'Herbst-Cup', paid: true },
                { player: 'Anna Schmidt', tournament: 'Winter-Cup', paid: false },
                { player: 'Peter Müller', tournament: 'Herbst-Cup', paid: true },
              ].map((reg, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{reg.player}</div>
                    <div className="text-sm text-muted-foreground">{reg.tournament}</div>
                  </div>
                  <Badge variant={reg.paid ? 'default' : 'outline'}>
                    {reg.paid ? '✓ Bezahlt' : 'Ausstehend'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/tournaments/new">
              <Button className="w-full">+ Turnier erstellen</Button>
            </Link>
            <Link href="/admin/players">
              <Button variant="outline" className="w-full">Spieler verwalten</Button>
            </Link>
            <Link href="/admin/flights">
              <Button variant="outline" className="w-full">Flights generieren</Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full">Reports</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
