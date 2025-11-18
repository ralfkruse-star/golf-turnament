/**
 * Notification Helper Functions
 * Trigger notifications for various events in the application
 */

import { getPushService } from '@/infrastructure/services/push-service'
import { prisma } from '@/lib/prisma'
import { notificationTemplates } from '@/lib/notification-templates'

/**
 * Send registration confirmation notification
 */
export async function notifyRegistrationConfirmed(
  userId: string,
  tournamentId: string,
  tournamentName: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.registrationConfirmed.create({
      tournamentId,
      tournamentName,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send registration notification:', error)
  }
}

/**
 * Send tournament starting soon reminder (1 hour before)
 */
export async function notifyTournamentStartingSoon(
  tournamentId: string,
  tournamentName: string,
  startTime: Date
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.tournamentStartingSoon.create({
      tournamentId,
      tournamentName,
      startTime: startTime.toISOString(),
    })

    await pushService.sendToTournament(tournamentId, notification)
  } catch (error) {
    console.error('Failed to send tournament reminder:', error)
  }
}

/**
 * Send tournament started notification
 */
export async function notifyTournamentStarted(
  tournamentId: string,
  tournamentName: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.tournamentStarted.create({
      tournamentId,
      tournamentName,
    })

    await pushService.sendToTournament(tournamentId, notification)
  } catch (error) {
    console.error('Failed to send tournament started notification:', error)
  }
}

/**
 * Send leaderboard update notification (for top 3 positions)
 */
export async function notifyLeaderboardUpdate(
  userId: string,
  tournamentId: string,
  position: number,
  score: number
) {
  try {
    // Only notify for top 3 positions
    if (position > 3) return

    const pushService = getPushService(prisma)
    const notification = notificationTemplates.leaderboardUpdate.create({
      tournamentId,
      position,
      score,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send leaderboard update:', error)
  }
}

/**
 * Send tournament completed notification
 */
export async function notifyTournamentCompleted(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  position: number,
  score: number,
  winnerPhoto?: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.tournamentCompleted.create({
      tournamentId,
      tournamentName,
      position,
      score,
      winnerPhoto,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send tournament completed notification:', error)
  }
}

/**
 * Send flight assignment notification
 */
export async function notifyFlightAssigned(
  userId: string,
  tournamentId: string,
  flightNumber: number,
  startTime: string,
  startHole: number
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.flightAssigned.create({
      tournamentId,
      flightNumber,
      startTime,
      startHole,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send flight assignment notification:', error)
  }
}

/**
 * Send payment received notification
 */
export async function notifyPaymentReceived(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  amount: number
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.paymentReceived.create({
      tournamentId,
      tournamentName,
      amount,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send payment notification:', error)
  }
}

/**
 * Send score submission reminder
 */
export async function notifyScoreReminder(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  scorecardId: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.scoreReminder.create({
      tournamentId,
      tournamentName,
      scorecardId,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send score reminder:', error)
  }
}

/**
 * Send new photo uploaded notification
 */
export async function notifyPhotoUploaded(
  tournamentId: string,
  tournamentName: string,
  photoId: string,
  thumbnailUrl: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.photoUploaded.create({
      tournamentId,
      tournamentName,
      photoId,
      thumbnailUrl,
    })

    await pushService.sendToTournament(tournamentId, notification)
  } catch (error) {
    console.error('Failed to send photo notification:', error)
  }
}

/**
 * Send new tournament announcement
 */
export async function notifyNewTournament(
  tournamentId: string,
  tournamentName: string,
  registrationEnd: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.newTournament.create({
      tournamentId,
      tournamentName,
      registrationEnd,
    })

    // Broadcast to all users subscribed to tournaments topic
    await pushService.sendBroadcast('tournaments', notification)
  } catch (error) {
    console.error('Failed to send new tournament notification:', error)
  }
}

/**
 * Send score verification request
 */
export async function notifyScoreVerification(
  userId: string,
  tournamentId: string,
  scorecardId: string,
  playerName: string
) {
  try {
    const pushService = getPushService(prisma)
    const notification = notificationTemplates.scoreVerification.create({
      tournamentId,
      scorecardId,
      playerName,
    })

    await pushService.sendNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send score verification notification:', error)
  }
}

/**
 * Schedule tournament reminders
 * Should be called by a cron job or scheduled task
 */
export async function scheduleUpcomingTournamentReminders() {
  try {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // Find tournaments starting in approximately 1 hour
    const upcomingTournaments = await prisma.tournament.findMany({
      where: {
        tournamentDate: {
          gte: oneHourFromNow,
          lte: twoHoursFromNow,
        },
        status: {
          in: ['REGISTRATION_CLOSED', 'IN_PROGRESS'],
        },
      },
    })

    for (const tournament of upcomingTournaments) {
      await notifyTournamentStartingSoon(
        tournament.id,
        tournament.name,
        tournament.tournamentDate
      )
    }

    return upcomingTournaments.length
  } catch (error) {
    console.error('Failed to schedule tournament reminders:', error)
    return 0
  }
}

/**
 * Send score submission reminders for incomplete scorecards
 * Should be called after tournament ends
 */
export async function sendScoreSubmissionReminders(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        scorecards: {
          where: {
            status: {
              in: ['NOT_STARTED', 'IN_PROGRESS'],
            },
          },
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!tournament) return 0

    let remindersSent = 0

    for (const scorecard of tournament.scorecards) {
      if (scorecard.player.user?.id) {
        await notifyScoreReminder(
          scorecard.player.user.id,
          tournamentId,
          tournament.name,
          scorecard.id
        )
        remindersSent++
      }
    }

    return remindersSent
  } catch (error) {
    console.error('Failed to send score reminders:', error)
    return 0
  }
}
