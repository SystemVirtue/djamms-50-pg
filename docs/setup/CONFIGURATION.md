# ⚙️ Configuration Guide

Complete configuration reference for DJAMMS services.

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [AppWrite Configuration](#appwrite-configuration)
3. [Email Service (Resend)](#email-service-resend)
4. [DNS Configuration](#dns-configuration)
5. [YouTube API](#youtube-api)
6. [Security Settings](#security-settings)

---

## Environment Variables

### Local Development (.env)

```bash
# ============================================
# APPWRITE CONFIGURATION
# ============================================
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
VITE_APPWRITE_API_KEY=standard_xxxxx...

# Mirror for Node scripts (non-VITE)
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=standard_xxxxx...

# ============================================
# AUTHENTICATION
# ============================================
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
VITE_JWT_SECRET=your_generated_secret_here
VITE_ALLOW_AUTO_CREATE_USERS=false

JWT_SECRET=your_generated_secret_here

# ============================================
# CLOUD FUNCTIONS
# ============================================
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY=68e5a41f00222cab705b
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=68e5acf100104d806321

# ============================================
# EMAIL SERVICE
# ============================================
SMTP_FROM=DJAMMS <noreply@djamms.app>
RESEND_API_KEY=re_xxxxx...

# ============================================
# EXTERNAL APIs
# ============================================
VITE_YOUTUBE_API_KEY=AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few

# ============================================
# APP URLs (Production)
# ============================================
VITE_APP_URL_LANDING=https://djamms.app
VITE_APP_URL_AUTH=https://auth.djamms.app
VITE_APP_URL_PLAYER=https://player.djamms.app
VITE_APP_URL_ADMIN=https://admin.djamms.app
VITE_APP_URL_KIOSK=https://kiosk.djamms.app
```

### Production (AppWrite Site Variables)

In AppWrite Console → Sites → DJAMMS Web App → Variables:

```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
VITE_JWT_SECRET=<production_secret>
VITE_YOUTUBE_API_KEY=<your_youtube_key>
```

---

## AppWrite Configuration

### 1. Project Settings

**Console:** `cloud.appwrite.io/console/project-<id>/settings`

- **Project Name:** DJAMMS_v1
- **Project ID:** 68cc86c3002b27e13947
- **Region:** Sydney (syd)
- **Endpoint:** https://syd.cloud.appwrite.io/v1

### 2. Platforms

Add web platform for CORS:

```
Platform Type: Web App
Name: DJAMMS Production
Hostname: www.djamms.app
```

### 3. Database

**Database ID:** 68e57de9003234a84cae

**Collections:**
1. **venues** - Venue configuration
   - `venueId` (string, required)
   - `name` (string, required)
   - `slug` (string, required, indexed)
   - `ownerId` (string, required)
   - `defaultPlaylistId` (string, optional)
   - `activePlayerInstanceId` (string, optional)
   - `users` (string, JSON array)

2. **queues** - Player queues
   - `venueId` (string, required, indexed)
   - `mainQueue` (string, JSON array)
   - `priorityQueue` (string, JSON array)
   - `nowPlaying` (string, JSON object)

3. **playlists** - Music playlists
   - `name` (string, required)
   - `description` (string)
   - `tracks` (string, JSON array)
   - `ownerId` (string, required)
   - `isPublic` (boolean)

4. **users** - User accounts
   - `email` (string, required, indexed, unique)
   - `name` (string)
   - `role` (enum: user, admin)
   - `venues` (string, JSON array)

5. **requests** - Song requests
   - `venueId` (string, required, indexed)
   - `videoId` (string, required)
   - `title` (string, required)
   - `requesterId` (string)
   - `timestamp` (datetime, indexed)
   - `status` (enum: pending, approved, rejected, played)

6. **activityLogs** - Activity history
   - `venueId` (string, required, indexed)
   - `userId` (string)
   - `action` (string)
   - `timestamp` (datetime, indexed)
   - `metadata` (string, JSON object)

7. **magicLinks** - Authentication tokens
   - `token` (string, required, indexed, unique)
   - `email` (string, required)
   - `expiresAt` (datetime, indexed)
   - `used` (boolean)

### 4. Functions

#### Magic Link (68e5a317003c42c8bb6a)

**Runtime:** Node.js 18  
**Entrypoint:** `src/main.js`  
**Execute Access:** Anyone

**Environment Variables:**
```bash
RESEND_API_KEY=re_xxxxx...
MAGIC_REDIRECT=https://www.djamms.app/auth/callback
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
```

#### Player Registry (68e5a41f00222cab705b)

**Runtime:** Node.js 18  
**Entrypoint:** `src/main.js`  
**Execute Access:** Anyone

**Environment Variables:**
```bash
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=standard_xxxxx...
```

#### Process Request (68e5acf100104d806321)

**Runtime:** Node.js 18  
**Entrypoint:** `src/main.js`  
**Execute Access:** Anyone

**Environment Variables:**
```bash
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=standard_xxxxx...
```

---

## Email Service (Resend)

### 1. Create Account

1. Visit [resend.com](https://resend.com)
2. Sign up (free tier: 100 emails/day)
3. Verify your email

### 2. Add Domain

**Console:** resend.com/domains

1. Click **Add Domain**
2. Enter: `djamms.app`
3. Note the verification records

### 3. Get API Key

**Console:** resend.com/api-keys

1. Click **Create API Key**
2. Name: `DJAMMS Magic Link`
3. Copy key (starts with `re_`)
4. Save securely

### 4. Configure DNS

Add these records to your DNS provider:

```dns
# Domain Verification
TYPE: TXT
HOST: _resend
VALUE: resend-verification-xxxxxxxx
TTL:  600

# DKIM Signing
TYPE: TXT  
HOST: resend._domainkey
VALUE: p=MIIBIjANBg... (long string)
TTL:  600
```

### 5. Verify Domain

1. Wait 5-10 minutes for DNS propagation
2. Return to Resend → Domains
3. Click **Verify**
4. Status should show ✅ **Verified**

### 6. Test Email

```bash
# Use Resend test endpoint
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "DJAMMS <noreply@djamms.app>",
    "to": "your@email.com",
    "subject": "Test",
    "text": "Test email from DJAMMS"
  }'
```

---

## DNS Configuration

### Current Setup (Porkbun)

```dns
# ============================================
# PRODUCTION DOMAIN
# ============================================
TYPE     HOST    VALUE                                  TTL
──────   ─────   ────────────────────────────────────   ────
CNAME    www     68e7c589d3e464cd7a93.appwrite.network 600
ALIAS    @       www.djamms.app                         600

# ============================================
# EMAIL (Resend)
# ============================================
TXT      _resend                resend-verification-xxx    600
TXT      resend._domainkey      p=MIIBIjANBg...           600

# ============================================
# CAA RECORDS (SSL Certificate Authority)
# ============================================
CAA      @       0 issue "letsencrypt.org"              3600
CAA      @       0 issuewild "letsencrypt.org"          3600
```

### DNS Propagation Check

```bash
# Check CNAME
dig www.djamms.app CNAME +short
# → should show: xxx.appwrite.network

# Check TXT records
dig _resend.djamms.app TXT +short
# → should show: "resend-verification-xxx"

# Check CAA
dig djamms.app CAA +short
# → should show: 0 issue "letsencrypt.org"
```

---

## YouTube API

### 1. Create Project

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "DJAMMS"
3. Enable YouTube Data API v3

### 2. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy key (starts with `AIza`)
4. **Restrict Key:**
   - Application restrictions: HTTP referrers
   - Add: `www.djamms.app/*`, `localhost:*`
   - API restrictions: YouTube Data API v3 only

### 3. Configure Quotas

**Default Quotas:**
- 10,000 units/day (free)
- Search: 100 units per request
- Videos.list: 1 unit per request

**Request Quota Increase** (if needed):
- Console → Quotas
- Select YouTube Data API v3
- Request increase to 1,000,000 units/day

### 4. Add to Environment

```bash
# .env
VITE_YOUTUBE_API_KEY=AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few

# AppWrite Site Variables
VITE_YOUTUBE_API_KEY=AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
```

---

## Security Settings

### JWT Secret Generation

```bash
# Generate strong secret (32 bytes)
openssl rand -base64 32
# → Save to VITE_JWT_SECRET and JWT_SECRET
```

### AppWrite API Key

**Console:** AppWrite → Settings → API Keys

1. Click **Create API Key**
2. Name: `DJAMMS Server`
3. Scopes:
   - databases.*
   - collections.*
   - documents.*
   - users.*
4. Never expire: ✓
5. Copy key (starts with `standard_`)
6. Save to `VITE_APPWRITE_API_KEY` and `APPWRITE_API_KEY`

### Permissions

**Public Access (Anyone):**
- queues: Read only
- playlists: Read only
- venues: Read only

**Authenticated Users:**
- users: Own documents only
- requests: Create own, read own
- activityLogs: Create own, read own

**Admins Only:**
- queues: Write
- playlists: Write
- venues: Write
- users: Read all

### CORS Configuration

**AppWrite Console → Settings → Platforms:**

Add these platforms:
```
1. Web App: www.djamms.app
2. Development: localhost:5173-5178
```

---

## Validation Checklist

### Environment Variables

- [ ] All VITE_ variables set
- [ ] All non-VITE mirrors set (for scripts)
- [ ] JWT_SECRET is 32+ characters
- [ ] API keys are valid and not expired

### AppWrite

- [ ] Project accessible
- [ ] Database has all 7 collections
- [ ] Functions deployed and active
- [ ] Function environment variables set
- [ ] Platform CORS configured

### Email

- [ ] Resend domain verified
- [ ] API key valid
- [ ] Test email sent successfully
- [ ] DNS records propagated

### DNS

- [ ] CNAME points to AppWrite
- [ ] SSL certificate active
- [ ] Resend TXT records exist
- [ ] CAA records configured

### APIs

- [ ] YouTube API key restricted
- [ ] Quota sufficient
- [ ] Test search works

---

## Troubleshooting

### "Invalid API Key"

**Check:**
```bash
# Verify key format
echo $VITE_APPWRITE_API_KEY
# → Should start with "standard_"

# Test key
curl -H "X-Appwrite-Key: $VITE_APPWRITE_API_KEY" \
  https://syd.cloud.appwrite.io/v1/databases/68e57de9003234a84cae/collections
```

### "CORS Error"

**Solution:**
1. AppWrite Console → Settings → Platforms
2. Add your domain
3. Include protocol: `https://www.djamms.app`

### "Email Not Sending"

**Check:**
1. Resend API key is correct
2. Domain is verified (green checkmark)
3. DNS records propagated (`dig` commands above)
4. Check Resend logs for errors

### "YouTube Quota Exceeded"

**Solution:**
1. Check quota usage in Google Console
2. Implement caching
3. Request quota increase
4. Use video embed URLs instead of search

---

## Next Steps

- **[Quick Start](./QUICKSTART.md)** - Get started locally
- **[Deployment](./DEPLOYMENT.md)** - Deploy to production
- **[Architecture](../architecture/ARCHITECTURE.md)** - System design

---

**Last Updated:** October 16, 2025  
**Maintained By:** SystemVirtue
