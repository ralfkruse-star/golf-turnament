/**
 * Photo Aggregate Root
 * Domain entity for photo management in the gallery system
 */

export enum PhotoCategory {
  TOURNAMENT = 'TOURNAMENT',
  COURSE = 'COURSE',
  CLUBHOUSE = 'CLUBHOUSE',
  SOCIAL = 'SOCIAL',
  AWARDS = 'AWARDS',
  ACTION_SHOT = 'ACTION_SHOT',
}

export interface PhotoMetadata {
  takenAt?: Date
  cameraModel?: string
  focalLength?: number
  aperture?: number
  shutterSpeed?: string
  iso?: number
}

export interface PhotoProps {
  id: string
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  width: number
  height: number
  url: string
  thumbnailUrl?: string
  mediumUrl?: string
  caption?: string
  category: PhotoCategory
  takenAt?: Date
  tournamentId?: string
  uploadedBy?: string
  albumId?: string
  isPublic: boolean
  isFeatured: boolean
  approved: boolean
  moderatedBy?: string
  moderatedAt?: Date
  metadata?: PhotoMetadata
  createdAt: Date
  updatedAt: Date
}

export interface CreatePhotoParams {
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  width: number
  height: number
  url: string
  thumbnailUrl?: string
  mediumUrl?: string
  caption?: string
  category: PhotoCategory
  takenAt?: Date
  tournamentId?: string
  uploadedBy?: string
  albumId?: string
  isPublic?: boolean
  isFeatured?: boolean
  metadata?: PhotoMetadata
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIN_DIMENSION = 100
const MAX_DIMENSION = 4000
const MAX_CAPTION_LENGTH = 500

export class Photo {
  private constructor(private props: PhotoProps) {}

  static create(params: CreatePhotoParams): Photo {
    // Validate file size
    if (params.fileSize <= 0) {
      throw new Error('File size must be greater than 0')
    }

    if (params.fileSize > MAX_FILE_SIZE) {
      throw new Error('File size must not exceed 10MB')
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(params.mimeType)) {
      throw new Error(
        `Invalid mime type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    }

    // Validate dimensions
    if (params.width < MIN_DIMENSION || params.height < MIN_DIMENSION) {
      throw new Error(
        `Image dimensions must be at least ${MIN_DIMENSION}x${MIN_DIMENSION}`
      )
    }

    if (params.width > MAX_DIMENSION || params.height > MAX_DIMENSION) {
      throw new Error(
        `Image dimensions must not exceed ${MAX_DIMENSION}x${MAX_DIMENSION}`
      )
    }

    // Validate caption
    if (params.caption !== undefined && params.caption.length > MAX_CAPTION_LENGTH) {
      throw new Error(`Caption must not exceed ${MAX_CAPTION_LENGTH} characters`)
    }

    const id = generateId()
    const now = new Date()

    return new Photo({
      id,
      filename: params.filename,
      originalName: params.originalName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      width: params.width,
      height: params.height,
      url: params.url,
      thumbnailUrl: params.thumbnailUrl,
      mediumUrl: params.mediumUrl,
      caption: params.caption,
      category: params.category,
      takenAt: params.takenAt,
      tournamentId: params.tournamentId,
      uploadedBy: params.uploadedBy,
      albumId: params.albumId,
      isPublic: params.isPublic ?? true,
      isFeatured: params.isFeatured ?? false,
      approved: false,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Getters
  getId(): string {
    return this.props.id
  }

  getFilename(): string {
    return this.props.filename
  }

  getOriginalName(): string {
    return this.props.originalName
  }

  getMimeType(): string {
    return this.props.mimeType
  }

  getFileSize(): number {
    return this.props.fileSize
  }

  getWidth(): number {
    return this.props.width
  }

  getHeight(): number {
    return this.props.height
  }

  getUrl(): string {
    return this.props.url
  }

  getThumbnailUrl(): string | undefined {
    return this.props.thumbnailUrl
  }

  getMediumUrl(): string | undefined {
    return this.props.mediumUrl
  }

  getCaption(): string | undefined {
    return this.props.caption
  }

  getCategory(): PhotoCategory {
    return this.props.category
  }

  getTournamentId(): string | undefined {
    return this.props.tournamentId
  }

  getAlbumId(): string | undefined {
    return this.props.albumId
  }

  isPublic(): boolean {
    return this.props.isPublic
  }

  isFeatured(): boolean {
    return this.props.isFeatured
  }

  isApproved(): boolean {
    return this.props.approved
  }

  getMetadata(): PhotoMetadata {
    return this.props.metadata || {
      takenAt: undefined,
      cameraModel: undefined,
      focalLength: undefined,
      aperture: undefined,
      shutterSpeed: undefined,
      iso: undefined,
    }
  }

  // Domain logic

  /**
   * Set or update photo caption
   */
  setCaption(caption: string): void {
    if (caption.length > MAX_CAPTION_LENGTH) {
      throw new Error(`Caption must not exceed ${MAX_CAPTION_LENGTH} characters`)
    }
    this.props.caption = caption
    this.props.updatedAt = new Date()
  }

  /**
   * Approve photo for public display
   */
  approve(moderatorId: string): void {
    if (this.props.approved) {
      throw new Error('Photo is already approved')
    }
    this.props.approved = true
    this.props.moderatedBy = moderatorId
    this.props.moderatedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Reject (unapprove) photo
   */
  reject(): void {
    this.props.approved = false
    this.props.updatedAt = new Date()
  }

  /**
   * Set photo visibility
   */
  setVisibility(isPublic: boolean): void {
    this.props.isPublic = isPublic
    this.props.updatedAt = new Date()
  }

  /**
   * Mark photo as featured
   */
  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured
    this.props.updatedAt = new Date()
  }

  /**
   * Set thumbnail URL after processing
   */
  setThumbnailUrl(url: string): void {
    this.props.thumbnailUrl = url
    this.props.updatedAt = new Date()
  }

  /**
   * Set medium size URL after processing
   */
  setMediumUrl(url: string): void {
    this.props.mediumUrl = url
    this.props.updatedAt = new Date()
  }

  /**
   * Associate photo with a tournament
   */
  associateWithTournament(tournamentId: string | undefined): void {
    this.props.tournamentId = tournamentId
    this.props.updatedAt = new Date()
  }

  /**
   * Associate photo with an album
   */
  associateWithAlbum(albumId: string | undefined): void {
    this.props.albumId = albumId
    this.props.updatedAt = new Date()
  }

  // Serialization
  toJSON(): PhotoProps {
    return { ...this.props }
  }
}

// Helper function (would be replaced with proper ID generation)
function generateId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
