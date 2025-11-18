/**
 * Scorecard Page Object
 */

import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class ScorecardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToScorecard(tournamentId: string, playerId: string) {
    await this.goto(`/tournaments/${tournamentId}/scorecard/${playerId}`)
  }

  async navigateToMyScorecards() {
    await this.goto('/my-scorecards')
  }

  async startScorecard() {
    await this.click('[data-testid="start-scorecard"]')
  }

  async enterScore(hole: number, score: number) {
    await this.fill(`[data-testid="score-hole-${hole}"]`, score.toString())
  }

  async enterPutts(hole: number, putts: number) {
    await this.fill(`[data-testid="putts-hole-${hole}"]`, putts.toString())
  }

  async markFairwayHit(hole: number, hit: boolean) {
    const checkbox = `[data-testid="fairway-hole-${hole}"]`
    if (hit) {
      await this.check(checkbox)
    } else {
      await this.uncheck(checkbox)
    }
  }

  async markGreenInRegulation(hole: number, gir: boolean) {
    const checkbox = `[data-testid="gir-hole-${hole}"]`
    if (gir) {
      await this.check(checkbox)
    } else {
      await this.uncheck(checkbox)
    }
  }

  async enterFullHole(hole: number, data: {
    score: number
    putts?: number
    fairwayHit?: boolean
    gir?: boolean
  }) {
    await this.enterScore(hole, data.score)

    if (data.putts !== undefined) {
      await this.enterPutts(hole, data.putts)
    }

    if (data.fairwayHit !== undefined) {
      await this.markFairwayHit(hole, data.fairwayHit)
    }

    if (data.gir !== undefined) {
      await this.markGreenInRegulation(hole, data.gir)
    }
  }

  async complete18Holes(scores: number[]) {
    if (scores.length !== 18) {
      throw new Error('Must provide 18 scores')
    }

    for (let i = 0; i < 18; i++) {
      await this.enterScore(i + 1, scores[i])
    }
  }

  async getTotalGross(): Promise<number> {
    const text = await this.getText('[data-testid="total-gross"]')
    return parseInt(text)
  }

  async getTotalNet(): Promise<number> {
    const text = await this.getText('[data-testid="total-net"]')
    return parseInt(text)
  }

  async getTotalPoints(): Promise<number> {
    const text = await this.getText('[data-testid="total-points"]')
    return parseInt(text)
  }

  async enterMarkerName(name: string) {
    await this.fill('[name="markerName"]', name)
  }

  async submitScorecard() {
    await this.click('[data-testid="submit-scorecard"]')
  }

  async confirmSubmission() {
    await this.click('[data-testid="confirm-submit"]')
  }

  async verifySubmitted() {
    await this.waitForSelector('[data-testid="scorecard-submitted"]', { timeout: 10000 })
  }

  async getScorecardStatus(): Promise<string> {
    return await this.getText('[data-testid="scorecard-status"]')
  }

  async printScorecard() {
    await this.click('[data-testid="print-scorecard"]')
  }

  async downloadScorecard() {
    await this.click('[data-testid="download-scorecard"]')
  }
}
