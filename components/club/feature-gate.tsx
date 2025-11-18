/**
 * Feature Gate Component
 * Conditionally renders content based on club features
 */

'use client'

import { ReactNode } from 'react'
import { Feature } from '@/lib/features'

interface FeatureGateProps {
  feature: Feature
  children: ReactNode
  fallback?: ReactNode
  clubFeatures?: string[]
}

export function FeatureGate({ feature, children, fallback = null, clubFeatures }: FeatureGateProps) {
  // Check if feature is enabled
  const hasFeature = clubFeatures?.includes(feature) || false

  if (!hasFeature) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Upgrade Prompt Component
 * Shows when a feature is not available
 */
interface UpgradePromptProps {
  feature: string
  requiredTier: string
  className?: string
}

export function UpgradePrompt({ feature, requiredTier, className = '' }: UpgradePromptProps) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">Upgrade Required</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              The <strong>{feature}</strong> feature requires a <strong>{requiredTier}</strong> plan or
              higher.
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/admin/billing/upgrade"
              className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
