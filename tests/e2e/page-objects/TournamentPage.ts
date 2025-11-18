/**
 * Tournament Page Object
 */

import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class TournamentPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToTournaments() {
    await this.goto('/tournaments')
  }

  async navigateToTournament(tournamentId: string) {
    await this.goto(`/tournaments/${tournamentId}`)
  }

  async filterByStatus(status: string) {
    await this.selectOption('[data-testid="filter-status"]', status)
  }

  async filterByCategory(category: string) {
    await this.selectOption('[data-testid="filter-category"]', category)
  }

  async searchTournaments(query: string) {
    await this.fill('[data-testid="search-tournaments"]', query)
  }

  async getTournamentCards() {
    return this.page.locator('[data-testid="tournament-card"]').all()
  }

  async clickTournament(name: string) {
    await this.click(`text=${name}`)
  }

  async registerForTournament() {
    await this.click('[data-testid="register-button"]')
  }

  async selectTee(tee: string) {
    await this.selectOption('[name="tee"]', tee)
  }

  async requestCart() {
    await this.check('[name="cart"]')
  }

  async addSpecialRequests(requests: string) {
    await this.fill('[name="specialRequests"]', requests)
  }

  async confirmRegistration() {
    await this.click('[data-testid="confirm-registration"]')
  }

  async verifyRegistrationConfirmed() {
    await this.waitForSelector('[data-testid="registration-confirmed"]', { timeout: 10000 })
  }

  async getTournamentDetails() {
    return {
      name: await this.getText('[data-testid="tournament-name"]'),
      date: await this.getText('[data-testid="tournament-date"]'),
      format: await this.getText('[data-testid="tournament-format"]'),
      entryFee: await this.getText('[data-testid="tournament-fee"]'),
      spotsAvailable: await this.getText('[data-testid="spots-available"]'),
    }
  }

  async viewRegisteredPlayers() {
    await this.click('[data-testid="view-players"]')
  }

  async getRegisteredPlayersCount(): Promise<number> {
    const text = await this.getText('[data-testid="registered-count"]')
    return parseInt(text.match(/\d+/)?.[0] || '0')
  }
}
