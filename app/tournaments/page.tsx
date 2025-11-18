/**
 * Tournament List Page
 * Displays all tournaments with filters
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrismaTournamentRepository } from '@/infrastructure/repositories/tournament-repository'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const tournamentRepository = new PrismaTournamentRepository()

export default async function TournamentsPage() {
  const tournaments = await tournamentRepository.findAll()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Turniere</h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie alle Turniere auf Golfplatz Siek
          </p>
        </div>
        <Link href="/tournaments/new">
          <Button size="lg">+ Neues Turnier</Button>
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Noch keine Turniere angelegt
            </p>
            <Link href="/tournaments/new">
              <Button>Erstes Turnier erstellen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const data = tournament.toJSON()
            return (
              <Card key={data.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{data.name}</CardTitle>
                    <TournamentStatusBadge status={data.status} />
                  </div>
                  <CardDescription>
                    {format(data.tournamentDate, 'PPP', { locale: de })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="font-medium">
                        {data.format.toDisplayName()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kategorie:</span>
                      <span className="font-medium">
                        {formatCategory(data.category)}
                      </span>
                    </div>
                    {data.maxPlayers && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Max. Spieler:
                        </span>
                        <span className="font-medium">{data.maxPlayers}</span>
                      </div>
                    )}
                    {data.entryFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Startgebühr:
                        </span>
                        <span className="font-medium">
                          {data.entryFee.toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/tournaments/${data.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      Details anzeigen
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TournamentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; label: string }> = {
    DRAFT: { variant: 'outline', label: 'Entwurf' },
    OPEN_FOR_REGISTRATION: { variant: 'default', label: 'Anmeldung offen' },
    REGISTRATION_CLOSED: { variant: 'secondary', label: 'Anmeldung geschlossen' },
    IN_PROGRESS: { variant: 'default', label: 'Läuft' },
    COMPLETED: { variant: 'secondary', label: 'Beendet' },
    CANCELLED: { variant: 'destructive', label: 'Abgesagt' },
    ARCHIVED: { variant: 'outline', label: 'Archiviert' },
  }

  const config = variants[status] || { variant: 'outline', label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    CLUB_CHAMPIONSHIP: 'Clubmeisterschaft',
    MONTHLY_MEDAL: 'Monatsturnier',
    CORPORATE_EVENT: 'Firmenturnier',
    CHARITY: 'Charity-Turnier',
    MEMBER_GUEST: 'Mitglieder-Gast',
    PRO_AM: 'Pro-Am',
    CASUAL: 'Freundschaftsturnier',
  }

  return categories[category] || category
}
