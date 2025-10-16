#!/usr/bin/env node
/**
 * Fix the priorityQueue attribute for venue-001
 * Ensure it contains a valid JSON string
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '68cc86c3002b27e13947')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '68e57de9003234a84cae';
const COLLECTION_ID = 'queues';

async function fixPriorityQueue() {
  try {
    console.log('🔧 Fixing priorityQueue for venue-001...\n');
    
    // Get current document
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, 'venue-001');
    
    console.log('Current state:');
    console.log(`  priorityQueue type: ${typeof doc.priorityQueue}`);
    console.log(`  priorityQueue length: ${doc.priorityQueue?.length || 0} chars`);
    console.log(`  priorityQueue value: "${doc.priorityQueue}"`);
    
    // Check if it's valid JSON
    let isValid = false;
    try {
      JSON.parse(doc.priorityQueue);
      isValid = true;
    } catch (e) {
      console.log(`  ❌ Invalid JSON: ${e.message}`);
    }
    
    if (isValid) {
      console.log('\n✅ priorityQueue is already valid JSON - no fix needed!');
      return;
    }
    
    // Fix it by setting it to an empty array (as JSON string)
    console.log('\n🔧 Updating priorityQueue to valid JSON (empty array)...');
    
    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      'venue-001',
      {
        priorityQueue: JSON.stringify([]),  // Empty array as JSON string
      }
    );
    
    console.log('\n✅ Fixed! New state:');
    console.log(`  priorityQueue: "${updated.priorityQueue}"`);
    console.log(`  priorityQueue length: ${updated.priorityQueue.length} chars`);
    
    // Verify it's now valid JSON
    try {
      const parsed = JSON.parse(updated.priorityQueue);
      console.log(`  ✅ Valid JSON: ${Array.isArray(parsed) ? parsed.length : 0} items`);
    } catch (e) {
      console.log(`  ❌ Still invalid: ${e.message}`);
    }
    
    console.log('\n🎉 Priority queue fixed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error fixing priorityQueue:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
      console.error(`   Type: ${error.type}`);
    }
    process.exit(1);
  }
}

// Run the fix
fixPriorityQueue().catch(console.error);
