'use client'

/**
 * PhotoViewer Component
 * Lightbox viewer with keyboard navigation
 */

import React, { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Photo } from './photo-grid'

interface PhotoViewerProps {
  photos: Photo[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (index: number) => void
}

export function PhotoViewer({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: PhotoViewerProps) {
  const currentPhoto = photos[currentIndex]

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        navigatePrevious()
      } else if (e.key === 'ArrowRight') {
        navigateNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const navigatePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      onNavigate?.(newIndex)
    }
  }, [currentIndex, onNavigate])

  const navigateNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1
      onNavigate?.(newIndex)
    }
  }, [currentIndex, photos.length, onNavigate])

  const handleDownload = useCallback(() => {
    if (!currentPhoto) return

    const link = document.createElement('a')
    link.href = currentPhoto.url
    link.download = `photo-${currentPhoto.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [currentPhoto])

  if (!isOpen || !currentPhoto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-16 z-10 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Download"
      >
        <Download className="h-6 w-6" />
      </button>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={navigatePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Next button */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={navigateNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Photo container */}
      <div className="relative max-w-7xl max-h-[90vh] mx-auto px-4">
        <div className="relative">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Photo'}
            width={currentPhoto.width}
            height={currentPhoto.height}
            className="max-w-full max-h-[80vh] object-contain"
            priority
          />
        </div>

        {/* Photo info */}
        <div className="mt-4 text-center">
          {currentPhoto.caption && (
            <p className="text-white text-lg mb-2">{currentPhoto.caption}</p>
          )}
          <p className="text-white/60 text-sm">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      />
    </div>
  )
}
