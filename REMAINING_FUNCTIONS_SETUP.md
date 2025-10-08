# 🔧 Setup Guide for Remaining 3 Functions

**Date:** October 8, 2025  
**Status:** Ready for Deployment  
**Priority:** OPTIONAL (for enhanced features)

---

## 📋 Functions Overview

| Function | Purpose | Priority | Dependencies | Complexity |
|----------|---------|----------|--------------|------------|
| **addSongToPlaylist** | Add songs with FFmpeg silence detection | Medium | yt-dlp, ffmpeg, node-appwrite | High |
| **processRequest** | Process paid song requests | Medium | uuid, node-appwrite | Medium |
| **nightlyBatch** | Batch process songs for silence detection | Low | yt-dlp, ffmpeg, node-appwrite | High |

---

## ⚠️ IMPORTANT: System Requirements

These functions require **additional system binaries** that are **NOT available** in standard AppWrite Cloud Functions runtime:

### Required System Tools:
- ✅ **node-appwrite** - Available (npm package)
- ❌ **yt-dlp** - Requires system binary installation
- ❌ **ffmpeg/ffprobe** - Requires system binary installation

### ⚠️ Deployment Warning

**These functions CANNOT run on AppWrite Cloud** without custom runtime configuration because:
1. They use `execSync()` to call system binaries
2. `yt-dlp` and `ffmpeg` are not pre-installed in AppWrite Cloud Functions runtime
3. Functions would need Docker containers with custom base images

### 🎯 Recommended Approach

**Option A: Skip These Functions (Recommended for Now)**
- Focus on core functionality (auth + player registry)
- Add silence detection as a future enhancement
- Use full song durations without FFmpeg processing

**Option B: Simplify Functions (Remove FFmpeg)**
- Remove silence detection code
- Use YouTube API for metadata only
- Add FFmpeg processing later via self-hosted functions

**Option C: Self-Host Functions (Advanced)**
- Deploy on your own infrastructure with Docker
- Install yt-dlp and ffmpeg in container
- Connect to AppWrite database via API

---

## 📦 Function 1: addSongToPlaylist

### Purpose
Adds a song to a playlist with optional FFmpeg silence detection to trim silence at the end.

### Environment Variables Required

```bash
# In AppWrite Console → Functions → addSongToPlaylist → Settings
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=<your_api_key>  # Same as other functions
```

### Dependencies (package.json)

```json
{
  "name": "add-song-to-playlist-function",
  "version": "1.0.0",
  "description": "Add song to playlist with silence detection",
  "main": "src/main.js",
  "scripts": {
    "test": "echo \"No tests\" && exit 0"
  },
  "dependencies": {
    "node-appwrite": "^14.2.0"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Function Code (Cloud Functions v5 Format)

**Create: `functions/appwrite/functions/addSongToPlaylist/src/main.js`**

```javascript
const { Client, Databases } = require('node-appwrite');

/**
 * Add song to playlist (simplified - no FFmpeg)
 * Cloud Functions v5 format
 */
module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const body = req.bodyJson || JSON.parse(req.body || '{}');
    const { playlistId, song } = body;

    if (!playlistId || !song) {
      return res.json(
        { success: false, error: 'Missing playlistId or song' },
        400
      );
    }

    log(`Adding song to playlist ${playlistId}: ${song.title}`);

    // Get playlist
    const playlist = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId
    );

    // Parse tracks
    const tracks = JSON.parse(playlist.tracks || '[]');

    // Add new song (using full duration, no FFmpeg processing)
    tracks.push({
      ...song,
      realEndOffset: song.duration, // Use full duration
      addedAt: new Date().toISOString()
    });

    // Update playlist
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId,
      {
        tracks: JSON.stringify(tracks),
        updatedAt: new Date().toISOString(),
      }
    );

    log(`Song added successfully. Playlist now has ${tracks.length} tracks.`);

    return res.json({
      success: true,
      trackCount: tracks.length,
      realEndOffset: song.duration
    });

  } catch (err) {
    error('Add song failed: ' + err.message);
    return res.json(
      { success: false, error: err.message },
      500
    );
  }
};
```

### Deployment Steps

```bash
# 1. Navigate to functions directory
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# 2. Create function via AppWrite CLI
appwrite init function

# When prompted:
# - Function Name: addSongToPlaylist
# - Runtime: node-18.0 or node-20.0
# - Entrypoint: src/main.js

# 3. Copy the simplified code above to:
# functions/addSongToPlaylist/src/main.js

# 4. Update package.json (remove "type": "module")
# functions/addSongToPlaylist/package.json

# 5. Deploy
appwrite push function --function-id <FUNCTION_ID_FROM_STEP_2>

# 6. Add environment variables via AppWrite Console
# Functions → addSongToPlaylist → Settings → Variables
```

### Testing

```bash
# Test adding a song
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/<FUNCTION_ID>/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{
    "body": "{
      \"playlistId\": \"playlist123\",
      \"song\": {
        \"videoId\": \"dQw4w9WgXcQ\",
        \"title\": \"Test Song\",
        \"artist\": \"Test Artist\",
        \"duration\": 213
      }
    }"
  }'
```

---

## 📦 Function 2: processRequest

### Purpose
Processes paid song requests and adds them to the priority queue with validation.

### Environment Variables Required

```bash
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=<your_api_key>
```

### Dependencies (package.json)

```json
{
  "name": "process-request-function",
  "version": "1.0.0",
  "description": "Process paid song requests",
  "main": "src/main.js",
  "scripts": {
    "test": "echo \"No tests\" && exit 0"
  },
  "dependencies": {
    "node-appwrite": "^14.2.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Function Code (Cloud Functions v5 Format)

**Create: `functions/appwrite/functions/processRequest/src/main.js`**

```javascript
const { Client, Databases, Query } = require('node-appwrite');
const { v4: uuidv4 } = require('uuid');

/**
 * Process paid song request and add to priority queue
 * Cloud Functions v5 format
 */
module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const body = req.bodyJson || JSON.parse(req.body || '{}');
    const { venueId, song, paymentId, requesterId } = body;

    if (!venueId || !song || !paymentId || !requesterId) {
      return res.json(
        { success: false, error: 'Missing required fields' },
        400
      );
    }

    log(`Processing request for venue ${venueId}: ${song.title}`);

    // Validate song duration (<5 minutes)
    if (song.duration > 300) {
      return res.json(
        { success: false, error: 'Song duration exceeds 5 minutes' },
        400
      );
    }

    // Check for too many requests from same artist in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    try {
      const recentRequests = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'requests',
        [
          Query.equal('venueId', venueId),
          Query.greaterThan('timestamp', thirtyMinutesAgo),
        ]
      );

      const sameArtistCount = recentRequests.documents.filter((req) => {
        const reqSong = typeof req.song === 'string' ? JSON.parse(req.song) : req.song;
        return reqSong.artist === song.artist;
      }).length;

      if (sameArtistCount >= 3) {
        return res.json(
          { success: false, error: 'Too many requests for this artist in the last 30 minutes' },
          429
        );
      }
    } catch (queryError) {
      log('Warning: Could not check recent requests: ' + queryError.message);
    }

    // Get venue queue
    let queue;
    try {
      const queueDocs = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'queues',
        [Query.equal('venueId', venueId)]
      );

      if (queueDocs.documents.length > 0) {
        queue = queueDocs.documents[0];
      } else {
        // Create new queue
        queue = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          'queues',
          'unique()',
          {
            venueId,
            mainQueue: JSON.stringify([]),
            priorityQueue: JSON.stringify([]),
            createdAt: new Date().toISOString(),
          }
        );
      }
    } catch (queueError) {
      error('Failed to get/create queue: ' + queueError.message);
      return res.json(
        { success: false, error: 'Queue access failed' },
        500
      );
    }

    // Parse queues
    const priorityQueue = JSON.parse(queue.priorityQueue || '[]');

    // Add to priority queue
    const newRequest = {
      ...song,
      requesterId,
      paymentId,
      paidCredit: 0.5,
      position: priorityQueue.length + 1,
      isRequest: true,
      timestamp: new Date().toISOString()
    };

    priorityQueue.push(newRequest);

    // Update queue
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'queues',
      queue.$id,
      {
        priorityQueue: JSON.stringify(priorityQueue),
        updatedAt: new Date().toISOString(),
      }
    );

    // Create request record
    const requestRecord = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'requests',
      'unique()',
      {
        requestId: uuidv4(),
        venueId,
        song: JSON.stringify(song),
        requesterId,
        paymentId,
        status: 'queued',
        timestamp: new Date().toISOString(),
      }
    );

    log(`Request processed successfully. Queue position: ${priorityQueue.length}`);

    return res.json({
      success: true,
      requestId: requestRecord.requestId,
      queuePosition: priorityQueue.length,
      estimatedWait: priorityQueue.length * 3.5 // Average song length
    });

  } catch (err) {
    error('Process request failed: ' + err.message);
    return res.json(
      { success: false, error: err.message },
      500
    );
  }
};
```

### Deployment Steps

```bash
# 1. Navigate to functions directory
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# 2. Create function
appwrite init function
# Name: processRequest
# Runtime: node-18.0 or node-20.0
# Entrypoint: src/main.js

# 3. Copy code to functions/processRequest/src/main.js

# 4. Update package.json (remove "type": "module", add uuid)

# 5. Install dependencies
cd functions/processRequest
npm install uuid

# 6. Deploy
cd ../..
appwrite push function --function-id <FUNCTION_ID>

# 7. Add environment variables via Console
```

### Testing

```bash
# Test processing a request
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/<FUNCTION_ID>/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{
    "body": "{
      \"venueId\": \"venue1\",
      \"song\": {
        \"videoId\": \"dQw4w9WgXcQ\",
        \"title\": \"Test Song\",
        \"artist\": \"Test Artist\",
        \"duration\": 213
      },
      \"paymentId\": \"pi_123456\",
      \"requesterId\": \"user123\"
    }"
  }'
```

---

## 📦 Function 3: nightlyBatch

### Purpose
Scheduled batch processing to add silence detection data to songs (requires FFmpeg).

### Environment Variables Required

```bash
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=<your_api_key>
```

### ⚠️ Special Note

This function is **scheduled** (runs automatically) rather than triggered by HTTP requests.

**AppWrite Schedule Configuration:**
- Schedule: `0 2 * * *` (Daily at 2 AM)
- Timeout: 900 seconds (15 minutes)

### Dependencies (package.json)

```json
{
  "name": "nightly-batch-function",
  "version": "1.0.0",
  "description": "Nightly batch processing for silence detection",
  "main": "src/main.js",
  "scripts": {
    "test": "echo \"No tests\" && exit 0"
  },
  "dependencies": {
    "node-appwrite": "^14.2.0"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Function Code (Simplified - No FFmpeg)

**Create: `functions/appwrite/functions/nightlyBatch/src/main.js`**

```javascript
const { Client, Databases, Query } = require('node-appwrite');

/**
 * Nightly batch processing (simplified - no FFmpeg)
 * Cloud Functions v5 format
 */
module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    log('Starting nightly batch processing');

    // Get all playlists
    const playlists = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      [Query.limit(100)]
    );

    let processed = 0;
    let skipped = 0;

    for (const playlist of playlists.documents) {
      try {
        const tracks = JSON.parse(playlist.tracks || '[]');
        const tracksToProcess = tracks.filter((track) => !track.realEndOffset);

        if (tracksToProcess.length === 0) {
          skipped++;
          continue;
        }

        log(`Processing ${tracksToProcess.length} tracks in playlist ${playlist.$id}`);

        // For now, just set realEndOffset to duration
        // (FFmpeg processing would go here if available)
        for (const track of tracksToProcess) {
          track.realEndOffset = track.duration;
          processed++;
        }

        // Update playlist
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'playlists',
          playlist.$id,
          {
            tracks: JSON.stringify(tracks),
            updatedAt: new Date().toISOString(),
          }
        );

      } catch (playlistError) {
        error(`Failed to process playlist ${playlist.$id}: ${playlistError.message}`);
      }
    }

    const result = {
      success: true,
      processed,
      skipped,
      totalPlaylists: playlists.documents.length,
      timestamp: new Date().toISOString(),
    };

    log(`Batch complete: ${processed} tracks processed, ${skipped} playlists skipped`);

    return res.json(result);

  } catch (err) {
    error('Nightly batch failed: ' + err.message);
    return res.json(
      {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};
```

### Deployment Steps

```bash
# 1. Create function
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite
appwrite init function
# Name: nightlyBatch
# Runtime: node-18.0 or node-20.0
# Entrypoint: src/main.js

# 2. Copy code to functions/nightlyBatch/src/main.js

# 3. Update package.json

# 4. Deploy
appwrite push function --function-id <FUNCTION_ID>

# 5. Configure schedule in AppWrite Console:
# Functions → nightlyBatch → Settings → Schedule
# Cron: 0 2 * * * (Daily at 2 AM)
# Timeout: 900 seconds
```

### Testing

```bash
# Manual execution test
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/<FUNCTION_ID>/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{"body":"{}"}'
```

---

## 🚀 Quick Deployment Script

Save this as `deploy-remaining-functions.sh`:

```bash
#!/bin/bash

# Deploy remaining 3 functions
# Run from: /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

set -e

echo "🚀 Deploying remaining 3 functions..."

# Function 1: addSongToPlaylist
echo "📦 Creating addSongToPlaylist..."
appwrite init function
# Enter: addSongToPlaylist, node-18.0, src/main.js

# Function 2: processRequest  
echo "📦 Creating processRequest..."
appwrite init function
# Enter: processRequest, node-18.0, src/main.js

# Function 3: nightlyBatch
echo "📦 Creating nightlyBatch..."
appwrite init function
# Enter: nightlyBatch, node-18.0, src/main.js

echo ""
echo "✅ Functions created! Next steps:"
echo "1. Copy simplified code to each function's src/main.js"
echo "2. Update each package.json (remove 'type': 'module')"
echo "3. Install dependencies (npm install uuid for processRequest)"
echo "4. Deploy: appwrite push function --function-id <ID>"
echo "5. Add environment variables via Console"
echo ""
echo "📝 See REMAINING_FUNCTIONS_SETUP.md for detailed steps"
```

---

## 📊 Summary & Recommendations

### Current Status
- ✅ **magic-link**: DEPLOYED & WORKING
- ✅ **player-registry**: DEPLOYED (testing)
- 📦 **addSongToPlaylist**: Optional, simplified code ready
- 📦 **processRequest**: Optional, ready for deployment
- 📦 **nightlyBatch**: Optional, simplified code ready

### Recommendations

**For Immediate Testing:**
1. ✅ Use deployed magic-link and player-registry
2. ✅ Run E2E tests with these 2 functions
3. ⏭️ **Skip** the remaining 3 functions for now

**For Full Feature Set:**
1. Deploy **processRequest** (paid requests feature)
2. Skip **addSongToPlaylist** and **nightlyBatch** (require FFmpeg)
3. Add FFmpeg features later with self-hosted solution

**For Production:**
1. Consider self-hosting FFmpeg-dependent functions
2. Use AppWrite Cloud for database and auth only
3. Deploy worker functions on your own infrastructure with Docker

---

## 🎯 Next Actions

### Option A: Skip These Functions ✅ RECOMMENDED
```bash
# You're done! Test with existing functions
npm run test:e2e
```

### Option B: Deploy processRequest Only
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite
# Follow "Function 2: processRequest" steps above
```

### Option C: Deploy All 3 (Simplified)
```bash
# Follow deployment steps for each function
# Use simplified code provided (no FFmpeg)
# Set up environment variables
# Test each function individually
```

---

**✅ You're ready to decide which functions to deploy!**

**Questions to consider:**
- Do you need paid request processing? → Deploy `processRequest`
- Do you need silence detection? → Wait for self-hosted solution
- Want to test core functionality? → Skip all 3 for now ✅

