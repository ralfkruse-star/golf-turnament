/**
 * Notification Templates
 * Pre-defined notification templates for various events
 */

import { PushNotification } from '@/infrastructure/services/push-service'

export interface NotificationTemplate {
  create: (data: Record<string, unknown>) => PushNotification
}

/**
 * Tournament Registration Confirmation
 */
export const registrationConfirmed: NotificationTemplate = {
  create: (data) => ({
    title: 'Registration Confirmed',
    body: `You're registered for ${data.tournamentName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}`,
    tag: `registration-${data.tournamentId}`,
    data: {
      type: 'registration',
      tournamentId: data.tournamentId,
    },
    actions: [
      {
        action: 'view',
        title: 'View Tournament',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }),
}

/**
 * Tournament Starting Soon (1 hour before)
 */
export const tournamentStartingSoon: NotificationTemplate = {
  create: (data) => ({
    title: 'Tournament Starting Soon',
    body: `${data.tournamentName} starts in 1 hour. Get ready!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}`,
    tag: `reminder-${data.tournamentId}`,
    data: {
      type: 'reminder',
      tournamentId: data.tournamentId,
      startTime: data.startTime,
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
      },
      {
        action: 'checkin',
        title: 'Check In',
      },
    ],
  }),
}

/**
 * Tournament Started
 */
export const tournamentStarted: NotificationTemplate = {
  create: (data) => ({
    title: 'Tournament Started',
    body: `${data.tournamentName} has begun. Good luck!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}/leaderboard`,
    tag: `started-${data.tournamentId}`,
    data: {
      type: 'tournament-started',
      tournamentId: data.tournamentId,
    },
    actions: [
      {
        action: 'leaderboard',
        title: 'Leaderboard',
      },
      {
        action: 'scoring',
        title: 'Enter Scores',
      },
    ],
  }),
}

/**
 * Leaderboard Position Change (Top 3)
 */
export const leaderboardUpdate: NotificationTemplate = {
  create: (data) => ({
    title: 'Leaderboard Update',
    body: `You're now in ${data.position}${getOrdinalSuffix(data.position as number)} place!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}/leaderboard`,
    tag: `leaderboard-${data.tournamentId}`,
    data: {
      type: 'leaderboard-update',
      tournamentId: data.tournamentId,
      position: data.position,
      score: data.score,
    },
    actions: [
      {
        action: 'view',
        title: 'View Leaderboard',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }),
}

/**
 * Tournament Completed
 */
export const tournamentCompleted: NotificationTemplate = {
  create: (data) => ({
    title: 'Tournament Complete',
    body: `${data.tournamentName} has ended. Final position: ${data.position}${getOrdinalSuffix(data.position as number)}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}/leaderboard`,
    tag: `completed-${data.tournamentId}`,
    image: data.winnerPhoto as string | undefined,
    data: {
      type: 'tournament-completed',
      tournamentId: data.tournamentId,
      position: data.position,
      score: data.score,
    },
    actions: [
      {
        action: 'view',
        title: 'View Results',
      },
      {
        action: 'share',
        title: 'Share',
      },
    ],
  }),
}

/**
 * Flight Assignment
 */
export const flightAssigned: NotificationTemplate = {
  create: (data) => ({
    title: 'Flight Assignment',
    body: `You're in Flight ${data.flightNumber} starting at ${data.startTime}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}`,
    tag: `flight-${data.tournamentId}`,
    data: {
      type: 'flight-assigned',
      tournamentId: data.tournamentId,
      flightNumber: data.flightNumber,
      startTime: data.startTime,
      startHole: data.startHole,
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
      },
      {
        action: 'calendar',
        title: 'Add to Calendar',
      },
    ],
  }),
}

/**
 * Payment Received
 */
export const paymentReceived: NotificationTemplate = {
  create: (data) => ({
    title: 'Payment Confirmed',
    body: `Payment of €${data.amount} received for ${data.tournamentName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}`,
    tag: `payment-${data.tournamentId}`,
    data: {
      type: 'payment-received',
      tournamentId: data.tournamentId,
      amount: data.amount,
    },
    actions: [
      {
        action: 'view',
        title: 'View Receipt',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }),
}

/**
 * Score Submission Reminder
 */
export const scoreReminder: NotificationTemplate = {
  create: (data) => ({
    title: 'Submit Your Score',
    body: `Don't forget to submit your scorecard for ${data.tournamentName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/scoring/${data.scorecardId}`,
    tag: `score-reminder-${data.tournamentId}`,
    data: {
      type: 'score-reminder',
      tournamentId: data.tournamentId,
      scorecardId: data.scorecardId,
    },
    actions: [
      {
        action: 'submit',
        title: 'Submit Now',
      },
      {
        action: 'later',
        title: 'Remind Later',
      },
    ],
  }),
}

/**
 * New Photo Uploaded
 */
export const photoUploaded: NotificationTemplate = {
  create: (data) => ({
    title: 'New Tournament Photo',
    body: `New photos from ${data.tournamentName} are available`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.thumbnailUrl as string | undefined,
    url: `/tournaments/${data.tournamentId}/photos`,
    tag: `photo-${data.tournamentId}`,
    data: {
      type: 'photo-uploaded',
      tournamentId: data.tournamentId,
      photoId: data.photoId,
    },
    actions: [
      {
        action: 'view',
        title: 'View Photos',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }),
}

/**
 * New Tournament Announcement
 */
export const newTournament: NotificationTemplate = {
  create: (data) => ({
    title: 'New Tournament Available',
    body: `${data.tournamentName} - Registration open until ${data.registrationEnd}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/tournaments/${data.tournamentId}`,
    tag: `new-tournament-${data.tournamentId}`,
    data: {
      type: 'new-tournament',
      tournamentId: data.tournamentId,
    },
    actions: [
      {
        action: 'register',
        title: 'Register Now',
      },
      {
        action: 'view',
        title: 'View Details',
      },
    ],
  }),
}

/**
 * Score Verification Needed
 */
export const scoreVerification: NotificationTemplate = {
  create: (data) => ({
    title: 'Verify Scorecard',
    body: `Please verify the scorecard for ${data.playerName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: `/scoring/${data.scorecardId}/verify`,
    tag: `verify-${data.scorecardId}`,
    data: {
      type: 'score-verification',
      tournamentId: data.tournamentId,
      scorecardId: data.scorecardId,
    },
    actions: [
      {
        action: 'verify',
        title: 'Verify Now',
      },
      {
        action: 'later',
        title: 'Later',
      },
    ],
  }),
}

/**
 * General Announcement
 */
export const announcement: NotificationTemplate = {
  create: (data) => ({
    title: data.title as string,
    body: data.body as string,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: data.url as string || '/',
    tag: 'announcement',
    data: {
      type: 'announcement',
      ...data,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }),
}

/**
 * Helper function to get ordinal suffix
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100

  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
}

/**
 * Export all templates
 */
export const notificationTemplates = {
  registrationConfirmed,
  tournamentStartingSoon,
  tournamentStarted,
  leaderboardUpdate,
  tournamentCompleted,
  flightAssigned,
  paymentReceived,
  scoreReminder,
  photoUploaded,
  newTournament,
  scoreVerification,
  announcement,
}
