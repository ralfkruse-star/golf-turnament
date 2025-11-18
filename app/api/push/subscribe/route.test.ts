/**
 * Push Subscribe API Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/infrastructure/services/push-service')
vi.mock('@/lib/prisma')

describe('POST /api/push/subscribe', () => {
  it('should subscribe to push notifications', async () => {
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-p256dh',
        auth: 'test-auth',
      },
    }

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription,
        topics: ['tournaments'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should require subscription data', async () => {
    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})
