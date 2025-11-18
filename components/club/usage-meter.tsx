/**
 * Usage Meter Component
 * Shows tier limits usage with progress bar
 */

'use client'

interface UsageMeterProps {
  label: string
  used: number
  limit: number | null
  unit: string
  className?: string
}

export function UsageMeter({ label, used, limit, unit, className = '' }: UsageMeterProps) {
  const isUnlimited = limit === null
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {used} {isUnlimited ? '' : `/ ${limit}`} {unit}
        </span>
      </div>

      {!isUnlimited && (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all ${
                isAtLimit
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {isAtLimit && (
            <p className="text-xs text-red-600">
              You've reached your limit. Please upgrade to add more.
            </p>
          )}

          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-amber-600">
              You're approaching your limit. Consider upgrading.
            </p>
          )}
        </>
      )}

      {isUnlimited && (
        <p className="text-xs text-gray-500">Unlimited</p>
      )}
    </div>
  )
}

/**
 * Usage Summary Component
 * Shows all usage metrics for a club
 */
interface UsageSummaryProps {
  usage: {
    tournaments: { used: number; limit: number | null }
    players: { used: number; limit: number | null }
  }
  className?: string
}

export function UsageSummary({ usage, className = '' }: UsageSummaryProps) {
  return (
    <div className={`space-y-4 rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>

      <UsageMeter
        label="Tournaments"
        used={usage.tournaments.used}
        limit={usage.tournaments.limit}
        unit="tournaments"
      />

      <UsageMeter
        label="Players"
        used={usage.players.used}
        limit={usage.players.limit}
        unit="players"
      />
    </div>
  )
}
