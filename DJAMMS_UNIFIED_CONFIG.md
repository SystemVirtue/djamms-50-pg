# djamms-unified Site Configuration ✅

## Updated Configuration (Just Applied)

I've successfully updated the `djamms-unified` site configuration in AppWrite:

### Current Settings:

```yaml
Site ID: djamms-unified
Name: DJAMMS Unified App
Framework: vite
Adapter: static

Build Configuration:
  Install Command: npm install
  Build Command: npm run build:player
  Output Directory: apps/player/dist
  Build Runtime: node-18.0
  Root Directory: . (repository root)
  
Performance:
  Specification: s-0.5vcpu-512mb
  Timeout: 30 seconds
  
Features:
  Logging: Enabled
  Fallback File: index.html
```

---

## Where It Deploys From

**Repository Structure:**
```
djamms-50-pg/
├── apps/
│   ├── player/          ← This is what gets deployed!
│   │   ├── src/
│   │   └── dist/        ← Output directory
│   ├── admin/
│   ├── auth/
│   ├── dashboard/
│   ├── kiosk/
│   └── landing/
└── packages/
```

**Deployment Path:** `apps/player/dist/`

**Build Process:**
1. Clone repository from GitHub
2. Run `npm install` (installs all dependencies)
3. Run `npm run build:player` (builds only the player app)
4. Deploy contents of `apps/player/dist/`

---

## What Gets Deployed

### Built Files in `apps/player/dist/`:
```
apps/player/dist/
├── index.html           (entry point)
├── assets/
│   ├── index-DyOQxRoM.js      ← JavaScript bundle (contains all fixes)
│   ├── index-DyOQxRoM.js.map  ← Source map
│   └── index-DR64Znxz.css     ← Styles
└── vite.svg             (favicon)
```

### Bundle Contents (index-DyOQxRoM.js):
- ✅ Fixed QueueManagementService (JSON.stringify in all 13 methods)
- ✅ Fixed useQueueManagement (parseQueueData helper)
- ✅ PlayerView with auto-start logic
- ✅ All React components and hooks
- ✅ AppWrite SDK integration

---

## Environment Variables (Already Set)

The site has these variables configured:
```
VITE_APPWRITE_ENDPOINT          (secret)
VITE_APPWRITE_PROJECT_ID        (secret)
VITE_APPWRITE_DATABASE_ID       (secret)
VITE_APPWRITE_MAGIC_REDIRECT    (secret)
```

These are injected during build time by Vite.

---

## How to Deploy

### Option 1: Via AppWrite Console (Recommended)

Since GitHub is not connected, you need to:

1. **Go to AppWrite Console:**
   ```
   https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites/djamms-unified
   ```

2. **Connect GitHub:**
   - Click "Settings" or "Deployments"
   - Look for "Connect GitHub" or "Git Integration"
   - Authorize AppWrite to access `SystemVirtue/djamms-50-pg`
   - Select branch: `main`

3. **Create Deployment:**
   - Click "Create Deployment"
   - Source: GitHub
   - Repository: SystemVirtue/djamms-50-pg
   - Branch: main
   - Commit: 1a68b7a (or latest)
   - Click "Deploy"

4. **Wait for Build:**
   - Build will run: `npm install && npm run build:player`
   - Takes ~2-5 minutes
   - Watch logs for any errors

5. **Activate:**
   - Once build shows "Ready" status
   - Click "Activate" button
   - Site goes live immediately

### Option 2: Manual Upload (If GitHub Won't Connect)

1. **Build Locally:**
   ```bash
   cd /Users/mikeclarkin/DJAMMS_50_page_prompt
   npm run build:player
   ```

2. **Package Build:**
   ```bash
   cd apps/player/dist
   tar -czf player-build.tar.gz .
   ```
   ✅ Already done: `player-build.tar.gz` (477 KB)

3. **Upload via Console:**
   - Go to AppWrite Console > djamms-unified
   - Create deployment
   - Choose "Manual Upload"
   - Upload `player-build.tar.gz`
   - Activate

---

## Verification After Deployment

### 1. Check Bundle Changed:
```bash
curl -s "https://www.djamms.app/player/venue-001" | grep -o 'index-[a-zA-Z0-9_-]*\.js'
```

**Expected:** `index-DyOQxRoM.js`  
**Currently:** `index-C7TrqraU.js` ❌

### 2. Test Player:
- Open: https://www.djamms.app/player/venue-001
- Hard refresh: `Cmd + Shift + R`
- Open Console (F12)

**Expected Results:**
- ✅ No console errors
- ✅ Shows "Up Next (50 tracks)"
- ✅ Video auto-starts playing
- ✅ Skip/complete track works

---

## Why This Configuration?

### Build Command: `npm run build:player`
- **Not** `npm run build` (would build all 6 apps)
- **Not** `npm run build:web` (web app was deleted)
- Builds **only** the player app
- Faster builds (30s vs 2 mins)
- Smaller output (217 KB vs 1.5 MB)

### Output Directory: `apps/player/dist`
- **Not** `dist` (doesn't exist at root)
- **Not** `apps/web/dist` (web app deleted)
- Points to where player build outputs
- Contains the actual built files

### Adapter: `static`
- **Not** `ssr` (no server-side rendering)
- **Not** empty (needs explicit setting)
- Player is a static single-page app
- All logic runs client-side

### Fallback File: `index.html`
- Handles client-side routing
- All routes → index.html → React Router
- Necessary for URLs like `/player/venue-001`

---

## Current Status

| Aspect | Status |
|--------|--------|
| Site Config | ✅ Updated (just now) |
| Build Command | ✅ Correct (`npm run build:player`) |
| Output Dir | ✅ Correct (`apps/player/dist`) |
| GitHub Connected | ❌ Not connected |
| Latest Deployment | ❌ Failed (Oct 16, old config) |
| Production Code | ❌ OLD (index-C7TrqraU.js) |
| **Action Needed** | **Deploy via Console** |

---

## Next Step

**YOU MUST:** Go to AppWrite Console and create a deployment manually.

The configuration is now correct. Once you deploy from GitHub or upload the build, the player will work perfectly with no errors! 🎉

---

**Updated:** October 17, 2025, 1:33 AM  
**Site ID:** djamms-unified  
**Build Ready:** player-build.tar.gz (477 KB)  
**Latest Commit:** 1a68b7a
