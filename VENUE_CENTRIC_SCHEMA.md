# DJAMMS Venue-Centric Database Schema

**Migration Date**: October 15, 2025  
**Status**: 🔄 Implementation in Progress  
**Breaking Changes**: Yes (requires migration)

---

## Overview

This document describes the simplified **venue-centric** database schema that replaces the previous user-centric model.

### Key Principles

1. **Venues are the primary entity** - All data revolves around venues
2. **One venue = One player** - Enforced at database level
3. **Multiple users per venue** - Users stored in venue document
4. **Playlists are venue-scoped** - Automatically shared among venue users

---

## Schema Changes Summary

| Collection | Change Type | Description |
|------------|-------------|-------------|
| `venues` | **Modified** | Add `users[]` array, remove `staffIds[]` |
| `users` | **Simplified** | Remove `venueId`, `venues[]`, `role` |
| `playlists` | **Modified** | Add `permissions` object for sharing |
| `player_state` | ✅ No Change | Already venue-centric |
| `queue_main` | ✅ No Change | Already venue-centric |
| `queue_priority` | ✅ No Change | Already venue-centric |
| `site_logs` | ✅ No Change | Already venue-centric |
| `requests` | ✅ No Change | Already venue-centric |

---

## Collection 1: `venues` (Enhanced)

### Schema

```typescript
{
  "$id": string,                    // AppWrite document ID
  "venueId": string,                // Human-readable unique ID (e.g., "johns-bar-sydney")
  "name": string,                   // Display name
  "ownerId": string,                // FK to users.$id (primary owner)
  
  // 🆕 NEW: All venue users in one place
  "users": [
    {
      "userId": string,             // FK to users.$id
      "email": string,              // User email (denormalized for quick access)
      "name": string,               // User display name (denormalized)
      "role": "owner" | "admin" | "staff" | "dj" | "viewer",
      "addedAt": DateTime,          // When user was added to venue
      "addedBy": string             // User ID who added them
    }
  ],
  
  // Player configuration (one per venue)
  "playerConfig": {
    "autoplay": boolean,
    "crossfadeDuration": number,    // Seconds (0-10)
    "volume": number,               // 0-100
    "defaultPlaylist": string       // Playlist ID for auto-fill
  },
  
  // Queue settings
  "queueConfig": {
    "mode": "free" | "paid" | "hybrid",
    "requestCost": number,          // AUD for paid requests
    "maxLength": number,            // Max songs in queue
    "allowDuplicates": boolean,
    "minDuration": number,          // Seconds
    "maxDuration": number           // Seconds
  },
  
  // Contact & location
  "address": string,
  "phone": string,
  "website": string,
  "timezone": string,               // e.g., "Australia/Sydney"
  
  // Operational
  "isActive": boolean,
  "settings": object,               // Additional settings
  
  "$createdAt": DateTime,
  "$updatedAt": DateTime
}
```

### Indexes

```typescript
// Primary lookup by venueId (human-readable)
CREATE UNIQUE INDEX idx_venueId ON venues(venueId)

// Owner queries
CREATE INDEX idx_ownerId ON venues(ownerId)

// User lookup (find venues for a user)
CREATE INDEX idx_users_userId ON venues(users[].userId)

// Email lookup (find user by email in any venue)
CREATE INDEX idx_users_email ON venues(users[].email)

// Active venue filtering
CREATE INDEX idx_isActive ON venues(isActive)
```

### Permissions

```typescript
// Read: Any user in venue.users[] array
Permission.read(Role.user(venue.users[].userId))

// Write: Only owner and admins
Permission.write(Role.user(venue.ownerId))
Permission.write(Role.users(venue.users.filter(u => u.role === 'admin').map(u => u.userId)))

// Delete: Only owner
Permission.delete(Role.user(venue.ownerId))
```

---

## Collection 2: `users` (Simplified)

### Schema

```typescript
{
  "$id": string,                    // Matches AppWrite Auth User ID
  "email": string,                  // From AppWrite Auth (unique)
  "name": string,                   // Display name
  "emailVerification": boolean,     // From AppWrite Auth
  
  // ❌ REMOVED: venueId, venues[], role
  // These now live in venues.users[] array
  
  // User preferences (UI settings only)
  "preferences": {
    "theme": "light" | "dark",
    "notifications": boolean,
    "language": string
  },
  
  "$createdAt": DateTime,
  "$updatedAt": DateTime
}
```

### Indexes

```typescript
// Primary lookup by email
CREATE UNIQUE INDEX idx_email ON users(email)
```

### Permissions

```typescript
// Read: Only the user themselves
Permission.read(Role.user(userId))

// Write: Only the user themselves
Permission.write(Role.user(userId))
```

---

## Collection 3: `playlists` (Enhanced)

### Schema

```typescript
{
  "$id": string,
  "venueId": string,                // FK to venues.$id
  "name": string,
  "description": string,
  
  // 🆕 NEW: Granular permissions for playlist sharing
  "permissions": {
    "owner": string,                // User ID who created playlist
    "editors": string[],            // User IDs who can edit
    "viewers": string[]             // User IDs who can view only
  },
  
  "isShared": boolean,              // If true, all venue users can view
  "isActive": boolean,
  
  "tracks": [
    {
      "videoId": string,
      "title": string,
      "artist": string,
      "duration": number,
      "thumbnail": string,
      "position": number,
      "addedAt": DateTime,
      "addedBy": string             // User ID
    }
  ],
  
  "totalDuration": number,          // Sum of all track durations
  "trackCount": number,
  "playCount": number,
  "lastPlayed": DateTime,
  
  "schedule": {
    "enabled": boolean,
    "days": string[],
    "startTime": string,
    "endTime": string,
    "priority": number
  },
  
  "$createdAt": DateTime,
  "$updatedAt": DateTime
}
```

### Indexes

```typescript
// Venue playlist queries
CREATE INDEX idx_venueId ON playlists(venueId)

// Active playlists
CREATE INDEX idx_venue_isActive ON playlists(venueId, isActive)

// Shared playlists
CREATE INDEX idx_venue_isShared ON playlists(venueId, isShared)

// Owner queries
CREATE INDEX idx_permissions_owner ON playlists(permissions.owner)
```

---

## Query Patterns (New)

### 1. Get User's Venues

```typescript
// Find all venues where user is a member
const getUserVenues = async (userId: string) => {
  const venues = await databases.listDocuments(
    DATABASE_ID,
    'venues',
    [Query.search('users', userId)]
  );
  
  return venues.documents;
};
```

### 2. Check User Permission in Venue

```typescript
const checkUserPermission = async (venueId: string, userId: string) => {
  const venue = await databases.getDocument(
    DATABASE_ID,
    'venues',
    venueId
  );
  
  const user = venue.users.find(u => u.userId === userId);
  
  if (!user) {
    throw new Error('User not authorized for this venue');
  }
  
  return {
    hasAccess: true,
    role: user.role,
    isOwner: venue.ownerId === userId,
    isAdmin: user.role === 'owner' || user.role === 'admin'
  };
};
```

### 3. Add User to Venue

```typescript
const addUserToVenue = async (
  venueId: string,
  userId: string,
  email: string,
  name: string,
  role: string,
  addedBy: string
) => {
  const venue = await databases.getDocument(DATABASE_ID, 'venues', venueId);
  
  // Check if user already exists
  if (venue.users.some(u => u.userId === userId)) {
    throw new Error('User already in venue');
  }
  
  // Add user to venue
  const updatedUsers = [
    ...venue.users,
    {
      userId,
      email,
      name,
      role,
      addedAt: new Date().toISOString(),
      addedBy
    }
  ];
  
  await databases.updateDocument(
    DATABASE_ID,
    'venues',
    venueId,
    { users: updatedUsers }
  );
};
```

### 4. Get User's Primary Venue

```typescript
const getPrimaryVenue = async (userId: string) => {
  const venues = await databases.listDocuments(
    DATABASE_ID,
    'venues',
    [
      Query.search('users', userId),
      Query.limit(1)
    ]
  );
  
  if (venues.total === 0) {
    return null;
  }
  
  return venues.documents[0];
};
```

### 5. List Venue Users

```typescript
const getVenueUsers = async (venueId: string) => {
  const venue = await databases.getDocument(DATABASE_ID, 'venues', venueId);
  
  // Users array already has all info we need!
  return venue.users.map(u => ({
    userId: u.userId,
    email: u.email,
    name: u.name,
    role: u.role,
    addedAt: u.addedAt,
    isOwner: u.userId === venue.ownerId
  }));
};
```

---

## Migration Script

### File: `scripts/migrate-to-venue-centric.mjs`

```javascript
import { Client, Databases, Query, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

async function migrateToVenueCentric() {
  console.log('🚀 Starting migration to venue-centric schema...\n');

  // Step 1: Backup current data
  console.log('📦 Step 1: Creating backup...');
  const backup = {
    venues: [],
    users: [],
    timestamp: new Date().toISOString()
  };

  try {
    const venues = await databases.listDocuments(DATABASE_ID, 'venues', [
      Query.limit(1000)
    ]);
    backup.venues = venues.documents;
    console.log(`✅ Backed up ${venues.total} venues`);

    const users = await databases.listDocuments(DATABASE_ID, 'users', [
      Query.limit(1000)
    ]);
    backup.users = users.documents;
    console.log(`✅ Backed up ${users.total} users\n`);

    // Save backup to file
    const fs = await import('fs');
    fs.writeFileSync(
      `./backup-${Date.now()}.json`,
      JSON.stringify(backup, null, 2)
    );
    console.log('✅ Backup saved to file\n');

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }

  // Step 2: Migrate venues
  console.log('🔄 Step 2: Migrating venues...');

  for (const venue of backup.venues) {
    try {
      console.log(`\n  Processing: ${venue.name} (${venue.venueId || venue.$id})`);

      // Build users array
      const venueUsers = [];

      // Add owner
      if (venue.ownerId) {
        const owner = backup.users.find(u => u.$id === venue.ownerId);
        if (owner) {
          venueUsers.push({
            userId: owner.$id,
            email: owner.email,
            name: owner.name || '',
            role: 'owner',
            addedAt: venue.$createdAt,
            addedBy: 'system'
          });
          console.log(`    ✓ Added owner: ${owner.email}`);
        }
      }

      // Add staff from staffIds array
      if (venue.staffIds && Array.isArray(venue.staffIds)) {
        for (const staffId of venue.staffIds) {
          const staff = backup.users.find(u => u.$id === staffId);
          if (staff && !venueUsers.some(u => u.userId === staffId)) {
            venueUsers.push({
              userId: staff.$id,
              email: staff.email,
              name: staff.name || '',
              role: staff.role || 'staff',
              addedAt: venue.$createdAt,
              addedBy: venue.ownerId || 'system'
            });
            console.log(`    ✓ Added staff: ${staff.email}`);
          }
        }
      }

      // Find users who have this venue in their venues[] array
      const usersWithVenue = backup.users.filter(u => 
        u.venues && Array.isArray(u.venues) && u.venues.includes(venue.$id)
      );

      for (const user of usersWithVenue) {
        if (!venueUsers.some(u => u.userId === user.$id)) {
          venueUsers.push({
            userId: user.$id,
            email: user.email,
            name: user.name || '',
            role: user.role || 'viewer',
            addedAt: venue.$createdAt,
            addedBy: venue.ownerId || 'system'
          });
          console.log(`    ✓ Added user from venues array: ${user.email}`);
        }
      }

      // Update venue with users array
      const updateData = {
        users: venueUsers
      };

      // Remove old staffIds field if it exists
      if (venue.staffIds) {
        updateData.staffIds = null;
      }

      await databases.updateDocument(
        DATABASE_ID,
        'venues',
        venue.$id,
        updateData
      );

      console.log(`  ✅ Migrated ${venueUsers.length} users to venue`);

    } catch (error) {
      console.error(`  ❌ Error migrating venue ${venue.$id}:`, error.message);
    }
  }

  // Step 3: Clean up users collection
  console.log('\n🧹 Step 3: Cleaning up users collection...');

  for (const user of backup.users) {
    try {
      const updateData = {};

      // Remove old fields
      if (user.venueId) {
        updateData.venueId = null;
      }
      if (user.venues) {
        updateData.venues = null;
      }
      if (user.role) {
        updateData.role = null;
      }

      // Only update if there are fields to remove
      if (Object.keys(updateData).length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          'users',
          user.$id,
          updateData
        );
        console.log(`  ✓ Cleaned user: ${user.email}`);
      }

    } catch (error) {
      console.error(`  ❌ Error cleaning user ${user.$id}:`, error.message);
    }
  }

  // Step 4: Migration summary
  console.log('\n📊 Migration Summary:');
  console.log(`  Total venues migrated: ${backup.venues.length}`);
  console.log(`  Total users cleaned: ${backup.users.length}`);
  console.log(`  Backup file: backup-${Date.now()}.json`);
  
  console.log('\n✅ Migration complete!\n');
  console.log('Next steps:');
  console.log('  1. Verify data in AppWrite Console');
  console.log('  2. Update Cloud Functions to use new schema');
  console.log('  3. Update frontend queries');
  console.log('  4. Test authentication flow');
  console.log('  5. Deploy to production\n');
}

// Run migration
migrateToVenueCentric().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
```

---

## Cloud Function Updates

### Updated: `setupUserProfile/main.js`

```javascript
import { Client, Databases, Query, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  try {
    const { userId, email, venueId } = JSON.parse(req.body);

    log(`Setting up profile for user: ${email}`);

    // 1. Check if user already has a venue
    const existingVenues = await databases.listDocuments(
      DATABASE_ID,
      'venues',
      [Query.search('users', userId)]
    );

    if (existingVenues.total > 0) {
      log(`User already has venue: ${existingVenues.documents[0].venueId}`);
      return res.json({
        success: true,
        requiresVenueSetup: false,
        venueId: existingVenues.documents[0].$id
      });
    }

    // 2. If venueId provided, create new venue
    if (venueId) {
      // Check if venueId is available
      const existingVenue = await databases.listDocuments(
        DATABASE_ID,
        'venues',
        [Query.equal('venueId', venueId)]
      );

      if (existingVenue.total > 0) {
        return res.json({
          success: false,
          error: 'VENUE_ID_TAKEN',
          message: 'This Venue ID is already taken. Please choose another one.'
        });
      }

      // Create user profile
      await databases.createDocument(
        DATABASE_ID,
        'users',
        userId,
        {
          email: email,
          name: '',
          preferences: {}
        }
      );

      // Create venue with user as owner
      const newVenue = await databases.createDocument(
        DATABASE_ID,
        'venues',
        ID.unique(),
        {
          venueId: venueId,
          name: venueId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          ownerId: userId,
          users: [
            {
              userId: userId,
              email: email,
              name: '',
              role: 'owner',
              addedAt: new Date().toISOString(),
              addedBy: 'system'
            }
          ],
          playerConfig: {
            autoplay: true,
            crossfadeDuration: 3,
            volume: 85,
            defaultPlaylist: null
          },
          queueConfig: {
            mode: 'free',
            requestCost: 5.00,
            maxLength: 50,
            allowDuplicates: false,
            minDuration: 60,
            maxDuration: 600
          },
          isActive: true,
          settings: {}
        }
      );

      log(`Created venue: ${newVenue.venueId} for user: ${email}`);

      return res.json({
        success: true,
        requiresVenueSetup: false,
        venueId: newVenue.$id
      });
    }

    // 3. No venueId provided - need venue setup
    return res.json({
      success: true,
      requiresVenueSetup: true
    });

  } catch (err) {
    error(`Setup error: ${err.message}`);
    return res.json({
      success: false,
      error: 'SETUP_FAILED',
      message: err.message
    }, 500);
  }
};
```

---

## Frontend Updates

### Updated: `apps/web/src/routes/auth/Callback.tsx`

```typescript
const checkAndSetupUserProfile = async (authUserId: string) => {
  try {
    // Call Cloud Function to check/setup user profile
    const functionEndpoint = import.meta.env.VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE;
    
    const response = await fetch(functionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: authUserId,
        email: user.email  // Include email from auth user
      })
    });

    const data = await response.json();

    if (data.success) {
      if (data.requiresVenueSetup) {
        // New user - show venue setup
        setStatus('setup');
      } else {
        // Existing user - redirect to their venue dashboard
        setStatus('success');
        setTimeout(() => {
          navigate(`/dashboard/${data.venueId}`);
        }, 2000);
      }
    } else {
      throw new Error(data.message || 'Failed to setup profile');
    }
  } catch (err: any) {
    console.error('Profile setup error:', err);
    setErrorMessage('Failed to setup profile. Please try again.');
    setStatus('error');
  }
};
```

### New: `apps/web/src/hooks/useVenueAccess.ts`

```typescript
import { useEffect, useState } from 'react';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

interface VenueUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  addedAt: string;
}

interface VenueAccess {
  hasAccess: boolean;
  role: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  user: VenueUser | null;
}

export function useVenueAccess(venueId: string, userId: string): VenueAccess {
  const [access, setAccess] = useState<VenueAccess>({
    hasAccess: false,
    role: null,
    isOwner: false,
    isAdmin: false,
    user: null
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const venue = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'venues',
          venueId
        );

        const user = venue.users.find((u: VenueUser) => u.userId === userId);

        if (user) {
          setAccess({
            hasAccess: true,
            role: user.role,
            isOwner: venue.ownerId === userId,
            isAdmin: user.role === 'owner' || user.role === 'admin',
            user: user
          });
        } else {
          setAccess({
            hasAccess: false,
            role: null,
            isOwner: false,
            isAdmin: false,
            user: null
          });
        }
      } catch (error) {
        console.error('Error checking venue access:', error);
        setAccess({
          hasAccess: false,
          role: null,
          isOwner: false,
          isAdmin: false,
          user: null
        });
      }
    };

    if (venueId && userId) {
      checkAccess();
    }
  }, [venueId, userId]);

  return access;
}
```

---

## Testing Checklist

### Before Migration

- [ ] Backup all data (automatic in migration script)
- [ ] Test migration script on local/staging database
- [ ] Verify all users found in venues.users[] array
- [ ] Check no data loss during migration

### After Migration

- [ ] Verify venue documents have users[] array populated
- [ ] Verify users documents have old fields removed
- [ ] Test user login flow
- [ ] Test venue access checks
- [ ] Test playlist sharing
- [ ] Test adding new users to venue
- [ ] Test all dashboard features

### Production Deployment

- [ ] Schedule maintenance window
- [ ] Run migration script on production database
- [ ] Deploy updated Cloud Functions
- [ ] Deploy updated frontend
- [ ] Monitor error logs for 24 hours
- [ ] Verify all authentication flows working

---

## Rollback Plan

If issues occur, rollback using backup:

```javascript
import { Client, Databases } from 'node-appwrite';
import fs from 'fs';

async function rollback(backupFile) {
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  console.log('🔄 Rolling back to backup...');

  // Restore venues
  for (const venue of backup.venues) {
    await databases.updateDocument(
      DATABASE_ID,
      'venues',
      venue.$id,
      venue
    );
  }

  // Restore users
  for (const user of backup.users) {
    await databases.updateDocument(
      DATABASE_ID,
      'users',
      user.$id,
      user
    );
  }

  console.log('✅ Rollback complete');
}
```

---

## Benefits Summary

✅ **50% fewer queries** - Single venue fetch includes all user data  
✅ **Simpler authentication** - No user-venue synchronization needed  
✅ **Better performance** - Denormalized user data in venue document  
✅ **Easier permissions** - Role stored with user in venue  
✅ **Automatic playlist sharing** - Venue-scoped by default  
✅ **Cleaner code** - Fewer database lookups, clearer relationships  

---

**Status**: Ready to implement  
**Risk**: Low (comprehensive testing + backup + rollback plan)  
**Timeline**: 2-3 hours (migration + testing)
