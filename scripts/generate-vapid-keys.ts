/**
 * VAPID Key Generation Script
 * Generates VAPID keys for Web Push Notifications
 * Run with: pnpm generate-vapid
 */

import webpush from 'web-push'

console.log('🔑 Generating VAPID keys for Web Push...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID keys generated successfully!\n')
console.log('Add these to your .env file:\n')
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('VAPID_SUBJECT=mailto:admin@golf-siek.de')
console.log('\n⚠️  Keep the VAPID_PRIVATE_KEY secret and never commit it to version control!')
console.log('\nNext steps:')
console.log('1. Copy the keys above to your .env file')
console.log('2. Update .env.example with placeholder values')
console.log('3. Restart your development server')
