# Vercel Build Settings Quick Reference

## How to Override Production Settings

When you see "Configuration Settings in the current Production deployment differ from your current Project Settings":

1. **Go to Project Settings**: Click "Settings" in top nav
2. **Navigate to**: General → Build & Development Settings
3. **Update the settings** (see below for each app)
4. **Save changes**
5. **Redeploy**:
   - Go to "Deployments" tab
   - Click "..." menu on latest deployment
   - Select "Redeploy"
   - OR push a new commit to trigger auto-deploy

---

## Build Settings for Each App

### 1. djamms-landing
```
Framework Preset: Other
Build Command: npm run build:landing
Output Directory: apps/landing/dist
Install Command: npm install
Root Directory: (leave empty / use default)
```

### 2. djamms-auth
```
Framework Preset: Other
Build Command: npm run build:auth
Output Directory: apps/auth/dist
Install Command: npm install
Root Directory: (leave empty / use default)
```

### 3. djamms-player
```
Framework Preset: Other
Build Command: npm run build:player
Output Directory: apps/player/dist
Install Command: npm install
Root Directory: (leave empty / use default)
```

### 4. djamms-admin
```
Framework Preset: Other
Build Command: npm run build:admin
Output Directory: apps/admin/dist
Install Command: npm install
Root Directory: (leave empty / use default)
```

### 5. djamms-kiosk
```
Framework Preset: Other
Build Command: npm run build:kiosk
Output Directory: apps/kiosk/dist
Install Command: npm install
Root Directory: (leave empty / use default)
```

### 6. djamms-dashboard
```
Framework Preset: Other
Build Command: npm run build:dashboard
Output Directory: apps/dashboard/dist
Install Command: npm install
Root Directory: (leave empty / use default)
```

---

## Why They Default to 'kiosk'

The root `vercel.json` file currently has kiosk settings from the last deployment:

```json
{
  "buildCommand": "npm run build:kiosk",
  "outputDirectory": "apps/kiosk/dist",
  "installCommand": "npm install",
  "framework": null
}
```

**Solution**: You can either:
1. ✅ **Ignore the root vercel.json** - Override settings in each project's dashboard (recommended)
2. Delete the root vercel.json - No longer needed once projects are created
3. Keep it for reference - But don't let it confuse you

**The project-specific settings in the Vercel dashboard ALWAYS override vercel.json.**

---

## Quick Create Workflow

For each remaining app (player, admin, kiosk, dashboard):

1. **Create Project**:
   - Go to https://vercel.com/new
   - Import `SystemVirtue/djamms-50-pg`
   - Name it `djamms-[appname]`
   - Click "Deploy" (let it fail/succeed - doesn't matter)

2. **Update Settings**:
   - Settings → General → Build & Development Settings
   - Copy-paste the settings from above
   - Save

3. **Add Environment Variables**:
   - Settings → Environment Variables
   - Use `VERCEL_ENV_VARS_GUIDE.md` for values
   - Add for all environments: Production, Preview, Development

4. **Redeploy**:
   - Deployments → "..." → Redeploy

---

## Verification Checklist

After creating all 6 projects, verify:

- [ ] Each project has correct build command
- [ ] Each project has correct output directory  
- [ ] Each project has all required environment variables
- [ ] Each project's latest deployment is successful (green checkmark)
- [ ] Each project is accessible at its vercel.app URL

---

## Project URLs (after creation)

- Landing: `djamms-landing.vercel.app` (or similar)
- Auth: `djamms-auth.vercel.app`
- Player: `djamms-player.vercel.app`
- Admin: `djamms-admin.vercel.app`
- Kiosk: `djamms-kiosk.vercel.app`
- Dashboard: `djamms-dashboard.vercel.app`

Then add custom domains:
- djamms.app → landing
- auth.djamms.app → auth
- player.djamms.app → player
- admin.djamms.app → admin
- kiosk.djamms.app → kiosk
- dashboard.djamms.app → dashboard
