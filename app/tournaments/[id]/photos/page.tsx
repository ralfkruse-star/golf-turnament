'use client'

/**
 * Tournament Photos Page
 * Display photos for a specific tournament
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PhotoGrid, Photo } from '@/components/gallery/photo-grid'
import { PhotoViewer } from '@/components/gallery/photo-viewer'
import { PhotoUpload } from '@/components/gallery/photo-upload'
import { Calendar, MapPin, Upload as UploadIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Tournament {
  id: string
  name: string
  tournamentDate: string
}

export default function TournamentPhotosPage() {
  const params = useParams()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Fetch tournament and photos
  useEffect(() => {
    fetchTournamentPhotos()
  }, [tournamentId])

  const fetchTournamentPhotos = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/photos`)
      const data = await response.json()

      setTournament(data.tournament)
      setPhotos(data.photos)
    } catch (error) {
      console.error('Failed to fetch tournament photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoClick = (photo: Photo, index: number) => {
    setCurrentPhotoIndex(index)
    setViewerOpen(true)
  }

  const handleUploadComplete = (uploadedPhotos: any[]) => {
    // Refresh photos list
    fetchTournamentPhotos()
    setShowUpload(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading tournament photos...</p>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">Tournament not found</p>
      </div>
    )
  }

  const tournamentDate = new Date(tournament.tournamentDate)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tournament header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {tournament.name}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(tournamentDate, 'MMMM d, yyyy')}</span>
              </div>

              <div className="flex items-center gap-1">
                <span>{photos.length} photos</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <UploadIcon className="h-4 w-4" />
            Upload Photos
          </button>
        </div>
      </div>

      {/* Upload section */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Tournament Photos</h2>
          <PhotoUpload
            tournamentId={tournamentId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 ? (
        <>
          <PhotoGrid photos={photos} onPhotoClick={handlePhotoClick} />

          <PhotoViewer
            photos={photos}
            currentIndex={currentPhotoIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            onNavigate={setCurrentPhotoIndex}
          />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">
            No photos have been uploaded for this tournament yet.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Be the first to upload
          </button>
        </div>
      )}
    </div>
  )
}
