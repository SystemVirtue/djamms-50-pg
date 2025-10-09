# Vercel Quick Fix (15-20 minutes)

## Problem Summary
- Magic link callbacks return 404 because Vercel can't find `/callback` route
- Root cause: Monorepo with multiple apps - Vercel doesn't know which app to serve
- Current: Single Vercel project trying to serve all 6 apps

## The Fix

You have **TWO OPTIONS**:

---

## Option A: Single Project with Environment Detection (FASTEST - 15 mins)

Keep single Vercel project, use rewrites to route by domain:

### Step 1: Create `vercel.json` at ROOT

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/apps/auth/index.html",
      "has": [{ "type": "host", "value": "auth.djamms.app" }]
    },
    {
      "source": "/:path*",
      "destination": "/apps/landing/index.html",
      "has": [{ "type": "host", "value": "djamms.app" }]
    },
    {
      "source": "/:path*",
      "destination": "/apps/player/index.html",
      "has": [{ "type": "host", "value": "player.djamms.app" }]
    },
    {
      "source": "/:path*",
      "destination": "/apps/admin/index.html",
      "has": [{ "type": "host", "value": "admin.djamms.app" }]
    },
    {
      "source": "/:path*",
      "destination": "/apps/dashboard/index.html",
      "has": [{ "type": "host", "value": "dashboard.djamms.app" }]
    },
    {
      "source": "/:path*",
      "destination": "/apps/kiosk/index.html",
      "has": [{ "type": "host", "value": "kiosk.djamms.app" }]
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "."
}
```

### Step 2: Update Root package.json Build Script

```json
{
  "scripts": {
    "build": "npm run build --workspace=apps/auth && npm run build --workspace=apps/landing && npm run build --workspace=apps/player && npm run build --workspace=apps/admin && npm run build --workspace=apps/dashboard && npm run build --workspace=apps/kiosk"
  }
}
```

### Step 3: Deploy

```bash
git add vercel.json package.json
git commit -m "fix: Vercel routing for monorepo"
git push
```

**Done!** 404 should be fixed.

---

## Option B: Separate Projects (BETTER LONG-TERM - 30 mins)

Create 6 separate Vercel projects with proper Root Directory:

### For EACH app (repeat 6 times):

1. **Go to Vercel Dashboard**: https://vercel.com/new
2. **Import your GitHub repo** (same repo, 6 times)
3. **Configure project**:
   - **Project Name**: `djamms-auth` (or landing, player, etc.)
   - **Root Directory**: `apps/auth` ← **THIS IS THE KEY**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: Leave as `npm install`

4. **Environment Variables**: Copy from existing project (shared vars work)

5. **Custom Domain**: Add domain (`auth.djamms.app`, etc.)

6. **Deploy**

### Projects to Create:
1. `djamms-auth` - Root: `apps/auth` - Domain: `auth.djamms.app`
2. `djamms-landing` - Root: `apps/landing` - Domain: `djamms.app`
3. `djamms-player` - Root: `apps/player` - Domain: `player.djamms.app`
4. `djamms-admin` - Root: `apps/admin` - Domain: `admin.djamms.app`
5. `djamms-dashboard` - Root: `apps/dashboard` - Domain: `dashboard.djamms.app`
6. `djamms-kiosk` - Root: `apps/kiosk` - Domain: `kiosk.djamms.app`

---

## Recommendation

**Use Option A** for immediate 404 fix (15 mins), then migrate to Option B later if needed.

Option A fixes your problem TODAY without the complexity of:
- AppWrite plan upgrades
- CloudFlare Workers setup
- DNS changes
- Complete infrastructure migration

---

## After Fix

Test magic link:
1. Go to https://auth.djamms.app
2. Enter email
3. Check inbox
4. Click magic link
5. Verify: NO 404, redirects to dashboard ✅

