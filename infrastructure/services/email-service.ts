/**
 * Email Service Layer
 * Abstracts Brevo email functionality with type-safe interfaces
 */

import * as brevo from '@getbrevo/brevo'
import { getBrevoEmailApi, BREVO_CONFIG, isBrevoConfigured } from '@/lib/brevo'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export interface EmailRecipient {
  email: string
  name?: string
}

export interface SendEmailParams {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: number
  params?: Record<string, any>
  attachments?: EmailAttachment[]
  tags?: string[]
}

export interface EmailAttachment {
  name: string
  content: string // Base64 encoded
  contentType?: string
}

export interface TournamentRegistrationEmailData {
  playerName: string
  tournamentName: string
  tournamentDate: Date
  registrationNumber: string
  entryFee?: number
  paymentStatus: 'paid' | 'pending'
  paymentLink?: string
}

export interface TournamentReminderEmailData {
  playerName: string
  tournamentName: string
  tournamentDate: Date
  startTime: string
  flightNumber?: number
  startingHole?: number
}

export interface TournamentResultsEmailData {
  playerName: string
  tournamentName: string
  position: number
  totalGross: number
  totalNet: number
  totalPoints: number
  participantCount: number
  resultsUrl: string
}

export interface ScorecardSubmittedEmailData {
  playerName: string
  tournamentName: string
  totalGross: number
  totalNet: number
  totalPoints: number
  submittedAt: Date
}

export class EmailService {
  private api: brevo.TransactionalEmailsApi | null = null

  constructor() {
    if (isBrevoConfigured()) {
      this.api = getBrevoEmailApi()
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(params: SendEmailParams): Promise<void> {
    if (!this.api) {
      console.warn('Brevo is not configured. Email not sent:', params.subject)
      return
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail()

      // Set sender
      sendSmtpEmail.sender = {
        email: BREVO_CONFIG.SENDER_EMAIL,
        name: BREVO_CONFIG.SENDER_NAME,
      }

      // Set recipients
      sendSmtpEmail.to = Array.isArray(params.to)
        ? params.to.map((r) => ({ email: r.email, name: r.name }))
        : [{ email: params.to.email, name: params.to.name }]

      // Set subject
      sendSmtpEmail.subject = params.subject

      // Set content (either template or direct HTML)
      if (params.templateId) {
        sendSmtpEmail.templateId = params.templateId
        sendSmtpEmail.params = params.params || {}
      } else {
        sendSmtpEmail.htmlContent = params.htmlContent
        sendSmtpEmail.textContent = params.textContent
      }

      // Set attachments
      if (params.attachments && params.attachments.length > 0) {
        sendSmtpEmail.attachment = params.attachments.map((a) => ({
          name: a.name,
          content: a.content,
        }))
      }

      // Set tags
      if (params.tags && params.tags.length > 0) {
        sendSmtpEmail.tags = params.tags
      }

      const response = await this.api.sendTransacEmail(sendSmtpEmail)
      console.log('Email sent successfully:', response)
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Failed to send email')
    }
  }

  /**
   * Send tournament registration confirmation
   */
  async sendTournamentRegistrationConfirmation(
    recipient: EmailRecipient,
    data: TournamentRegistrationEmailData
  ): Promise<void> {
    const templateId = BREVO_CONFIG.TEMPLATES.TOURNAMENT_REGISTRATION_CONFIRMATION

    if (templateId) {
      // Use Brevo template
      await this.sendEmail({
        to: recipient,
        subject: `Anmeldebestätigung: ${data.tournamentName}`,
        templateId,
        params: {
          playerName: data.playerName,
          tournamentName: data.tournamentName,
          tournamentDate: format(data.tournamentDate, 'PPP', { locale: de }),
          tournamentTime: format(data.tournamentDate, 'HH:mm'),
          registrationNumber: data.registrationNumber,
          entryFee: data.entryFee?.toFixed(2),
          paymentStatus: data.paymentStatus === 'paid' ? 'Bezahlt' : 'Ausstehend',
          paymentLink: data.paymentLink,
          showPaymentLink: data.paymentStatus === 'pending',
        },
        tags: ['tournament-registration', 'transactional'],
      })
    } else {
      // Fallback: Send HTML email
      const htmlContent = this.generateRegistrationConfirmationHTML(data)
      await this.sendEmail({
        to: recipient,
        subject: `Anmeldebestätigung: ${data.tournamentName}`,
        htmlContent,
        tags: ['tournament-registration', 'transactional'],
      })
    }
  }

  /**
   * Send tournament reminder (24h before)
   */
  async sendTournamentReminder(
    recipient: EmailRecipient,
    data: TournamentReminderEmailData
  ): Promise<void> {
    const templateId = BREVO_CONFIG.TEMPLATES.TOURNAMENT_REMINDER

    if (templateId) {
      await this.sendEmail({
        to: recipient,
        subject: `Erinnerung: ${data.tournamentName} - Morgen`,
        templateId,
        params: {
          playerName: data.playerName,
          tournamentName: data.tournamentName,
          tournamentDate: format(data.tournamentDate, 'PPP', { locale: de }),
          startTime: data.startTime,
          flightNumber: data.flightNumber,
          startingHole: data.startingHole,
          hasFlightInfo: !!data.flightNumber,
        },
        tags: ['tournament-reminder', 'transactional'],
      })
    } else {
      const htmlContent = this.generateReminderHTML(data)
      await this.sendEmail({
        to: recipient,
        subject: `Erinnerung: ${data.tournamentName} - Morgen`,
        htmlContent,
        tags: ['tournament-reminder', 'transactional'],
      })
    }
  }

  /**
   * Send tournament results
   */
  async sendTournamentResults(
    recipient: EmailRecipient,
    data: TournamentResultsEmailData
  ): Promise<void> {
    const templateId = BREVO_CONFIG.TEMPLATES.TOURNAMENT_RESULTS

    const positionSuffix = data.position === 1 ? '🥇' : data.position === 2 ? '🥈' : data.position === 3 ? '🥉' : ''

    if (templateId) {
      await this.sendEmail({
        to: recipient,
        subject: `Ergebnisse: ${data.tournamentName}`,
        templateId,
        params: {
          playerName: data.playerName,
          tournamentName: data.tournamentName,
          position: data.position,
          positionSuffix,
          totalGross: data.totalGross,
          totalNet: data.totalNet,
          totalPoints: data.totalPoints,
          participantCount: data.participantCount,
          resultsUrl: data.resultsUrl,
        },
        tags: ['tournament-results', 'transactional'],
      })
    } else {
      const htmlContent = this.generateResultsHTML(data)
      await this.sendEmail({
        to: recipient,
        subject: `Ergebnisse: ${data.tournamentName}`,
        htmlContent,
        tags: ['tournament-results', 'transactional'],
      })
    }
  }

  /**
   * Send scorecard submission confirmation
   */
  async sendScorecardSubmitted(
    recipient: EmailRecipient,
    data: ScorecardSubmittedEmailData
  ): Promise<void> {
    const templateId = BREVO_CONFIG.TEMPLATES.SCORECARD_SUBMITTED

    if (templateId) {
      await this.sendEmail({
        to: recipient,
        subject: `Scorekarte eingereicht: ${data.tournamentName}`,
        templateId,
        params: {
          playerName: data.playerName,
          tournamentName: data.tournamentName,
          totalGross: data.totalGross,
          totalNet: data.totalNet,
          totalPoints: data.totalPoints,
          submittedAt: format(data.submittedAt, 'PPP - HH:mm', { locale: de }),
        },
        tags: ['scorecard-submitted', 'transactional'],
      })
    } else {
      const htmlContent = this.generateScorecardSubmittedHTML(data)
      await this.sendEmail({
        to: recipient,
        subject: `Scorekarte eingereicht: ${data.tournamentName}`,
        htmlContent,
        tags: ['scorecard-submitted', 'transactional'],
      })
    }
  }

  /**
   * Generate registration confirmation HTML (fallback)
   */
  private generateRegistrationConfirmationHTML(data: TournamentRegistrationEmailData): string {
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
            .button { display: inline-block; padding: 12px 24px; background: #2D7738; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2D7738; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⛳ Anmeldebestätigung</h1>
            </div>
            <div class="content">
              <p>Hallo ${data.playerName},</p>
              <p>Ihre Anmeldung für das Turnier wurde erfolgreich bestätigt!</p>

              <div class="details">
                <h3>Turnier-Details</h3>
                <p><strong>Turnier:</strong> ${data.tournamentName}</p>
                <p><strong>Datum:</strong> ${format(data.tournamentDate, 'PPP - HH:mm', { locale: de })} Uhr</p>
                <p><strong>Anmeldenummer:</strong> ${data.registrationNumber}</p>
                ${data.entryFee ? `<p><strong>Startgebühr:</strong> ${data.entryFee.toFixed(2)} €</p>` : ''}
                <p><strong>Status:</strong> ${data.paymentStatus === 'paid' ? '✅ Bezahlt' : '⏳ Zahlung ausstehend'}</p>
              </div>

              ${data.paymentStatus === 'pending' && data.paymentLink ? `
                <p>Bitte bezahlen Sie die Startgebühr:</p>
                <a href="${data.paymentLink}" class="button">Jetzt bezahlen</a>
              ` : ''}

              <p>Wir freuen uns auf Ihre Teilnahme!</p>
              <p>Mit sportlichen Grüßen,<br>Ihr Golfplatz Siek Team</p>
            </div>
            <div class="footer">
              <p>Golfplatz Siek | Siek, Schleswig-Holstein</p>
              <p>Sie erhalten diese E-Mail, weil Sie sich für ein Turnier angemeldet haben.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Generate reminder HTML (fallback)
   */
  private generateReminderHTML(data: TournamentReminderEmailData): string {
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
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Turnier-Erinnerung</h1>
            </div>
            <div class="content">
              <p>Hallo ${data.playerName},</p>
              <p>Morgen findet Ihr Turnier statt!</p>

              <div class="details">
                <h3>Turnier-Details</h3>
                <p><strong>Turnier:</strong> ${data.tournamentName}</p>
                <p><strong>Datum:</strong> ${format(data.tournamentDate, 'PPP', { locale: de })}</p>
                <p><strong>Startzeit:</strong> ${data.startTime} Uhr</p>
                ${data.flightNumber ? `<p><strong>Flight:</strong> ${data.flightNumber}</p>` : ''}
                ${data.startingHole ? `<p><strong>Startloch:</strong> ${data.startingHole}</p>` : ''}
              </div>

              <p><strong>Bitte denken Sie daran:</strong></p>
              <ul>
                <li>Seien Sie 15 Minuten vor Ihrer Startzeit da</li>
                <li>Bringen Sie Ihren Ausweis mit</li>
                <li>Überprüfen Sie Ihre Ausrüstung</li>
              </ul>

              <p>Viel Erfolg und gutes Spiel!</p>
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

  /**
   * Generate results HTML (fallback)
   */
  private generateResultsHTML(data: TournamentResultsEmailData): string {
    const positionEmoji = data.position === 1 ? '🥇' : data.position === 2 ? '🥈' : data.position === 3 ? '🥉' : '🏌️'

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
            .results { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #2D7738; text-align: center; }
            .position { font-size: 48px; font-weight: bold; color: #2D7738; margin: 10px 0; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2D7738; }
            .stat-label { font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #2D7738; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Turnier-Ergebnisse</h1>
            </div>
            <div class="content">
              <p>Hallo ${data.playerName},</p>
              <p>Herzlichen Glückwunsch zu Ihrer Teilnahme am ${data.tournamentName}!</p>

              <div class="results">
                <div class="position">${positionEmoji} Platz ${data.position}</div>
                <p>von ${data.participantCount} Teilnehmern</p>

                <div class="stats">
                  <div class="stat">
                    <div class="stat-value">${data.totalGross}</div>
                    <div class="stat-label">Brutto</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${data.totalNet}</div>
                    <div class="stat-label">Netto</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${data.totalPoints}</div>
                    <div class="stat-label">Punkte</div>
                  </div>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="${data.resultsUrl}" class="button">Vollständige Ergebnisse ansehen</a>
              </p>

              ${data.position <= 3 ? `
                <p style="text-align: center; font-size: 18px; color: #2D7738;">
                  <strong>Herzlichen Glückwunsch zur Podiumsplatzierung! ${positionEmoji}</strong>
                </p>
              ` : ''}

              <p>Vielen Dank für Ihre Teilnahme!</p>
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

  /**
   * Generate scorecard submitted HTML (fallback)
   */
  private generateScorecardSubmittedHTML(data: ScorecardSubmittedEmailData): string {
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
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Scorekarte eingereicht</h1>
            </div>
            <div class="content">
              <p>Hallo ${data.playerName},</p>
              <p>Ihre Scorekarte wurde erfolgreich eingereicht!</p>

              <div class="details">
                <h3>Ihre Ergebnisse</h3>
                <p><strong>Turnier:</strong> ${data.tournamentName}</p>
                <p><strong>Brutto:</strong> ${data.totalGross}</p>
                <p><strong>Netto:</strong> ${data.totalNet}</p>
                <p><strong>Punkte:</strong> ${data.totalPoints}</p>
                <p><strong>Eingereicht:</strong> ${format(data.submittedAt, 'PPP - HH:mm', { locale: de })} Uhr</p>
              </div>

              <p>Ihre Scorekarte wird nun von der Turnierleitung überprüft. Sie erhalten eine weitere E-Mail, sobald die Ergebnisse verifiziert wurden.</p>

              <p>Vielen Dank für Ihre Teilnahme!</p>
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
}

// Singleton instance
export const emailService = new EmailService()
