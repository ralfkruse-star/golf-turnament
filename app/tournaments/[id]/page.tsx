/**
 * Tournament Detail Page
 * Shows tournament details and allows management actions
 */

import { notFound } from 'next/navigation'
import { PrismaTournamentRepository } from '@/infrastructure/repositories/tournament-repository'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'

const tournamentRepository = new PrismaTournamentRepository()

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params
  const tournament = await tournamentRepository.findById(id)

  if (!tournament) {
    notFound()
  }

  const data = tournament.toJSON()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/tournaments">
          <Button variant="ghost">← Zurück zur Übersicht</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl mb-2">{data.name}</CardTitle>
                  <CardDescription className="text-base">
                    {data.description || 'Keine Beschreibung vorhanden'}
                  </CardDescription>
                </div>
                <Badge variant={getStatusVariant(data.status)}>
                  {getStatusLabel(data.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Turnierdatum</h4>
                  <p className="text-muted-foreground">
                    {format(data.tournamentDate, 'PPP', { locale: de })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(data.tournamentDate, 'HH:mm')} Uhr
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Format</h4>
                  <p className="text-muted-foreground">
                    {data.format.toDisplayName()}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Anmeldung</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(data.registrationStart, 'PP', { locale: de })}
                    {' bis '}
                    {format(data.registrationEnd, 'PP', { locale: de })}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Spieler</h4>
                  <p className="text-muted-foreground">
                    {data.minPlayers} - {data.maxPlayers || '∞'} Spieler
                  </p>
                </div>

                {data.entryFee && (
                  <div>
                    <h4 className="font-semibold mb-2">Startgebühr</h4>
                    <p className="text-muted-foreground">
                      {data.entryFee.toFixed(2)} €
                    </p>
                  </div>
                )}

                {data.maxHandicap && (
                  <div>
                    <h4 className="font-semibold mb-2">Max. Handicap</h4>
                    <p className="text-muted-foreground">{data.maxHandicap}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {data.requireHandicap && (
                  <Badge variant="outline">Handicap erforderlich</Badge>
                )}
                {data.allowGuests && (
                  <Badge variant="outline">Gäste erlaubt</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Registrations */}
          <Card>
            <CardHeader>
              <CardTitle>Anmeldungen</CardTitle>
              <CardDescription>
                Übersicht aller angemeldeten Spieler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Noch keine Anmeldungen vorhanden
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.status === 'DRAFT' && (
                <Button className="w-full">Für Anmeldung freigeben</Button>
              )}

              {data.status === 'OPEN_FOR_REGISTRATION' && (
                <>
                  <Button className="w-full">Anmeldung schließen</Button>
                  <Button variant="outline" className="w-full">
                    Flights generieren
                  </Button>
                </>
              )}

              {data.status === 'REGISTRATION_CLOSED' && (
                <>
                  <Button className="w-full">Turnier starten</Button>
                  <Button variant="outline" className="w-full">
                    Scorekarten erstellen
                  </Button>
                </>
              )}

              {data.status === 'IN_PROGRESS' && (
                <>
                  <Link href={`/tournaments/${data.id}/leaderboard`}>
                    <Button variant="outline" className="w-full">
                      Live Leaderboard
                    </Button>
                  </Link>
                  <Button className="w-full">Turnier beenden</Button>
                </>
              )}

              {!['COMPLETED', 'CANCELLED'].includes(data.status) && (
                <Button variant="destructive" className="w-full">
                  Turnier absagen
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Anmeldungen</span>
                  <span className="font-medium">0 / {data.maxPlayers || '∞'}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getStatusVariant(status: string): any {
  const variants: Record<string, any> = {
    DRAFT: 'outline',
    OPEN_FOR_REGISTRATION: 'default',
    REGISTRATION_CLOSED: 'secondary',
    IN_PROGRESS: 'default',
    COMPLETED: 'secondary',
    CANCELLED: 'destructive',
  }
  return variants[status] || 'outline'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Entwurf',
    OPEN_FOR_REGISTRATION: 'Anmeldung offen',
    REGISTRATION_CLOSED: 'Anmeldung geschlossen',
    IN_PROGRESS: 'Läuft',
    COMPLETED: 'Beendet',
    CANCELLED: 'Abgesagt',
  }
  return labels[status] || status
}
