/**
 * Performance Test: Batch Photo Upload
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { resetDatabase, disconnectDatabase, prisma } from '../helpers/test-db'

describe('Photo Upload Performance', () => {
  let testData: any

  beforeEach(async () => {
    testData = await resetDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('should handle batch upload of 10+ photos efficiently', async () => {
    const photoCount = 15

    const startTime = performance.now()

    // Simulate batch upload
    const photos = await prisma.photo.createMany({
      data: Array.from({ length: photoCount }, (_, i) => ({
        filename: `batch-photo-${i}.jpg`,
        originalName: `photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 2048000 + i * 100000, // Varying sizes
        width: 1920,
        height: 1080,
        url: `/uploads/batch-photo-${i}.jpg`,
        thumbnailUrl: `/uploads/batch-photo-${i}-thumb.jpg`,
        mediumUrl: `/uploads/batch-photo-${i}-medium.jpg`,
        category: 'TOURNAMENT',
        tournamentId: testData.tournament.id,
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
      })),
    })

    const endTime = performance.now()
    const processingTime = endTime - startTime

    expect(photos.count).toBe(photoCount)
    expect(processingTime).toBeLessThan(2000) // Should complete in < 2 seconds
  })

  it('should query photo gallery with 100+ photos efficiently', async () => {
    // Create 150 photos
    await prisma.photo.createMany({
      data: Array.from({ length: 150 }, (_, i) => ({
        filename: `gallery-photo-${i}.jpg`,
        originalName: `photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/gallery-photo-${i}.jpg`,
        category: i % 2 === 0 ? 'TOURNAMENT' : 'COURSE',
        tournamentId: i % 3 === 0 ? testData.tournament.id : null,
        uploadedBy: testData.users.playerUser.id,
        approved: true,
        isPublic: true,
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000),
      })),
    })

    const startTime = performance.now()

    // Query gallery with filters
    const gallery = await prisma.photo.findMany({
      where: {
        approved: true,
        isPublic: true,
      },
      include: {
        uploader: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(gallery.length).toBe(50)
    expect(queryTime).toBeLessThan(500)
  })

  it('should paginate photo gallery efficiently', async () => {
    await prisma.photo.createMany({
      data: Array.from({ length: 200 }, (_, i) => ({
        filename: `paginate-photo-${i}.jpg`,
        originalName: `photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/paginate-photo-${i}.jpg`,
        category: 'TOURNAMENT',
        uploadedBy: testData.users.playerUser.id,
        approved: true,
        isPublic: true,
        createdAt: new Date(Date.now() - i * 60 * 1000),
      })),
    })

    const pageSize = 24
    const startTime = performance.now()

    const pages = await Promise.all([
      prisma.photo.findMany({
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: 0,
      }),
      prisma.photo.findMany({
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: pageSize,
      }),
      prisma.photo.findMany({
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: pageSize * 2,
      }),
    ])

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(pages[0].length).toBe(pageSize)
    expect(pages[1].length).toBe(pageSize)
    expect(pages[2].length).toBe(pageSize)
    expect(queryTime).toBeLessThan(1000)
  })

  it('should filter photos by category efficiently', async () => {
    await prisma.photo.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        filename: `category-photo-${i}.jpg`,
        originalName: `photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/category-photo-${i}.jpg`,
        category: ['TOURNAMENT', 'COURSE', 'CLUBHOUSE', 'SOCIAL'][i % 4] as any,
        uploadedBy: testData.users.playerUser.id,
        approved: true,
        isPublic: true,
      })),
    })

    const startTime = performance.now()

    const [tournament, course, clubhouse, social] = await Promise.all([
      prisma.photo.count({ where: { category: 'TOURNAMENT' } }),
      prisma.photo.count({ where: { category: 'COURSE' } }),
      prisma.photo.count({ where: { category: 'CLUBHOUSE' } }),
      prisma.photo.count({ where: { category: 'SOCIAL' } }),
    ])

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(tournament + course + clubhouse + social).toBe(100)
    expect(queryTime).toBeLessThan(500)
  })

  it('should get pending photos count efficiently', async () => {
    await prisma.photo.createMany({
      data: Array.from({ length: 50 }, (_, i) => ({
        filename: `pending-photo-${i}.jpg`,
        originalName: `photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        url: `/uploads/pending-photo-${i}.jpg`,
        category: 'TOURNAMENT',
        uploadedBy: testData.users.playerUser.id,
        approved: false,
        isPublic: true,
      })),
    })

    const startTime = performance.now()

    const pendingCount = await prisma.photo.count({
      where: { approved: false },
    })

    const endTime = performance.now()
    const queryTime = endTime - startTime

    expect(pendingCount).toBe(50)
    expect(queryTime).toBeLessThan(100) // Very fast count query
  })

  it('should handle concurrent photo uploads', async () => {
    const batchCount = 5
    const photosPerBatch = 10

    const startTime = performance.now()

    // Simulate 5 concurrent batch uploads
    const uploads = Array.from({ length: batchCount }, (_, batchIndex) =>
      prisma.photo.createMany({
        data: Array.from({ length: photosPerBatch }, (_, photoIndex) => ({
          filename: `concurrent-batch${batchIndex}-photo${photoIndex}.jpg`,
          originalName: `photo.jpg`,
          mimeType: 'image/jpeg',
          fileSize: 1024000,
          width: 1920,
          height: 1080,
          url: `/uploads/concurrent-batch${batchIndex}-photo${photoIndex}.jpg`,
          category: 'TOURNAMENT',
          uploadedBy: testData.users.playerUser.id,
          approved: false,
          isPublic: true,
        })),
      })
    )

    const results = await Promise.all(uploads)

    const endTime = performance.now()
    const processingTime = endTime - startTime

    const totalUploaded = results.reduce((sum, result) => sum + result.count, 0)

    expect(totalUploaded).toBe(batchCount * photosPerBatch)
    expect(processingTime).toBeLessThan(3000)
  })
})
