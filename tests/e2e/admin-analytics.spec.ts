/**
 * E2E Tests: Admin Analytics Dashboard
 */

import { test, expect } from '@playwright/test'
import { BasePage } from './page-objects/BasePage'
import { resetDatabase, createTestPlayers, prisma } from '../helpers/test-db'
import { createAndAuthenticateAdmin } from '../helpers/test-auth'

test.describe('Admin Analytics Dashboard', () => {
  let analyticsPage: BasePage
  let testData: any

  test.beforeEach(async ({ page }) => {
    testData = await resetDatabase()
    analyticsPage = new BasePage(page)
    await createAndAuthenticateAdmin(page)

    // Create test data for analytics
    const players = await createTestPlayers(50)

    // Create multiple tournaments
    for (let i = 0; i < 5; i++) {
      const tournament = await prisma.tournament.create({
        data: {
          name: `Tournament ${i + 1}`,
          format: 'STABLEFORD',
          category: 'MONTHLY_MEDAL',
          status: 'COMPLETED',
          tournamentDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
          registrationStart: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000),
          registrationEnd: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
          courseId: testData.course.id,
          clubId: testData.club.id,
          teesUsed: { men: 'white', women: 'red' },
          maxPlayers: 100,
          minPlayers: 4,
          entryFee: 25.0,
          createdBy: testData.users.adminUser.id,
        },
      })

      // Add registrations
      const numRegistrations = Math.floor(Math.random() * 20) + 10
      await prisma.registration.createMany({
        data: players.slice(0, numRegistrations).map(player => ({
          tournamentId: tournament.id,
          playerId: player.id,
          status: 'CONFIRMED',
          playingHandicap: player.handicapIndex,
          tee: 'white',
          paid: true,
          paidAt: new Date(),
        })),
      })
    }

    // Create analytics metrics
    await prisma.analyticsMetric.createMany({
      data: [
        {
          metricType: 'TOURNAMENT_PARTICIPATION',
          date: new Date(),
          value: 150,
          count: 5,
        },
        {
          metricType: 'REVENUE',
          date: new Date(),
          value: 3750,
          count: 150,
        },
        {
          metricType: 'REGISTRATION_CONVERSION',
          date: new Date(),
          value: 85.5,
        },
      ],
    })
  })

  test('should display analytics dashboard', async () => {
    await analyticsPage.goto('/admin/analytics')
    await analyticsPage.waitForSelector('[data-testid="analytics-dashboard"]')

    const isVisible = await analyticsPage.isVisible('[data-testid="analytics-dashboard"]')
    expect(isVisible).toBeTruthy()
  })

  test('should show key performance indicators', async () => {
    await analyticsPage.goto('/admin/analytics')

    // Check for KPI cards
    const totalTournamentsVisible = await analyticsPage.isVisible('[data-testid="kpi-total-tournaments"]')
    const totalPlayersVisible = await analyticsPage.isVisible('[data-testid="kpi-total-players"]')
    const totalRevenueVisible = await analyticsPage.isVisible('[data-testid="kpi-total-revenue"]')

    expect(totalTournamentsVisible).toBeTruthy()
    expect(totalPlayersVisible).toBeTruthy()
    expect(totalRevenueVisible).toBeTruthy()
  })

  test('should display participation trends chart', async () => {
    await analyticsPage.goto('/admin/analytics')

    const chartVisible = await analyticsPage.isVisible('[data-testid="participation-chart"]')
    expect(chartVisible).toBeTruthy()
  })

  test('should display revenue chart', async () => {
    await analyticsPage.goto('/admin/analytics')

    const chartVisible = await analyticsPage.isVisible('[data-testid="revenue-chart"]')
    expect(chartVisible).toBeTruthy()
  })

  test('should filter analytics by date range', async () => {
    await analyticsPage.goto('/admin/analytics')

    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    const endDate = new Date()

    await analyticsPage.fill('[name="startDate"]', startDate.toISOString().split('T')[0])
    await analyticsPage.fill('[name="endDate"]', endDate.toISOString().split('T')[0])
    await analyticsPage.click('[data-testid="apply-filter"]')

    await analyticsPage.waitForSelector('[data-testid="analytics-updated"]')
  })

  test('should display handicap distribution', async () => {
    await analyticsPage.goto('/admin/analytics')

    const chartVisible = await analyticsPage.isVisible('[data-testid="handicap-distribution"]')
    expect(chartVisible).toBeTruthy()
  })

  test('should show top performing players', async () => {
    await analyticsPage.goto('/admin/analytics')

    const tableVisible = await analyticsPage.isVisible('[data-testid="top-players"]')
    expect(tableVisible).toBeTruthy()
  })

  test('should generate tournament summary report', async () => {
    await analyticsPage.goto('/admin/analytics/reports')

    await analyticsPage.selectOption('[name="reportType"]', 'TOURNAMENT_SUMMARY')
    await analyticsPage.click('[data-testid="generate-report"]')

    await analyticsPage.waitForToast('Report generated')
    const downloadVisible = await analyticsPage.isVisible('[data-testid="download-report"]')
    expect(downloadVisible).toBeTruthy()
  })

  test('should generate financial report', async () => {
    await analyticsPage.goto('/admin/analytics/reports')

    await analyticsPage.selectOption('[name="reportType"]', 'FINANCIAL')
    await analyticsPage.selectOption('[name="format"]', 'EXCEL')
    await analyticsPage.click('[data-testid="generate-report"]')

    await analyticsPage.waitForToast('Report generated')
  })

  test('should export data to CSV', async ({ page }) => {
    await analyticsPage.goto('/admin/analytics')

    const downloadPromise = page.waitForEvent('download')
    await analyticsPage.click('[data-testid="export-csv"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should export data to Excel', async ({ page }) => {
    await analyticsPage.goto('/admin/analytics')

    const downloadPromise = page.waitForEvent('download')
    await analyticsPage.click('[data-testid="export-excel"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('should display player retention metrics', async () => {
    await analyticsPage.goto('/admin/analytics')

    const metricVisible = await analyticsPage.isVisible('[data-testid="player-retention"]')
    expect(metricVisible).toBeTruthy()
  })

  test('should show average tournament participation', async () => {
    await analyticsPage.goto('/admin/analytics')

    const text = await analyticsPage.getText('[data-testid="avg-participation"]')
    expect(text).toBeTruthy()
    expect(parseFloat(text)).toBeGreaterThan(0)
  })

  test('should display scorecard completion rate', async () => {
    await analyticsPage.goto('/admin/analytics')

    const rateVisible = await analyticsPage.isVisible('[data-testid="scorecard-completion"]')
    expect(rateVisible).toBeTruthy()
  })

  test('should show tournament format popularity', async () => {
    await analyticsPage.goto('/admin/analytics')

    const chartVisible = await analyticsPage.isVisible('[data-testid="format-popularity"]')
    expect(chartVisible).toBeTruthy()
  })

  test('should display monthly comparison', async () => {
    await analyticsPage.goto('/admin/analytics')

    await analyticsPage.click('[data-testid="view-monthly"]')

    const tableVisible = await analyticsPage.isVisible('[data-testid="monthly-comparison"]')
    expect(tableVisible).toBeTruthy()
  })

  test('should show year-over-year growth', async () => {
    await analyticsPage.goto('/admin/analytics')

    const growthVisible = await analyticsPage.isVisible('[data-testid="yoy-growth"]')
    expect(growthVisible).toBeTruthy()
  })
})
