# DJAMMS System Architecture

**Last Updated:** October 16, 2025  
**Version:** 2.0 (Production)  
**Status:** ✅ Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Application Structure](#application-structure)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [Real-Time Synchronization](#real-time-synchronization)
8. [Authentication & Authorization](#authentication--authorization)
9. [Player Architecture](#player-architecture)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

DJAMMS is a production-ready YouTube-based music player system designed for bars and venues. It provides a multi-tenant platform where each venue has:

- **Master Player** - Single authorized playback instance
- **Admin Panel** - Queue management and control
- **Kiosk Interface** - Customer song requests
- **Dashboard** - Venue owner management

### Key Features

- ✅ **Master Player System** - Only one player per venue can control playback
- ✅ **Real-Time Queue Sync** - Changes reflect across all connected clients instantly
- ✅ **Dual YouTube Players** - Seamless crossfading between tracks
- ✅ **Magic Link Authentication** - Passwordless email login
- ✅ **Venue-Scoped Permissions** - Multi-tenant security
- ✅ **Request Management** - Track song requests with payments
- ✅ **Activity Logging** - Complete audit trail

---

## Technology Stack

### Frontend

```
┌────────────────────────────────────────┐
│ React 18 + TypeScript + Vite           │
│ ├── React Router (client-side routing) │
│ ├── TailwindCSS (styling)              │
│ └── YouTube IFrame API (playback)      │
└────────────────────────────────────────┘
```

**Key Libraries:**
- `react` v18.3.1 - UI framework
- `react-router-dom` v7.0.2 - Routing
- `typescript` v5.6.3 - Type safety
- `vite` v6.0.1 - Build tool
- `tailwindcss` v3.4.15 - Styling

### Backend

```
┌────────────────────────────────────────┐
│ AppWrite Cloud (Backend-as-a-Service)  │
│ ├── Database (NoSQL collections)       │
│ ├── Realtime (WebSocket subscriptions) │
│ ├── Functions (Node.js 18 serverless)  │
│ └── Authentication (Magic links)       │
└────────────────────────────────────────┘
```

**AppWrite Services:**
- **Database** - Document storage (7 collections)
- **Realtime** - WebSocket-based live updates
- **Functions** - Serverless Node.js (3 deployed)
- **Sites** - Static hosting with CDN

### External APIs

- **YouTube Data API v3** - Search and metadata
- **YouTube IFrame Player API** - Video playback
- **Resend** - Transactional email (magic links)

---

## Architecture Diagram

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    www.djamms.app                           │
│              (Unified React SPA - AppWrite Sites)           │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌────────────┐    ┌────────────┐   ┌────────────┐
   │  /player/  │    │  /admin/   │   │  /kiosk/   │
   │  :venueId  │    │  :venueId  │   │  :venueId  │
   └────────────┘    └────────────┘   └────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   AppWrite Cloud (Sydney)     │
            │  https://syd.cloud.appwrite   │
            └───────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌────────────┐    ┌────────────┐   ┌────────────┐
   │  Database  │    │  Realtime  │   │ Functions  │
   │ 7 Collections│    │  WebSocket │   │  3 Active  │
   └────────────┘    └────────────┘   └────────────┘
```

### Component Interaction

```
┌──────────────┐         ┌──────────────┐
│    Player    │◄────────┤    Admin     │
│  (Playback)  │  Sync   │ (Queue Mgmt) │
└──────────────┘         └──────────────┘
       │                        │
       │ Realtime Sync          │
       │ (WebSocket)            │
       ▼                        ▼
┌────────────────────────────────────┐
│         AppWrite Database          │
│  ┌──────────┐      ┌──────────┐   │
│  │  queues  │      │  venues  │   │
│  └──────────┘      └──────────┘   │
└────────────────────────────────────┘
       ▲                        ▲
       │                        │
       │  Requests              │
┌──────────────┐         ┌──────────────┐
│    Kiosk     │         │  Dashboard   │
│ (Requests)   │         │(Venue Owner) │
└──────────────┘         └──────────────┘
```

---

## Application Structure

### Monorepo Layout

```
djamms-50-pg/
├── apps/                    # Frontend applications
│   ├── landing/            # Public homepage
│   ├── auth/               # Login/signup (magic links)
│   ├── dashboard/          # User/venue management
│   ├── player/             # Master player (YouTube playback)
│   ├── admin/              # Queue management
│   └── kiosk/              # Song request interface
│
├── packages/               # Shared code
│   ├── shared/            # Common UI components
│   ├── appwrite-client/   # AppWrite SDK wrapper
│   └── youtube-player/    # YouTube IFrame wrapper
│
├── functions/             # Backend logic
│   └── appwrite/
│       ├── functions/     # Cloud functions
│       │   ├── magic-link/         # Auth
│       │   ├── player-registry/    # Master player
│       │   └── processRequest/     # Song requests
│       └── sites/         # Deployment configs
│
└── docs/                  # Documentation
    ├── architecture/      # System design
    ├── setup/            # Getting started
    ├── reference/        # API docs
    └── troubleshooting/  # Common issues
```

### Application Responsibilities

| App | Purpose | Auth Required | Routes |
|-----|---------|---------------|--------|
| **Landing** | Marketing homepage | No | `/` |
| **Auth** | Magic link login | No | `/auth`, `/auth/callback` |
| **Dashboard** | Venue management | Yes | `/dashboard/:userId` |
| **Player** | Music playback | Venue-based | `/player/:venueId` |
| **Admin** | Queue control | Yes | `/admin/:venueId` |
| **Kiosk** | Song requests | Venue-based | `/kiosk/:venueId` |

---

## Data Flow

### Player Startup Sequence

```
1. User visits /player/venue-001
   │
   ▼
2. Check localStorage for cached queue
   │
   ▼
3. Query PlayerRegistry function
   │
   ├─► Master active? → Show busy screen
   │
   └─► No master? → Claim master role
       │
       ▼
4. Create player_instance document
   status: 'active'
   lastHeartbeat: now
   │
   ▼
5. Load queue from database
   │
   ▼
6. Subscribe to Realtime updates
   │
   ▼
7. Start 30s heartbeat interval
   │
   ▼
8. Load YouTube player & begin playback
```

### Queue Update Flow

```
Admin makes change (add/remove/reorder)
   │
   ▼
Update queues collection via AppWrite SDK
   │
   ├─► AppWrite broadcasts Realtime event
   │   │
   │   ▼
   │   All subscribed clients receive update
   │   │
   │   ▼
   │   Update local state & localStorage
   │
   └─► Polling fallback (15s interval)
       detects change if WebSocket fails
```

### Request Submission Flow

```
Customer uses Kiosk
   │
   ▼
Search YouTube for song
   │
   ▼
Submit request + payment info
   │
   ▼
Create document in requests collection
   │
   ▼
Realtime notification to Admin
   │
   ▼
Admin approves/rejects
   │
   ▼
If approved → Add to priorityQueue
   │
   ▼
Player receives queue update
   │
   ▼
Priority track plays next
```

---

## Database Schema

### Collections Overview

| Collection | Purpose | Documents | Key Fields |
|-----------|---------|-----------|------------|
| **venues** | Venue configuration | ~10-100 | venueId, name, ownerId, defaultPlaylistId |
| **queues** | Player queues | 1 per venue | venueId, mainQueue, priorityQueue, nowPlaying |
| **playlists** | Track libraries | ~10-50 | name, tracks[], ownerId, isPublic |
| **users** | User accounts | ~100-1000 | email, name, role, venues[] |
| **requests** | Song requests | ~1000+ | venueId, videoId, requesterId, status |
| **activityLogs** | Audit trail | ~10000+ | venueId, action, userId, timestamp |
| **magicLinks** | Auth tokens | Ephemeral | token, email, expiresAt, used |

### Key Collection: queues

```typescript
{
  venueId: string;              // "venue-001"
  mainQueue: string;            // JSON: Track[]
  priorityQueue: string;        // JSON: Track[]
  nowPlaying: string | null;    // JSON: Track | null
  createdAt: string;            // ISO date
  updatedAt: string;            // ISO date
}

interface Track {
  videoId: string;              // "dQw4w9WgXcQ"
  title: string;                // "Never Gonna Give You Up"
  artist: string;               // "Rick Astley"
  duration: number;             // seconds
  thumbnail: string;            // URL
  addedBy?: string;             // userId
  timestamp: string;            // ISO date
}
```

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

---

## Real-Time Synchronization

### 4-Layer Sync Architecture

```
Layer 1: localStorage
   ↓ (cache)
Layer 2: React State
   ↓ (BroadcastChannel for cross-tab)
Layer 3: AppWrite Realtime (WebSocket)
   ↓ (primary sync)
Layer 4: Polling Fallback (15s interval)
   ↓ (if WebSocket fails)
Database (Single Source of Truth)
```

### Realtime Subscriptions

```typescript
// Subscribe to queue updates
client.subscribe(
  `databases.${DATABASE_ID}.collections.queues.documents.${queueId}`,
  (response) => {
    if (response.events.includes('databases.*.collections.*.documents.*.update')) {
      const updatedQueue = response.payload;
      updateLocalState(updatedQueue);
      saveToLocalStorage(updatedQueue);
    }
  }
);
```

### Sync Priorities

1. **Realtime** - Instant (< 100ms latency)
2. **Polling** - 15s fallback if WebSocket disconnects
3. **localStorage** - Persistent cache, rehydrate on reload
4. **BroadcastChannel** - Cross-tab sync (same venue in multiple tabs)

---

## Authentication & Authorization

### Magic Link Flow

```
1. User enters email at /auth
   │
   ▼
2. Frontend calls magic-link function
   │
   ▼
3. Function generates JWT token (7-day expiry)
   │
   ▼
4. Save to magicLinks collection
   │
   ▼
5. Send email via Resend API
   │
   ▼
6. User clicks link in email
   │
   ▼
7. Redirect to /auth/callback?token=xxx
   │
   ▼
8. Verify token, mark as used
   │
   ▼
9. Create session, redirect to /dashboard
```

### Permission Model

**Roles:**
- `admin` - Full access to all venues
- `staff` - Read/write for assigned venues
- `viewer` - Read-only for assigned venues

**Resource Access:**
```typescript
// Venue-scoped permissions
users: {
  create: false,           // Admin-only via function
  read: ['user:{userId}'], // Own record only
  update: ['user:{userId}'],
  delete: false
}

queues: {
  create: false,
  read: '*',              // Public read (venue-based)
  update: ['role:admin', 'role:staff'],
  delete: ['role:admin']
}
```

---

## Player Architecture

### Master Player System

Only **one player instance** per venue can control playback. This prevents conflicts.

**Heartbeat Mechanism:**
```typescript
// Player sends heartbeat every 30s
setInterval(async () => {
  await updatePlayerInstance({
    lastHeartbeat: new Date().toISOString(),
    isConnected: true
  });
}, 30000);

// Other clients check for active master
const master = await getPlayerInstance(venueId);
const isExpired = Date.now() - new Date(master.lastHeartbeat) > 60000;

if (isExpired) {
  // Master expired, claim role
  claimMasterRole();
} else {
  // Master active, show busy screen
  showPlayerBusyScreen();
}
```

### Dual YouTube Player Setup

```typescript
// Two iframes for crossfading
<iframe id="player-primary" />
<iframe id="player-secondary" />

// Crossfade logic
function playNextTrack() {
  const current = activePlayer; // 'primary' or 'secondary'
  const next = current === 'primary' ? 'secondary' : 'primary';
  
  // Load next track in inactive player
  players[next].loadVideoById(nextVideoId);
  
  // Fade out current, fade in next
  fadeOut(current);
  fadeIn(next);
  
  // Swap active player
  activePlayer = next;
}
```

---

## Deployment Architecture

### Production Deployment

```
┌────────────────────────────────────────────┐
│         DNS (Porkbun/Cloudflare)           │
│  www.djamms.app → AppWrite CDN            │
└────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│         AppWrite Sites (CDN)               │
│  - Global edge caching                     │
│  - Automatic SSL (Let's Encrypt)           │
│  - SPA fallback routing                    │
└────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│    AppWrite Cloud (Sydney Region)          │
│  - Database (queues, venues, etc.)         │
│  - Realtime (WebSocket connections)        │
│  - Functions (magic-link, player-registry) │
└────────────────────────────────────────────┘
```

### Environment Configuration

**Development:**
```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
```

**Production (AppWrite Sites Variables):**
```bash
# Same as development, plus:
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
```

### Build & Deploy Process

```bash
# 1. Build all apps
npm run build

# 2. Deploy to AppWrite Sites
cd functions/appwrite
npx appwrite deploy site

# 3. DNS points to AppWrite CDN
# www.djamms.app → xxx.appwrite.network (CNAME)

# 4. SSL auto-provisions (5-10 minutes)
```

---

## Performance Considerations

### Optimization Strategies

1. **Code Splitting** - Lazy load routes
2. **localStorage Cache** - Reduce API calls
3. **Realtime Throttling** - Debounce updates
4. **YouTube Player Preloading** - Load next track early
5. **CDN Caching** - Static assets cached globally

### Scalability

**Current Limits:**
- **Venues:** ~100 (can scale to 10,000+)
- **Concurrent Players:** ~50 (WebSocket limit)
- **Queue Updates:** ~1000/minute (Realtime throughput)
- **Database Size:** ~1GB (current), 10GB+ supported

**Scaling Strategy:**
- Horizontal: Add AppWrite regions
- Vertical: Upgrade database tier
- Caching: Add Redis for hot data

---

## Security

### Best Practices

1. ✅ **No API Keys in Frontend** - Use AppWrite SDK with project ID only
2. ✅ **Magic Link Tokens** - Single-use, 7-day expiry
3. ✅ **Venue-Scoped Permissions** - Users can only access assigned venues
4. ✅ **CORS Restrictions** - Only www.djamms.app allowed
5. ✅ **Rate Limiting** - AppWrite enforces per-project limits
6. ✅ **Input Validation** - All user inputs sanitized

### Secrets Management

**Environment Variables:**
- `VITE_APPWRITE_API_KEY` - **Server-side only** (functions)
- `RESEND_API_KEY` - **Server-side only** (magic-link function)
- `VITE_JWT_SECRET` - Used for token signing
- `VITE_YOUTUBE_API_KEY` - Restricted to djamms.app domain

---

## Monitoring & Observability

### Built-In Monitoring

- **AppWrite Console** - Function logs, database metrics
- **Console Ninja** (optional) - Real-time debugging in VS Code
- **Browser DevTools** - Network, performance profiling

### Key Metrics

- Player heartbeat status (every 30s)
- Queue update latency (< 500ms target)
- Magic link delivery rate (> 95%)
- YouTube player load time (< 2s)

---

## Next Steps

- **[Database Schema](./DATABASE_SCHEMA.md)** - Detailed collection docs
- **[API Reference](../reference/API_REFERENCE.md)** - Endpoint documentation
- **[Quick Start](../setup/QUICKSTART.md)** - Get started locally
- **[Deployment Guide](../setup/DEPLOYMENT.md)** - Deploy to production

---

**Maintained By:** SystemVirtue  
**Documentation Version:** 2.0  
**Last Reviewed:** October 16, 2025
