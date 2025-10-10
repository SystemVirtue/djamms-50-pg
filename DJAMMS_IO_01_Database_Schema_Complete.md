# DJAMMS I/O Reference: Database Schema Complete

**Document ID**: DJAMMS_IO_01  
**Category**: BY TYPE - Database & Schema  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Collection: users](#collection-users)
3. [Collection: venues](#collection-venues)
4. [Collection: queues](#collection-queues)
5. [Collection: players](#collection-players)
6. [Collection: magicLinks](#collection-magiclinks)
7. [Collection: playlists](#collection-playlists)
8. [Collection: requests](#collection-requests)
9. [CRUD Operations Matrix](#crud-operations-matrix)
10. [Data Flow Diagrams](#data-flow-diagrams)

---

## Database Overview

### **Platform**: AppWrite Cloud Database
- **Database ID**: `djamms_production`
- **Total Collections**: 8
- **Backend**: AppWrite Cloud (v1.6+)
- **Deployment Status**: ✅ Production

### **Schema Management**
- **Tool**: `scripts/schema-manager/appwrite-schema.cjs`
- **Commands**:
  - `npm run schema:check` - Dry run validation
  - `npm run schema:apply` - Create missing attributes
  - `npm run schema:clean --confirm` - Remove invalid documents

---

## Collection: users

### **Purpose**
Store user account information with role-based access control.

### **Collection ID**: `users`
### **Collection Name**: Users

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `userId` | `string` | 255 | ✅ Yes | - | Unique user identifier (UUID) |
| `email` | `string` | 255 | ✅ Yes | - | User email address (unique) |
| `role` | `enum` | - | ❌ No | `staff` | User role: `admin`, `staff`, `viewer` |
| `autoplay` | `boolean` | - | ❌ No | `true` | Autoplay preference |
| `venueId` | `string` | 255 | ❌ No | - | Assigned venue (if applicable) |
| `createdAt` | `datetime` | - | ✅ Yes | - | Account creation timestamp |
| `updatedAt` | `datetime` | - | ❌ No | - | Last update timestamp |
| `avatar_url` | `url` | - | ❌ No | - | User avatar image URL |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `email_unique` | `unique` | `[email]` | Ensure unique emails |
| `userId_key` | `key` | `[userId]` | Fast userId lookups |

### **Permissions**
- **Document-level**: User can read/update own document
- **Collection-level**: Admins can list all users

### **CRUD Operations**

#### CREATE
```typescript
// packages/appwrite-client/src/users.ts
const createUser = async (email: string, role: string = 'staff') => {
  return await databases.createDocument(
    databaseId,
    'users',
    ID.unique(),
    {
      userId: ID.unique(),
      email,
      role,
      autoplay: true,
      createdAt: new Date().toISOString()
    }
  );
};
```

**Used By**: Auth endpoint during magic link verification

#### READ
```typescript
// Get user by email
const getUserByEmail = async (email: string) => {
  const result = await databases.listDocuments(
    databaseId,
    'users',
    [Query.equal('email', email)]
  );
  return result.documents[0];
};
```

**Used By**: Dashboard, Auth

#### UPDATE
```typescript
// Update autoplay preference
const updateAutoplay = async (userId: string, autoplay: boolean) => {
  return await databases.updateDocument(
    databaseId,
    'users',
    userId,
    { autoplay, updatedAt: new Date().toISOString() }
  );
};
```

**Used By**: Dashboard, Player

#### DELETE
```typescript
const deleteUser = async (userId: string) => {
  return await databases.deleteDocument(
    databaseId,
    'users',
    userId
  );
};
```

**Used By**: Admin endpoint (rare)

### **Related Endpoints**
- 🔗 **Auth**: Create user on first login
- 🔗 **Dashboard**: Display user profile, settings
- 🔗 **Admin**: Check admin role permissions

---

## Collection: venues

### **Purpose**
Store venue information and link to active player instance.

### **Collection ID**: `venues`
### **Collection Name**: Venues

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `venueId` | `string` | 255 | ✅ Yes | - | Unique venue identifier |
| `name` | `string` | 255 | ✅ Yes | - | Venue name (e.g., "The Red Lion") |
| `slug` | `string` | 255 | ✅ Yes | - | URL-friendly slug (e.g., "red-lion") |
| `ownerId` | `string` | 255 | ✅ Yes | - | User ID of venue owner |
| `activePlayerInstanceId` | `string` | 255 | ❌ No | - | Current master player ID |
| `createdAt` | `datetime` | - | ✅ Yes | - | Venue creation timestamp |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `slug_unique` | `unique` | `[slug]` | Unique venue URLs |
| `ownerId_key` | `key` | `[ownerId]` | List venues by owner |

### **CRUD Operations**

#### CREATE
```typescript
const createVenue = async (name: string, ownerId: string) => {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return await databases.createDocument(
    databaseId,
    'venues',
    ID.unique(),
    {
      venueId: ID.unique(),
      name,
      slug,
      ownerId,
      createdAt: new Date().toISOString()
    }
  );
};
```

**Used By**: Admin setup (manual or via admin console)

#### READ
```typescript
// Get venue by slug
const getVenueBySlug = async (slug: string) => {
  const result = await databases.listDocuments(
    databaseId,
    'venues',
    [Query.equal('slug', slug)]
  );
  return result.documents[0];
};

// Get venues by owner
const getOwnerVenues = async (ownerId: string) => {
  return await databases.listDocuments(
    databaseId,
    'venues',
    [Query.equal('ownerId', ownerId)]
  );
};
```

**Used By**: Dashboard (list venues), Player/Admin/Kiosk (validate venue)

#### UPDATE
```typescript
// Update active player
const setActivePlayer = async (venueId: string, playerId: string) => {
  return await databases.updateDocument(
    databaseId,
    'venues',
    venueId,
    { activePlayerInstanceId: playerId }
  );
};
```

**Used By**: Player endpoint (master election)

### **Related Endpoints**
- 🔗 **Dashboard**: List user's venues
- 🔗 **Player/Admin/Kiosk**: Validate venueId from URL

---

## Collection: queues

### **Purpose**
Central playback state for each venue. Stores now playing track, main queue, and priority queue.

### **Collection ID**: `queues`
### **Collection Name**: Queues

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `venueId` | `string` | 255 | ✅ Yes | - | Venue identifier (unique) |
| `nowPlaying` | `string` | 10,000 | ❌ No | `null` | JSON: Current track info |
| `mainQueue` | `string` | 100,000 | ✅ Yes | `[]` | JSON array: Standard tracks |
| `priorityQueue` | `string` | 100,000 | ✅ Yes | `[]` | JSON array: Paid requests |
| `createdAt` | `datetime` | - | ✅ Yes | - | Queue creation timestamp |
| `updatedAt` | `datetime` | - | ❌ No | - | Last update timestamp |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `venueId_unique` | `unique` | `[venueId]` | One queue per venue |

### **Data Structures**

#### `nowPlaying` (JSON string)
```typescript
interface NowPlaying {
  videoId: string;        // YouTube video ID
  title: string;          // Track title
  artist: string;         // Artist name
  duration: number;       // Duration in seconds
  startTime: number;      // Unix timestamp when started
  remaining: number;      // Seconds remaining
  isRequest: boolean;     // Is this a paid request?
  thumbnailUrl?: string;  // YouTube thumbnail
}
```

#### `mainQueue` (JSON array string)
```typescript
interface Track {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl?: string;
  position: number;       // Queue position (0-indexed)
}

// Serialized as: JSON.stringify(Track[])
```

#### `priorityQueue` (JSON array string)
```typescript
interface PriorityTrack extends Track {
  requesterId: string;    // User who requested
  paidCredit: number;     // Amount paid (e.g., 0.50)
  timestamp: number;      // When requested
}
```

### **CRUD Operations**

#### CREATE
```typescript
// Initialize queue for new venue
const initializeQueue = async (venueId: string) => {
  return await databases.createDocument(
    databaseId,
    'queues',
    ID.unique(),
    {
      venueId,
      mainQueue: JSON.stringify([]),
      priorityQueue: JSON.stringify([]),
      createdAt: new Date().toISOString()
    }
  );
};
```

**Used By**: Venue setup process

#### READ
```typescript
// Get queue for venue
const getQueue = async (venueId: string) => {
  const result = await databases.listDocuments(
    databaseId,
    'queues',
    [Query.equal('venueId', venueId)]
  );
  
  const doc = result.documents[0];
  return {
    ...doc,
    nowPlaying: doc.nowPlaying ? JSON.parse(doc.nowPlaying) : null,
    mainQueue: JSON.parse(doc.mainQueue),
    priorityQueue: JSON.parse(doc.priorityQueue)
  };
};
```

**Used By**: Player, Admin, Kiosk

#### UPDATE

**Update Now Playing**:
```typescript
const updateNowPlaying = async (
  queueId: string, 
  track: NowPlaying
) => {
  return await databases.updateDocument(
    databaseId,
    'queues',
    queueId,
    {
      nowPlaying: JSON.stringify(track),
      updatedAt: new Date().toISOString()
    }
  );
};
```

**Add to Priority Queue**:
```typescript
const addToPriorityQueue = async (
  queueId: string,
  currentQueue: PriorityTrack[],
  newTrack: PriorityTrack
) => {
  const updated = [...currentQueue, newTrack];
  return await databases.updateDocument(
    databaseId,
    'queues',
    queueId,
    {
      priorityQueue: JSON.stringify(updated),
      updatedAt: new Date().toISOString()
    }
  );
};
```

**Rotate Main Queue** (after track plays):
```typescript
const rotateMainQueue = async (
  queueId: string,
  currentQueue: Track[]
) => {
  // Move first track to end
  const [firstTrack, ...rest] = currentQueue;
  const rotated = [...rest, firstTrack];
  
  return await databases.updateDocument(
    databaseId,
    'queues',
    queueId,
    {
      mainQueue: JSON.stringify(rotated),
      updatedAt: new Date().toISOString()
    }
  );
};
```

**Used By**: Player (track progression), Admin (skip), Kiosk (add request)

#### DELETE
```typescript
const deleteQueue = async (queueId: string) => {
  return await databases.deleteDocument(
    databaseId,
    'queues',
    queueId
  );
};
```

**Used By**: Venue deletion (cleanup)

### **Queue Management Logic**

#### **Track Selection Priority**
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
```

#### **Track Progression Flow**
```
1. Check priorityQueue.length > 0
   ├─ YES → Play priorityQueue[0]
   │        Remove from priorityQueue after playing
   └─ NO  → Play mainQueue[0]
            Move to end of mainQueue after playing

Example:
Initial:
  mainQueue: [A, B, C]
  priorityQueue: [X]

After playing X:
  mainQueue: [A, B, C]     // Unchanged
  priorityQueue: []        // X removed

After playing A:
  mainQueue: [B, C, A]     // A moved to end
  priorityQueue: []
```

### **Related Endpoints**
- 🔗 **Player**: Read, Update (nowPlaying, queue rotation)
- 🔗 **Admin**: Read, Update (skip, remove tracks)
- 🔗 **Kiosk**: Read (display queue), Update (add request)

---

## Collection: players

### **Purpose**
Track active player instances for master election and heartbeat monitoring.

### **Collection ID**: `players`
### **Collection Name**: Players

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `playerId` | `string` | 255 | ✅ Yes | - | Unique player instance ID |
| `venueId` | `string` | 255 | ✅ Yes | - | Venue this player belongs to |
| `deviceId` | `string` | 255 | ✅ Yes | - | Browser fingerprint |
| `status` | `enum` | - | ❌ No | `idle` | `active`, `idle`, `offline` |
| `lastHeartbeat` | `integer` | - | ✅ Yes | - | Unix timestamp (milliseconds) |
| `expiresAt` | `integer` | - | ✅ Yes | - | Unix timestamp (now + 60s) |
| `userAgent` | `string` | 500 | ✅ Yes | - | Browser user agent |
| `createdAt` | `datetime` | - | ✅ Yes | - | Instance creation timestamp |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `venueId_key` | `key` | `[venueId]` | Find players by venue |
| `deviceId_key` | `key` | `[deviceId]` | Find player by device |

### **Master Election Logic**

```typescript
// From PlayerRegistry.ts
const registerPlayer = async (venueId: string, deviceId: string) => {
  // Check for active master
  const activePlayers = await databases.listDocuments(
    databaseId,
    'players',
    [
      Query.equal('venueId', venueId),
      Query.equal('status', 'active'),
      Query.greaterThan('expiresAt', Date.now())
    ]
  );
  
  if (activePlayers.documents.length > 0) {
    // Another player is master
    return { isMaster: false, masterId: activePlayers.documents[0].playerId };
  }
  
  // Become master
  const playerId = ID.unique();
  await databases.createDocument(
    databaseId,
    'players',
    playerId,
    {
      playerId,
      venueId,
      deviceId,
      status: 'active',
      lastHeartbeat: Date.now(),
      expiresAt: Date.now() + 60000, // 60 seconds
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString()
    }
  );
  
  return { isMaster: true, playerId };
};
```

### **Heartbeat Mechanism**

```typescript
// Send heartbeat every 30 seconds
const sendHeartbeat = async (playerId: string) => {
  return await databases.updateDocument(
    databaseId,
    'players',
    playerId,
    {
      lastHeartbeat: Date.now(),
      expiresAt: Date.now() + 60000,
      status: 'active'
    }
  );
};

// In Player component:
useEffect(() => {
  if (!isMaster) return;
  
  const interval = setInterval(() => {
    sendHeartbeat(playerId);
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, [isMaster, playerId]);
```

### **CRUD Operations**

#### CREATE
See `registerPlayer()` above.

**Used By**: Player endpoint on mount

#### READ
```typescript
// Get active master for venue
const getMasterPlayer = async (venueId: string) => {
  const result = await databases.listDocuments(
    databaseId,
    'players',
    [
      Query.equal('venueId', venueId),
      Query.equal('status', 'active'),
      Query.greaterThan('expiresAt', Date.now())
    ]
  );
  return result.documents[0];
};
```

**Used By**: Player (check before claiming), Admin (display master info)

#### UPDATE
See `sendHeartbeat()` above.

**Used By**: Player endpoint (every 30s)

#### DELETE
```typescript
// Cleanup expired players (Cloud Function)
const cleanupExpiredPlayers = async () => {
  const expired = await databases.listDocuments(
    databaseId,
    'players',
    [Query.lessThan('expiresAt', Date.now())]
  );
  
  for (const player of expired.documents) {
    await databases.updateDocument(
      databaseId,
      'players',
      player.$id,
      { status: 'offline' }
    );
  }
};
```

**Used By**: Background cleanup function (every 5 minutes)

### **Related Endpoints**
- 🔗 **Player**: CREATE (register), UPDATE (heartbeat)
- 🔗 **Admin**: READ (display master status)

---

## Collection: magicLinks

### **Purpose**
Store one-time magic link tokens for passwordless authentication.

### **Collection ID**: `magicLinks`
### **Collection Name**: Magic Links

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `email` | `string` | 255 | ✅ Yes | - | Email address for login |
| `token` | `string` | 255 | ✅ Yes | - | Unique token (UUID) |
| `redirectUrl` | `url` | - | ✅ Yes | - | Where to redirect after login |
| `expiresAt` | `integer` | - | ✅ Yes | - | Unix timestamp (now + 15min) |
| `used` | `boolean` | - | ❌ No | `false` | Has token been used? |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `token_key` | `key` | `[token]` | Fast token lookups |
| `email_key` | `key` | `[email]` | Find links by email |

### **CRUD Operations**

#### CREATE
```typescript
// Generate magic link
const generateMagicLink = async (email: string, redirectUrl: string) => {
  const token = ID.unique();
  
  await databases.createDocument(
    databaseId,
    'magicLinks',
    ID.unique(),
    {
      email,
      token,
      redirectUrl,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      used: false
    }
  );
  
  return `https://www.djamms.app/auth/verify?token=${token}`;
};
```

**Used By**: Auth endpoint (send magic link email)

#### READ
```typescript
// Verify token
const verifyToken = async (token: string) => {
  const result = await databases.listDocuments(
    databaseId,
    'magicLinks',
    [
      Query.equal('token', token),
      Query.equal('used', false),
      Query.greaterThan('expiresAt', Date.now())
    ]
  );
  
  if (result.documents.length === 0) {
    throw new Error('Invalid or expired token');
  }
  
  return result.documents[0];
};
```

**Used By**: Auth callback endpoint

#### UPDATE
```typescript
// Mark token as used
const markTokenUsed = async (linkId: string) => {
  return await databases.updateDocument(
    databaseId,
    'magicLinks',
    linkId,
    { used: true }
  );
};
```

**Used By**: Auth callback (after successful login)

#### DELETE
```typescript
// Cleanup old tokens (Cloud Function)
const cleanupExpiredTokens = async () => {
  const expired = await databases.listDocuments(
    databaseId,
    'magicLinks',
    [Query.lessThan('expiresAt', Date.now())]
  );
  
  for (const link of expired.documents) {
    await databases.deleteDocument(
      databaseId,
      'magicLinks',
      link.$id
    );
  }
};
```

**Used By**: Background cleanup function

### **Related Endpoints**
- 🔗 **Auth**: CREATE (generate link), READ (verify), UPDATE (mark used)

---

## Collection: playlists

### **Purpose**
Store track collections for venues and users.

### **Collection ID**: `playlists`
### **Collection Name**: Playlists

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `playlistId` | `string` | 255 | ✅ Yes | - | Unique playlist identifier |
| `name` | `string` | 255 | ✅ Yes | - | Playlist name |
| `description` | `string` | 1,000 | ❌ No | - | Playlist description |
| `ownerId` | `string` | 255 | ✅ Yes | - | User ID of creator |
| `venueId` | `string` | 255 | ❌ No | - | Associated venue (optional) |
| `tracks` | `string` | 100,000 | ✅ Yes | `[]` | JSON array: Track list |
| `createdAt` | `datetime` | - | ✅ Yes | - | Creation timestamp |
| `updatedAt` | `datetime` | - | ❌ No | - | Last update timestamp |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `ownerId_key` | `key` | `[ownerId]` | List user's playlists |
| `venueId_key` | `key` | `[venueId]` | List venue playlists |

### **Data Structure**

#### `tracks` (JSON array string)
```typescript
interface PlaylistTrack {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl?: string;
  addedAt: number;        // Unix timestamp
}
```

### **CRUD Operations**

#### CREATE
```typescript
const createPlaylist = async (
  name: string,
  ownerId: string,
  tracks: PlaylistTrack[] = []
) => {
  return await databases.createDocument(
    databaseId,
    'playlists',
    ID.unique(),
    {
      playlistId: ID.unique(),
      name,
      ownerId,
      tracks: JSON.stringify(tracks),
      createdAt: new Date().toISOString()
    }
  );
};
```

#### READ
```typescript
// Get user's playlists
const getUserPlaylists = async (ownerId: string) => {
  return await databases.listDocuments(
    databaseId,
    'playlists',
    [Query.equal('ownerId', ownerId)]
  );
};
```

#### UPDATE
```typescript
// Add track to playlist
const addTrackToPlaylist = async (
  playlistId: string,
  currentTracks: PlaylistTrack[],
  newTrack: PlaylistTrack
) => {
  const updated = [...currentTracks, newTrack];
  return await databases.updateDocument(
    databaseId,
    'playlists',
    playlistId,
    {
      tracks: JSON.stringify(updated),
      updatedAt: new Date().toISOString()
    }
  );
};
```

#### DELETE
```typescript
const deletePlaylist = async (playlistId: string) => {
  return await databases.deleteDocument(
    databaseId,
    'playlists',
    playlistId
  );
};
```

### **Related Endpoints**
- 🔗 **Dashboard**: List, create, edit playlists
- 🔗 **Admin**: Load playlist into main queue

---

## Collection: requests

### **Purpose**
Track paid song requests from kiosk users.

### **Collection ID**: `requests`
### **Collection Name**: Requests

### **Schema Definition**

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `requestId` | `string` | 255 | ✅ Yes | - | Unique request identifier |
| `venueId` | `string` | 255 | ✅ Yes | - | Venue where requested |
| `song` | `string` | 10,000 | ✅ Yes | - | JSON: Track info |
| `requesterId` | `string` | 255 | ✅ Yes | - | User ID or guest identifier |
| `paymentId` | `string` | 255 | ✅ Yes | - | Stripe payment ID |
| `status` | `enum` | - | ❌ No | `queued` | `queued`, `playing`, `completed`, `cancelled` |
| `timestamp` | `datetime` | - | ✅ Yes | - | Request timestamp |

### **Indexes**

| Index Key | Type | Attributes | Purpose |
|-----------|------|------------|---------|
| `venueId_key` | `key` | `[venueId]` | List venue requests |
| `requesterId_key` | `key` | `[requesterId]` | User request history |
| `timestamp_key` | `key` | `[timestamp]` | Sort by time |

### **Data Structure**

#### `song` (JSON string)
```typescript
interface RequestSong {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl?: string;
  paidCredit: number;     // Amount paid
}
```

### **CRUD Operations**

#### CREATE
```typescript
const createRequest = async (
  venueId: string,
  song: RequestSong,
  requesterId: string,
  paymentId: string
) => {
  return await databases.createDocument(
    databaseId,
    'requests',
    ID.unique(),
    {
      requestId: ID.unique(),
      venueId,
      song: JSON.stringify(song),
      requesterId,
      paymentId,
      status: 'queued',
      timestamp: new Date().toISOString()
    }
  );
};
```

**Used By**: Kiosk (after payment success)

#### READ
```typescript
// Get venue requests
const getVenueRequests = async (venueId: string) => {
  return await databases.listDocuments(
    databaseId,
    'requests',
    [
      Query.equal('venueId', venueId),
      Query.orderDesc('timestamp')
    ]
  );
};
```

**Used By**: Admin (view request history)

#### UPDATE
```typescript
// Update request status
const updateRequestStatus = async (
  requestId: string,
  status: 'queued' | 'playing' | 'completed' | 'cancelled'
) => {
  return await databases.updateDocument(
    databaseId,
    'requests',
    requestId,
    { status }
  );
};
```

**Used By**: Player (update as track plays)

#### DELETE
```typescript
const deleteRequest = async (requestId: string) => {
  return await databases.deleteDocument(
    databaseId,
    'requests',
    requestId
  );
};
```

**Used By**: Admin (cancel request, refund)

### **Related Endpoints**
- 🔗 **Kiosk**: CREATE (submit request)
- 🔗 **Admin**: READ (view requests), UPDATE (status)
- 🔗 **Player**: UPDATE (status as playing/completed)

---

## CRUD Operations Matrix

### **Operations by Collection**

| Collection | CREATE | READ | UPDATE | DELETE | Primary Endpoint |
|------------|--------|------|--------|--------|------------------|
| **users** | Auth | Dashboard, Auth | Dashboard | Admin | Auth, Dashboard |
| **venues** | Admin | Dashboard, All | Admin | Admin | Dashboard |
| **queues** | Setup | Player, Admin, Kiosk | Player, Admin, Kiosk | Admin | Player |
| **players** | Player | Player, Admin | Player | Cleanup Function | Player |
| **magicLinks** | Auth | Auth | Auth | Cleanup Function | Auth |
| **playlists** | Dashboard | Dashboard, Admin | Dashboard, Admin | Dashboard | Dashboard |
| **requests** | Kiosk | Admin, Kiosk | Player, Admin | Admin | Kiosk |

### **Operations by Endpoint**

| Endpoint | Collections Used | Primary Operations |
|----------|------------------|-------------------|
| **Landing** | - | None |
| **Auth** | `users`, `magicLinks` | CREATE magic link, READ/UPDATE token, CREATE/READ user |
| **Dashboard** | `users`, `venues`, `playlists` | READ user, READ venues, CRUD playlists |
| **Player** | `queues`, `players`, `playlists` | READ queue, UPDATE queue, CREATE/UPDATE player |
| **Admin** | `queues`, `requests`, `users` | READ/UPDATE queue, READ requests, READ user roles |
| **Kiosk** | `queues`, `requests` | READ queue, CREATE request |

---

## Data Flow Diagrams

### **Diagram 1: Magic Link Authentication Flow**

```
┌─────────┐              ┌──────────┐              ┌──────────────┐
│  User   │              │   Auth   │              │   AppWrite   │
│ Browser │              │ Endpoint │              │   Database   │
└────┬────┘              └─────┬────┘              └──────┬───────┘
     │                         │                          │
     │  1. Enter email         │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │  2. CREATE magicLinks    │
     │                         ├─────────────────────────>│
     │                         │                          │
     │                         │  3. Send email (link)    │
     │<────────────────────────┤                          │
     │                         │                          │
     │  4. Click link          │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │  5. READ magicLinks      │
     │                         ├─────────────────────────>│
     │                         │  (verify token)          │
     │                         │<─────────────────────────┤
     │                         │                          │
     │                         │  6. UPDATE magicLinks    │
     │                         │  (mark used)             │
     │                         ├─────────────────────────>│
     │                         │                          │
     │                         │  7. CREATE/READ users    │
     │                         ├─────────────────────────>│
     │                         │<─────────────────────────┤
     │                         │                          │
     │  8. JWT token + redirect│                          │
     │<────────────────────────┤                          │
     │                         │                          │
```

### **Diagram 2: Player Queue Update Flow**

```
┌──────────┐         ┌───────────┐         ┌──────────────┐         ┌─────────┐
│  Player  │         │   Admin   │         │   AppWrite   │         │  Kiosk  │
│ Endpoint │         │  Endpoint │         │   Database   │         │Endpoint │
└────┬─────┘         └─────┬─────┘         └──────┬───────┘         └────┬────┘
     │                     │                      │                      │
     │  1. Track ends      │                      │                      │
     │                     │                      │                      │
     │  2. UPDATE queues   │                      │                      │
     │  (rotate mainQueue) │                      │                      │
     ├─────────────────────┼─────────────────────>│                      │
     │                     │                      │                      │
     │                     │                      │  3. Realtime event   │
     │<────────────────────┼──────────────────────┤                      │
     │                     │<─────────────────────┤                      │
     │                     │                      │<─────────────────────┤
     │                     │                      │                      │
     │  4. Load next track │                      │                      │
     │  (from updated queue│                      │                      │
     │                     │                      │                      │
     │                     │  5. UI updates       │                      │
     │                     │  (show new queue)    │                      │
     │                     │                      │                      │
```

### **Diagram 3: Kiosk Request Flow**

```
┌──────────┐       ┌──────────────┐       ┌───────────┐       ┌──────────┐
│  Kiosk   │       │   AppWrite   │       │  Stripe   │       │  Player  │
│ Endpoint │       │   Database   │       │    API    │       │ Endpoint │
└────┬─────┘       └──────┬───────┘       └─────┬─────┘       └────┬─────┘
     │                    │                     │                   │
     │ 1. Search song     │                     │                   │
     │ (YouTube API)      │                     │                   │
     │                    │                     │                   │
     │ 2. Select + Pay    │                     │                   │
     ├────────────────────┼────────────────────>│                   │
     │                    │                     │                   │
     │                    │                     │ 3. Payment OK     │
     │<───────────────────┼─────────────────────┤                   │
     │                    │                     │                   │
     │ 4. CREATE requests │                     │                   │
     ├───────────────────>│                     │                   │
     │                    │                     │                   │
     │ 5. UPDATE queues   │                     │                   │
     │ (add to priority)  │                     │                   │
     ├───────────────────>│                     │                   │
     │                    │                     │                   │
     │                    │  6. Realtime event  │                   │
     │                    ├─────────────────────┼──────────────────>│
     │                    │                     │                   │
     │                    │                     │   7. Load request │
     │                    │                     │   (priority queue)│
     │                    │                     │                   │
```

---

## Storage Optimization

### **JSON Serialization Strategy**

Large arrays (mainQueue, priorityQueue, tracks) are stored as JSON strings to:
- ✅ Bypass AppWrite's lack of native array attributes
- ✅ Support complex nested objects
- ✅ Reduce storage costs (text fields vs multiple documents)
- ✅ Atomic updates (entire array replaced in single operation)

### **Size Limits**

| Field | Max Size | Typical Usage | Notes |
|-------|----------|---------------|-------|
| `mainQueue` | 100,000 chars | ~200 tracks | JSON array |
| `priorityQueue` | 100,000 chars | ~50 requests | JSON array |
| `nowPlaying` | 10,000 chars | 1 track | JSON object |
| `tracks` (playlists) | 100,000 chars | ~200 tracks | JSON array |
| `song` (requests) | 10,000 chars | 1 track | JSON object |

---

## Schema Evolution

### **Version History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Sep 2025 | Initial schema (7 collections) |
| 1.1 | Oct 2025 | Added `requests` collection |
| 1.2 | Oct 2025 | Added `avatar_url` to users |

### **Migration Strategy**

Attributes added without breaking changes:
- New optional fields default to `null`
- Existing documents not affected
- Schema manager validates on deploy

---

## Related Documents

- 📄 **DJAMMS_IO_02_API_Communications_Complete.md** - API call specifications
- 📄 **DJAMMS_IO_03_Realtime_Sync_Complete.md** - Real-time update mechanisms
- 📄 **DJAMMS_IO_04_State_Management_Complete.md** - Frontend state handling

---

**END OF DOCUMENT**
