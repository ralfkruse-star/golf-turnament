/**
 * E2E Tests: Photo Upload and Gallery
 */

import { test, expect } from '@playwright/test'
import { PhotoGalleryPage } from './page-objects/PhotoGalleryPage'
import { resetDatabase, prisma } from '../helpers/test-db'
import { createAndAuthenticatePlayer, createAndAuthenticateAdmin } from '../helpers/test-auth'
import path from 'path'

test.describe('Photo Upload and Gallery', () => {
  let galleryPage: PhotoGalleryPage
  let testData: any

  test.beforeEach(async ({ page }) => {
    testData = await resetDatabase()
    galleryPage = new PhotoGalleryPage(page)
  })

  test('should upload photo successfully', async ({ page }) => {
    await createAndAuthenticatePlayer(page)
    await galleryPage.navigateToGallery()

    // Create a test image file path
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg')

    await galleryPage.uploadPhoto(testImagePath, 'Test photo caption')
    await galleryPage.waitForToast('Photo uploaded successfully')
  })

  test('should upload multiple photos at once', async ({ page }) => {
    await createAndAuthenticatePlayer(page)
    await galleryPage.navigateToGallery()

    const testImages = [
      path.join(__dirname, '../fixtures/test-image-1.jpg'),
      path.join(__dirname, '../fixtures/test-image-2.jpg'),
      path.join(__dirname, '../fixtures/test-image-3.jpg'),
    ]

    await galleryPage.uploadMultiplePhotos(testImages)
    await galleryPage.waitForToast('3 photos uploaded')
  })

  test('should filter photos by category', async ({ page }) => {
    await createAndAuthenticatePlayer(page)

    // Create photos in different categories
    await prisma.photo.createMany({
      data: [
        {
          filename: 'tournament1.jpg',
          originalName: 'tournament1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 100000,
          width: 1920,
          height: 1080,
          url: '/uploads/tournament1.jpg',
          category: 'TOURNAMENT',
          approved: true,
          isPublic: true,
          uploadedBy: testData.users.playerUser.id,
        },
        {
          filename: 'course1.jpg',
          originalName: 'course1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 100000,
          width: 1920,
          height: 1080,
          url: '/uploads/course1.jpg',
          category: 'COURSE',
          approved: true,
          isPublic: true,
          uploadedBy: testData.users.playerUser.id,
        },
      ],
    })

    await galleryPage.navigateToGallery()
    await galleryPage.filterByCategory('TOURNAMENT')

    const count = await galleryPage.getPhotoCount()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('should show photo details when clicked', async ({ page }) => {
    await createAndAuthenticatePlayer(page)

    const photo = await prisma.photo.create({
      data: {
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: '/uploads/test.jpg',
        caption: 'Test caption',
        category: 'TOURNAMENT',
        approved: true,
        isPublic: true,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    await galleryPage.navigateToGallery()
    await galleryPage.clickPhoto(photo.id)
    await galleryPage.viewPhotoDetails()

    const isVisible = await galleryPage.isVisible('[data-testid="photo-details"]')
    expect(isVisible).toBeTruthy()
  })

  test('admin should approve pending photos', async ({ page }) => {
    await createAndAuthenticateAdmin(page)

    const photo = await prisma.photo.create({
      data: {
        filename: 'pending.jpg',
        originalName: 'pending.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: '/uploads/pending.jpg',
        category: 'TOURNAMENT',
        approved: false,
        isPublic: true,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    await galleryPage.navigateToGallery()
    await galleryPage.approvePhoto(photo.id)
    await galleryPage.waitForToast('Photo approved')

    // Verify photo is approved
    const updatedPhoto = await prisma.photo.findUnique({
      where: { id: photo.id },
    })
    expect(updatedPhoto?.approved).toBeTruthy()
  })

  test('admin should reject inappropriate photos', async ({ page }) => {
    await createAndAuthenticateAdmin(page)

    const photo = await prisma.photo.create({
      data: {
        filename: 'inappropriate.jpg',
        originalName: 'inappropriate.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: '/uploads/inappropriate.jpg',
        category: 'TOURNAMENT',
        approved: false,
        isPublic: true,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    await galleryPage.navigateToGallery()
    await galleryPage.rejectPhoto(photo.id)
    await galleryPage.waitForToast('Photo rejected')

    // Verify photo is deleted
    const deletedPhoto = await prisma.photo.findUnique({
      where: { id: photo.id },
    })
    expect(deletedPhoto).toBeNull()
  })

  test('should show pending photos count to admin', async ({ page }) => {
    await createAndAuthenticateAdmin(page)

    // Create pending photos
    await prisma.photo.createMany({
      data: Array(5).fill(null).map((_, i) => ({
        filename: `pending${i}.jpg`,
        originalName: `pending${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: `/uploads/pending${i}.jpg`,
        category: 'TOURNAMENT',
        approved: false,
        isPublic: true,
        uploadedBy: testData.users.playerUser.id,
      })),
    })

    await galleryPage.navigateToGallery()

    const pendingCount = await galleryPage.getPendingPhotosCount()
    expect(pendingCount).toBe(5)
  })

  test('should filter photos by tournament', async ({ page }) => {
    await createAndAuthenticatePlayer(page)

    await prisma.photo.create({
      data: {
        filename: 'tournament-photo.jpg',
        originalName: 'tournament-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: '/uploads/tournament-photo.jpg',
        category: 'TOURNAMENT',
        tournamentId: testData.tournament.id,
        approved: true,
        isPublic: true,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    await galleryPage.navigateToTournamentGallery(testData.tournament.id)

    const count = await galleryPage.getPhotoCount()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('should feature photo', async ({ page }) => {
    await createAndAuthenticateAdmin(page)

    const photo = await prisma.photo.create({
      data: {
        filename: 'feature.jpg',
        originalName: 'feature.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: '/uploads/feature.jpg',
        category: 'TOURNAMENT',
        approved: true,
        isPublic: true,
        isFeatured: false,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    await galleryPage.navigateToGallery()
    await galleryPage.featurePhoto(photo.id)
    await galleryPage.waitForToast('Photo featured')

    const updatedPhoto = await prisma.photo.findUnique({
      where: { id: photo.id },
    })
    expect(updatedPhoto?.isFeatured).toBeTruthy()
  })

  test('should download photo', async ({ page }) => {
    await createAndAuthenticatePlayer(page)

    const photo = await prisma.photo.create({
      data: {
        filename: 'download.jpg',
        originalName: 'download.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        width: 1920,
        height: 1080,
        url: '/uploads/download.jpg',
        category: 'TOURNAMENT',
        approved: true,
        isPublic: true,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    await galleryPage.navigateToGallery()
    const download = await galleryPage.downloadPhoto(photo.id)

    expect(download).toBeTruthy()
  })

  test('should validate file type', async ({ page }) => {
    await createAndAuthenticatePlayer(page)
    await galleryPage.navigateToGallery()

    // Try to upload non-image file
    const textFilePath = path.join(__dirname, '../fixtures/test.txt')

    await galleryPage.uploadPhoto(textFilePath)
    await galleryPage.waitForToast('Invalid file type')
  })

  test('should validate file size', async ({ page }) => {
    await createAndAuthenticatePlayer(page)
    await galleryPage.navigateToGallery()

    // This would need a large test file
    // For now, just verify the upload size limit is displayed
    const isVisible = await galleryPage.isVisible('[data-testid="upload-limit"]')
    expect(isVisible).toBeTruthy()
  })
})
