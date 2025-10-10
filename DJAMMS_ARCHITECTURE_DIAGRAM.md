# DJAMMS Quick Reference - Architecture Diagram

## System Overview
```
┌─────────────────────────────────────────────────────────────────────┐
│                         www.djamms.app                              │
│                    (React + Vite + TypeScript)                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   /player/   │  │   /admin/    │  │   /kiosk/    │
        │   :venueId   │  │   :venueId   │  │   :venueId   │
        └──────────────┘  └──────────────┘  └──────────────┘
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   AppWrite Cloud API    │
                    │  (Sydney Data Center)   │
                    └─────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │    queues    │  │player_instan-│  │ djamms_users │
        │  collection  │  │ces collection│  │  collection  │
        └──────────────┘  └──────────────┘  └──────────────┘
```

## Player Endpoint Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                     Player Startup Sequence                         │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Load page → Check localStorage for cached queue                 │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Request master status via PlayerRegistry                         │
│    → Query player_instances collection                              │
│    → Check for active master with unexpired heartbeat               │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
┌─────────┐    ┌─────────────┐    ┌─────────────────┐
│ Master  │    │ Not Master  │    │ Master Expired  │
│ Active  │    │ (Conflict)  │    │ (Claim Master)  │
└─────────┘    └─────────────┘    └─────────────────┘
    │                  │                  │
    │                  │                  ▼
    │                  │          ┌────────────────┐
    │                  │          │ Create player_ │
    │                  │          │ instance with  │
    │                  │          │ status='active'│
    │                  │          └────────────────┘
    │                  │                  │
    │                  ▼                  │
    │          ┌──────────────────┐      │
    │          │ Show Player      │      │
    │          │ Busy Screen      │      │
    │          └──────────────────┘      │
    │                                    │
    └────────────────┬───────────────────┘
                     ▼
        ┌──────────────────────────┐
        │ Load queue from database │
        └──────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Start Realtime WebSocket │
        │ Subscribe to queue docs  │
        └──────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Start 15s polling        │
        │ (fallback sync)          │
        └──────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Start 30s heartbeat      │
        │ Update lastHeartbeat     │
        └──────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Load first track         │
        │ Begin playback           │
        └──────────────────────────┘
```

## Dual YouTube Iframe Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Player Container                            │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├────────────────────────────────┬────────────────────────────────┐
    ▼                                ▼                                ▼
┌─────────────┐              ┌─────────────┐              ┌─────────────┐
│ Primary     │              │ Secondary   │              │ Crossfade   │
│ YouTube     │ ◄────────────│ YouTube     │◄─────────────│ Controller  │
│ Iframe      │              │ Iframe      │              │             │
├─────────────┤              ├─────────────┤              ├─────────────┤
│ Visible     │              │ Hidden      │              │ Schedules   │
│ Volume: 100 │              │ Volume: 0   │              │ fade 5s     │
│ Currently   │              │ Pre-loading │              │ before end  │
│ playing     │              │ next track  │              │             │
└─────────────┘              └─────────────┘              └─────────────┘
       │                            │
       │ On crossfade start:        │
       │ Volume: 100 → 0            │ Volume: 0 → 100
       │                            │
       └────────────────┬───────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │ After 5s fade:         │
            │ Swap primary/secondary │
            │ Secondary becomes new  │
            │ primary (visible)      │
            └────────────────────────┘
```

## Queue Management Data Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Queue Structure                             │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─────────────────────────────┬─────────────────────────────┐
    ▼                             ▼                             ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ nowPlaying  │          │ priorityQ   │          │ mainQueue   │
├─────────────┤          ├─────────────┤          ├─────────────┤
│ Currently   │          │ Paid        │          │ Standard    │
│ active      │          │ requests    │          │ rotation    │
│ track with  │          │ (play once, │          │ (play,      │
│ countdown   │          │  remove)    │          │  move to    │
│             │          │             │          │  end)       │
└─────────────┘          └─────────────┘          └─────────────┘
       │                        │                        │
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Track Progression Logic                        │
│                                                                     │
│  getNextTrack():                                                    │
│    1. Check priorityQueue.length > 0 → return priorityQueue[0]     │
│    2. Else check mainQueue.length > 0 → return mainQueue[0]        │
│    3. Else return undefined                                         │
│                                                                     │
│  updateNowPlaying(track):                                           │
│    1. Set nowPlaying = track with startTime, remaining              │
│    2. If track.isRequest:                                           │
│         → Remove from priorityQueue (shift)                         │
│         → Keep mainQueue unchanged                                  │
│    3. Else (mainQueue track):                                       │
│         → Remove from mainQueue (shift)                             │
│         → Add removed track to end of mainQueue (push)              │
│         → Keep priorityQueue unchanged                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Synchronization Layers
```
┌─────────────────────────────────────────────────────────────────────┐
│                    Synchronization Stack                            │
│                    (Fastest → Slowest)                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├──────────────────────────────────────────────────────────────┐
    │                                                              │
    ▼                                                              │
┌─────────────────────────────────────────────────────────────────┐│
│ Layer 1: localStorage Cache                                     ││
│ ────────────────────────────────────────────────────────────    ││
│ • Instant load on page refresh                                  ││
│ • Offline resilience                                            ││
│ • Key: djammsQueue_{venueId}                                    ││
│ • Updated on every sync                                         ││
│ • Latency: 0ms (synchronous read)                               ││
└─────────────────────────────────────────────────────────────────┘│
    │                                                              │
    ▼                                                              │
┌─────────────────────────────────────────────────────────────────┐│
│ Layer 2: BroadcastChannel (Optional)                            ││
│ ────────────────────────────────────────────────────────────    ││
│ • Cross-tab/window sync (same origin)                           ││
│ • In-memory message passing                                     ││
│ • Channel: djamms-player-sync                                   ││
│ • Events: state_change, track_change, request_status            ││
│ • Latency: ~10-50ms                                             ││
└─────────────────────────────────────────────────────────────────┘│
    │                                                              │
    ▼                                                              │
┌─────────────────────────────────────────────────────────────────┐│
│ Layer 3: AppWrite Realtime (WebSocket)                          ││
│ ────────────────────────────────────────────────────────────    ││
│ • Live database change notifications                            ││
│ • Subscribe to collections.queues.documents                     ││
│ • Events: create, update, delete                                ││
│ • Latency: ~200-500ms                                           ││
└─────────────────────────────────────────────────────────────────┘│
    │                                                              │
    ▼                                                              │
┌─────────────────────────────────────────────────────────────────┐│
│ Layer 4: Polling Fallback                                       ││
│ ────────────────────────────────────────────────────────────    ││
│ • 15-second interval                                            ││
│ • Ensures sync even if WebSocket fails                          ││
│ • Query: databases.listDocuments()                              ││
│ • Latency: up to 15s                                            ││
└─────────────────────────────────────────────────────────────────┘│
                                                                   │
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
│
▼
Sync Priority: localStorage → BroadcastChannel → Realtime → Polling
```

## Admin-Player-Kiosk Interaction
```
┌─────────────────────────────────────────────────────────────────────┐
│                     Example: Skip Track Flow                        │
└─────────────────────────────────────────────────────────────────────┘

  Admin Dashboard           AppWrite Database          Player Device
  ───────────────           ─────────────────          ─────────────
        │                          │                         │
        │  1. Click "Skip"         │                         │
        ├──────────────────────────►                         │
        │  updateDocument(queues,  │                         │
        │    nowPlaying: nextTrack)│                         │
        │                          │                         │
        │  2. Database updated     │                         │
        │      ◄───────────────────┤                         │
        │                          │                         │
        │  3. Realtime event       │  3. Realtime event      │
        │      ◄───────────────────┼──────────────────────────►
        │      (WebSocket)         │      (WebSocket)        │
        │                          │                         │
        │  4. UI updates           │                         │  4. Load new track
        │     (optimistic)         │                         │     in secondary iframe
        │                          │                         │
        │  5. Countdown resets     │                         │  5. Start crossfade
        │                          │                         │
        │                          │                         │  6. Update nowPlaying
        │                          │      ◄───────────────────┤
        │                          │                         │
        │  6. Sync confirmation    │                         │
        │      ◄───────────────────┤                         │
        │                          │                         │
        
        Total time: ~200-500ms (WebSocket) or instant (BroadcastChannel)
```

## Kiosk Request Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                  Guest Request Track Flow                           │
└─────────────────────────────────────────────────────────────────────┘

    Kiosk               Stripe API          AppWrite Function       Database
  ─────────             ──────────          ─────────────────       ────────
      │                      │                      │                   │
      │ 1. Search YouTube    │                      │                   │
      │    (YouTube API)     │                      │                   │
      │                      │                      │                   │
      │ 2. Click "Request"   │                      │                   │
      ├──────────────────────►                      │                   │
      │    Stripe modal      │                      │                   │
      │                      │                      │                   │
      │ 3. Enter card        │                      │                   │
      │    Pay £0.50         │                      │                   │
      ├──────────────────────►                      │                   │
      │                      │                      │                   │
      │ 4. Payment success   │                      │                   │
      │      ◄───────────────┤                      │                   │
      │      paymentId: abc  │                      │                   │
      │                      │                      │                   │
      │ 5. Call function     │                      │                   │
      ├─────────────────────────────────────────────►                   │
      │    add-request       │                      │                   │
      │    (venueId, track,  │                      │                   │
      │     paymentId)       │                      │                   │
      │                      │                      │                   │
      │                      │ 6. Verify payment    │                   │
      │                      │      ◄───────────────┤                   │
      │                      │                      │                   │
      │                      │                      │ 7. Add to         │
      │                      │                      │    priorityQueue  │
      │                      │                      ├───────────────────►
      │                      │                      │                   │
      │ 8. Success response  │                      │                   │
      │      ◄──────────────────────────────────────┤                   │
      │      queuePosition:3 │                      │                   │
      │                      │                      │                   │
      │ 9. Show confirmation │                      │                   │
      │    "Track added!"    │                      │                   │
      │    "Position: 3"     │                      │                   │
      │                      │                      │                   │
      
      Admin and Player receive Realtime event and update UI
```

## Master Election Heartbeat
```
┌─────────────────────────────────────────────────────────────────────┐
│                    Heartbeat Mechanism                              │
└─────────────────────────────────────────────────────────────────────┘

    Time: 0s         Time: 30s        Time: 60s        Time: 90s
    ────────         ─────────        ─────────        ─────────
        │                │                │                │
        ▼                ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Device A      │ │ Device A      │ │ Device A      │ │ Device A      │
│ Becomes Master│ │ Heartbeat #1  │ │ Disconnected  │ │ [offline]     │
│ Create player_│ │ Update:       │ │ (no heartbeat)│ │               │
│ instance      │ │  lastHeartbeat│ │               │ │               │
│  status=active│ │  expiresAt=   │ │ expiresAt     │ │               │
│  expiresAt=   │ │    60s + now  │ │   expired!    │ │               │
│    60s + now  │ │               │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
        │                                                    │
        │                                                    ▼
        │                                            ┌───────────────┐
        │                                            │ Device B      │
        │                                            │ Checks master │
        │                                            │ status, finds │
        │                                            │ expired entry │
        │                                            │ Claims master!│
        │                                            └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Heartbeat SQL (Conceptual):                                        │
│                                                                     │
│ UPDATE player_instances                                             │
│ SET lastHeartbeat = NOW(),                                          │
│     expiresAt = NOW() + INTERVAL 60 SECONDS                         │
│ WHERE playerId = ? AND venueId = ?                                  │
│                                                                     │
│ Check for expired master:                                           │
│ SELECT * FROM player_instances                                      │
│ WHERE venueId = ? AND status = 'active' AND expiresAt > NOW()      │
│                                                                     │
│ If no results → Master expired → Claim master                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack Quick Reference
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Stack                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├───► React 18 (UI library)
    ├───► TypeScript (type safety)
    ├───► Vite 5 (build tool, dev server)
    ├───► React Router v6 (routing, BrowserRouter)
    ├───► Tailwind CSS (styling)
    ├───► react-youtube (YouTube iframe API)
    └───► Sonner (toast notifications)

┌─────────────────────────────────────────────────────────────────────┐
│                         Backend Stack                               │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├───► AppWrite Cloud (BaaS)
    │       ├───► Sydney data center
    │       ├───► Authentication (Magic URLs)
    │       ├───► Databases (NoSQL collections)
    │       ├───► Realtime (WebSocket subscriptions)
    │       └───► Functions (serverless)
    │
    ├───► YouTube Data API v3 (search)
    └───► Stripe API (payments)

┌─────────────────────────────────────────────────────────────────────┐
│                      Deployment & Hosting                           │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├───► AppWrite Sites (static hosting)
    ├───► www.djamms.app (production domain)
    ├───► Node.js 22 runtime
    └───► GitHub Actions (CI/CD)
```

## File Structure Quick Reference
```
djamms-50-pg/
├── apps/
│   └── web/                        # Unified production app
│       ├── src/
│       │   ├── App.tsx             # Main router (BrowserRouter)
│       │   ├── routes/
│       │   │   ├── player/
│       │   │   │   └── PlayerView.tsx         # 🎯 Implement Phase 1
│       │   │   ├── admin/
│       │   │   │   └── AdminView.tsx          # 🎯 Implement Phase 2
│       │   │   └── kiosk/
│       │   │       └── KioskView.tsx          # 🎯 Implement Phase 3
│       │   ├── hooks/
│       │   │   └── usePlayerManager.ts        # 🎯 Create in Phase 1
│       │   ├── services/
│       │   │   ├── PlayerRegistry.ts          # 🎯 Create in Phase 1
│       │   │   └── PlayerSync.ts              # 🎯 Create in Phase 4
│       │   └── components/
│       │       └── PlayerBusyScreen.tsx       # 🎯 Create in Phase 1
│       └── vite.config.ts
│
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── types/
│   │       │   ├── player.ts      # Track, PlayerState types
│   │       │   └── database.ts    # Queue, User, Venue types
│   │       └── config/
│   │           └── env.ts         # AppWrite config
│   │
│   └── appwrite-client/
│       └── src/
│           └── AppwriteContext.tsx  # Auth, databases, client
│
└── functions/
    └── appwrite/
        └── functions/
            └── add-request/       # 🎯 Create in Phase 3
                └── src/main.ts
```

## Environment Variables Quick Reference
```bash
# AppWrite (already configured)
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=your_db_id

# YouTube API (needed for kiosk)
VITE_YOUTUBE_API_KEY=your_key_here

# Stripe (needed for kiosk payments)
VITE_STRIPE_PUBLIC_KEY=your_key_here
APPWRITE_STRIPE_SECRET_KEY=your_key_here  # Server-side only
```

## Common Operations Quick Reference

### Start Player
```bash
npm run dev          # Start dev server
# Navigate to: http://localhost:5173/player/test-venue
```

### Load Queue
```typescript
const queue = await databases.listDocuments(
  databaseId,
  'queues',
  [Query.equal('venueId', venueId)]
);
```

### Update Now Playing
```typescript
await databases.updateDocument(
  databaseId,
  'queues',
  queueId,
  {
    nowPlaying: {
      ...track,
      startTime: Date.now(),
      remaining: track.duration - 1
    }
  }
);
```

### Subscribe to Updates
```typescript
client.subscribe(
  `databases.${databaseId}.collections.queues.documents`,
  (response) => {
    if (response.payload.venueId === venueId) {
      setQueue(response.payload);
    }
  }
);
```

### Claim Master Status
```typescript
const players = await databases.listDocuments(
  databaseId,
  'player_instances',
  [Query.equal('venueId', venueId)]
);

const activeMaster = players.documents.find(
  p => p.status === 'active' && p.expiresAt > Date.now()
);

if (!activeMaster) {
  // Create master instance
  await databases.createDocument(
    databaseId,
    'player_instances',
    'unique()',
    {
      venueId,
      deviceId: generateDeviceId(),
      status: 'active',
      lastHeartbeat: Date.now(),
      expiresAt: Date.now() + 60000
    }
  );
}
```

---

This diagram provides a quick visual reference for the entire DJAMMS architecture. Use alongside `DJAMMS_ARCHITECTURE_COMPLETE.md` for full details.
