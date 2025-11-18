# 🌐 API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production:  https://tournaments.golfplatz-siek.de/api
```

---

## 🏆 Tournaments

### List Tournaments

```http
GET /api/tournaments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Comma-separated status values (e.g., `DRAFT,OPEN_FOR_REGISTRATION`) |
| `dateFrom` | ISO 8601 | Filter tournaments from date |
| `dateTo` | ISO 8601 | Filter tournaments until date |
| `category` | string | Filter by category (e.g., `CLUB_CHAMPIONSHIP`) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "tournament_1234",
      "name": "Herbst-Clubmeisterschaft 2025",
      "description": "Jährliche Clubmeisterschaft",
      "format": "STABLEFORD",
      "category": "CLUB_CHAMPIONSHIP",
      "status": "OPEN_FOR_REGISTRATION",
      "tournamentDate": "2025-09-15T09:00:00Z",
      "registrationStart": "2025-08-01T00:00:00Z",
      "registrationEnd": "2025-09-10T23:59:59Z",
      "maxPlayers": 120,
      "minPlayers": 4,
      "entryFee": 35.0,
      "requireHandicap": true,
      "maxHandicap": 36.0,
      "allowGuests": false
    }
  ]
}
```

---

### Create Tournament

```http
POST /api/tournaments
```

**Request Body:**

```json
{
  "name": "Frühlingsturnier 2025",
  "description": "Saisonstart-Turnier",
  "format": "STABLEFORD",
  "category": "MONTHLY_MEDAL",
  "tournamentDate": "2025-04-20T09:00:00Z",
  "registrationStart": "2025-03-01T00:00:00Z",
  "registrationEnd": "2025-04-15T23:59:59Z",
  "maxPlayers": 100,
  "minPlayers": 4,
  "entryFee": 25.0,
  "requireHandicap": true,
  "maxHandicap": 45.0,
  "allowGuests": true
}
```

**Validation Rules:**

- `name`: 3-200 characters
- `format`: One of `STROKE_PLAY`, `STABLEFORD`, `MATCH_PLAY`, `SCRAMBLE`, `BEST_BALL`, `FOUR_BALL`, `NASSAU`
- `category`: One of `CLUB_CHAMPIONSHIP`, `MONTHLY_MEDAL`, `CORPORATE_EVENT`, `CHARITY`, `MEMBER_GUEST`, `PRO_AM`, `CASUAL`
- `tournamentDate`: Must be after `registrationEnd`
- `registrationStart`: Must be before `registrationEnd`
- `maxPlayers`: Positive integer
- `maxHandicap`: 0.0 - 54.0

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "tournament_5678",
    "name": "Frühlingsturnier 2025",
    "status": "DRAFT",
    ...
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["tournamentDate"],
      "message": "Tournament date must be after registration end date"
    }
  ]
}
```

---

### Get Tournament

```http
GET /api/tournaments/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "tournament_1234",
    "name": "Herbst-Clubmeisterschaft 2025",
    ...
  }
}
```

**Error (404):**

```json
{
  "success": false,
  "error": "Tournament not found"
}
```

---

### Update Tournament Status

```http
PATCH /api/tournaments/:id
```

**Request Body:**

```json
{
  "action": "open"
}
```

**Actions:**

| Action | From Status | To Status | Description |
|--------|-------------|-----------|-------------|
| `open` | `DRAFT` | `OPEN_FOR_REGISTRATION` | Open tournament for registration |
| `close` | `OPEN_FOR_REGISTRATION` | `REGISTRATION_CLOSED` | Close registration |
| `start` | `REGISTRATION_CLOSED` | `IN_PROGRESS` | Start tournament |
| `complete` | `IN_PROGRESS` | `COMPLETED` | Complete tournament |
| `cancel` | Any (except COMPLETED) | `CANCELLED` | Cancel tournament |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "tournament_1234",
    "status": "OPEN_FOR_REGISTRATION",
    ...
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Can only open draft tournaments for registration"
}
```

---

### Delete Tournament

```http
DELETE /api/tournaments/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Tournament deleted successfully"
}
```

---

## 📊 Leaderboard

### Get Leaderboard (JSON)

```http
GET /api/tournaments/:id/leaderboard
Accept: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tournamentId": "tournament_1234",
    "updatedAt": "2025-09-15T14:32:15Z",
    "playerCount": 42,
    "leaderboard": [
      {
        "position": 1,
        "playerId": "player_123",
        "playerName": "Max Mustermann",
        "handicap": "18.5",
        "totalGross": 85,
        "totalNet": 67,
        "totalPoints": 42,
        "status": "SUBMITTED",
        "holesCompleted": 18,
        "thru": "18"
      },
      {
        "position": 2,
        "playerId": "player_456",
        "playerName": "Anna Schmidt",
        "handicap": "24.2",
        "totalGross": 92,
        "totalNet": 68,
        "totalPoints": 41,
        "status": "IN_PROGRESS",
        "holesCompleted": 15,
        "thru": "15"
      }
    ]
  }
}
```

---

### Get Leaderboard (SSE - Real-Time)

```http
GET /api/tournaments/:id/leaderboard
Accept: text/event-stream
```

**Server-Sent Events Stream:**

```
data: {"tournamentId":"tournament_1234","updatedAt":"2025-09-15T14:32:15Z","playerCount":42,"leaderboard":[...]}

data: {"tournamentId":"tournament_1234","updatedAt":"2025-09-15T14:32:20Z","playerCount":42,"leaderboard":[...]}

data: {"tournamentId":"tournament_1234","updatedAt":"2025-09-15T14:32:25Z","playerCount":43,"leaderboard":[...]}
```

**Update Frequency:** Every 5 seconds

**Client Example:**

```javascript
const eventSource = new EventSource('/api/tournaments/tournament_1234/leaderboard');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Leaderboard updated:', data);
  updateUI(data);
};

eventSource.onerror = () => {
  console.error('Connection lost');
  eventSource.close();
};
```

---

## 🏥 Health Check

```http
GET /api/health
```

**Response (Healthy):**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": "connected"
}
```

**Response (Unhealthy - 503):**

```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

---

## 🔒 Authentication (Phase 2)

### Login

```http
POST /api/auth/login
```

**Request:**

```json
{
  "email": "admin@golfplatz-siek.de",
  "password": "secure-password"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "admin@golfplatz-siek.de",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

---

## 📝 Scorecards (Phase 2)

### Create Scorecard

```http
POST /api/tournaments/:tournamentId/scorecards
```

**Request:**

```json
{
  "playerId": "player_123",
  "playerHandicap": 18.5
}
```

---

### Submit Score for Hole

```http
POST /api/scorecards/:scorecardId/holes
```

**Request:**

```json
{
  "hole": 1,
  "par": 4,
  "gross": 5,
  "putts": 2,
  "fairwayHit": true,
  "greenInRegulation": false
}
```

---

### Submit Scorecard

```http
POST /api/scorecards/:scorecardId/submit
```

**Request:**

```json
{
  "markerName": "John Doe"
}
```

---

## ❌ Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Business rule violation |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 🔄 Rate Limiting (Phase 3)

- **General API**: 100 requests/minute
- **SSE Connections**: 5 connections/user
- **Scorecard Submission**: 20 requests/minute

---

## 📌 Best Practices

### Timestamps

All timestamps are in **ISO 8601** format with UTC timezone:

```
2025-09-15T14:30:00Z
```

### Pagination (Coming Soon)

```http
GET /api/tournaments?page=2&limit=20
```

### Filtering

Use query parameters for filtering:

```http
GET /api/tournaments?status=OPEN_FOR_REGISTRATION,IN_PROGRESS&category=CLUB_CHAMPIONSHIP
```

### Sorting (Coming Soon)

```http
GET /api/tournaments?sort=-tournamentDate
```

(- prefix for descending order)

---

## 🧪 Testing with cURL

### Create Tournament

```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Turnier",
    "format": "STABLEFORD",
    "category": "CASUAL",
    "tournamentDate": "2025-12-01T09:00:00Z",
    "registrationStart": "2025-11-01T00:00:00Z",
    "registrationEnd": "2025-11-25T23:59:59Z"
  }'
```

### Open Tournament

```bash
curl -X PATCH http://localhost:3000/api/tournaments/tournament_1234 \
  -H "Content-Type: application/json" \
  -d '{"action": "open"}'
```

### Stream Leaderboard

```bash
curl -N -H "Accept: text/event-stream" \
  http://localhost:3000/api/tournaments/tournament_1234/leaderboard
```

---

**For more details, see [README.md](../README.md)**
