# DJAMMS Architecture - Complete Understanding

## Executive Summary

DJAMMS is a **venue-based YouTube music player system** with three distinct interfaces:
- **Player**: Master device that plays music using dual YouTube iframes with crossfading
- **Admin**: Queue management interface for venue staff
- **Kiosk**: Guest-facing song request interface

The system uses **AppWrite** as the backend with real-time synchronization, **master election** for multi-device coordination, and **local caching** for reliability.

---

## System Architecture

### 1. Three Endpoint Model

#### **Player Endpoint** (`/player/:venueId`)
**Purpose**: The master playback device (typically a dedicated tablet/PC at the venue)

**Core Features**:
- Dual YouTube iframe system for seamless crossfading
- Master election via heartbeat mechanism
- Local queue caching in localStorage
- Real-time sync with AppWrite database
- BroadcastChannel API for cross-window coordination
- Automatic queue rotation (played tracks move to end)

**Key Components**:
- `AdvancedPlayer.tsx` - Dual iframe manager with crossfade logic
- `usePlayerManager.ts` - Master election, queue sync, track progression
- `PlayerBusyScreen.tsx` - Shown when another device is master

**Master Election Flow**:
```
1. Device requests master status via PlayerRegistry
2. If no master active → Become master, start heartbeat
3. If master active → Show "Player Busy" screen
4. Master sends heartbeat every 30s, expires after 60s
5. On expiry, other devices can become master
```

#### **Admin Endpoint** (`/admin/:venueId`)
**Purpose**: Venue staff interface for queue control

**Core Features**:
- View now playing with countdown timer
- Real-time queue display (main + priority queues)
- Skip current track
- Remove/reorder tracks in queue
- View paid requests (priority queue)
- Approve/reject song requests

**Key Components**:
- `AdminDashboard.tsx` - Main admin UI
- Real-time AppWrite subscriptions for instant updates
- Queue manipulation via database updates

**Queue Operations**:
- Skip track → Update `nowPlaying`, shift queue
- Remove track → Filter track from mainQueue/priorityQueue
- Reorder → Update position attributes

#### **Kiosk Endpoint** (`/kiosk/:venueId`)
**Purpose**: Guest-facing song request interface

**Core Features**:
- YouTube search integration
- Song request with payment (Stripe)
- View current queue position
- See now playing
- No playback controls (view-only)

**Key Components**:
- `KioskView.tsx` - Search and request UI
- YouTube Data API integration
- Stripe payment processing
- Request submission to priority queue

**Request Flow**:
```
1. Guest searches YouTube via API
2. Selects song → Stripe payment (£0.50 default)
3. On payment success → Add to priorityQueue
4. Player prioritizes priorityQueue over mainQueue
5. Kiosk shows confirmation + queue position
```

---

## Database Schema (AppWrite Collections)

### **Collection: queues**
Central state for each venue's playback queue.

```typescript
{
  venueId: string;              // Venue identifier
  nowPlaying?: {                // Current track
    videoId: string;
    title: string;
    artist: string;
    duration: number;
    startTime: number;          // Timestamp when started
    remaining: number;          // Seconds remaining
    isRequest: boolean;
  };
  mainQueue: Track[];           // Standard queue (JSON array)
  priorityQueue: Track[];       // Paid requests (JSON array)
  createdAt: string;
  updatedAt: string;
}
```

**mainQueue**: Rotates continuously (played track moves to end)
**priorityQueue**: Paid requests, played once then removed

### **Collection: player_instances**
Tracks active player devices for master election.

```typescript
{
  playerId: string;             // Unique player ID
  venueId: string;              // Venue this player belongs to
  deviceId: string;             // Browser fingerprint
  status: 'active' | 'idle' | 'offline';
  lastHeartbeat: number;        // Timestamp of last heartbeat
  expiresAt: number;            // When this master expires
  userAgent: string;
  createdAt: string;
}
```

**Master Election**:
- Only one `active` player per venue
- Master sends heartbeat every 30s
- Expires after 60s without heartbeat
- Other devices check expiry and claim master

### **Collection: djamms_users**
User accounts with role-based access.

```typescript
{
  userId: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  venueId?: string;             // Assigned venue
  autoplay: boolean;            // User preference
  createdAt: string;
}
```

### **Collection: playlists**
Track collections for venues.

```typescript
{
  playlistId: string;
  name: string;
  description?: string;
  ownerId: string;
  venueId?: string;
  tracks: Track[];              // JSON array
  createdAt: string;
}
```

**Special Playlist**: `global_default_playlist` - Auto-loaded on first login

---

## State Management Architecture

### Layer 1: AppWrite Realtime Subscriptions
**Purpose**: Database change notifications

```typescript
// Subscribe to queue updates
client.subscribe(
  `databases.${databaseId}.collections.queues.documents`,
  (response) => {
    if (response.payload.venueId === currentVenueId) {
      updateLocalState(response.payload);
    }
  }
);
```

**Events**:
- `databases.*.collections.queues.documents.*.create`
- `databases.*.collections.queues.documents.*.update`
- `databases.*.collections.queues.documents.*.delete`

**Latency**: ~200-500ms (WebSocket connection)

### Layer 2: BroadcastChannel API (Svelte Implementation)
**Purpose**: Cross-window/tab synchronization (same-origin)

```typescript
// playerSync.ts
class PlayerSyncService {
  private channel = new BroadcastChannel('djamms-player-sync');
  
  broadcastStateChange(status: string, instanceId: string) {
    this.channel.postMessage({ 
      type: 'state_change', 
      status, 
      instanceId 
    });
  }
  
  requestCurrentStatus() {
    this.channel.postMessage({ type: 'request_status' });
  }
}
```

**Use Cases**:
- Sync player state across dashboard + player windows
- Coordinate master election
- Notify of track changes instantly

**Latency**: ~10-50ms (in-memory)

### Layer 3: localStorage Caching
**Purpose**: Offline resilience, fast initial load

```typescript
// Cache queue locally
localStorage.setItem(
  `djammsQueue_${venueId}`,
  JSON.stringify(queueState)
);

// Load on startup (before server fetch)
const cachedQueue = localStorage.getItem(`djammsQueue_${venueId}`);
if (cachedQueue) {
  setPlayerState(JSON.parse(cachedQueue));
}
```

**Cache Invalidation**: Updated on every AppWrite sync

### Layer 4: Polling Fallback
**Purpose**: Ensure sync even if WebSocket fails

```typescript
// 15-second polling
setInterval(async () => {
  const queueDoc = await databases.listDocuments(
    databaseId,
    'queues',
    [Query.equal('venueId', venueId)]
  );
  updateLocalState(queueDoc.documents[0]);
}, 15000);
```

**Priority Order**:
1. localStorage (instant)
2. BroadcastChannel (10-50ms)
3. Realtime subscription (200-500ms)
4. Polling (15s intervals)

---

## Queue Management Implementation

### Queue Data Structure

```typescript
interface Queue {
  venueId: string;
  nowPlaying?: NowPlaying;
  mainQueue: (Track & { position: number })[];
  priorityQueue: (Track & { 
    position: number;
    requesterId: string;
    paidCredit: number;
  })[];
}
```

### Track Progression Logic

```typescript
// From usePlayerManager.ts
const getNextTrack = (state: PlayerState): Track | undefined => {
  // Priority queue takes precedence
  if (state.priorityQueue.length > 0) {
    return state.priorityQueue[0];
  }
  // Fall back to main queue
  if (state.mainQueue.length > 0) {
    return state.mainQueue[0];
  }
  return undefined;
};

const updateNowPlaying = async (track: Track) => {
  const isRequest = track.isRequest;
  
  // Remove from priority queue if paid request
  const updatedPriorityQueue = isRequest 
    ? queue.priorityQueue.slice(1) 
    : queue.priorityQueue;
  
  // For main queue: remove first, add to end (rotation)
  const updatedMainQueue = isRequest 
    ? queue.mainQueue 
    : queue.mainQueue.slice(1);
    
  if (!isRequest && queue.mainQueue.length > 0) {
    updatedMainQueue.push({
      ...queue.mainQueue[0],
      position: updatedMainQueue.length + 1
    });
  }
  
  await databases.updateDocument(databaseId, 'queues', queueId, {
    nowPlaying: {
      ...track,
      startTime: Date.now(),
      remaining: track.duration - 1
    },
    mainQueue: updatedMainQueue,
    priorityQueue: updatedPriorityQueue
  });
};
```

**Queue Behavior**:
- **Priority Queue**: Linear (play once, remove)
- **Main Queue**: Circular (play, move to end, repeat forever)

### Crossfade Implementation

```typescript
// From AdvancedPlayer.tsx
const startCrossfade = async (nextTrack: Track) => {
  // Load next track in secondary iframe (hidden)
  secondaryPlayer.loadVideoById(nextTrack.videoId);
  
  // 5-second fade
  const fadeDuration = 5000;
  const steps = 50;
  const stepDuration = fadeDuration / steps;
  
  for (let i = 0; i <= steps; i++) {
    const primaryVolume = 100 - (i * 2);    // 100 → 0
    const secondaryVolume = i * 2;           // 0 → 100
    
    primaryPlayer.setVolume(primaryVolume);
    secondaryPlayer.setVolume(secondaryVolume);
    
    await new Promise(resolve => setTimeout(resolve, stepDuration));
  }
  
  // Swap iframes
  setPrimaryPlayer(secondaryPlayer);
  setSecondaryPlayer(primaryPlayer);
};

// Schedule crossfade based on track duration
const scheduleCrossfade = (track: Track) => {
  const fadeStartTime = (track.duration - (track.realEndOffset || 0) - 5) * 1000;
  
  setTimeout(() => {
    const nextTrack = getNextTrack(playerState);
    window.dispatchEvent(
      new CustomEvent('startCrossfade', { detail: { nextTrack } })
    );
  }, fadeStartTime);
};
```

**Dual Iframe Strategy**:
- Primary: Visible, currently playing
- Secondary: Hidden, pre-loading next track
- On crossfade: Swap roles (secondary becomes primary)
- Ensures seamless transitions, no buffering gaps

---

## Interaction Flow Diagrams

### Player Startup Flow
```
1. Load page → Check localStorage for cached queue
2. Attempt master registration via PlayerRegistry
3a. If master → Load queue from database
3b. If not master → Show PlayerBusyScreen
4. Start real-time subscriptions (AppWrite WebSocket)
5. Start 15s polling (fallback sync)
6. Start 30s heartbeat (master only)
7. Load first track from queue
8. Begin playback (if autoplay enabled)
```

### Admin Queue Update Flow
```
1. Admin clicks "Skip Track"
2. Frontend calls updateNowPlaying(nextTrack)
3. AppWrite updateDocument() on queues collection
4. Database trigger → Realtime event broadcast
5. Player receives event via WebSocket (200ms)
6. Player updates nowPlaying immediately
7. Admin UI updates via same WebSocket event
8. localStorage cache updated on both devices
```

### Kiosk Request Flow
```
1. Guest searches YouTube API
2. Selects song → Clicks "Request (£0.50)"
3. Stripe payment modal opens
4. On success → POST to /functions/add-request
5. Function validates payment, adds to priorityQueue
6. Database update triggers Realtime event
7. Admin sees new request in priority queue
8. Player prioritizes priority queue on next track
9. Kiosk shows confirmation + queue position
```

---

## Key Implementation Patterns

### Pattern 1: Optimistic UI + Rollback
```typescript
// Update UI immediately, rollback on error
const handleSkipTrack = async () => {
  const originalQueue = queue;
  setQueue(getNextQueueState(queue));  // Optimistic update
  
  try {
    await databases.updateDocument(...);
  } catch (error) {
    setQueue(originalQueue);  // Rollback on error
    toast.error('Failed to skip track');
  }
};
```

### Pattern 2: Stale-While-Revalidate
```typescript
// Show cached data, fetch fresh in background
const loadQueue = async () => {
  const cached = localStorage.getItem(`djammsQueue_${venueId}`);
  if (cached) {
    setQueue(JSON.parse(cached));  // Show stale
  }
  
  const fresh = await databases.listDocuments(...);
  setQueue(fresh);  // Revalidate
  localStorage.setItem(`djammsQueue_${venueId}`, JSON.stringify(fresh));
};
```

### Pattern 3: Heartbeat with Expiry
```typescript
// Master player sends heartbeat every 30s
const startHeartbeat = () => {
  setInterval(async () => {
    await databases.updateDocument(databaseId, 'player_instances', playerId, {
      lastHeartbeat: Date.now(),
      expiresAt: Date.now() + 60000  // Expire in 60s
    });
  }, 30000);
};

// Other devices check for expired master
const checkMasterStatus = async () => {
  const players = await databases.listDocuments(
    databaseId,
    'player_instances',
    [Query.equal('venueId', venueId)]
  );
  
  const activeMaster = players.documents.find(
    p => p.status === 'active' && p.expiresAt > Date.now()
  );
  
  if (!activeMaster) {
    await requestMasterStatus();  // Claim master
  }
};
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI components, hooks |
| **Build** | Vite 5 | Fast dev server, optimized builds |
| **Routing** | React Router v6 (BrowserRouter) | SPA routing, magic URL compatibility |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Backend** | AppWrite Cloud (Sydney) | Auth, database, realtime, functions |
| **Database** | AppWrite Databases | NoSQL collections |
| **Realtime** | AppWrite Realtime (WebSocket) | Live updates |
| **Auth** | AppWrite Auth (Magic URLs) | Passwordless login |
| **Player** | YouTube IFrame API | Video playback |
| **Search** | YouTube Data API v3 | Song search |
| **Payments** | Stripe (planned) | Song requests |
| **State Sync** | BroadcastChannel API | Cross-tab sync |
| **Caching** | localStorage | Offline resilience |

---

## Current Implementation Status

### ✅ Fully Implemented (Standalone Apps)
- Magic URL authentication with session cleanup
- Player app with dual iframe crossfading
- Admin dashboard with real-time updates
- Kiosk search interface
- Master election via heartbeat
- Queue rotation logic
- AppWrite Realtime subscriptions
- localStorage caching
- Polling fallback sync

### 🚧 Partially Implemented (Unified App)
- `/player/:venueId` - Static mockup only
- `/admin/:venueId` - Static mockup only
- `/kiosk/:venueId` - Static mockup only

**Location**: `apps/web/src/routes/` (placeholder components)

### ⏳ Not Implemented
- Stripe payment integration (kiosk requests)
- Queue reordering (drag-and-drop in admin)
- Request approval workflow (admin review)
- Player settings UI (volume, crossfade duration)
- Venue onboarding flow
- Analytics dashboard

---

## Implementation Differences: Standalone vs Unified

### Standalone Apps (`apps/player`, `apps/admin`, `apps/kiosk`)
- Separate Vite builds
- Independent routing
- Deployed to separate subdomains
- Full feature implementations
- Used for prototyping

### Unified App (`apps/web`)
- Single Vite build
- Shared routing (BrowserRouter)
- Deployed to www.djamms.app
- Currently placeholder components
- Production target

**Migration Strategy**: Adapt standalone implementations into unified routes

---

## Next Steps Recommendation

See `DJAMMS_DEVELOPMENT_ROADMAP.md` for detailed implementation plan.
