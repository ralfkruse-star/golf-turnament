# Push Notifications - Quick Start Guide

## 5-Minute Setup

### 1. Generate VAPID Keys

```bash
pnpm generate-vapid
```

Copy the output to your `.env` file.

### 2. Add to .env

```env
VAPID_PUBLIC_KEY=BNx...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@golf-siek.de
```

### 3. Run Database Migration

```bash
pnpm db:push
```

Done! 🎉

---

## Common Use Cases

### Subscribe User to Notifications

```tsx
import { NotificationPrompt } from '@/components/push/notification-prompt'

export default function HomePage() {
  return (
    <NotificationPrompt
      defaultTopics={['tournaments', 'scores']}
      onSubscribe={() => console.log('Subscribed!')}
    />
  )
}
```

### Send Notification After Registration

```typescript
import { notifyRegistrationConfirmed } from '@/lib/notification-helpers'

// In your registration API endpoint
await notifyRegistrationConfirmed(
  userId,
  tournamentId,
  tournamentName
)
```

### Send Notification After Payment

```typescript
import { notifyPaymentReceived } from '@/lib/notification-helpers'

// In Stripe webhook
await notifyPaymentReceived(
  userId,
  tournamentId,
  tournamentName,
  amount
)
```

### Send Custom Notification

```typescript
import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'

const pushService = getPushService(prisma)

await pushService.sendNotification(userId, {
  title: 'Your Custom Title',
  body: 'Your custom message',
  url: '/path/to/page',
  icon: '/icons/icon-192x192.png',
})
```

---

## Available Templates

```typescript
import { notificationTemplates } from '@/lib/notification-templates'

// Use any template
const notification = notificationTemplates.tournamentStarted.create({
  tournamentId: '123',
  tournamentName: 'Club Championship',
})
```

**Available:**
- `registrationConfirmed`
- `tournamentStartingSoon`
- `tournamentStarted`
- `leaderboardUpdate`
- `tournamentCompleted`
- `flightAssigned`
- `paymentReceived`
- `scoreReminder`
- `photoUploaded`
- `newTournament`
- `scoreVerification`
- `announcement`

---

## UI Components

### Permission Prompt

```tsx
<NotificationPrompt
  defaultTopics={['tournaments']}
  onSubscribe={() => {}}
  onDismiss={() => {}}
/>
```

### Settings Page

```tsx
<NotificationPreferences userId={userId} />
```

### Preview Component

```tsx
<NotificationPreview
  notification={{
    title: 'Test',
    body: 'This is a test',
    icon: '/icon.png',
  }}
/>
```

---

## API Endpoints

### Subscribe

```typescript
POST /api/push/subscribe
{
  "subscription": { ... },
  "topics": ["tournaments", "scores"]
}
```

### Send (Admin Only)

```typescript
POST /api/push/send
{
  "target": "tournament",
  "targetId": "tournament-123",
  "notification": {
    "title": "Update",
    "body": "Message"
  }
}
```

### Test

```typescript
POST /api/push/test
// Sends test notification to current user
```

---

## Scheduled Notifications

### Setup Cron Job

**Vercel** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/notification-reminders",
    "schedule": "*/15 * * * *"
  }]
}
```

**Other platforms**:
```bash
*/15 * * * * curl https://your-domain.com/api/cron/notification-reminders
```

---

## Client-Side Usage

```typescript
import {
  subscribe,
  unsubscribe,
  isSubscribed,
  sendTestNotification,
} from '@/lib/push-manager'

// Check if subscribed
const subscribed = await isSubscribed()

// Subscribe
await subscribe(['tournaments', 'scores'])

// Unsubscribe
await unsubscribe()

// Test
await sendTestNotification()
```

---

## Troubleshooting

### Notifications not appearing?

1. Check browser permission: `chrome://settings/content/notifications`
2. Verify VAPID keys in `.env`
3. Ensure HTTPS (required by Web Push)
4. Check service worker registration
5. Look for errors in console

### Can't subscribe?

1. Check if service worker is active: `navigator.serviceWorker.ready`
2. Verify `/api/push/vapid-public-key` returns key
3. Check browser compatibility
4. Ensure user granted permission

### Database errors?

```bash
# Regenerate Prisma client
pnpm prisma generate

# Push schema changes
pnpm db:push
```

---

## Best Practices

✅ **DO:**
- Request permission at appropriate time
- Provide value before asking for permission
- Let users customize their preferences
- Send relevant, timely notifications
- Test on multiple devices

❌ **DON'T:**
- Request permission immediately on load
- Send notifications too frequently
- Send generic, irrelevant notifications
- Ignore user preferences
- Send during nighttime hours

---

## Support

For detailed documentation, see:
- [Full Documentation](/docs/PUSH_NOTIFICATIONS.md)
- [Implementation Report](/IMPLEMENTATION_REPORT.md)

For issues:
1. Check browser console for errors
2. Verify environment variables
3. Check service worker status
4. Review notification logs in database
