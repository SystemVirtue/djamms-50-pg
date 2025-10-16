# 🚨 MANUAL DEPLOYMENT REQUIRED

## Problem Confirmed

**Production is running OLD code:**
- Bundle: `index-C7TrqraU.js` (doesn't have JSON.stringify fix)
- Still sending arrays instead of JSON strings to database
- Result: "Invalid document structure" error

**Your local build has FIXED code:**
- Bundle: `index-BZiHKC7m.js` (has JSON.stringify fix)
- Correctly stringifies all queue operations
- Result: Would work perfectly if deployed

## Why Auto-Deploy Isn't Working

AppWrite Sites doesn't auto-deploy from GitHub commits by default. You need to either:
1. Configure GitHub integration in AppWrite Console
2. Manually trigger deployments after each commit

## SOLUTION: Manual Deployment via AppWrite Console

### Step-by-Step (2 minutes):

1. **Open AppWrite Console:**
   ```
   https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites
   ```

2. **Find Your Site:**
   - Look for site named "djamms-unified" or "DJAMMS" or similar
   - Click on the site name

3. **Create New Deployment:**
   - Click **"Create Deployment"** button (top right)
   
4. **Configure Deployment:**
   - **Source:** GitHub
   - **Repository:** SystemVirtue/djamms-50-pg
   - **Branch:** main
   - **Commit:** Latest (or select `d5557f0`)
   - **Build Command:** `npm install && npm run build`
   - **Output Directory:** `apps/player/dist`
   
5. **Start Build:**
   - Click **"Deploy"** button
   - Wait 2-5 minutes for build to complete
   - Watch build logs for any errors

6. **Activate Deployment:**
   - Once build shows "Ready" status
   - Click **"Activate"** button
   - This makes it live on production

7. **Test:**
   - Hard refresh: https://www.djamms.app/player/venue-001
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`
   - Open Console (F12) - should see NO errors! ✅

## Alternative: Setup Auto-Deploy (One-Time Setup)

To avoid manual deployments in the future:

### In AppWrite Console:

1. Go to your site settings
2. Look for "GitHub Integration" or "Continuous Deployment"
3. Connect your GitHub repository
4. Enable auto-deploy on push to `main` branch
5. Configure build settings:
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `apps/player/dist`

### Then commits will auto-deploy:
```bash
git commit -m "fix: Something"
git push origin main
# AppWrite automatically builds and deploys! 🎉
```

## What Happens After Deployment

Once the new code is deployed:

✅ **Production bundle changes:**
- From: `index-C7TrqraU.js` (old)
- To: `index-BZiHKC7m.js` (fixed)

✅ **Queue operations work:**
```javascript
// Fixed code properly stringifies:
await updateDocument(db, 'queues', id, {
  priorityQueue: JSON.stringify([...tracks]),  // ✅ String
  mainQueue: JSON.stringify([...tracks])       // ✅ String
});
```

✅ **No more errors:**
- No "Invalid document structure" errors
- Skip track works perfectly
- Complete track works perfectly
- Queue updates successfully

## Verify Deployment Worked

After deployment, check:

1. **New bundle deployed:**
   ```bash
   curl -s "https://www.djamms.app/player/venue-001" | grep -o 'index-[a-zA-Z0-9_-]*\.js'
   ```
   Should show: `index-BZiHKC7m.js` (not `index-C7TrqraU.js`)

2. **Player works:**
   - Open: https://www.djamms.app/player/venue-001
   - Open Console (F12)
   - Let track finish or skip
   - **No errors in console** ✅

3. **Queue updates:**
   - Check AppWrite Database Console
   - Look at queue document for venue-001
   - mainQueue and priorityQueue should update successfully

## Quick Reference

**AppWrite Console:** https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites

**Latest Commits with Fixes:**
- `a687599` - JSON stringify fix (CRITICAL)
- `182e0e9` - SvelteKit cleanup
- `d5557f0` - Documentation

**Build Command:**
```bash
npm install && npm run build
```

**Output Directory:**
```
apps/player/dist
```

**Player URL:**
```
https://www.djamms.app/player/venue-001
```

---

## Summary

🔴 **Problem:** Production running old code  
✅ **Solution:** Manual deployment via AppWrite Console  
⏱️ **Time:** 2-5 minutes  
🎯 **Result:** Player works perfectly with no errors  

**Action Required:** Go to AppWrite Console and create deployment from GitHub
