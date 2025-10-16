#!/usr/bin/env node
/**
 * Fix Queue Document ID
 * 
 * Recreates the queue document with document ID matching venueId
 * This fixes 404 errors when trying to update the queue
 */

const { Client, Databases } = require('node-appwrite');
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

async function fixQueueId() {
  try {
    console.log('🔧 Fixing Queue Document ID\n');
    console.log('This will recreate the queue with document ID = venueId\n');

    // Check if queue with venueId as ID already exists
    try {
      const existingQueue = await databases.getDocument(DATABASE_ID, 'queues', 'venue-001');
      console.log('✓ Queue with correct ID already exists!');
      console.log('  Document ID:', existingQueue.$id);
      console.log('  Venue ID:', existingQueue.venueId);
      return;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      // 404 is expected, continue to create
    }

    // Create new queue with venueId as document ID
    console.log('Creating new queue document...\n');
    const newQueue = await databases.createDocument(
      DATABASE_ID,
      'queues',
      'venue-001',  // Use venueId as document ID
      {
        venueId: 'venue-001',
        mainQueue: JSON.stringify([]),
        priorityQueue: JSON.stringify([]),
        nowPlaying: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    console.log('✅ Queue created successfully!');
    console.log('  Document ID:', newQueue.$id);
    console.log('  Venue ID:', newQueue.venueId);
    console.log('\n✅ Fix complete!');
    console.log('  Player can now update queue using venueId directly');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

fixQueueId();
