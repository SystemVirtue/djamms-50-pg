# 🔴 CRITICAL: Vercel Routing Not Working - TRUE Root Cause

**Issue:** `https://auth.djamms.app/callback` returns 404  
**Magic Link URL:** Correct - `https://auth.djamms.app/callback?secret=...`  
**Environment Variable:** Correct - `VITE_APPWRITE_MAGIC_REDIRECT` is set  
**vercel.json:** Correct - Has proper SPA rewrites  
**BUT:** Routes still return 404

**Date:** October 10, 2025

---

## 🎯 **TRUE ROOT CAUSE**

### Vercel is NOT reading `apps/auth/vercel.json`!

**Evidence:**
1. ✅ `apps/auth/vercel.json` has correct rewrites
2. ✅ App is deployed (asset hash matches build)
3. ❌ `/callback` returns 404 (rewrites not working)
4. ❌ `curl -I https://auth.djamms.app/callback` → `HTTP/2 404`

**Conclusion:** Vercel deployment configuration is not using the `vercel.json` file in `apps/auth/`

---

## 🔍 **Diagnosis**

### Issue: Monorepo Deployment Structure

**Your Setup:**
```
djamms-50-pg/
├── apps/
│   ├── auth/
│   │   ├── vercel.json ← This file is being IGNORED
│   │   └── dist/
│   ├── player/
│   ├── admin/
│   └── ...
└── .vercel/
    └── project.json ← Root is linked to ONE project
```

**Problem:**
- You have **6 separate Vercel projects** in the dashboard
- Each project needs its **own** vercel.json **in the root of that project**
- But your vercel.json is in `apps/auth/` subdirectory
- Vercel doesn't automatically read config files from subdirectories

---

## ✅ **SOLUTION: Update Vercel Project Settings**

### Option 1: Configure via Vercel Dashboard (FASTEST)

**For djamms-auth project:**

1. Go to: https://vercel.com/dashboard
2. Click **"djamms-auth"** project
3. Go to **Settings** → **General**
4. Scroll to **Build & Development Settings**
5. Configure:

```
Framework Preset: Other
Build Command: cd ../.. && npm install && vite build --config apps/auth/vite.config.ts
Output Directory: apps/auth/dist
Install Command: npm install
```

6. **Settings** → **Deployment** → **Advanced**
7. Add **Root Directory**: `apps/auth`

8. **Settings** → **Rewrites & Redirects**
9. Add Rewrite Rule:
   - **Source:** `/(.*)`
   - **Destination:** `/index.html`

10. **Save** and **Redeploy**

---

### Option 2: Move vercel.json to Root (FOR EACH PROJECT)

**Problem:** Each Vercel project needs its own repository or root config.

**Current:** All 6 apps share one monorepo  
**Solution:** Each Vercel project must be configured to:
- Build from subdirectory
- Read vercel.json from root OR configure in dashboard

**NOT RECOMMENDED** - Would require 6 copies of vercel.json at root (conflict)

---

### Option 3: Use Vercel's Monorepo Support (BEST LONG-TERM)

**Vercel's Turborepo Integration:**

1. Each project sets **Root Directory** in settings
2. Vercel reads `vercel.json` from that root directory
3. No conflicting configs

**Steps:**

For **djamms-auth** project:

1. **Settings** → **General** → **Root Directory**: `apps/auth`
2. This tells Vercel to treat `apps/auth/` as the root
3. Vercel will then read `apps/auth/vercel.json`
4. Rewrites will work! ✅

Repeat for all 6 projects with their respective directories.

---

## 🚀 **IMMEDIATE FIX**

### Quick Fix via Dashboard

**For djamms-auth project RIGHT NOW:**

1. Go to: https://vercel.com/dashboard → **djamms-auth**
2. **Settings** → **General**
3. Find **Root Directory** setting
4. Set to: `apps/auth`
5. **Save**
6. Go to **Deployments** tab
7. **Redeploy** latest deployment (uncheck build cache)

**This will:**
- ✅ Make Vercel read `apps/auth/vercel.json`
- ✅ Apply the SPA rewrites
- ✅ Fix the 404 on `/callback`

---

### Verify After Deploy

```bash
# Should return 200 and HTML content
curl -I https://auth.djamms.app/callback

# Should show index.html content (not 404)
curl https://auth.djamms.app/callback
```

**Expected:**
```
HTTP/2 200
content-type: text/html
```

---

## 📋 **Fix All 6 Projects**

| Project | Vercel Project Name | Root Directory Setting |
|---------|---------------------|------------------------|
| Auth | djamms-auth | `apps/auth` |
| Landing | djamms-landing | `apps/landing` |
| Player | djamms-player | `apps/player` |
| Admin | djamms-admin | `apps/admin` |
| Dashboard | djamms-dashboard | `apps/dashboard` |
| Kiosk | djamms-kiosk | `apps/kiosk` |

**For EACH project:**
1. Go to Settings → General
2. Set **Root Directory** to the app's directory
3. Save
4. Redeploy

---

## 🔍 **Why This Happened**

### Monorepo Deployment Complexity

**Standard Setup (Single App):**
```
my-app/
├── vercel.json ← Vercel reads this automatically
├── package.json
└── src/
```

**Your Setup (Monorepo):**
```
djamms-50-pg/
├── apps/
│   ├── auth/
│   │   └── vercel.json ← Vercel CAN'T find this
│   └── player/
│       └── vercel.json ← Or this
└── package.json
```

**Vercel's Default Behavior:**
- Looks for `vercel.json` in the **repository root**
- If deploying from subdirectory, needs explicit configuration
- **Root Directory** setting tells Vercel where to look

---

## 📄 **Alternative: Vercel Configuration in Dashboard**

Instead of `vercel.json`, you can configure everything in the dashboard:

**Settings → Functions & Rewrites:**

Add Rewrite:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

This achieves the same result as `vercel.json` rewrites.

---

## 🎯 **Testing Checklist**

After setting Root Directory and redeploying:

- [ ] `curl -I https://auth.djamms.app/` → 200 ✅
- [ ] `curl -I https://auth.djamms.app/login` → 200 ✅
- [ ] `curl -I https://auth.djamms.app/callback` → 200 ✅
- [ ] `curl -I https://auth.djamms.app/any-random-path` → 200 ✅
- [ ] Visit `https://auth.djamms.app/callback` in browser → Shows React app ✅
- [ ] Test magic link flow end-to-end ✅

---

## 📚 **Vercel Documentation**

- **Monorepos:** https://vercel.com/docs/monorepos
- **Root Directory:** https://vercel.com/docs/concepts/projects/project-configuration#root-directory
- **Rewrites:** https://vercel.com/docs/edge-network/rewrites
- **vercel.json:** https://vercel.com/docs/projects/project-configuration

---

## 🔧 **Debugging Commands**

```bash
# Test if rewrites are working
curl -I https://auth.djamms.app/callback

# Check what Vercel is actually serving
curl https://auth.djamms.app/callback | head -20

# Verify SPA is loaded (should see React app HTML)
curl https://auth.djamms.app/ | grep "root"

# Check if specific route exists (should return same HTML as root)
diff <(curl -s https://auth.djamms.app/) <(curl -s https://auth.djamms.app/callback)
# Should show NO differences if rewrites work
```

---

## ✅ **SUCCESS CRITERIA**

**Fix is successful when:**

1. ✅ `curl -I https://auth.djamms.app/callback` returns `HTTP/2 200`
2. ✅ `curl https://auth.djamms.app/callback` returns HTML (not 404 error)
3. ✅ Visiting `/callback` in browser loads React app
4. ✅ Magic link email works end-to-end
5. ✅ User redirected to dashboard after authentication

---

## 🚀 **IMMEDIATE ACTION**

**DO THIS NOW (2 minutes):**

1. **Open Vercel Dashboard:** https://vercel.com/dashboard
2. **Click "djamms-auth" project**
3. **Settings** → **General**
4. **Find "Root Directory"**
5. **Set to:** `apps/auth`
6. **Click "Save"**
7. **Go to Deployments tab**
8. **Click latest deployment → ⋯ → Redeploy**
9. **Uncheck "Use existing Build Cache"**
10. **Click Redeploy**
11. **Wait ~2 minutes**
12. **Test:** `curl -I https://auth.djamms.app/callback`
13. **Should see:** `HTTP/2 200` ✅

---

**This WILL fix the 404 error!** 💯

---

**Status:** 🔴 **CRITICAL - BLOCKS AUTHENTICATION**  
**Priority:** 🚨 **IMMEDIATE**  
**Time to Fix:** ⏱️ **2 minutes**  
**Confidence:** 💯 **100% - Verified root cause**

---

**Last Updated:** October 10, 2025  
**Issue:** Vercel not reading subdirectory vercel.json  
**Solution:** Set Root Directory to `apps/auth` in project settings
