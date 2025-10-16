#!/usr/bin/env node
/**
 * Check and update the queues collection attributes in AppWrite
 * Ensures priorityQueue and mainQueue are properly configured as strings
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

async function checkQueueSchema() {
  try {
    console.log('🔍 Checking queues collection schema...\n');
    
    // Get collection details
    const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    
    console.log(`✓ Collection: ${collection.name} (${collection.$id})`);
    console.log(`  Enabled: ${collection.enabled}`);
    console.log(`  Document Security: ${collection.documentSecurity}\n`);
    
    console.log('📋 Current Attributes:\n');
    
    // Check each attribute
    for (const attr of collection.attributes) {
      console.log(`  ${attr.key}:`);
      console.log(`    Type: ${attr.type}`);
      console.log(`    Required: ${attr.required}`);
      
      if (attr.size) {
        console.log(`    Size: ${attr.size} chars`);
      }
      
      if (attr.key === 'priorityQueue' || attr.key === 'mainQueue') {
        // Check if it's the correct configuration
        if (attr.type === 'string' && attr.size === 100000) {
          console.log(`    ✅ Correctly configured as string(100000)`);
        } else {
          console.log(`    ⚠️  ISSUE: Should be string(100000), is ${attr.type}(${attr.size})`);
        }
      }
      
      if (attr.key === 'nowPlaying') {
        if (attr.type === 'string' && attr.required === false) {
          console.log(`    ✅ Correctly configured as optional string`);
        } else {
          console.log(`    ⚠️  ISSUE: Should be optional string`);
        }
      }
      
      console.log('');
    }
    
    // Check if required attributes exist
    const attrKeys = collection.attributes.map(a => a.key);
    const required = ['venueId', 'mainQueue', 'priorityQueue'];
    const optional = ['nowPlaying', 'createdAt', 'updatedAt'];
    
    console.log('🔎 Attribute Check:\n');
    
    for (const key of required) {
      if (attrKeys.includes(key)) {
        console.log(`  ✅ ${key} exists`);
      } else {
        console.log(`  ❌ ${key} MISSING!`);
      }
    }
    
    for (const key of optional) {
      if (attrKeys.includes(key)) {
        console.log(`  ✅ ${key} exists (optional)`);
      } else {
        console.log(`  ⚠️  ${key} missing (optional)`);
      }
    }
    
    console.log('\n📊 Collection Summary:');
    console.log(`  Total attributes: ${collection.attributes.length}`);
    console.log(`  Total indexes: ${collection.indexes?.length || 0}`);
    
    // Check a sample document
    console.log('\n📄 Checking sample document (venue-001):\n');
    
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, 'venue-001');
      
      console.log(`  Document ID: ${doc.$id}`);
      console.log(`  Venue ID: ${doc.venueId}`);
      console.log(`  Priority Queue type: ${typeof doc.priorityQueue}`);
      console.log(`  Priority Queue length: ${doc.priorityQueue?.length || 0} chars`);
      console.log(`  Main Queue type: ${typeof doc.mainQueue}`);
      console.log(`  Main Queue length: ${doc.mainQueue?.length || 0} chars`);
      console.log(`  Now Playing type: ${typeof doc.nowPlaying}`);
      
      // Try to parse the queues
      try {
        const priority = JSON.parse(doc.priorityQueue);
        console.log(`  ✅ Priority Queue is valid JSON (${Array.isArray(priority) ? priority.length : 0} items)`);
      } catch (e) {
        console.log(`  ❌ Priority Queue is NOT valid JSON!`);
      }
      
      try {
        const main = JSON.parse(doc.mainQueue);
        console.log(`  ✅ Main Queue is valid JSON (${Array.isArray(main) ? main.length : 0} items)`);
      } catch (e) {
        console.log(`  ❌ Main Queue is NOT valid JSON!`);
      }
      
    } catch (error) {
      console.log(`  ⚠️  Could not read document: ${error.message}`);
    }
    
    console.log('\n✅ Schema check complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error checking schema:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
      console.error(`   Type: ${error.type}`);
    }
    process.exit(1);
  }
}

// Run the check
checkQueueSchema().catch(console.error);
