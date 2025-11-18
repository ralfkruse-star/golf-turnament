/**
 * Hook for managing offline score submissions
 * Queues scores locally and syncs when back online
 */

'use client'

import { useEffect, useState } from 'react'

interface PendingScore {
  id: string
  scorecardId: string
  holeNumber: number
  strokes: number
  timestamp: number
  retries: number
}

export function useOfflineScores() {
  const [pendingScores, setPendingScores] = useState<PendingScore[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load pending scores from localStorage
  useEffect(() => {
    const loadPendingScores = () => {
      const stored = localStorage.getItem('pendingScores')
      if (stored) {
        try {
          const scores = JSON.parse(stored)
          setPendingScores(scores)
        } catch (error) {
          console.error('Failed to load pending scores:', error)
          localStorage.removeItem('pendingScores')
        }
      }
    }

    loadPendingScores()
  }, [])

  // Save pending scores to localStorage whenever they change
  useEffect(() => {
    if (pendingScores.length > 0) {
      localStorage.setItem('pendingScores', JSON.stringify(pendingScores))
    } else {
      localStorage.removeItem('pendingScores')
    }
  }, [pendingScores])

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when back online
      syncPendingScores()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * Submit a score (online or queue offline)
   */
  const submitScore = async (
    scorecardId: string,
    holeNumber: number,
    strokes: number
  ): Promise<{ success: boolean; queued?: boolean; error?: string }> => {
    // Try to submit immediately if online
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/scorecards/${scorecardId}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holeNumber, strokes }),
        })

        if (response.ok) {
          return { success: true }
        }

        // If server error, queue it
        if (response.status >= 500) {
          queueScore(scorecardId, holeNumber, strokes)
          return { success: true, queued: true }
        }

        const error = await response.json()
        return { success: false, error: error.message }
      } catch (error) {
        // Network error, queue it
        queueScore(scorecardId, holeNumber, strokes)
        return { success: true, queued: true }
      }
    } else {
      // Offline, queue it immediately
      queueScore(scorecardId, holeNumber, strokes)
      return { success: true, queued: true }
    }
  }

  /**
   * Queue a score for later submission
   */
  const queueScore = (scorecardId: string, holeNumber: number, strokes: number) => {
    const pendingScore: PendingScore = {
      id: `${scorecardId}-${holeNumber}-${Date.now()}`,
      scorecardId,
      holeNumber,
      strokes,
      timestamp: Date.now(),
      retries: 0,
    }

    setPendingScores((prev) => {
      // Remove any existing pending score for the same hole
      const filtered = prev.filter(
        (s) => !(s.scorecardId === scorecardId && s.holeNumber === holeNumber)
      )
      return [...filtered, pendingScore]
    })

    console.log('[Offline] Score queued for sync:', pendingScore)
  }

  /**
   * Sync all pending scores to the server
   */
  const syncPendingScores = async () => {
    if (pendingScores.length === 0 || isSyncing || !navigator.onLine) {
      return
    }

    setIsSyncing(true)
    console.log('[Sync] Syncing', pendingScores.length, 'pending scores...')

    const successes: string[] = []
    const failures: PendingScore[] = []

    for (const score of pendingScores) {
      try {
        const response = await fetch(`/api/scorecards/${score.scorecardId}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            holeNumber: score.holeNumber,
            strokes: score.strokes,
          }),
        })

        if (response.ok) {
          successes.push(score.id)
          console.log('[Sync] Score synced successfully:', score.id)
        } else {
          // Retry logic
          if (score.retries < 3) {
            failures.push({ ...score, retries: score.retries + 1 })
          } else {
            console.error('[Sync] Score failed after 3 retries, discarding:', score.id)
          }
        }
      } catch (error) {
        console.error('[Sync] Error syncing score:', error)
        if (score.retries < 3) {
          failures.push({ ...score, retries: score.retries + 1 })
        }
      }
    }

    // Update pending scores (remove successes, keep failures for retry)
    setPendingScores(failures)

    setIsSyncing(false)

    if (successes.length > 0) {
      console.log('[Sync] Synced', successes.length, 'scores successfully')
    }
    if (failures.length > 0) {
      console.log('[Sync]', failures.length, 'scores failed, will retry')
    }

    return {
      synced: successes.length,
      failed: failures.length,
    }
  }

  /**
   * Clear all pending scores (useful for testing or manual reset)
   */
  const clearPendingScores = () => {
    setPendingScores([])
    localStorage.removeItem('pendingScores')
  }

  return {
    isOnline,
    isSyncing,
    pendingScores,
    pendingCount: pendingScores.length,
    submitScore,
    syncPendingScores,
    clearPendingScores,
  }
}
