# URGENT: Deploy Fixed Code to Production

## Current Situation

🔴 **PRODUCTION IS BROKEN**
- Site: https://www.djamms.app/player/venue-001
- Error: "Invalid document structure: Attribute 'priorityQueue' has invalid type"
- Cause: Old code is still deployed (sends arrays instead of JSON strings)

✅ **FIX IS READY BUT NOT DEPLOYED**
- All code fixed in commit: `6ca0a9b`
- All apps built successfully
- Code is on GitHub main branch
- **Just needs to be deployed!**

## Quick Fix: Deploy Via AppWrite Console

### Step 1: Go to AppWrite Console
Open: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947

### Step 2: Navigate to Sites
1. Click "Sites" in left sidebar
2. You should see your site (might be called "djamms-unified", "DJAMMS Web App", or similar)

### Step 3: Create New Deployment
1. Click on your site name
2. Click "Create Deployment" button
3. Choose deployment source:

#### Option A: GitHub (Recommended)
- Source: **GitHub**
- Repository: `SystemVirtue/djamms-50-pg`
- Branch: `main`
- Commit: `6ca0a9b` (or select "Latest")
- Click "Deploy"

#### Option B: Manual Upload
- Source: **Manual**
- Upload the built files from your local machine:
  - `apps/player/dist/` (MOST IMPORTANT - contains the fix!)
  - `apps/auth/dist/`
  - `apps/admin/dist/`
  - `apps/kiosk/dist/`
  - `apps/landing/dist/`
  - `apps/dashboard/dist/`

### Step 4: Wait for Build
- Build will take 2-5 minutes
- Watch the build logs for any errors
- Should complete successfully

### Step 5: Activate Deployment
- Once build completes, click "Activate" button
- This makes the new version live

### Step 6: Verify Fix
1. Hard refresh the player: https://www.djamms.app/player/venue-001
   - Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Safari: `Cmd + Option + R`

2. Open browser console (F12)

3. Try to skip a track or let one finish

4. **Should see NO errors!** ✅

## Alternative: Deploy Via CLI (If Console Doesn't Work)

If you can't access the console or deployment is failing:

### Find Your Site ID
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite
cat appwrite.config.json | grep -A 10 '"sites"'
```

Look for the `"$id"` field - it might not be "djamms-unified"

### Update Site Configuration
If the site configuration is wrong, update it in `appwrite.config.json`:

```json
{
  "$id": "your-actual-site-id",
  "name": "DJAMMS",
  "enabled": true,
  "logging": true,
  "framework": "static",  // Changed from "sveltekit"
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "../../apps/player/dist",  // Point to player dist
  "buildRuntime": "node-18.0"
}
```

### Deploy
```bash
cd functions/appwrite
npx appwrite push site
```

## What the Fix Does

The fix changes how queue updates are sent to the database:

**Before (BROKEN):**
```typescript
await updateDocument(db, 'queues', id, {
  priorityQueue: [...tracks]  // ❌ Array
});
```

**After (FIXED):**
```typescript
await updateDocument(db, 'queues', id, {
  priorityQueue: JSON.stringify([...tracks])  // ✅ JSON String
});
```

## Files That Need to Be Deployed

The critical file with the fix:
```
apps/player/dist/assets/index-C985DkqP.js
```

This contains the fixed `QueueManagementService` with all queue operations properly stringifying JSON.

## Verification Checklist

After deployment:
- [ ] Go to https://www.djamms.app/player/venue-001
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Open console (F12)
- [ ] Let track finish or click skip
- [ ] **No "Invalid document structure" error** ✅
- [ ] Queue updates successfully ✅

## If Still Showing Errors After Deployment

1. **Clear Browser Cache:**
   ```
   Chrome: Settings > Privacy > Clear browsing data
   Safari: Develop > Empty Caches
   ```

2. **Check Deployment Status:**
   - Go to AppWrite Console > Sites > Deployments
   - Verify the new deployment is "Active"
   - Check deployment time matches recent build

3. **Verify Code Version:**
   - Open https://www.djamms.app/player/venue-001
   - Open DevTools > Sources tab
   - Find `index-*.js` file
   - Search for "JSON.stringify" in QueueManagementService
   - Should find multiple instances

4. **Check Build Logs:**
   - In AppWrite Console, check build logs for errors
   - Verify build completed successfully
   - Check for any TypeScript compilation errors

## Emergency Workaround

If deployment is completely blocked and you need the player to work NOW:

### Option: Use Local Dev Server
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
npm run dev:player
```

Then access locally at: http://localhost:3001/player/venue-001

This uses the fixed code from your local machine.

## Contact Points

If you're stuck:
1. Check AppWrite Console deployment logs
2. Verify GitHub repository has latest code (commit 6ca0a9b)
3. Ensure AppWrite project has access to GitHub repository
4. Check if site has correct build configuration

## Summary

🎯 **The fix is done, just needs deployment!**

**Quickest Path:**
1. Open AppWrite Console
2. Go to Sites
3. Create GitHub deployment from `main` branch
4. Activate once built
5. Hard refresh player
6. ✅ Should work!

---

**Last Code Update:** Commit 6ca0a9b (Oct 17, 2025, 12:35 AM)  
**Status:** ✅ Fixed, ❌ Not Deployed  
**Action Required:** Deploy via AppWrite Console
