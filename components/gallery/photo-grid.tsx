'use client'

/**
 * PhotoGrid Component
 * Responsive masonry grid layout for photos
 */

import React from 'react'
import Image from 'next/image'

export interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  mediumUrl?: string
  caption?: string
  width: number
  height: number
  category: string
}

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo, index: number) => void
  columns?: {
    sm?: number
    md?: number
    lg?: number
  }
}

export function PhotoGrid({
  photos,
  onPhotoClick,
  columns = { sm: 1, md: 2, lg: 3 },
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No photos to display</p>
      </div>
    )
  }

  return (
    <div
      className={`
        grid gap-4
        grid-cols-${columns.sm || 1}
        md:grid-cols-${columns.md || 2}
        lg:grid-cols-${columns.lg || 3}
      `}
      style={{
        gridAutoRows: '10px',
      }}
    >
      {photos.map((photo, index) => {
        // Calculate grid row span based on aspect ratio
        const aspectRatio = photo.height / photo.width
        const rowSpan = Math.ceil(aspectRatio * 30) // Adjust multiplier for desired sizing

        return (
          <div
            key={photo.id}
            className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
            style={{
              gridRowEnd: `span ${rowSpan}`,
            }}
            onClick={() => onPhotoClick?.(photo, index)}
          >
            <div className="relative w-full h-full">
              <Image
                src={photo.mediumUrl || photo.url}
                alt={photo.caption || 'Photo'}
                width={photo.width}
                height={photo.height}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Caption overlay */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
