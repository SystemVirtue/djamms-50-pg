# 🔴 CRITICAL FIX: Magic Link 404 Error

**Issue:** Magic links go to `https://djamms.app/callback` instead of `https://auth.djamms.app/callback`

**Error:** `404: NOT_FOUND` on callback URL

**Date:** October 10, 2025

---

## 🎯 Root Cause Analysis

### Problem 1: Missing Environment Variable in Vercel

**File:** `packages/shared/src/config/env.ts` (line 29)

```typescript
magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
  (typeof window !== 'undefined' ? `${window.location.origin}/callback` : ''),
```

**Issue:**
- When `VITE_APPWRITE_MAGIC_REDIRECT` is **NOT set** in Vercel, the fallback uses `window.location.origin`
- User opens `https://djamms.app` (landing page)
- Fallback becomes: `https://djamms.app/callback` ❌
- Should be: `https://auth.djamms.app/callback` ✅

---

### Problem 2: Landing Page Has No /callback Route

**Current Routing:**
- `https://djamms.app` → Landing app (no /callback route) ❌
- `https://auth.djamms.app` → Auth app (has /callback route) ✅

**Result:**
- Magic link emails contain: `https://djamms.app/callback?secret=...&userId=...`
- Landing app has no `/callback` route
- Vercel returns 404

---

## ✅ **IMMEDIATE FIX: Set Environment Variable in Vercel**

### Step 1: Add Environment Variable to Auth Project

**Via Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Click on **"djamms-auth"** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name:** `VITE_APPWRITE_MAGIC_REDIRECT`
   - **Value:** `https://auth.djamms.app/callback`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**

**Via Vercel CLI:**

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/apps/auth

# Set for production
vercel env add VITE_APPWRITE_MAGIC_REDIRECT production
# When prompted, enter: https://auth.djamms.app/callback

# Set for preview
vercel env add VITE_APPWRITE_MAGIC_REDIRECT preview
# When prompted, enter: https://auth.djamms.app/callback

# Set for development
vercel env add VITE_APPWRITE_MAGIC_REDIRECT development
# When prompted, enter: http://localhost:3002/callback
```

---

### Step 2: Redeploy Auth App

**Option A: Via Dashboard**
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** → **Redeploy**
4. ✅ Uncheck "Use existing Build Cache"
5. Click **Redeploy**

**Option B: Via CLI**
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/apps/auth
vercel --prod
```

---

### Step 3: Verify Fix

1. Go to `https://auth.djamms.app`
2. Enter your email
3. Click "Send Magic Link"
4. Check email
5. **Verify URL starts with:** `https://auth.djamms.app/callback?secret=...`
6. Click link
7. Should redirect to dashboard ✅

---

## 🛡️ **ADDITIONAL FIX: Prevent Future Issues**

### Add Same Variable to ALL Projects

The environment variable should be set in **ALL** Vercel projects that might send magic links:

| Project | VITE_APPWRITE_MAGIC_REDIRECT Value |
|---------|-------------------------------------|
| **djamms-auth** | `https://auth.djamms.app/callback` |
| **djamms-landing** | `https://auth.djamms.app/callback` |
| **djamms-player** | `https://auth.djamms.app/callback` |
| **djamms-admin** | `https://auth.djamms.app/callback` |
| **djamms-dashboard** | `https://auth.djamms.app/callback` |
| **djamms-kiosk** | `https://auth.djamms.app/callback` |

**Why?** If users navigate to any subdomain and try to login, the magic link will always point to the correct auth app.

---

### Quick Script to Set All Projects

```bash
#!/bin/bash
# File: scripts/set-magic-link-env.sh

PROJECTS=("auth" "landing" "player" "admin" "dashboard" "kiosk")
REDIRECT_URL="https://auth.djamms.app/callback"

for project in "${PROJECTS[@]}"; do
  echo "Setting VITE_APPWRITE_MAGIC_REDIRECT for $project..."
  cd "/Users/mikeclarkin/DJAMMS_50_page_prompt/apps/$project"
  
  # Set for all environments
  echo $REDIRECT_URL | vercel env add VITE_APPWRITE_MAGIC_REDIRECT production
  echo $REDIRECT_URL | vercel env add VITE_APPWRITE_MAGIC_REDIRECT preview
  
  echo "✅ Done: $project"
  echo ""
done

echo "🎉 All projects updated!"
```

---

## 🔍 Why This Happened

### Timeline

1. **Initial Setup:** Environment variables set in local `.env` file
2. **Vercel Deployment:** `.env` not committed to git (gitignored)
3. **Build Process:** Vercel builds without environment variables
4. **Runtime Fallback:** Code uses `window.location.origin` (wrong domain)
5. **Magic Link Generated:** Points to wrong domain
6. **User Clicks Link:** 404 error

### The Fallback Logic Flaw

**Code:** `packages/shared/src/config/env.ts`

```typescript
magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
  (typeof window !== 'undefined' ? `${window.location.origin}/callback` : ''),
```

**Problem:**
- Fallback assumes user is on **auth subdomain**
- But users can be on **any subdomain** (landing, player, etc.)
- Each subdomain has different `window.location.origin`

**Example Scenarios:**

| User Location | window.location.origin | Fallback Result | Correct? |
|---------------|------------------------|-----------------|----------|
| `https://auth.djamms.app` | `https://auth.djamms.app` | `https://auth.djamms.app/callback` | ✅ YES |
| `https://djamms.app` | `https://djamms.app` | `https://djamms.app/callback` | ❌ NO (404) |
| `https://player.djamms.app` | `https://player.djamms.app` | `https://player.djamms.app/callback` | ❌ NO (404) |
| `https://admin.djamms.app` | `https://admin.djamms.app` | `https://admin.djamms.app/callback` | ❌ NO (404) |

---

## 🔧 Better Long-Term Solution (Optional)

### Option 1: Hardcode Auth Domain (Simplest)

**File:** `packages/shared/src/config/env.ts`

```typescript
auth: {
  magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
    'https://auth.djamms.app/callback', // Hardcoded fallback
  jwtSecret: import.meta.env.VITE_JWT_SECRET || '',
  allowAutoCreate: import.meta.env.VITE_ALLOW_AUTO_CREATE_USERS === 'true',
},
```

**Pros:**
- ✅ Always works, even without env var
- ✅ Simple, no configuration needed
- ✅ Development can override with env var

**Cons:**
- ⚠️ Need to update code if domain changes
- ⚠️ Different for dev/staging/prod

---

### Option 2: Detect Subdomain Pattern (Advanced)

```typescript
const getAuthCallbackUrl = (): string => {
  // Check environment variable first
  if (import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT) {
    return import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT;
  }
  
  // If running in browser, construct auth subdomain URL
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.origin);
    const hostname = url.hostname;
    
    // If on subdomain, replace with 'auth'
    if (hostname.startsWith('djamms.app') || hostname.includes('.djamms.app')) {
      return `https://auth.djamms.app/callback`;
    }
    
    // Development fallback
    if (hostname === 'localhost' || hostname.startsWith('localhost')) {
      return `http://localhost:3002/callback`;
    }
  }
  
  // Ultimate fallback
  return 'https://auth.djamms.app/callback';
};

export const config = {
  // ... other config
  auth: {
    magicLinkRedirect: getAuthCallbackUrl(),
    // ... other auth config
  }
};
```

**Pros:**
- ✅ Intelligent domain detection
- ✅ Works on all subdomains
- ✅ Handles development automatically

**Cons:**
- ⚠️ More complex logic
- ⚠️ Requires testing across environments

---

## 📋 Verification Checklist

After applying fixes, verify:

- [ ] Environment variable set in Vercel auth project
- [ ] Auth app redeployed (without build cache)
- [ ] Magic link email contains correct URL (`https://auth.djamms.app/callback`)
- [ ] Clicking magic link loads callback page (not 404)
- [ ] Callback page shows "Authenticating..." spinner
- [ ] User redirected to dashboard after authentication
- [ ] Toast notification shows "Logged in successfully"
- [ ] Dashboard displays user email

---

## 🎯 Quick Test Commands

```bash
# Test 1: Check if env var is set in Vercel
vercel env ls | grep VITE_APPWRITE_MAGIC_REDIRECT

# Test 2: Trigger deployment
cd apps/auth
vercel --prod

# Test 3: Check deployment logs
vercel logs

# Test 4: Test magic link flow
# (Manual: Go to https://auth.djamms.app, enter email, check email)

# Test 5: Verify callback URL format
# (Manual: Check email, verify URL starts with https://auth.djamms.app/callback)
```

---

## 📚 Related Documentation

- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Vercel Error NOT_FOUND:** https://vercel.com/docs/errors/NOT_FOUND
- **AppWrite Magic URL:** https://appwrite.io/docs/products/auth/magic-url
- **AppWrite Session API:** https://appwrite.io/docs/references/cloud/client-web/account#createSession

---

## 🔍 Debugging Tips

### If 404 Still Occurs After Fix:

**1. Check Browser DevTools Network Tab**
```javascript
// In browser console while on auth.djamms.app
console.log('Redirect URL:', import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT);
console.log('Window origin:', window.location.origin);
```

**2. Check Vercel Build Logs**
- Look for environment variables in build output
- Verify `VITE_APPWRITE_MAGIC_REDIRECT` is present

**3. Check Email Source**
- View raw email HTML
- Find the magic link URL
- Verify it starts with `https://auth.djamms.app/callback`

**4. Test Direct Callback URL**
```bash
# Should return 200 (landing page loads)
curl -I https://auth.djamms.app/callback

# Should return 404 (no route)
curl -I https://djamms.app/callback
```

---

## ✅ SUCCESS CRITERIA

**Fix is successful when:**

1. ✅ Magic link emails contain: `https://auth.djamms.app/callback?secret=...&userId=...`
2. ✅ Clicking magic link shows auth callback page (not 404)
3. ✅ User sees "Authenticating..." loading screen
4. ✅ User redirected to dashboard after ~2 seconds
5. ✅ Toast shows "Logged in successfully"
6. ✅ Dashboard displays user information

---

## 🚀 IMMEDIATE ACTION

**DO THIS NOW:**

```bash
# 1. Set environment variable via Vercel dashboard
# Go to: https://vercel.com/dashboard → djamms-auth → Settings → Environment Variables
# Add: VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/callback

# 2. Redeploy
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/apps/auth
vercel --prod

# 3. Test
# Go to https://auth.djamms.app
# Request magic link
# Check email
# Verify URL format
# Click link
# Verify it works!
```

---

**Status:** 🔴 **CRITICAL - BLOCKS AUTHENTICATION**  
**Priority:** 🚨 **IMMEDIATE**  
**Time to Fix:** ⏱️ **5 minutes**  
**Confidence:** 💯 **100% - Root cause identified**

---

**Last Updated:** October 10, 2025  
**Next Steps:** Apply fix → Test → Document success
