'use client'

/**
 * Notification Preferences Component
 * Allows users to manage their notification settings
 */

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getPushState,
  subscribe,
  unsubscribe,
  sendTestNotification,
  isPushSupported,
} from '@/lib/push-manager'

interface NotificationPreferencesProps {
  userId?: string
}

const AVAILABLE_TOPICS = [
  { id: 'tournaments', label: 'Tournament Updates', description: 'Registration, start times, results' },
  { id: 'scores', label: 'Score Updates', description: 'Leaderboard changes, score submissions' },
  { id: 'announcements', label: 'Announcements', description: 'Club news and updates' },
  { id: 'reminders', label: 'Reminders', description: 'Tournament reminders and deadlines' },
  { id: 'photos', label: 'Photos', description: 'New tournament photos' },
]

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    loadPushState()
  }, [])

  const loadPushState = async () => {
    if (!isPushSupported()) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    const state = await getPushState()
    setPermission(state.permission)
    setIsSubscribed(state.isSubscribed)

    // Load selected topics from local storage or default
    const saved = localStorage.getItem('notification-topics')
    if (saved) {
      setSelectedTopics(JSON.parse(saved))
    } else {
      setSelectedTopics(['tournaments', 'announcements'])
    }
  }

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      await subscribe(selectedTopics)
      localStorage.setItem('notification-topics', JSON.stringify(selectedTopics))
      await loadPushState()
    } catch (error) {
      console.error('Failed to subscribe:', error)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to disable notifications?')) {
      return
    }

    setIsLoading(true)
    try {
      await unsubscribe()
      await loadPushState()
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      alert('Failed to disable notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    setIsTesting(true)
    try {
      await sendTestNotification()
      alert('Test notification sent! Check your notifications.')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      alert('Failed to send test notification. Make sure you\'re subscribed.')
    } finally {
      setIsTesting(false)
    }
  }

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((t) => t !== topicId)
      } else {
        return [...prev, topicId]
      }
    })
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications Not Supported</CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </div>
            {isSubscribed ? (
              <Badge variant="default" className="gap-1">
                <Bell className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <BellOff className="h-3 w-3" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'denied' ? (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                <div className="space-y-2">
                  {AVAILABLE_TOPICS.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleTopic(topic.id)}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                          selectedTopics.includes(topic.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selectedTopics.includes(topic.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{topic.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {topic.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {isSubscribed ? (
                  <>
                    <Button
                      onClick={handleUnsubscribe}
                      variant="outline"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Disabling...' : 'Disable Notifications'}
                    </Button>
                    <Button
                      onClick={handleTestNotification}
                      variant="secondary"
                      disabled={isTesting}
                    >
                      {isTesting ? 'Sending...' : 'Send Test'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleSubscribe}
                    disabled={isLoading || selectedTopics.length === 0}
                    className="flex-1"
                  >
                    {isLoading ? 'Enabling...' : 'Enable Notifications'}
                  </Button>
                )}
              </div>

              {selectedTopics.length === 0 && !isSubscribed && (
                <p className="text-sm text-muted-foreground text-center">
                  Select at least one notification type to continue
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
