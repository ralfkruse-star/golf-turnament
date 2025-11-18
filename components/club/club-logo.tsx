/**
 * Club Logo Component
 * Displays club logo with fallback to club name
 */

import Image from 'next/image'

interface ClubLogoProps {
  logo?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
}

export function ClubLogo({ logo, name, size = 'md', className = '' }: ClubLogoProps) {
  const sizeClass = sizeClasses[size]

  if (logo) {
    return (
      <div className={`relative ${sizeClass} ${className}`}>
        <Image
          src={logo}
          alt={`${name} logo`}
          fill
          className="object-contain"
          priority
        />
      </div>
    )
  }

  // Fallback: Show initials in a circle
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`${sizeClass} ${className} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold`}
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-foreground)',
      }}
    >
      {initials}
    </div>
  )
}
