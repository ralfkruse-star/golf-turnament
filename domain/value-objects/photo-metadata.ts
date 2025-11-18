/**
 * PhotoMetadata Value Object
 * Immutable value object for photo EXIF metadata
 */

export interface PhotoMetadataProps {
  takenAt?: Date
  cameraModel?: string
  focalLength?: number
  aperture?: number
  shutterSpeed?: string
  iso?: number
}

export interface EXIFData {
  tags: {
    DateTime?: number
    Make?: string
    Model?: string
    FocalLength?: number
    FNumber?: number
    ExposureTime?: number
    ISO?: number
  }
}

export class PhotoMetadata {
  private constructor(private readonly props: PhotoMetadataProps) {}

  static create(props: PhotoMetadataProps): PhotoMetadata {
    return new PhotoMetadata({ ...props })
  }

  /**
   * Create PhotoMetadata from EXIF data
   */
  static fromEXIF(exifData: EXIFData): PhotoMetadata {
    const { tags } = exifData

    // Extract date taken
    const takenAt = tags.DateTime
      ? new Date(tags.DateTime * 1000)
      : undefined

    // Combine Make and Model for camera
    let cameraModel: string | undefined
    if (tags.Make && tags.Model) {
      cameraModel = `${tags.Make} ${tags.Model}`
    } else if (tags.Model) {
      cameraModel = tags.Model
    } else if (tags.Make) {
      cameraModel = tags.Make
    }

    // Format shutter speed
    let shutterSpeed: string | undefined
    if (tags.ExposureTime !== undefined) {
      if (tags.ExposureTime < 1) {
        shutterSpeed = `1/${Math.round(1 / tags.ExposureTime)}`
      } else {
        shutterSpeed = `${tags.ExposureTime}s`
      }
    }

    return new PhotoMetadata({
      takenAt,
      cameraModel,
      focalLength: tags.FocalLength,
      aperture: tags.FNumber,
      shutterSpeed,
      iso: tags.ISO,
    })
  }

  // Getters
  getTakenAt(): Date | undefined {
    return this.props.takenAt
  }

  getCameraModel(): string | undefined {
    return this.props.cameraModel
  }

  getFocalLength(): number | undefined {
    return this.props.focalLength
  }

  getAperture(): number | undefined {
    return this.props.aperture
  }

  getShutterSpeed(): string | undefined {
    return this.props.shutterSpeed
  }

  getISO(): number | undefined {
    return this.props.iso
  }

  /**
   * Check equality with another PhotoMetadata
   */
  equals(other: PhotoMetadata): boolean {
    return (
      this.props.takenAt?.getTime() === other.props.takenAt?.getTime() &&
      this.props.cameraModel === other.props.cameraModel &&
      this.props.focalLength === other.props.focalLength &&
      this.props.aperture === other.props.aperture &&
      this.props.shutterSpeed === other.props.shutterSpeed &&
      this.props.iso === other.props.iso
    )
  }

  // Serialization
  toJSON(): PhotoMetadataProps {
    return { ...this.props }
  }
}
