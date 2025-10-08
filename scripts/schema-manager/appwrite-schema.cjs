// scripts/schema-manager/appwrite-schema.js
const { Client, Databases, Query } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'djamms_production';

// Collection definitions
const collections = [
  {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'role', type: 'enum', elements: ['admin', 'staff', 'viewer'], required: false, default: 'staff' },
      { key: 'autoplay', type: 'boolean', required: false, default: true },
      { key: 'venueId', type: 'string', size: 255, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: false },
      { key: 'avatar_url', type: 'url', required: false },
    ],
    indexes: [
      { key: 'email_unique', type: 'unique', attributes: ['email'] },
      { key: 'userId_key', type: 'key', attributes: ['userId'] },
    ],
  },
  {
    id: 'venues',
    name: 'Venues',
    attributes: [
      { key: 'venueId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'slug', type: 'string', size: 255, required: true },
      { key: 'ownerId', type: 'string', size: 255, required: true },
      { key: 'activePlayerInstanceId', type: 'string', size: 255, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'slug_unique', type: 'unique', attributes: ['slug'] },
      { key: 'ownerId_key', type: 'key', attributes: ['ownerId'] },
    ],
  },
  {
    id: 'queues',
    name: 'Queues',
    attributes: [
      { key: 'venueId', type: 'string', size: 255, required: true },
      { key: 'nowPlaying', type: 'string', size: 10000, required: false }, // JSON string
      { key: 'mainQueue', type: 'string', size: 100000, required: true }, // JSON string
      { key: 'priorityQueue', type: 'string', size: 100000, required: true }, // JSON string
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'venueId_unique', type: 'unique', attributes: ['venueId'] },
    ],
  },
  {
    id: 'players',
    name: 'Players',
    attributes: [
      { key: 'playerId', type: 'string', size: 255, required: true },
      { key: 'venueId', type: 'string', size: 255, required: true },
      { key: 'deviceId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'enum', elements: ['active', 'idle', 'offline'], required: false, default: 'idle' },
      { key: 'lastHeartbeat', type: 'integer', required: true },
      { key: 'expiresAt', type: 'integer', required: true },
      { key: 'userAgent', type: 'string', size: 500, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'venueId_key', type: 'key', attributes: ['venueId'] },
      { key: 'deviceId_key', type: 'key', attributes: ['deviceId'] },
    ],
  },
  {
    id: 'magicLinks',
    name: 'Magic Links',
    attributes: [
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'token', type: 'string', size: 255, required: true },
      { key: 'redirectUrl', type: 'url', required: true },
      { key: 'expiresAt', type: 'integer', required: true },
      { key: 'used', type: 'boolean', required: false, default: false },
    ],
    indexes: [
      { key: 'token_key', type: 'key', attributes: ['token'] },
      { key: 'email_key', type: 'key', attributes: ['email'] },
    ],
  },
  {
    id: 'playlists',
    name: 'Playlists',
    attributes: [
      { key: 'playlistId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'ownerId', type: 'string', size: 255, required: true },
      { key: 'venueId', type: 'string', size: 255, required: false },
      { key: 'tracks', type: 'string', size: 100000, required: true }, // JSON string
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'ownerId_key', type: 'key', attributes: ['ownerId'] },
      { key: 'venueId_key', type: 'key', attributes: ['venueId'] },
    ],
  },
  {
    id: 'requests',
    name: 'Requests',
    attributes: [
      { key: 'requestId', type: 'string', size: 255, required: true },
      { key: 'venueId', type: 'string', size: 255, required: true },
      { key: 'song', type: 'string', size: 10000, required: true }, // JSON string
      { key: 'requesterId', type: 'string', size: 255, required: true },
      { key: 'paymentId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'enum', elements: ['queued', 'playing', 'completed', 'cancelled'], required: false, default: 'queued' },
      { key: 'timestamp', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'venueId_key', type: 'key', attributes: ['venueId'] },
      { key: 'requesterId_key', type: 'key', attributes: ['requesterId'] },
      { key: 'timestamp_key', type: 'key', attributes: ['timestamp'] },
    ],
  },
];

async function checkSchema(dryRun = true) {
  const auditLog = [];
  const timestamp = new Date().toISOString();

  auditLog.push(`=== Schema Audit: ${timestamp} ===`);
  auditLog.push(`Dry Run: ${dryRun}`);
  auditLog.push('');

  // Check if database exists, create if needed
  try {
    await databases.get(databaseId);
    auditLog.push(`✓ Database '${databaseId}': Present`);
  } catch (error) {
    if (error.code === 404) {
      auditLog.push(`✗ Database '${databaseId}': Missing`);
      auditLog.push(`  ℹ Please create the database manually in AppWrite Console`);
      auditLog.push(`  ℹ Go to your AppWrite Console → Databases → Create Database`);
      auditLog.push(`  ℹ Use Database ID: ${databaseId}`);
      console.log(auditLog.join('\n'));
      process.exit(1);
    } else {
      throw error;
    }
  }
  auditLog.push('');

  for (const collection of collections) {
    try {
      const existing = await databases.getCollection(databaseId, collection.id);
      auditLog.push(`✓ Collection '${collection.id}': Present`);

      // Check attributes
      const existingAttrs = await databases.listAttributes(databaseId, collection.id);
      for (const attr of collection.attributes) {
        const found = existingAttrs.attributes.find((a) => a.key === attr.key);
        if (!found) {
          auditLog.push(`  ✗ Attribute '${attr.key}' missing in '${collection.id}'`);
          if (!dryRun) {
            await createAttribute(databaseId, collection.id, attr);
            auditLog.push(`  ✓ Created attribute '${attr.key}'`);
          }
        } else {
          auditLog.push(`  ✓ Attribute '${attr.key}' present`);
        }
      }
    } catch (error) {
      auditLog.push(`✗ Collection '${collection.id}': Missing`);
      if (!dryRun && process.argv.includes('--create-collections')) {
        try {
          await databases.createCollection(
            databaseId,
            collection.id,
            collection.name,
            [],
            false // documentSecurity
          );
          auditLog.push(`✓ Created collection '${collection.id}'`);

          // Create attributes
          for (const attr of collection.attributes) {
            await createAttribute(databaseId, collection.id, attr);
            auditLog.push(`  ✓ Created attribute '${attr.key}'`);
            await sleep(1000); // Wait for attribute to be ready
          }

          // Create indexes
          for (const index of collection.indexes || []) {
            await databases.createIndex(
              databaseId,
              collection.id,
              index.key,
              index.type,
              index.attributes
            );
            auditLog.push(`  ✓ Created index '${index.key}'`);
          }
        } catch (createError) {
          auditLog.push(`  ✗ Failed to create collection: ${createError.message}`);
        }
      }
    }

    // Clean bad documents if requested
    if (process.argv.includes('--clean') && !dryRun && process.argv.includes('--confirm')) {
      try {
        const docs = await databases.listDocuments(databaseId, collection.id);
        const badDocs = docs.documents.filter((doc) => {
          return collection.attributes.some((attr) => attr.required && !doc[attr.key]);
        });

        for (const doc of badDocs) {
          auditLog.push(`  ! Bad document in '${collection.id}': ${doc.$id}`);
          await databases.deleteDocument(databaseId, collection.id, doc.$id);
          auditLog.push(`  ✓ Deleted document ${doc.$id}`);
        }
      } catch (cleanError) {
        auditLog.push(`  ✗ Cleanup failed: ${cleanError.message}`);
      }
    }

    auditLog.push('');
  }

  // Write log file
  const logFile = path.join(__dirname, `schema-audit-${Date.now()}.log`);
  fs.writeFileSync(logFile, auditLog.join('\n'));
  console.log(auditLog.join('\n'));
  console.log(`\nAudit log written to ${logFile}`);
}

async function createAttribute(databaseId, collectionId, attr) {
  switch (attr.type) {
    case 'string':
      return await databases.createStringAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.size,
        attr.required,
        attr.default,
        attr.array || false
      );
    case 'integer':
      return await databases.createIntegerAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.min,
        attr.max,
        attr.default,
        attr.array || false
      );
    case 'float':
      return await databases.createFloatAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.min,
        attr.max,
        attr.default,
        attr.array || false
      );
    case 'boolean':
      return await databases.createBooleanAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
        attr.array || false
      );
    case 'datetime':
      return await databases.createDatetimeAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
        attr.array || false
      );
    case 'email':
      return await databases.createEmailAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
        attr.array || false
      );
    case 'url':
      return await databases.createUrlAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
        attr.array || false
      );
    case 'enum':
      return await databases.createEnumAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.elements,
        attr.required,
        attr.default,
        attr.array || false
      );
    default:
      throw new Error(`Unknown attribute type: ${attr.type}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
const dryRun = !process.argv.includes('--apply');
checkSchema(dryRun).catch((error) => {
  console.error('Schema check failed:', error);
  process.exit(1);
});
