# Playlist Integration Guide

Complete implementation plan for integrating the default playlist (58 tracks) with venue creation and player initialization.

## Table of Contents
1. [Overview](#overview)
2. [Default Playlist Details](#default-playlist-details)
3. [Integration Point 1: Venue Creation](#integration-point-1-venue-creation)
4. [Integration Point 2: Player Initialization](#integration-point-2-player-initialization)
5. [Integration Point 3: Admin UI](#integration-point-3-admin-ui)
6. [Testing Procedures](#testing-procedures)
7. [Code Examples](#code-examples)

---

## Overview

### Current State
- ✅ Default playlist exists in AppWrite with document ID: `default_playlist`
- ✅ Contains 58 tracks from YouTube playlist
- ✅ Each track includes: videoId, title, channelTitle, thumbnail, duration, position
- ⏳ Not yet integrated with venue/player systems

### Integration Goals
1. Automatically populate new venues with default playlist
2. Initialize player queues with default playlist when empty
3. Provide admin UI for playlist management

### Architecture
```
User Creates Venue
       ↓
Admin Service → Fetch default_playlist → Create queue document
       ↓
Venue Ready with 58 tracks

User Opens Player
       ↓
Player Service → Check for queue → If empty: Create with default_playlist
       ↓
Player loads with music
```

---

## Default Playlist Details

### Database Location
```
Database:    djamms-prototype
Collection:  playlists
Document ID: default_playlist
```

### Data Structure
```typescript
interface Playlist {
  $id: string;              // "default_playlist"
  name: string;             // "Default Venue Playlist"
  description: string;      // "Curated mix for new venues..."
  youtubePlaylistId: string; // "PLJ7vMjpVbhBWLWJpweVDki43Wlcqzsqdu"
  tracks: string;           // JSON array (stored as string per schema)
  trackCount: number;       // 58
  lastUpdated: string;      // ISO 8601 timestamp
  isDefault: boolean;       // true
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
}

interface Track {
  videoId: string;          // "dQw4w9WgXcQ"
  title: string;            // "Never Gonna Give You Up"
  channelTitle: string;     // "Rick Astley"
  thumbnail: string;        // "https://i.ytimg.com/vi/..."
  duration: number;         // Seconds (e.g., 213)
  position: number;         // 0-based index
  addedAt: string;          // ISO 8601 timestamp
}
```

### Usage Pattern
```javascript
// Fetch playlist
const playlist = await databases.getDocument(
  DATABASE_ID,
  'playlists',
  'default_playlist'
);

// Parse tracks (stored as JSON string)
const tracks = JSON.parse(playlist.tracks);

// Use in queue
const queueData = {
  venueId: newVenueId,
  mainQueue: playlist.tracks, // Store as string
  priorityQueue: '[]',
  currentTrack: tracks[0]?.videoId || null,
  // ... other fields
};
```

---

## Integration Point 1: Venue Creation

### Location
`apps/admin/src/services/venueService.ts`

### Implementation

#### Step 1: Find Venue Creation Method
Look for method like `createVenue()` or `addVenue()`

#### Step 2: Add Queue Creation Logic
After venue document is created, add:

```typescript
// In venueService.ts or equivalent

import { databases, DATABASE_ID } from '@djamms/appwrite-client';
import { ID } from 'appwrite';

async function createVenueWithPlaylist(venueData: VenueInput) {
  try {
    // 1. Create venue document
    const venue = await databases.createDocument(
      DATABASE_ID,
      'venues',
      ID.unique(),
      {
        name: venueData.name,
        address: venueData.address,
        ownerId: venueData.ownerId,
        timezone: venueData.timezone || 'America/New_York',
        // ... other venue fields
      }
    );

    console.log(`✓ Venue created: ${venue.$id}`);

    // 2. Fetch default playlist
    const playlist = await databases.getDocument(
      DATABASE_ID,
      'playlists',
      'default_playlist'
    );

    console.log(`✓ Default playlist fetched: ${playlist.trackCount} tracks`);

    // 3. Parse first track for currentTrack
    const tracks = JSON.parse(playlist.tracks);
    const firstTrack = tracks[0] || null;

    // 4. Create queue with default playlist
    const queue = await databases.createDocument(
      DATABASE_ID,
      'queues',
      ID.unique(),
      {
        venueId: venue.$id,
        mainQueue: playlist.tracks,        // JSON string
        priorityQueue: '[]',               // Empty array as string
        currentTrack: firstTrack?.videoId || null,
        currentTrackStartedAt: null,
        isPlaying: false,
        volume: 80,
        crossfadeDuration: 3,
        autoplay: true,
        lastHeartbeat: new Date().toISOString(),
      }
    );

    console.log(`✓ Queue created: ${queue.$id} with ${tracks.length} tracks`);

    return {
      venue,
      queue,
      tracksAdded: tracks.length
    };

  } catch (error) {
    console.error('Failed to create venue with playlist:', error);
    throw error;
  }
}
```

#### Step 3: Error Handling
If playlist fetch fails, still create venue but log warning:

```typescript
try {
  const playlist = await databases.getDocument(DATABASE_ID, 'playlists', 'default_playlist');
  // ... create queue
} catch (playlistError) {
  console.warn('Could not load default playlist, venue created without queue:', playlistError);
  // Venue still exists, queue can be added later
}
```

#### Step 4: Update Admin UI
In venue creation form/component:
```typescript
// apps/admin/src/components/VenueForm.tsx

const handleSubmit = async (formData) => {
  setLoading(true);
  try {
    const result = await createVenueWithPlaylist(formData);
    
    toast.success(
      `Venue created with ${result.tracksAdded} tracks!`,
      { description: 'Ready to start playing music' }
    );
    
    navigate(`/admin/venues/${result.venue.$id}`);
  } catch (error) {
    toast.error('Failed to create venue');
  } finally {
    setLoading(false);
  }
};
```

---

## Integration Point 2: Player Initialization

### Location
`apps/player/src/services/playerService.ts` or `apps/player/src/hooks/usePlayer.ts`

### Implementation

#### Step 1: Find Player Init Logic
Look for:
- `useEffect` that loads venue data
- `initializePlayer()` method
- Queue loading logic

#### Step 2: Add Queue Check
```typescript
// In player initialization

async function initializePlayerQueue(venueId: string) {
  try {
    // 1. Check if venue has queue
    const queues = await databases.listDocuments(
      DATABASE_ID,
      'queues',
      [Query.equal('venueId', venueId)]
    );

    if (queues.documents.length > 0) {
      console.log(`✓ Queue exists for venue: ${venueId}`);
      return queues.documents[0]; // Use existing queue
    }

    // 2. No queue exists - create one with default playlist
    console.log(`⚠ No queue found for venue ${venueId}, creating with default playlist...`);

    const playlist = await databases.getDocument(
      DATABASE_ID,
      'playlists',
      'default_playlist'
    );

    const tracks = JSON.parse(playlist.tracks);
    const firstTrack = tracks[0] || null;

    const newQueue = await databases.createDocument(
      DATABASE_ID,
      'queues',
      ID.unique(),
      {
        venueId: venueId,
        mainQueue: playlist.tracks,
        priorityQueue: '[]',
        currentTrack: firstTrack?.videoId || null,
        currentTrackStartedAt: null,
        isPlaying: false,
        volume: 80,
        crossfadeDuration: 3,
        autoplay: true,
        lastHeartbeat: new Date().toISOString(),
      }
    );

    console.log(`✓ Queue created with ${tracks.length} default tracks`);
    return newQueue;

  } catch (error) {
    console.error('Failed to initialize player queue:', error);
    throw error;
  }
}

// Usage in player component
useEffect(() => {
  async function loadPlayer() {
    if (!venueId) return;
    
    try {
      const queue = await initializePlayerQueue(venueId);
      setCurrentQueue(queue);
      
      // Parse and set tracks
      const tracks = JSON.parse(queue.mainQueue);
      setMainQueue(tracks);
      
      if (queue.currentTrack) {
        loadVideo(queue.currentTrack);
      }
    } catch (error) {
      setError('Failed to load player');
    }
  }
  
  loadPlayer();
}, [venueId]);
```

#### Step 3: Real-time Sync
Ensure queue updates sync via AppWrite Realtime:
```typescript
// Subscribe to queue updates
useEffect(() => {
  if (!queueId) return;

  const unsubscribe = client.subscribe(
    `databases.${DATABASE_ID}.collections.queues.documents.${queueId}`,
    (response) => {
      console.log('Queue updated:', response);
      
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        const updatedQueue = response.payload;
        setMainQueue(JSON.parse(updatedQueue.mainQueue));
        setCurrentTrack(updatedQueue.currentTrack);
      }
    }
  );

  return () => unsubscribe();
}, [queueId]);
```

---

## Integration Point 3: Admin UI

### Location
`apps/admin/src/pages/Playlists.tsx` (new file)

### Implementation

#### Step 1: Create Playlists Page
```typescript
// apps/admin/src/pages/Playlists.tsx

import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID } from '@djamms/appwrite-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Music, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Track {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: number;
  position: number;
  addedAt: string;
}

interface Playlist {
  $id: string;
  name: string;
  description: string;
  youtubePlaylistId: string;
  tracks: string;
  trackCount: number;
  lastUpdated: string;
  $updatedAt: string;
}

export default function PlaylistsPage() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlaylist();
  }, []);

  async function loadPlaylist() {
    try {
      setLoading(true);
      const data = await databases.getDocument(
        DATABASE_ID,
        'playlists',
        'default_playlist'
      );
      setPlaylist(data as Playlist);
      setTracks(JSON.parse(data.tracks));
    } catch (error) {
      toast.error('Failed to load playlist');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshPlaylist() {
    try {
      setRefreshing(true);
      toast.info('Refreshing playlist from YouTube...');
      
      // Call refresh script (or API endpoint that triggers it)
      const response = await fetch('/api/refresh-playlist', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadPlaylist();
        toast.success('Playlist refreshed successfully!');
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      toast.error('Failed to refresh playlist');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">No Playlist Found</h2>
          <p className="text-gray-600 mb-4">
            The default playlist hasn't been created yet.
          </p>
          <Button onClick={refreshPlaylist}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Create Default Playlist
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>
          <p className="text-gray-600">{playlist.description}</p>
        </div>
        <Button 
          onClick={refreshPlaylist} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh from YouTube
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <Music className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-600">Total Tracks</p>
              <p className="text-2xl font-bold">{playlist.trackCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold">
                {Math.floor(tracks.reduce((sum, t) => sum + t.duration, 0) / 60)} min
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-2xl font-bold">
                {new Date(playlist.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Track List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Tracks</h2>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div 
              key={track.videoId}
              className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition"
            >
              <span className="text-gray-400 font-mono text-sm w-8">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <img 
                src={track.thumbnail} 
                alt={track.title}
                className="w-16 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <p className="text-sm text-gray-600 truncate">{track.channelTitle}</p>
              </div>
              <span className="text-sm text-gray-500 font-mono">
                {formatDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* YouTube Link */}
      <div className="mt-6 text-center">
        <a
          href={`https://www.youtube.com/playlist?list=${playlist.youtubePlaylistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 underline"
        >
          View on YouTube →
        </a>
      </div>
    </div>
  );
}
```

#### Step 2: Add Route
```typescript
// apps/admin/src/App.tsx or router config

import PlaylistsPage from './pages/Playlists';

// Add to routes
<Route path="/admin/playlists" element={<PlaylistsPage />} />
```

#### Step 3: Add Navigation Link
```typescript
// apps/admin/src/components/Sidebar.tsx

<NavLink to="/admin/playlists">
  <Music className="w-5 h-5" />
  <span>Playlists</span>
</NavLink>
```

---

## Testing Procedures

### Test 1: Venue Creation with Playlist
```bash
# 1. Navigate to admin dashboard
open https://admin.djamms.app

# 2. Click "Create Venue"
# 3. Fill in venue details:
#    - Name: "Test Venue"
#    - Address: "123 Test St"
#    - Timezone: "America/New_York"

# 4. Submit form

# Expected Results:
# ✓ Venue created successfully
# ✓ Toast shows "Venue created with 58 tracks!"
# ✓ Redirects to venue detail page

# 5. Verify in AppWrite Console
# - queues collection has new document
# - venueId matches new venue
# - mainQueue contains JSON with 58 tracks
# - currentTrack is first video ID

# 6. Check browser console
# Should see:
# ✓ Venue created: [id]
# ✓ Default playlist fetched: 58 tracks
# ✓ Queue created: [id] with 58 tracks
```

### Test 2: Player with Existing Queue
```bash
# 1. Open player for venue with queue
open https://player.djamms.app?venueId=[venue-id]

# Expected Results:
# ✓ Player loads immediately
# ✓ Shows 58 tracks in queue
# ✓ First track ready to play
# ✓ Console shows: "✓ Queue exists for venue: [id]"
```

### Test 3: Player without Queue (Fallback)
```bash
# 1. Create venue WITHOUT queue (manually in AppWrite)
# 2. Open player for that venue
open https://player.djamms.app?venueId=[new-venue-id]

# Expected Results:
# ✓ Console shows: "⚠ No queue found, creating with default playlist..."
# ✓ Queue created automatically
# ✓ Player loads with 58 tracks
# ✓ Console shows: "✓ Queue created with 58 default tracks"
```

### Test 4: Admin Playlist UI
```bash
# 1. Navigate to playlists page
open https://admin.djamms.app/playlists

# Expected Results:
# ✓ Shows playlist name and description
# ✓ Displays stats: 58 tracks, total duration, last updated
# ✓ Lists all 58 tracks with thumbnails
# ✓ Shows track titles, artists, durations
# ✓ "Refresh from YouTube" button visible

# 2. Click "Refresh from YouTube"
# Expected:
# ✓ Shows loading state
# ✓ Calls refresh script
# ✓ Updates playlist data
# ✓ Shows success toast
```

### Test 5: Real-time Queue Sync
```bash
# 1. Open player in Browser A
# 2. Open dashboard in Browser B (same venue)
# 3. Add track to queue from dashboard
# 4. Check player in Browser A

# Expected Results:
# ✓ Player automatically updates with new track
# ✓ No page refresh needed
# ✓ Real-time subscription working
```

---

## Code Examples

### Example: Get Default Playlist
```typescript
import { databases, DATABASE_ID } from '@djamms/appwrite-client';

async function getDefaultPlaylist() {
  const playlist = await databases.getDocument(
    DATABASE_ID,
    'playlists',
    'default_playlist'
  );
  
  return {
    ...playlist,
    tracks: JSON.parse(playlist.tracks) // Parse JSON string
  };
}
```

### Example: Create Queue with Playlist
```typescript
import { databases, DATABASE_ID } from '@djamms/appwrite-client';
import { ID } from 'appwrite';

async function createQueueWithDefaultPlaylist(venueId: string) {
  const playlist = await getDefaultPlaylist();
  const firstTrack = playlist.tracks[0];

  return await databases.createDocument(
    DATABASE_ID,
    'queues',
    ID.unique(),
    {
      venueId,
      mainQueue: JSON.stringify(playlist.tracks), // Store as string
      priorityQueue: '[]',
      currentTrack: firstTrack.videoId,
      currentTrackStartedAt: null,
      isPlaying: false,
      volume: 80,
      crossfadeDuration: 3,
      autoplay: true,
      lastHeartbeat: new Date().toISOString(),
    }
  );
}
```

### Example: Add Track to Queue
```typescript
async function addTrackToQueue(queueId: string, newTrack: Track) {
  // Fetch current queue
  const queue = await databases.getDocument(DATABASE_ID, 'queues', queueId);
  
  // Parse existing tracks
  const tracks = JSON.parse(queue.mainQueue);
  
  // Add new track
  tracks.push({
    ...newTrack,
    position: tracks.length,
    addedAt: new Date().toISOString()
  });
  
  // Update queue
  await databases.updateDocument(
    DATABASE_ID,
    'queues',
    queueId,
    { mainQueue: JSON.stringify(tracks) }
  );
}
```

### Example: Remove Track from Queue
```typescript
async function removeTrackFromQueue(queueId: string, videoId: string) {
  const queue = await databases.getDocument(DATABASE_ID, 'queues', queueId);
  let tracks = JSON.parse(queue.mainQueue);
  
  // Remove track
  tracks = tracks.filter(t => t.videoId !== videoId);
  
  // Re-index positions
  tracks = tracks.map((t, index) => ({ ...t, position: index }));
  
  await databases.updateDocument(
    DATABASE_ID,
    'queues',
    queueId,
    { mainQueue: JSON.stringify(tracks) }
  );
}
```

---

## Summary

### Implementation Checklist
- [ ] **Venue Service**: Add queue creation with default playlist
- [ ] **Player Service**: Add queue initialization fallback
- [ ] **Admin Page**: Create playlists UI
- [ ] **Router**: Add /admin/playlists route
- [ ] **Navigation**: Add playlists link to sidebar
- [ ] **Test**: Create venue → verify queue
- [ ] **Test**: Load player → verify tracks
- [ ] **Test**: Admin UI → verify display
- [ ] **Test**: Real-time sync working

### Files to Modify
1. `apps/admin/src/services/venueService.ts` - Add queue creation
2. `apps/player/src/services/playerService.ts` - Add queue initialization
3. `apps/admin/src/pages/Playlists.tsx` - Create new page (NEW FILE)
4. `apps/admin/src/App.tsx` - Add route
5. `apps/admin/src/components/Sidebar.tsx` - Add nav link

### Dependencies
- All packages already installed
- YouTube API key already configured
- AppWrite database schema already includes required collections

### Estimated Time
- Venue integration: 30 minutes
- Player integration: 45 minutes
- Admin UI: 1-2 hours
- Testing: 30 minutes
- **Total: ~3 hours**

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Implementation
