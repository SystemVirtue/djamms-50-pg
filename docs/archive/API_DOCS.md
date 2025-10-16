# DJAMMS API Documentation

## Overview

DJAMMS uses AppWrite as its backend-as-a-service platform for database operations, real-time synchronization, and authentication.

## Table of Contents

1. [Authentication](#authentication)
2. [Database Collections](#database-collections)
3. [Services API](#services-api)
4. [Real-Time Subscriptions](#real-time-subscriptions)
5. [YouTube API Integration](#youtube-api-integration)

---

## Authentication

### Magic Link Authentication

**Endpoint**: AppWrite Account API

**Flow**:
```
1. User enters email → createMagicURLSession()
2. AppWrite sends magic link email
3. User clicks link → updateMagicURLSession()
4. Session created, JWT token issued
5. Redirect to dashboard
```

**Implementation**:
```typescript
// Send magic link
await account.createMagicURLSession(
  ID.unique(),
  email,
  `${window.location.origin}/auth/verify`
);

// Verify and create session
await account.updateMagicURLSession(userId, secret);
```

**Session Management**:
- Sessions stored in AppWrite
- JWT tokens for authentication
- Auto-refresh on expiry
- Logout destroys session

---

## Database Collections

### 1. queues

**Purpose**: Store song request queue

**Schema**:
```typescript
interface QueueDocument {
  $id: string;
  venueId: string;
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl?: string;
  position: number;
  isPriority: boolean;
  isRequest: boolean;
  requesterId?: string;
  addedAt: number;
  playedAt?: number;
}
```

**Indexes**:
- `venueId` (ascending)
- `position` (ascending)
- `isPriority` (descending)
- `addedAt` (ascending)

**Permissions**:
- Read: Anyone
- Create: Authenticated users
- Update: Admins only
- Delete: Admins only

**Operations**:
```typescript
// Add track to queue
await databases.createDocument(
  databaseId,
  'queues',
  ID.unique(),
  {
    venueId,
    videoId,
    title,
    artist,
    duration,
    position: currentMaxPosition + 1,
    isPriority: false,
    isRequest: true,
    requesterId: 'user123',
    addedAt: Date.now(),
  }
);

// Get queue for venue
const response = await databases.listDocuments(
  databaseId,
  'queues',
  [
    Query.equal('venueId', venueId),
    Query.equal('playedAt', null),
    Query.orderDesc('isPriority'),
    Query.orderAsc('position'),
  ]
);

// Remove track
await databases.deleteDocument(
  databaseId,
  'queues',
  trackId
);
```

### 2. player_instances

**Purpose**: Track active player instances for master election

**Schema**:
```typescript
interface PlayerInstance {
  $id: string;
  venueId: string;
  playerId: string;
  status: 'active' | 'inactive';
  lastHeartbeat: number;
  expiresAt: number;
  isMaster: boolean;
  deviceInfo?: string;
}
```

**Indexes**:
- `venueId` (ascending)
- `lastHeartbeat` (descending)
- `isMaster` (descending)

**Heartbeat System**:
```typescript
// Register player
await databases.createDocument(
  databaseId,
  'player_instances',
  ID.unique(),
  {
    venueId,
    playerId,
    status: 'active',
    lastHeartbeat: Date.now(),
    expiresAt: Date.now() + 30000, // 30 seconds
    isMaster: false,
  }
);

// Send heartbeat every 5 seconds
setInterval(async () => {
  await databases.updateDocument(
    databaseId,
    'player_instances',
    instanceId,
    {
      lastHeartbeat: Date.now(),
      expiresAt: Date.now() + 30000,
    }
  );
}, 5000);

// Check for expired instances
const expired = await databases.listDocuments(
  databaseId,
  'player_instances',
  [
    Query.equal('venueId', venueId),
    Query.lessThan('expiresAt', Date.now()),
  ]
);
```

### 3. player_state

**Purpose**: Synchronize player state across devices

**Schema**:
```typescript
interface PlayerStateDocument {
  $id: string;
  venueId: string;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  volume: number;
  lastUpdated: number;
  updatedBy: string; // playerId
}

interface NowPlaying {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  startTime: number;
  remaining: number;
  isRequest: boolean;
  requesterId?: string;
}
```

**Indexes**:
- `venueId` (ascending, unique)

**State Updates**:
```typescript
// Master player updates state
await databases.updateDocument(
  databaseId,
  'player_state',
  stateId,
  {
    nowPlaying: JSON.stringify(currentTrack),
    isPlaying: true,
    volume: 75,
    lastUpdated: Date.now(),
    updatedBy: playerId,
  }
);

// Viewers/admins get state
const state = await databases.getDocument(
  databaseId,
  'player_state',
  stateId
);
```

### 4. player_commands

**Purpose**: Send commands from admin to master player

**Schema**:
```typescript
interface PlayerCommand {
  $id: string;
  venueId: string;
  command: 'play' | 'pause' | 'skip' | 'volume' | 'seek';
  payload?: any;
  issuedBy: string; // userId or deviceId
  issuedAt: number;
  executedBy?: string; // playerId
  executedAt?: number;
}
```

**Indexes**:
- `venueId` (ascending)
- `executedBy` (ascending)
- `issuedAt` (descending)

**Command Flow**:
```typescript
// Admin issues command
await databases.createDocument(
  databaseId,
  'player_commands',
  ID.unique(),
  {
    venueId,
    command: 'pause',
    payload: {},
    issuedBy: userId,
    issuedAt: Date.now(),
    executedBy: null,
    executedAt: null,
  }
);

// Master player executes
await databases.updateDocument(
  databaseId,
  'player_commands',
  commandId,
  {
    executedBy: playerId,
    executedAt: Date.now(),
  }
);

// Cleanup old commands (1 hour)
const oldCommands = await databases.listDocuments(
  databaseId,
  'player_commands',
  [
    Query.lessThan('executedAt', Date.now() - 3600000),
  ]
);
```

### 5. venues

**Purpose**: Store venue configuration

**Schema**:
```typescript
interface Venue {
  $id: string;
  venueId: string;
  name: string;
  mode: 'FREEPLAY' | 'PAID';
  youtubeApiKey: string;
  creditCost: number;
  priorityCost: number;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}
```

**Indexes**:
- `venueId` (ascending, unique)
- `ownerId` (ascending)

**Operations**:
```typescript
// Create venue
await databases.createDocument(
  databaseId,
  'venues',
  ID.unique(),
  {
    venueId: generateVenueId(),
    name: 'My Venue',
    mode: 'FREEPLAY',
    youtubeApiKey: '',
    creditCost: 2,
    priorityCost: 5,
    ownerId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
);

// Update settings
await databases.updateDocument(
  databaseId,
  'venues',
  venueDocId,
  {
    name: 'Updated Name',
    mode: 'PAID',
    creditCost: 3,
    updatedAt: Date.now(),
  }
);
```

---

## Services API

### QueueService

**Purpose**: Manage song queue operations

**Methods**:

```typescript
class QueueService {
  constructor(client: Client);
  
  // Get queue for venue
  async getQueue(
    venueId: string,
    databaseId: string
  ): Promise<Track[]>;
  
  // Add track to queue
  async addTrack(
    venueId: string,
    track: Track,
    databaseId: string
  ): Promise<void>;
  
  // Remove track
  async removeTrack(
    trackId: string,
    databaseId: string
  ): Promise<void>;
  
  // Clear entire queue
  async clearQueue(
    venueId: string,
    databaseId: string
  ): Promise<void>;
  
  // Subscribe to queue changes
  subscribeToQueue(
    venueId: string,
    databaseId: string,
    client: Client,
    callback: (tracks: Track[]) => void
  ): () => void;
}
```

**Usage**:
```typescript
const queueService = new QueueService(client);

// Get current queue
const queue = await queueService.getQueue(venueId, databaseId);

// Add track
await queueService.addTrack(venueId, {
  videoId: 'abc123',
  title: 'Song Title',
  artist: 'Artist Name',
  duration: 180,
  position: queue.length + 1,
  isPriority: false,
  isRequest: true,
  requesterId: 'user123',
  addedAt: Date.now(),
}, databaseId);

// Subscribe to changes
const unsubscribe = queueService.subscribeToQueue(
  venueId,
  databaseId,
  client,
  (updatedQueue) => {
    console.log('Queue updated:', updatedQueue);
  }
);
```

### PlayerService

**Purpose**: Manage player instance lifecycle and master election

**Methods**:

```typescript
class PlayerService {
  constructor(client: Client);
  
  // Register player instance
  async registerPlayer(
    venueId: string,
    playerId: string,
    databaseId: string
  ): Promise<string>;
  
  // Send heartbeat
  async sendHeartbeat(
    instanceId: string,
    databaseId: string
  ): Promise<void>;
  
  // Check if master
  async checkMaster(
    venueId: string,
    playerId: string,
    databaseId: string
  ): Promise<boolean>;
  
  // Promote to master
  async promoteToMaster(
    instanceId: string,
    databaseId: string
  ): Promise<void>;
  
  // Cleanup expired instances
  async cleanupExpired(
    venueId: string,
    databaseId: string
  ): Promise<void>;
}
```

### PlayerSyncService

**Purpose**: Synchronize player state and commands

**Methods**:

```typescript
class PlayerSyncService {
  constructor(client: Client);
  
  // Update player state (master only)
  async updatePlayerState(
    venueId: string,
    playerId: string,
    state: Partial<PlayerStateDocument>,
    databaseId: string
  ): Promise<void>;
  
  // Get current state
  async getPlayerState(
    venueId: string,
    databaseId: string
  ): Promise<PlayerStateDocument | null>;
  
  // Subscribe to state changes
  subscribeToPlayerState(
    venueId: string,
    databaseId: string,
    client: Client,
    callback: (state: PlayerStateDocument) => void
  ): () => void;
  
  // Issue command (admin)
  async issueCommand(
    command: string,
    venueId: string,
    payload: any,
    issuedBy: string,
    databaseId: string
  ): Promise<void>;
  
  // Subscribe to commands (master)
  subscribeToCommands(
    venueId: string,
    databaseId: string,
    client: Client,
    callback: (command: PlayerCommand) => void
  ): () => void;
  
  // Mark command executed
  async markCommandExecuted(
    commandId: string,
    executedBy: string,
    databaseId: string
  ): Promise<void>;
}
```

### YouTubeSearchService

**Purpose**: Search YouTube for music videos

**Methods**:

```typescript
class YouTubeSearchService {
  constructor(apiKey: string);
  
  // Search for videos
  async search(
    query: string,
    maxResults?: number
  ): Promise<YouTubeVideo[]>;
  
  // Get video details
  async getVideoDetails(
    videoId: string
  ): Promise<YouTubeVideo>;
}
```

**Usage**:
```typescript
const searchService = new YouTubeSearchService(apiKey);

// Search
const results = await searchService.search('jazz music', 10);

// Get details
const video = await searchService.getVideoDetails('abc123');
```

---

## Real-Time Subscriptions

### AppWrite Realtime API

**Subscribe to Collection**:
```typescript
const unsubscribe = client.subscribe(
  `databases.${databaseId}.collections.${collectionId}.documents`,
  (response) => {
    // Handle create/update/delete events
    if (response.events.includes('*.create')) {
      console.log('Document created:', response.payload);
    }
  }
);

// Unsubscribe when done
unsubscribe();
```

### Queue Updates

```typescript
// Subscribe to queue changes
const unsubscribe = client.subscribe(
  `databases.${databaseId}.collections.queues.documents`,
  (response) => {
    if (response.payload.venueId === venueId) {
      // Refresh queue
      loadQueue();
    }
  }
);
```

### Player State Sync

```typescript
// Subscribe to state updates
const unsubscribe = client.subscribe(
  `databases.${databaseId}.collections.player_state.documents`,
  (response) => {
    if (response.payload.venueId === venueId) {
      setPlayerState(response.payload);
    }
  }
);
```

### Command Dispatch

```typescript
// Master subscribes to commands
const unsubscribe = client.subscribe(
  `databases.${databaseId}.collections.player_commands.documents`,
  (response) => {
    const command = response.payload;
    
    if (
      command.venueId === venueId &&
      !command.executedBy &&
      response.events.includes('*.create')
    ) {
      // Execute command
      executeCommand(command);
      
      // Mark as executed
      markCommandExecuted(command.$id);
    }
  }
);
```

---

## YouTube API Integration

### YouTube Data API v3

**Base URL**: `https://www.googleapis.com/youtube/v3`

**Authentication**: API Key (passed as `key` parameter)

### Search Endpoint

**URL**: `GET /search`

**Parameters**:
- `part`: snippet
- `q`: Search query
- `type`: video
- `videoCategoric`: 10 (Music)
- `maxResults`: 1-50
- `key`: Your API key

**Request**:
```http
GET https://www.googleapis.com/youtube/v3/search?part=snippet&q=jazz+music&type=video&videoCategoryId=10&maxResults=10&key=YOUR_API_KEY
```

**Response**:
```json
{
  "items": [
    {
      "id": {
        "videoId": "abc123"
      },
      "snippet": {
        "title": "Smooth Jazz Music",
        "description": "...",
        "thumbnails": {
          "default": { "url": "..." },
          "medium": { "url": "..." },
          "high": { "url": "..." }
        },
        "channelTitle": "Jazz Channel"
      }
    }
  ]
}
```

### Videos Endpoint

**URL**: `GET /videos`

**Parameters**:
- `part`: snippet,contentDetails
- `id`: Video ID
- `key`: Your API key

**Request**:
```http
GET https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=abc123&key=YOUR_API_KEY
```

**Response**:
```json
{
  "items": [
    {
      "id": "abc123",
      "snippet": {
        "title": "Song Title",
        "channelTitle": "Artist Name"
      },
      "contentDetails": {
        "duration": "PT3M45S"
      }
    }
  ]
}
```

### Quota Limits

**Free Tier**:
- 10,000 queries/day
- Search: 100 units
- Videos: 1 unit

**Typical Usage**:
- Search with 10 results: 100 units
- ~100 searches per day on free tier
- Sufficient for most small-medium venues

**Upgrade**:
- Request quota increase in Google Cloud Console
- Or implement result caching
- Or use multiple API keys

---

## Error Handling

### AppWrite Errors

```typescript
try {
  await databases.createDocument(...);
} catch (error) {
  if (error.code === 401) {
    // Unauthorized
  } else if (error.code === 404) {
    // Document not found
  } else if (error.code === 409) {
    // Conflict
  }
}
```

### YouTube API Errors

```typescript
try {
  const results = await searchService.search(query);
} catch (error) {
  if (error.code === 403) {
    // API quota exceeded or invalid key
  } else if (error.code === 400) {
    // Invalid request
  }
}
```

---

## Rate Limiting

### AppWrite

- No hard limits on free tier
- Recommended: Max 10 requests/second per user
- Use batching when possible
- Cache frequently accessed data

### YouTube API

- 10,000 queries/day (free tier)
- Implement caching
- Queue search requests
- Show "Loading..." state

---

## Security Best Practices

### API Keys

- Store in environment variables
- Never commit to git
- Rotate regularly
- Use different keys per environment

### AppWrite

- Use JWT tokens for authentication
- Implement proper permission rules
- Validate all inputs
- Sanitize user data

### Data Validation

```typescript
// Validate venue ID
const venueIdRegex = /^[a-z0-9-]{3,36}$/;
if (!venueIdRegex.test(venueId)) {
  throw new Error('Invalid venue ID');
}

// Sanitize search query
const sanitized = query.trim().slice(0, 100);
```

---

## Appendix

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

### WebSocket Events

| Event | Description |
|-------|-------------|
| *.create | Document created |
| *.update | Document updated |
| *.delete | Document deleted |

---

**Version**: 1.0  
**Last Updated**: January 2025  
**For**: DJAMMS API v1.0
