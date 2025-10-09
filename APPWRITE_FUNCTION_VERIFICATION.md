# AppWrite Magic-Link Function Configuration Checklist

**Date:** October 9, 2025  
**Function:** magic-link (ID: 68e5a317003c42c8bb6a)

---

## 🔍 What to Check in AppWrite Console

### Access the Function Settings

1. **Go to AppWrite Console:**
   - URL: https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/functions/function-68e5a317003c42c8bb6a

2. **Navigate to Settings:**
   - Click on the **magic-link** function
   - Go to **Settings** tab

---

## ✅ Environment Variables to Verify

### Required Environment Variables

Go to: **Settings** → **Environment Variables**

You should see these variables:

| Variable Name | Expected Value | Status |
|--------------|----------------|---------|
| **RESEND_API_KEY** | `re_Ps9eqvDb_C8YeZ9TyD4aYHZh88fRmpVqw` | ✅ You added this |
| **SMTP_FROM** | `DJAMMS <noreply@djamms.app>` | ✅ You added this |
| APPWRITE_ENDPOINT | `https://syd.cloud.appwrite.io/v1` | ✅ Auto-set |
| APPWRITE_PROJECT_ID | `68cc86c3002b27e13947` | ✅ Auto-set |
| APPWRITE_DATABASE_ID | `68e57de9003234a84cae` | ✅ Auto-set |
| APPWRITE_API_KEY | (Your API key) | ✅ Auto-set |
| JWT_SECRET | (128-char secret) | ✅ Auto-set |

### How to Verify

**In AppWrite Console:**
1. Go to **Settings** → **Environment Variables**
2. Check that `RESEND_API_KEY` exists and starts with `re_`
3. Check that `SMTP_FROM` exists and contains `noreply@djamms.app`

**Screenshot checklist:**
- [ ] RESEND_API_KEY is visible in the list
- [ ] SMTP_FROM is visible in the list
- [ ] Both values are not empty

---

## 🌐 Domain Configuration

### Where to Find Domain Settings

**In AppWrite Console:**
1. Go to **Settings** → **Domains** (if available)
2. OR check the function's allowed origins/domains

### What Domains Should Be Configured

For the magic-link function, you need to allow these domains:

#### Production Domains (Required)

```
https://auth.djamms.app
https://player.djamms.app
https://admin.djamms.app
https://kiosk.djamms.app
https://dashboard.djamms.app
https://djamms.app
```

#### Development Domains (For Local Testing)

```
http://localhost:3002
http://localhost:3001
http://localhost:3003
http://localhost:3004
http://localhost:3000
```

### Domain Configuration Location

**Option A: Function-Level Domains**
- Go to **Functions** → **magic-link** → **Settings** → **Domains**
- Add all domains listed above

**Option B: Project-Level CORS**
- Go to **Settings** (project settings) → **Platforms**
- Ensure all your domains are added as **Web** platforms

### Why These Domains Matter

- **auth.djamms.app**: Where magic link authentication happens (PRIMARY)
- **Other subdomains**: May call the function for authentication
- **localhost ports**: For local development testing

---

## 📋 Step-by-Step Verification Process

### Step 1: Check Environment Variables (2 minutes)

1. Open: https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/functions/function-68e5a317003c42c8bb6a/settings
2. Scroll to **Environment Variables** section
3. Verify these exist:
   ```
   ✅ RESEND_API_KEY = re_Ps9eqvDb_C8YeZ9TyD4aYHZh88fRmpVqw
   ✅ SMTP_FROM = DJAMMS <noreply@djamms.app>
   ```

**If missing:**
- Click **Add Variable**
- Enter name and value
- Click **Save**

---

### Step 2: Check Deployment Status (1 minute)

1. Go to **Deployments** tab
2. Check latest deployment:
   - Status should be **Active** (green)
   - Deployment ID: Look for the most recent
   - Build should show **Success**

**If deployment is old:**
- The new environment variables won't be active yet
- Need to redeploy (see Step 4)

---

### Step 3: Check Function Logs (2 minutes)

1. Go to **Executions** tab
2. Click on the most recent execution
3. Look for these log messages:

**✅ Good Signs:**
```
Email sent successfully
Resend response: { id: 'xxx' }
```

**❌ Bad Signs:**
```
RESEND_API_KEY not configured - skipping email send
Error sending email: ...
Resend error: ...
```

**If you see "RESEND_API_KEY not configured":**
- Environment variable exists but function hasn't been redeployed
- Proceed to Step 4

---

### Step 4: Redeploy Function (30 seconds)

**Why?** New environment variables only take effect after redeployment.

**How:**
1. Go to **Deployments** tab
2. Find the latest deployment (e.g., `68e6d45b68433e157a49`)
3. Click the **•••** (three dots) menu
4. Select **Redeploy**
5. Wait 30 seconds for "Active" status

**Alternative - Deploy via CLI:**
```bash
cd functions/appwrite/functions/magic-link
appwrite deploy function
```

---

### Step 5: Verify Domains/CORS (3 minutes)

**Method A: Check Function Domains**
1. In function settings, look for **Domains** or **Allowed Origins**
2. Ensure these are listed:
   - `https://auth.djamms.app`
   - `https://player.djamms.app`
   - `https://admin.djamms.app`
   - `https://kiosk.djamms.app`
   - `https://dashboard.djamms.app`
   - `http://localhost:3002`

**Method B: Check Project Platforms**
1. Go to main **Settings** → **Platforms**
2. Look for **Web** platforms
3. Ensure all your domains are listed

**If domains are missing:**
- Click **Add Platform** → **Web**
- Enter domain name
- Click **Add**

---

## 🧪 Test After Configuration

### Quick Test (30 seconds)

Run this command to test if emails are being sent:

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
node tests/test-email-sending.mjs
```

**Expected Output (Success):**
```
✅ PASS: Magic link created successfully
📧 ✅ Email sent successfully via Resend!
🎉 SUCCESS: Check mike@djamms.app for the magic link email!
```

**If Still Failing:**
Check the execution logs for specific error messages.

---

## 🔍 How to Check Function Logs

### View Recent Execution Logs

1. **Go to Executions:**
   - Functions → magic-link → Executions

2. **Click Latest Execution:**
   - Shows execution details

3. **Check Logs Section:**
   - Look for error messages
   - Search for "RESEND" or "email"

### Common Log Messages

| Log Message | Meaning | Action |
|-------------|---------|--------|
| "RESEND_API_KEY not configured" | Env var missing or function not redeployed | Redeploy function |
| "Email sent successfully" | ✅ Working! | Check inbox |
| "Error sending email: 401" | Invalid API key | Check RESEND_API_KEY value |
| "Error sending email: 403" | Domain not verified | Verify domain in Resend |
| "Error sending email: 422" | Invalid email format | Check SMTP_FROM format |

### Access Logs via API

```bash
# Get latest execution
curl -X GET "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  | python3 -m json.tool

# Get specific execution details
curl -X GET "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions/EXECUTION_ID" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print('Logs:', data.get('logs')); print('Response:', data.get('responseBody'))"
```

---

## 📊 Configuration Summary

### Current Setup

| Component | Status | Notes |
|-----------|--------|-------|
| Domain Verified | ✅ DONE | djamms.app verified in Resend |
| DNS Records | ✅ DONE | MX, SPF, DKIM all correct |
| RESEND_API_KEY | ✅ ADDED | Need to verify in console |
| SMTP_FROM | ✅ ADDED | Need to verify in console |
| Function Deployment | ⏳ PENDING | Need to redeploy to activate env vars |
| Domains/CORS | ❓ UNKNOWN | Need to verify in console |

---

## ✅ Complete Verification Checklist

Use this checklist to verify everything:

### Environment Variables
- [ ] Logged into AppWrite console
- [ ] Opened magic-link function settings
- [ ] Found Environment Variables section
- [ ] Verified RESEND_API_KEY exists (starts with `re_`)
- [ ] Verified SMTP_FROM exists (contains `noreply@djamms.app`)
- [ ] Checked deployment status (Active/Pending)

### Domains/CORS
- [ ] Checked function domains/origins settings
- [ ] Verified `https://auth.djamms.app` is listed
- [ ] Verified other production domains are listed
- [ ] Verified localhost domains for testing
- [ ] OR verified project platforms include all domains

### Deployment
- [ ] Function has been redeployed since adding env vars
- [ ] Latest deployment shows "Active" status
- [ ] Build logs show no errors

### Testing
- [ ] Ran `node tests/test-email-sending.mjs`
- [ ] Checked function execution logs
- [ ] Verified "Email sent successfully" in logs
- [ ] Checked email inbox (and spam folder)

---

## 🔗 Quick Links

- **AppWrite Function:** https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/functions/function-68e5a317003c42c8bb6a
- **Function Settings:** https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/functions/function-68e5a317003c42c8bb6a/settings
- **Function Executions:** https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/functions/function-68e5a317003c42c8bb6a/executions
- **Project Settings:** https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/settings
- **Resend Dashboard:** https://resend.com/domains

---

## 🎯 Expected Domain Configuration

Based on your project structure, these domains should be configured:

### Production Domains
```
https://auth.djamms.app        (Primary - authentication)
https://player.djamms.app      (Player app)
https://admin.djamms.app       (Admin app)  
https://kiosk.djamms.app       (Kiosk app)
https://dashboard.djamms.app   (Dashboard app)
https://djamms.app             (Landing page)
```

### Development Domains
```
http://localhost:3002          (Auth app)
http://localhost:3001          (Player app)
http://localhost:3003          (Admin app)
http://localhost:3004          (Kiosk app)
http://localhost:3000          (Landing page)
```

---

**Next Steps:**
1. Open AppWrite console and verify environment variables
2. Check domains/CORS configuration
3. Redeploy function if needed
4. Run test: `node tests/test-email-sending.mjs`
5. Check execution logs for confirmation
