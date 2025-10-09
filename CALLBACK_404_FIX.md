# 🐛 Magic Link Callback 404 Error - Fix Guide

**Date:** October 9, 2025  
**Issue:** Clicking magic link in email results in 404 error

---

## ❌ The Problem

**Email Link Shows:**
```
https://djamms.app/auth/callback?secret=...&userId=...
         ^^^^^^^^^^^ Wrong domain!
                ^^^^^ Wrong path!
```

**Should Be:**
```
https://auth.djamms.app/callback?secret=...&userId=...
      ^^^^^^^^^^^^^^^^^ Correct domain
                        ^^^^^^^^ Correct path (no /auth prefix)
```

**Result:** 404 error because:
1. Wrong domain: `djamms.app` (landing page) instead of `auth.djamms.app` (auth app)
2. Wrong path: `/auth/callback` instead of `/callback`

---

## 🔍 Root Cause Analysis

The magic-link function has correct hardcoded default:
```javascript
redirectUrl: body.redirectUrl || 'https://auth.djamms.app/callback'
```

But emails are being sent with wrong URL, which means:
- The function is receiving `body.redirectUrl` with wrong value
- OR there's a global environment variable overriding it

---

## ✅ Quick Fix

### Option 1: Update Global Environment Variable (Recommended)

You mentioned environment variables are set globally in AppWrite. Check if there's a `REDIRECT_URL` or similar variable set to the wrong value.

**Go to:** https://cloud.appwrite.io/console/project-syd-68cc86c3002b27e13947/settings

**Look for variables like:**
- `REDIRECT_URL`
- `MAGIC_LINK_REDIRECT`
- `CALLBACK_URL`

**If found, update to:**
```
https://auth.djamms.app/callback
```

### Option 2: Update Function Code

If no global variable exists, update the function default:

**File:** `functions/appwrite/functions/magic-link/src/main.js`

**Current (Line 40):**
```javascript
redirectUrl: body.redirectUrl || 'https://auth.djamms.app/callback',
```

This is already correct! So the issue must be coming from the caller.

### Option 3: Check Where Function is Called

The function might be called from your auth app with the wrong redirect URL.

**Check:** `apps/auth/src/` - look for where magic link is created

**Search for:**
```javascript
// Look for API calls to magic-link function
fetch('...magic-link...')
// or
client.functions.createExecution('68e5a317003c42c8bb6a', ...)
```

**Ensure redirectUrl is not set, or is set correctly:**
```javascript
{
  action: 'create',
  email: userEmail,
  // redirectUrl: 'https://auth.djamms.app/callback' // Let function use default
}
```

---

## 🔧 Immediate Workaround

While investigating, you can manually fix the URL when clicking the link:

**Wrong URL from email:**
```
https://djamms.app/auth/callback?secret=XXX&userId=YYY
```

**Change to:**
```
https://auth.djamms.app/callback?secret=XXX&userId=YYY
```

Paste the corrected URL in browser to verify authentication works.

---

## 🧪 Test After Fix

### Step 1: Trigger New Magic Link

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
node tests/test-email-sending.mjs
```

### Step 2: Check Email

Open the email and inspect the magic link URL.

**Should be:**
```
https://auth.djamms.app/callback?secret=...&userId=...
```

### Step 3: Click Link

Should redirect to auth app and complete authentication.

---

## 📋 Debugging Checklist

- [ ] Check global AppWrite environment variables for redirect URL
- [ ] Verify no variable is set to `https://djamms.app/auth/callback`
- [ ] Check auth app code for how it calls the magic-link function
- [ ] Ensure caller doesn't pass wrong redirectUrl in request body
- [ ] Verify function default is correct: `https://auth.djamms.app/callback`
- [ ] Test with new magic link request
- [ ] Verify email contains correct URL
- [ ] Click link and verify authentication succeeds

---

## 🔍 How to Find the Issue

### Check AppWrite Global Variables

1. Go to: https://cloud.appwrite.io/console/project-syd-68cc86c3002b27e13947/settings
2. Look at all environment variables
3. Check for any redirect/callback URL variables
4. Verify they point to `https://auth.djamms.app/callback`

### Check Function Execution Logs

1. Go to: Functions → magic-link → Executions
2. Click latest execution
3. Look at logs for:
   ```
   redirectUrl: <what URL is being used?>
   ```
4. See if function is receiving redirectUrl in body

### Search Codebase

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
grep -r "djamms.app/auth/callback" .
grep -r "REDIRECT" apps/auth/
```

---

## ✅ Expected Correct Flow

1. **User requests magic link** → Email entered
2. **Function generates link** → Uses `https://auth.djamms.app/callback`
3. **Email sent** → Contains correct URL
4. **User clicks link** → Opens `https://auth.djamms.app/callback?secret=...`
5. **Auth app handles callback** → Verifies token, issues JWT
6. **User authenticated** → Redirected to dashboard/player

---

## 🎯 Most Likely Cause

Based on the error, the most likely causes are:

1. **Global AppWrite variable** set to wrong URL
2. **Auth app code** passing wrong redirectUrl when calling function
3. **Environment variable** in auth app pointing to wrong URL

---

**Next Steps:**
1. Check AppWrite console global environment variables
2. Search for where magic link is called in auth app
3. Update any wrong redirect URLs found
4. Test with new magic link request
5. Verify email contains correct URL

---

**Current Status:**
- ✅ Emails sending successfully!
- ✅ Magic links being created
- ❌ Wrong callback URL in emails
- 🎯 Need to find where wrong URL is configured
