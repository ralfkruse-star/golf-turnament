/**
 * Integration Test: Photo Upload and Processing Flow
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma } from '../helpers/test-db'

describe('Photo Upload and Processing Flow', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should upload and process photo', async () => {
    const photo = await prisma.photo.create({
      data: {
        filename: 'test-photo-123.jpg',
        originalName: 'tournament-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2048000, // 2MB
        width: 1920,
        height: 1080,
        url: '/uploads/test-photo-123.jpg',
        thumbnailUrl: '/uploads/test-photo-123-thumb.jpg',
        mediumUrl: '/uploads/test-photo-123-medium.jpg',
        caption: 'Great shot from the 18th hole',
        category: 'TOURNAMENT',
        tournamentId: testData.tournament.id,
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
        isFeatured: false,
      },
    })

    expect(photo.id).toBeDefined()
    expect(photo.approved).toBe(false) // Pending approval
    expect(photo.thumbnailUrl).toBeDefined()
  })

  it('should approve photo', async () => {
    const photo = await prisma.photo.create({
      data: {
        filename: 'pending-photo.jpg',
        originalName: 'pending-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: '/uploads/pending-photo.jpg',
        category: 'TOURNAMENT',
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
      },
    })

    // Admin approves photo
    const approved = await prisma.photo.update({
      where: { id: photo.id },
      data: {
        approved: true,
        moderatedBy: testData.users.adminUser.id,
        moderatedAt: new Date(),
      },
    })

    expect(approved.approved).toBe(true)
    expect(approved.moderatedBy).toBe(testData.users.adminUser.id)
    expect(approved.moderatedAt).toBeDefined()
  })

  it('should reject inappropriate photo', async () => {
    const photo = await prisma.photo.create({
      data: {
        filename: 'inappropriate.jpg',
        originalName: 'inappropriate.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: '/uploads/inappropriate.jpg',
        category: 'TOURNAMENT',
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
      },
    })

    // Admin rejects photo by deleting it
    await prisma.photo.delete({
      where: { id: photo.id },
    })

    const deleted = await prisma.photo.findUnique({
      where: { id: photo.id },
    })

    expect(deleted).toBeNull()
  })

  it('should create photo album', async () => {
    const album = await prisma.album.create({
      data: {
        title: 'Monthly Medal - November 2024',
        description: 'Photos from the November monthly medal',
        isPublic: true,
      },
    })

    // Add photos to album
    await prisma.photo.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        filename: `album-photo-${i}.jpg`,
        originalName: `photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/album-photo-${i}.jpg`,
        category: 'TOURNAMENT',
        albumId: album.id,
        uploadedBy: testData.users.playerUser.id,
        approved: true,
        isPublic: true,
      })),
    })

    const photosInAlbum = await prisma.photo.count({
      where: { albumId: album.id },
    })

    expect(photosInAlbum).toBe(10)
  })

  it('should set album cover photo', async () => {
    const album = await prisma.album.create({
      data: {
        title: 'Test Album',
        isPublic: true,
      },
    })

    const coverPhoto = await prisma.photo.create({
      data: {
        filename: 'cover-photo.jpg',
        originalName: 'cover-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: '/uploads/cover-photo.jpg',
        category: 'TOURNAMENT',
        albumId: album.id,
        uploadedBy: testData.users.playerUser.id,
        approved: true,
        isPublic: true,
      },
    })

    await prisma.album.update({
      where: { id: album.id },
      data: { coverPhotoId: coverPhoto.id },
    })

    const updated = await prisma.album.findUnique({
      where: { id: album.id },
    })

    expect(updated?.coverPhotoId).toBe(coverPhoto.id)
  })

  it('should feature photo on homepage', async () => {
    const photo = await prisma.photo.create({
      data: {
        filename: 'featured-photo.jpg',
        originalName: 'featured-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: '/uploads/featured-photo.jpg',
        category: 'TOURNAMENT',
        uploadedBy: testData.users.playerUser.id,
        approved: true,
        isPublic: true,
        isFeatured: false,
      },
    })

    // Feature the photo
    const featured = await prisma.photo.update({
      where: { id: photo.id },
      data: { isFeatured: true },
    })

    expect(featured.isFeatured).toBe(true)

    // Get all featured photos
    const featuredPhotos = await prisma.photo.findMany({
      where: { isFeatured: true },
    })

    expect(featuredPhotos.length).toBeGreaterThan(0)
  })

  it('should filter photos by category', async () => {
    await prisma.photo.createMany({
      data: [
        {
          filename: 'tournament1.jpg',
          originalName: 'tournament1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024000,
          width: 1920,
          height: 1080,
          url: '/uploads/tournament1.jpg',
          category: 'TOURNAMENT',
          uploadedBy: testData.users.playerUser.id,
          approved: true,
          isPublic: true,
        },
        {
          filename: 'course1.jpg',
          originalName: 'course1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024000,
          width: 1920,
          height: 1080,
          url: '/uploads/course1.jpg',
          category: 'COURSE',
          uploadedBy: testData.users.playerUser.id,
          approved: true,
          isPublic: true,
        },
      ],
    })

    const tournamentPhotos = await prisma.photo.findMany({
      where: { category: 'TOURNAMENT' },
    })

    const coursePhotos = await prisma.photo.findMany({
      where: { category: 'COURSE' },
    })

    expect(tournamentPhotos.length).toBeGreaterThanOrEqual(1)
    expect(coursePhotos.length).toBeGreaterThanOrEqual(1)
  })

  it('should filter photos by tournament', async () => {
    const tournament2 = await prisma.tournament.create({
      data: {
        name: 'Second Tournament',
        format: 'STABLEFORD',
        category: 'CASUAL',
        status: 'COMPLETED',
        tournamentDate: new Date(),
        registrationStart: new Date(),
        registrationEnd: new Date(),
        courseId: testData.course.id,
        clubId: testData.club.id,
        teesUsed: { men: 'white', women: 'red' },
        maxPlayers: 100,
        minPlayers: 4,
        createdBy: testData.users.adminUser.id,
      },
    })

    await prisma.photo.createMany({
      data: [
        {
          filename: 't1-photo.jpg',
          originalName: 't1-photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024000,
          width: 1920,
          height: 1080,
          url: '/uploads/t1-photo.jpg',
          category: 'TOURNAMENT',
          tournamentId: testData.tournament.id,
          uploadedBy: testData.users.playerUser.id,
          approved: true,
          isPublic: true,
        },
        {
          filename: 't2-photo.jpg',
          originalName: 't2-photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024000,
          width: 1920,
          height: 1080,
          url: '/uploads/t2-photo.jpg',
          category: 'TOURNAMENT',
          tournamentId: tournament2.id,
          uploadedBy: testData.users.playerUser.id,
          approved: true,
          isPublic: true,
        },
      ],
    })

    const t1Photos = await prisma.photo.count({
      where: { tournamentId: testData.tournament.id },
    })

    const t2Photos = await prisma.photo.count({
      where: { tournamentId: tournament2.id },
    })

    expect(t1Photos).toBeGreaterThanOrEqual(1)
    expect(t2Photos).toBeGreaterThanOrEqual(1)
  })

  it('should get pending photos for moderation', async () => {
    await prisma.photo.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        filename: `pending-${i}.jpg`,
        originalName: `pending-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/pending-${i}.jpg`,
        category: 'TOURNAMENT',
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
      })),
    })

    const pending = await prisma.photo.findMany({
      where: { approved: false },
      orderBy: { createdAt: 'desc' },
    })

    expect(pending.length).toBe(5)
  })

  it('should handle batch photo upload', async () => {
    const photos = await prisma.photo.createMany({
      data: Array.from({ length: 20 }, (_, i) => ({
        filename: `batch-${i}.jpg`,
        originalName: `batch-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/batch-${i}.jpg`,
        category: 'TOURNAMENT',
        tournamentId: testData.tournament.id,
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
      })),
    })

    const uploaded = await prisma.photo.count({
      where: {
        tournamentId: testData.tournament.id,
        uploadedBy: testData.users.playerUser.id,
      },
    })

    expect(uploaded).toBe(20)
  })
})
