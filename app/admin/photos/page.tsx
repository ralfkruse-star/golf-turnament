'use client'

/**
 * Admin Photos Moderation Page
 * Approve/reject uploaded photos
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Check, X, Trash2, Star } from 'lucide-react'
import { Photo } from '@/components/gallery/photo-grid'
import { format } from 'date-fns'

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')

  useEffect(() => {
    fetchPhotos()
  }, [filter])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      })

      if (filter === 'pending') {
        params.append('approved', 'false')
      } else if (filter === 'approved') {
        params.append('approved', 'true')
      }

      const response = await fetch(`/api/photos?${params}`)
      const data = await response.json()

      setPhotos(data.photos)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const approvePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: true,
        }),
      })

      if (response.ok) {
        // Remove from list or refetch
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to approve photo:', error)
    }
  }

  const rejectPhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: false,
        }),
      })

      if (response.ok) {
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to reject photo:', error)
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to delete photo:', error)
    }
  }

  const toggleFeatured = async (photo: any) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFeatured: !photo.isFeatured,
        }),
      })

      if (response.ok) {
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading photos...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Photo Moderation
        </h1>
        <p className="text-gray-600">
          Review and approve photos submitted by users
        </p>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 font-medium ${
              filter === 'pending'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-6 py-3 font-medium ${
              filter === 'approved'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 font-medium ${
              filter === 'all'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Photos
          </button>
        </div>
      </div>

      {/* Photos list */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo: any) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="relative aspect-video">
                <Image
                  src={photo.mediumUrl || photo.url}
                  alt={photo.caption || 'Photo'}
                  fill
                  className="object-cover"
                />
                {photo.isFeatured && (
                  <div className="absolute top-2 right-2">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* Photo info */}
                <div className="mb-4">
                  {photo.caption && (
                    <p className="text-sm text-gray-700 mb-2">
                      {photo.caption}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Category: {photo.category}</p>
                    {photo.tournament && (
                      <p>Tournament: {photo.tournament.name}</p>
                    )}
                    {photo.uploader && (
                      <p>Uploaded by: {photo.uploader.name}</p>
                    )}
                    <p>
                      Uploaded: {format(new Date(photo.createdAt), 'MMM d, yyyy')}
                    </p>
                    <p>
                      Status:{' '}
                      <span
                        className={
                          photo.approved ? 'text-green-600' : 'text-yellow-600'
                        }
                      >
                        {photo.approved ? 'Approved' : 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!photo.approved ? (
                    <button
                      onClick={() => approvePhoto(photo.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1 text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => rejectPhoto(photo.id)}
                      className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center justify-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Unapprove
                    </button>
                  )}

                  <button
                    onClick={() => toggleFeatured(photo)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center text-sm ${
                      photo.isFeatured
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={photo.isFeatured ? 'Unfeature' : 'Feature'}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        photo.isFeatured ? 'fill-current' : ''
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center text-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">
            {filter === 'pending'
              ? 'No photos pending approval'
              : 'No photos found'}
          </p>
        </div>
      )}
    </div>
  )
}
