/**
 * Photo Gallery Page Object
 */

import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class PhotoGalleryPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToGallery() {
    await this.goto('/gallery')
  }

  async navigateToTournamentGallery(tournamentId: string) {
    await this.goto(`/tournaments/${tournamentId}/gallery`)
  }

  async uploadPhoto(filePath: string, caption?: string) {
    // Set the file input
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)

    if (caption) {
      await this.fill('[name="caption"]', caption)
    }

    await this.click('[data-testid="upload-photo"]')
  }

  async uploadMultiplePhotos(filePaths: string[]) {
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePaths)
    await this.click('[data-testid="upload-all"]')
  }

  async dragAndDropPhoto(filePath: string) {
    // Simulate drag and drop
    const dropZone = this.page.locator('[data-testid="photo-dropzone"]')
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
  }

  async filterByCategory(category: string) {
    await this.selectOption('[data-testid="filter-category"]', category)
  }

  async filterByTournament(tournamentId: string) {
    await this.selectOption('[data-testid="filter-tournament"]', tournamentId)
  }

  async searchPhotos(query: string) {
    await this.fill('[data-testid="search-photos"]', query)
  }

  async getPhotoCount(): Promise<number> {
    const photos = await this.page.locator('[data-testid^="photo-"]').all()
    return photos.length
  }

  async clickPhoto(photoId: string) {
    await this.click(`[data-testid="photo-${photoId}"]`)
  }

  async viewPhotoDetails() {
    await this.waitForSelector('[data-testid="photo-details"]')
  }

  async deletePhoto(photoId: string) {
    await this.click(`[data-testid="delete-${photoId}"]`)
    await this.click('[data-testid="confirm-delete"]')
  }

  async approvePhoto(photoId: string) {
    await this.click(`[data-testid="approve-${photoId}"]`)
  }

  async rejectPhoto(photoId: string) {
    await this.click(`[data-testid="reject-${photoId}"]`)
  }

  async featurePhoto(photoId: string) {
    await this.click(`[data-testid="feature-${photoId}"]`)
  }

  async downloadPhoto(photoId: string) {
    const downloadPromise = this.page.waitForEvent('download')
    await this.click(`[data-testid="download-${photoId}"]`)
    return await downloadPromise
  }

  async getPendingPhotosCount(): Promise<number> {
    const text = await this.getText('[data-testid="pending-count"]')
    return parseInt(text.match(/\d+/)?.[0] || '0')
  }
}
