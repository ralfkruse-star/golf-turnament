# Database Schema Documentation

Complete documentation of the database schema for the Golf Tournament Management System.

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Domain Tables](#core-domain-tables)
4. [Authentication Tables](#authentication-tables)
5. [Photo & Gallery Tables](#photo--gallery-tables)
6. [Analytics Tables](#analytics-tables)
7. [Multi-Club Tables](#multi-club-tables)
8. [Notification Tables](#notification-tables)
9. [Indexes](#indexes)
10. [Constraints](#constraints)
11. [Migration History](#migration-history)
12. [Data Types & Enums](#data-types--enums)
13. [Best Practices](#best-practices)

---

## Overview

### Database System

- **DBMS**: PostgreSQL 16+
- **ORM**: Prisma 6.0+
- **Schema Management**: Prisma Migrations
- **Hosted**: EU-based (DSGVO compliance)

### Design Principles

1. **Normalization**: 3NF (Third Normal Form) for relational integrity
2. **Denormalization**: Strategic use of JSON for flexible data
3. **Soft Deletes**: Cascade deletes for referential integrity
4. **Audit Fields**: `createdAt` and `updatedAt` on all main tables
5. **Indexing**: Strategic indexes on foreign keys and frequently queried fields

### Schema Statistics

- **Total Tables**: 20+
- **Total Enums**: 15+
- **Total Indexes**: 50+
- **Total Constraints**: 30+

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Player    │───────│ Registration │───────│ Tournament  │
└─────────────┘   1:N └──────────────┘   N:1 └─────────────┘
      │                                            │
      │ 1:N                                        │ 1:N
      │                                            │
┌─────────────┐                              ┌──────────┐
│  Scorecard  │                              │  Flight  │
└─────────────┘                              └──────────┘
                                                   │
                                                   │ N:1
                                                   │
                                             ┌──────────────┐
                                             │ Registration │
                                             └──────────────┘

┌─────────┐       ┌────────────┐       ┌──────────────┐
│  User   │───────│ ClubMember │───────│     Club     │
└─────────┘   1:N └────────────┘   N:1 └──────────────┘
     │                                        │
     │ 1:N                                    │ 1:N
     │                                        │
┌─────────┐                              ┌──────────────┐
│  Photo  │                              │  Tournament  │
└─────────┘                              └──────────────┘
     │
     │ N:1
     │
┌─────────┐
│  Album  │
└─────────┘
```

---

## Core Domain Tables

### Player

Stores player/member information.

**Table Name**: `Player`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique player identifier |
| `memberNumber` | String | UNIQUE, NULLABLE | PC Caddie sync number |
| `firstName` | String | NOT NULL | Player's first name |
| `lastName` | String | NOT NULL | Player's last name |
| `email` | String | UNIQUE, NOT NULL | Email address |
| `phone` | String | NULLABLE | Phone number |
| `dateOfBirth` | DateTime | NULLABLE | Date of birth |
| `gender` | Enum | NULLABLE | Gender (MALE, FEMALE, OTHER) |
| `handicapIndex` | Decimal(4,1) | NOT NULL | WHS handicap index (-10.0 to 54.0) |
| `homeClub` | String | NULLABLE | Home golf club name |
| `whsId` | String | UNIQUE, NULLABLE | World Handicap System ID |
| `membershipType` | Enum | NOT NULL, DEFAULT GUEST | Membership type |
| `memberSince` | DateTime | NULLABLE | Membership start date |
| `consentGiven` | Boolean | NOT NULL, DEFAULT false | DSGVO consent |
| `consentDate` | DateTime | NULLABLE | Date consent given |
| `marketingConsent` | Boolean | NOT NULL, DEFAULT false | Marketing email consent |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation timestamp |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update timestamp |
| `userId` | String | FOREIGN KEY, UNIQUE, NULLABLE | Associated user account |

**Indexes**:
- `@@index([email])`
- `@@index([memberNumber])`
- `@@index([whsId])`

**Relationships**:
- `user` - One-to-One with `User`
- `registrations` - One-to-Many with `Registration`
- `scorecards` - One-to-Many with `Scorecard`

**Business Rules**:
- Email must be unique across all players
- Handicap index must be between -10.0 and 54.0
- DSGVO consent required for data processing
- Member number unique for PC Caddie integration

---

### Tournament

Stores tournament information and configuration.

**Table Name**: `Tournament`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique tournament identifier |
| `name` | String | NOT NULL | Tournament name |
| `description` | Text | NULLABLE | Tournament description |
| `format` | Enum | NOT NULL | Tournament format (STABLEFORD, STROKE_PLAY, etc.) |
| `category` | Enum | NOT NULL, DEFAULT CASUAL | Tournament category |
| `status` | Enum | NOT NULL, DEFAULT DRAFT | Tournament status |
| `tournamentDate` | DateTime | NOT NULL | Tournament date and time |
| `registrationStart` | DateTime | NOT NULL | Registration opens |
| `registrationEnd` | DateTime | NOT NULL | Registration closes |
| `courseId` | String | FOREIGN KEY, NULLABLE | Associated golf course |
| `teesUsed` | JSON | NOT NULL | Tee configuration (flexible) |
| `maxPlayers` | Integer | NULLABLE | Maximum players allowed |
| `minPlayers` | Integer | NOT NULL, DEFAULT 4 | Minimum players required |
| `entryFee` | Decimal(10,2) | NULLABLE | Entry fee in EUR |
| `autoGenerateFlights` | Boolean | NOT NULL, DEFAULT true | Auto-generate flights |
| `flightsPerTee` | Integer | NOT NULL, DEFAULT 15 | Minutes between flights |
| `allowGuests` | Boolean | NOT NULL, DEFAULT true | Allow guest registrations |
| `requireHandicap` | Boolean | NOT NULL, DEFAULT true | Require handicap |
| `maxHandicap` | Decimal(4,1) | NULLABLE | Maximum handicap allowed |
| `sponsorPackages` | JSON | NULLABLE | Sponsor package configuration |
| `clubId` | String | FOREIGN KEY, NULLABLE | Associated club |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation timestamp |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update timestamp |
| `createdBy` | String | FOREIGN KEY, NULLABLE | Creator user ID |

**Indexes**:
- `@@index([tournamentDate])`
- `@@index([status])`
- `@@index([clubId])`

**Relationships**:
- `course` - Many-to-One with `Course`
- `club` - Many-to-One with `Club`
- `creator` - Many-to-One with `User`
- `registrations` - One-to-Many with `Registration`
- `flights` - One-to-Many with `Flight`
- `scorecards` - One-to-Many with `Scorecard`
- `sponsors` - One-to-Many with `Sponsor`
- `photos` - One-to-Many with `Photo`

**JSON Fields**:

`teesUsed`:
```json
{
  "men": "white",
  "women": "red",
  "seniors": "blue"
}
```

`sponsorPackages`:
```json
{
  "platinum": {
    "price": 5000,
    "benefits": ["Logo on scorecard", "Banner placement", "4 player slots"]
  },
  "gold": {
    "price": 2500,
    "benefits": ["Logo on website", "2 player slots"]
  }
}
```

**Status Flow**:
```
DRAFT → OPEN_FOR_REGISTRATION → REGISTRATION_CLOSED → IN_PROGRESS → COMPLETED
                                                                    ↓
                                                              CANCELLED
                                                                    ↓
                                                              ARCHIVED
```

---

### Registration

Player registrations for tournaments.

**Table Name**: `Registration`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique registration ID |
| `tournamentId` | String | FOREIGN KEY, NOT NULL | Tournament reference |
| `playerId` | String | FOREIGN KEY, NOT NULL | Player reference |
| `flightId` | String | FOREIGN KEY, NULLABLE | Assigned flight |
| `status` | Enum | NOT NULL, DEFAULT PENDING | Registration status |
| `registeredAt` | DateTime | NOT NULL, DEFAULT now() | Registration timestamp |
| `playingHandicap` | Decimal(4,1) | NULLABLE | Calculated playing handicap |
| `tee` | String | NULLABLE | Tee preference |
| `paid` | Boolean | NOT NULL, DEFAULT false | Payment status |
| `paidAt` | DateTime | NULLABLE | Payment timestamp |
| `paymentMethod` | String | NULLABLE | Payment method |
| `specialRequests` | Text | NULLABLE | Special requests |
| `cart` | Boolean | NOT NULL, DEFAULT false | Golf cart requested |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Unique Constraints**:
- `@@unique([tournamentId, playerId])` - One registration per player per tournament

**Indexes**:
- `@@index([tournamentId])`
- `@@index([playerId])`

**Relationships**:
- `tournament` - Many-to-One with `Tournament` (CASCADE DELETE)
- `player` - Many-to-One with `Player` (CASCADE DELETE)
- `flight` - Many-to-One with `Flight`

**Business Rules**:
- Player can only register once per tournament
- Playing handicap calculated at registration time
- Payment required before tournament start (configurable)

---

### Scorecard

Player scorecards for tournaments.

**Table Name**: `Scorecard`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique scorecard ID |
| `tournamentId` | String | FOREIGN KEY, NOT NULL | Tournament reference |
| `playerId` | String | FOREIGN KEY, NOT NULL | Player reference |
| `scores` | JSON | NOT NULL | Hole-by-hole scores |
| `totalGross` | Integer | NULLABLE | Total gross score |
| `totalNet` | Integer | NULLABLE | Total net score |
| `totalPoints` | Integer | NULLABLE | Stableford points |
| `status` | Enum | NOT NULL, DEFAULT NOT_STARTED | Scorecard status |
| `startedAt` | DateTime | NULLABLE | Scoring started |
| `submittedAt` | DateTime | NULLABLE | Scorecard submitted |
| `verifiedAt` | DateTime | NULLABLE | Scorecard verified |
| `markerName` | String | NULLABLE | Marker attestation name |
| `markerSignature` | String | NULLABLE | Digital signature |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Unique Constraints**:
- `@@unique([tournamentId, playerId])`

**Indexes**:
- `@@index([tournamentId])`
- `@@index([status])`

**Relationships**:
- `tournament` - Many-to-One with `Tournament` (CASCADE DELETE)
- `player` - Many-to-One with `Player` (CASCADE DELETE)

**JSON Fields**:

`scores`:
```json
[
  {
    "hole": 1,
    "gross": 5,
    "putts": 2,
    "fairwayHit": true,
    "greenInRegulation": false,
    "stablefordPoints": 2
  },
  {
    "hole": 2,
    "gross": 4,
    "putts": 2,
    "fairwayHit": false,
    "greenInRegulation": true,
    "stablefordPoints": 2
  }
  // ... holes 3-18
]
```

**Status Flow**:
```
NOT_STARTED → IN_PROGRESS → SUBMITTED → VERIFIED
                                 ↓
                           DISQUALIFIED
```

---

### Flight

Tournament flight/tee time assignments.

**Table Name**: `Flight`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique flight ID |
| `tournamentId` | String | FOREIGN KEY, NOT NULL | Tournament reference |
| `flightNumber` | Integer | NOT NULL | Flight number (sequential) |
| `startTime` | DateTime | NOT NULL | Tee time |
| `startHole` | Integer | NOT NULL, DEFAULT 1 | Starting hole |

**Unique Constraints**:
- `@@unique([tournamentId, flightNumber])`

**Indexes**:
- `@@index([tournamentId])`

**Relationships**:
- `tournament` - Many-to-One with `Tournament` (CASCADE DELETE)
- `registrations` - One-to-Many with `Registration`

---

### Course

Golf course information.

**Table Name**: `Course`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique course ID |
| `name` | String | NOT NULL | Course name |
| `location` | String | NULLABLE | Course location |
| `holes` | Integer | NOT NULL, DEFAULT 18 | Number of holes |
| `par` | Integer | NOT NULL, DEFAULT 72 | Course par |
| `tees` | JSON | NOT NULL | Tee configurations |
| `holeDetails` | JSON | NOT NULL | Hole-by-hole details |
| `clubId` | String | FOREIGN KEY, NULLABLE | Associated club |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Indexes**:
- `@@index([clubId])`

**Relationships**:
- `club` - Many-to-One with `Club`
- `tournaments` - One-to-Many with `Tournament`

**JSON Fields**:

`tees`:
```json
[
  {
    "name": "Championship",
    "color": "black",
    "rating": 74.2,
    "slope": 142,
    "yardage": 7200
  },
  {
    "name": "Members",
    "color": "white",
    "rating": 71.8,
    "slope": 135,
    "yardage": 6800
  }
]
```

`holeDetails`:
```json
[
  {
    "hole": 1,
    "par": 4,
    "handicap": 10,
    "yardages": {
      "black": 420,
      "white": 380,
      "red": 320
    }
  }
  // ... holes 2-18
]
```

---

### Sponsor

Tournament sponsors.

**Table Name**: `Sponsor`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique sponsor ID |
| `name` | String | NOT NULL | Sponsor name |
| `logo` | String | NULLABLE | Logo URL |
| `website` | String | NULLABLE | Website URL |
| `contactPerson` | String | NULLABLE | Contact person |
| `contactEmail` | String | NULLABLE | Contact email |
| `contactPhone` | String | NULLABLE | Contact phone |
| `tier` | Enum | NOT NULL | Sponsor tier |
| `tournamentId` | String | FOREIGN KEY, NOT NULL | Tournament reference |
| `activationPoints` | JSON | NULLABLE | Sponsor activation details |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Indexes**:
- `@@index([tournamentId])`

**Relationships**:
- `tournament` - Many-to-One with `Tournament` (CASCADE DELETE)

---

## Authentication Tables

### User

User accounts (NextAuth.js).

**Table Name**: `User`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique user ID |
| `email` | String | UNIQUE, NOT NULL | Email address |
| `emailVerified` | DateTime | NULLABLE | Email verification timestamp |
| `name` | String | NULLABLE | Display name |
| `image` | String | NULLABLE | Profile image URL |
| `role` | Enum | NOT NULL, DEFAULT PLAYER | User role |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Account creation |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Indexes**:
- `@@index([email])`

**Relationships**:
- `accounts` - One-to-Many with `Account`
- `sessions` - One-to-Many with `Session`
- `player` - One-to-One with `Player`
- `tournaments` - One-to-Many with `Tournament` (created tournaments)
- `photos` - One-to-Many with `Photo` (uploaded photos)
- `reports` - One-to-Many with `Report` (generated reports)
- `pushSubscriptions` - One-to-Many with `PushSubscription`
- `clubMemberships` - One-to-Many with `ClubMember`

**Roles**:
- `ADMIN` - Full system access
- `TOURNAMENT_MANAGER` - Manage tournaments
- `MARSHAL` - Tournament day operations
- `PRO_SHOP` - Registrations and payments
- `PLAYER` - Basic player access

---

### Account

OAuth provider accounts (NextAuth.js).

**Table Name**: `Account`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique account ID |
| `userId` | String | FOREIGN KEY, NOT NULL | User reference |
| `type` | String | NOT NULL | Account type |
| `provider` | String | NOT NULL | OAuth provider |
| `providerAccountId` | String | NOT NULL | Provider account ID |
| `refresh_token` | Text | NULLABLE | OAuth refresh token |
| `access_token` | Text | NULLABLE | OAuth access token |
| `expires_at` | Integer | NULLABLE | Token expiration |
| `token_type` | String | NULLABLE | Token type |
| `scope` | String | NULLABLE | OAuth scope |
| `id_token` | Text | NULLABLE | ID token |
| `session_state` | String | NULLABLE | Session state |

**Unique Constraints**:
- `@@unique([provider, providerAccountId])`

**Indexes**:
- `@@index([userId])`

**Relationships**:
- `user` - Many-to-One with `User` (CASCADE DELETE)

---

### Session

User sessions (NextAuth.js).

**Table Name**: `Session`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique session ID |
| `sessionToken` | String | UNIQUE, NOT NULL | Session token |
| `userId` | String | FOREIGN KEY, NOT NULL | User reference |
| `expires` | DateTime | NOT NULL | Session expiration |

**Indexes**:
- `@@index([userId])`

**Relationships**:
- `user` - Many-to-One with `User` (CASCADE DELETE)

---

### VerificationToken

Email verification tokens (NextAuth.js).

**Table Name**: `VerificationToken`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `identifier` | String | NOT NULL | Email or identifier |
| `token` | String | UNIQUE, NOT NULL | Verification token |
| `expires` | DateTime | NOT NULL | Token expiration |

**Unique Constraints**:
- `@@unique([identifier, token])`

---

## Photo & Gallery Tables

### Photo

Photo uploads.

**Table Name**: `Photo`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique photo ID |
| `filename` | String | NOT NULL | Stored filename |
| `originalName` | String | NOT NULL | Original filename |
| `mimeType` | String | NOT NULL | MIME type |
| `fileSize` | Integer | NOT NULL | File size in bytes |
| `width` | Integer | NOT NULL | Image width |
| `height` | Integer | NOT NULL | Image height |
| `url` | String | NOT NULL | Original URL |
| `thumbnailUrl` | String | NULLABLE | Thumbnail URL (200x200) |
| `mediumUrl` | String | NULLABLE | Medium URL (800x800) |
| `caption` | Text | NULLABLE | Photo caption |
| `category` | Enum | NOT NULL, DEFAULT TOURNAMENT | Photo category |
| `takenAt` | DateTime | NULLABLE | Photo taken timestamp |
| `tournamentId` | String | FOREIGN KEY, NULLABLE | Associated tournament |
| `uploadedBy` | String | FOREIGN KEY, NULLABLE | Uploader user ID |
| `albumId` | String | FOREIGN KEY, NULLABLE | Associated album |
| `isPublic` | Boolean | NOT NULL, DEFAULT true | Public visibility |
| `isFeatured` | Boolean | NOT NULL, DEFAULT false | Featured photo |
| `approved` | Boolean | NOT NULL, DEFAULT false | Moderation approved |
| `moderatedBy` | String | NULLABLE | Moderator user ID |
| `moderatedAt` | DateTime | NULLABLE | Moderation timestamp |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Upload timestamp |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Indexes**:
- `@@index([tournamentId])`
- `@@index([uploadedBy])`
- `@@index([category])`
- `@@index([createdAt])`

**Relationships**:
- `tournament` - Many-to-One with `Tournament` (CASCADE DELETE)
- `uploader` - Many-to-One with `User`
- `album` - Many-to-One with `Album`

**Photo Categories**:
- `TOURNAMENT` - Tournament photos
- `COURSE` - Course photos
- `CLUBHOUSE` - Clubhouse photos
- `SOCIAL` - Social events
- `AWARDS` - Award ceremonies
- `ACTION_SHOT` - Action shots

---

### Album

Photo albums.

**Table Name**: `Album`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique album ID |
| `title` | String | NOT NULL | Album title |
| `description` | Text | NULLABLE | Album description |
| `coverPhotoId` | String | NULLABLE | Cover photo reference |
| `isPublic` | Boolean | NOT NULL, DEFAULT true | Public visibility |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Indexes**:
- `@@index([createdAt])`

**Relationships**:
- `photos` - One-to-Many with `Photo`

---

## Analytics Tables

### AnalyticsMetric

Analytics metrics tracking.

**Table Name**: `AnalyticsMetric`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique metric ID |
| `metricType` | Enum | NOT NULL | Type of metric |
| `tournamentId` | String | NULLABLE | Associated tournament |
| `playerId` | String | NULLABLE | Associated player |
| `date` | DateTime | NOT NULL | Metric date |
| `value` | Decimal(10,2) | NOT NULL | Metric value |
| `count` | Integer | NULLABLE | Count value |
| `metadata` | JSON | NULLABLE | Additional metadata |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Record creation |

**Indexes**:
- `@@index([metricType, date])`
- `@@index([tournamentId])`
- `@@index([playerId])`
- `@@index([date])`

**Metric Types**:
- `TOURNAMENT_PARTICIPATION` - Tournament participation count
- `PLAYER_PERFORMANCE` - Player performance metrics
- `REVENUE` - Revenue metrics
- `REGISTRATION_CONVERSION` - Registration conversion rate
- `SCORECARD_COMPLETION` - Scorecard completion rate
- `AVERAGE_SCORE` - Average scores
- `HANDICAP_DISTRIBUTION` - Handicap distribution

---

### Report

Generated reports.

**Table Name**: `Report`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique report ID |
| `title` | String | NOT NULL | Report title |
| `reportType` | Enum | NOT NULL | Report type |
| `format` | Enum | NOT NULL, DEFAULT PDF | Report format |
| `parameters` | JSON | NOT NULL | Report parameters |
| `fileUrl` | String | NULLABLE | Generated file URL |
| `fileSize` | Integer | NULLABLE | File size in bytes |
| `generatedBy` | String | FOREIGN KEY, NULLABLE | Generator user ID |
| `generatedAt` | DateTime | NOT NULL, DEFAULT now() | Generation timestamp |
| `expiresAt` | DateTime | NULLABLE | Expiration timestamp |

**Indexes**:
- `@@index([reportType])`
- `@@index([generatedBy])`
- `@@index([generatedAt])`

**Relationships**:
- `generator` - Many-to-One with `User`

**Report Types**:
- `TOURNAMENT_SUMMARY` - Tournament summary
- `PLAYER_PERFORMANCE` - Player performance
- `FINANCIAL` - Financial reports
- `PARTICIPATION_TRENDS` - Participation trends
- `HANDICAP_ANALYSIS` - Handicap analysis
- `CUSTOM` - Custom reports

**Report Formats**:
- `PDF` - PDF document
- `EXCEL` - Excel spreadsheet
- `CSV` - CSV file
- `JSON` - JSON data

---

## Multi-Club Tables

### Club

Golf club/organization.

**Table Name**: `Club`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique club ID |
| `name` | String | NOT NULL | Club name |
| `slug` | String | UNIQUE, NOT NULL | URL slug |
| `description` | Text | NULLABLE | Club description |
| `logo` | String | NULLABLE | Logo URL |
| `website` | String | NULLABLE | Website URL |
| `email` | String | NOT NULL | Contact email |
| `phone` | String | NULLABLE | Contact phone |
| `address` | String | NULLABLE | Street address |
| `city` | String | NULLABLE | City |
| `postalCode` | String | NULLABLE | Postal code |
| `country` | String | NOT NULL, DEFAULT "DE" | Country code |
| `primaryColor` | String | NULLABLE, DEFAULT "#16a34a" | Primary brand color |
| `secondaryColor` | String | NULLABLE | Secondary brand color |
| `customDomain` | String | UNIQUE, NULLABLE | Custom domain |
| `tier` | Enum | NOT NULL, DEFAULT FREE | Subscription tier |
| `subscriptionId` | String | UNIQUE, NULLABLE | Stripe subscription ID |
| `trialEndsAt` | DateTime | NULLABLE | Trial end date |
| `activeUntil` | DateTime | NULLABLE | Subscription active until |
| `maxTournaments` | Integer | NULLABLE | Max tournaments (null = unlimited) |
| `maxPlayers` | Integer | NULLABLE | Max players (null = unlimited) |
| `features` | JSON | NOT NULL | Feature flags |
| `settings` | JSON | NULLABLE | Club settings |
| `isActive` | Boolean | NOT NULL, DEFAULT true | Active status |
| `isSuspended` | Boolean | NOT NULL, DEFAULT false | Suspension status |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |

**Indexes**:
- `@@index([slug])`
- `@@index([tier])`
- `@@index([isActive])`

**Relationships**:
- `courses` - One-to-Many with `Course`
- `users` - One-to-Many with `ClubMember`
- `tournaments` - One-to-Many with `Tournament`

**Subscription Tiers**:
- `FREE` - Free tier (limited features)
- `BASIC` - Basic paid tier
- `PREMIUM` - Premium tier
- `ENTERPRISE` - Enterprise tier

**Features JSON**:
```json
{
  "tournaments": true,
  "photos": true,
  "analytics": false,
  "pushNotifications": true,
  "whiteLabel": false,
  "customDomain": false,
  "reports": true,
  "multiClub": false
}
```

---

### ClubMember

Club membership relationships.

**Table Name**: `ClubMember`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique membership ID |
| `clubId` | String | FOREIGN KEY, NOT NULL | Club reference |
| `userId` | String | FOREIGN KEY, NOT NULL | User reference |
| `role` | Enum | NOT NULL, DEFAULT MEMBER | Member role |
| `joinedAt` | DateTime | NOT NULL, DEFAULT now() | Join timestamp |

**Unique Constraints**:
- `@@unique([clubId, userId])`

**Indexes**:
- `@@index([clubId])`
- `@@index([userId])`

**Relationships**:
- `club` - Many-to-One with `Club` (CASCADE DELETE)
- `user` - Many-to-One with `User` (CASCADE DELETE)

**Member Roles**:
- `OWNER` - Club owner
- `ADMIN` - Club administrator
- `MANAGER` - Tournament manager
- `STAFF` - Staff member
- `MEMBER` - Regular member

---

## Notification Tables

### PushSubscription

Web push notification subscriptions.

**Table Name**: `PushSubscription`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique subscription ID |
| `endpoint` | String | UNIQUE, NOT NULL | Push endpoint URL |
| `p256dh` | String | NOT NULL | Public key |
| `auth` | String | NOT NULL | Auth secret |
| `userId` | String | FOREIGN KEY, NULLABLE | Associated user |
| `playerId` | String | NULLABLE | Associated player |
| `userAgent` | Text | NULLABLE | User agent string |
| `deviceType` | String | NULLABLE | Device type |
| `enabled` | Boolean | NOT NULL, DEFAULT true | Subscription enabled |
| `topics` | String[] | NOT NULL | Subscribed topics |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | Subscription creation |
| `updatedAt` | DateTime | NOT NULL, AUTO | Last update |
| `lastUsedAt` | DateTime | NOT NULL, DEFAULT now() | Last notification sent |

**Indexes**:
- `@@index([userId])`
- `@@index([enabled])`

**Relationships**:
- `user` - Many-to-One with `User` (CASCADE DELETE)

**Topics**:
- `tournaments` - Tournament notifications
- `scores` - Score updates
- `announcements` - General announcements
- `reminders` - Tournament reminders

---

### NotificationLog

Notification delivery log.

**Table Name**: `NotificationLog`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (cuid) | PRIMARY KEY | Unique log ID |
| `title` | String | NOT NULL | Notification title |
| `body` | Text | NOT NULL | Notification body |
| `icon` | String | NULLABLE | Icon URL |
| `badge` | String | NULLABLE | Badge URL |
| `url` | String | NULLABLE | Click action URL |
| `userId` | String | NULLABLE | Target user ID |
| `tournamentId` | String | NULLABLE | Related tournament |
| `topic` | String | NULLABLE | Broadcast topic |
| `sentAt` | DateTime | NOT NULL, DEFAULT now() | Send timestamp |
| `delivered` | Integer | NOT NULL, DEFAULT 0 | Delivery count |
| `failed` | Integer | NOT NULL, DEFAULT 0 | Failure count |
| `metadata` | JSON | NULLABLE | Additional metadata |

**Indexes**:
- `@@index([userId])`
- `@@index([tournamentId])`
- `@@index([sentAt])`

---

## Indexes

### Index Strategy

Indexes are created for:

1. **Primary Keys** - Automatic unique index
2. **Foreign Keys** - Improve join performance
3. **Frequently Queried Fields** - Email, status, dates
4. **Composite Indexes** - Multiple column queries
5. **Unique Constraints** - Data integrity

### Performance Considerations

- **Too Many Indexes** - Slow down writes
- **Too Few Indexes** - Slow down reads
- **Monitor Query Performance** - Use EXPLAIN ANALYZE
- **Index Maintenance** - Periodic REINDEX

---

## Constraints

### Referential Integrity

All foreign keys enforce referential integrity:

```prisma
model Registration {
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
}
```

**Cascade Delete Actions**:
- `CASCADE` - Delete related records
- `SET NULL` - Set foreign key to null
- `RESTRICT` - Prevent deletion

### Unique Constraints

Prevent duplicate data:

```prisma
model Player {
  email String @unique
  whsId String? @unique

  @@unique([tournamentId, playerId])
}
```

### Check Constraints

Business rule enforcement (Prisma doesn't support directly, enforced in domain):

- Handicap index between -10.0 and 54.0
- Tournament date after registration end
- Entry fee non-negative

---

## Migration History

### Migration Workflow

```bash
# Create migration
pnpm prisma migrate dev --name add_feature

# Apply to production
pnpm prisma migrate deploy

# View migration status
pnpm prisma migrate status
```

### Key Migrations

1. **Initial Schema** (`20240101_init`) - Core tables
2. **Email Integration** (`20240110_brevo`) - Email service
3. **Photo System** (`20240115_photos`) - Photo galleries
4. **Analytics** (`20240120_analytics`) - Analytics tables
5. **Multi-Club** (`20240125_clubs`) - Multi-tenancy
6. **Push Notifications** (`20240130_push`) - Push notification support

### Migration Best Practices

1. **Always test locally first**
2. **Backup database before production migration**
3. **Plan for rollback**
4. **Avoid breaking changes in production**
5. **Use data migrations when needed**

---

## Data Types & Enums

### Common Enums

**TournamentStatus**:
```prisma
enum TournamentStatus {
  DRAFT
  OPEN_FOR_REGISTRATION
  REGISTRATION_CLOSED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  ARCHIVED
}
```

**TournamentFormat**:
```prisma
enum TournamentFormat {
  STROKE_PLAY
  STABLEFORD
  MATCH_PLAY
  SCRAMBLE
  BEST_BALL
  FOUR_BALL
  NASSAU
}
```

**MembershipType**:
```prisma
enum MembershipType {
  MEMBER
  GUEST
  CORPORATE
  TRIAL
}
```

**UserRole**:
```prisma
enum UserRole {
  ADMIN
  TOURNAMENT_MANAGER
  MARSHAL
  PRO_SHOP
  PLAYER
}
```

### Decimal Precision

- **Handicap**: Decimal(4,1) - Range: -10.0 to 54.0
- **Money**: Decimal(10,2) - Up to 99,999,999.99
- **Metrics**: Decimal(10,2) - Analytics values

---

## Best Practices

### Querying

**Use Select for Performance**:
```typescript
// ✅ Good: Select only needed fields
const players = await prisma.player.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
})

// ❌ Bad: Fetching all fields
const players = await prisma.player.findMany()
```

**Use Include for Relations**:
```typescript
// ✅ Good: Eager loading
const tournament = await prisma.tournament.findUnique({
  where: { id },
  include: {
    registrations: {
      include: {
        player: true,
      },
    },
  },
})

// ❌ Bad: N+1 queries
const tournament = await prisma.tournament.findUnique({ where: { id } })
const registrations = await prisma.registration.findMany({
  where: { tournamentId: id },
})
// Then fetch player for each registration...
```

### Transactions

Use transactions for related operations:

```typescript
await prisma.$transaction(async (tx) => {
  // Update tournament
  await tx.tournament.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
  })

  // Create scorecards
  await tx.scorecard.createMany({
    data: registrations.map(r => ({
      tournamentId: id,
      playerId: r.playerId,
      status: 'NOT_STARTED',
    })),
  })
})
```

### Data Validation

Validate data at multiple levels:

1. **Database** - Constraints, types, NOT NULL
2. **Domain Layer** - Business rules, invariants
3. **API Layer** - Zod schemas, input validation

---

## Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Database Design**: https://www.databasestar.com/database-normalization/

---

*Last Updated: 2025-01-15*
