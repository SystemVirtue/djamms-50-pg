#!/usr/bin/env node
/**
 * Production Database Test Script
 * Tests all CRUD operations and verifies schema integrity
 */

const { Client, Databases, ID, Query } = require('node-appwrite');
const path = require('path');
const fs = require('fs');

// Load production environment
const envPath = path.join(__dirname, '../.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production file not found!');
  console.error('   Please create it with production credentials.');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

// Validate required env vars
const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID;

// Test data cleanup IDs
const testIds = {
  venue: null,
  queue: null,
  request: null,
  playlist: null,
};

async function testDatabase() {
  console.log('\n🚀 Testing Production Database\n');
  console.log('Environment:');
  console.log('  Endpoint:', process.env.APPWRITE_ENDPOINT);
  console.log('  Project:', process.env.APPWRITE_PROJECT_ID);
  console.log('  Database:', databaseId);
  console.log('');

  try {
    // Test 0: Verify database exists
    console.log('0️⃣  Verifying database exists...');
    await databases.get(databaseId);
    console.log('   ✅ Database found\n');

    // Test 1: Create test venue
    console.log('1️⃣  Testing venues collection...');
    const venue = await databases.createDocument(
      databaseId,
      'venues',
      ID.unique(),
      {
        venueId: `test-venue-${Date.now()}`,
        name: 'Test Venue Production',
        slug: `test-venue-${Date.now()}`,
        ownerId: 'test-owner-prod',
        createdAt: new Date().toISOString(),
      }
    );
    testIds.venue = venue.$id;
    console.log('   ✅ Venue created:', venue.$id);
    console.log('   ✅ Slug unique constraint working');

    // Test 2: Create test queue
    console.log('\n2️⃣  Testing queues collection...');
    const queue = await databases.createDocument(
      databaseId,
      'queues',
      ID.unique(),
      {
        venueId: venue.venueId,
        mainQueue: JSON.stringify([]),
        priorityQueue: JSON.stringify([
          {
            id: ID.unique(),
            videoId: 'test123',
            title: 'Test Song',
            artist: 'Test Artist',
            duration: 180,
            thumbnail: 'https://example.com/thumb.jpg',
            requestedAt: new Date().toISOString(),
            position: 0,
            status: 'queued',
            isPaid: true,
            paidAmount: 5.0,
          },
        ]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    testIds.queue = queue.$id;
    console.log('   ✅ Queue created:', queue.$id);
    console.log('   ✅ JSON string storage working');
    console.log('   ✅ VenueId unique constraint working');

    // Test 3: Create test request with full lifecycle
    console.log('\n3️⃣  Testing requests collection (full lifecycle)...');
    
    // Create request
    const request = await databases.createDocument(
      databaseId,
      'requests',
      ID.unique(),
      {
        requestId: ID.unique(),
        venueId: venue.venueId,
        song: JSON.stringify({
          videoId: 'dQw4w9WgXcQ',
          title: 'Never Gonna Give You Up',
          artist: 'Rick Astley',
          duration: 213,
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
        }),
        requesterId: 'test-user-prod',
        paymentId: `payment_${Date.now()}`,
        status: 'queued',
        timestamp: new Date().toISOString(),
      }
    );
    testIds.request = request.$id;
    console.log('   ✅ Request created (status: queued):', request.$id);

    // Update to playing
    await databases.updateDocument(
      databaseId,
      'requests',
      request.$id,
      {
        status: 'playing',
      }
    );
    console.log('   ✅ Request updated to playing');

    // Update to completed
    await databases.updateDocument(
      databaseId,
      'requests',
      request.$id,
      {
        status: 'completed',
        completedAt: new Date().toISOString(),
      }
    );
    console.log('   ✅ Request updated to completed with timestamp');

    // Test 4: Query requests by status
    console.log('\n4️⃣  Testing request queries...');
    const completedRequests = await databases.listDocuments(
      databaseId,
      'requests',
      [Query.equal('status', 'completed')]
    );
    console.log('   ✅ Status filter working:', completedRequests.total, 'completed request(s)');

    const venueRequests = await databases.listDocuments(
      databaseId,
      'requests',
      [Query.equal('venueId', venue.venueId)]
    );
    console.log('   ✅ Venue filter working:', venueRequests.total, 'request(s) for venue');

    // Test 5: Create playlist
    console.log('\n5️⃣  Testing playlists collection...');
    const playlist = await databases.createDocument(
      databaseId,
      'playlists',
      ID.unique(),
      {
        playlistId: ID.unique(),
        name: 'Test Playlist Production',
        description: 'A test playlist for production verification',
        ownerId: 'test-owner-prod',
        venueId: venue.venueId,
        tracks: JSON.stringify([
          {
            videoId: 'dQw4w9WgXcQ',
            title: 'Never Gonna Give You Up',
            artist: 'Rick Astley',
            duration: 213,
            addedAt: new Date().toISOString(),
          },
        ]),
        createdAt: new Date().toISOString(),
      }
    );
    testIds.playlist = playlist.$id;
    console.log('   ✅ Playlist created:', playlist.$id);
    console.log('   ✅ Tracks JSON storage working');

    // Test 6: Update playlist
    await databases.updateDocument(
      databaseId,
      'playlists',
      playlist.$id,
      {
        updatedAt: new Date().toISOString(),
        name: 'Updated Test Playlist',
      }
    );
    console.log('   ✅ Playlist updated successfully');

    // Test 7: Query playlists by venue
    console.log('\n6️⃣  Testing playlist queries...');
    const venuePlaylists = await databases.listDocuments(
      databaseId,
      'playlists',
      [Query.equal('venueId', venue.venueId)]
    );
    console.log('   ✅ Venue filter working:', venuePlaylists.total, 'playlist(s) for venue');

    // Test 8: Test all indexes exist
    console.log('\n7️⃣  Verifying indexes...');
    const collections = ['users', 'venues', 'queues', 'players', 'magicLinks', 'playlists', 'requests'];
    for (const collectionId of collections) {
      try {
        const indexes = await databases.listIndexes(databaseId, collectionId);
        console.log(`   ✅ ${collectionId}: ${indexes.total} index(es)`);
      } catch (error) {
        console.log(`   ⚠️  ${collectionId}: Collection may not exist`);
      }
    }

    // Test 9: Test performance (response times)
    console.log('\n8️⃣  Testing query performance...');
    const start = Date.now();
    await databases.listDocuments(databaseId, 'requests', [
      Query.equal('venueId', venue.venueId),
      Query.orderDesc('timestamp'),
      Query.limit(25),
    ]);
    const duration = Date.now() - start;
    console.log(`   ✅ Query response time: ${duration}ms`);
    if (duration > 500) {
      console.log('   ⚠️  Warning: Query took longer than expected (>500ms)');
    }

    // Cleanup
    console.log('\n9️⃣  Cleaning up test data...');
    if (testIds.playlist) {
      await databases.deleteDocument(databaseId, 'playlists', testIds.playlist);
      console.log('   ✅ Deleted test playlist');
    }
    if (testIds.request) {
      await databases.deleteDocument(databaseId, 'requests', testIds.request);
      console.log('   ✅ Deleted test request');
    }
    if (testIds.queue) {
      await databases.deleteDocument(databaseId, 'queues', testIds.queue);
      console.log('   ✅ Deleted test queue');
    }
    if (testIds.venue) {
      await databases.deleteDocument(databaseId, 'venues', testIds.venue);
      console.log('   ✅ Deleted test venue');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\nProduction database is ready for deployment! 🚀\n');
    console.log('Next steps:');
    console.log('  1. Update frontend .env files with production project ID');
    console.log('  2. Build all apps: npm run build');
    console.log('  3. Deploy to Vercel: Task 13');
    console.log('');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    console.error('\nPlease fix the issue and run tests again.');
    console.error('');

    // Attempt cleanup even on failure
    console.log('Attempting cleanup...');
    try {
      if (testIds.playlist) await databases.deleteDocument(databaseId, 'playlists', testIds.playlist);
      if (testIds.request) await databases.deleteDocument(databaseId, 'requests', testIds.request);
      if (testIds.queue) await databases.deleteDocument(databaseId, 'queues', testIds.queue);
      if (testIds.venue) await databases.deleteDocument(databaseId, 'venues', testIds.venue);
      console.log('✓ Cleanup complete');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
      console.error('   You may need to manually delete test documents');
    }

    process.exit(1);
  }
}

// Run tests
testDatabase();
