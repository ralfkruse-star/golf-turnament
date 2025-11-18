/**
 * Client-side Push Manager
 * Handles push notification subscriptions and permissions
 */

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied'

export interface PushManagerState {
  permission: NotificationPermissionStatus
  isSupported: boolean
  isSubscribed: boolean
  subscription: PushSubscription | null
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermissionStatus {
  if (!isPushSupported()) {
    return 'denied'
  }

  return Notification.permission
}

/**
 * Request notification permission from user
 */
export async function requestPermission(): Promise<NotificationPermissionStatus> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser')
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Get VAPID public key from server
 */
async function getVapidPublicKey(): Promise<string> {
  const response = await fetch('/api/push/vapid-public-key')
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to get VAPID public key')
  }

  return data.publicKey
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Subscribe to push notifications
 */
export async function subscribe(topics: string[] = []): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported')
  }

  // Check permission first
  const permission = await requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied')
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready

  // Check if already subscribed
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey()
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })
  }

  // Send subscription to server
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      topics,
    }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to subscribe to push notifications')
  }

  return subscription
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribe(): Promise<void> {
  if (!isPushSupported()) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    return
  }

  // Unsubscribe from browser
  await subscription.unsubscribe()

  // Remove from server
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  })
}

/**
 * Get current subscription
 */
export async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  const registration = await navigator.serviceWorker.ready
  return await registration.pushManager.getSubscription()
}

/**
 * Check if user is subscribed
 */
export async function isSubscribed(): Promise<boolean> {
  const subscription = await getSubscription()
  return subscription !== null
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  subscriptionId: string,
  preferences: {
    topics?: string[]
    enabled?: boolean
  }
): Promise<void> {
  const response = await fetch('/api/push/preferences', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId,
      ...preferences,
    }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to update preferences')
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification(): Promise<void> {
  const response = await fetch('/api/push/test', {
    method: 'POST',
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to send test notification')
  }
}

/**
 * Get push manager state
 */
export async function getPushState(): Promise<PushManagerState> {
  const isSupported = isPushSupported()
  const permission = getPermissionStatus()
  const subscription = isSupported ? await getSubscription() : null
  const subscribed = subscription !== null

  return {
    permission,
    isSupported,
    isSubscribed: subscribed,
    subscription,
  }
}

/**
 * Show a local notification (for testing)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications are not supported')
  }

  const permission = await requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied')
  }

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
  })
}
