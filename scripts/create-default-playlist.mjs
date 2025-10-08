#!/usr/bin/env node

/**
 * Script to fetch YouTube playlist and store as default playlist in AppWrite
 * 
 * Usage: node scripts/create-default-playlist.mjs
 */

import 'dotenv/config';
import { Client, Databases, ID } from 'node-appwrite';

// Configuration
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const PLAYLIST_ID = 'PLJ7vMjpVbhBWLWJpweVDki43Wlcqzsqdu';
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

// AppWrite Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

// Initialize AppWrite Client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

/**
 * Fetch playlist items from YouTube API
 */
async function fetchYouTubePlaylist(playlistId, apiKey) {
  console.log('📥 Fetching YouTube playlist...');
  console.log(`   Playlist ID: ${playlistId}`);
  
  const tracks = [];
  let pageToken = null;
  let pageCount = 0;

  do {
    pageCount++;
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);
    
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    console.log(`   Fetching page ${pageCount}...`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Process each item
    for (const item of data.items) {
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      
      // Skip deleted or private videos
      if (snippet.title === 'Deleted video' || snippet.title === 'Private video') {
        console.log(`   ⚠️  Skipping: ${snippet.title}`);
        continue;
      }

      const track = {
        videoId: contentDetails.videoId,
        title: snippet.title,
        channelTitle: snippet.channelTitle || snippet.videoOwnerChannelTitle || 'Unknown',
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        duration: 'Unknown', // Will be fetched separately if needed
        position: snippet.position,
        addedAt: new Date(snippet.publishedAt).toISOString(),
      };

      tracks.push(track);
    }

    pageToken = data.nextPageToken;
    console.log(`   ✅ Fetched ${data.items.length} items (${tracks.length} valid)`);

  } while (pageToken);

  console.log(`\n✅ Total tracks fetched: ${tracks.length}`);
  return tracks;
}

/**
 * Fetch video durations for tracks
 */
async function fetchVideoDurations(tracks, apiKey) {
  console.log('\n⏱️  Fetching video durations...');
  
  // YouTube API allows up to 50 video IDs per request
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < tracks.length; i += batchSize) {
    batches.push(tracks.slice(i, i + batchSize));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const videoIds = batch.map(t => t.videoId).join(',');
    
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', videoIds);
    url.searchParams.set('key', apiKey);

    console.log(`   Batch ${i + 1}/${batches.length} (${batch.length} videos)...`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.log(`   ⚠️  Warning: Could not fetch durations for batch ${i + 1}`);
      continue;
    }

    const data = await response.json();
    
    // Update tracks with duration
    for (const video of data.items) {
      const track = tracks.find(t => t.videoId === video.id);
      if (track) {
        track.duration = parseDuration(video.contentDetails.duration);
      }
    }
  }

  console.log('   ✅ Durations fetched');
}

/**
 * Parse ISO 8601 duration format (PT4M33S) to human-readable (4:33)
 */
function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown';

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Store playlist in AppWrite
 */
async function storePlaylistInAppWrite(tracks) {
  console.log('\n💾 Storing playlist in AppWrite...');
  
  const playlistData = {
    playlistId: 'default_playlist',
    name: 'Default Playlist',
    description: 'Default playlist for new venues - curated music selection',
    ownerId: 'system',
    venueId: null, // Global default playlist
    tracks: JSON.stringify(tracks), // Store as JSON string per schema
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // Check if default playlist already exists
    console.log('   Checking for existing default playlist...');
    try {
      const existing = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        'playlists',
        'default_playlist'
      );
      
      console.log('   ⚠️  Default playlist already exists');
      console.log('   Updating existing playlist...');
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        'playlists',
        'default_playlist',
        {
          tracks: JSON.stringify(tracks),
          updatedAt: new Date().toISOString(),
        }
      );
      
      console.log('   ✅ Default playlist updated');
      return existing.$id;
      
    } catch (error) {
      if (error.code === 404) {
        // Doesn't exist, create it
        console.log('   Creating new default playlist...');
        
        const result = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          'playlists',
          'default_playlist', // Use custom document ID
          playlistData
        );
        
        console.log('   ✅ Default playlist created');
        return result.$id;
      }
      throw error;
    }
    
  } catch (error) {
    console.error('   ❌ Error storing playlist:', error.message);
    throw error;
  }
}

/**
 * Display playlist summary
 */
function displaySummary(tracks) {
  console.log('\n📊 Playlist Summary:');
  console.log('='.repeat(60));
  console.log(`   Total Tracks: ${tracks.length}`);
  console.log(`   Playlist URL: ${PLAYLIST_URL}`);
  console.log('');
  console.log('   First 5 tracks:');
  
  tracks.slice(0, 5).forEach((track, index) => {
    console.log(`   ${index + 1}. ${track.title}`);
    console.log(`      by ${track.channelTitle} [${track.duration}]`);
  });
  
  if (tracks.length > 5) {
    console.log(`   ... and ${tracks.length - 5} more`);
  }
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🎵 DJAMMS Default Playlist Creator\n');

  // Validate environment variables
  if (!YOUTUBE_API_KEY) {
    console.error('❌ Error: VITE_YOUTUBE_API_KEY not found in .env');
    process.exit(1);
  }

  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_API_KEY) {
    console.error('❌ Error: AppWrite configuration not found in .env');
    console.error('   Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, APPWRITE_API_KEY');
    process.exit(1);
  }

  try {
    // Step 1: Fetch playlist from YouTube
    const tracks = await fetchYouTubePlaylist(PLAYLIST_ID, YOUTUBE_API_KEY);

    if (tracks.length === 0) {
      console.error('❌ No tracks found in playlist');
      process.exit(1);
    }

    // Step 2: Fetch video durations
    await fetchVideoDurations(tracks, YOUTUBE_API_KEY);

    // Step 3: Display summary
    displaySummary(tracks);

    // Step 4: Store in AppWrite
    const documentId = await storePlaylistInAppWrite(tracks);

    console.log('\n✅ SUCCESS!');
    console.log(`   Playlist stored with ID: ${documentId}`);
    console.log(`   Total tracks: ${tracks.length}`);
    console.log('\n💡 This playlist can now be used as the default for new venues');
    console.log(`   Access it with playlistId: "default_playlist"`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the script
main();
