# DJAMMS I/O Reference: Cloud Functions Complete

**Document ID**: DJAMMS_IO_07  
**Category**: BY TYPE - Cloud Functions  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Table of Contents

1. [Cloud Functions Overview](#cloud-functions-overview)
2. [Function: magic-link](#function-magic-link)
3. [Function: player-registry](#function-player-registry)
4. [Function: processRequest](#function-processrequest)
5. [Function: addSongToPlaylist](#function-addsongtoplaylist)
6. [Function: nightlyBatch](#function-nightlybatch)
7. [Deployment & Configuration](#deployment--configuration)
8. [Error Handling](#error-handling)

---

## Cloud Functions Overview

### **Architecture**

DJAMMS uses **AppWrite Cloud Functions** (Node.js 18) for serverless backend logic:
- ✅ **Stateless** (no persistent server state)
- ✅ **Auto-scaling** (handles concurrent requests)
- ✅ **Event-driven** (HTTP triggers, scheduled jobs)
- ✅ **Secure** (API key authentication)

### **Function Inventory**

| Function | Purpose | Trigger | Timeout | Specification |
|----------|---------|---------|---------|---------------|
| **magic-link** | Passwordless auth | HTTP POST | 15s | 0.5vCPU, 512MB |
| **player-registry** | Master election | HTTP POST | 15s | 0.5vCPU, 512MB |
| **processRequest** | Paid song requests | HTTP POST | 15s | 0.5vCPU, 512MB |
| **addSongToPlaylist** | FFmpeg preprocessing | HTTP POST | 30s | 1vCPU, 1GB |
| **nightlyBatch** | Batch processing | Cron (2am) | 900s | 1vCPU, 2GB |

### **Environment Variables**

All functions share these environment variables:

```bash
# AppWrite connection
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_API_KEY=standard_...........................
APPWRITE_DATABASE_ID=68cc88c000254bb42b90

# Authentication
JWT_SECRET=your-256-bit-secret-key-here

# Feature flags
VITE_ALLOW_AUTO_CREATE_USERS=true
```

### **Execution Flow**

```
1. Client sends HTTP request → AppWrite endpoint
2. AppWrite validates API key → Check permissions
3. Execute function → Node.js runtime
4. Access AppWrite SDK → Databases, Storage, etc.
5. Return JSON response → Client
```

---

## Function: magic-link

### **Purpose**
Handle passwordless authentication via magic links (email-based one-time tokens).

### **Location**
`functions/appwrite/src/magic-link.js`

### **Configuration**

```json
{
  "$id": "68e5a317003c42c8bb6a",
  "name": "magic-link",
  "runtime": "node-18.0",
  "specification": "s-0.5vcpu-512mb",
  "timeout": 15,
  "execute": ["any"],
  "scopes": ["users.read"]
}
```

### **Entry Points**

#### **1. Create Magic Link**

```javascript
exports.createMagicURLSession = async ({ email, redirectUrl }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Generate secure token (32 bytes = 64 hex characters)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Store in database
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    'magicLinks',
    'unique()',
    {
      email,
      token,
      redirectUrl,
      expiresAt,
      used: false
    }
  );

  // Send email (placeholder - integrate with SendGrid/AWS SES)
  await sendMagicLinkEmail(email, token, redirectUrl);

  return { success: true, message: 'Magic link sent to your email' };
};
```

#### **2. Verify Magic Link**

```javascript
exports.handleMagicLinkCallback = async ({ secret, userId }) => {
  const databases = new Databases(client);

  // Find magic link (not used, not expired)
  const magicLinks = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    'magicLinks',
    [
      Query.equal('token', secret),
      Query.equal('used', false),
      Query.greaterThan('expiresAt', Date.now())
    ]
  );

  if (magicLinks.documents.length === 0) {
    throw new Error('Invalid or expired magic link');
  }

  const magicLink = magicLinks.documents[0];

  // Find or create user
  let user = await findUserByEmail(databases, magicLink.email);

  if (!user && process.env.VITE_ALLOW_AUTO_CREATE_USERS === 'true') {
    user = await createUser(databases, {
      userId: userId || crypto.randomUUID(),
      email: magicLink.email,
      role: 'staff',
      autoplay: true,
      createdAt: new Date().toISOString()
    });
  }

  if (!user) {
    throw new Error('User not found and auto-creation is disabled');
  }

  // Mark magic link as used (one-time use)
  await databases.updateDocument(
    process.env.APPWRITE_DATABASE_ID,
    'magicLinks',
    magicLink.$id,
    { used: true }
  );

  // Issue JWT token (7-day expiry)
  const token = jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      venueId: user.venueId,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user };
};
```

#### **3. Helper Functions**

```javascript
async function findUserByEmail(databases, email) {
  const users = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    'users',
    [Query.equal('email', email)]
  );

  return users.documents.length > 0 ? users.documents[0] : null;
}

async function createUser(databases, userData) {
  return await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    'users',
    'unique()',
    userData
  );
}

async function sendMagicLinkEmail(email, token, redirectUrl) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  const magicLinkUrl = `${redirectUrl}?secret=${token}&userId=${email}`;
  console.log(`Magic link for ${email}: ${magicLinkUrl}`);
  
  // Future implementation:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@djamms.app',
  //   subject: 'Sign in to DJAMMS',
  //   html: `<a href="${magicLinkUrl}">Click here to sign in</a>`
  // });
}
```

### **Request/Response**

#### **Create Request**

```http
POST /v1/functions/68e5a317003c42c8bb6a/executions
Content-Type: application/json
X-Appwrite-Project: 68cc86c3002b27e13947

{
  "body": "{\"action\":\"create\",\"email\":\"user@example.com\",\"redirectUrl\":\"https://www.djamms.app/auth/verify\"}"
}
```

#### **Create Response**

```json
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

#### **Verify Request**

```http
POST /v1/functions/68e5a317003c42c8bb6a/executions
Content-Type: application/json
X-Appwrite-Project: 68cc86c3002b27e13947

{
  "body": "{\"action\":\"verify\",\"secret\":\"abc123...\",\"userId\":\"user@example.com\"}"
}
```

#### **Verify Response**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "user-123",
    "email": "user@example.com",
    "venueId": "venue-456",
    "role": "staff",
    "autoplay": true
  }
}
```

---

## Function: player-registry

### **Purpose**
Manage master player election and heartbeat tracking for venue playback coordination.

### **Location**
`functions/appwrite/src/player-registry.js`

### **Configuration**

```json
{
  "$id": "68e5a41f00222cab705b",
  "name": "player-registry",
  "runtime": "node-18.0",
  "specification": "s-0.5vcpu-512mb",
  "timeout": 15,
  "execute": ["any"],
  "scopes": ["users.read"]
}
```

### **Entry Points**

#### **1. Register Master Player**

```javascript
exports.registerMasterPlayer = async ({ venueId, deviceId, userAgent }) => {
  const databases = new Databases(client);

  try {
    // Cleanup expired players first
    await cleanupExpiredPlayers(databases);

    // Check for existing active master
    const existingMaster = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      [Query.equal('venueId', venueId), Query.equal('status', 'active')]
    );

    if (existingMaster.documents.length > 0) {
      const currentMaster = existingMaster.documents[0];

      // If same device, reconnect
      if (currentMaster.deviceId === deviceId) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'players',
          currentMaster.$id,
          {
            lastHeartbeat: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,  // 24 hours
          }
        );
        return {
          status: 'reconnected',
          playerId: currentMaster.$id,
          currentMaster: {
            deviceId: currentMaster.deviceId,
            lastHeartbeat: currentMaster.lastHeartbeat,
          },
        };
      }

      // Check if master is still active (last heartbeat < 2 minutes)
      if (Date.now() - currentMaster.lastHeartbeat < 120000) {
        return {
          status: 'conflict',
          currentMaster: {
            deviceId: currentMaster.deviceId,
            lastHeartbeat: currentMaster.lastHeartbeat,
          },
        };
      }

      // Expire old master (stale heartbeat)
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        currentMaster.$id,
        {
          status: 'offline',
          expiresAt: Date.now(),
        }
      );
    }

    // Register new master player
    const player = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      'unique()',
      {
        venueId,
        deviceId,
        userAgent,
        status: 'active',
        lastHeartbeat: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: new Date().toISOString(),
      }
    );

    return { status: 'registered', playerId: player.$id };
  } catch (error) {
    console.error('Player registration failed:', error);
    throw error;
  }
};
```

#### **2. Handle Heartbeat**

```javascript
exports.handlePlayerHeartbeat = async ({ venueId, deviceId }) => {
  const databases = new Databases(client);

  try {
    const players = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      [
        Query.equal('venueId', venueId),
        Query.equal('deviceId', deviceId),
        Query.equal('status', 'active'),
      ]
    );

    if (players.documents.length > 0) {
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        players.documents[0].$id,
        {
          lastHeartbeat: Date.now(),
        }
      );
      return { status: 'updated' };
    }

    return { status: 'not_found' };
  } catch (error) {
    console.error('Heartbeat failed:', error);
    throw error;
  }
};
```

#### **3. Cleanup Expired Players**

```javascript
async function cleanupExpiredPlayers(databases) {
  try {
    const expiredPlayers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      [Query.lessThan('expiresAt', Date.now())]
    );

    for (const player of expiredPlayers.documents) {
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        player.$id,
        { status: 'offline' }
      );
    }

    return { cleaned: expiredPlayers.documents.length };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return { cleaned: 0 };
  }
}
```

### **Master Election Logic**

```
1. Check for existing master → Query players collection
2. If master exists:
   a. Same deviceId? → Reconnect (update heartbeat)
   b. Recent heartbeat (<2min)? → Conflict (reject)
   c. Stale heartbeat (>2min)? → Expire and register new
3. If no master → Register new master
```

### **Request/Response**

#### **Register Request**

```http
POST /v1/functions/68e5a41f00222cab705b/executions
Content-Type: application/json
X-Appwrite-Project: 68cc86c3002b27e13947

{
  "body": "{\"action\":\"register\",\"venueId\":\"venue-123\",\"deviceId\":\"device-456\",\"userAgent\":\"Mozilla/5.0...\"}"
}
```

#### **Register Response (Success)**

```json
{
  "status": "registered",
  "playerId": "68e5b12300456def7890"
}
```

#### **Register Response (Conflict)**

```json
{
  "status": "conflict",
  "currentMaster": {
    "deviceId": "device-789",
    "lastHeartbeat": 1728640500000
  }
}
```

#### **Heartbeat Request**

```http
POST /v1/functions/68e5a41f00222cab705b/executions
Content-Type: application/json
X-Appwrite-Project: 68cc86c3002b27e13947

{
  "body": "{\"action\":\"heartbeat\",\"venueId\":\"venue-123\",\"deviceId\":\"device-456\"}"
}
```

#### **Heartbeat Response**

```json
{
  "status": "updated"
}
```

---

## Function: processRequest

### **Purpose**
Process paid song requests and add them to the priority queue.

### **Location**
`functions/appwrite/src/processRequest.js`

### **Configuration**

```json
{
  "$id": "68e5acf100104d806321",
  "name": "processRequest",
  "runtime": "node-18.0",
  "specification": "s-0.5vcpu-512mb",
  "timeout": 15,
  "execute": ["any"],
  "scopes": ["users.read"]
}
```

### **Implementation**

```javascript
exports.main = async ({ venueId, song, paymentId, requesterId }) => {
  const databases = new Databases(client);

  try {
    // Validate song duration (<5 minutes = 300 seconds)
    if (song.duration > 300) {
      throw new Error('Song duration exceeds 5 minutes');
    }

    // Check for too many requests from same artist in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const recentRequests = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'requests',
      [
        Query.equal('venueId', venueId),
        Query.greaterThan('timestamp', thirtyMinutesAgo),
      ]
    );

    const sameArtistCount = recentRequests.documents.filter(
      (req) => {
        const reqSong = typeof req.song === 'string' ? JSON.parse(req.song) : req.song;
        return reqSong.artist === song.artist;
      }
    ).length;

    // Limit: 3 requests per artist per 30 minutes
    if (sameArtistCount >= 3) {
      throw new Error('Too many requests for this artist in the last 30 minutes');
    }

    // Get venue queue
    const queueDoc = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'queues',
      [Query.equal('venueId', venueId)]
    );

    let queue;
    if (queueDoc.documents.length > 0) {
      queue = queueDoc.documents[0];
    } else {
      // Create new queue if doesn't exist
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

    // Parse queues
    const priorityQueue = JSON.parse(queue.priorityQueue || '[]');
    const mainQueue = JSON.parse(queue.mainQueue || '[]');

    // Add to priority queue
    priorityQueue.push({
      ...song,
      requesterId,
      paidCredit: 0.5,  // Payment credit for queue ordering
      position: priorityQueue.length + 1,
      isRequest: true,
    });

    // Update queue document
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'queues',
      queue.$id,
      {
        priorityQueue: JSON.stringify(priorityQueue),
        updatedAt: new Date().toISOString(),
      }
    );

    // Create request record (for tracking/analytics)
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'requests',
      'unique()',
      {
        requestId: uuidv4(),
        venueId,
        song: JSON.stringify(song),
        status: 'pending',
        paymentId,
        timestamp: new Date().toISOString(),
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Request processing failed:', error);
    
    // TODO: Trigger refund via Stripe webhook
    // await refundPayment(paymentId);
    
    return { success: false, error: error.message };
  }
};
```

### **Business Rules**

| Rule | Constraint | Reason |
|------|-----------|--------|
| **Max duration** | 5 minutes (300s) | Prevent excessively long songs |
| **Artist rate limit** | 3 requests per 30 min | Prevent spamming same artist |
| **Payment credit** | 0.5 per request | Priority queue ordering weight |
| **Queue type** | Priority queue only | Paid requests jump the line |

### **Request/Response**

#### **Request**

```http
POST /v1/functions/68e5acf100104d806321/executions
Content-Type: application/json
X-Appwrite-Project: 68cc86c3002b27e13947

{
  "body": "{\"venueId\":\"venue-123\",\"song\":{\"videoId\":\"dQw4w9WgXcQ\",\"title\":\"Song Title\",\"artist\":\"Artist Name\",\"duration\":213},\"paymentId\":\"pi_abc123\",\"requesterId\":\"user-456\"}"
}
```

#### **Response (Success)**

```json
{
  "success": true
}
```

#### **Response (Error)**

```json
{
  "success": false,
  "error": "Too many requests for this artist in the last 30 minutes"
}
```

---

## Function: addSongToPlaylist

### **Purpose**
Add song to playlist with FFmpeg preprocessing for silence detection.

### **Location**
`functions/appwrite/src/addSongToPlaylist.js`

### **Configuration**

```json
{
  "name": "addSongToPlaylist",
  "runtime": "node-18.0",
  "specification": "s-1vcpu-1gb",
  "timeout": 30,
  "execute": ["any"]
}
```

### **Implementation**

```javascript
exports.main = async ({ playlistId, song }) => {
  const databases = new Databases(client);

  try {
    // Step 1: Get audio URL using yt-dlp
    const audioUrl = execSync(`yt-dlp --get-url "https://youtube.com/watch?v=${song.videoId}"`)
      .toString()
      .trim();

    // Step 2: Detect silence at end using FFmpeg
    const cmd = `ffprobe -f lavfi -i "amovie=${audioUrl},astats=metadata=1:reset=1,silencedetect=noise=-30dB:d=2" -show_entries frame=pkt_pts_time -of csv=p=0`;
    
    let realEndOffset = song.duration;  // Default to full duration
    
    try {
      const output = execSync(cmd, { timeout: 30000 }).toString().trim();
      
      // Parse silence detection output
      const silencePoints = output
        .split('\n')
        .map((line) => parseFloat(line))
        .filter((val) => !isNaN(val));

      // Use last silence point as real end
      if (silencePoints.length > 0) {
        realEndOffset = silencePoints[silencePoints.length - 1];
      }
    } catch (ffmpegError) {
      console.warn('FFmpeg processing failed, using full duration:', ffmpegError.message);
    }

    // Step 3: Update playlist
    const playlist = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId
    );

    const updatedTracks = JSON.parse(playlist.tracks || '[]');
    updatedTracks.push({
      ...song,
      realEndOffset,  // Detected end time
    });

    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId,
      {
        tracks: JSON.stringify(updatedTracks),
        updatedAt: new Date().toISOString(),
      }
    );

    return { success: true, realEndOffset };
  } catch (error) {
    console.error('Add song failed:', error);
    return { success: false, error: error.message };
  }
};
```

### **Request/Response**

#### **Request**

```http
POST /v1/functions/{functionId}/executions
Content-Type: application/json

{
  "body": "{\"playlistId\":\"playlist-123\",\"song\":{\"videoId\":\"dQw4w9WgXcQ\",\"title\":\"Song\",\"artist\":\"Artist\",\"duration\":213}}"
}
```

#### **Response**

```json
{
  "success": true,
  "realEndOffset": 210.5
}
```

---

## Function: nightlyBatch

### **Purpose**
Batch process songs without `realEndOffset` (FFmpeg preprocessing for entire catalog).

### **Location**
`functions/appwrite/src/nightlyBatch.js`

### **Configuration**

```json
{
  "name": "nightlyBatch",
  "runtime": "node-18.0",
  "specification": "s-1vcpu-2gb",
  "timeout": 900,
  "schedule": "0 2 * * *",
  "execute": ["any"]
}
```

### **Implementation**

```javascript
exports.main = async () => {
  const databases = new Databases(client);

  try {
    // Get all playlists
    const playlists = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      [Query.limit(100)]
    );

    let processed = 0;
    let errors = 0;

    for (const playlist of playlists.documents) {
      try {
        const tracks = JSON.parse(playlist.tracks || '[]');
        const tracksToProcess = tracks.filter((track) => !track.realEndOffset);

        if (tracksToProcess.length === 0) continue;

        console.log(`Processing ${tracksToProcess.length} tracks in playlist ${playlist.$id}`);

        for (const track of tracksToProcess) {
          try {
            // Get audio URL
            const audioUrl = execSync(
              `yt-dlp --get-url "https://youtube.com/watch?v=${track.videoId}"`
            ).toString().trim();

            // Detect silence
            const cmd = `ffprobe -f lavfi -i "amovie=${audioUrl},astats=metadata=1:reset=1,silencedetect=noise=-30dB:d=2" -show_entries frame=pkt_pts_time -of csv=p=0`;
            const output = execSync(cmd, { timeout: 30000 }).toString().trim();
            
            const silencePoints = output
              .split('\n')
              .map((line) => parseFloat(line))
              .filter((val) => !isNaN(val));

            const realEndOffset =
              silencePoints.length > 0
                ? silencePoints[silencePoints.length - 1]
                : track.duration;

            // Update track
            track.realEndOffset = realEndOffset;
            processed++;

            // Rate limit: 1 per second (avoid overwhelming YouTube)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (trackError) {
            console.error(`Failed to process track ${track.videoId}:`, trackError.message);
            errors++;
          }
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
        console.error(`Failed to process playlist ${playlist.$id}:`, playlistError.message);
        errors++;
      }
    }

    return {
      success: true,
      processed,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Nightly batch failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};
```

### **Cron Schedule**

```
0 2 * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)

Result: Runs daily at 2:00 AM server time
```

---

## Deployment & Configuration

### **Function Structure**

```
functions/appwrite/
├── appwrite.config.json      # Function definitions
├── package.json              # Dependencies
└── src/
    ├── magic-link.js         # Auth function
    ├── player-registry.js    # Master election
    ├── processRequest.js     # Paid requests
    ├── addSongToPlaylist.js  # FFmpeg preprocessing
    └── nightlyBatch.js       # Batch processing
```

### **Deployment Process**

```bash
# 1. Install Appwrite CLI
npm install -g appwrite-cli

# 2. Login to AppWrite
appwrite login

# 3. Deploy all functions
cd functions/appwrite
appwrite deploy function

# Or deploy specific function
appwrite deploy function --functionId 68e5a317003c42c8bb6a
```

### **Environment Variable Setup**

```bash
# Set environment variables for function
appwrite functions updateVariable \
  --functionId 68e5a317003c42c8bb6a \
  --key JWT_SECRET \
  --value "your-secret-key"

# List all variables
appwrite functions listVariables --functionId 68e5a317003c42c8bb6a
```

### **Testing Functions**

```bash
# Test locally (requires AppWrite CLI)
appwrite functions createExecution \
  --functionId 68e5a317003c42c8bb6a \
  --body '{"action":"create","email":"test@example.com"}'

# View logs
appwrite functions listExecutions --functionId 68e5a317003c42c8bb6a
```

### **Monitoring**

```javascript
// Enable logging in appwrite.config.json
{
  "logging": true
}

// View logs in AppWrite Console:
// https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/functions
```

---

## Error Handling

### **Function-Level Error Handling**

```javascript
exports.main = async (req) => {
  try {
    // Function logic
    const result = await processRequest(req);
    return { success: true, data: result };
  } catch (error) {
    console.error('Function error:', error);
    
    // Return structured error
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }
    };
  }
};
```

### **Database Error Handling**

```javascript
try {
  await databases.createDocument(...);
} catch (error) {
  if (error.code === 409) {
    // Document already exists
    console.warn('Duplicate document:', error);
  } else if (error.code === 401) {
    // Unauthorized
    throw new Error('Database access denied');
  } else {
    // Unknown error
    throw error;
  }
}
```

### **Timeout Handling**

```javascript
// Set timeout for external commands
try {
  const output = execSync(cmd, { timeout: 30000 }); // 30 seconds
} catch (error) {
  if (error.killed && error.signal === 'SIGTERM') {
    console.error('Command timed out');
    // Fallback logic
  } else {
    throw error;
  }
}
```

### **Retry Logic**

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryWithBackoff(() => 
  databases.createDocument(...)
);
```

---

## Function Flow Diagrams

### **Magic Link Authentication Flow**

```
┌─────────┐         ┌──────────────┐         ┌──────────┐
│  Client │         │  magic-link  │         │ Database │
└────┬────┘         └──────┬───────┘         └────┬─────┘
     │                     │                      │
     │ 1. Create magic link│                      │
     ├────────────────────>│                      │
     │                     │                      │
     │                     │ 2. Generate token    │
     │                     ├─────────────────────>│
     │                     │                      │
     │                     │ 3. Send email        │
     │                     │ (TODO: SendGrid)     │
     │                     │                      │
     │ 4. Click link       │                      │
     ├────────────────────>│                      │
     │                     │                      │
     │                     │ 5. Verify token      │
     │                     ├─────────────────────>│
     │                     │                      │
     │                     │ 6. Find/create user  │
     │                     ├─────────────────────>│
     │                     │                      │
     │                     │ 7. Issue JWT         │
     │                     │                      │
     │ 8. Return token     │                      │
     │<────────────────────┤                      │
     │                     │                      │
```

### **Master Player Registration Flow**

```
┌─────────┐         ┌────────────────┐         ┌──────────┐
│ Player  │         │ player-registry│         │ Database │
└────┬────┘         └────────┬───────┘         └────┬─────┘
     │                       │                      │
     │ 1. Register as master │                      │
     ├──────────────────────>│                      │
     │                       │                      │
     │                       │ 2. Check existing    │
     │                       ├─────────────────────>│
     │                       │                      │
     │                       │ 3. Found active?     │
     │                       │ - Same device → Reconnect
     │                       │ - Recent HB → Conflict
     │                       │ - Stale HB → Expire  │
     │                       │                      │
     │                       │ 4. Register new      │
     │                       ├─────────────────────>│
     │                       │                      │
     │ 5. Return status      │                      │
     │<──────────────────────┤                      │
     │                       │                      │
     │ 6. Send heartbeat (every 30s)               │
     ├──────────────────────>│                      │
     │                       │                      │
     │                       │ 7. Update lastHeartbeat
     │                       ├─────────────────────>│
     │                       │                      │
```

---

## Related Documents

- 📄 **DJAMMS_IO_01_Database_Schema_Complete.md** - Database collections used by functions
- 📄 **DJAMMS_IO_02_API_Communications_Complete.md** - Function execution API
- 📄 **DJAMMS_IO_05_Auth_Complete.md** - Magic link authentication details
- 📄 **DJAMMS_IO_06_External_APIs_Complete.md** - FFmpeg and yt-dlp usage

---

**END OF DOCUMENT**
