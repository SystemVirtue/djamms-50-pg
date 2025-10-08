#!/usr/bin/env node

/**
 * Verify the default playlist was created successfully
 */

import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function verifyPlaylist() {
  console.log('🔍 Verifying Default Playlist...\n');

  try {
    const document = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      'default_playlist'
    );

    console.log('✅ Default Playlist Found!');
    console.log('='.repeat(60));
    console.log(`   Document ID: ${document.$id}`);
    console.log(`   Playlist ID: ${document.playlistId}`);
    console.log(`   Name: ${document.name}`);
    console.log(`   Description: ${document.description}`);
    console.log(`   Owner: ${document.ownerId}`);
    console.log(`   Created: ${document.createdAt}`);
    console.log(`   Updated: ${document.updatedAt}`);
    
    // Parse tracks
    const tracks = JSON.parse(document.tracks);
    console.log(`   \n   📀 Total Tracks: ${tracks.length}`);
    console.log('\n   First 10 tracks:');
    tracks.slice(0, 10).forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.title}`);
      console.log(`      ${track.channelTitle} [${track.duration}] - ${track.videoId}`);
    });
    
    if (tracks.length > 10) {
      console.log(`   ... and ${tracks.length - 10} more tracks`);
    }
    
    console.log('='.repeat(60));
    console.log('\n✅ Playlist is ready to use!');
    console.log('\n💡 Usage:');
    console.log('   - Access playlist with document ID: "default_playlist"');
    console.log('   - Or query by playlistId: "default_playlist"');
    console.log('   - Tracks stored as JSON string in "tracks" field');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 404) {
      console.error('   Playlist not found. Run: node scripts/create-default-playlist.mjs');
    }
    process.exit(1);
  }
}

verifyPlaylist();
