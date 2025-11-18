/**
 * Brevo Webhook Handler
 * Handle events from Brevo (bounces, complaints, unsubscribes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Brevo webhook received:', body)

    const { event, email } = body

    if (!event || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload',
        },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event) {
      case 'hard_bounce':
      case 'soft_bounce':
        await handleBounce(email, event)
        break

      case 'blocked':
      case 'spam':
        await handleSpamComplaint(email)
        break

      case 'unsubscribed':
        await handleUnsubscribe(email)
        break

      case 'delivered':
      case 'opened':
      case 'click':
        // Log for analytics (optional)
        console.log(`Email ${event}: ${email}`)
        break

      default:
        console.log(`Unhandled event type: ${event}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    })
  } catch (error) {
    console.error('Error processing Brevo webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
      },
      { status: 500 }
    )
  }
}

/**
 * Handle email bounce
 */
async function handleBounce(email: string, type: string): Promise<void> {
  console.log(`Email bounce (${type}): ${email}`)

  // Update player record
  await prisma.player.updateMany({
    where: { email },
    data: {
      // Add a field to track email issues if needed
      // emailBounced: true,
      // lastBounceAt: new Date(),
    },
  })

  // For hard bounces, consider disabling email notifications
  if (type === 'hard_bounce') {
    // Could flag the player to not receive emails
    console.warn(`Hard bounce detected for ${email} - consider disabling emails`)
  }
}

/**
 * Handle spam complaint
 */
async function handleSpamComplaint(email: string): Promise<void> {
  console.log(`Spam complaint: ${email}`)

  // Update player to revoke marketing consent
  await prisma.player.updateMany({
    where: { email },
    data: {
      marketingConsent: false,
    },
  })
}

/**
 * Handle unsubscribe
 */
async function handleUnsubscribe(email: string): Promise<void> {
  console.log(`Unsubscribed: ${email}`)

  // Update player to revoke marketing consent
  await prisma.player.updateMany({
    where: { email },
    data: {
      marketingConsent: false,
    },
  })
}
