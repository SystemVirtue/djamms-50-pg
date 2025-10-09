# DJAMMS Configuration Guide

Complete configuration instructions for AppWrite, Vercel, Porkbun, and Resend.

## Table of Contents
1. [Resend Email Configuration](#1-resend-email-configuration)
2. [Porkbun DNS Configuration](#2-porkbun-dns-configuration)
3. [AppWrite Function Environment Variables](#3-appwrite-function-environment-variables)
4. [AppWrite Auth Settings](#4-appwrite-auth-settings)
5. [Vercel Environment Variables](#5-vercel-environment-variables)
6. [Testing the Configuration](#6-testing-the-configuration)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Resend Email Configuration

### Step 1.1: Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Confirm your email address

### Step 1.2: Add and Verify Domain
1. Navigate to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter: `djamms.app`
4. Resend will provide DNS records (save these for Step 2)

### Step 1.3: Get API Key
1. Navigate to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: `DJAMMS Magic Link`
4. Copy the API key (starts with `re_...`)
5. **SAVE THIS KEY SECURELY** - you'll need it for Step 3

---

## 2. Porkbun DNS Configuration

### Step 2.1: Add Resend Verification Records
Log into [porkbun.com](https://porkbun.com) and add these DNS records:

**Record 1: Domain Verification**
```
Type:     TXT
Host:     _resend
Value:    [provided by Resend dashboard - looks like "resend-verification-xxxxxxxx"]
TTL:      600
```

**Record 2: DKIM Signing Key**
```
Type:     TXT
Host:     resend._domainkey
Value:    [provided by Resend dashboard - long string starting with "p=MII..."]
TTL:      600
```

### Step 2.2: Verify Records
1. Wait 5-10 minutes for DNS propagation
2. Return to Resend dashboard → Domains
3. Click **Verify** next to djamms.app
4. Status should change to "Verified" ✓

### Step 2.3: Current DNS Records (Reference)
Your existing records should include:
```
# Vercel Production
Type: CNAME, Host: @, Value: cname.vercel-dns.com
Type: A, Host: @, Value: 76.76.21.21

# Vercel Subdomains
Type: CNAME, Host: auth, Value: cname.vercel-dns.com
Type: CNAME, Host: dashboard, Value: cname.vercel-dns.com
Type: CNAME, Host: player, Value: cname.vercel-dns.com
Type: CNAME, Host: admin, Value: cname.vercel-dns.com
Type: CNAME, Host: kiosk, Value: cname.vercel-dns.com

# AppWrite
Type: CNAME, Host: api, Value: your-appwrite-instance

# New Resend Records (add these)
Type: TXT, Host: _resend, Value: [from Resend]
Type: TXT, Host: resend._domainkey, Value: [from Resend]
```

---

## 3. AppWrite Function Environment Variables

### Step 3.1: Navigate to Function Settings
1. Log into [cloud.appwrite.io](https://cloud.appwrite.io)
2. Select your project: **djamms-prototype**
3. Go to **Functions** → **magic-link**
4. Click **Settings** tab

### Step 3.2: Add Environment Variables
Add these two variables:

**Variable 1: RESEND_API_KEY**
```
Key:    RESEND_API_KEY
Value:  re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        (your API key from Step 1.3)
```

**Variable 2: SMTP_FROM**
```
Key:    SMTP_FROM
Value:  DJAMMS <noreply@djamms.app>
```

### Step 3.3: Verify Existing Variables
Ensure these are already configured:
```
APPWRITE_ENDPOINT      = https://api.djamms.app/v1
APPWRITE_PROJECT_ID    = [your project ID]
APPWRITE_API_KEY       = [your API key]
APPWRITE_DATABASE_ID   = [your database ID]
JWT_SECRET             = [your JWT secret - same as backend]
```

### Step 3.4: Redeploy Function
After adding environment variables:
1. Click **Deploy** button
2. Or use CLI: `cd functions/appwrite && npm run deploy`
3. Wait for deployment to complete (~30 seconds)
4. Check logs for "Email sent successfully" messages

---

## 4. AppWrite Auth Settings

### Step 4.1: Configure Callback URLs
1. In AppWrite Console → **Auth** → **Settings**
2. Add these to **Allowed Origins**:
   ```
   https://auth.djamms.app
   https://dashboard.djamms.app
   https://player.djamms.app
   https://admin.djamms.app
   https://kiosk.djamms.app
   https://djamms.app
   ```

### Step 4.2: Enable JWT
1. Under **Auth** → **Security**
2. Ensure **JWT** is enabled
3. Set **JWT Expiration**: `86400` (24 hours)
4. Verify **JWT Secret** matches your environment variable

### Step 4.3: Session Settings
```
Session Length:          604800 seconds (7 days)
Session Alerts:          Enabled
Security:                HTTPS Only
```

---

## 5. Vercel Environment Variables

### Step 5.1: Verify Production Environment
Go to [vercel.com](https://vercel.com) → Your Project → **Settings** → **Environment Variables**

**Required for All Apps:**
```
VITE_APPWRITE_ENDPOINT       = https://api.djamms.app/v1
VITE_APPWRITE_PROJECT_ID     = [your project ID]
VITE_DATABASE_ID             = [your database ID]
VITE_YOUTUBE_API_KEY         = [your YouTube Data API v3 key]
```

### Step 5.2: Auth App Specific
```
VITE_AUTH_CALLBACK_URL       = https://auth.djamms.app/callback
VITE_AUTH_REDIRECT_URL       = https://dashboard.djamms.app
```

### Step 5.3: Player App Specific
```
VITE_PLAYER_HEARTBEAT_INTERVAL   = 5000
VITE_CROSSFADE_DURATION          = 3000
```

### Step 5.4: Redeploy if Changed
If you added/changed any environment variables:
```bash
# Trigger redeployment
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

---

## 6. Testing the Configuration

### Test 6.1: Email Delivery Test
```bash
# Test from command line
curl -X POST https://api.djamms.app/v1/functions/[function-id]/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: [project-id]" \
  -H "X-Appwrite-Key: [api-key]" \
  -d '{"action":"create","email":"your-email@example.com"}'
```

**Expected Result:**
- Email arrives within 10 seconds
- Email contains magic link button
- Link format: `https://auth.djamms.app/callback?token=...`

### Test 6.2: Browser Test
1. Go to [https://auth.djamms.app](https://auth.djamms.app)
2. Enter your email address
3. Click **Send Magic Link**
4. Check your inbox (and spam folder)
5. Click the link in email
6. Should redirect to dashboard with authentication

### Test 6.3: AppWrite Logs
1. AppWrite Console → **Functions** → **magic-link** → **Logs**
2. Look for:
   ```
   ✓ Magic link created: [token]
   ✓ Email sent successfully: [resend-id]
   ```
3. If you see errors, check [Troubleshooting](#7-troubleshooting)

### Test 6.4: Resend Dashboard
1. Log into [resend.com](https://resend.com)
2. Go to **Emails** section
3. You should see sent emails with status:
   - ✓ Delivered
   - ✓ Opened (when user clicks)

---

## 7. Troubleshooting

### Issue: Email Not Received

**Check 1: Resend Domain Verification**
```bash
# Verify DNS records are live
dig TXT _resend.djamms.app +short
dig TXT resend._domainkey.djamms.app +short
```
Should return the values you added in Porkbun.

**Check 2: AppWrite Function Logs**
- Look for "Email sent successfully" or error messages
- Common errors:
  - `RESEND_API_KEY not configured`: Add to function environment variables
  - `403 Forbidden`: API key invalid or domain not verified
  - `400 Bad Request`: SMTP_FROM format incorrect

**Check 3: Spam Folder**
- Resend emails may be flagged initially
- Add noreply@djamms.app to contacts
- Check spam/junk folders

**Check 4: Resend Logs**
- Log into Resend dashboard
- Check if email shows as sent
- Look at delivery status and error messages

### Issue: Magic Link Expired

**Symptom:** "Token expired or invalid" message

**Solution:**
- Magic links expire after 15 minutes
- Request a new link
- Use it immediately after receiving

**Code Reference:**
```javascript
// In main.js
const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
```

### Issue: Callback Not Working

**Check 1: CORS Configuration**
- Ensure `auth.djamms.app` is in AppWrite allowed origins
- Check browser console for CORS errors

**Check 2: JWT Secret Mismatch**
- Verify JWT_SECRET in function matches backend
- Check AppWrite auth settings

**Check 3: URL Format**
Expected format:
```
https://auth.djamms.app/callback?token=[64-char-hex]&email=[email]
```

### Issue: "Failed to send email" in Logs

**Possible Causes:**
1. **Invalid API Key**: Double-check RESEND_API_KEY in function settings
2. **Domain Not Verified**: Complete Step 2.2 above
3. **Invalid FROM Address**: Must use verified domain (djamms.app)
4. **Rate Limit**: Free tier = 100 emails/day (check usage in Resend)

**Resolution Steps:**
1. Verify Resend dashboard shows domain as verified
2. Check API key hasn't been revoked
3. Ensure SMTP_FROM uses format: `Name <email@djamms.app>`
4. Check Resend logs for specific error messages

### Issue: Token Already Used

**Symptom:** "Magic link has already been used"

**Explanation:** Each token is single-use for security

**Solution:**
- Request a new magic link
- Don't click the link multiple times
- Clear browser cache if repeating issue

---

## Summary Checklist

Before going live, verify all checkboxes:

### Resend Configuration
- [ ] Resend account created
- [ ] djamms.app domain added
- [ ] DNS records added to Porkbun
- [ ] Domain shows "Verified" in Resend
- [ ] API key generated and saved

### AppWrite Configuration
- [ ] RESEND_API_KEY environment variable added
- [ ] SMTP_FROM environment variable added
- [ ] Function redeployed after adding variables
- [ ] Callback URLs configured in Auth settings
- [ ] JWT enabled and secret configured

### DNS Configuration
- [ ] _resend TXT record added
- [ ] resend._domainkey TXT record added
- [ ] Records verified with dig command
- [ ] All existing CNAME records still working

### Testing
- [ ] Test email sent and received
- [ ] Magic link clicked successfully
- [ ] User authenticated and redirected
- [ ] AppWrite logs show success
- [ ] Resend dashboard shows delivery

---

## Support Resources

- **Resend Docs**: https://resend.com/docs
- **AppWrite Functions**: https://appwrite.io/docs/functions
- **Porkbun DNS**: https://porkbun.com/support
- **DJAMMS Discord**: [Your support channel]

---

## Next Steps

Once email configuration is complete:
1. **Test with real users**: Have team test authentication flow
2. **Monitor Resend usage**: Track email deliverability rates
3. **Set up alerts**: Configure Resend webhooks for failures
4. **Plan upgrade**: When > 100 emails/day, upgrade Resend plan ($20/mo for 50k emails)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production Ready
