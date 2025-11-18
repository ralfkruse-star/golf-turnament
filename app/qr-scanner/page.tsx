/**
 * QR Code Scanner Page
 * Scan QR codes for check-in, scoring, or registration
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async (scanData: string) => {
    try {
      setScanning(true)
      setError(null)

      // Parse QR data
      const parsedData = JSON.parse(scanData)

      // Process based on type
      if (parsedData.type === 'checkin') {
        const response = await fetch('/api/qr/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrData: scanData }),
        })

        const data = await response.json()

        if (data.success) {
          setResult(data.data)
        } else {
          setError(data.error)
        }
      } else if (parsedData.type === 'scoring') {
        // Redirect to scoring page
        window.location.href = `/scoring/${parsedData.scorecard}`
      } else {
        setError('Unbekannter QR-Code-Typ')
      }
    } catch (err) {
      setError('Fehler beim Scannen des QR-Codes')
    } finally {
      setScanning(false)
    }
  }

  const simulateScan = () => {
    // Mock QR data for testing
    const mockQRData = JSON.stringify({
      type: 'checkin',
      tournament: 'tournament-123',
      player: 'player-456',
      registration: 'reg-789',
      timestamp: Date.now(),
    })

    handleScan(mockQRData)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">QR-Code Scanner</CardTitle>
            <CardDescription>
              Scannen Sie QR-Codes für Check-In, Scoring oder Registrierung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Camera View (placeholder) */}
            <div className="bg-muted rounded-lg aspect-square flex items-center justify-center">
              {scanning ? (
                <div className="text-center">
                  <div className="animate-pulse text-4xl mb-4">📷</div>
                  <p className="text-lg">Scanning...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-muted-foreground">
                    Kamera-Vorschau würde hier erscheinen
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    (React QR Scanner Integration erforderlich)
                  </p>
                </div>
              )}
            </div>

            {/* Result Display */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">✅</div>
                  <div>
                    <h3 className="font-bold text-lg">Check-In erfolgreich!</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.player.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnier:</span>
                    <span className="font-medium">{result.tournament.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Handicap:</span>
                    <span className="font-medium">{result.player.handicap}</span>
                  </div>
                  {result.flight && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Flight:</span>
                      <Badge>{result.flight}</Badge>
                    </div>
                  )}
                  {result.tee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Abschlag:</span>
                      <Badge variant="outline">{result.tee}</Badge>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => setResult(null)}
                >
                  Weiter scannen
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">❌</div>
                  <div>
                    <h4 className="font-semibold">Fehler</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setError(null)}
                >
                  Erneut versuchen
                </Button>
              </div>
            )}

            {/* Test Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={simulateScan}
                disabled={scanning}
              >
                🧪 Test-Scan simulieren
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Für Entwicklungs- und Testzwecke
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-muted p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Anleitung:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• QR-Code vor die Kamera halten</li>
                <li>• Code wird automatisch erkannt</li>
                <li>• Check-In wird sofort verarbeitet</li>
                <li>• Flight-Informationen werden angezeigt</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* QR Types Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>QR-Code-Typen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 border rounded">
                <div className="text-2xl">📍</div>
                <div>
                  <h4 className="font-semibold">Check-In</h4>
                  <p className="text-sm text-muted-foreground">
                    Spieler-Check-In am Starter
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded">
                <div className="text-2xl">⛳</div>
                <div>
                  <h4 className="font-semibold">Scoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Schneller Zugang zur Score-Eingabe
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded">
                <div className="text-2xl">📝</div>
                <div>
                  <h4 className="font-semibold">Registrierung</h4>
                  <p className="text-sm text-muted-foreground">
                    Bestätigung der Turnier-Anmeldung
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
