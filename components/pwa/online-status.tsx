/**
 * Online Status Indicator Component
 * Shows the user's connection status and pending sync items
 */

'use client'

import { useEffect, useState } from 'react'

interface OnlineStatusProps {
  showBanner?: boolean
}

export function OnlineStatus({ showBanner = true }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSyncs, setPendingSyncs] = useState(0)

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[App] Back online, syncing data...')
      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
        navigator.serviceWorker.ready.then((registration) => {
          return registration.sync.register('sync-scores')
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[App] Gone offline, will cache changes')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check for pending syncs (from IndexedDB or localStorage)
    const checkPendingSyncs = () => {
      const pending = localStorage.getItem('pendingScores')
      if (pending) {
        const scores = JSON.parse(pending)
        setPendingSyncs(scores.length)
      }
    }

    checkPendingSyncs()
    const interval = setInterval(checkPendingSyncs, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!showBanner && isOnline) {
    return null
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <span>
              Offline-Modus aktiv
              {pendingSyncs > 0 && ` · ${pendingSyncs} Änderung(en) werden synchronisiert`}
            </span>
          </div>
        </div>
      )}

      {/* Back Online Banner */}
      {isOnline && pendingSyncs > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>
              Synchronisiere {pendingSyncs} Änderung(en)...
            </span>
          </div>
        </div>
      )}

      {/* Status Indicator (bottom corner) */}
      {!showBanner && (
        <div className="fixed bottom-4 right-4 z-40">
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-sm font-medium
              ${isOnline ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}
            `}
          >
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-white' : 'bg-white animate-pulse'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      )}
    </>
  )
}
