/**
 * Admin Tournament Management Page Object
 */

import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminTournamentPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToAdminTournaments() {
    await this.goto('/admin/tournaments')
  }

  async navigateToCreateTournament() {
    await this.goto('/admin/tournaments/create')
  }

  async navigateToEditTournament(tournamentId: string) {
    await this.goto(`/admin/tournaments/${tournamentId}/edit`)
  }

  async fillBasicInfo(data: {
    name: string
    description?: string
    format: string
    category: string
    tournamentDate: string
  }) {
    await this.fill('[name="name"]', data.name)

    if (data.description) {
      await this.fill('[name="description"]', data.description)
    }

    await this.selectOption('[name="format"]', data.format)
    await this.selectOption('[name="category"]', data.category)
    await this.fill('[name="tournamentDate"]', data.tournamentDate)
  }

  async fillRegistrationDates(data: {
    registrationStart: string
    registrationEnd: string
  }) {
    await this.fill('[name="registrationStart"]', data.registrationStart)
    await this.fill('[name="registrationEnd"]', data.registrationEnd)
  }

  async selectCourse(courseId: string) {
    await this.selectOption('[name="courseId"]', courseId)
  }

  async setLimits(data: {
    maxPlayers?: number
    minPlayers?: number
    entryFee?: number
    maxHandicap?: number
  }) {
    if (data.maxPlayers) {
      await this.fill('[name="maxPlayers"]', data.maxPlayers.toString())
    }

    if (data.minPlayers) {
      await this.fill('[name="minPlayers"]', data.minPlayers.toString())
    }

    if (data.entryFee !== undefined) {
      await this.fill('[name="entryFee"]', data.entryFee.toString())
    }

    if (data.maxHandicap) {
      await this.fill('[name="maxHandicap"]', data.maxHandicap.toString())
    }
  }

  async configureFlights(data: {
    autoGenerate: boolean
    minutesPerFlight?: number
  }) {
    if (data.autoGenerate) {
      await this.check('[name="autoGenerateFlights"]')
    } else {
      await this.uncheck('[name="autoGenerateFlights"]')
    }

    if (data.minutesPerFlight) {
      await this.fill('[name="flightsPerTee"]', data.minutesPerFlight.toString())
    }
  }

  async saveTournament() {
    await this.click('[data-testid="save-tournament"]')
  }

  async publishTournament() {
    await this.click('[data-testid="publish-tournament"]')
  }

  async generateFlights() {
    await this.click('[data-testid="generate-flights"]')
  }

  async viewFlights() {
    await this.click('[data-testid="view-flights"]')
  }

  async viewRegistrations() {
    await this.click('[data-testid="view-registrations"]')
  }

  async exportRegistrations() {
    const downloadPromise = this.page.waitForEvent('download')
    await this.click('[data-testid="export-registrations"]')
    return await downloadPromise
  }

  async markPlayerPaid(registrationId: string) {
    await this.click(`[data-testid="mark-paid-${registrationId}"]`)
  }

  async cancelRegistration(registrationId: string) {
    await this.click(`[data-testid="cancel-registration-${registrationId}"]`)
    await this.click('[data-testid="confirm-cancel"]')
  }

  async getFlightCount(): Promise<number> {
    const flights = await this.page.locator('[data-testid^="flight-"]').all()
    return flights.length
  }

  async getRegistrationCount(): Promise<number> {
    const text = await this.getText('[data-testid="registration-count"]')
    return parseInt(text.match(/\d+/)?.[0] || '0')
  }

  async searchRegistrations(query: string) {
    await this.fill('[data-testid="search-registrations"]', query)
  }

  async filterRegistrationsByStatus(status: string) {
    await this.selectOption('[data-testid="filter-status"]', status)
  }

  async startTournament() {
    await this.click('[data-testid="start-tournament"]')
    await this.click('[data-testid="confirm-start"]')
  }

  async completeTournament() {
    await this.click('[data-testid="complete-tournament"]')
    await this.click('[data-testid="confirm-complete"]')
  }
}
