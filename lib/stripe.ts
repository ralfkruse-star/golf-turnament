/**
 * Stripe Client Configuration
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  currency: 'eur',
  successUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
  cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel`,
}
