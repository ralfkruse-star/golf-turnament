/**
 * Tier Badge Component
 * Displays club tier with appropriate styling
 */

import { Badge } from '@/components/ui/badge'
import { ClubTier } from '@/domain/entities/club'

interface TierBadgeProps {
  tier: ClubTier
  className?: string
}

const tierConfig: Record<
  ClubTier,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className: string
  }
> = {
  FREE: {
    label: 'Free',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  BASIC: {
    label: 'Basic',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  PREMIUM: {
    label: 'Premium',
    variant: 'default',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    variant: 'default',
    className: 'bg-amber-100 text-amber-800 border-amber-300',
  },
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
  const config = tierConfig[tier]

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  )
}
