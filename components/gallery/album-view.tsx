'use client'

/**
 * AlbumView Component
 * Display album with photos in a grid
 */

import React, { useState } from 'react'
import { PhotoGrid, Photo } from './photo-grid'
import { PhotoViewer } from './photo-viewer'
import { Calendar, Image as ImageIcon } from 'lucide-react'
import { formatDistance } from 'date-fns'

export interface Album {
  id: string
  title: string
  description?: string
  coverPhotoId?: string
  isPublic: boolean
  createdAt: Date | string
  photos: Photo[]
  _count?: {
    photos: number
  }
}

interface AlbumViewProps {
  album: Album
}

export function AlbumView({ album }: AlbumViewProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const handlePhotoClick = (photo: Photo, index: number) => {
    setCurrentPhotoIndex(index)
    setViewerOpen(true)
  }

  const createdDate = new Date(album.createdAt)

  return (
    <div className="space-y-6">
      {/* Album header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {album.title}
        </h1>

        {album.description && (
          <p className="text-gray-600 mb-4">{album.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <span>
              {album._count?.photos || album.photos.length} photos
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Created {formatDistance(createdDate, new Date(), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      {album.photos.length > 0 ? (
        <>
          <PhotoGrid
            photos={album.photos}
            onPhotoClick={handlePhotoClick}
          />

          <PhotoViewer
            photos={album.photos}
            currentIndex={currentPhotoIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            onNavigate={setCurrentPhotoIndex}
          />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No photos in this album yet</p>
        </div>
      )}
    </div>
  )
}
