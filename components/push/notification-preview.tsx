'use client'

/**
 * Notification Preview Component
 * Shows a preview of how a notification will look
 */

import { Bell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PushNotification } from '@/infrastructure/services/push-service'

interface NotificationPreviewProps {
  notification: Partial<PushNotification>
}

export function NotificationPreview({ notification }: NotificationPreviewProps) {
  const {
    title = 'Notification Title',
    body = 'Notification body text goes here',
    icon = '/icons/icon-192x192.png',
    image,
    actions = [],
  } = notification

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Preview</div>
      <Card className="max-w-md">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {icon ? (
                <img
                  src={icon}
                  alt="Notification icon"
                  className="h-10 w-10 rounded"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1 truncate">{title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {body}
              </div>

              {/* Image */}
              {image && (
                <div className="mt-2">
                  <img
                    src={image}
                    alt="Notification"
                    className="rounded w-full max-h-32 object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              {actions && actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className="text-xs font-medium text-primary hover:underline"
                      disabled
                    >
                      {action.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground mt-2">
            Just now
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
