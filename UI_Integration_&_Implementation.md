# UI Integration & Implementation Guide

**Document Created**: October 10, 2025  
**Last Updated**: October 10, 2025  
**Status**: In Development  
**Version**: 1.0

---

## 📋 Document Purpose

This document serves as the comprehensive guide for implementing fully-functional, production-ready UI components for the DJAMMS unified web application endpoints:

- `/kiosk/:venueId` - Guest-facing song request interface
- `/player/:venueId` - Master playback device interface  
- `/admin/:venueId` - Venue staff control panel
- `/dashboard/:userId` - User settings and launcher page

This guide combines insights from:
1. **prod-jukebox.obie.bar** - Currently deployed single-device web application
2. **djamms-50-pg** - New multi-device, venue-scoped architecture
3. **UI Design Mockups** - Visual design patterns and user experience

---

## 🎯 Implementation Goals

### Primary Objectives
- ✅ Replace static mockup components with fully functional implementations
- ✅ Adapt proven UI patterns from prod-jukebox.obie.bar
- ✅ Implement real AppWrite backend integration
- ✅ Support multi-device, multi-venue architecture
- ✅ Maintain responsive, touch-friendly interfaces

### Success Criteria
- All endpoints fully functional (no simulations)
- Real-time synchronization across devices
- Production-ready code quality
- Comprehensive error handling
- Accessible, intuitive user experience

---

## 📚 Source Material Analysis

### 1. prod-jukebox.obie.bar Repository

**Repository**: https://github.com/SystemVirtue/prod-jukebox.obie.bar

#### Architecture Overview
- **Type**: Single-device web application with multi-monitor support
- **Tech Stack**: React 18 + TypeScript + Vite
- **State Management**: Custom hooks (useJukeboxState, usePlayerManager, usePlaylistManager)
- **UI Framework**: Shadcn/UI components + Tailwind CSS
- **External Displays**: Laptop with 2 external displays (VGA touchscreen + HDMI matrix)

#### Key Components Identified

**1. Jukebox_Kiosk Endpoint**
- **Purpose**: Public-facing touchscreen interface
- **Location**: Connected via VGA to external touchscreen
- **Key Features**:
  - Artist & song search functionality
  - YouTube video search integration
  - Add selected videos to priority queue
  - Local credit system with coin acceptor (Serial-to-USB device)
  - Insert coins to add credits
  - Customizable background (images/video slideshow loop)
  - On-screen keyboard for touch input

**Files**:
- `src/pages/Index.tsx` - Main kiosk interface
- `src/components/SearchInterface.tsx` - Search UI with keyboard
- `src/components/IframeSearchInterface.tsx` - Alternative search (proxy-based)
- `src/components/CreditsDisplay.tsx` - Credit counter UI
- `src/components/SerialCommunication.tsx` - Coin acceptor integration
- `src/components/BackgroundManager.tsx` - Background slideshow
- `src/hooks/useVideoSearch.tsx` - Search logic
- `src/services/musicSearch.ts` - YouTube API search

**2. Video_Player Endpoint**
- **Purpose**: Full-screen YouTube iframe player
- **Location**: Connected via HDMI to matrix controller (multiple screens)
- **Key Features**:
  - YouTube iframe API integration
  - Full-screen video playback
  - External window communication via localStorage
  - Test mode (20s clips for testing)
  - Fade out/black transitions
  - Cross-window command system

**Files**:
- `public/player.html` - Standalone player window
- `src/hooks/usePlayerManager.tsx` - Player control logic
- `src/services/displayManager.ts` - Multi-monitor management

**3. Admin_Console**
- **Purpose**: Administrative control panel
- **Location**: Pop-over via settings icon on kiosk display
- **Key Features**:
  - Playlist selection and management
  - Active queue ordering
  - Video player controls (play/pause/skip)
  - API key management and rotation
  - Credit adjustment
  - System logs export
  - Background upload
  - Display configuration
  - Test mode toggle
  - Max song length settings

**Files**:
- `src/components/AdminConsole.tsx` - Main admin UI (1400+ lines)
- `src/hooks/useApiKeyRotation.tsx` - API key rotation logic
- `src/utils/apiKeyTester.ts` - API key validation
- `src/services/youtubeQuota.ts` - Quota management

#### State Management Pattern

**Central State Hook**: `useJukeboxState.tsx`
```typescript
interface JukeboxState {
  mode: "FREEPLAY" | "PAID";
  credits: number;
  priorityQueue: QueuedRequest[];
  defaultPlaylist: string;
  defaultPlaylistVideos: PlaylistItem[];
  inMemoryPlaylist: PlaylistItem[];
  currentlyPlaying: string;
  currentVideoId: string;
  playerWindow: Window | null;
  apiKey: string;
  selectedApiKeyOption: string;
  autoRotateApiKeys: boolean;
  searchMethod: "youtube_api" | "ytmusic_api" | "iframe_search";
  isPlayerRunning: boolean;
  isPlayerPaused: boolean;
  testMode: boolean;
  // ... additional state properties
}
```

**Player Manager Hook**: `usePlayerManager.tsx`
- `initializePlayer()` - Open external player window
- `playSong(videoId, title, artist)` - Send play command via localStorage
- `handlePlayerToggle()` - Play/pause/resume
- `handleSkipSong()` - Skip to next track
- `openPlayerWindow(display, fullscreen)` - Multi-monitor positioning

**Playlist Manager Hook**: `usePlaylistManager.tsx`
- `loadPlaylistVideos(playlistId)` - Load YouTube playlist
- `playNextSong()` - Advance to next track (priority queue → main queue)
- `handleVideoEnded()` - Auto-advance on completion

**Video Search Hook**: `useVideoSearch.tsx`
- `performSearch(query)` - Execute YouTube API search
- `handleVideoSelect(video)` - Add to queue (with credit check)

#### YouTube API Integration

**API Key Rotation System**:
- Multiple API keys configured (key1-key8 + custom)
- Automatic rotation when quota exceeded
- Circuit breaker pattern for failed requests
- Quota tracking and monitoring
- Emergency fallback playlist (HTML parser when all keys exhausted)

**Search Methods**:
1. `youtube_api` - YouTube Data API v3 (primary)
2. `ytmusic_api` - YouTube Music API (alternative)
3. `iframe_search` - HTML parsing via proxy (fallback)

**Files**:
- `src/services/musicSearch.ts` - Search service with official content scoring
- `src/services/youtubeQuota.ts` - Quota management
- `src/services/youtubeHtmlParser.ts` - Fallback HTML parser
- `backend/youtubePlaylistProxy.cjs` - Proxy server for scraping

#### Multi-Monitor Display System

**Display Manager**: `src/services/displayManager.ts`
- Detect available displays via Screen Enumeration API
- Position player window on specific monitor
- Generate window features for fullscreen/windowed mode
- Auto-detect external displays
- Remember display preferences

**Window Communication**:
- Parent window → Player window: Commands via `localStorage.setItem('jukeboxCommand')`
- Player window → Parent: Status updates via `localStorage.setItem('jukeboxStatus')`
- `StorageEvent` listener for cross-window communication

---

### 2. DJAMMS Architecture (Current Project)

**Key Differences from prod-jukebox**:

| Feature | prod-jukebox | DJAMMS |
|---------|-------------|--------|
| **Architecture** | Single device, single venue | Multi-device, multi-venue |
| **Backend** | Local state only | AppWrite Cloud (auth, database, realtime) |
| **Player Model** | One player per device | Master election (one active player per venue) |
| **Authentication** | None | Magic URL authentication |
| **Database** | localStorage only | AppWrite Collections (queues, player_instances, etc.) |
| **Sync** | Cross-window via localStorage | AppWrite Realtime + BroadcastChannel + localStorage |
| **Deployment** | Single domain | AppWrite Sites (www.djamms.app) |

**DJAMMS Collections** (from DATABASE_SCHEMA_COMPLETE.md):

```typescript
// queues collection
{
  venueId: string;
  nowPlaying?: {
    videoId, title, artist, duration,
    startTime, remaining, isRequest
  };
  mainQueue: Track[];      // Circular rotation
  priorityQueue: Track[];  // Linear (paid requests)
}

// player_instances collection  
{
  playerId: string;
  venueId: string;
  deviceId: string;
  status: 'active' | 'idle' | 'offline';
  lastHeartbeat: number;   // Every 30s
  expiresAt: number;        // 60s timeout
}
```

**Synchronization Layers**:
1. localStorage (0ms) - Instant load, offline resilience
2. BroadcastChannel (10-50ms) - Cross-tab sync (same origin)
3. AppWrite Realtime (200-500ms) - WebSocket, cross-device
4. Polling (15s) - Fallback when WebSocket fails

---

### 3. UI Design Mockups Analysis

**Mockup Files Available**:
- `Admin - Controls - Example.png`
- `Admin - Controls 2 - Example.png`
- `Admin - Current_Queue_View - Example.png`
- `Kiosk - Onscreen Keyboard Example.png`
- `Kiosk - Search Results Example.png`
- `Kiosk-Frontend Example.png`

**Visual Patterns Identified** (from attached screenshot):

**Kiosk Search Results Layout**:
- Dark background with semi-transparent overlay
- Grid layout for video thumbnails (2 columns)
- Each result card shows:
  - Video thumbnail image
  - VEVO logo (official content indicator)
  - Song title (clean, without brackets)
  - Artist/channel name
  - Duration timestamp
- "Back to Search" button (top-left, orange accent)
- "Now Playing" header bar (top)
- Credits display (top-right corner)
- Pagination controls (bottom: Previous | Page 1 of 6 | Next)

**Design Tokens**:
- Primary accent: Orange/amber (#FF6B00 range)
- Dark background: Near-black with blue undertones
- Cards: Dark gray with rounded corners
- Typography: Clean sans-serif, high contrast
- Touch targets: Large buttons for touchscreen use

---

## 🎨 UI Component Mapping

### Kiosk Endpoint (`/kiosk/:venueId`)

#### Components to Adapt from prod-jukebox

**1. Search Interface**
- **Source**: `src/components/SearchInterface.tsx`
- **Target**: `apps/web/src/routes/kiosk/components/SearchInterface.tsx`
- **Features to Port**:
  - On-screen keyboard (touch-friendly)
  - Search input with auto-focus
  - Search method selection (API vs iframe)
  - Loading states
  - Error handling

**2. Search Results Display**
- **Source**: `src/pages/Index.tsx` (results rendering)
- **Target**: `apps/web/src/routes/kiosk/components/SearchResults.tsx`
- **Features to Port**:
  - Grid layout (responsive 1-3 columns)
  - Video card component with thumbnail
  - Official content badges (VEVO, etc.)
  - Duration display
  - Add to queue button
  - Pagination controls

**3. Credits Display**
- **Source**: `src/components/CreditsDisplay.tsx`
- **Target**: `apps/web/src/routes/kiosk/components/CreditsDisplay.tsx`
- **Features to Port**:
  - Coin icon with animated credits
  - Mode indicator (FREEPLAY/PAID)
  - Credit counter

**4. Background Manager**
- **Source**: `src/components/BackgroundManager.tsx`
- **Target**: `apps/web/src/routes/kiosk/components/BackgroundManager.tsx`
- **Features to Port**:
  - Image slideshow
  - Video loop playback
  - Cycle through backgrounds
  - Custom upload support

**5. Confirmation Dialogs**
- **Source**: Multiple dialog components
- **Target**: `apps/web/src/routes/kiosk/components/ConfirmationDialog.tsx`
- **Features to Port**:
  - Add to queue confirmation
  - Insufficient credits warning
  - Duplicate song detection

#### New Components for DJAMMS

**1. Venue Branding Header**
- Display venue name
- Show now playing info
- Real-time queue position

**2. Payment Integration** (Stripe)
- Payment modal for song requests
- £0.50 default price
- Payment confirmation
- Request submission to priority queue

**3. Request Status Display**
- Show user's pending requests
- Queue position indicator
- Estimated wait time

---

### Player Endpoint (`/player/:venueId`)

#### Components to Adapt from prod-jukebox

**1. External Player Window**
- **Source**: `public/player.html` (standalone HTML)
- **Target**: `apps/web/src/routes/player/PlayerView.tsx` (React component)
- **Features to Port**:
  - YouTube iframe API integration
  - Full-screen mode
  - Command listener (localStorage events)
  - Status broadcaster
  - Fade out transitions

**2. Player Manager Logic**
- **Source**: `src/hooks/usePlayerManager.tsx`
- **Target**: `apps/web/src/hooks/usePlayerManager.ts` (already created in Phase 1)
- **Features to Port**:
  - Play song command
  - Player toggle (play/pause/resume)
  - Skip song
  - Video end handler
  - Test mode (20s clips)

**3. Display Manager**
- **Source**: `src/services/displayManager.ts`
- **Target**: `apps/web/src/services/DisplayManager.ts`
- **Features to Port**:
  - Screen enumeration
  - Window positioning
  - Fullscreen control
  - Display preferences

#### DJAMMS-Specific Enhancements

**1. Master Election**
- PlayerRegistry service (already specified in Phase 1)
- Heartbeat mechanism (30s updates)
- PlayerBusyScreen for non-master devices

**2. Dual YouTube Iframe**
- Primary iframe (visible, playing)
- Secondary iframe (hidden, pre-loading)
- Crossfade controller (5s transition)
- Volume control for smooth fades

**3. Real-time Sync**
- AppWrite Realtime subscription to queues
- BroadcastChannel for cross-tab sync
- localStorage cache for offline resilience

---

### Admin Endpoint (`/admin/:venueId`)

#### Components to Adapt from prod-jukebox

**1. Admin Console**
- **Source**: `src/components/AdminConsole.tsx` (1400+ lines)
- **Target**: Break into smaller components:
  - `apps/web/src/routes/admin/components/AdminPanel.tsx`
  - `apps/web/src/routes/admin/components/PlayerControls.tsx`
  - `apps/web/src/routes/admin/components/QueueManager.tsx`
  - `apps/web/src/routes/admin/components/SystemSettings.tsx`

**2. Player Controls Section**
- **Features to Port**:
  - Player status indicator (open/closed, running/paused)
  - Play/Pause/Stop buttons
  - Skip song button
  - Open player button
  - Test mode toggle
  - Display configuration

**3. Queue Management**
- **Features to Port**:
  - Now playing display with countdown
  - Priority queue view (paid requests)
  - Main queue view (default playlist)
  - Remove track button
  - Reorder tracks (drag-and-drop)
  - Shuffle playlist button

**4. Playlist Management**
- **Features to Port**:
  - Default playlist selector
  - Load playlist button
  - Playlist preview
  - Max song length slider

**5. System Logs**
- **Features to Port**:
  - Log viewer (filterable by type)
  - Export logs button
  - User requests history
  - Credit history

**6. Settings Panel**
- **Features to Port**:
  - Mode toggle (FREEPLAY/PAID)
  - Credit adjustment
  - Coin values configuration
  - Background management
  - API key management (for DJAMMS: admin only)

#### DJAMMS-Specific Features

**1. Multi-Venue Support**
- Venue selector (if admin manages multiple venues)
- Venue settings

**2. Real-time Dashboard**
- Live queue updates via AppWrite Realtime
- Active player instance display
- Device management

---

## 🔧 Implementation Strategy

### Phase 1: Foundation (Week 1)

**Goal**: Set up shared components and services

**Tasks**:
1. ✅ Extract and adapt `usePlayerManager` hook (already in roadmap)
2. ✅ Implement PlayerRegistry service (already in roadmap)
3. Create shared UI components:
   - SearchInput with keyboard
   - VideoCard component
   - QueueList component
   - ConfirmationDialog
   - LoadingIndicator
4. Set up AppWrite integration utilities:
   - Real-time subscription helpers
   - Queue operations service
   - Player instance service

**Deliverables**:
- `packages/shared/src/components/` - Shared UI components
- `packages/shared/src/services/` - Shared business logic
- `apps/web/src/hooks/usePlayerManager.ts` - Player state hook
- `apps/web/src/services/PlayerRegistry.ts` - Master election

---

### Phase 2: Kiosk Implementation (Week 2)

**Goal**: Fully functional kiosk endpoint

**Tasks**:
1. Implement search interface:
   - Port SearchInterface component
   - Add on-screen keyboard
   - YouTube API integration
   - Search results display
2. Implement request system:
   - Add to queue button
   - Credit check (if PAID mode)
   - Stripe payment integration
   - Priority queue submission
3. Implement background system:
   - Background slideshow
   - Custom upload (admin only)
4. Add confirmation dialogs:
   - Add to queue confirmation
   - Insufficient credits
   - Duplicate detection
5. Now playing display:
   - Real-time updates
   - Queue position

**Deliverables**:
- `apps/web/src/routes/kiosk/KioskView.tsx` - Main kiosk page
- `apps/web/src/routes/kiosk/components/` - Kiosk-specific components
- Fully functional search and request flow
- Stripe payment integration

---

### Phase 3: Player Implementation (Week 3)

**Goal**: Fully functional player endpoint with master election

**Tasks**:
1. ✅ Build dual YouTube player (already in roadmap Phase 1)
2. ✅ Implement crossfade system (already in roadmap Phase 1)
3. ✅ Add PlayerBusyScreen (already in roadmap Phase 1)
4. Implement queue sync:
   - Load queue from AppWrite
   - Real-time subscription
   - localStorage cache
5. Implement player controls:
   - Play/pause via commands
   - Skip track
   - Volume control
6. Add test mode:
   - 20-second clips for testing
   - Toggle via admin

**Deliverables**:
- `apps/web/src/routes/player/PlayerView.tsx` - Main player page
- `apps/web/src/routes/player/components/` - Player components
- Dual iframe with crossfading
- Master election working

---

### Phase 4: Admin Implementation (Week 4)

**Goal**: Fully functional admin endpoint

**Tasks**:
1. Implement admin panel layout:
   - Tabbed interface or accordion
   - Responsive design
2. Implement player controls:
   - Status indicators
   - Play/pause/skip buttons
   - Display configuration
3. Implement queue management:
   - Now playing with countdown
   - Priority queue list
   - Main queue list
   - Remove tracks
   - Reorder (drag-and-drop)
4. Implement playlist management:
   - Default playlist selector
   - Load playlist
   - Shuffle playlist
5. Implement system logs:
   - Log viewer
   - Export functionality
   - Filter by type
6. Implement settings:
   - Mode toggle
   - Credit adjustment
   - Max song length
   - Background management

**Deliverables**:
- `apps/web/src/routes/admin/AdminView.tsx` - Main admin page
- `apps/web/src/routes/admin/components/` - Admin components
- Fully functional queue management
- Real-time dashboard updates

---

## 📝 Detailed Component Specifications

### 1. Kiosk Search Interface

**Component**: `SearchInterface.tsx`

**Props**:
```typescript
interface SearchInterfaceProps {
  venueId: string;
  onVideoSelect: (video: SearchResult) => void;
  credits: number;
  mode: 'FREEPLAY' | 'PAID';
}
```

**State**:
```typescript
{
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  showKeyboard: boolean;
  selectedMethod: 'youtube_api' | 'iframe_search';
  error?: string;
}
```

**Key Methods**:
- `handleSearch()` - Execute search via YouTube API
- `handleKeyboardInput(key)` - Virtual keyboard input
- `handleVideoSelect(video)` - Add to queue (check credits)
- `clearSearch()` - Reset search state

**UI Elements**:
- Search input with focus indicator
- Virtual keyboard (QWERTY layout)
- Clear button
- Search button
- Loading spinner
- Error message display

**Styling Notes**:
- Large touch targets (min 44x44px)
- High contrast text
- Orange accent color for primary actions
- Dark theme with blue undertones

---

### 2. Video Search Results

**Component**: `SearchResults.tsx`

**Props**:
```typescript
interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (video: SearchResult) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

**Layout**:
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each card: Thumbnail + Title + Artist + Duration + Action button
- Pagination controls (Previous | Page X of Y | Next)

**VideoCard Sub-component**:
```typescript
interface VideoCardProps {
  video: SearchResult;
  onSelect: () => void;
}
```

**Card Elements**:
- Thumbnail image (16:9 aspect ratio)
- Official badge (VEVO, Records, etc.)
- Song title (cleaned, no brackets)
- Artist/channel name
- Duration badge
- "Add to Queue" button (or "Request (£0.50)" if PAID mode)

---

### 3. Admin Queue Manager

**Component**: `QueueManager.tsx`

**Props**:
```typescript
interface QueueManagerProps {
  venueId: string;
  queue: Queue;
  onSkip: () => void;
  onRemove: (trackIndex: number, isPriority: boolean) => void;
  onReorder: (newQueue: Track[]) => void;
}
```

**Sections**:
1. **Now Playing**:
   - Track title and artist
   - Countdown timer (MM:SS)
   - Skip button

2. **Priority Queue** (if items exist):
   - List of paid requests
   - Yellow star badge
   - Remove button per track
   - Drag handle for reordering

3. **Main Queue**:
   - List of default playlist tracks
   - Position numbers
   - Remove button per track
   - Drag handle for reordering
   - Shuffle button

**Real-time Updates**:
- Subscribe to `databases.*.collections.queues.documents`
- Update state on WebSocket events
- Optimistic UI updates (revert on error)

---

## 🎭 User Experience Flows

### Kiosk: Guest Request Flow

```
1. Guest approaches kiosk touchscreen
2. Sees now playing + background slideshow
3. Taps "Search" button
4. Virtual keyboard appears
5. Types artist/song name
6. Taps "Search"
7. Results appear in grid
8. Guest reviews options
9. Taps "Request (£0.50)" on desired song
10. If PAID mode:
    a. Stripe payment modal opens
    b. Guest enters payment details
    c. Payment processes
    d. On success: Track added to priority queue
11. Confirmation message appears
12. Shows queue position
13. Returns to main screen after 5s
```

**Error Scenarios**:
- No credits (PAID mode): "Insufficient Credits" dialog
- Duplicate song: "Already in Queue" dialog
- Payment failure: "Payment Failed" dialog with retry option
- Search error: "Search Unavailable" message

---

### Player: Master Election Flow

```
1. Device opens /player/:venueId
2. Check localStorage for cached queue
3. Display cached queue immediately (stale-while-revalidate)
4. Request master status via PlayerRegistry:
   a. Query player_instances collection
   b. Check for active master with unexpired heartbeat
5. If no active master:
   a. Create player_instance document (status='active')
   b. Set expiresAt = now + 60s
   c. Become master
   d. Start 30s heartbeat interval
   e. Load queue from AppWrite
   f. Subscribe to real-time updates
   g. Start playback
6. If master exists and not expired:
   a. Show PlayerBusyScreen
   b. Display master device ID
   c. Show last heartbeat time
   d. Provide "Retry" button
   e. Provide links to admin/kiosk
7. If master expired:
   a. Claim master status (same as step 5)
```

---

### Admin: Skip Track Flow

```
1. Admin opens /admin/:venueId
2. Admin panel loads current queue
3. Now playing section shows current track + countdown
4. Admin clicks "Skip Track"
5. If current track is user request:
   a. Confirmation dialog appears
   b. "Skip user request? This will not refund credits"
   c. Admin confirms or cancels
6. If confirmed (or regular track):
   a. Optimistic UI update (show next track)
   b. Call updateNowPlaying() with next track
   c. AppWrite database updated
   d. Real-time event broadcast
   e. Player receives event
   f. Player loads next track in secondary iframe
   g. Player starts crossfade
   h. Admin countdown resets
7. If error:
   a. Revert optimistic UI
   b. Show error toast
```

---

## 🔌 AppWrite Integration Points

### 1. Authentication

**Magic URL Flow** (already implemented):
- User enters email on landing page
- AppWrite sends magic link
- User clicks link
- Callback route validates session
- Redirect to dashboard

**Kiosk**: No authentication required (public access)
**Player**: Requires authentication to claim master
**Admin**: Requires authentication with admin role

---

### 2. Database Operations

**Queues Collection**:
```typescript
// Get queue for venue
const queue = await databases.listDocuments(
  databaseId,
  'queues',
  [Query.equal('venueId', venueId)]
);

// Update now playing
await databases.updateDocument(
  databaseId,
  'queues',
  queueId,
  {
    nowPlaying: {
      videoId, title, artist, duration,
      startTime: Date.now(),
      remaining: duration - 1
    },
    mainQueue: updatedMainQueue,
    priorityQueue: updatedPriorityQueue
  }
);

// Add track to priority queue
await databases.updateDocument(
  databaseId,
  'queues',
  queueId,
  {
    priorityQueue: [
      ...queue.priorityQueue,
      {
        videoId, title, artist, duration,
        isRequest: true,
        requesterId: paymentId,
        paidCredit: 0.50,
        position: queue.priorityQueue.length + 1
      }
    ]
  }
);
```

**Player Instances Collection**:
```typescript
// Create master player
await databases.createDocument(
  databaseId,
  'player_instances',
  'unique()',
  {
    venueId,
    deviceId: generateDeviceId(),
    status: 'active',
    lastHeartbeat: Date.now(),
    expiresAt: Date.now() + 60000,
    userAgent: navigator.userAgent
  }
);

// Update heartbeat
await databases.updateDocument(
  databaseId,
  'player_instances',
  playerId,
  {
    lastHeartbeat: Date.now(),
    expiresAt: Date.now() + 60000
  }
);
```

---

### 3. Real-time Subscriptions

**Subscribe to Queue Updates**:
```typescript
const unsubscribe = client.subscribe(
  `databases.${databaseId}.collections.queues.documents`,
  (response) => {
    if (response.payload.venueId === venueId) {
      setQueue(response.payload);
      setCurrentTrack(response.payload.nowPlaying);
      localStorage.setItem(
        `djammsQueue_${venueId}`,
        JSON.stringify(response.payload)
      );
    }
  }
);
```

**Events to Handle**:
- `databases.*.collections.queues.documents.*.create` - New queue created
- `databases.*.collections.queues.documents.*.update` - Queue updated (track added/removed/reordered)
- `databases.*.collections.queues.documents.*.delete` - Queue deleted

---

## 🧩 Code Reuse Strategy

### From prod-jukebox to DJAMMS

**Direct Ports** (minimal changes):
1. Virtual keyboard component
2. Video card UI
3. Background manager
4. Credits display
5. Dialog components

**Adapt with Modifications**:
1. Player manager (add master election)
2. Search interface (add venue context)
3. Admin console (split into smaller components)
4. Display manager (keep multi-monitor support)

**Build New**:
1. AppWrite integration layer
2. Real-time sync hooks
3. Master election service
4. Stripe payment integration
5. Multi-venue support

---

## 📦 Shared Package Structure

### packages/shared/src/

**components/**:
- `SearchInput.tsx` - Search field with keyboard
- `VideoCard.tsx` - Video result card
- `QueueList.tsx` - Queue display
- `ConfirmationDialog.tsx` - Generic confirmation
- `LoadingSpinner.tsx` - Loading indicator
- `ErrorBoundary.tsx` - Error handling

**services/**:
- `QueueService.ts` - Queue CRUD operations
- `PlayerInstanceService.ts` - Player instance management
- `YouTubeService.ts` - YouTube API integration
- `StripeService.ts` - Payment processing

**hooks/**:
- `useQueue.ts` - Queue state management
- `useRealtime.ts` - AppWrite Realtime helper
- `useLocalStorage.ts` - Persistent state

**utils/**:
- `formatDuration.ts` - Format seconds to MM:SS
- `cleanTitle.ts` - Remove brackets from titles
- `generateDeviceId.ts` - Unique device identifier

---

## 🎨 Design System

### Color Palette

**Primary**:
- Orange: `#FF6B00` (buttons, accents)
- Amber: `#FFA500` (highlights)

**Neutrals**:
- Background: `#0A0E1A` (near-black, blue undertone)
- Card: `#1A1F2E` (dark gray)
- Border: `#2A3142` (lighter gray)
- Text Primary: `#FFFFFF`
- Text Secondary: `#A0AEC0`

**Status Colors**:
- Success: `#10B981` (green)
- Error: `#EF4444` (red)
- Warning: `#F59E0B` (amber)
- Info: `#3B82F6` (blue)

### Typography

**Font Family**: System font stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Font Sizes**:
- Heading 1: 2.5rem (40px)
- Heading 2: 2rem (32px)
- Heading 3: 1.5rem (24px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)
- Tiny: 0.75rem (12px)

### Spacing Scale

- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Border Radius

- sm: 0.25rem (4px)
- md: 0.5rem (8px)
- lg: 1rem (16px)
- full: 9999px (fully rounded)

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

**Priority Components**:
- usePlayerManager hook
- QueueService methods
- Track progression logic
- Master election logic
- YouTube API integration

**Example Test**:
```typescript
describe('usePlayerManager', () => {
  it('should claim master when no active master', async () => {
    const { result } = renderHook(() => usePlayerManager('venue1'));
    await waitFor(() => {
      expect(result.current.isMaster).toBe(true);
    });
  });
});
```

### Integration Tests (Playwright)

**User Flows to Test**:
1. Kiosk search and request
2. Player master election
3. Admin skip track
4. Real-time queue sync
5. Payment flow

**Example Test**:
```typescript
test('kiosk search and request', async ({ page }) => {
  await page.goto('/kiosk/test-venue');
  await page.fill('[data-testid="search-input"]', 'Test Song');
  await page.click('[data-testid="search-button"]');
  await page.waitForSelector('[data-testid="search-results"]');
  await page.click('[data-testid="request-button"]');
  await expect(page.locator('[data-testid="confirmation"]')).toBeVisible();
});
```

---

## 📚 Additional Resources

### Documentation References

- [DJAMMS_ARCHITECTURE_COMPLETE.md](./DJAMMS_ARCHITECTURE_COMPLETE.md) - Full architecture
- [DJAMMS_DEVELOPMENT_ROADMAP.md](./DJAMMS_DEVELOPMENT_ROADMAP.md) - Implementation phases
- [DJAMMS_ARCHITECTURE_DIAGRAM.md](./DJAMMS_ARCHITECTURE_DIAGRAM.md) - Visual diagrams
- [DATABASE_SCHEMA_COMPLETE.md](./DATABASE_SCHEMA_COMPLETE.md) - Database structure

### External Resources

- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [AppWrite Docs](https://appwrite.io/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Shadcn/UI](https://ui.shadcn.com/)

---

## 🖼️ UI Mockup Implementation Details

### Kiosk Search Results Screen (from mockup)

**Reference**: `Kiosk - Search Results Example.png`

**Layout Analysis**:
```
┌─────────────────────────────────────────────────────────────┐
│  [<- Back to Search]              CREDITS: 0 🪙            │
├─────────────────────────────────────────────────────────────┤
│  Now Playing: The XX Intro long version                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │ [Thumbnail]          │  │ [Thumbnail]          │       │
│  │ 🎵 VEVO              │  │ 🎵 VEVO              │       │
│  │ Foo Fighters -       │  │ Foo Fighters -       │       │
│  │ Times Like These     │  │ Everlong             │       │
│  │ foofightersVEVO      │  │ foofightersVEVO      │       │
│  │ 3:52                 │  │ 4:52                 │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │ [Thumbnail]          │  │ [Thumbnail]          │       │
│  │ 🎵 VEVO              │  │ 🎵 VEVO              │       │
│  │ Foo Fighters -       │  │ Foo Fighters -       │       │
│  │ The Pretender        │  │ Best Of You          │       │
│  │ foofightersVEVO      │  │ foofightersVEVO      │       │
│  │ 4:31                 │  │ 4:16                 │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                             │
│        [Previous]  Page 1 of 6  [Next]                     │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Specifications**:

**1. Header Bar**:
```tsx
<div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
  <div className="flex items-center justify-between p-4">
    {/* Back Button */}
    <Button 
      onClick={handleBackToSearch}
      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
    >
      <ChevronLeft className="w-5 h-5" />
      Back to Search
    </Button>
    
    {/* Credits Display */}
    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
      <span className="text-sm text-gray-400">CREDITS</span>
      <Coins className="w-5 h-5 text-yellow-500" />
      <span className="text-xl font-bold text-white">{credits}</span>
    </div>
  </div>
  
  {/* Now Playing Banner */}
  <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 px-4 py-3">
    <div className="flex items-center gap-3">
      <Music className="w-5 h-5 text-blue-400" />
      <span className="text-sm text-gray-300">Now Playing:</span>
      <span className="text-base font-medium text-white">
        {nowPlaying?.title || 'No track playing'}
      </span>
    </div>
  </div>
</div>
```

**2. Search Results Grid**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {searchResults.map((video) => (
    <VideoCard
      key={video.id}
      video={video}
      onSelect={() => handleVideoSelect(video)}
      mode={mode}
      credits={credits}
    />
  ))}
</div>
```

**3. Video Card Component**:
```tsx
interface VideoCardProps {
  video: SearchResult;
  onSelect: () => void;
  mode: 'FREEPLAY' | 'PAID';
  credits: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onSelect, mode, credits }) => {
  const canAdd = mode === 'FREEPLAY' || credits >= 1;
  
  return (
    <div className="group bg-slate-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Official Badge */}
        {video.officialScore && video.officialScore > 3 && (
          <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded flex items-center gap-1">
            <Music className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white">VEVO</span>
          </div>
        )}
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded">
          <span className="text-xs font-medium text-white">{video.duration}</span>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-white text-sm line-clamp-2 min-h-[2.5rem]">
          {cleanTitle(video.title)}
        </h3>
        
        {/* Channel */}
        <p className="text-xs text-gray-400 truncate">
          {video.channelTitle}
        </p>
        
        {/* Action Button */}
        <Button
          onClick={onSelect}
          disabled={!canAdd}
          className={`w-full ${
            canAdd 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {mode === 'PAID' ? 'Request (1 Credit)' : 'Add to Queue'}
        </Button>
      </div>
    </div>
  );
};
```

**4. Pagination Controls**:
```tsx
<div className="flex items-center justify-center gap-4 py-6">
  <Button
    onClick={() => handlePageChange(page - 1)}
    disabled={page === 1}
    variant="outline"
    className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
  >
    Previous
  </Button>
  
  <span className="text-white font-medium">
    Page {page} of {totalPages}
  </span>
  
  <Button
    onClick={() => handlePageChange(page + 1)}
    disabled={page === totalPages}
    className="bg-orange-600 hover:bg-orange-700"
  >
    Next
  </Button>
</div>
```

---

### Kiosk On-Screen Keyboard (from mockup)

**Reference**: `Kiosk - Onscreen Keyboard Example.png`

**Layout**: QWERTY layout with special keys

```tsx
const KeyboardLayout = {
  rows: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ],
  specialKeys: {
    backspace: '⌫',
    space: 'SPACE',
    clear: 'CLEAR'
  }
};

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSpace: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress, onBackspace, onClear, onSpace
}) => {
  return (
    <div className="bg-slate-900 p-4 rounded-lg">
      {/* Number Row */}
      <div className="flex gap-2 mb-2">
        {KeyboardLayout.rows[0].map(key => (
          <KeyButton key={key} onPress={() => onKeyPress(key)}>
            {key}
          </KeyButton>
        ))}
        <KeyButton 
          onPress={onBackspace}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {KeyboardLayout.specialKeys.backspace}
        </KeyButton>
      </div>
      
      {/* Letter Rows */}
      {KeyboardLayout.rows.slice(1).map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 mb-2 justify-center">
          {row.map(key => (
            <KeyButton key={key} onPress={() => onKeyPress(key)}>
              {key}
            </KeyButton>
          ))}
        </div>
      ))}
      
      {/* Bottom Row */}
      <div className="flex gap-2 mt-2">
        <KeyButton 
          onPress={onClear}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {KeyboardLayout.specialKeys.clear}
        </KeyButton>
        <KeyButton 
          onPress={onSpace}
          className="flex-[3] bg-slate-700 hover:bg-slate-600"
        >
          {KeyboardLayout.specialKeys.space}
        </KeyButton>
      </div>
    </div>
  );
};

const KeyButton: React.FC<{ 
  children: React.ReactNode; 
  onPress: () => void;
  className?: string;
}> = ({ children, onPress, className = '' }) => {
  return (
    <button
      onClick={onPress}
      className={`
        min-w-[3rem] h-12 
        bg-slate-700 hover:bg-slate-600 
        text-white font-semibold text-lg
        rounded-lg transition-colors
        active:scale-95 active:bg-orange-600
        touch-manipulation
        ${className}
      `}
    >
      {children}
    </button>
  );
};
```

**Touch Optimization**:
- Minimum button size: 48x48px (Apple HIG recommendation)
- Active feedback: Scale down on press + color change
- `touch-manipulation` CSS for better touch response
- Haptic feedback (if supported): `navigator.vibrate(50)`

---

### Admin Controls Panel (from mockups)

**Reference**: `Admin - Controls - Example.png` & `Admin - Controls 2 - Example.png`

**Player Controls Section**:
```tsx
const PlayerControlsPanel: React.FC<{
  isPlayerRunning: boolean;
  isPlayerPaused: boolean;
  playerWindow: Window | null;
  onToggle: () => void;
  onSkip: () => void;
  onOpenPlayer: () => void;
}> = ({ isPlayerRunning, isPlayerPaused, playerWindow, onToggle, onSkip, onOpenPlayer }) => {
  const playerStatus = playerWindow && !playerWindow.closed ? 'Open' : 'Closed';
  const playbackStatus = isPlayerRunning ? (isPlayerPaused ? 'Paused' : 'Playing') : 'Stopped';
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Player Controls</h3>
      
      {/* Status Indicator */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className={`w-3 h-3 rounded-full ${
          playerWindow && !playerWindow.closed ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            Player Window: {playerStatus}
          </div>
          <div className="text-xs text-gray-600">
            Status: {playbackStatus}
          </div>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={onToggle}
          className={`flex flex-col items-center gap-2 h-20 ${
            isPlayerRunning 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isPlayerRunning ? (
            <>
              <Pause className="w-6 h-6" />
              <span className="text-sm">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              <span className="text-sm">Play</span>
            </>
          )}
        </Button>
        
        <Button
          onClick={onSkip}
          disabled={!isPlayerRunning}
          className="flex flex-col items-center gap-2 h-20 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <SkipForward className="w-6 h-6" />
          <span className="text-sm">Skip</span>
        </Button>
        
        <Button
          onClick={onOpenPlayer}
          className="flex flex-col items-center gap-2 h-20 bg-purple-600 hover:bg-purple-700"
        >
          <Settings2 className="w-6 h-6" />
          <span className="text-sm">Open</span>
        </Button>
      </div>
    </div>
  );
};
```

---

### Admin Queue View (from mockup)

**Reference**: `Admin - Current_Queue_View - Example.png`

**Now Playing + Queue List**:
```tsx
const QueueViewPanel: React.FC<{
  nowPlaying: NowPlaying | null;
  countdown: number;
  priorityQueue: Track[];
  mainQueue: Track[];
  onSkip: () => void;
  onRemove: (trackIndex: number, isPriority: boolean) => void;
}> = ({ nowPlaying, countdown, priorityQueue, mainQueue, onSkip, onRemove }) => {
  return (
    <div className="space-y-6">
      {/* Now Playing Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-sm font-medium opacity-80 mb-2">NOW PLAYING</h3>
        {nowPlaying ? (
          <>
            <h2 className="text-2xl font-bold mb-2">{nowPlaying.title}</h2>
            <p className="text-lg opacity-90 mb-4">{nowPlaying.artist}</p>
            
            <div className="flex items-center justify-between">
              {/* Countdown Timer */}
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8" />
                <div>
                  <div className="text-3xl font-mono font-bold">
                    {formatTime(countdown)}
                  </div>
                  <div className="text-sm opacity-80">Remaining</div>
                </div>
              </div>
              
              {/* Skip Button */}
              <Button
                onClick={onSkip}
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Skip Track
              </Button>
            </div>
          </>
        ) : (
          <p className="text-lg opacity-80">No track playing</p>
        )}
      </div>
      
      {/* Priority Queue */}
      {priorityQueue.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">
              Priority Queue ({priorityQueue.length})
            </h3>
          </div>
          
          <div className="space-y-2">
            {priorityQueue.map((track, index) => (
              <TrackItem
                key={`priority-${index}`}
                track={track}
                index={index + 1}
                isPriority={true}
                onRemove={() => onRemove(index, true)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Main Queue */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Main Queue ({mainQueue.length})
        </h3>
        
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {mainQueue.map((track, index) => (
              <TrackItem
                key={`main-${index}`}
                track={track}
                index={index + 1}
                isPriority={false}
                onRemove={() => onRemove(index, false)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const TrackItem: React.FC<{
  track: Track;
  index: number;
  isPriority: boolean;
  onRemove: () => void;
}> = ({ track, index, isPriority, onRemove }) => {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg
      ${isPriority ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50 hover:bg-gray-100'}
    `}>
      {/* Position */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
        ${isPriority ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-300 text-gray-700'}
      `}>
        {index}
      </div>
      
      {/* Priority Badge */}
      {isPriority && (
        <Star className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      )}
      
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {track.title}
        </div>
        <div className="text-sm text-gray-600 truncate">
          {track.artist}
        </div>
      </div>
      
      {/* Duration */}
      <div className="text-sm text-gray-500 flex-shrink-0">
        {formatDuration(track.duration)}
      </div>
      
      {/* Remove Button */}
      <Button
        onClick={onRemove}
        variant="ghost"
        size="sm"
        className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
};

// Utility Functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

---

## 🎨 Responsive Design Breakpoints

### Mobile-First Approach

**Breakpoints** (Tailwind CSS):
```typescript
const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large desktops
};
```

**Kiosk Layout Adjustments**:
```css
/* Mobile: 1 column */
.search-results {
  @apply grid grid-cols-1 gap-4;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .search-results {
    @apply grid-cols-2 gap-6;
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .search-results {
    @apply grid-cols-3 gap-6;
  }
}

/* Large touchscreen kiosk: 4 columns */
@media (min-width: 1536px) {
  .search-results {
    @apply grid-cols-4 gap-8;
  }
}
```

**Admin Layout Adjustments**:
```css
/* Mobile: Stack vertically */
.admin-layout {
  @apply flex flex-col gap-4;
}

/* Tablet+: Two-column layout */
@media (min-width: 768px) {
  .admin-layout {
    @apply grid grid-cols-2 gap-6;
  }
}

/* Desktop: Three-column layout */
@media (min-width: 1024px) {
  .admin-layout {
    @apply grid grid-cols-3 gap-6;
  }
}
```

---

## 🔌 Hardware Integration Notes

### Coin Acceptor (prod-jukebox feature)

**Note**: DJAMMS uses Stripe payments instead of hardware coin acceptor, but the credit system concept remains.

**prod-jukebox Implementation** (for reference):
```typescript
// src/components/SerialCommunication.tsx
const useSerialCommunication = (
  onCreditAdded: (amount: number) => void
) => {
  const connectToSerial = async () => {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    
    const reader = port.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      // Parse coin signal
      const coinValue = parseCoinSignal(value);
      if (coinValue) {
        onCreditAdded(coinValue);
      }
    }
  };
  
  return { connectToSerial };
};
```

**DJAMMS Alternative** (Stripe integration):
```typescript
// apps/web/src/services/StripeService.ts
export const createPaymentIntent = async (amount: number) => {
  const response = await fetch('/functions/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amount * 100 }) // Convert to cents
  });
  
  return response.json();
};

// Kiosk component usage
const handleRequestSong = async (video: SearchResult) => {
  const { clientSecret } = await createPaymentIntent(0.50);
  
  const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
  const { error } = await stripe.confirmCardPayment(clientSecret);
  
  if (!error) {
    await addToPriorityQueue(venueId, video);
    showConfirmation();
  }
};
```

---

## 📱 Touch-Optimized Interactions

### Gesture Support

**Swipe Navigation** (for kiosk):
```typescript
const useSwipeGesture = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void
) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  };
  
  return { onTouchStart, onTouchMove, onTouchEnd };
};

// Usage in search results
const SearchResults: React.FC = () => {
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture(
    () => handlePageChange(page + 1), // Swipe left -> next page
    () => handlePageChange(page - 1)  // Swipe right -> previous page
  );
  
  return (
    <div 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="search-results"
    >
      {/* Results */}
    </div>
  );
};
```

**Long-Press Actions** (for admin):
```typescript
const useLongPress = (
  onLongPress: () => void,
  delay = 500
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  
  const start = useCallback(() => {
    timeout.current = setTimeout(() => {
      onLongPress();
      setLongPressTriggered(true);
    }, delay);
  }, [onLongPress, delay]);
  
  const clear = useCallback(() => {
    timeout.current && clearTimeout(timeout.current);
    setLongPressTriggered(false);
  }, []);
  
  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear
  };
};

// Usage for track removal
const TrackItem: React.FC = ({ track, onRemove }) => {
  const longPressProps = useLongPress(() => {
    if (confirm('Remove this track?')) {
      onRemove();
    }
  });
  
  return (
    <div {...longPressProps} className="track-item">
      {/* Track content */}
    </div>
  );
};
```

---

## 🎭 Animation & Transitions

### Loading States

**Skeleton Loaders**:
```tsx
const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-10 bg-slate-700 rounded mt-2" />
      </div>
    </div>
  );
};

const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {[...Array(8)].map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
};
```

**Transition Groups** (for queue updates):
```tsx
import { Transition } from '@headlessui/react';

const QueueList: React.FC<{ tracks: Track[] }> = ({ tracks }) => {
  return (
    <div className="space-y-2">
      {tracks.map((track, index) => (
        <Transition
          key={track.id}
          show={true}
          appear={true}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 translate-x-full"
          enterTo="opacity-100 translate-x-0"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100 translate-x-0"
          leaveTo="opacity-0 -translate-x-full"
        >
          <TrackItem track={track} index={index} />
        </Transition>
      ))}
    </div>
  );
};
```

**Countdown Animation** (admin now playing):
```tsx
const CountdownTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
  const [displayTime, setDisplayTime] = useState(seconds);
  
  useEffect(() => {
    setDisplayTime(seconds);
    
    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [seconds]);
  
  const isLowTime = displayTime < 30;
  
  return (
    <div className={`
      text-3xl font-mono font-bold transition-colors
      ${isLowTime ? 'text-red-400 animate-pulse' : 'text-white'}
    `}>
      {formatTime(displayTime)}
    </div>
  );
};
```

---

## 🧪 Accessibility (A11y) Considerations

### Keyboard Navigation

**Focus Management**:
```tsx
const SearchInterface: React.FC = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Auto-focus search input on mount
    searchInputRef.current?.focus();
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape key to clear search
    if (e.key === 'Escape') {
      handleClearSearch();
    }
    // Enter key to submit
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <input
      ref={searchInputRef}
      onKeyDown={handleKeyDown}
      aria-label="Search for songs"
      placeholder="Search for artist or song..."
    />
  );
};
```

**ARIA Labels**:
```tsx
<Button
  onClick={onSkip}
  aria-label="Skip current track"
  aria-describedby="skip-description"
>
  <SkipForward className="w-5 h-5" />
</Button>
<span id="skip-description" className="sr-only">
  Skip the currently playing track and move to the next in queue
</span>
```

**Screen Reader Announcements**:
```tsx
const [announcement, setAnnouncement] = useState('');

const handleTrackAdded = (track: Track) => {
  addToQueue(track);
  setAnnouncement(`${track.title} added to queue`);
  
  // Clear after announcement
  setTimeout(() => setAnnouncement(''), 3000);
};

return (
  <>
    {/* Live region for screen readers */}
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
    
    {/* Main content */}
  </>
);
```

---

## 📝 Changelog

### Version 1.1 - October 10, 2025
- Added UI mockup implementation details
- Added responsive design breakpoints
- Added touch-optimized interactions
- Added animation & transition patterns
- Added accessibility considerations
- Added hardware integration notes
- Added detailed code examples for all UI components

### Version 1.0 - October 10, 2025
- Initial document creation
- Added prod-jukebox analysis
- Added DJAMMS architecture comparison
- Added component mapping
- Added implementation strategy
- Added detailed specifications

---

## 🚀 Next Steps

1. **Review this document** - Confirm approach and priorities
2. **Set up environment variables** - YouTube API, Stripe keys
3. **Create feature branch** - `feature/kiosk-implementation`
4. **Begin Phase 2** - Kiosk endpoint implementation
5. **Iterate and refine** - Continuous improvement based on testing

---

**Document Status**: Ready for Review  
**Next Update**: After Phase 2 completion
