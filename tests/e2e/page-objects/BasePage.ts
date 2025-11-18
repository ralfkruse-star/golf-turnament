/**
 * Base Page Object
 * Common functionality for all page objects
 */

import { Page, Locator } from '@playwright/test'

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string) {
    await this.page.goto(path)
  }

  async waitForLoadState() {
    await this.page.waitForLoadState('networkidle')
  }

  async click(selector: string) {
    await this.page.click(selector)
  }

  async fill(selector: string, value: string) {
    await this.page.fill(selector, value)
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value)
  }

  async check(selector: string) {
    await this.page.check(selector)
  }

  async uncheck(selector: string) {
    await this.page.uncheck(selector)
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || ''
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector)
  }

  async waitForSelector(selector: string, options?: { timeout?: number }) {
    await this.page.waitForSelector(selector, options)
  }

  async waitForURL(url: string | RegExp, options?: { timeout?: number }) {
    await this.page.waitForURL(url, options)
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` })
  }

  getLocator(selector: string): Locator {
    return this.page.locator(selector)
  }

  async waitForToast(message?: string, timeout: number = 5000) {
    const toast = this.page.locator('[data-testid="toast"]').first()
    await toast.waitFor({ state: 'visible', timeout })

    if (message) {
      const text = await toast.textContent()
      if (!text?.includes(message)) {
        throw new Error(`Expected toast to contain "${message}", but got "${text}"`)
      }
    }
  }

  async closeToast() {
    const closeButton = this.page.locator('[data-testid="toast-close"]').first()
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }
}
