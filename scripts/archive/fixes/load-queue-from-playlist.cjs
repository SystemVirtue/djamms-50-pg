#!/usr/bin/env node
/**
 * Load Queue from Playlist
 * 
 * Manually loads tracks from the default playlist into the queue
 * This simulates what the QueueManagementService.getQueue() should do automatically
 */

const { Client, Databases, Query, ID } = require('node-appwrite');
require('dotenv').config();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.VITE_APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function loadQueueFromPlaylist() {
  try {
    console.log('🎵 Loading Queue from Playlist\n');

    // 1. Get venue
    console.log('Step 1: Getting venue...');
    const venueResponse = await databases.listDocuments(
      DATABASE_ID,
      'venues',
      [Query.equal('venueId', 'venue-001'), Query.limit(1)]
    );

    if (venueResponse.documents.length === 0) {
      console.error('❌ Venue not found!');
      return;
    }

    const venue = venueResponse.documents[0];
    const playlistId = venue.defaultPlaylistId || 'default_playlist';
    console.log('✓ Venue found, playlist ID:', playlistId);

    // 2. Get playlist
    console.log('\nStep 2: Getting playlist...');
    const playlistResponse = await databases.listDocuments(
      DATABASE_ID,
      'playlists',
      [Query.equal('playlistId', playlistId), Query.limit(1)]
    );

    if (playlistResponse.documents.length === 0) {
      console.error('❌ Playlist not found!');
      return;
    }

    const playlist = playlistResponse.documents[0];
    console.log('✓ Playlist found:', playlist.name);

    // 3. Parse tracks
    console.log('\nStep 3: Parsing playlist tracks...');
    let tracks;
    try {
      const tracksJson = playlist.tracks;
      tracks = typeof tracksJson === 'string' ? JSON.parse(tracksJson) : tracksJson;
      
      if (!Array.isArray(tracks)) {
        console.error('❌ Invalid tracks format!');
        return;
      }
      console.log('✓ Found', tracks.length, 'tracks in playlist');
    } catch (error) {
      console.error('❌ Failed to parse tracks:', error.message);
      return;
    }

    // 4. Convert to QueueTrack format (limit to 50 tracks)
    console.log('\nStep 4: Converting tracks to queue format...');
    const limitedTracks = tracks.slice(0, 50);
    const queueTracks = limitedTracks.map((track, index) => ({
      id: ID.unique(),
      videoId: track.videoId || track.id || '',
      title: track.title || 'Unknown Track',
      artist: track.artist || 'Unknown Artist',
      duration: track.duration || 0,
      thumbnail: track.thumbnail || '',
      requestedBy: 'System',
      requestedByEmail: 'system@djamms.app',
      requestedAt: new Date().toISOString(),
      position: index,
      status: 'queued',
      isPaid: false,
    }));
    console.log('✓ Converted', queueTracks.length, 'tracks');

    // 5. Update queue
    console.log('\nStep 5: Updating queue document...');
    const updated = await databases.updateDocument(
      DATABASE_ID,
      'queues',
      'venue-001',
      {
        mainQueue: JSON.stringify(queueTracks),
        updatedAt: new Date().toISOString(),
      }
    );

    console.log('\n✅ Queue loaded successfully!');
    console.log('  Main Queue:', queueTracks.length, 'tracks');
    console.log('  First Track:', queueTracks[0]?.title);
    console.log('  Last Track:', queueTracks[queueTracks.length - 1]?.title);
    console.log('\n🎉 Player should now auto-play the first track!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

loadQueueFromPlaylist();
