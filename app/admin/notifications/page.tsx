'use client'

/**
 * Admin Notification Sender Page
 * Allows admins to send custom push notifications
 */

import { useState } from 'react'
import { Send, Users, Trophy, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NotificationPreview } from '@/components/push/notification-preview'

type TargetType = 'user' | 'tournament' | 'topic'

export default function AdminNotificationsPage() {
  const [target, setTarget] = useState<TargetType>('topic')
  const [targetId, setTargetId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState('/icons/icon-192x192.png')
  const [image, setImage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{ delivered: number; failed: number } | null>(null)

  const handleSend = async () => {
    if (!title || !body) {
      alert('Please fill in title and body')
      return
    }

    if (!targetId) {
      alert('Please specify a target')
      return
    }

    setIsSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          targetId,
          notification: {
            title,
            body,
            icon,
            url: url || '/',
            image: image || undefined,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
        alert(`Notification sent to ${data.result.delivered} subscriber(s)`)

        // Reset form
        setTitle('')
        setBody('')
        setUrl('')
        setImage('')
      } else {
        alert(`Failed to send notification: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      alert('Failed to send notification. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const previewNotification = {
    title,
    body,
    icon,
    image: image || undefined,
    url: url || '/',
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Send Push Notification</h1>
        <p className="text-muted-foreground">
          Send custom push notifications to users, tournaments, or topic subscribers
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          {/* Target Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Target</CardTitle>
              <CardDescription>Who should receive this notification?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTarget('topic')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    target === 'topic'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Megaphone className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Topic</div>
                </button>
                <button
                  onClick={() => setTarget('tournament')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    target === 'tournament'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Trophy className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Tournament</div>
                </button>
                <button
                  onClick={() => setTarget('user')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    target === 'user'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">User</div>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {target === 'topic' && 'Topic Name'}
                  {target === 'tournament' && 'Tournament ID'}
                  {target === 'user' && 'User ID'}
                </label>
                {target === 'topic' ? (
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select topic...</option>
                    <option value="tournaments">Tournaments</option>
                    <option value="scores">Scores</option>
                    <option value="announcements">Announcements</option>
                    <option value="reminders">Reminders</option>
                    <option value="photos">Photos</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder={`Enter ${target} ID...`}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Notification message details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  maxLength={100}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {title.length}/100 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Body <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification message"
                  maxLength={300}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {body.length}/300 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Click URL (optional)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/tournaments/123"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isSending || !title || !body || !targetId}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Notification'}
          </Button>

          {/* Result */}
          {result && (
            <Card className="border-green-500 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {result.delivered}
                  </div>
                  <div className="text-sm text-green-600">
                    Notifications delivered successfully
                  </div>
                  {result.failed > 0 && (
                    <div className="text-sm text-red-600 mt-2">
                      {result.failed} failed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How the notification will appear on devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreview notification={previewNotification} />
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Badge variant="outline">Title</Badge>
                <span className="text-muted-foreground">
                  Keep it short and descriptive (max 100 chars)
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Body</Badge>
                <span className="text-muted-foreground">
                  Clear and actionable message (max 300 chars)
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Timing</Badge>
                <span className="text-muted-foreground">
                  Send during appropriate hours
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Image</Badge>
                <span className="text-muted-foreground">
                  Use for important announcements only
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
