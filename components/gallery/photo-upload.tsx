'use client'

/**
 * PhotoUpload Component
 * Drag & drop photo upload with progress tracking
 */

import React, { useState, useCallback } from 'react'
import { Upload, X, Check, AlertCircle } from 'lucide-react'
import { PhotoCategory } from '@/domain/entities/photo'

interface PhotoUploadProps {
  tournamentId?: string
  albumId?: string
  category?: PhotoCategory
  onUploadComplete?: (photos: any[]) => void
  onUploadError?: (error: string) => void
}

interface UploadingFile {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: any
}

export function PhotoUpload({
  tournamentId,
  albumId,
  category = PhotoCategory.TOURNAMENT,
  onUploadComplete,
  onUploadError,
}: PhotoUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)

    const newFiles: UploadingFile[] = fileArray
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const { files: droppedFiles } = e.dataTransfer
      if (droppedFiles && droppedFiles.length > 0) {
        handleFiles(droppedFiles)
      }
    },
    [handleFiles]
  )

  // Handle file input change
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles)
      }
    },
    [handleFiles]
  )

  // Remove file from list
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  // Upload files
  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')

    for (let i = 0; i < pendingFiles.length; i++) {
      const uploadingFile = pendingFiles[i]
      const fileIndex = files.indexOf(uploadingFile)

      try {
        // Update status to uploading
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[fileIndex].status = 'uploading'
          return newFiles
        })

        // Create form data
        const formData = new FormData()
        formData.append('file', uploadingFile.file)
        if (tournamentId) formData.append('tournamentId', tournamentId)
        if (albumId) formData.append('albumId', albumId)
        formData.append('category', category)
        formData.append('isPublic', 'true')

        // Upload with progress
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const result = await response.json()

        // Update status to success
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[fileIndex].status = 'success'
          newFiles[fileIndex].progress = 100
          newFiles[fileIndex].result = result.photo
          return newFiles
        })
      } catch (error) {
        console.error('Upload error:', error)

        // Update status to error
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[fileIndex].status = 'error'
          newFiles[fileIndex].error =
            error instanceof Error ? error.message : 'Upload failed'
          return newFiles
        })

        if (onUploadError) {
          onUploadError(
            error instanceof Error ? error.message : 'Upload failed'
          )
        }
      }
    }

    // Call completion callback
    const successfulUploads = files
      .filter((f) => f.status === 'success')
      .map((f) => f.result)

    if (successfulUploads.length > 0 && onUploadComplete) {
      onUploadComplete(successfulUploads)
    }
  }, [files, tournamentId, albumId, category, onUploadComplete, onUploadError])

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.status !== 'success')
      // Revoke object URLs for removed files
      prev
        .filter((f) => f.status === 'success')
        .forEach((f) => URL.revokeObjectURL(f.preview))
      return remaining
    })
  }, [])

  const hasPendingFiles = files.some((f) => f.status === 'pending')
  const hasCompletedFiles = files.some((f) => f.status === 'success')

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }
        `}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop photos here, or click to select files
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Accepts JPEG, PNG, WebP (max 10MB per file)
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">
              Files ({files.length})
            </h3>
            <div className="space-x-2">
              {hasCompletedFiles && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear completed
                </button>
              )}
              {hasPendingFiles && (
                <button
                  onClick={uploadFiles}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Upload All
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Status overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {file.status === 'uploading' && (
                    <div className="text-white text-sm">Uploading...</div>
                  )}
                  {file.status === 'success' && (
                    <Check className="h-8 w-8 text-green-400" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  )}
                </div>

                {/* Progress bar */}
                {file.status === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {/* File name */}
                <p className="mt-1 text-xs text-gray-600 truncate">
                  {file.file.name}
                </p>

                {/* Error message */}
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-600 mt-1">{file.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
