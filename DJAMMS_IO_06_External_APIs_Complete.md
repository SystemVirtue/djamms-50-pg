# DJAMMS I/O Reference: External APIs Complete

**Document ID**: DJAMMS_IO_06  
**Category**: BY TYPE - External API Integrations  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Table of Contents

1. [External APIs Overview](#external-apis-overview)
2. [YouTube Data API v3](#youtube-data-api-v3)
3. [YouTube IFrame Player API](#youtube-iframe-player-api)
4. [Stripe Payment API](#stripe-payment-api)
5. [FFmpeg Processing](#ffmpeg-processing)
6. [API Rate Limits](#api-rate-limits)
7. [Error Handling](#error-handling)

---

## External APIs Overview

### **Integrated APIs**

| API | Purpose | Usage | Location |
|-----|---------|-------|----------|
| **YouTube Data API v3** | Video search, metadata | Kiosk song search | `packages/shared/src/services/YouTubeSearchService.ts` |
| **YouTube IFrame Player API** | Video playback control | Player endpoint | `apps/player/src/components/AdvancedPlayer.tsx` |
| **Stripe Payment API** | Song request payments | Kiosk checkout | (Planned - not yet implemented) |
| **FFmpeg** | Audio preprocessing | Silence detection | `functions/appwrite/src/addSongToPlaylist.js` |

### **API Key Management**

```typescript
// packages/shared/src/config/env.ts
export const config = {
  youtube: {
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',  // From .env
  },
  features: {
    stripePayments: import.meta.env.VITE_ENABLE_STRIPE_PAYMENTS === 'true',
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  }
};
```

**Environment Variables**:
```bash
# .env file
VITE_YOUTUBE_API_KEY=AIzaSy...........................
VITE_ENABLE_STRIPE_PAYMENTS=false
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...............
```

---

## YouTube Data API v3

### **API Overview**

**Base URL**: `https://www.googleapis.com/youtube/v3`  
**Authentication**: API Key (query parameter)  
**Quota**: 10,000 units/day (default free tier)

### **Quota Costs**

| Operation | Cost (units) | Daily Limit (10k quota) |
|-----------|--------------|------------------------|
| **search** | 100 units | 100 searches |
| **videos.list** | 1 unit | 10,000 calls |
| **Combined search + details** | 101 units | ~99 combined searches |

### **Service Implementation**

```typescript
// packages/shared/src/services/YouTubeSearchService.ts
export class YouTubeSearchService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for YouTube videos
   * Cost: 100 units (search) + 1 unit (videos.list) = 101 units
   */
  async search(options: YouTubeSearchOptions): Promise<YouTubeSearchResponse> {
    const { query, maxResults = 20, pageToken } = options;

    // Step 1: Search for videos (100 units)
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10',  // Music category only
      maxResults: maxResults.toString(),
      key: this.apiKey,
      ...(pageToken && { pageToken })
    });

    const searchResponse = await fetch(
      `${this.baseUrl}/search?${searchParams}`
    );

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    // Extract video IDs
    const videoIds = searchData.items
      .map((item: any) => item.id.videoId)
      .join(',');

    // Step 2: Get video details (1 unit per call, but batched)
    const detailsParams = new URLSearchParams({
      part: 'contentDetails,snippet',
      id: videoIds,  // Batch up to 50 IDs
      key: this.apiKey
    });

    const detailsResponse = await fetch(
      `${this.baseUrl}/videos?${detailsParams}`
    );

    if (!detailsResponse.ok) {
      throw new Error(`YouTube API error: ${detailsResponse.statusText}`);
    }

    const detailsData = await detailsResponse.json();

    // Combine results with calculated "official" score
    const items: SearchResult[] = detailsData.items.map((video: any) => {
      const snippet = video.snippet;
      const duration = parseDuration(video.contentDetails.duration);
      const officialScore = calculateOfficialScore(
        snippet.title,
        snippet.channelTitle
      );

      return {
        id: video.id,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url,
        duration,
        officialScore
      };
    });

    return {
      items,
      nextPageToken: searchData.nextPageToken,
      prevPageToken: searchData.prevPageToken,
      totalResults: searchData.pageInfo.totalResults
    };
  }

  /**
   * Get video details by ID
   * Cost: 1 unit
   */
  async getVideoById(videoId: string): Promise<SearchResult | null> {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: videoId,
      key: this.apiKey
    });

    const response = await fetch(`${this.baseUrl}/videos?${params}`);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const duration = parseDuration(video.contentDetails.duration);
    const officialScore = calculateOfficialScore(
      snippet.title,
      snippet.channelTitle
    );

    return {
      id: video.id,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url,
      duration,
      officialScore
    };
  }
}
```

### **Official Score Algorithm**

```typescript
/**
 * Calculate "official" score for a video
 * Higher score = more likely to be official content
 * 
 * Scoring factors:
 * - VEVO channel: +3 points
 * - "Official" in title: +2 points
 * - " - Topic" channel: +2 points (auto-generated by YouTube)
 * - Artist name in channel: +1 point
 */
function calculateOfficialScore(
  title: string,
  channelTitle: string
): number {
  let score = 0;

  // VEVO channels are always official
  if (channelTitle.toLowerCase().includes('vevo')) {
    score += 3;
  }

  // Official in title
  if (/official/i.test(title)) {
    score += 2;
  }

  // Topic channels (auto-generated by YouTube for official music)
  if (channelTitle.includes(' - Topic')) {
    score += 2;
  }

  // Artist name similarity (basic check)
  const titleWords = title.toLowerCase().split(/\s+/);
  const channelWords = channelTitle.toLowerCase().split(/\s+/);
  const overlap = titleWords.filter(word => channelWords.includes(word)).length;
  if (overlap >= 2) {
    score += 1;
  }

  return score;
}
```

**Score Examples**:
- `"Official Video" on "ArtistVEVO"` → 5 points (VEVO + Official)
- `"Song Title - Official Audio" on "Artist - Topic"` → 4 points (Official + Topic)
- `"Live Performance" on "RandomChannel"` → 0 points (No official indicators)

### **Duration Parsing**

YouTube returns durations in ISO 8601 format (e.g., `PT4M33S`):

```typescript
// packages/shared/src/lib/utils.ts
export function parseDuration(isoDuration: string): number {
  // Parse "PT4M33S" → 273 seconds
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
```

**Examples**:
- `PT4M33S` → 273 seconds (4 min 33 sec)
- `PT1H2M3S` → 3723 seconds (1 hr 2 min 3 sec)
- `PT30S` → 30 seconds

### **Request/Response Examples**

#### **Search Request**

```http
GET /youtube/v3/search?part=snippet&q=billie%20eilish&type=video&videoCategoryId=10&maxResults=20&key=YOUR_API_KEY
Host: www.googleapis.com
```

#### **Search Response**

```json
{
  "kind": "youtube#searchListResponse",
  "etag": "...",
  "nextPageToken": "CAoQAA",
  "pageInfo": {
    "totalResults": 1000000,
    "resultsPerPage": 20
  },
  "items": [
    {
      "kind": "youtube#searchResult",
      "etag": "...",
      "id": {
        "kind": "youtube#video",
        "videoId": "DyDfgMOUjCI"
      },
      "snippet": {
        "publishedAt": "2019-03-29T15:00:01Z",
        "channelId": "UCiGm_E4ZwYSHV3bcW1pnSeQ",
        "title": "Billie Eilish - bad guy",
        "description": "Listen to \"bad guy\" from the debut album \"WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?\", out now: http://smarturl.it/WWAFAWDWG ...",
        "thumbnails": {
          "high": {
            "url": "https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg",
            "width": 480,
            "height": 360
          }
        },
        "channelTitle": "BillieEilishVEVO",
        "liveBroadcastContent": "none"
      }
    }
  ]
}
```

#### **Video Details Request**

```http
GET /youtube/v3/videos?part=contentDetails,snippet&id=DyDfgMOUjCI&key=YOUR_API_KEY
Host: www.googleapis.com
```

#### **Video Details Response**

```json
{
  "kind": "youtube#videoListResponse",
  "items": [
    {
      "kind": "youtube#video",
      "id": "DyDfgMOUjCI",
      "snippet": {
        "title": "Billie Eilish - bad guy",
        "channelTitle": "BillieEilishVEVO",
        "thumbnails": { ... }
      },
      "contentDetails": {
        "duration": "PT3M14S",
        "dimension": "2d",
        "definition": "hd",
        "caption": "true",
        "licensedContent": true
      }
    }
  ]
}
```

---

## YouTube IFrame Player API

### **API Overview**

**Load Method**: Script tag injection  
**Documentation**: https://developers.google.com/youtube/iframe_api_reference  
**React Library**: `react-youtube` (wrapper around official API)

### **Player Initialization**

```tsx
// apps/player/src/components/AdvancedPlayer.tsx
import YouTube from 'react-youtube';

export const AdvancedPlayer: React.FC<{ venueId: string }> = ({ venueId }) => {
  const [primaryPlayer, setPrimaryPlayer] = useState<YT.Player>();
  const [secondaryPlayer, setSecondaryPlayer] = useState<YT.Player>();

  const onPlayerReady = (event: YT.PlayerEvent, playerType: 'primary' | 'secondary') => {
    if (playerType === 'primary') {
      setPrimaryPlayer(event.target);
    } else {
      setSecondaryPlayer(event.target);
    }
  };

  return (
    <div>
      {/* Primary player - visible */}
      <YouTube
        videoId={currentTrack?.videoId}
        opts={{
          playerVars: {
            autoplay: localStorage.getItem('djammsAutoplay') === 'true' ? 1 : 0,
            controls: 0,  // Hide controls
            modestbranding: 1,  // Minimal YouTube branding
            rel: 0,  // Don't show related videos
            fs: 0,  // Disable fullscreen button
          },
        }}
        onReady={(e: YT.PlayerEvent) => onPlayerReady(e, 'primary')}
        onEnd={playNextTrack}
        iframeClassName="absolute top-0 left-0 w-full h-full"
        data-testid="yt-player-container"
      />

      {/* Secondary player - hidden (for crossfading) */}
      <YouTube
        opts={{ playerVars: { autoplay: 0 } }}
        onReady={(e: YT.PlayerEvent) => onPlayerReady(e, 'secondary')}
        style={{ display: 'none' }}
      />
    </div>
  );
};
```

### **Player Methods**

```typescript
// YT.Player interface methods
interface YT.Player {
  // Playback control
  loadVideoById(videoId: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;

  // Volume control
  setVolume(volume: number): void;  // 0-100
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;

  // Player state
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoUrl(): string;

  // Quality
  setPlaybackQuality(quality: string): void;
  getAvailableQualityLevels(): string[];
}
```

### **Player States**

```typescript
enum YT.PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5
}
```

### **Crossfading Implementation**

DJAMMS uses **dual iframes** for seamless track transitions:

```typescript
const startCrossfade = async (nextTrack: Track) => {
  if (!primaryPlayer || !secondaryPlayer) return;

  setIsCrossfading(true);

  // Load next track in secondary player
  secondaryPlayer.loadVideoById(nextTrack.videoId);

  const fadeDuration = 5000;  // 5 seconds
  const steps = 50;  // 50 volume adjustments
  const stepDuration = fadeDuration / steps;  // 100ms per step

  // Gradually fade volumes
  for (let i = 0; i <= steps; i++) {
    const primaryVolume = 100 - i * 2;  // 100 → 0
    const secondaryVolume = i * 2;      // 0 → 100

    primaryPlayer.setVolume(primaryVolume);
    secondaryPlayer.setVolume(secondaryVolume);

    await new Promise((resolve) => setTimeout(resolve, stepDuration));
  }

  // Swap players (secondary becomes primary)
  setPrimaryPlayer(secondaryPlayer);
  setSecondaryPlayer(primaryPlayer);
  setIsCrossfading(false);
};
```

**Crossfade Timeline**:
```
Time (s)  | Primary Volume | Secondary Volume | State
----------|----------------|------------------|------------
0.0       | 100%          | 0%               | Start fade
1.0       | 80%           | 20%              | Fading
2.5       | 50%           | 50%              | Mid-point
4.0       | 20%           | 80%              | Almost done
5.0       | 0%            | 100%             | Complete
```

### **Event Handling**

```typescript
// Available events
<YouTube
  onReady={(event: YT.PlayerEvent) => {
    console.log('Player ready', event.target);
  }}
  onPlay={(event: YT.PlayerEvent) => {
    console.log('Video started playing');
  }}
  onPause={(event: YT.PlayerEvent) => {
    console.log('Video paused');
  }}
  onEnd={(event: YT.PlayerEvent) => {
    console.log('Video ended, play next track');
    playNextTrack();
  }}
  onError={(event: YT.OnErrorEvent) => {
    console.error('Player error:', event.data);
    // Error codes: 2 (invalid param), 5 (HTML5 error), 100 (not found), 101/150 (not embeddable)
  }}
  onStateChange={(event: YT.OnStateChangeEvent) => {
    console.log('State changed:', event.data);
  }}
/>
```

### **Error Codes**

| Code | Meaning | Action |
|------|---------|--------|
| **2** | Invalid parameter | Check videoId format |
| **5** | HTML5 player error | Reload player |
| **100** | Video not found | Skip to next track |
| **101** | Video not embeddable | Skip to next track |
| **150** | Video not embeddable (same as 101) | Skip to next track |

---

## Stripe Payment API

### **Status**: Planned (not yet implemented)

### **Planned Integration**

```typescript
// Future implementation
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(config.features.stripePublishableKey);

// Create payment intent (server-side)
const createPaymentIntent = async (amount: number, venueId: string) => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, venueId })
  });

  const { clientSecret } = await response.json();
  return clientSecret;
};

// Process payment (client-side)
const processPayment = async (cardElement: any, clientSecret: string) => {
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement }
  });

  if (error) {
    throw new Error(error.message);
  }

  return paymentIntent;
};
```

### **Database Schema**

```typescript
// packages/shared/src/types/database.ts
export interface Payment {
  paymentId: string;
  venueId: string;
  requestId: string;
  amount: number;  // In cents
  currency: string;  // 'usd'
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  createdAt: string;
}
```

### **Payment Flow** (Planned)

```
1. User selects song → Kiosk
2. Display price ($5) → Payment UI
3. Enter card details → Stripe Elements
4. Create payment intent → Server function
5. Confirm payment → Stripe API
6. Add to priority queue → Database update
7. Payment receipt → Email/SMS
```

---

## FFmpeg Processing

### **Purpose**

FFmpeg detects silence at the end of YouTube videos to enable **precise crossfading**:
- Videos often have 5-10 seconds of silence at the end
- Crossfade should start during the last musical notes, not during silence
- FFmpeg analyzes audio to find the "real" end of the music

### **Implementation**

```javascript
// functions/appwrite/src/addSongToPlaylist.js
const { execSync } = require('child_process');

exports.main = async ({ playlistId, song }) => {
  try {
    // Step 1: Get audio URL using yt-dlp
    const audioUrl = execSync(
      `yt-dlp --get-url "https://youtube.com/watch?v=${song.videoId}"`
    ).toString().trim();

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

    // Step 3: Store track with calculated end time
    const playlist = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId
    );

    const updatedTracks = JSON.parse(playlist.tracks || '[]');
    updatedTracks.push({
      ...song,
      realEndOffset,  // Use detected end time
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

### **FFmpeg Command Breakdown**

```bash
ffprobe \
  -f lavfi \  # Use lavfi (libavfilter) input format
  -i "amovie=${audioUrl},astats=metadata=1:reset=1,silencedetect=noise=-30dB:d=2" \
  -show_entries frame=pkt_pts_time \  # Show frame timestamps
  -of csv=p=0  # Output as CSV
```

**Parameters**:
- `amovie=${audioUrl}` - Load audio from URL
- `astats=metadata=1:reset=1` - Audio statistics with metadata
- `silencedetect=noise=-30dB:d=2` - Detect silence below -30dB lasting 2+ seconds
- `frame=pkt_pts_time` - Extract packet presentation timestamps
- `csv=p=0` - Output as CSV without headers

**Example Output**:
```
0.000000
5.123456
10.234567
...
213.456789  ← Last silence point (real end of music)
220.000000  ← Total duration (includes trailing silence)
```

### **Silence Detection Parameters**

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| **noise** | -30dB | Volume threshold (below = silence) |
| **duration** | 2 seconds | Minimum silence length to detect |

**Tuning**:
- More aggressive: `-40dB` (catches quieter endings)
- Less aggressive: `-20dB` (only very quiet sections)
- Longer detection: `d=5` (ignore brief pauses)

### **yt-dlp Integration**

```bash
# Get direct audio URL
yt-dlp --get-url "https://youtube.com/watch?v=VIDEO_ID"

# Output (example):
# https://rr3---sn-q4flrn7s.googlevideo.com/videoplayback?expire=...
```

**Why yt-dlp?**
- YouTube doesn't expose direct audio URLs via API
- yt-dlp bypasses YouTube's download restrictions
- Returns temporary direct link to audio stream

### **Performance Considerations**

```javascript
// Timeout after 30 seconds
execSync(cmd, { timeout: 30000 });

// Run in background (nightly batch job)
// Don't block user requests
```

**Optimization Strategy**:
1. Process new songs in **nightly batch job** (not on-demand)
2. Cache results in database (`realEndOffset` field)
3. Fallback to full duration if FFmpeg fails

---

## API Rate Limits

### **YouTube Data API**

| Limit Type | Value | Reset Period |
|------------|-------|--------------|
| **Daily quota** | 10,000 units | 24 hours (Pacific Time) |
| **QPS** | ~1000 queries/second | Per second |
| **Search cost** | 100 units | Per search |
| **Video details cost** | 1 unit | Per call |

**Quota Exhaustion Handling**:
```typescript
if (response.status === 403) {
  const error = await response.json();
  
  if (error.error.errors[0].reason === 'quotaExceeded') {
    // Show user-friendly message
    throw new Error('YouTube search limit reached. Try again in 24 hours.');
  }
}
```

**Optimization Strategies**:
1. **Cache search results** in localStorage (5-minute TTL)
2. **Batch video details** (up to 50 IDs per request)
3. **Use pagination** (load 20 results at a time, not 100)
4. **Implement search debouncing** (wait 500ms after typing stops)

### **YouTube IFrame Player**

**No explicit rate limits**, but best practices:
- Don't create/destroy players rapidly (reuse instances)
- Limit volume adjustment frequency (max 10/second)
- Debounce seek operations (300ms minimum)

### **FFmpeg Processing**

**Server Resource Limits**:
- Max 5 concurrent FFmpeg processes
- 30-second timeout per process
- 2GB memory limit per process

**Rate Limiting**:
```javascript
const activeProcesses = new Map();

const rateLimitFFmpeg = async (videoId) => {
  if (activeProcesses.size >= 5) {
    throw new Error('FFmpeg processing queue full. Try again later.');
  }

  activeProcesses.set(videoId, Date.now());
  
  try {
    // Run FFmpeg
    await processVideo(videoId);
  } finally {
    activeProcesses.delete(videoId);
  }
};
```

---

## Error Handling

### **YouTube API Errors**

```typescript
try {
  const results = await youtubeService.search({ query: 'test' });
} catch (error: any) {
  if (error.message.includes('quotaExceeded')) {
    // Quota exhausted
    showToast('YouTube search limit reached. Try again tomorrow.', 'error');
  } else if (error.message.includes('invalid')) {
    // Invalid API key
    showToast('YouTube API configuration error. Contact support.', 'error');
  } else if (error.message.includes('network')) {
    // Network error
    showToast('Network error. Check your connection.', 'error');
  } else {
    // Unknown error
    console.error('YouTube API error:', error);
    showToast('Search failed. Please try again.', 'error');
  }
}
```

### **YouTube Player Errors**

```typescript
const handlePlayerError = (error: YT.OnErrorEvent) => {
  const errorCode = error.data;

  switch (errorCode) {
    case 2:
      // Invalid parameter
      console.error('Invalid videoId:', currentTrack?.videoId);
      playNextTrack();
      break;

    case 5:
      // HTML5 player error
      console.error('HTML5 player error, reloading...');
      window.location.reload();
      break;

    case 100:
    case 101:
    case 150:
      // Video not found or not embeddable
      console.error('Video not available:', currentTrack?.videoId);
      showToast(`Video unavailable: ${currentTrack?.title}`, 'error');
      playNextTrack();
      break;

    default:
      console.error('Unknown player error:', errorCode);
      playNextTrack();
  }
};
```

### **FFmpeg Errors**

```javascript
try {
  const output = execSync(ffmpegCmd, { timeout: 30000 });
  // Process output
} catch (error) {
  if (error.killed && error.signal === 'SIGTERM') {
    // Timeout
    console.warn('FFmpeg timeout, using full duration');
    return song.duration;
  } else if (error.status === 1) {
    // FFmpeg error (bad URL, codec issue, etc.)
    console.warn('FFmpeg failed:', error.stderr?.toString());
    return song.duration;
  } else {
    // Other error
    console.error('FFmpeg unexpected error:', error);
    return song.duration;
  }
}
```

### **Retry Logic**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;  // Last attempt failed
      }

      const delay = baseDelay * Math.pow(2, attempt);  // Exponential backoff
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const results = await retryWithBackoff(
  () => youtubeService.search({ query: 'test' }),
  3,  // Max 3 retries
  1000  // Start with 1-second delay
);
```

---

## API Flow Diagrams

### **YouTube Search Flow**

```
┌─────────┐           ┌─────────────┐           ┌─────────────┐
│  Kiosk  │           │  YouTube    │           │   YouTube   │
│   UI    │           │  Service    │           │   API v3    │
└────┬────┘           └──────┬──────┘           └──────┬──────┘
     │                       │                          │
     │ 1. User types query   │                          │
     ├──────────────────────>│                          │
     │                       │                          │
     │                       │ 2. POST /search          │
     │                       ├─────────────────────────>│
     │                       │    (Cost: 100 units)     │
     │                       │                          │
     │                       │ 3. Video IDs             │
     │                       │<─────────────────────────┤
     │                       │                          │
     │                       │ 4. POST /videos          │
     │                       ├─────────────────────────>│
     │                       │    (Cost: 1 unit)        │
     │                       │                          │
     │                       │ 5. Video details         │
     │                       │<─────────────────────────┤
     │                       │                          │
     │ 6. Display results    │                          │
     │<──────────────────────┤                          │
     │                       │                          │
```

### **FFmpeg Preprocessing Flow**

```
┌───────────────┐     ┌──────────────┐     ┌─────────┐     ┌──────────┐
│  Admin adds   │     │   AppWrite   │     │ yt-dlp  │     │  FFmpeg  │
│   song to     │     │   Function   │     │         │     │          │
│   playlist    │     │              │     │         │     │          │
└───────┬───────┘     └──────┬───────┘     └────┬────┘     └────┬─────┘
        │                    │                   │               │
        │ 1. Add song        │                   │               │
        ├───────────────────>│                   │               │
        │                    │                   │               │
        │                    │ 2. Get audio URL  │               │
        │                    ├──────────────────>│               │
        │                    │                   │               │
        │                    │ 3. Direct URL     │               │
        │                    │<──────────────────┤               │
        │                    │                   │               │
        │                    │ 4. Detect silence │               │
        │                    ├───────────────────────────────────>│
        │                    │                   │               │
        │                    │ 5. Silence points │               │
        │                    │<───────────────────────────────────┤
        │                    │                   │               │
        │                    │ 6. Store with realEndOffset       │
        │                    │   (e.g., 213s instead of 220s)    │
        │                    │                   │               │
        │ 7. Success         │                   │               │
        │<───────────────────┤                   │               │
        │                    │                   │               │
```

---

## Related Documents

- 📄 **DJAMMS_IO_01_Database_Schema_Complete.md** - Track storage with realEndOffset
- 📄 **DJAMMS_IO_02_API_Communications_Complete.md** - Cloud Function execution
- 📄 **DJAMMS_IO_07_Cloud_Functions_Complete.md** - addSongToPlaylist implementation
- 📄 **DJAMMS_IO_Endpoint_04_Player.md** - YouTube IFrame Player usage
- 📄 **DJAMMS_IO_Endpoint_06_Kiosk.md** - YouTube search integration

---

**END OF DOCUMENT**
