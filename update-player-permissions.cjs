/**
 * Update Collection Permissions for Player Access
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

const COLLECTIONS_TO_UPDATE = [
  { id: 'playlists', name: 'Playlists' },
  { id: 'venues', name: 'Venues' },
];

async function updateCollectionPermissions() {
  try {
    console.log('Updating collection permissions for player access...\n');

    for (const collection of COLLECTIONS_TO_UPDATE) {
      console.log(`Updating ${collection.name} collection...`);
      
      await databases.updateCollection(
        DATABASE_ID,
        collection.id,
        collection.name,
        [
          Permission.read(Role.any()),  // Allow anyone to read
          Permission.create(Role.users()),  // Only authenticated users can create
          Permission.update(Role.users()),  // Only authenticated users can update
          Permission.delete(Role.users()),  // Only authenticated users can delete
        ],
        false,  // documentSecurity = false (collection-level permissions)
        true    // enabled = true
      );

      console.log(`✓ Updated ${collection.name} collection\n`);
    }

    console.log('✅ All collections updated successfully!');
    console.log('\nPlayer can now access:');
    console.log('  - Queues (already updated)');
    console.log('  - Playlists');
    console.log('  - Venues');
    console.log('\nWithout authentication! 🎉\n');

  } catch (error) {
    console.error('❌ Error updating permissions:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

updateCollectionPermissions();
