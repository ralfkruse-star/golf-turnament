/**
 * Leaderboard Page Object
 */

import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class LeaderboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToLeaderboard(tournamentId: string) {
    await this.goto(`/tournaments/${tournamentId}/leaderboard`)
  }

  async refreshLeaderboard() {
    await this.click('[data-testid="refresh-leaderboard"]')
  }

  async filterByDivision(division: string) {
    await this.selectOption('[data-testid="filter-division"]', division)
  }

  async searchPlayer(name: string) {
    await this.fill('[data-testid="search-player"]', name)
  }

  async getPlayerPosition(playerId: string): Promise<number> {
    const text = await this.getText(`[data-testid="position-${playerId}"]`)
    return parseInt(text)
  }

  async getPlayerScore(playerId: string): Promise<number> {
    const text = await this.getText(`[data-testid="score-${playerId}"]`)
    return parseInt(text)
  }

  async viewPlayerScorecard(playerId: string) {
    await this.click(`[data-testid="view-scorecard-${playerId}"]`)
  }

  async getLeaderboardEntries() {
    return await this.page.locator('[data-testid^="leaderboard-entry-"]').all()
  }

  async verifyLiveUpdate() {
    // Wait for websocket connection
    await this.waitForSelector('[data-testid="live-indicator"]', { timeout: 10000 })
    const indicator = await this.getText('[data-testid="live-indicator"]')
    return indicator.includes('Live')
  }

  async getTopThree() {
    return {
      first: await this.getText('[data-testid="position-1"]'),
      second: await this.getText('[data-testid="position-2"]'),
      third: await this.getText('[data-testid="position-3"]'),
    }
  }

  async downloadLeaderboard() {
    const downloadPromise = this.page.waitForEvent('download')
    await this.click('[data-testid="download-leaderboard"]')
    return await downloadPromise
  }

  async printLeaderboard() {
    await this.click('[data-testid="print-leaderboard"]')
  }
}
