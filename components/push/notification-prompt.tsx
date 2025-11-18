'use client'

/**
 * Notification Permission Prompt Component
 * Shows a prompt to request notification permissions
 */

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getPermissionStatus,
  requestPermission,
  subscribe,
  isPushSupported,
} from '@/lib/push-manager'

interface NotificationPromptProps {
  onSubscribe?: () => void
  onDismiss?: () => void
  defaultTopics?: string[]
}

export function NotificationPrompt({
  onSubscribe,
  onDismiss,
  defaultTopics = ['tournaments', 'announcements'],
}: NotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    setIsSupported(isPushSupported())
    if (isPushSupported()) {
      setPermission(getPermissionStatus())
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('notification-prompt-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      const result = await requestPermission()
      setPermission(result)

      if (result === 'granted') {
        await subscribe(defaultTopics)
        onSubscribe?.()
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('notification-prompt-dismissed', 'true')
    onDismiss?.()
  }

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || isDismissed) {
    return null
  }

  // Show different message if denied
  if (permission === 'denied') {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-destructive" />
              <CardTitle>Notifications Blocked</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            You've blocked notifications. To receive updates, please enable them in your
            browser settings.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Stay Updated</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Get real-time updates about tournaments, scores, and announcements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
          >
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
