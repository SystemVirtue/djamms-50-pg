# Deployment Instructions - Updated Code

## Current Status

✅ **Code Fixed and Built**
- All queue methods now stringify JSON correctly
- Production builds completed successfully (all 6 apps)
- Changes committed and pushed to GitHub

❌ **Not Yet Deployed**
- Production site (https://www.djamms.app) still running old code
- Need to deploy updated builds to AppWrite Sites

## Built Files Location

All apps successfully built to:
```
apps/player/dist/     ✅ (387.60 kB) - CRITICAL: Contains queue fixes
apps/auth/dist/       ✅ (312.74 kB)
apps/admin/dist/      ✅ (387.60 kB)
apps/kiosk/dist/      ✅ (366.33 kB)
apps/landing/dist/    ✅ (146.05 kB)
apps/dashboard/dist/  ✅ (216.06 kB)
```

## Deployment Options

### Option 1: AppWrite Console UI (Recommended)

1. **Go to AppWrite Console:**
   - Open: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites

2. **Find your site:**
   - Look for "djamms-unified" or "DJAMMS Web App"
   - Should show current deployment status

3. **Create New Deployment:**
   - Click "Create Deployment"
   - Select deployment type: **"Manual Upload"** or **"GitHub"**

#### If Manual Upload:
   - Upload the built files from `apps/*/dist/`
   - Make sure to deploy the **player** app first (contains critical fixes)

#### If GitHub:
   - Connect to repository: `SystemVirtue/djamms-50-pg`
   - Branch: `main`
   - Latest commit: `8739eef` (contains all fixes)
   - Build command: `npm run build`
   - Output directory: Configure for each app

4. **Activate Deployment:**
   - Once build completes, click "Activate"
   - Site will update to new version

### Option 2: AppWrite CLI (If Configured)

The CLI deployment is failing with configuration issues. To fix:

1. **Check site ID:**
   ```bash
   cd functions/appwrite
   npx appwrite projects getSite --projectId 68cc86c3002b27e13947
   ```

2. **Update appwrite.config.json** if needed to point to correct site

3. **Deploy:**
   ```bash
   npx appwrite push site
   ```

### Option 3: GitHub Actions (If Set Up)

If you have GitHub Actions configured:
- The push to `main` branch should trigger automatic deployment
- Check: https://github.com/SystemVirtue/djamms-50-pg/actions

## Verification After Deployment

Once deployed, verify the fix:

1. **Open player:**
   ```
   https://www.djamms.app/player/venue-001
   ```

2. **Check console for errors:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Should see NO "Invalid document structure" errors

3. **Test queue operations:**
   - Skip a track (or let it finish)
   - Should update queue without errors
   - Check console - should see success messages

4. **Expected console output:**
   ```
   [QueueService] Completed track: Track Name
   ✓ Queue updated successfully
   ```

## What's Been Fixed

The following changes are in the built files but not yet deployed:

### packages/shared/src/services/QueueManagementService.ts
- ✅ All queue updates now use `JSON.stringify()`
- ✅ All queue reads now use `JSON.parse()`
- ✅ Added helper methods: `parseQueue()`, `getParsedQueues()`
- ✅ Fixed 13 methods: addTrack, removeTrack, reorderQueue, etc.
- ✅ Changed `currentTrack` → `nowPlaying` to match schema

## Deployment Checklist

- [x] Code fixed and tested locally
- [x] All apps built successfully
- [x] Changes committed to GitHub (commit 8739eef)
- [ ] **Deploy to AppWrite Sites** ← YOU ARE HERE
- [ ] Verify player works without errors
- [ ] Test skip/complete track operations
- [ ] Monitor for any new errors

## Quick Deploy via Console

**Fastest method:**

1. Go to: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites
2. Select your site ("djamms-unified" or similar)
3. Click "Create Deployment"
4. Select "GitHub" as source
5. Branch: `main`, Commit: `8739eef` (latest)
6. Click "Deploy"
7. Wait for build to complete
8. Click "Activate"
9. Test: https://www.djamms.app/player/venue-001

## Troubleshooting

### If deployment fails:
- Check AppWrite build logs for errors
- Verify build commands are correct in site configuration
- Ensure all dependencies are in package.json

### If player still shows errors after deployment:
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check browser console for new errors
- Verify deployment activated successfully

### If unsure which site to deploy:
```bash
# List all sites in project
curl -X GET \
  https://syd.cloud.appwrite.io/v1/projects/68cc86c3002b27e13947/sites \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -H "X-Appwrite-Key: [YOUR_API_KEY]"
```

---

**Next Step:** Deploy to AppWrite Sites using one of the options above

**Once Deployed:** Player should work without "Invalid document structure" errors! 🎉
