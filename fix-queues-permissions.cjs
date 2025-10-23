/**
 * Fix Queues Collection Permissions
 * Allows public read access so player can display queue without authentication
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
    console.log('🔧 Updating queues collection permissions...');
    console.log(`   Database: ${DATABASE_ID}`);
    console.log(`   Collection: ${COLLECTION_ID}`);
    console.log('');

    // Get current collection
    const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    
    console.log('📋 Current permissions:', collection.$permissions);
    console.log('');

    // Update permissions to allow:
    // - Anyone can read (for public player viewing)
    // - Any authenticated user can update (for queue management)
    const newPermissions = [
      Permission.read(Role.any()),           // Anyone can view queue
      Permission.create(Role.users()),       // Authenticated users can create
      Permission.update(Role.users()),       // Authenticated users can update
      Permission.delete(Role.users()),       // Authenticated users can delete
    ];

    await databases.updateCollection(
      DATABASE_ID,
      COLLECTION_ID,
      collection.name,
      newPermissions,
      collection.documentSecurity,
      collection.enabled
    );

    console.log('✅ Permissions updated successfully!');
    console.log('');
    console.log('New permissions:');
    console.log('  - Read: Any (public access)');
    console.log('  - Create: Authenticated users');
    console.log('  - Update: Authenticated users');
    console.log('  - Delete: Authenticated users');
    console.log('');
    console.log('🎉 Player can now load queue without authentication!');
    
  } catch (error) {
    console.error('❌ Error updating permissions:', error.message);
    process.exit(1);
  }
}

updateCollectionPermissions();
