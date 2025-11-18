# API Reference Documentation

Complete reference for all API endpoints in the Golf Tournament Management System.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Tournaments](#tournaments)
5. [Players](#players)
6. [Registrations](#registrations)
7. [Scoring](#scoring)
8. [Photos & Albums](#photos--albums)
9. [Analytics](#analytics)
10. [Reports](#reports)
11. [Clubs](#clubs)
12. [Push Notifications](#push-notifications)
13. [Payments](#payments)
14. [QR Codes](#qr-codes)
15. [Webhooks](#webhooks)
16. [Health & Status](#health--status)
17. [Error Codes](#error-codes)

---

## Overview

### Base URL

```
Production: https://tournaments.golfplatz-siek.de/api
Development: http://localhost:3000/api
```

### Content Type

All requests and responses use JSON:

```
Content-Type: application/json
```

### Response Format

All endpoints return responses in this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }  // Optional validation details
}
```

### Rate Limiting

- **Anonymous**: 100 requests per 15 minutes
- **Authenticated**: 1000 requests per 15 minutes
- **Admin**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## Authentication

### Authentication Methods

1. **Session-based** (NextAuth.js)
2. **API Key** (for server-to-server)
3. **JWT Tokens** (future)

### Session Authentication

Most common for web application:

```typescript
// Authenticated request
const response = await fetch('/api/tournaments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include session cookie
  body: JSON.stringify(data),
})
```

### Required Roles

Endpoints may require specific roles:

- `ADMIN` - Full system access
- `TOURNAMENT_MANAGER` - Manage tournaments
- `MARSHAL` - Tournament day operations
- `PRO_SHOP` - Registrations and payments
- `PLAYER` - Basic player access

---

## Common Patterns

### Pagination

List endpoints support pagination:

**Query Parameters:**
```
?page=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 50,
    "totalPages": 3
  }
}
```

### Filtering

Filter by specific fields:

```
?status=OPEN_FOR_REGISTRATION,IN_PROGRESS
?category=CLUB_CHAMPIONSHIP
?dateFrom=2025-06-01&dateTo=2025-06-30
```

### Sorting

Sort results:

```
?sortBy=tournamentDate&order=asc
?sortBy=name&order=desc
```

### Field Selection

Select specific fields:

```
?fields=id,name,status,tournamentDate
```

---

## Tournaments

### List Tournaments

Get a list of all tournaments with optional filters.

**Endpoint:** `GET /api/tournaments`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (comma-separated) |
| `category` | string | Filter by category |
| `dateFrom` | ISO 8601 | Start date for tournament date range |
| `dateTo` | ISO 8601 | End date for tournament date range |
| `clubId` | string | Filter by club ID |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |

**Example Request:**

```bash
curl -X GET "https://api.example.com/api/tournaments?status=OPEN_FOR_REGISTRATION&dateFrom=2025-06-01"
```

```typescript
const response = await fetch('/api/tournaments?status=OPEN_FOR_REGISTRATION')
const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cm123abc",
      "name": "Club Championship 2025",
      "description": "Annual club championship tournament",
      "format": "STABLEFORD",
      "category": "CLUB_CHAMPIONSHIP",
      "status": "OPEN_FOR_REGISTRATION",
      "tournamentDate": "2025-06-15T09:00:00Z",
      "registrationStart": "2025-05-01T00:00:00Z",
      "registrationEnd": "2025-06-01T23:59:59Z",
      "maxPlayers": 120,
      "minPlayers": 4,
      "entryFee": 25.00,
      "requireHandicap": true,
      "maxHandicap": 36,
      "allowGuests": true,
      "createdAt": "2025-04-15T10:00:00Z",
      "updatedAt": "2025-05-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid query parameters
- `500` - Server error

---

### Create Tournament

Create a new tournament.

**Endpoint:** `POST /api/tournaments`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Request Body:**

```json
{
  "name": "Club Championship 2025",
  "description": "Annual club championship tournament",
  "format": "STABLEFORD",
  "category": "CLUB_CHAMPIONSHIP",
  "tournamentDate": "2025-06-15T09:00:00Z",
  "registrationStart": "2025-05-01T00:00:00Z",
  "registrationEnd": "2025-06-01T23:59:59Z",
  "maxPlayers": 120,
  "minPlayers": 4,
  "entryFee": 25.00,
  "requireHandicap": true,
  "maxHandicap": 36,
  "allowGuests": true
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Tournament name (3-200 chars) |
| `description` | string | No | Tournament description |
| `format` | enum | Yes | Tournament format (STABLEFORD, STROKE_PLAY, etc.) |
| `category` | enum | Yes | Tournament category |
| `tournamentDate` | ISO 8601 | Yes | Tournament date and time |
| `registrationStart` | ISO 8601 | Yes | Registration opens |
| `registrationEnd` | ISO 8601 | Yes | Registration closes |
| `maxPlayers` | number | No | Maximum number of players |
| `minPlayers` | number | No | Minimum players (default: 4) |
| `entryFee` | number | No | Entry fee in EUR |
| `requireHandicap` | boolean | No | Whether handicap is required (default: true) |
| `maxHandicap` | number | No | Maximum handicap allowed (0-54) |
| `allowGuests` | boolean | No | Allow guest registrations (default: true) |

**Tournament Formats:**
- `STROKE_PLAY` - Traditional stroke play
- `STABLEFORD` - Stableford points system
- `MATCH_PLAY` - Match play format
- `SCRAMBLE` - Team scramble
- `BEST_BALL` - Best ball format
- `FOUR_BALL` - Four ball format
- `NASSAU` - Nassau betting game

**Tournament Categories:**
- `CLUB_CHAMPIONSHIP` - Club championship
- `MONTHLY_MEDAL` - Monthly medal competition
- `CORPORATE_EVENT` - Corporate event
- `CHARITY` - Charity tournament
- `MEMBER_GUEST` - Member-guest event
- `PRO_AM` - Pro-Am tournament
- `CASUAL` - Casual tournament

**Example Request:**

```typescript
const tournament = await fetch('/api/tournaments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Club Championship 2025',
    format: 'STABLEFORD',
    category: 'CLUB_CHAMPIONSHIP',
    tournamentDate: '2025-06-15T09:00:00Z',
    registrationStart: '2025-05-01T00:00:00Z',
    registrationEnd: '2025-06-01T23:59:59Z',
    maxPlayers: 120,
    entryFee: 25.00,
  }),
})

const { success, data } = await tournament.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm123abc",
    "name": "Club Championship 2025",
    "status": "DRAFT",
    ...
  }
}
```

**Status Codes:**
- `201` - Tournament created successfully
- `400` - Validation error
- `401` - Not authenticated
- `403` - Not authorized
- `500` - Server error

**Validation Errors:**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["name"],
      "message": "String must contain at least 3 character(s)"
    },
    {
      "path": ["tournamentDate"],
      "message": "Tournament date must be after registration end date"
    }
  ]
}
```

---

### Get Tournament by ID

Retrieve a specific tournament.

**Endpoint:** `GET /api/tournaments/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Tournament ID |

**Example Request:**

```bash
curl -X GET "https://api.example.com/api/tournaments/cm123abc"
```

```typescript
const response = await fetch(`/api/tournaments/${tournamentId}`)
const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm123abc",
    "name": "Club Championship 2025",
    "description": "Annual club championship",
    "format": "STABLEFORD",
    "category": "CLUB_CHAMPIONSHIP",
    "status": "OPEN_FOR_REGISTRATION",
    "tournamentDate": "2025-06-15T09:00:00Z",
    "registrationStart": "2025-05-01T00:00:00Z",
    "registrationEnd": "2025-06-01T23:59:59Z",
    "maxPlayers": 120,
    "minPlayers": 4,
    "entryFee": 25.00,
    "requireHandicap": true,
    "maxHandicap": 36,
    "allowGuests": true,
    "createdAt": "2025-04-15T10:00:00Z",
    "updatedAt": "2025-05-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Tournament not found
- `500` - Server error

---

### Update Tournament Status

Update tournament status (lifecycle transitions).

**Endpoint:** `PATCH /api/tournaments/:id`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Request Body:**

```json
{
  "action": "open"
}
```

**Actions:**

| Action | Description | From Status | To Status |
|--------|-------------|-------------|-----------|
| `open` | Open for registration | DRAFT | OPEN_FOR_REGISTRATION |
| `close` | Close registration | OPEN_FOR_REGISTRATION | REGISTRATION_CLOSED |
| `start` | Start tournament | REGISTRATION_CLOSED | IN_PROGRESS |
| `complete` | Complete tournament | IN_PROGRESS | COMPLETED |
| `cancel` | Cancel tournament | Any (except COMPLETED) | CANCELLED |

**Example Request:**

```typescript
const response = await fetch(`/api/tournaments/${tournamentId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: 'open' }),
})

const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "cm123abc",
    "status": "OPEN_FOR_REGISTRATION",
    "updatedAt": "2025-05-01T00:00:00Z",
    ...
  }
}
```

**Status Codes:**
- `200` - Update successful
- `400` - Invalid action or transition
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Tournament not found
- `500` - Server error

**Error Example:**

```json
{
  "success": false,
  "error": "Can only open draft tournaments for registration"
}
```

---

### Delete Tournament

Delete a tournament.

**Endpoint:** `DELETE /api/tournaments/:id`

**Authentication:** Required (ADMIN)

**Example Request:**

```typescript
const response = await fetch(`/api/tournaments/${tournamentId}`, {
  method: 'DELETE',
})

const { success, message } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "message": "Tournament deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Tournament not found
- `500` - Server error

**Note:** Deleting a tournament will cascade delete all related data (registrations, scorecards, etc.).

---

### Register for Tournament

Register a player for a tournament.

**Endpoint:** `POST /api/tournaments/:id/register`

**Authentication:** Optional (can register as guest)

**Request Body:**

```json
{
  "playerId": "player123",
  "tee": "white",
  "cart": true,
  "specialRequests": "Playing with John Smith"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `playerId` | string | Yes | Player ID (or register new player) |
| `tee` | string | No | Tee preference (white, blue, red, etc.) |
| `cart` | boolean | No | Request golf cart (default: false) |
| `specialRequests` | string | No | Special requests or notes |

**Example Request:**

```typescript
const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    playerId: 'player123',
    tee: 'white',
    cart: true,
  }),
})

const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "reg123",
    "tournamentId": "cm123abc",
    "playerId": "player123",
    "status": "CONFIRMED",
    "playingHandicap": 18,
    "tee": "white",
    "cart": true,
    "registeredAt": "2025-05-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `201` - Registration successful
- `400` - Validation error
- `404` - Tournament not found
- `409` - Already registered or tournament full
- `422` - Business rule violation (e.g., handicap exceeds max)
- `500` - Server error

**Error Examples:**

```json
{
  "success": false,
  "error": "Tournament is full"
}
```

```json
{
  "success": false,
  "error": "Handicap 42.5 exceeds maximum of 36"
}
```

---

### Get Tournament Leaderboard (SSE)

Get live leaderboard updates using Server-Sent Events.

**Endpoint:** `GET /api/tournaments/:id/leaderboard`

**Response Type:** `text/event-stream`

**Example Request:**

```typescript
const eventSource = new EventSource(`/api/tournaments/${tournamentId}/leaderboard`)

eventSource.onmessage = (event) => {
  const leaderboard = JSON.parse(event.data)
  console.log('Leaderboard updated:', leaderboard)
  updateUI(leaderboard)
}

eventSource.onerror = (error) => {
  console.error('Connection error:', error)
  eventSource.close()
}

// Close connection when done
eventSource.close()
```

**Event Data Format:**

```json
{
  "tournamentId": "cm123abc",
  "lastUpdated": "2025-06-15T12:30:00Z",
  "standings": [
    {
      "position": 1,
      "playerId": "player123",
      "playerName": "John Smith",
      "totalGross": 75,
      "totalNet": 69,
      "totalPoints": 38,
      "thru": 18,
      "status": "COMPLETED"
    },
    {
      "position": 2,
      "playerId": "player456",
      "playerName": "Jane Doe",
      "totalGross": 78,
      "totalNet": 70,
      "totalPoints": 37,
      "thru": 18,
      "status": "COMPLETED"
    }
  ]
}
```

**Update Frequency:** Every 5 seconds (configurable)

**Status Codes:**
- `200` - Stream established
- `404` - Tournament not found
- `500` - Server error

---

### Generate Flights

Auto-generate tournament flights based on handicaps.

**Endpoint:** `POST /api/tournaments/:id/flights/generate`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Request Body:**

```json
{
  "flightsPerTee": 15,
  "playersPerFlight": 4,
  "startTime": "2025-06-15T08:00:00Z",
  "startHole": 1,
  "groupingStrategy": "handicap"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `flightsPerTee` | number | No | Minutes between flights (default: 15) |
| `playersPerFlight` | number | No | Players per flight (default: 4) |
| `startTime` | ISO 8601 | Yes | First tee time |
| `startHole` | number | No | Starting hole (default: 1) |
| `groupingStrategy` | enum | No | How to group players (handicap, random, balanced) |

**Grouping Strategies:**
- `handicap` - Group by similar handicaps
- `random` - Random grouping
- `balanced` - Mix handicaps in each group

**Example Response:**

```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "id": "flight1",
        "flightNumber": 1,
        "startTime": "2025-06-15T08:00:00Z",
        "startHole": 1,
        "players": [
          {
            "playerId": "player1",
            "name": "John Smith",
            "handicapIndex": 5.2
          },
          {
            "playerId": "player2",
            "name": "Bob Johnson",
            "handicapIndex": 6.8
          }
        ]
      }
    ],
    "totalFlights": 30,
    "totalPlayers": 120
  }
}
```

**Status Codes:**
- `200` - Flights generated
- `400` - Invalid parameters
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Tournament not found
- `422` - Not enough players
- `500` - Server error

---

### Get Tournament Photos

Get photos associated with a tournament.

**Endpoint:** `GET /api/tournaments/:id/photos`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `approved` | boolean | Filter by approval status |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "photo123",
      "filename": "tournament-action-1.jpg",
      "url": "https://cdn.example.com/photos/tournament-action-1.jpg",
      "thumbnailUrl": "https://cdn.example.com/photos/thumbnails/tournament-action-1.jpg",
      "caption": "Great shot on the 18th hole",
      "category": "ACTION_SHOT",
      "takenAt": "2025-06-15T14:30:00Z",
      "approved": true,
      "uploadedBy": "user123",
      "createdAt": "2025-06-15T15:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## Players

### Register New Player

Register a new player in the system.

**Endpoint:** `POST /api/players/register`

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "+49 123 456 7890",
  "dateOfBirth": "1985-05-15",
  "gender": "MALE",
  "handicapIndex": 18.5,
  "homeClub": "Golf Club Siek",
  "membershipType": "MEMBER",
  "consentGiven": true,
  "marketingConsent": false
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | Player's first name |
| `lastName` | string | Yes | Player's last name |
| `email` | string | Yes | Email address (unique) |
| `phone` | string | No | Phone number |
| `dateOfBirth` | ISO 8601 | No | Date of birth |
| `gender` | enum | No | Gender (MALE, FEMALE, OTHER) |
| `handicapIndex` | number | No | WHS handicap index (-10.0 to 54.0) |
| `homeClub` | string | No | Home golf club |
| `membershipType` | enum | No | Membership type (MEMBER, GUEST, CORPORATE, TRIAL) |
| `consentGiven` | boolean | Yes | DSGVO consent |
| `marketingConsent` | boolean | No | Marketing consent (default: false) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "player123",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "handicapIndex": 18.5,
    "membershipType": "MEMBER",
    "createdAt": "2025-05-01T10:00:00Z"
  }
}
```

**Status Codes:**
- `201` - Player registered
- `400` - Validation error
- `409` - Email already exists
- `500` - Server error

---

## Scoring

### Submit Score

Submit or update a scorecard.

**Endpoint:** `POST /api/scoring/:scorecardId/submit`

**Authentication:** Required (player or admin)

**Request Body:**

```json
{
  "scores": [
    {
      "hole": 1,
      "gross": 5,
      "putts": 2,
      "fairwayHit": true,
      "greenInRegulation": false
    },
    {
      "hole": 2,
      "gross": 4,
      "putts": 2,
      "fairwayHit": false,
      "greenInRegulation": true
    }
    // ... holes 3-18
  ],
  "markerName": "Jane Doe",
  "markerSignature": "signature_hash_here"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "scorecard123",
    "tournamentId": "cm123abc",
    "playerId": "player123",
    "scores": [...],
    "totalGross": 82,
    "totalNet": 70,
    "totalPoints": 36,
    "status": "SUBMITTED",
    "submittedAt": "2025-06-15T16:30:00Z"
  }
}
```

**Status Codes:**
- `200` - Score submitted
- `400` - Validation error
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Scorecard not found
- `422` - Missing holes or invalid scores
- `500` - Server error

---

## Photos & Albums

### Upload Photo

Upload a tournament photo.

**Endpoint:** `POST /api/photos/upload`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPEG, PNG, WebP) |
| `tournamentId` | string | No | Associated tournament |
| `albumId` | string | No | Associated album |
| `caption` | string | No | Photo caption |
| `category` | enum | No | Photo category |

**Example Request:**

```typescript
const formData = new FormData()
formData.append('file', photoFile)
formData.append('tournamentId', 'cm123abc')
formData.append('caption', 'Great shot on the 18th hole')
formData.append('category', 'ACTION_SHOT')

const response = await fetch('/api/photos/upload', {
  method: 'POST',
  body: formData,
})

const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "photo123",
    "filename": "IMG_1234.jpg",
    "url": "https://cdn.example.com/photos/IMG_1234.jpg",
    "thumbnailUrl": "https://cdn.example.com/photos/thumbnails/IMG_1234.jpg",
    "mediumUrl": "https://cdn.example.com/photos/medium/IMG_1234.jpg",
    "width": 4032,
    "height": 3024,
    "fileSize": 2458624,
    "caption": "Great shot on the 18th hole",
    "category": "ACTION_SHOT",
    "approved": false,
    "createdAt": "2025-06-15T15:00:00Z"
  }
}
```

**File Limits:**
- **Max size:** 10MB
- **Allowed types:** JPEG, PNG, WebP
- **Dimensions:** No minimum, max 8000x8000px

**Status Codes:**
- `201` - Photo uploaded
- `400` - Invalid file or validation error
- `401` - Not authenticated
- `413` - File too large
- `415` - Unsupported media type
- `500` - Server error

---

### Batch Upload Photos

Upload multiple photos at once.

**Endpoint:** `POST /api/photos/batch-upload`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Array of image files |
| `tournamentId` | string | No | Associated tournament |
| `albumId` | string | No | Associated album |

**Example Request:**

```typescript
const formData = new FormData()
photoFiles.forEach(file => {
  formData.append('files', file)
})
formData.append('tournamentId', 'cm123abc')

const response = await fetch('/api/photos/batch-upload', {
  method: 'POST',
  body: formData,
})

const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "uploaded": 12,
    "failed": 1,
    "photos": [
      { "id": "photo1", "filename": "IMG_1234.jpg", "status": "success" },
      { "id": "photo2", "filename": "IMG_1235.jpg", "status": "success" },
      { "filename": "IMG_1236.jpg", "status": "failed", "error": "File too large" }
    ]
  }
}
```

**Limits:**
- **Max files per request:** 20
- **Max total size:** 50MB

---

### Create Album

Create a photo album.

**Endpoint:** `POST /api/albums`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Request Body:**

```json
{
  "title": "Club Championship 2025 Photos",
  "description": "Photos from the 2025 Club Championship",
  "isPublic": true
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "album123",
    "title": "Club Championship 2025 Photos",
    "description": "Photos from the 2025 Club Championship",
    "isPublic": true,
    "createdAt": "2025-06-15T10:00:00Z"
  }
}
```

---

## Analytics

### Get Dashboard Analytics

Get overview analytics for dashboard.

**Endpoint:** `GET /api/analytics/dashboard`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dateFrom` | ISO 8601 | Start date |
| `dateTo` | ISO 8601 | End date |
| `clubId` | string | Filter by club |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTournaments": 45,
      "activeTournaments": 3,
      "totalPlayers": 856,
      "totalRevenue": 12500.50
    },
    "participationTrend": [
      { "month": "2025-01", "players": 120 },
      { "month": "2025-02", "players": 145 },
      { "month": "2025-03", "players": 132 }
    ],
    "topPerformers": [
      {
        "playerId": "player123",
        "name": "John Smith",
        "averageScore": 72.5,
        "tournamentsPlayed": 12
      }
    ]
  }
}
```

---

### Get Revenue Analytics

Get revenue and financial analytics.

**Endpoint:** `GET /api/analytics/revenue`

**Authentication:** Required (ADMIN)

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalRevenue": 25600.00,
    "revenueByMonth": [
      { "month": "2025-01", "revenue": 4200.00 },
      { "month": "2025-02", "revenue": 5800.00 }
    ],
    "revenueByTournament": [
      {
        "tournamentId": "cm123abc",
        "name": "Club Championship",
        "revenue": 3000.00,
        "participants": 120
      }
    ]
  }
}
```

---

## Reports

### Generate Report

Generate a tournament or player report.

**Endpoint:** `POST /api/reports/generate`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Request Body:**

```json
{
  "reportType": "TOURNAMENT_SUMMARY",
  "format": "PDF",
  "parameters": {
    "tournamentId": "cm123abc",
    "includeScores": true,
    "includeStats": true,
    "includePhotos": false
  }
}
```

**Report Types:**
- `TOURNAMENT_SUMMARY` - Complete tournament summary
- `PLAYER_PERFORMANCE` - Player performance report
- `FINANCIAL` - Financial summary
- `PARTICIPATION_TRENDS` - Participation analytics
- `HANDICAP_ANALYSIS` - Handicap distribution analysis

**Formats:**
- `PDF` - PDF document
- `EXCEL` - Excel spreadsheet
- `CSV` - CSV file
- `JSON` - JSON data

**Example Response:**

```json
{
  "success": true,
  "data": {
    "reportId": "report123",
    "title": "Club Championship 2025 - Tournament Summary",
    "reportType": "TOURNAMENT_SUMMARY",
    "format": "PDF",
    "fileUrl": "https://cdn.example.com/reports/report123.pdf",
    "fileSize": 2458624,
    "generatedAt": "2025-06-15T18:00:00Z",
    "expiresAt": "2025-07-15T18:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Report generated
- `400` - Invalid parameters
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Tournament/player not found
- `500` - Server error

---

## Clubs

### Get Club Information

Get club details by slug.

**Endpoint:** `GET /api/clubs/:slug`

**Example Request:**

```typescript
const response = await fetch('/api/clubs/golfplatz-siek')
const { success, data } = await response.json()
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "club123",
    "name": "Golfplatz Siek",
    "slug": "golfplatz-siek",
    "description": "Beautiful golf course in Siek",
    "logo": "https://cdn.example.com/logos/golfplatz-siek.png",
    "website": "https://golfplatz-siek.de",
    "email": "info@golfplatz-siek.de",
    "phone": "+49 123 456 7890",
    "address": "Golfstraße 1",
    "city": "Siek",
    "postalCode": "22962",
    "country": "DE",
    "primaryColor": "#16a34a",
    "secondaryColor": "#065f46",
    "tier": "PREMIUM",
    "features": {
      "tournaments": true,
      "photos": true,
      "analytics": true,
      "pushNotifications": true,
      "whiteLabel": true
    }
  }
}
```

---

### Get Club Statistics

Get club statistics and metrics.

**Endpoint:** `GET /api/clubs/:slug/stats`

**Authentication:** Required (club member)

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalTournaments": 45,
    "activeTournaments": 3,
    "totalMembers": 856,
    "tournamentsThisYear": 12,
    "averageParticipation": 85,
    "upcomingTournaments": [
      {
        "id": "cm123abc",
        "name": "Club Championship 2025",
        "date": "2025-06-15T09:00:00Z",
        "registrations": 87
      }
    ]
  }
}
```

---

## Push Notifications

### Subscribe to Push Notifications

Subscribe a device to push notifications.

**Endpoint:** `POST /api/push/subscribe`

**Request Body:**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BL8EkQ...",
      "auth": "k8J..."
    }
  },
  "topics": ["tournaments", "scores", "announcements"]
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "sub123",
    "enabled": true,
    "topics": ["tournaments", "scores", "announcements"],
    "createdAt": "2025-05-01T10:00:00Z"
  }
}
```

---

### Get VAPID Public Key

Get the VAPID public key for push notifications.

**Endpoint:** `GET /api/push/vapid-public-key`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "publicKey": "BL8EkQ..."
  }
}
```

---

### Send Push Notification

Send a push notification (admin only).

**Endpoint:** `POST /api/push/send`

**Authentication:** Required (ADMIN)

**Request Body:**

```json
{
  "title": "Tournament Starting Soon!",
  "body": "Club Championship starts in 1 hour",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/badge-72x72.png",
  "url": "/tournaments/cm123abc",
  "topic": "tournaments",
  "userId": "user123"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Notification title |
| `body` | string | Yes | Notification body |
| `icon` | string | No | Notification icon URL |
| `badge` | string | No | Badge icon URL |
| `url` | string | No | Click action URL |
| `topic` | string | No | Topic (broadcast to all subscribed) |
| `userId` | string | No | Specific user ID |

**Note:** Either `topic` or `userId` must be provided.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "notificationId": "notif123",
    "delivered": 145,
    "failed": 3,
    "sentAt": "2025-06-15T08:00:00Z"
  }
}
```

---

## Payments

### Create Checkout Session

Create a Stripe checkout session for tournament registration.

**Endpoint:** `POST /api/payment/create-checkout`

**Authentication:** Required

**Request Body:**

```json
{
  "tournamentId": "cm123abc",
  "playerId": "player123",
  "successUrl": "https://example.com/payment/success",
  "cancelUrl": "https://example.com/payment/cancel"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

**Status Codes:**
- `200` - Checkout session created
- `400` - Invalid parameters
- `401` - Not authenticated
- `404` - Tournament or player not found
- `409` - Already registered or tournament full
- `500` - Server error

---

## QR Codes

### Generate QR Code

Generate a QR code for check-in or scoring.

**Endpoint:** `POST /api/qr/generate`

**Authentication:** Required (ADMIN or TOURNAMENT_MANAGER)

**Request Body:**

```json
{
  "type": "checkin",
  "data": {
    "tournamentId": "cm123abc",
    "playerId": "player123"
  }
}
```

**QR Code Types:**
- `checkin` - Tournament check-in
- `scoring` - Quick score entry
- `sponsor` - Sponsor activation

**Example Response:**

```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "url": "https://example.com/qr/checkin/abc123"
  }
}
```

---

### QR Check-in

Process a QR code check-in.

**Endpoint:** `POST /api/qr/checkin`

**Request Body:**

```json
{
  "code": "abc123"
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "playerId": "player123",
    "playerName": "John Smith",
    "tournamentId": "cm123abc",
    "checkedInAt": "2025-06-15T08:30:00Z"
  }
}
```

---

## Webhooks

### Stripe Webhook

Handle Stripe webhook events.

**Endpoint:** `POST /api/webhooks/stripe`

**Headers:**
```
Stripe-Signature: t=1492774577,v1=5257a869...
```

**Events Handled:**
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed

**Note:** This endpoint validates the Stripe signature for security.

---

### Brevo Webhook

Handle Brevo (Sendinblue) email webhook events.

**Endpoint:** `POST /api/webhooks/brevo`

**Events Handled:**
- `delivered` - Email delivered
- `opened` - Email opened
- `clicked` - Link clicked
- `bounced` - Email bounced
- `unsubscribed` - User unsubscribed

---

## Health & Status

### Health Check

Check API health and database connectivity.

**Endpoint:** `GET /api/health`

**Example Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-06-15T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "email": "ok",
    "storage": "ok"
  }
}
```

**Status Values:**
- `ok` - All systems operational
- `degraded` - Some services experiencing issues
- `down` - Critical services unavailable

**Status Codes:**
- `200` - Healthy
- `503` - Service unavailable

---

## Error Codes

### Standard Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for this action |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `TOURNAMENT_FULL` | 422 | Tournament has reached max players |
| `INVALID_STATUS_TRANSITION` | 422 | Invalid tournament status change |
| `HANDICAP_EXCEEDS_MAX` | 422 | Player handicap exceeds tournament max |
| `REGISTRATION_CLOSED` | 422 | Registration period has closed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Validation Error Details

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["name"],
      "message": "String must contain at least 3 character(s)"
    },
    {
      "path": ["tournamentDate"],
      "message": "Invalid date format"
    }
  ]
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class GolfTournamentAPI {
  private baseURL: string
  private sessionCookie?: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  }

  async getTournaments(filters?: {
    status?: string
    category?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const params = new URLSearchParams(filters as any)
    return this.request(`/api/tournaments?${params}`)
  }

  async createTournament(data: CreateTournamentData) {
    return this.request('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getTournament(id: string) {
    return this.request(`/api/tournaments/${id}`)
  }

  async updateTournamentStatus(id: string, action: string) {
    return this.request(`/api/tournaments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })
  }

  connectToLeaderboard(tournamentId: string, onUpdate: (data: any) => void) {
    const eventSource = new EventSource(
      `${this.baseURL}/api/tournaments/${tournamentId}/leaderboard`
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onUpdate(data)
    }

    return () => eventSource.close()
  }
}

// Usage
const api = new GolfTournamentAPI('https://api.example.com')

// List tournaments
const tournaments = await api.getTournaments({
  status: 'OPEN_FOR_REGISTRATION',
})

// Create tournament
const tournament = await api.createTournament({
  name: 'Club Championship 2025',
  format: 'STABLEFORD',
  category: 'CLUB_CHAMPIONSHIP',
  tournamentDate: '2025-06-15T09:00:00Z',
  registrationStart: '2025-05-01T00:00:00Z',
  registrationEnd: '2025-06-01T23:59:59Z',
})

// Connect to leaderboard
const disconnect = api.connectToLeaderboard(tournament.id, (leaderboard) => {
  console.log('Updated leaderboard:', leaderboard)
})

// Later: disconnect()
```

---

## Changelog

### Version 1.0.0 (2025-01-15)

- Initial API release
- Tournament CRUD operations
- Player registration
- Live leaderboard (SSE)
- Photo upload and galleries
- Analytics endpoints
- Push notifications
- Multi-club support

---

## Support

For API support:
- **Documentation**: https://docs.example.com
- **Email**: api-support@golfplatz-siek.de
- **GitHub Issues**: https://github.com/your-org/golf-tournament/issues

---

*Last Updated: 2025-01-15*
