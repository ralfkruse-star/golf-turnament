/**
 * Service Worker for Golf Tournament Management PWA
 * Provides offline capabilities and caching strategies
 */

const CACHE_VERSION = 'v1.0.0'
const CACHE_NAME = `golf-tournament-${CACHE_VERSION}`

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
]

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/tournaments\/[^/]+$/,           // Tournament details
  /^\/api\/tournaments\/[^/]+\/leaderboard$/, // Leaderboard
  /^\/api\/tournaments\/[^/]+\/flights$/,     // Flights
]

// Dynamic content cache duration (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION)

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      console.log('[SW] Service Worker installed successfully')
      return self.skipWaiting() // Activate immediately
    })
  )
})

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION)

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service Worker activated')
      return self.clients.claim() // Take control of all pages
    })
  )
})

/**
 * Fetch Event - Network-first strategy with cache fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle scoring page requests (critical for offline)
  if (url.pathname.includes('/scoring') || url.pathname.includes('/scorecard')) {
    event.respondWith(handleScoringRequest(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Default: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        })
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline')
        })
      })
  )
})

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  const url = new URL(request.url)

  // POST/PUT/DELETE requests should always go to network
  if (request.method !== 'GET') {
    try {
      return await fetch(request)
    } catch (error) {
      console.error('[SW] API request failed:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Network unavailable. Changes will sync when online.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // GET requests: Network-first with cache fallback
  try {
    const response = await fetch(request)

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', url.pathname)

    const cached = await caches.match(request)
    if (cached) {
      console.log('[SW] Serving from cache:', url.pathname)

      // Add offline indicator to response headers
      const headers = new Headers(cached.headers)
      headers.set('X-Served-From-Cache', 'true')

      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      })
    }

    // No cache available
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No cached data available',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Handle scoring page requests (critical for offline scoring)
 */
async function handleScoringRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)

    // Cache the response
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())

    return response
  } catch (error) {
    // Network failed, use cache
    const cached = await caches.match(request)

    if (cached) {
      console.log('[SW] Serving scoring page from cache')
      return cached
    }

    // If no cache, redirect to offline page
    return caches.match('/offline')
  }
}

/**
 * Handle navigation requests
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)

    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request)

    if (cached) {
      return cached
    }

    // Show offline page
    return caches.match('/offline')
  }
}

/**
 * Background Sync - Queue failed requests for later
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores())
  }
})

/**
 * Sync pending scorecard submissions
 */
async function syncPendingScores() {
  console.log('[SW] Syncing pending scores...')

  // This would retrieve queued scores from IndexedDB
  // and attempt to submit them to the server
  // Implementation depends on IndexedDB setup

  return Promise.resolve()
}

/**
 * Push Notification Handler
 * Enhanced with rich notifications, grouping, and action handling
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  if (!event.data) {
    console.log('[SW] No data in push event')
    return
  }

  try {
    const data = event.data.json()
    console.log('[SW] Push data:', data)

    const title = data.title || 'Golf Tournament Update'
    const options = {
      body: data.body || 'You have a new tournament notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      image: data.image, // Large image for rich notifications
      vibrate: [200, 100, 200],
      tag: data.tag || 'tournament-notification', // Group notifications by tag
      renotify: true, // Vibrate even if previous notification with same tag exists
      requireInteraction: false, // Auto-dismiss after some time
      silent: data.silent || false,
      data: data.data || data, // Store full payload for click handler
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/close-icon.png',
        },
      ],
      timestamp: data.timestamp || Date.now(),
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log('[SW] Notification displayed successfully')

          // Track notification display
          return fetch('/api/analytics/notification-displayed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tag: options.tag,
              timestamp: options.timestamp,
            }),
          }).catch(err => console.log('[SW] Analytics tracking failed:', err))
        })
    )
  } catch (error) {
    console.error('[SW] Error handling push notification:', error)
  }
})

/**
 * Notification Click Handler
 * Handles notification clicks and action buttons
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  // Determine URL based on action
  let urlToOpen = '/'

  if (event.action === 'view' || !event.action) {
    // Main notification click or 'view' action
    urlToOpen = event.notification.data?.url || '/'
  } else if (event.action === 'dismiss') {
    // Just close, no navigation
    return
  } else {
    // Custom action handling
    urlToOpen = event.notification.data?.actions?.[event.action] || '/'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        const matchingClient = clientList.find(client => {
          return client.url === urlToOpen && 'focus' in client
        })

        if (matchingClient) {
          return matchingClient.focus()
        }

        // Check if any client is on the same origin
        const sameOriginClient = clientList.find(client => {
          const clientUrl = new URL(client.url)
          const targetUrl = new URL(urlToOpen, self.location.origin)
          return clientUrl.origin === targetUrl.origin && 'navigate' in client
        })

        if (sameOriginClient) {
          return sameOriginClient.navigate(urlToOpen).then(client => client.focus())
        }

        // Open new window if no existing client
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
      .then(() => {
        // Track notification click
        return fetch('/api/analytics/notification-clicked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tag: event.notification.tag,
            action: event.action || 'default',
            timestamp: Date.now(),
          }),
        }).catch(err => console.log('[SW] Analytics tracking failed:', err))
      })
  )
})

/**
 * Notification Close Handler
 * Track when notifications are dismissed
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)

  event.waitUntil(
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag: event.notification.tag,
        timestamp: Date.now(),
      }),
    }).catch(err => console.log('[SW] Analytics tracking failed:', err))
  )
})

/**
 * Message Handler - Communication with main app
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data.type === 'CACHE_SCORECARD') {
    // Cache scorecard data for offline access
    const { scorecardId, data } = event.data
    caches.open(CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify(data))
      cache.put(`/api/scorecards/${scorecardId}`, response)
    })
  }
})
