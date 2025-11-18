# Component Library Documentation

Complete documentation for all reusable components in the Golf Tournament Management System.

## Table of Contents

1. [Overview](#overview)
2. [UI Components (shadcn/ui)](#ui-components-shadcnui)
3. [Gallery Components](#gallery-components)
4. [Club Components](#club-components)
5. [Push Notification Components](#push-notification-components)
6. [Analytics Components](#analytics-components)
7. [PWA Components](#pwa-components)
8. [Report Components](#report-components)
9. [Styling Guidelines](#styling-guidelines)
10. [Accessibility](#accessibility)
11. [Component Patterns](#component-patterns)

---

## Overview

### Component Philosophy

Our component library follows these principles:

1. **Composition over Configuration** - Small, focused components that compose well
2. **Accessibility First** - ARIA labels, keyboard navigation, screen reader support
3. **Type Safety** - Fully typed with TypeScript
4. **Consistent Design** - Based on shadcn/ui design system
5. **Performance** - Optimized renders, lazy loading where appropriate

### Component Categories

- **UI Components** (`/components/ui/`) - Base design system components
- **Feature Components** (`/components/**/`) - Domain-specific components
- **Layout Components** - Page layouts and shells
- **Form Components** - Form inputs and validation

### Import Patterns

```typescript
// UI components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Feature components
import { PhotoUpload } from '@/components/gallery/photo-upload'
import { ClubSelector } from '@/components/club/club-selector'

// Utility
import { cn } from '@/lib/utils'
```

---

## UI Components (shadcn/ui)

Our base UI components are from [shadcn/ui](https://ui.shadcn.com/), a collection of accessible, customizable components built on Radix UI primitives.

### Button

Versatile button component with multiple variants and sizes.

**Import:**
```typescript
import { Button } from '@/components/ui/button'
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `asChild` | `boolean` | `false` | Render as child element (for links) |

**Variants:**

```typescript
// Default button (primary)
<Button>Click me</Button>

// Destructive action (delete, cancel)
<Button variant="destructive">Delete</Button>

// Outline style
<Button variant="outline">Cancel</Button>

// Secondary action
<Button variant="secondary">Secondary Action</Button>

// Ghost (subtle)
<Button variant="ghost">Ghost</Button>

// Link style
<Button variant="link">Learn More</Button>
```

**Sizes:**

```typescript
// Small
<Button size="sm">Small</Button>

// Default
<Button>Default</Button>

// Large
<Button size="lg">Large</Button>

// Icon only
<Button size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>
```

**As Link:**

```typescript
import Link from 'next/link'

<Button asChild>
  <Link href="/tournaments">View Tournaments</Link>
</Button>
```

**Accessibility:**
- Keyboard focusable
- ARIA labels supported
- Focus ring visible
- Disabled state prevents interaction

---

### Card

Container component for grouping related content.

**Import:**
```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
```

**Example:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Tournament Details</CardTitle>
    <CardDescription>Club Championship 2025</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Tournament information goes here...</p>
  </CardContent>
  <CardFooter>
    <Button>Register</Button>
  </CardFooter>
</Card>
```

**Variants:**

```typescript
// Interactive card (hover effect)
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  ...
</Card>

// With border accent
<Card className="border-l-4 border-l-primary">
  ...
</Card>
```

---

### Badge

Small status indicator or label.

**Import:**
```typescript
import { Badge } from '@/components/ui/badge'
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | Badge style |

**Examples:**

```typescript
// Status badges
<Badge>Active</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="outline">Pending</Badge>

// Tournament status
{tournament.status === 'OPEN_FOR_REGISTRATION' && (
  <Badge className="bg-green-500">Open</Badge>
)}
{tournament.status === 'COMPLETED' && (
  <Badge variant="secondary">Completed</Badge>
)}
```

---

### Dialog (Modal)

Modal dialog overlay.

**Import:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
```

**Example:**

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this tournament?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Controlled Example:**

```typescript
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Tournament Created</DialogTitle>
    </DialogHeader>
    <p>Your tournament has been created successfully.</p>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Accessibility:**
- Traps focus within dialog
- Closes on Escape key
- Screen reader announcements
- Backdrop click to close

---

### Select

Dropdown selection component.

**Import:**
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
```

**Example:**

```typescript
<Select onValueChange={(value) => setFormat(value)}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select format" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="STABLEFORD">Stableford</SelectItem>
    <SelectItem value="STROKE_PLAY">Stroke Play</SelectItem>
    <SelectItem value="MATCH_PLAY">Match Play</SelectItem>
  </SelectContent>
</Select>
```

**Controlled:**

```typescript
const [format, setFormat] = useState('STABLEFORD')

<Select value={format} onValueChange={setFormat}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="STABLEFORD">Stableford</SelectItem>
    <SelectItem value="STROKE_PLAY">Stroke Play</SelectItem>
  </SelectContent>
</Select>
```

---

### Tabs

Tab navigation component.

**Import:**
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
```

**Example:**

```typescript
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="players">Players</TabsTrigger>
    <TabsTrigger value="scores">Scores</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <p>Tournament overview...</p>
  </TabsContent>
  <TabsContent value="players">
    <PlayerList players={players} />
  </TabsContent>
  <TabsContent value="scores">
    <Leaderboard />
  </TabsContent>
</Tabs>
```

**Accessibility:**
- Arrow key navigation
- Home/End key support
- ARIA labels

---

### Toast

Toast notifications for user feedback.

**Import:**
```typescript
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
```

**Setup:**

Add `<Toaster />` to your root layout:

```typescript
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Usage:**

```typescript
import { useToast } from '@/components/ui/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: 'Success!',
      description: 'Tournament created successfully.',
    })
  }

  const handleError = () => {
    toast({
      title: 'Error',
      description: 'Failed to create tournament.',
      variant: 'destructive',
    })
  }

  return (
    <>
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError}>Show Error</Button>
    </>
  )
}
```

**Variants:**

```typescript
// Success (default)
toast({
  title: 'Tournament Created',
  description: 'Players can now register.',
})

// Error/Destructive
toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
})

// With action
toast({
  title: 'Tournament Deleted',
  description: 'This action cannot be undone.',
  action: (
    <Button variant="outline" size="sm">
      Undo
    </Button>
  ),
})
```

---

### Dropdown Menu

Dropdown menu with actions.

**Import:**
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
```

**Example:**

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Tournament Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleEdit}>
      <EditIcon className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleOpen}>
      <CheckIcon className="mr-2 h-4 w-4" />
      Open for Registration
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      onClick={handleDelete}
      className="text-destructive"
    >
      <TrashIcon className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Gallery Components

Components for photo gallery and album management.

### PhotoUpload

Photo upload component with drag-and-drop support.

**Import:**
```typescript
import { PhotoUpload } from '@/components/gallery/photo-upload'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tournamentId` | `string` | No | Associated tournament ID |
| `albumId` | `string` | No | Associated album ID |
| `onUploadComplete` | `(photos: Photo[]) => void` | No | Callback after upload |
| `maxFiles` | `number` | No | Max files per upload (default: 10) |
| `maxSize` | `number` | No | Max file size in bytes (default: 10MB) |

**Example:**

```typescript
<PhotoUpload
  tournamentId="cm123abc"
  maxFiles={20}
  onUploadComplete={(photos) => {
    toast({
      title: 'Upload Complete',
      description: `${photos.length} photos uploaded successfully.`,
    })
  }}
/>
```

**Features:**
- Drag and drop
- Multiple file selection
- Preview before upload
- Progress indicators
- Error handling
- Image validation

---

### PhotoGrid

Responsive photo grid with lightbox.

**Import:**
```typescript
import { PhotoGrid } from '@/components/gallery/photo-grid'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `photos` | `Photo[]` | Yes | Array of photos to display |
| `columns` | `number` | No | Number of columns (default: responsive) |
| `onPhotoClick` | `(photo: Photo) => void` | No | Click handler |
| `showCaption` | `boolean` | No | Show captions (default: true) |

**Example:**

```typescript
const photos = await getPhotos(tournamentId)

<PhotoGrid
  photos={photos}
  columns={4}
  onPhotoClick={(photo) => {
    // Open lightbox
    setSelectedPhoto(photo)
  }}
/>
```

**Responsive Behavior:**
- Mobile: 1 column
- Tablet: 2-3 columns
- Desktop: 3-4 columns
- Large: 4-5 columns

---

### PhotoViewer

Lightbox photo viewer with navigation.

**Import:**
```typescript
import { PhotoViewer } from '@/components/gallery/photo-viewer'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `photo` | `Photo \| null` | Yes | Current photo |
| `photos` | `Photo[]` | No | All photos for navigation |
| `onClose` | `() => void` | Yes | Close handler |
| `onNext` | `() => void` | No | Next photo handler |
| `onPrevious` | `() => void` | No | Previous photo handler |

**Example:**

```typescript
const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
const [currentIndex, setCurrentIndex] = useState(0)

<PhotoViewer
  photo={selectedPhoto}
  photos={allPhotos}
  onClose={() => setSelectedPhoto(null)}
  onNext={() => setCurrentIndex(i => i + 1)}
  onPrevious={() => setCurrentIndex(i => i - 1)}
/>
```

**Features:**
- Full-screen viewing
- Keyboard navigation (arrow keys, Escape)
- Touch gestures on mobile
- Photo metadata display
- Download option
- Share functionality

---

### AlbumView

Display photos grouped in an album.

**Import:**
```typescript
import { AlbumView } from '@/components/gallery/album-view'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `album` | `Album` | Yes | Album data |
| `photos` | `Photo[]` | Yes | Photos in album |
| `editable` | `boolean` | No | Enable edit mode |

**Example:**

```typescript
<AlbumView
  album={album}
  photos={photos}
  editable={isAdmin}
/>
```

---

## Club Components

Multi-club management components.

### ClubSelector

Dropdown to switch between clubs.

**Import:**
```typescript
import { ClubSelector } from '@/components/club/club-selector'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clubs` | `Club[]` | Yes | Available clubs |
| `currentClubId` | `string` | Yes | Currently selected club |
| `onClubChange` | `(clubId: string) => void` | Yes | Change handler |

**Example:**

```typescript
<ClubSelector
  clubs={userClubs}
  currentClubId={currentClub.id}
  onClubChange={(clubId) => {
    router.push(`/clubs/${clubId}`)
  }}
/>
```

---

### ClubLogo

Display club logo with fallback.

**Import:**
```typescript
import { ClubLogo } from '@/components/club/club-logo'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `club` | `Club` | Yes | Club data |
| `size` | `'sm' \| 'md' \| 'lg'` | No | Logo size (default: 'md') |
| `className` | `string` | No | Additional classes |

**Example:**

```typescript
<ClubLogo club={club} size="lg" />
```

**Features:**
- Automatic fallback to initials
- Responsive sizing
- Optimized image loading

---

### TierBadge

Display club subscription tier.

**Import:**
```typescript
import { TierBadge } from '@/components/club/tier-badge'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tier` | `ClubTier` | Yes | Club tier |

**Example:**

```typescript
<TierBadge tier={club.tier} />
```

**Tiers:**
- `FREE` - Free tier (gray)
- `BASIC` - Basic tier (blue)
- `PREMIUM` - Premium tier (purple)
- `ENTERPRISE` - Enterprise tier (gold)

---

### FeatureGate

Conditionally render based on club features.

**Import:**
```typescript
import { FeatureGate } from '@/components/club/feature-gate'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `feature` | `string` | Yes | Feature name |
| `fallback` | `ReactNode` | No | Content when feature disabled |
| `children` | `ReactNode` | Yes | Content when feature enabled |

**Example:**

```typescript
<FeatureGate feature="analytics">
  <AnalyticsDashboard />
</FeatureGate>

<FeatureGate
  feature="pushNotifications"
  fallback={<UpgradePrompt feature="Push Notifications" />}
>
  <NotificationSettings />
</FeatureGate>
```

---

### UsageMeter

Display club usage vs limits.

**Import:**
```typescript
import { UsageMeter } from '@/components/club/usage-meter'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Metric label |
| `current` | `number` | Yes | Current usage |
| `limit` | `number \| null` | Yes | Usage limit (null = unlimited) |
| `unit` | `string` | No | Unit label |

**Example:**

```typescript
<UsageMeter
  label="Tournaments"
  current={45}
  limit={100}
  unit="tournaments"
/>

<UsageMeter
  label="Members"
  current={856}
  limit={null}  // Unlimited
  unit="members"
/>
```

---

## Push Notification Components

### NotificationPrompt

Prompt user to enable push notifications.

**Import:**
```typescript
import { NotificationPrompt } from '@/components/push/notification-prompt'
```

**Example:**

```typescript
<NotificationPrompt
  onEnable={async () => {
    await subscribeToPushNotifications()
  }}
  onDismiss={() => {
    setShowPrompt(false)
  }}
/>
```

**Features:**
- Browser permission check
- User-friendly messaging
- Dismissible
- Remember preference

---

### NotificationPreview

Preview notification appearance.

**Import:**
```typescript
import { NotificationPreview } from '@/components/push/notification-preview'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `notification` | `NotificationData` | Yes | Notification data |

**Example:**

```typescript
<NotificationPreview
  notification={{
    title: 'Tournament Starting Soon!',
    body: 'Club Championship starts in 1 hour',
    icon: '/icons/icon-192x192.png',
  }}
/>
```

---

## Analytics Components

### DashboardCard

Card for displaying analytics metrics.

**Import:**
```typescript
import { DashboardCard } from '@/components/analytics/dashboard-card'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Card title |
| `value` | `string \| number` | Yes | Main metric value |
| `change` | `number` | No | Percentage change |
| `icon` | `ReactNode` | No | Icon element |
| `trend` | `'up' \| 'down' \| 'neutral'` | No | Trend direction |

**Example:**

```typescript
<DashboardCard
  title="Total Tournaments"
  value={45}
  change={12.5}
  trend="up"
  icon={<TrophyIcon className="h-6 w-6" />}
/>
```

---

### ChartContainer

Container for charts with responsive sizing.

**Import:**
```typescript
import { ChartContainer } from '@/components/analytics/chart-container'
import { LineChart, Line, XAxis, YAxis } from 'recharts'
```

**Example:**

```typescript
<ChartContainer
  title="Participation Trend"
  description="Monthly tournament participation"
>
  <LineChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <Line dataKey="players" stroke="#16a34a" />
  </LineChart>
</ChartContainer>
```

---

## PWA Components

### InstallPrompt

Prompt to install PWA.

**Import:**
```typescript
import { InstallPrompt } from '@/components/pwa/install-prompt'
```

**Example:**

```typescript
<InstallPrompt
  onInstall={() => {
    // Track installation
  }}
/>
```

**Features:**
- Detects installability
- Platform-specific instructions
- iOS Safari special handling
- Dismissible

---

## Report Components

### ReportGenerator

UI for generating reports.

**Import:**
```typescript
import { ReportGenerator } from '@/components/reports/report-generator'
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tournamentId` | `string` | No | Pre-select tournament |
| `onGenerate` | `(report: Report) => void` | No | Generation callback |

**Example:**

```typescript
<ReportGenerator
  tournamentId="cm123abc"
  onGenerate={(report) => {
    window.open(report.fileUrl, '_blank')
  }}
/>
```

---

## Styling Guidelines

### Tailwind CSS

We use Tailwind CSS for all styling:

```typescript
// ✅ Good: Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <Button>Action</Button>
</div>

// ❌ Bad: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  ...
</div>
```

### Using cn() Utility

Combine classes conditionally:

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-primary text-white',
  isDisabled && 'opacity-50 pointer-events-none',
  className  // Allow prop overrides
)}>
  ...
</div>
```

### Responsive Design

Mobile-first approach:

```typescript
<div className="
  grid
  grid-cols-1      // Mobile: 1 column
  md:grid-cols-2   // Tablet: 2 columns
  lg:grid-cols-3   // Desktop: 3 columns
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Dark Mode

Use Tailwind dark mode variants:

```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  ...
</div>
```

---

## Accessibility

### ARIA Labels

Always provide ARIA labels for interactive elements:

```typescript
// Button with icon only
<Button size="icon" aria-label="Delete tournament">
  <TrashIcon className="h-4 w-4" />
</Button>

// Custom component
<PhotoGrid
  photos={photos}
  aria-label="Tournament photo gallery"
/>
```

### Keyboard Navigation

Ensure keyboard accessibility:

```typescript
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  onClick={handleClick}
>
  ...
</div>
```

### Focus Management

Visible focus indicators:

```typescript
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-primary
  focus:ring-offset-2
">
  Click me
</button>
```

### Screen Readers

Provide context for screen readers:

```typescript
<span className="sr-only">
  Tournament status: Open for registration
</span>
<Badge>Open</Badge>
```

---

## Component Patterns

### Server vs Client Components

```typescript
// Server Component (default)
export default async function TournamentList() {
  const tournaments = await getTournaments()

  return (
    <div>
      {tournaments.map(t => (
        <TournamentCard key={t.id} tournament={t} />
      ))}
    </div>
  )
}

// Client Component (for interactivity)
'use client'

export function TournamentCard({ tournament }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card onClick={() => setIsExpanded(!isExpanded)}>
      ...
    </Card>
  )
}
```

### Composition Pattern

```typescript
// ✅ Good: Composable components
<Card>
  <CardHeader>
    <CardTitle>Tournament</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Details...</p>
  </CardContent>
  <CardFooter>
    <Button>Register</Button>
  </CardFooter>
</Card>

// ❌ Bad: Monolithic component with many props
<TournamentCard
  title="Tournament"
  content="Details..."
  showFooter={true}
  footerButton="Register"
/>
```

### Render Props Pattern

```typescript
<DataLoader
  url="/api/tournaments"
  render={(tournaments, loading, error) => {
    if (loading) return <Spinner />
    if (error) return <Error message={error} />
    return <TournamentList tournaments={tournaments} />
  }}
/>
```

### Compound Components Pattern

```typescript
// Parent manages state, children access via context
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Component Checklist

When creating a new component:

- [ ] TypeScript interfaces for all props
- [ ] JSDoc comments for component and props
- [ ] Default props where appropriate
- [ ] Proper ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support
- [ ] Error boundaries for error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Unit tests
- [ ] Storybook story (if applicable)
- [ ] Documentation in this file

---

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com/
- **Radix UI Primitives**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Documentation**: https://react.dev/
- **Accessibility Guide**: https://www.w3.org/WAI/ARIA/

---

*Last Updated: 2025-01-15*
