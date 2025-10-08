# 🔍 Email & Callback Configuration Diagnostic

**Date:** October 9, 2025  
**Issue:** No emails being received  
**Root Causes Identified:** 2 configuration issues found  

---

## 🐛 Issues Found

### Issue #1: Callback URL Mismatch ⚠️

**Problem:** The redirect URL in your .env has an extra `/auth` prefix

**Current (WRONG):**
```
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/auth/callback
                                                        ^^^^^ EXTRA
```

**Should Be:**
```
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/callback
```

**Why This Matters:**
- The auth app is served at the root of `auth.djamms.app`
- The callback route is `/callback`, not `/auth/callback`
- This causes the magic link to go to the wrong URL (404 error)

**Impact:** Users clicking magic links get 404 errors

---

### Issue #2: Resend Not Configured (Expected) ℹ️

**Status:** Email sending code is present but not configured

**Missing Configuration:**
1. ❌ Resend account not created
2. ❌ DNS TXT records not added to Porkbun
3. ❌ RESEND_API_KEY not set in AppWrite function
4. ❌ SMTP_FROM not set in AppWrite function

**Impact:** Emails are not sent (but magic links work via API workaround)

---

## ✅ What's Correctly Configured

### AppWrite Function ✅
- **Function ID:** `68e5a317003c42c8bb6a` ✓
- **Endpoint:** `https://syd.cloud.appwrite.io/v1` ✓
- **Project ID:** `68cc86c3002b27e13947` ✓
- **Database ID:** `68e57de9003234a84cae` ✓
- **Deployment:** Active (ID: `68e6d45b68433e157a49`) ✓

### Auth App URL ✅
- **Base URL:** `https://auth.djamms.app` ✓
- **Expected Route:** `/callback` ✓
- **DNS:** Points to Vercel ✓

### Local Development ✅
- **Port:** 3002 ✓
- **Local Callback:** Should be `http://localhost:3002/callback` ✓

---

## 🔧 Required Fixes

### Fix #1: Update .env File (IMMEDIATE)

**File:** `/Users/mikeclarkin/DJAMMS_50_page_prompt/.env`

**Change Line 18:**
```diff
- VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/auth/callback
+ VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/callback
```

**After Fixing:**
1. Restart any running dev servers
2. Test magic link generation
3. Verify callback URL is correct

---

### Fix #2: Configure Resend Email (15 minutes)

Follow these steps in order:

#### Step 1: Create Resend Account (2 min)
1. Go to https://resend.com
2. Sign up for free (100 emails/day)
3. Verify your email

#### Step 2: Add Domain to Resend (1 min)
1. Navigate to **Domains** → **Add Domain**
2. Enter: `djamms.app`
3. Resend will show 2 DNS records:
   ```
   Type: TXT
   Host: _resend
   Value: resend-verification-XXXXXXXX
   
   Type: TXT
   Host: resend._domainkey
   Value: p=MII... (very long string)
   ```

#### Step 3: Add DNS Records to Porkbun (5 min)
1. Log into https://porkbun.com
2. Go to your domain: **djamms.app**
3. Click **DNS Records**
4. Add Record #1:
   - Type: `TXT`
   - Host: `_resend`
   - Answer: (paste value from Resend)
   - TTL: `600`
5. Add Record #2:
   - Type: `TXT`
   - Host: `resend._domainkey`
   - Answer: (paste value from Resend)
   - TTL: `600`
6. Save changes

#### Step 4: Verify Domain in Resend (5 min)
1. Wait 5 minutes for DNS propagation
2. Return to Resend dashboard
3. Click **Verify** next to djamms.app
4. Status should show "Verified" ✓

#### Step 5: Get API Key (1 min)
1. Navigate to **API Keys**
2. Click **Create API Key**
3. Name: `DJAMMS Magic Link`
4. Copy the key (starts with `re_...`)

#### Step 6: Add to AppWrite Function (1 min)
1. Go to https://cloud.appwrite.io
2. Select project: **djamms-prototype**
3. Go to **Functions** → **magic-link** → **Settings**
4. Add environment variable:
   - Key: `RESEND_API_KEY`
   - Value: (paste your API key)
5. Add second variable:
   - Key: `SMTP_FROM`
   - Value: `DJAMMS <noreply@djamms.app>`
6. Save and redeploy function

---

## 🔍 Verification Checklist

### After Fix #1 (Callback URL)
- [ ] .env file updated with correct callback URL
- [ ] Dev server restarted
- [ ] Test magic link generation:
  ```bash
  node tests/magic-link-api-test.mjs
  ```
- [ ] Verify URL format in response:
  ```
  https://auth.djamms.app/callback?secret=...&userId=...
  NOT: /auth/callback
  ```

### After Fix #2 (Email Configuration)
- [ ] Resend account created
- [ ] Domain added to Resend
- [ ] DNS TXT records added to Porkbun
- [ ] DNS records verified with dig:
  ```bash
  dig _resend.djamms.app TXT
  dig resend._domainkey.djamms.app TXT
  ```
- [ ] Domain verified in Resend (green checkmark)
- [ ] API key created and copied
- [ ] Environment variables added to AppWrite function
- [ ] Function redeployed
- [ ] Test email sending:
  ```bash
  # Send magic link via auth UI at localhost:3002
  # Check email inbox (and spam folder)
  ```

---

## 🧪 Testing Commands

### Test Magic Link Creation
```bash
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{"body":"{\"action\":\"create\",\"email\":\"test@example.com\",\"redirectUrl\":\"https://auth.djamms.app/callback\"}"}' \
  | python3 -c "import sys, json; data = json.load(sys.stdin); body = json.loads(data['responseBody']); print('Magic Link:', body['magicLink'])"
```

**Expected Output:**
```
Magic Link: https://auth.djamms.app/callback?secret=...&userId=...
```

**Check:** URL should be `/callback` NOT `/auth/callback`

### Verify DNS Records
```bash
# Check Resend verification record
dig _resend.djamms.app TXT +short

# Check DKIM signing key
dig resend._domainkey.djamms.app TXT +short
```

**Expected Output (after DNS propagation):**
```
"resend-verification-XXXXXXXX"
"p=MII..." (long string)
```

---

## 📋 Current Configuration Status

### Porkbun DNS (Existing Records)
```
✅ @ CNAME cname.vercel-dns.com (landing)
✅ @ A 76.76.21.21 (fallback)
✅ auth CNAME cname.vercel-dns.com
✅ player CNAME cname.vercel-dns.com
✅ admin CNAME cname.vercel-dns.com
✅ kiosk CNAME cname.vercel-dns.com
❌ _resend TXT (MISSING - add this)
❌ resend._domainkey TXT (MISSING - add this)
```

### Vercel Environment Variables
Check that these exist in each Vercel project:
```
Required for auth.djamms.app:
✅ VITE_APPWRITE_ENDPOINT
✅ VITE_APPWRITE_PROJECT_ID
✅ VITE_APPWRITE_DATABASE_ID
✅ VITE_APPWRITE_FUNCTION_MAGIC_LINK
✅ VITE_JWT_SECRET
⚠️  VITE_APPWRITE_MAGIC_REDIRECT (check this has correct value)
✅ VITE_ALLOW_AUTO_CREATE_USERS
✅ VITE_APP_URL_LANDING
✅ VITE_APP_URL_PLAYER
```

**To Verify Vercel:**
1. Go to https://vercel.com/dashboard
2. Click project: **djamms-auth**
3. Go to **Settings** → **Environment Variables**
4. Check `VITE_APPWRITE_MAGIC_REDIRECT` value
5. If it shows `/auth/callback`, update it to `/callback`
6. Redeploy the auth app

### AppWrite Function Environment Variables
```
✅ APPWRITE_ENDPOINT
✅ APPWRITE_PROJECT_ID
✅ APPWRITE_DATABASE_ID
✅ APPWRITE_API_KEY
✅ JWT_SECRET
❌ RESEND_API_KEY (MISSING - add this after creating Resend account)
❌ SMTP_FROM (MISSING - add this after creating Resend account)
```

---

## 🚨 Why Emails Aren't Being Received

### Primary Reason: Resend Not Configured
The magic-link function has email sending code but:
```javascript
if (process.env.RESEND_API_KEY) {
  // Send email via Resend
  // This block is SKIPPED because RESEND_API_KEY is not set
} else {
  log('RESEND_API_KEY not configured - skipping email send');
}
```

**Current Behavior:**
1. ✅ Magic link token created in database
2. ✅ Function returns success with magicLink URL
3. ❌ Email is NOT sent (RESEND_API_KEY missing)
4. ℹ️ User never receives email
5. ✅ But magic link works if accessed directly (via API/curl)

### Secondary Reason: Callback URL Wrong
Even if emails were sent, the callback URL would be wrong:
- Email would contain: `https://auth.djamms.app/auth/callback`
- Correct URL should be: `https://auth.djamms.app/callback`
- Result: 404 error when clicking link

---

## 🎯 Action Plan

### Priority 1: Fix Callback URL (5 minutes)
1. Update `.env` file (remove `/auth` from callback URL)
2. Update Vercel environment variable if needed
3. Test with curl to verify URL format
4. Verify callback route works

### Priority 2: Configure Email (15 minutes)
1. Create Resend account
2. Add djamms.app domain
3. Get DNS records from Resend
4. Add TXT records to Porkbun
5. Wait 5 minutes
6. Verify domain in Resend
7. Get API key
8. Add to AppWrite function
9. Redeploy function

### Priority 3: Test End-to-End (5 minutes)
1. Go to https://auth.djamms.app (or localhost:3002)
2. Enter email address
3. Click "Send Magic Link"
4. Check email inbox (and spam folder)
5. Click link in email
6. Verify successful authentication

---

## 🔗 Quick Links

- **Resend:** https://resend.com
- **Porkbun DNS:** https://porkbun.com/account/domainsSpeedy
- **AppWrite Console:** https://cloud.appwrite.io
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Test Script:** `node tests/magic-link-api-test.mjs`

---

## 📞 Support Resources

- **Resend Docs:** https://resend.com/docs
- **Porkbun Support:** https://porkbun.com/support
- **AppWrite Docs:** https://appwrite.io/docs

---

**Next Step:** Fix the callback URL first (5 minutes), then configure Resend (15 minutes).
