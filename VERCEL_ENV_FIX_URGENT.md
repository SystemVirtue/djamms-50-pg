# 🔧 URGENT: Fix Vercel Environment Variable

**Issue:** Magic link emails contain wrong callback URL  
**Cause:** Vercel environment variable has wrong value

---

## ❌ The Problem

**Vercel Environment Variable (WRONG):**
```
VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/auth/callback
                                                       ^^^^^ Extra /auth
```

**Should Be:**
```
VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/callback
                                                       ^^^^^^^^ Correct!
```

**Your local `.env` is correct:**
```
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/callback ✅
```

But **Vercel production** has the old wrong value!

---

## 🚀 Quick Fix (2 minutes)

### Step 1: Open Vercel Dashboard

Go to: https://vercel.com/dashboard

### Step 2: Find Auth Project

Look for: **djamms-auth** (or whatever your auth app is named)

### Step 3: Go to Environment Variables

1. Click on the **djamms-auth** project
2. Go to **Settings** → **Environment Variables**
3. Find: `VITE_APPWRITE_MAGIC_REDIRECT`

### Step 4: Edit the Variable

**Current Value (WRONG):**
```
https://auth.djamms.app/auth/callback
```

**Change To:**
```
https://auth.djamms.app/callback
```

**Remove** `/auth` from the middle!

### Step 5: Save

Click **Save**

### Step 6: Redeploy

Vercel will prompt you to redeploy. Click **Redeploy** or:

1. Go to **Deployments** tab
2. Click **•••** on latest deployment  
3. Click **Redeploy**

Wait ~30 seconds for deployment to complete.

---

## ✅ After Fix

### Test the Flow

1. **Go to production site:**
   ```
   https://auth.djamms.app
   ```

2. **Request magic link:**
   - Enter your email
   - Click "Send Magic Link"

3. **Check email:**
   - Magic link URL should now be:
   ```
   https://auth.djamms.app/callback?secret=...&userId=...
   ```
   NOT:
   ```
   https://djamms.app/auth/callback?secret=...&userId=...
   ```

4. **Click the link:**
   - Should successfully authenticate
   - Should redirect to player/dashboard
   - No 404 error!

---

## 📋 Fix Checklist

- [ ] Opened Vercel dashboard
- [ ] Found djamms-auth project
- [ ] Went to Settings → Environment Variables
- [ ] Found `VITE_APPWRITE_MAGIC_REDIRECT`
- [ ] Changed from `/auth/callback` to `/callback`
- [ ] Saved changes
- [ ] Redeployed the app
- [ ] Waited for deployment to complete
- [ ] Tested magic link flow on production
- [ ] Verified callback URL is correct in email
- [ ] Successfully authenticated!

---

## 🎯 Why This Happened

Looking at the codebase history, old documentation had the wrong path:
```
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/auth/callback
```

This was set in Vercel early on and never updated when we fixed the local `.env`.

**The auth app routes are:**
- `/` - Sign in page
- `/callback` - Callback handler ✅
- NOT `/auth/callback` ❌

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Local .env (correct):** Already has `/callback` ✅
- **Auth App Routes:** `apps/auth/src/App.tsx`

---

**Next:** Fix the Vercel environment variable, redeploy, and test! 🚀
