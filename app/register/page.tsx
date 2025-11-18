/**
 * Player Registration Page
 * New player sign-up flow
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE' as const,
    handicapIndex: '',
    homeClub: 'Golfplatz Siek',
    membershipType: 'GUEST' as const,
    consentGiven: false,
    marketingConsent: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          handicapIndex: parseFloat(formData.handicapIndex),
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.')
        router.push('/profile')
      } else {
        alert(`Fehler: ${data.error}`)
      }
    } catch (error) {
      alert('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Spieler-Registrierung</CardTitle>
          <CardDescription>
            Erstellen Sie Ihr Profil für Golfplatz Siek
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Persönliche Daten</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="+49 151 12345678"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Geburtsdatum
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Geschlecht
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="MALE">Männlich</option>
                    <option value="FEMALE">Weiblich</option>
                    <option value="OTHER">Divers</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Golf Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Golf-Informationen</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Handicap Index *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-10"
                    max="54"
                    required
                    value={formData.handicapIndex}
                    onChange={(e) => setFormData({ ...formData, handicapIndex: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="18.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    WHS Handicap (-10.0 bis 54.0)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Heimatclub
                  </label>
                  <input
                    type="text"
                    value={formData.homeClub}
                    onChange={(e) => setFormData({ ...formData, homeClub: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mitgliedschaft
                </label>
                <select
                  value={formData.membershipType}
                  onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="GUEST">Gast</option>
                  <option value="MEMBER">Mitglied</option>
                  <option value="CORPORATE">Firmenmitglied</option>
                  <option value="TRIAL">Schnuppermitglied</option>
                </select>
              </div>
            </div>

            {/* Consent */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Datenschutz & Einwilligungen</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    Ich habe die{' '}
                    <a href="/privacy" className="text-primary underline">
                      Datenschutzerklärung
                    </a>{' '}
                    gelesen und stimme der Verarbeitung meiner Daten zu. *
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    Ich möchte Informationen über Turniere und Veranstaltungen per E-Mail erhalten.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.consentGiven}
              >
                {loading ? 'Wird registriert...' : 'Registrieren'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
