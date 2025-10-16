/**
 * Update Queues Collection Permissions
 * Allows public read access for player viewing
 */

const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'queues';

async function updateCollectionPermissions() {
  try {
    console.log('Updating queues collection permissions...\n');

    // Update collection to allow public read access
    await databases.updateCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Queues',
      [
        Permission.read(Role.any()),  // Allow anyone to read
        Permission.create(Role.users()),  // Only authenticated users can create
        Permission.update(Role.users()),  // Only authenticated users can update
        Permission.delete(Role.users()),  // Only authenticated users can delete
      ],
      false,  // documentSecurity = false (collection-level permissions)
      true    // enabled = true
    );

    console.log('✓ Updated queues collection permissions');
    console.log('  - Read: any() - Public read access');
    console.log('  - Create/Update/Delete: users() - Authenticated users only');
    console.log('\n✅ Player can now access queues without authentication!\n');

  } catch (error) {
    console.error('❌ Error updating permissions:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

updateCollectionPermissions();
