# ADR-005: Notification System

**Status**: Accepted
**Date**: 2025-01-15
**Decision Makers**: Development Team
**Context**: Push notifications and email notifications (Phase 3)

## Context

We need to notify users about:
- Tournament updates (open, starting, completed)
- Score updates (live leaderboard changes)
- Registration confirmations
- Payment confirmations
- Reminders (tournament tomorrow, tee time in 1 hour)

## Decision

We will implement a **multi-channel notification system** with:
1. **Email** via Brevo (Sendinblue)
2. **Web Push Notifications** via Web Push API + VAPID
3. **Future**: SMS via Twilio (when budget allows)

### Email Notifications (Brevo)

**Why Brevo**:
- DSGVO compliant (EU-based)
- Generous free tier (300 emails/day)
- Transactional + Marketing emails
- Contact management
- Email templates
- Webhook support
- Affordable pricing

**Implementation**:
```typescript
import { brevoClient } from '@/lib/brevo'

async function sendTournamentConfirmation(registration: Registration) {
  await brevoClient.sendTransacEmail({
    to: [{ email: registration.player.email }],
    templateId: TEMPLATE_IDS.REGISTRATION_CONFIRMATION,
    params: {
      playerName: registration.player.firstName,
      tournamentName: registration.tournament.name,
      tournamentDate: formatDate(registration.tournament.tournamentDate),
    },
  })
}
```

### Push Notifications (Web Push API)

**Architecture**:
- VAPID keys for authentication
- Service Worker for receiving notifications
- Push API for sending
- PushSubscription model for managing subscriptions

**Subscription Flow**:
```typescript
// Client-side
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey,
})

await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify({ subscription }),
})
```

**Sending Notifications**:
```typescript
import webpush from 'web-push'

async function sendPushNotification(userId: string, notification: Notification) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, enabled: true },
  })

  await Promise.all(subscriptions.map(sub =>
    webpush.sendNotification(sub, JSON.stringify(notification))
  ))
}
```

### Notification Preferences

Users can configure:
- Email notifications (on/off per type)
- Push notifications (on/off per topic)
- Topics: tournaments, scores, announcements, reminders

```prisma
model PushSubscription {
  id      String   @id
  userId  String
  enabled Boolean  @default(true)
  topics  String[] // ["tournaments", "scores", "announcements"]
}
```

## Alternatives Considered

### Alternative 1: Firebase Cloud Messaging (FCM)
- **Pros**: Free, reliable, mobile apps support
- **Cons**: Google dependency, complex setup
- **Rejected**: Web Push API is standard and simpler

### Alternative 2: OneSignal
- **Pros**: Easy setup, multi-platform, free tier
- **Cons**: Vendor lock-in, limited customization
- **Rejected**: Prefer open standards

### Alternative 3: Custom Email Server
- **Pros**: Full control, no cost
- **Cons**: Deliverability issues, spam filters, maintenance
- **Rejected**: Not worth the effort

## Consequences

### Positive
- DSGVO compliant email service
- No vendor lock-in for push notifications
- User preference management
- Delivery tracking and analytics
- Cost-effective solution

### Negative
- Brevo dependency for emails
- Web Push doesn't work on iOS (Safari limitations)
- Need to maintain VAPID keys
- Complex subscription management

### Mitigations
- Fallback to email for iOS users
- Monitor email deliverability
- Backup VAPID keys securely
- Implement retry logic for failed sends

## Implementation Notes

1. **VAPID Keys**: Generate with `pnpm generate-vapid`
2. **Service Worker**: `/public/sw.js`
3. **Email Templates**: Create in Brevo dashboard
4. **Webhooks**: Handle bounces, unsubscribes
5. **Scheduled Notifications**: Use Vercel Cron

## Related Decisions
- ADR-001: Technology Stack
- ADR-006: Analytics (track notification engagement)
