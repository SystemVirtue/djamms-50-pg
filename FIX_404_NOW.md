# 🚨 URGENT: Fix Magic Link 404 Error

## The Problem

When you click the magic link in your email, you get:
```
404: NOT_FOUND
Code: NOT_FOUND
ID: syd1::wlrnx-1759986596734-34b745f31219
```

The email URL is wrong:
```
Wrong: https://djamms.app/auth/callback?secret=...
Right: https://auth.djamms.app/callback?secret=...
```

## The Solution (2 Steps)

### ✅ Step 1: Code Fix (DONE)

I've already fixed the fallback code in `packages/shared/src/config/env.ts`:
- Changed `/auth/callback` to `/callback`
- Committed and pushed to GitHub

### 🔴 Step 2: Vercel Environment Variable (YOU NEED TO DO THIS)

You **MUST** set this environment variable in Vercel:

1. **Go to**: https://vercel.com/dashboard
2. **Find**: Your `djamms-auth` project (or whatever it's called)
3. **Click**: Settings → Environment Variables
4. **Add new variable**:
   ```
   Name:  VITE_APPWRITE_MAGIC_REDIRECT
   Value: https://auth.djamms.app/callback
   ```
5. **Select**:  Production ✅, Preview ✅, Development ✅
6. **Click**: Save
7. **Redeploy**:
   - Go to Deployments tab
   - Click ⋯ on latest deployment
   - Click "Redeploy"
   - Wait for build to complete (~2 minutes)

## Why This Fixes It

The magic link URL is generated at **build time** using the `VITE_APPWRITE_MAGIC_REDIRECT` environment variable.

Without this variable set in Vercel:
- The code uses a fallback
- The fallback was generating the wrong URL
- I fixed the fallback, but you still need the environment variable for best results

## After the Fix

1. **Clear browser cache** (important!)
2. **Request new magic link** at https://auth.djamms.app
3. **Check email** - URL should be: `https://auth.djamms.app/callback?secret=...`
4. **Click link** - Should work! No 404!

## Quick Test

After you set the Vercel environment variable and redeploy:

```bash
# Request a new magic link
# Check the email
# The URL should start with: https://auth.djamms.app/callback

# NOT: https://djamms.app/auth/callback
```

## Status

- ✅ Code fallback fixed (done by me)
- ⏳ Vercel environment variable (you need to do this)
- ⏳ Redeploy auth app (you need to do this)
- ⏳ Test magic link (after above steps)

## Need Help?

If you're not sure which Vercel project is the auth app:
1. Go to https://vercel.com/dashboard
2. Look for projects with names like:
   - `djamms-auth`
   - `auth-djamms`
   - Or check the deployment URL - it should show `auth.djamms.app`

The environment variable goes in **that specific project**, not globally.

## What Changed

### Before
```typescript
// Fallback generated: https://auth.djamms.app/auth/callback ❌
magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
  `${window.location.origin}/auth/callback`
```

### After
```typescript
// Fallback generates: https://auth.djamms.app/callback ✅
magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
  `${window.location.origin}/callback`
```

### Plus Environment Variable
```
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/callback ✅
```

This ensures the correct URL is used at build time!
