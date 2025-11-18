/**
 * Club Selector Component
 * Allows users to switch between clubs they're a member of
 */

'use client'

import { useState } from 'react'
import { ClubLogo } from './club-logo'
import { TierBadge } from './tier-badge'
import { ClubTier } from '@/domain/entities/club'

interface Club {
  id: string
  name: string
  slug: string
  tier: ClubTier
  logo: string | null
}

interface ClubSelectorProps {
  clubs: Club[]
  currentClubId: string
  onClubChange: (clubId: string) => void
  className?: string
}

export function ClubSelector({ clubs, currentClubId, onClubChange, className = '' }: ClubSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentClub = clubs.find((c) => c.id === currentClubId)

  if (clubs.length === 0) {
    return null
  }

  if (clubs.length === 1) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <ClubLogo logo={currentClub?.logo} name={currentClub?.name || ''} size="sm" />
        <span className="font-medium">{currentClub?.name}</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <ClubLogo logo={currentClub?.logo} name={currentClub?.name || ''} size="sm" />
        <div className="flex-1">
          <div className="font-medium">{currentClub?.name}</div>
          <div className="text-xs text-gray-500">{clubs.length} clubs</div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => {
                  onClubChange(club.id)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                  club.id === currentClubId ? 'bg-gray-50' : ''
                }`}
              >
                <ClubLogo logo={club.logo} name={club.name} size="sm" />
                <div className="flex-1">
                  <div className="font-medium">{club.name}</div>
                  <div className="text-xs text-gray-500">{club.slug}</div>
                </div>
                <TierBadge tier={club.tier} />
                {club.id === currentClubId && (
                  <svg
                    className="h-5 w-5 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
