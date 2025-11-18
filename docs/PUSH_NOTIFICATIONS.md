# Push Notifications Implementation Guide

## Overview

This Golf Tournament Management app includes a comprehensive push notification system using the Web Push API with VAPID authentication. Users can receive real-time updates about tournaments, scores, and announcements.

## Features

- **Web Push API** with VAPID protocol
- **Topic-based subscriptions** (tournaments, scores, announcements, etc.)
- **Rich notifications** with images and action buttons
- **Notification grouping** by tournament
- **Deep linking** to specific pages
- **Scheduled notifications** (tournament reminders)
- **Failed delivery retry logic**
- **Stale subscription cleanup**
- **Admin notification sender**

## Setup

### 1. Generate VAPID Keys

```bash
pnpm generate-vapid
```

This will output VAPID keys. Add them to your `.env` file:

```env
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:admin@golf-siek.de
```

### 2. Database Migration

The Prisma schema already includes the necessary models:
- `PushSubscription` - Stores user subscriptions
- `NotificationLog` - Tracks sent notifications

Run migrations if needed:

```bash
pnpm db:push
```

### 3. Service Worker

The service worker (`/public/sw.js`) is already configured with push handlers. Make sure your app registers the service worker.

## Usage

### Client-Side: Subscribe to Notifications

```typescript
import { subscribe, requestPermission } from '@/lib/push-manager'

// Request permission and subscribe
async function enableNotifications() {
  const permission = await requestPermission()

  if (permission === 'granted') {
    await subscribe(['tournaments', 'scores', 'announcements'])
  }
}
```

### Client-Side: Using Components

```tsx
import { NotificationPrompt } from '@/components/push/notification-prompt'
import { NotificationPreferences } from '@/components/push/notification-preferences'

// Show permission prompt
<NotificationPrompt
  defaultTopics={['tournaments', 'announcements']}
  onSubscribe={() => console.log('Subscribed!')}
/>

// Settings page
<NotificationPreferences userId={userId} />
```

### Server-Side: Send Notifications

```typescript
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'

const pushService = getPushService(prisma)

// Send to specific user
await pushService.sendNotification(userId, {
  title: 'Tournament Update',
  body: 'Your tournament starts in 1 hour',
  url: '/tournaments/123',
  icon: '/icons/icon-192x192.png',
})

// Send to tournament participants
await pushService.sendToTournament(tournamentId, {
  title: 'Tournament Started',
  body: 'Good luck!',
  url: '/tournaments/123/leaderboard',
})

// Broadcast to topic
await pushService.sendBroadcast('tournaments', {
  title: 'New Tournament',
  body: 'Registration now open',
  url: '/tournaments/456',
})
```

### Server-Side: Using Helper Functions

```typescript
import {
  notifyRegistrationConfirmed,
  notifyPaymentReceived,
  notifyFlightAssigned
} from '@/lib/notification-helpers'

// After registration
await notifyRegistrationConfirmed(userId, tournamentId, tournamentName)

// After payment
await notifyPaymentReceived(userId, tournamentId, tournamentName, amount)

// After flight assignment
await notifyFlightAssigned(userId, tournamentId, flightNumber, startTime, startHole)
```

## Integration Examples

### Example 1: Tournament Registration

```typescript
// In /app/api/tournaments/[id]/register/route.ts

import { notifyRegistrationConfirmed } from '@/lib/notification-helpers'

export async function POST(request: NextRequest) {
  // ... registration logic ...

  // Send confirmation notification
  if (userId) {
    await notifyRegistrationConfirmed(
      userId,
      tournament.id,
      tournament.name
    )
  }

  return NextResponse.json({ success: true })
}
```

### Example 2: Payment Confirmation

```typescript
// In /app/api/webhooks/stripe/route.ts

import { notifyPaymentReceived } from '@/lib/notification-helpers'

if (event.type === 'checkout.session.completed') {
  const session = event.data.object

  // Send payment notification
  await notifyPaymentReceived(
    userId,
    tournamentId,
    tournamentName,
    amount
  )
}
```

### Example 3: Flight Assignment

```typescript
// After generating flights

import { notifyFlightAssigned } from '@/lib/notification-helpers'

for (const registration of registrations) {
  if (registration.player.user) {
    await notifyFlightAssigned(
      registration.player.user.id,
      tournament.id,
      registration.flight.flightNumber,
      registration.flight.startTime.toLocaleTimeString(),
      registration.flight.startHole
    )
  }
}
```

## Notification Templates

Pre-defined templates are available in `/lib/notification-templates.ts`:

- `registrationConfirmed` - Tournament registration confirmation
- `tournamentStartingSoon` - 1-hour reminder
- `tournamentStarted` - Tournament start notification
- `leaderboardUpdate` - Position changes (top 3)
- `tournamentCompleted` - Final results
- `flightAssigned` - Flight assignment
- `paymentReceived` - Payment confirmation
- `scoreReminder` - Score submission reminder
- `photoUploaded` - New tournament photos
- `newTournament` - New tournament announcement
- `scoreVerification` - Score verification request

## Scheduled Notifications

### Tournament Reminders

Set up a cron job to call `/api/cron/notification-reminders` every 15 minutes:

```bash
# Using crontab
*/15 * * * * curl https://your-domain.com/api/cron/notification-reminders

# Using Vercel Cron Jobs (vercel.json)
{
  "crons": [{
    "path": "/api/cron/notification-reminders",
    "schedule": "*/15 * * * *"
  }]
}
```

## Admin Interface

Admins can send custom notifications from `/admin/notifications`:

1. Select target type (user, tournament, or topic)
2. Enter target ID
3. Compose notification
4. Preview before sending
5. Send to recipients

## API Endpoints

- `POST /api/push/subscribe` - Subscribe to notifications
- `POST /api/push/unsubscribe` - Unsubscribe
- `PATCH /api/push/preferences` - Update preferences
- `GET /api/push/vapid-public-key` - Get public key
- `POST /api/push/send` - Send notification (admin only)
- `POST /api/push/test` - Send test notification

## Topics

Available notification topics:

- `tournaments` - Tournament updates (registration, start, results)
- `scores` - Score and leaderboard updates
- `announcements` - General club announcements
- `reminders` - Tournament reminders and deadlines
- `photos` - New tournament photos

## Best Practices

### Notification Content

- **Title**: Short and descriptive (max 100 characters)
- **Body**: Clear and actionable (max 300 characters)
- **URL**: Always provide a relevant deep link
- **Timing**: Send during appropriate hours (8am - 10pm)
- **Frequency**: Don't spam users with too many notifications

### Images

- Use images sparingly for important announcements
- Keep file sizes small for faster loading
- Use landscape orientation for best display

### Actions

- Limit to 2 action buttons
- Make actions clear and concise
- Ensure actions lead to relevant pages

### Testing

1. Subscribe to notifications in development
2. Send test notifications
3. Test on both mobile and desktop
4. Verify deep linking works correctly
5. Check notification appearance on different browsers

## Troubleshooting

### Notifications not appearing

1. Check browser permissions (Notification permission granted?)
2. Verify VAPID keys are set correctly
3. Check service worker is registered
4. Look for errors in browser console
5. Verify user has active subscriptions

### Subscription fails

1. Ensure service worker is running
2. Check VAPID public key is accessible at `/api/push/vapid-public-key`
3. Verify HTTPS is enabled (required for Web Push)
4. Check browser compatibility

### Cleanup stale subscriptions

Run periodically:

```typescript
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'

const pushService = getPushService(prisma)
const cleaned = await pushService.cleanupStaleSubscriptions()
console.log(`Removed ${cleaned} stale subscriptions`)
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari (iOS 16.4+): ✅ Full support
- Opera: ✅ Full support
- Safari (macOS): ✅ Full support

## Security

- VAPID private key must be kept secret
- Never commit VAPID keys to version control
- Verify cron job requests with `CRON_SECRET`
- Validate admin permissions before sending notifications

## Performance

- Notifications are sent asynchronously
- Failed deliveries are retried automatically
- Stale subscriptions are cleaned up automatically
- Batch notifications for better performance

## Analytics

Track notification performance:
- Display rate (how many notifications were shown)
- Click-through rate (how many were clicked)
- Dismissal rate (how many were dismissed)

Analytics endpoints are already set up in `/api/analytics/`.

## Future Enhancements

- [ ] Notification scheduling UI
- [ ] A/B testing for notification content
- [ ] User-specific notification preferences
- [ ] Notification templates editor
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Silent background notifications

## Support

For issues or questions, contact the development team or refer to:
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [MDN Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
