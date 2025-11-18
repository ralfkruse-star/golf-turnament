/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/infrastructure/services/email-service'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const registrationId = session.metadata?.registrationId

  if (!registrationId) {
    console.error('No registrationId in session metadata')
    return
  }

  try {
    // Update registration as paid
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paid: true,
        paidAt: new Date(),
        paymentMethod: 'stripe',
      },
      include: {
        tournament: true,
        player: true,
      },
    })

    console.log(`Registration ${registrationId} marked as paid`)

    // Send payment confirmation email
    try {
      await emailService.sendEmail({
        to: {
          email: registration.player.email,
          name: `${registration.player.firstName} ${registration.player.lastName}`,
        },
        subject: `Zahlungsbestätigung: ${registration.tournament.name}`,
        htmlContent: generatePaymentConfirmationEmail(registration),
        tags: ['payment-confirmation', 'transactional'],
      })
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError)
    }
  } catch (error) {
    console.error('Failed to update registration:', error)
  }
}

function generatePaymentConfirmationEmail(registration: any): string {
  const entryFee = Number(registration.tournament.entryFee)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2D7738; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2D7738; }
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Zahlung bestätigt</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <p>Hallo ${registration.player.firstName},</p>
            <p>Ihre Zahlung wurde erfolgreich verarbeitet!</p>

            <div class="details">
              <h3>Zahlungsdetails</h3>
              <p><strong>Turnier:</strong> ${registration.tournament.name}</p>
              <p><strong>Datum:</strong> ${new Date(registration.tournament.tournamentDate).toLocaleDateString('de-DE')}</p>
              <p><strong>Betrag:</strong> ${entryFee.toFixed(2)} €</p>
              <p><strong>Bezahlt am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
              <p><strong>Anmeldenummer:</strong> ${registration.id}</p>
            </div>

            <p>Sie sind nun offiziell für das Turnier angemeldet. Wir senden Ihnen weitere Informationen einige Tage vor dem Event.</p>

            <p>Wir freuen uns auf Ihre Teilnahme!</p>
            <p>Mit sportlichen Grüßen,<br>Ihr Golfplatz Siek Team</p>
          </div>
          <div class="footer">
            <p>Golfplatz Siek | Siek, Schleswig-Holstein</p>
          </div>
        </div>
      </body>
    </html>
  `
}
