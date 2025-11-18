'use client'

/**
 * Gallery Page
 * Main photo gallery with filtering and search
 */

import React, { useState, useEffect } from 'react'
import { PhotoGrid, Photo } from '@/components/gallery/photo-grid'
import { PhotoViewer } from '@/components/gallery/photo-viewer'
import { Search, Filter } from 'lucide-react'
import { PhotoCategory } from '@/domain/entities/photo'

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Fetch photos
  useEffect(() => {
    fetchPhotos()
  }, [category, page])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        approved: 'true',
        isPublic: 'true',
      })

      if (category !== 'all') {
        params.append('category', category)
      }

      const response = await fetch(`/api/photos?${params}`)
      const data = await response.json()

      setPhotos(data.photos)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoClick = (photo: Photo, index: number) => {
    setCurrentPhotoIndex(index)
    setViewerOpen(true)
  }

  const categories = [
    { value: 'all', label: 'All Photos' },
    { value: PhotoCategory.TOURNAMENT, label: 'Tournament' },
    { value: PhotoCategory.COURSE, label: 'Course' },
    { value: PhotoCategory.CLUBHOUSE, label: 'Clubhouse' },
    { value: PhotoCategory.SOCIAL, label: 'Social' },
    { value: PhotoCategory.AWARDS, label: 'Awards' },
    { value: PhotoCategory.ACTION_SHOT, label: 'Action Shots' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h1>
        <p className="text-gray-600">
          Browse our collection of golf tournament photos
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category filter */}
          <div className="flex-1">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Filter className="inline h-4 w-4 mr-1" />
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading photos...</p>
        </div>
      ) : (
        <>
          <PhotoGrid photos={photos} onPhotoClick={handlePhotoClick} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}

          {/* Lightbox viewer */}
          <PhotoViewer
            photos={photos}
            currentIndex={currentPhotoIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            onNavigate={setCurrentPhotoIndex}
          />
        </>
      )}
    </div>
  )
}
