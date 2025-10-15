#!/usr/bin/env node

/**
 * Add 'users' attribute to venues collection
 * This is required before running the venue-centric migration
 */

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║   Add users[] Attribute to venues Collection             ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`ℹ️  Database: ${DATABASE_ID}`);
console.log(`ℹ️  Endpoint: ${process.env.VITE_APPWRITE_ENDPOINT}\n`);

async function addUsersAttribute() {
  try {
    console.log('ℹ️  Adding "users" attribute to venues collection...\n');
    
    // In AppWrite, array of objects is stored as a string attribute containing JSON
    // We'll use a large string attribute to store the JSON array
    const result = await databases.createStringAttribute(
      DATABASE_ID,
      'venues',
      'users',
      1000000, // 1MB max size for JSON array
      false,   // not required (can be empty array)
      '[]',    // default value: empty array
      false    // not an array type (it's a JSON string)
    );
    
    console.log('✅ Successfully added "users" attribute!');
    console.log(`   Attribute: ${result.key}`);
    console.log(`   Type: ${result.type}`);
    console.log(`   Size: ${result.size}`);
    console.log(`   Default: ${result.default}`);
    console.log(`   Status: ${result.status}`);
    
    console.log('\n⏳ Attribute is being created...');
    console.log('   Check status in AppWrite Console: Database > venues > Attributes');
    console.log('   Wait for status to be "available" before running migration.\n');
    
    console.log('ℹ️  Next steps:');
    console.log('   1. Wait ~30 seconds for attribute to become available');
    console.log('   2. Run: node scripts/migrate-to-venue-centric.mjs --dry-run');
    console.log('   3. If dry-run looks good, run: node scripts/migrate-to-venue-centric.mjs\n');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Attribute "users" already exists!');
      console.log('   You can proceed with the migration.\n');
    } else {
      console.error('❌ Error adding attribute:', error.message);
      console.error('   Code:', error.code);
      console.error('   Type:', error.type);
      throw error;
    }
  }
}

// Run
addUsersAttribute()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
