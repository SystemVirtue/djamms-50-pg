#!/usr/bin/env node

/**
 * DJAMMS Database Migration Script
 * Migrates from user-centric to venue-centric schema
 * 
 * Usage:
 *   node scripts/migrate-to-venue-centric.mjs
 * 
 * Or with dry-run:
 *   node scripts/migrate-to-venue-centric.mjs --dry-run
 */

import { Client, Databases, Query, ID } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_DIR = path.resolve(__dirname, '../backups');

// Initialize AppWrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

// Logging utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  step: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

// Statistics
const stats = {
  venuesMigrated: 0,
  usersAdded: 0,
  usersCleaned: 0,
  errors: 0,
};

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log.info(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Save backup to file
 */
function saveBackup(backup) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
  log.success(`Backup saved: ${filepath}`);
  
  return filepath;
}

/**
 * Fetch all documents from a collection (handles pagination)
 */
async function fetchAllDocuments(collectionId) {
  let allDocuments = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collectionId,
      [Query.limit(limit), Query.offset(offset)]
    );
    
    allDocuments = allDocuments.concat(response.documents);
    
    if (response.documents.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  return allDocuments;
}

/**
 * Step 1: Create backup of current data
 */
async function createBackup() {
  log.step('STEP 1: Creating Backup');
  
  try {
    log.info('Fetching venues...');
    const venues = await fetchAllDocuments('venues');
    log.success(`Fetched ${venues.length} venues`);
    
    log.info('Fetching users...');
    const users = await fetchAllDocuments('users');
    log.success(`Fetched ${users.length} users`);
    
    const backup = {
      timestamp: new Date().toISOString(),
      database: {
        id: DATABASE_ID,
        endpoint: process.env.APPWRITE_ENDPOINT,
      },
      collections: {
        venues: venues,
        users: users,
      },
      statistics: {
        venueCount: venues.length,
        userCount: users.length,
      },
    };
    
    ensureBackupDir();
    const backupPath = saveBackup(backup);
    
    return { backup, backupPath };
    
  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Step 2: Migrate venues to include users array
 */
async function migrateVenues(backup) {
  log.step('STEP 2: Migrating Venues');
  
  const venues = backup.collections.venues;
  const users = backup.collections.users;
  
  for (const venue of venues) {
    try {
      log.info(`\nProcessing venue: ${venue.name || venue.$id}`);
      log.info(`  Venue ID: ${venue.venueId || venue.$id}`);
      
      const venueUsers = [];
      
      // Add owner
      if (venue.ownerId) {
        const owner = users.find(u => u.$id === venue.ownerId);
        if (owner) {
          venueUsers.push({
            userId: owner.$id,
            email: owner.email,
            name: owner.name || '',
            role: 'owner',
            addedAt: venue.$createdAt || new Date().toISOString(),
            addedBy: 'system',
          });
          log.info(`    ✓ Added owner: ${owner.email} (${owner.$id})`);
        } else {
          log.warn(`    ⚠ Owner not found: ${venue.ownerId}`);
        }
      }
      
      // Add staff from staffIds array
      if (venue.staffIds && Array.isArray(venue.staffIds)) {
        for (const staffId of venue.staffIds) {
          const staff = users.find(u => u.$id === staffId);
          if (staff && !venueUsers.some(u => u.userId === staffId)) {
            venueUsers.push({
              userId: staff.$id,
              email: staff.email,
              name: staff.name || '',
              role: staff.role || 'staff',
              addedAt: venue.$createdAt || new Date().toISOString(),
              addedBy: venue.ownerId || 'system',
            });
            log.info(`    ✓ Added staff: ${staff.email} (${staff.$id})`);
          }
        }
      }
      
      // Find users who have this venue in their venues[] array
      const usersWithVenue = users.filter(u => 
        u.venues && Array.isArray(u.venues) && u.venues.includes(venue.$id)
      );
      
      for (const user of usersWithVenue) {
        if (!venueUsers.some(u => u.userId === user.$id)) {
          venueUsers.push({
            userId: user.$id,
            email: user.email,
            name: user.name || '',
            role: user.role || 'viewer',
            addedAt: venue.$createdAt || new Date().toISOString(),
            addedBy: venue.ownerId || 'system',
          });
          log.info(`    ✓ Added from venues array: ${user.email} (${user.$id})`);
        }
      }
      
      // Find users who have venueId matching this venue
      const usersWithVenueId = users.filter(u => u.venueId === venue.$id);
      
      for (const user of usersWithVenueId) {
        if (!venueUsers.some(u => u.userId === user.$id)) {
          venueUsers.push({
            userId: user.$id,
            email: user.email,
            name: user.name || '',
            role: user.role || 'viewer',
            addedAt: venue.$createdAt || new Date().toISOString(),
            addedBy: venue.ownerId || 'system',
          });
          log.info(`    ✓ Added from venueId: ${user.email} (${user.$id})`);
        }
      }
      
      log.success(`  Total users to migrate: ${venueUsers.length}`);
      
      // Update venue document
      if (!DRY_RUN) {
        const updateData = {
          users: venueUsers,
        };
        
        // Remove old staffIds field
        if (venue.staffIds !== undefined) {
          updateData.staffIds = null;
        }
        
        await databases.updateDocument(
          DATABASE_ID,
          'venues',
          venue.$id,
          updateData
        );
        
        log.success(`  ✅ Venue migrated successfully`);
      } else {
        log.info(`  [DRY RUN] Would update venue with ${venueUsers.length} users`);
      }
      
      stats.venuesMigrated++;
      stats.usersAdded += venueUsers.length;
      
    } catch (error) {
      log.error(`  Failed to migrate venue ${venue.$id}: ${error.message}`);
      stats.errors++;
    }
  }
}

/**
 * Step 3: Clean up users collection
 */
async function cleanupUsers(backup) {
  log.step('STEP 3: Cleaning Up Users Collection');
  
  const users = backup.collections.users;
  
  for (const user of users) {
    try {
      const updateData = {};
      const fieldsToRemove = [];
      
      // Remove old venue-related fields
      if (user.venueId !== undefined) {
        updateData.venueId = null;
        fieldsToRemove.push('venueId');
      }
      if (user.venues !== undefined) {
        updateData.venues = null;
        fieldsToRemove.push('venues');
      }
      if (user.role !== undefined) {
        updateData.role = null;
        fieldsToRemove.push('role');
      }
      
      // Only update if there are fields to remove
      if (Object.keys(updateData).length > 0) {
        if (!DRY_RUN) {
          await databases.updateDocument(
            DATABASE_ID,
            'users',
            user.$id,
            updateData
          );
          log.info(`  ✓ Cleaned user: ${user.email} (removed: ${fieldsToRemove.join(', ')})`);
        } else {
          log.info(`  [DRY RUN] Would clean user: ${user.email} (remove: ${fieldsToRemove.join(', ')})`);
        }
        
        stats.usersCleaned++;
      }
      
    } catch (error) {
      log.error(`  Failed to clean user ${user.$id}: ${error.message}`);
      stats.errors++;
    }
  }
}

/**
 * Step 4: Verify migration
 */
async function verifyMigration() {
  log.step('STEP 4: Verifying Migration');
  
  try {
    // Check venues have users array
    const venues = await databases.listDocuments(
      DATABASE_ID,
      'venues',
      [Query.limit(10)]
    );
    
    let venuesWithUsers = 0;
    for (const venue of venues.documents) {
      if (venue.users && Array.isArray(venue.users) && venue.users.length > 0) {
        venuesWithUsers++;
      }
    }
    
    log.success(`${venuesWithUsers}/${venues.documents.length} sample venues have users array`);
    
    // Check users don't have old fields
    const users = await databases.listDocuments(
      DATABASE_ID,
      'users',
      [Query.limit(10)]
    );
    
    let cleanUsers = 0;
    for (const user of users.documents) {
      if (!user.venueId && !user.venues && !user.role) {
        cleanUsers++;
      }
    }
    
    log.success(`${cleanUsers}/${users.documents.length} sample users are clean`);
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
  }
}

/**
 * Display migration summary
 */
function displaySummary(backupPath) {
  log.step('MIGRATION SUMMARY');
  
  console.log(`
  Venues Migrated:       ${stats.venuesMigrated}
  Users Added to Venues: ${stats.usersAdded}
  Users Cleaned:         ${stats.usersCleaned}
  Errors:                ${stats.errors}
  
  Backup Location:       ${backupPath}
  Mode:                  ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE MIGRATION'}
  `);
  
  if (DRY_RUN) {
    log.info('This was a dry run. Run without --dry-run to apply changes.');
  } else {
    log.success('Migration completed successfully!');
    log.info('\nNext steps:');
    log.info('  1. Verify data in AppWrite Console');
    log.info('  2. Test authentication flow');
    log.info('  3. Update Cloud Functions (deploy new setupUserProfile)');
    log.info('  4. Update frontend queries');
    log.info('  5. Deploy to production');
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   DJAMMS Database Migration                               ║
║   User-Centric → Venue-Centric Schema                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  if (DRY_RUN) {
    log.warn('Running in DRY RUN mode - no changes will be made\n');
  } else {
    log.warn('Running in LIVE mode - database will be modified\n');
    
    // Confirmation prompt
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Continue with migration? (yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      log.info('Migration cancelled by user');
      process.exit(0);
    }
  }
  
  try {
    // Validate environment
    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    log.info(`Database: ${DATABASE_ID}`);
    log.info(`Endpoint: ${process.env.APPWRITE_ENDPOINT}\n`);
    
    // Run migration steps
    const { backup, backupPath } = await createBackup();
    await migrateVenues(backup);
    await cleanupUsers(backup);
    
    if (!DRY_RUN) {
      await verifyMigration();
    }
    
    displaySummary(backupPath);
    
    if (stats.errors > 0) {
      log.warn(`\nMigration completed with ${stats.errors} error(s). Please review.`);
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    log.error(`\nMigration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
main();
