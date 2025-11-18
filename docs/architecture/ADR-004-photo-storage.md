# ADR-004: Photo Storage Strategy

**Status**: Accepted
**Date**: 2025-01-15
**Decision Makers**: Development Team
**Context**: Photo gallery and tournament photography (Phase 3)

## Context

We need to handle photo uploads for:
- Tournament action shots
- Course photography
- Award ceremonies
- Social events

Requirements:
- Fast upload and retrieval
- Image optimization (thumbnails, different sizes)
- EXIF data preservation
- Moderation capability
- Cost-effective storage
- DSGVO compliance (EU storage)

## Decision

We will implement **local file storage with Next.js API routes** for MVP, with a migration path to CDN/cloud storage.

### Storage Strategy

**Current (MVP)**:
- Local filesystem storage in `/public/uploads/photos/`
- Next.js serves static files
- Image processing with Sharp

**Future (Scale)**:
- AWS S3 / Cloudflare R2 for object storage
- CDN for fast delivery
- Lambda/Edge functions for on-the-fly resizing

### File Organization

```
/public/uploads/photos/
  /{tournamentId}/
    /originals/
      {photoId}.jpg
    /thumbnails/
      {photoId}_thumb.jpg
    /medium/
      {photoId}_medium.jpg
```

### Image Processing

```typescript
import sharp from 'sharp'

async function processPhoto(buffer: Buffer, photoId: string) {
  // Original
  await sharp(buffer)
    .jpeg({ quality: 90 })
    .toFile(`uploads/photos/originals/${photoId}.jpg`)

  // Thumbnail (200x200)
  await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(`uploads/photos/thumbnails/${photoId}_thumb.jpg`)

  // Medium (800x800)
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toFile(`uploads/photos/medium/${photoId}_medium.jpg`)
}
```

### Metadata Storage

Store metadata in database:
```prisma
model Photo {
  id           String @id
  filename     String
  originalName String
  url          String
  thumbnailUrl String?
  mediumUrl    String?
  fileSize     Int
  width        Int
  height       Int

  // EXIF data
  takenAt      DateTime?
  metadata     Json?  // Camera, location, etc.
}
```

## Alternatives Considered

### Alternative 1: Third-party Service (Cloudinary, Imgix)
- **Pros**: Easy setup, automatic optimization, CDN included
- **Cons**: Expensive, vendor lock-in, DSGVO concerns
- **Rejected**: Too expensive for MVP

### Alternative 2: AWS S3 from Start
- **Pros**: Scalable, cheap storage, standard solution
- **Cons**: Complexity, AWS account setup, configuration
- **Rejected**: Overkill for MVP, can migrate later

### Alternative 3: Database BLOB Storage
- **Pros**: Simple, everything in one place
- **Cons**: Database bloat, expensive, slow, difficult backups
- **Rejected**: Not suitable for binary data

## Consequences

### Positive
- Simple implementation for MVP
- No external dependencies
- Full control over processing
- EU-compliant (server location)
- Easy development and testing

### Negative
- Limited scalability
- No CDN (slower for distant users)
- Server storage costs increase with photos
- Manual backups required

### Mitigations
- Image size limits (10MB max)
- Cleanup job for old/unused photos
- Monitor disk space
- Plan migration to CDN when needed

## Migration Path

When photo volume grows:

1. **Set up S3/R2 bucket**
2. **Migrate existing photos** to cloud storage
3. **Update upload endpoint** to use cloud storage
4. **Configure CDN** (CloudFront/Cloudflare)
5. **Update URLs** in database
6. **Delete local copies** after verification

## Implementation Notes

1. Upload endpoint: `POST /api/photos/upload`
2. Use `multipart/form-data` for file uploads
3. Validate file types (JPEG, PNG, WebP only)
4. Extract EXIF data with `exif-parser`
5. Generate thumbnails asynchronously
6. Implement moderation queue

## Related Decisions
- ADR-001: Technology Stack (Next.js API routes)
- ADR-003: Multi-tenancy (club-specific photos)
