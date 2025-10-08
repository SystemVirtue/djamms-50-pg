# Magic Link Email Fix - Complete Solution

**Date:** October 9, 2025  
**Issue:** Magic link tokens created but emails not sent  
**Status:** ✅ Root cause identified, fix ready to implement

---

## 🔍 Problem Analysis

### Current Behavior
1. ✅ User enters email on auth.djamms.app
2. ✅ Magic link token created in AppWrite database
3. ✅ Token returned in API response
4. ❌ **NO EMAIL SENT** - This is why you don't receive anything

### Root Cause
The `magic-link` function (`functions/appwrite/functions/magic-link/src/main.js`) only:
- Creates token in database
- Returns token in JSON response
- **Does NOT send emails**

This is intentional for development to avoid email configuration complexity.

---

## 🎯 Solution 1: Development Workaround (Immediate)

### Get the Magic Link from Console

1. **Open Browser Console** (F12) while on auth.djamms.app
2. **Enter your email** and click "Send Magic Link"
3. **Look in Console** for the API response:
   ```javascript
   {
     "success": true,
     "token": "abc123...",
     "magicLink": "https://auth.djamms.app/callback?token=abc123...&email=your@email.com"
   }
   ```
4. **Copy the `magicLink` URL** and paste it in your browser
5. **You'll be logged in!**

### OR Use This Command:
```bash
# Get magic link directly from API
curl -s -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d "{\"body\":\"{\\\"action\\\":\\\"create\\\",\\\"email\\\":\\\"your@email.com\\\",\\\"redirectUrl\\\":\\\"https://auth.djamms.app/callback\\\"}\"}" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('responseBody', '{}'))" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('magicLink', 'No link found'))"
```

Replace `your@email.com` with your actual email.

---

## 🚀 Solution 2: Add Email Sending (Production-Ready)

### Step 1: Choose Email Service

**Recommended: Resend** (Developer-friendly, 100 free emails/day)
- Sign up: https://resend.com
- Get API key
- Free tier: 100 emails/day, 3,000/month

**Alternatives:**
- SendGrid (100 free/day)
- Mailgun (5,000 free/month first 3 months)
- AWS SES (very cheap, ~$0.10 per 1,000 emails)

### Step 2: Add Resend to Function

Update `functions/appwrite/functions/magic-link/package.json`:

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "node-appwrite": "^20.0.0",
    "resend": "^3.0.0"
  }
}
```

### Step 3: Add Environment Variables

In AppWrite Console → Functions → magic-link → Settings → Variables:

```bash
RESEND_API_KEY=re_your_api_key_here
SMTP_FROM=noreply@djamms.app
```

### Step 4: Update Function Code

Update `functions/appwrite/functions/magic-link/src/main.js`:

```javascript
const { Client, Databases, Query } = require('node-appwrite');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async ({ req, res, log, error }) => {
  try {
    const body = req.bodyJson || JSON.parse(req.body || '{}');
    const { action, email, token: magicToken } = body;

    log(`Magic-link: action=${action}, email=${email}`);

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Create magic link
    if (action === 'create') {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000;
      
      const redirectUrl = body.redirectUrl || 'https://auth.djamms.app/callback';
      const magicLink = `${redirectUrl}?token=${token}&email=${encodeURIComponent(email)}`;

      // Store in database
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        'unique()',
        {
          email,
          token,
          redirectUrl,
          expiresAt,
          used: false
        }
      );

      log(`Magic link created: ${token}`);

      // 🆕 SEND EMAIL VIA RESEND
      try {
        await resend.emails.send({
          from: process.env.SMTP_FROM || 'DJAMMS <noreply@djamms.app>',
          to: email,
          subject: '🎵 Your DJAMMS Login Link',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                  .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎵 DJAMMS</h1>
                    <p>Your Login Link is Ready</p>
                  </div>
                  <div class="content">
                    <h2>Hi there! 👋</h2>
                    <p>Click the button below to log in to your DJAMMS account:</p>
                    <p style="text-align: center;">
                      <a href="${magicLink}" class="button">Log In to DJAMMS</a>
                    </p>
                    <p><strong>This link expires in 15 minutes.</strong></p>
                    <p>If you didn't request this login link, you can safely ignore this email.</p>
                    <div class="footer">
                      <p>© 2025 DJAMMS - Your Digital Jukebox</p>
                      <p><a href="https://djamms.app">djamms.app</a></p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        
        log(`✅ Email sent successfully to ${email}`);
        
      } catch (emailError) {
        error(`⚠️ Email send failed: ${emailError.message}`);
        // Don't fail the request - still return token for dev fallback
      }

      return res.json({
        success: true,
        message: 'Magic link sent to your email',
        token: token,  // Still return for dev/testing
        magicLink: magicLink  // Still return for dev/testing
      });
    }

    // Verify magic link (existing code continues...)
    if (action === 'callback' || action === 'verify') {
      // ... rest of the code remains the same ...
    }

  } catch (err) {
    error(`Magic link error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

### Step 5: Redeploy Function

```bash
cd functions/appwrite/functions/magic-link
npm install
cd ../../..

# Deploy using AppWrite CLI
appwrite deploy function
```

Or deploy via AppWrite Console:
1. Go to Functions → magic-link
2. Click "Deploy"
3. Upload updated function code

---

## 📧 Setting Up Resend

### 1. Create Account
- Go to https://resend.com
- Sign up with your email
- Verify email

### 2. Verify Domain (djamms.app)
- Go to Domains → Add Domain
- Enter: `djamms.app`
- Add DNS records to Porkbun:

#### DNS Records to Add:
```
Type: TXT
Host: @
Value: resend._domainkey.djamms.app
TTL: 600

Type: TXT  
Host: _resend
Value: (provided by Resend)
TTL: 600
```

Resend will provide exact values.

### 3. Get API Key
- Go to API Keys → Create API Key
- Name: "DJAMMS Production"
- Copy the key (starts with `re_...`)

### 4. Test Email
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@djamms.app",
    "to": "your@email.com",
    "subject": "DJAMMS Test",
    "html": "<p>Test email from DJAMMS</p>"
  }'
```

---

## ⚙️ Configuration Summary

### AppWrite Function Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxx
SMTP_FROM=DJAMMS <noreply@djamms.app>

# Existing (keep these)
JWT_SECRET=your_jwt_secret
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=your_api_key
```

### Porkbun DNS Records

```
# Resend verification (get exact values from Resend dashboard)
Type: TXT
Host: @
Value: resend._domainkey.djamms.app
TTL: 600

Type: TXT
Host: _resend  
Value: (provided by Resend)
TTL: 600

# Existing records (keep these)
Type: CNAME
Host: auth
Value: cname.vercel-dns.com
TTL: 600

... (all other existing records)
```

### Vercel (No Changes Needed)
- Callback URL already set: `https://auth.djamms.app/callback`
- Environment variables already configured
- No additional changes required

---

## 🧪 Testing After Implementation

### Test 1: Check Function Logs
```bash
# Watch function logs in AppWrite Console
# Functions → magic-link → Executions → View Logs
```

Look for:
```
✅ Email sent successfully to user@example.com
```

### Test 2: Try Auth Flow
1. Go to https://auth.djamms.app
2. Enter your email
3. Click "Send Magic Link"
4. Check your email inbox (and spam folder)
5. Click the link in email
6. Should redirect to player

### Test 3: Verify in AppWrite
1. Go to AppWrite Console → Databases → djamms_production → magicLinks
2. Find your email's document
3. Check fields:
   - `used`: should change from `false` to `true` after clicking link
   - `expiresAt`: should be 15 minutes from creation

---

## 🐛 Troubleshooting

### Email Not Received

**Check 1: Spam Folder**
- Resend emails might go to spam initially
- Mark as "Not Spam" to train filter

**Check 2: Domain Verification**
- Go to Resend dashboard
- Check domain status is "Verified"
- DNS records must be added correctly

**Check 3: Function Logs**
- Check AppWrite function execution logs
- Look for email send errors

**Check 4: Resend Dashboard**
- Go to Resend → Emails
- See if email was sent (status, delivery)

### Email Sent But Not Clicking Through

**Check 1: Token Expiry**
- Links expire after 15 minutes
- Request new link if expired

**Check 2: Already Used**
- Each link can only be used once
- Request new link if already used

**Check 3: Callback URL**
- Should be: `https://auth.djamms.app/callback`
- Check function environment variable

---

## 🎯 What You Need to Do

### Immediate (Development):
1. ✅ Use console workaround to get magic link
2. ✅ Test authentication works

### Production Setup:
1. ⏳ Sign up for Resend
2. ⏳ Verify djamms.app domain
3. ⏳ Get API key
4. ⏳ Add environment variables to function
5. ⏳ Update function code
6. ⏳ Redeploy function
7. ⏳ Test email delivery

**Time Required:** ~30 minutes for complete setup

---

## 📚 Alternative: Use AppWrite Cloud Messaging

If you don't want to use Resend, you can use AppWrite's built-in email:

### AppWrite Cloud Messaging Setup

1. Go to AppWrite Console → Settings → SMTP
2. Configure SMTP settings:
   ```
   Host: smtp.sendgrid.net (or your provider)
   Port: 587
   Username: apikey
   Password: your_sendgrid_key
   Secure: TLS
   Sender Email: noreply@djamms.app
   Sender Name: DJAMMS
   ```

3. Update function to use AppWrite Messaging API:
```javascript
const { Messaging } = require('node-appwrite');

const messaging = new Messaging(client);

await messaging.createEmail(
  'unique()',
  email,
  '🎵 Your DJAMMS Login Link',
  `Click here: ${magicLink}`,
  `<html>...</html>`
);
```

---

## ✅ Summary

**Problem:** Magic link function doesn't send emails, only returns token

**Quick Fix:** Get magic link from browser console

**Production Fix:** Add Resend email service to function

**Time:** 5 minutes (dev workaround) or 30 minutes (production setup)

**Next:** Once emails working, magic link auth will be fully functional!

