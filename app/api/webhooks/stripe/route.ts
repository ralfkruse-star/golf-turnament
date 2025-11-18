/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/infrastructure/services/email-service'
import { ClubService } from '@/infrastructure/services/club-service'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const clubService = new ClubService(prisma)

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

      // Club subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
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

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const clubId = subscription.metadata?.clubId

  if (!clubId) {
    console.error('No clubId in subscription metadata')
    return
  }

  try {
    // Map Stripe product/price to tier
    const tier = mapPriceToTier(subscription.items.data[0].price.id)

    // Calculate active until date
    const activeUntil = new Date(subscription.current_period_end * 1000)

    // Update club
    await clubService.syncStripeSubscription(clubId, {
      subscriptionId: subscription.id,
      tier,
      activeUntil,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    })

    console.log(`Subscription ${subscription.id} created for club ${clubId}`)
  } catch (error) {
    console.error('Failed to handle subscription created:', error)
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clubId = subscription.metadata?.clubId

  if (!clubId) {
    console.error('No clubId in subscription metadata')
    return
  }

  try {
    const tier = mapPriceToTier(subscription.items.data[0].price.id)
    const activeUntil = new Date(subscription.current_period_end * 1000)

    await clubService.syncStripeSubscription(clubId, {
      subscriptionId: subscription.id,
      tier,
      activeUntil,
    })

    // If subscription is canceled, suspend club
    if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
      // Don't suspend immediately, wait until period ends
      console.log(`Subscription ${subscription.id} will cancel at period end`)
    }

    console.log(`Subscription ${subscription.id} updated for club ${clubId}`)
  } catch (error) {
    console.error('Failed to handle subscription updated:', error)
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clubId = subscription.metadata?.clubId

  if (!clubId) {
    console.error('No clubId in subscription metadata')
    return
  }

  try {
    // Downgrade to FREE tier
    await clubService.syncStripeSubscription(clubId, {
      subscriptionId: null,
      tier: 'FREE',
      activeUntil: null,
    })

    console.log(`Subscription ${subscription.id} deleted for club ${clubId}`)
  } catch (error) {
    console.error('Failed to handle subscription deleted:', error)
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    return
  }

  try {
    // Reactivate club if it was suspended
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const clubId = subscription.metadata?.clubId

    if (clubId) {
      const club = await clubService.getClubById(clubId)

      if (club?.isSuspended) {
        await clubService.reactivateClub(clubId)
        console.log(`Club ${clubId} reactivated after payment`)
      }
    }
  } catch (error) {
    console.error('Failed to handle invoice payment succeeded:', error)
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    return
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const clubId = subscription.metadata?.clubId

    if (clubId) {
      // Suspend club after payment failure
      await clubService.suspendClub(clubId, 'Payment failed')
      console.log(`Club ${clubId} suspended due to payment failure`)
    }
  } catch (error) {
    console.error('Failed to handle invoice payment failed:', error)
  }
}

/**
 * Map Stripe price ID to club tier
 */
function mapPriceToTier(priceId: string): 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' {
  // Map your actual Stripe price IDs here
  const tierMap: Record<string, 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'> = {
    [process.env.STRIPE_PRICE_BASIC || 'price_basic']: 'BASIC',
    [process.env.STRIPE_PRICE_PREMIUM || 'price_premium']: 'PREMIUM',
    [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: 'ENTERPRISE',
  }

  return tierMap[priceId] || 'FREE'
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
