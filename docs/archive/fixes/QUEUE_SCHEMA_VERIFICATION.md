# Queue Schema Verification & Fix Guide

## Problem

The error message clearly states:
```
Invalid document structure: Attribute "priorityQueue" has invalid type. 
Value must be a valid string and no longer than 100000 chars
```

This means **the code is sending an array**, but the database expects **a JSON string**.

## Root Cause

**Production is still running OLD code** that doesn't have the JSON.stringify fix!

- Production bundle: `index-C7TrqraU.js` ❌ (OLD - sends arrays)
- Your local build: `index-BZiHKC7m.js` ✅ (FIXED - sends JSON strings)

## Schema Requirements

The AppWrite database schema should have these attributes for the `queues` collection:

| Attribute | Type | Size | Required | Notes |
|-----------|------|------|----------|-------|
| `venueId` | string | 255 | ✅ Yes | Unique identifier |
| `priorityQueue` | **string** | **100000** | ✅ Yes | JSON string of tracks |
| `mainQueue` | **string** | **100000** | ✅ Yes | JSON string of tracks |
| `nowPlaying` | string | 10000 | ❌ No | JSON string of current track |
| `createdAt` | datetime | - | ✅ Yes | Auto-managed |
| `updatedAt` | datetime | - | ❌ No | Custom timestamp |

## How to Verify Schema in AppWrite Console

### Step 1: Open AppWrite Console

Go to: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947

### Step 2: Navigate to Database

1. Click **"Databases"** in left sidebar
2. Click **"djamms_production"** (or your database name)
3. Click **"queues"** collection

### Step 3: Check Attributes Tab

Click **"Attributes"** tab and verify:

**✅ Priority Queue Attribute:**
- Key: `priorityQueue`
- Type: **string** (not array, not JSON, not object)
- Size: **100000** characters
- Required: **Yes**
- Default: None

**✅ Main Queue Attribute:**
- Key: `mainQueue`  
- Type: **string**
- Size: **100000** characters
- Required: **Yes**
- Default: None

**✅ Now Playing Attribute:**
- Key: `nowPlaying`
- Type: **string**
- Size: **10000** characters  
- Required: **No** (optional)
- Default: None

### Step 4: Check A Document

Click **"Documents"** tab:

1. Open the `venue-001` document
2. Check the `priorityQueue` field:
   - Should look like: `"[{\"id\":\"...\",\"title\":\"...\"}]"`
   - NOT like: `[{id: "...", title: "..."}]`
3. Should be a **string containing JSON**, not an actual array

## If Schema is Incorrect

### Problem 1: Attribute is Not a String

If `priorityQueue` or `mainQueue` is set as:
- ❌ `array`
- ❌ `object`
- ❌ Any type other than `string`

**Fix:**
1. You'll need to **delete** the attribute
2. Recreate it as a **string** with size **100000**
3. The data in existing documents will be lost (you'll need to reload the queue)

### Problem 2: String Size is Too Small

If size is less than 100000 (e.g., 1000, 5000):

**Fix:**
1. Click the attribute
2. Click **"Update"**
3. Change size to **100000**
4. Save

### Problem 3: Attribute is Required = No

If `priorityQueue` or `mainQueue` is optional:

**Fix:**
1. Click the attribute
2. Click **"Update"**  
3. Set Required to **Yes**
4. Save

## After Verifying Schema

Once the schema is confirmed to be correct:

### The Real Issue is Deployment

The schema is probably fine. **The real problem is that production is running OLD code.**

Your code:
```typescript
// ✅ NEW CODE (in local build):
await updateDocument(db, 'queues', id, {
  priorityQueue: JSON.stringify(tracks),  // Sends string
  mainQueue: JSON.stringify(tracks)        // Sends string
});

// ❌ OLD CODE (in production):
await updateDocument(db, 'queues', id, {
  priorityQueue: tracks,  // Sends array!
  mainQueue: tracks       // Sends array!
});
```

## Critical Action Required

**You MUST deploy the fixed code via AppWrite Console:**

1. Go to: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites
2. Find your site
3. Click **"Create Deployment"**
4. Select **GitHub** → **main** branch → Latest commit (`1153a2a`)
5. Deploy and Activate

**Until you deploy, the error will persist because production is running the OLD code without JSON.stringify!**

## Testing Schema Manually

You can test if the schema accepts JSON strings by manually updating a document:

### Via Browser Console (on player page):

```javascript
// Get AppWrite client
const { databases } = window.appwrite;

// Test update with JSON string
await databases.updateDocument(
  '68e57de9003234a84cae',  // Database ID
  'queues',                 // Collection ID
  'venue-001',              // Document ID
  {
    priorityQueue: JSON.stringify([]),  // Empty array as JSON string
    mainQueue: JSON.stringify([])       // Empty array as JSON string
  }
);

// Should succeed if schema is correct ✅
// Should fail if schema expects array type ❌
```

If this works, the schema is fine - you just need to deploy the fixed code!

## Summary

1. **Schema is probably correct** (string type, 100000 size)
2. **Production code is wrong** (sending arrays, not JSON strings)
3. **Your fix is ready** (local build has JSON.stringify)
4. **Action needed:** Deploy via AppWrite Console

The error will disappear once you deploy the fixed code that properly stringifies the arrays before sending to the database.

---

**Next Step:** Deploy the fixed code, THEN verify schema if error persists.
