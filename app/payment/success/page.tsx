/**
 * Payment Success Page
 * Shown after successful Stripe payment
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    // In production, verify the payment with backend
    const sessionId = searchParams.get('session_id')
    const registrationId = searchParams.get('registration_id')

    if (sessionId && registrationId) {
      // TODO: Verify payment status with backend
      setVerified(true)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <CardTitle className="text-3xl text-primary">
              Zahlung erfolgreich!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-lg">
              Vielen Dank! Ihre Zahlung wurde erfolgreich verarbeitet.
            </p>

            <div className="bg-muted p-6 rounded-lg">
              <p className="font-semibold mb-2">Was passiert jetzt?</p>
              <ul className="text-sm text-left space-y-2">
                <li>✅ Sie erhalten eine Bestätigungs-E-Mail</li>
                <li>✅ Ihre Anmeldung ist nun abgeschlossen</li>
                <li>✅ Wir senden Ihnen Details zum Turnier einige Tage vorher</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Link href="/profile">
                <Button>Zum Profil</Button>
              </Link>
              <Link href="/tournaments">
                <Button variant="outline">Weitere Turniere</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
