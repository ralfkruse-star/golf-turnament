/**
 * Create Stripe Checkout Session
 * POST /api/payment/create-checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

const checkoutSchema = z.object({
  registrationId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId } = checkoutSchema.parse(body)

    // Get registration with tournament and player details
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        player: true,
      },
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    if (registration.paid) {
      return NextResponse.json(
        { success: false, error: 'Registration already paid' },
        { status: 400 }
      )
    }

    const entryFee = Number(registration.tournament.entryFee)
    if (!entryFee || entryFee <= 0) {
      return NextResponse.json(
        { success: false, error: 'No entry fee for this tournament' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: `Startgebühr: ${registration.tournament.name}`,
              description: `Turnier am ${new Date(registration.tournament.tournamentDate).toLocaleDateString('de-DE')}`,
              images: [],
            },
            unit_amount: Math.round(entryFee * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}&registration_id=${registrationId}`,
      cancel_url: `${STRIPE_CONFIG.cancelUrl}?registration_id=${registrationId}`,
      customer_email: registration.player.email,
      metadata: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        playerId: registration.playerId,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
