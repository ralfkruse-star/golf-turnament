/**
 * Player Registration API
 * POST /api/players/register - Create new player account
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/infrastructure/services/email-service'
import { contactSyncService } from '@/infrastructure/services/contact-sync-service'
import { Prisma } from '@prisma/client'

const registerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  handicapIndex: z.number().min(-10).max(54),
  homeClub: z.string().optional(),
  membershipType: z.enum(['MEMBER', 'GUEST', 'CORPORATE', 'TRIAL']).default('GUEST'),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'Consent is required',
  }),
  marketingConsent: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if email already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { email: validatedData.email },
    })

    if (existingPlayer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ein Spieler mit dieser E-Mail-Adresse existiert bereits.',
        },
        { status: 400 }
      )
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        gender: validatedData.gender,
        handicapIndex: new Prisma.Decimal(validatedData.handicapIndex),
        homeClub: validatedData.homeClub,
        membershipType: validatedData.membershipType,
        consentGiven: validatedData.consentGiven,
        consentDate: validatedData.consentGiven ? new Date() : null,
        marketingConsent: validatedData.marketingConsent,
        memberSince: validatedData.membershipType === 'MEMBER' ? new Date() : null,
      },
    })

    // Send welcome email
    try {
      await emailService.sendEmail({
        to: {
          email: player.email,
          name: `${player.firstName} ${player.lastName}`,
        },
        subject: 'Willkommen bei Golfplatz Siek!',
        htmlContent: generateWelcomeEmail(player),
        tags: ['welcome', 'transactional'],
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Continue - registration is valid even if email fails
    }

    // Sync to Brevo (if marketing consent given)
    if (validatedData.marketingConsent) {
      try {
        await contactSyncService.syncPlayer(player)
      } catch (syncError) {
        console.error('Failed to sync contact to Brevo:', syncError)
        // Continue - registration is valid
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: player.id,
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
        },
        message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validierung fehlgeschlagen',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error registering player:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
      },
      { status: 500 }
    )
  }
}

function generateWelcomeEmail(player: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2D7738; color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #2D7738; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2D7738; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⛳ Willkommen bei Golfplatz Siek!</h1>
          </div>
          <div class="content">
            <p>Hallo ${player.firstName},</p>
            <p>Herzlich Willkommen! Ihre Registrierung war erfolgreich.</p>

            <div class="info-box">
              <h3>Ihre Profil-Daten</h3>
              <p><strong>Name:</strong> ${player.firstName} ${player.lastName}</p>
              <p><strong>E-Mail:</strong> ${player.email}</p>
              <p><strong>Handicap:</strong> ${player.handicapIndex}</p>
              <p><strong>Mitgliedschaft:</strong> ${getMembershipLabel(player.membershipType)}</p>
            </div>

            <h3>Nächste Schritte:</h3>
            <ul>
              <li>✅ Entdecken Sie kommende Turniere</li>
              <li>✅ Melden Sie sich für Ihr erstes Turnier an</li>
              <li>✅ Vervollständigen Sie Ihr Profil</li>
            </ul>

            <p style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/tournaments" class="button">
                Turniere ansehen
              </a>
            </p>

            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung!</p>
            <p>Mit sportlichen Grüßen,<br>Ihr Golfplatz Siek Team</p>
          </div>
          <div class="footer">
            <p>Golfplatz Siek | Siek, Schleswig-Holstein</p>
            <p>Sie erhalten diese E-Mail, weil Sie sich registriert haben.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

function getMembershipLabel(type: string): string {
  const labels: Record<string, string> = {
    MEMBER: 'Mitglied',
    GUEST: 'Gast',
    CORPORATE: 'Firmenmitglied',
    TRIAL: 'Schnuppermitglied',
  }
  return labels[type] || type
}
