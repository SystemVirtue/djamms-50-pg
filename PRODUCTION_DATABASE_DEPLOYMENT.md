# Production Database Deployment Guide 🚀

**Task 12 of 14 - Database Schema Deployment**

## Overview

This guide walks through deploying the DJAMMS database schema to AppWrite Cloud production environment. The schema includes 7 collections with proper indexes, permissions, and validation.

## Prerequisites

### 1. AppWrite Cloud Account
- ✅ Account created at https://cloud.appwrite.io
- ✅ Development project exists: `68cc86c3002b27e13947`
- ⏳ Production project needs to be created

### 2. Environment Variables
Create production `.env` file:

```bash
# Production AppWrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<PRODUCTION_PROJECT_ID>
APPWRITE_API_KEY=<PRODUCTION_API_KEY>
APPWRITE_DATABASE_ID=djamms_production

# YouTube API
VITE_YOUTUBE_API_KEY=<YOUR_KEY>

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Frontend URLs (Production)
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<PRODUCTION_PROJECT_ID>
VITE_APPWRITE_DATABASE_ID=djamms_production
```

### 3. Required Tools
```bash
# Node.js 18+ with npm
node --version  # Should be 18.x or higher

# AppWrite CLI (optional but recommended)
npm install -g appwrite-cli
```

## Database Schema

### Collections Overview

1. **users** - User profiles and authentication
2. **venues** - Venue/bar information and settings
3. **queues** - Real-time song queues (main + priority)
4. **players** - Player instance management and heartbeats
5. **magicLinks** - Authentication magic links
6. **playlists** - Saved playlists for venues
7. **requests** - Song request history and analytics

### Complete Schema Definition

Located in: `scripts/schema-manager/appwrite-schema.cjs`

```javascript
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
      { key: 'nowPlaying', type: 'string', size: 10000, required: false },
      { key: 'mainQueue', type: 'string', size: 100000, required: true },
      { key: 'priorityQueue', type: 'string', size: 100000, required: true },
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
      { key: 'tracks', type: 'string', size: 100000, required: true },
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
      { key: 'song', type: 'string', size: 10000, required: true },
      { key: 'requesterId', type: 'string', size: 255, required: true },
      { key: 'paymentId', type: 'string', size: 255, required: false },
      { key: 'status', type: 'enum', elements: ['queued', 'playing', 'completed', 'cancelled'], required: false, default: 'queued' },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'completedAt', type: 'datetime', required: false },
      { key: 'cancelledAt', type: 'datetime', required: false },
      { key: 'cancelReason', type: 'string', size: 500, required: false },
    ],
    indexes: [
      { key: 'venueId_key', type: 'key', attributes: ['venueId'] },
      { key: 'requesterId_key', type: 'key', attributes: ['requesterId'] },
      { key: 'timestamp_key', type: 'key', attributes: ['timestamp'] },
      { key: 'status_key', type: 'key', attributes: ['status'] },
    ],
  },
];
```

## Deployment Steps

### Step 1: Create Production Project

1. Go to https://cloud.appwrite.io
2. Click "Create Project"
3. Project Name: "DJAMMS Production"
4. Project ID: Let AppWrite generate or use custom
5. Region: Choose closest to your users
6. Click "Create"

**Save the Project ID** - you'll need it for environment variables!

### Step 2: Generate API Key

1. In your production project, go to "Settings" → "API Keys"
2. Click "Add API Key"
3. Name: "Schema Manager"
4. Scopes: Select ALL scopes (for database operations)
5. Expiration: Never (or set far future date)
6. Click "Create"

**Save the API Key** - you won't be able to see it again!

### Step 3: Create Database

1. In production project, go to "Databases"
2. Click "Add Database"
3. Database ID: `djamms_production`
4. Database Name: "DJAMMS Production"
5. Click "Create"

### Step 4: Update Environment Variables

Create `.env.production`:

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<YOUR_PRODUCTION_PROJECT_ID>
APPWRITE_API_KEY=<YOUR_PRODUCTION_API_KEY>
APPWRITE_DATABASE_ID=djamms_production
```

### Step 5: Run Schema Manager (Dry Run)

First, test the schema without making changes:

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

# Load production environment
export $(cat .env.production | xargs)

# Dry run (shows what would be created)
node scripts/schema-manager/appwrite-schema.cjs
```

**Expected Output:**
```
=== Schema Audit: 2025-10-16T... ===
Dry Run: true

✓ Database 'djamms_production': Present

✗ Collection 'users': Missing
✗ Collection 'venues': Missing
✗ Collection 'queues': Missing
✗ Collection 'players': Missing
✗ Collection 'magicLinks': Missing
✗ Collection 'playlists': Missing
✗ Collection 'requests': Missing
```

### Step 6: Deploy Schema (Apply Changes)

Now create the collections:

```bash
# Apply changes and create collections
node scripts/schema-manager/appwrite-schema.cjs --apply --create-collections
```

**Expected Output:**
```
=== Schema Audit: 2025-10-16T... ===
Dry Run: false

✓ Database 'djamms_production': Present

✗ Collection 'users': Missing
✓ Created collection 'users'
  ✓ Created attribute 'userId'
  ✓ Created attribute 'email'
  ✓ Created attribute 'role'
  ✓ Created attribute 'autoplay'
  ✓ Created attribute 'venueId'
  ✓ Created attribute 'createdAt'
  ✓ Created attribute 'updatedAt'
  ✓ Created attribute 'avatar_url'
  ✓ Created index 'email_unique'
  ✓ Created index 'userId_key'

... (continues for all 7 collections)

✓ Schema deployment complete!
```

This process takes **5-10 minutes** as each attribute needs time to process.

### Step 7: Verify Collections

Check AppWrite Console:

1. Go to Databases → djamms_production
2. Verify all 7 collections exist:
   - ✅ users
   - ✅ venues
   - ✅ queues
   - ✅ players
   - ✅ magicLinks
   - ✅ playlists
   - ✅ requests

3. Click each collection and verify attributes and indexes

### Step 8: Configure Permissions

For each collection, set appropriate permissions:

#### users Collection
```
Read: users
Create: users
Update: users, team:admins
Delete: team:admins
```

#### venues Collection
```
Read: any
Create: users
Update: users, team:admins
Delete: team:admins
```

#### queues Collection
```
Read: any
Create: users
Update: users
Delete: team:admins
```

#### players Collection
```
Read: users
Create: users
Update: users
Delete: users
```

#### magicLinks Collection
```
Read: team:admins
Create: any
Update: team:admins
Delete: team:admins
```

#### playlists Collection
```
Read: users
Create: users
Update: users
Delete: users
```

#### requests Collection
```
Read: users
Create: any (kiosk needs this)
Update: users
Delete: team:admins
```

### Step 9: Test Database Operations

Create test script `scripts/test-production-db.cjs`:

```javascript
const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.production' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID;

async function testDatabase() {
  console.log('Testing production database...\n');

  try {
    // Test 1: Create test venue
    console.log('1. Creating test venue...');
    const venue = await databases.createDocument(
      databaseId,
      'venues',
      ID.unique(),
      {
        venueId: 'test-venue-prod',
        name: 'Test Venue Production',
        slug: 'test-venue-prod',
        ownerId: 'test-owner',
        createdAt: new Date().toISOString(),
      }
    );
    console.log('✓ Venue created:', venue.$id);

    // Test 2: Create test queue
    console.log('\n2. Creating test queue...');
    const queue = await databases.createDocument(
      databaseId,
      'queues',
      ID.unique(),
      {
        venueId: 'test-venue-prod',
        mainQueue: JSON.stringify([]),
        priorityQueue: JSON.stringify([]),
        createdAt: new Date().toISOString(),
      }
    );
    console.log('✓ Queue created:', queue.$id);

    // Test 3: Create test request
    console.log('\n3. Creating test request...');
    const request = await databases.createDocument(
      databaseId,
      'requests',
      ID.unique(),
      {
        requestId: ID.unique(),
        venueId: 'test-venue-prod',
        song: JSON.stringify({
          videoId: 'dQw4w9WgXcQ',
          title: 'Test Song',
          artist: 'Test Artist',
          duration: 213,
          thumbnail: 'https://example.com/thumb.jpg',
        }),
        requesterId: 'test-user',
        status: 'queued',
        timestamp: new Date().toISOString(),
      }
    );
    console.log('✓ Request created:', request.$id);

    // Test 4: Query requests
    console.log('\n4. Querying requests...');
    const requests = await databases.listDocuments(
      databaseId,
      'requests',
      []
    );
    console.log('✓ Found', requests.total, 'request(s)');

    // Test 5: Update request status
    console.log('\n5. Updating request status...');
    await databases.updateDocument(
      databaseId,
      'requests',
      request.$id,
      {
        status: 'playing',
      }
    );
    console.log('✓ Request status updated to playing');

    // Test 6: Cleanup
    console.log('\n6. Cleaning up test data...');
    await databases.deleteDocument(databaseId, 'requests', request.$id);
    await databases.deleteDocument(databaseId, 'queues', queue.$id);
    await databases.deleteDocument(databaseId, 'venues', venue.$id);
    console.log('✓ Test data cleaned up');

    console.log('\n✅ All tests passed! Database is ready for production.');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
```

Run the test:

```bash
node scripts/test-production-db.cjs
```

**Expected Output:**
```
Testing production database...

1. Creating test venue...
✓ Venue created: 67...

2. Creating test queue...
✓ Queue created: 67...

3. Creating test request...
✓ Request created: 67...

4. Querying requests...
✓ Found 1 request(s)

5. Updating request status...
✓ Request status updated to playing

6. Cleaning up test data...
✓ Test data cleaned up

✅ All tests passed! Database is ready for production.
```

## Verification Checklist

Before proceeding to app deployment:

### Database Structure
- [ ] Database `djamms_production` exists
- [ ] All 7 collections created
- [ ] All attributes present in each collection
- [ ] All indexes created
- [ ] Permissions configured correctly

### Functionality Tests
- [ ] Can create documents in all collections
- [ ] Can read documents from all collections
- [ ] Can update documents in all collections
- [ ] Can delete documents from all collections
- [ ] Indexes speed up queries (test with large datasets)
- [ ] Unique constraints work (email, slug, venueId)

### Performance
- [ ] Query response times < 100ms
- [ ] Index usage confirmed (check AppWrite metrics)
- [ ] No permission errors in console

### Security
- [ ] API keys stored securely (not in git)
- [ ] Permissions prevent unauthorized access
- [ ] CORS configured for production domains

## Rollback Procedure

If deployment fails or issues arise:

### Option 1: Delete and Recreate
```bash
# Delete all collections (manual in AppWrite Console)
# Then re-run deployment script
node scripts/schema-manager/appwrite-schema.cjs --apply --create-collections
```

### Option 2: Point to Development
```bash
# Revert to development database temporarily
export APPWRITE_PROJECT_ID=68cc86c3002b27e13947
export APPWRITE_DATABASE_ID=main-db
```

## Monitoring

### AppWrite Console Metrics
- Database size
- Request count
- Response times
- Error rates

### Application Logs
```javascript
// Add to services
console.log('[Database] Operation:', operation, 'Time:', duration, 'ms');
```

## Troubleshooting

### Issue: "Database not found"
**Solution**: Ensure database ID in `.env.production` matches AppWrite Console

### Issue: "Collection not found"
**Solution**: Re-run schema manager with `--create-collections` flag

### Issue: "Permission denied"
**Solution**: Check collection permissions in AppWrite Console

### Issue: "Attribute not found"
**Solution**: Wait 1 minute for attributes to process, then retry

### Issue: "Index creation failed"
**Solution**: Ensure attributes exist before creating indexes

## Next Steps

After successful database deployment:

1. ✅ Update frontend `.env` files with production project ID
2. ✅ Test authentication flow with production database
3. ✅ Test request lifecycle (kiosk → queue → player → analytics)
4. → Proceed to **Task 13: Build and Deploy All Apps**

## Production Environment Variables

For reference, here's the complete production `.env`:

```bash
# AppWrite Production
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<PRODUCTION_PROJECT_ID>
APPWRITE_API_KEY=<PRODUCTION_API_KEY>
APPWRITE_DATABASE_ID=djamms_production

# Frontend (copy to each app's .env.production)
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<PRODUCTION_PROJECT_ID>
VITE_APPWRITE_DATABASE_ID=djamms_production

# YouTube API
VITE_YOUTUBE_API_KEY=<YOUR_KEY>

# Stripe Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# URLs (update after Vercel deployment)
VITE_APP_URL=https://djamms.app
VITE_PLAYER_URL=https://player.djamms.app
VITE_KIOSK_URL=https://kiosk.djamms.app
VITE_ADMIN_URL=https://admin.djamms.app
VITE_AUTH_URL=https://auth.djamms.app
VITE_DASHBOARD_URL=https://dashboard.djamms.app
```

## Success Criteria

Task 12 is complete when:

- ✅ Production AppWrite project created
- ✅ Database `djamms_production` exists
- ✅ All 7 collections deployed with correct schemas
- ✅ All indexes created and functional
- ✅ Permissions configured appropriately
- ✅ CRUD operations tested and working
- ✅ Test script passes all checks
- ✅ Environment variables documented
- ✅ Rollback procedure documented

---

**Task 12 Status**: Ready for execution
**Estimated Time**: 30-45 minutes
**Risk Level**: Low (can rollback to development database)
**Next Task**: Task 13 - Build and Deploy All Apps

## Notes

- Keep development database active during deployment
- Test production database thoroughly before switching apps
- Have rollback plan ready
- Monitor error logs closely after deployment
- Consider blue-green deployment for zero downtime

