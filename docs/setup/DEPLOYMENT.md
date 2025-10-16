# 🚀 Production Deployment Guide

Deploy DJAMMS to AppWrite Cloud with custom domain.

---

## Prerequisites

- ✅ Local development working (see [QUICKSTART.md](./QUICKSTART.md))
- ✅ AppWrite Cloud account ([cloud.appwrite.io](https://cloud.appwrite.io))
- ✅ Domain name (e.g., djamms.app)
- ✅ DNS access (Porkbun, Cloudflare, etc.)

---

## Overview

**Current Production Setup:**
- **Platform:** AppWrite Cloud (Sydney region)
- **Domain:** www.djamms.app
- **Apps:** Unified SPA with client-side routing
- **Functions:** 3 deployed (magic-link, player-registry, processRequest)
- **Database:** AppWrite Database with 7 collections

---

## Step 1: AppWrite Project Setup

### 1.1 Create Project

```bash
# Login to AppWrite CLI
npx appwrite login

# Create project (or use existing)
npx appwrite init project

# Note your project ID (e.g., 68cc86c3002b27e13947)
```

### 1.2 Deploy Database Schema

```bash
# From project root
cd functions/appwrite

# Deploy all collections
npx appwrite deploy collection

# Verify collections created:
# - venues
# - queues
# - playlists
# - users
# - requests
# - activityLogs
# - magicLinks
```

### 1.3 Add Database Attribute (if missing)

The `venues` collection needs a `defaultPlaylistId` attribute:

```bash
npx appwrite databases create-string-attribute \
  --database-id YOUR_DATABASE_ID \
  --collection-id venues \
  --key defaultPlaylistId \
  --size 256 \
  --required false
```

---

## Step 2: Deploy Cloud Functions

### 2.1 Magic Link (Authentication)

```bash
cd functions/appwrite

# Deploy function
npx appwrite push function --function-id YOUR_MAGIC_LINK_ID

# Add environment variables in AppWrite Console → Functions → magic-link → Settings:
RESEND_API_KEY=re_your_api_key
MAGIC_REDIRECT=https://www.djamms.app/auth/callback
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
```

### 2.2 Player Registry (Master Player)

```bash
# Deploy function
npx appwrite push function --function-id YOUR_PLAYER_REGISTRY_ID

# Add environment variables:
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key
```

### 2.3 Process Request (Song Requests)

```bash
# Deploy function
npx appwrite push function --function-id YOUR_PROCESS_REQUEST_ID

# Add environment variables:
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key
```

---

## Step 3: Build Applications

### 3.1 Update Environment Variables

Create/update `.env` in project root:

```bash
# AppWrite
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae

# Functions
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY=68e5a41f00222cab705b
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=68e5acf100104d806321

# Authentication
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
VITE_JWT_SECRET=your_jwt_secret_here

# YouTube (optional)
VITE_YOUTUBE_API_KEY=your_youtube_key
```

### 3.2 Build All Apps

```bash
# Build all applications
npm run build

# Verify builds successful:
# ✅ apps/landing/dist
# ✅ apps/auth/dist  
# ✅ apps/dashboard/dist
# ✅ apps/player/dist
# ✅ apps/admin/dist
# ✅ apps/kiosk/dist
```

---

## Step 4: Deploy to AppWrite Sites

### 4.1 Create Unified Site

**Option A: AppWrite Console (Recommended)**

1. Go to AppWrite Console → Your Project → **Sites**
2. Click **Create Site**
3. Configure:
   - **Name:** DJAMMS Web App
   - **Framework:** Static (SPA)
   - **Root Directory:** `functions/appwrite/sites/DJAMMS Web App`
   - **Build Command:** (leave empty - pre-built)
   - **Output Directory:** `.`

**Option B: CLI**

```bash
cd functions/appwrite

# Deploy site (if configured in appwrite.json)
npx appwrite deploy site
```

### 4.2 Add Custom Domain

1. In AppWrite Console → Sites → Your Site → **Domains**
2. Click **Add Domain**
3. Enter: `www.djamms.app`
4. AppWrite provides CNAME target: `xxxxxxxxxxxx.appwrite.network`
5. **Note this CNAME value** for DNS setup

---

## Step 5: Configure DNS

### 5.1 Add CNAME Record

In your DNS provider (e.g., Porkbun):

```dns
TYPE     HOST    VALUE                                  TTL
──────   ─────   ────────────────────────────────────   ────
CNAME    www     68e7c589d3e464cd7a93.appwrite.network 600
```

### 5.2 Root Domain Redirect (Optional)

**Option A: ALIAS Record** (if supported)
```dns
TYPE     HOST    VALUE              TTL
──────   ─────   ─────────────────  ────
ALIAS    @       www.djamms.app     600
```

**Option B: URL Forward** (Porkbun)
```
Forward @djamms.app → https://www.djamms.app
```

### 5.3 Wait for SSL

- AppWrite automatically provisions SSL certificate
- Usually takes 5-10 minutes
- Check status in Console → Sites → Domains
- Status should show ✅ **Active** with SSL

---

## Step 6: Verify Deployment

### 6.1 Test All Endpoints

```bash
# Landing page
curl -I https://www.djamms.app/
# → 200 OK

# Auth page
curl -I https://www.djamms.app/auth
# → 200 OK (SPA handles routing)

# Dashboard
curl -I https://www.djamms.app/dashboard/admin@systemvirtue.com
# → 200 OK

# Player
curl -I https://www.djamms.app/player/venue-001
# → 200 OK

# Admin
curl -I https://www.djamms.app/admin/venue-001
# → 200 OK

# Kiosk
curl -I https://www.djamms.app/kiosk/venue-001
# → 200 OK
```

### 6.2 Test Magic Link Flow

1. Visit https://www.djamms.app/auth
2. Enter email address
3. Check inbox for magic link
4. Click link
5. Should redirect to dashboard ✅

### 6.3 Test Player

1. Visit https://www.djamms.app/player/venue-001
2. Should show queue with tracks
3. Click play
4. YouTube video should load ✅

---

## Step 7: Post-Deployment

### 7.1 Populate Database

```bash
# Run database setup script
node update-venues.cjs

# Verify:
# ✅ venue-001 created
# ✅ Default playlist assigned
# ✅ Queues populated with tracks
```

### 7.2 Monitor Functions

Check AppWrite Console → Functions → Logs:
- magic-link: Watch for authentication requests
- player-registry: Monitor heartbeats
- processRequest: Track song requests

### 7.3 Enable Monitoring (Optional)

Install Console Ninja for real-time debugging:
```bash
npm install --save-dev console-ninja
```

See [CONSOLE_NINJA.md](../reference/CONSOLE_NINJA.md) for setup.

---

## Troubleshooting

### Site Shows "Site Not Found"

**Problem:** Domain not configured or DNS not propagated

**Solution:**
```bash
# Check DNS propagation
dig www.djamms.app CNAME

# Verify CNAME points to AppWrite
# Should show: xxx.appwrite.network
```

### 404 on Client Routes

**Problem:** SPA routing not configured

**Solution:**
Ensure fallback file is set in AppWrite Site settings:
```
Fallback File: index.html
```

### Magic Links Not Sending

**Problem:** Function not deployed or Resend misconfigured

**Solution:**
1. Check function logs in AppWrite Console
2. Verify RESEND_API_KEY is set
3. Check Resend dashboard for errors
4. Verify domain DNS records (SPF, DKIM)

### CORS Errors

**Problem:** AppWrite CORS not configured

**Solution:**
AppWrite Console → Settings → Platforms:
```
Add Platform: Web App
Hostname: www.djamms.app
```

### Database Connection Failed

**Problem:** Database ID or collection missing

**Solution:**
```bash
# Verify database exists
npx appwrite databases list

# Re-deploy collections
npx appwrite deploy collection
```

---

## Production Checklist

Before going live:

- [ ] All functions deployed and tested
- [ ] Database collections created with indexes
- [ ] Venues and playlists populated
- [ ] Custom domain configured with SSL
- [ ] Magic link authentication working
- [ ] Player loads and plays tracks
- [ ] Admin can manage queue
- [ ] Kiosk can search and request songs
- [ ] Error monitoring enabled
- [ ] Backup strategy in place

---

## Current Production Status

**Live URLs:**
- Landing: https://www.djamms.app
- Auth: https://www.djamms.app/auth
- Dashboard: https://www.djamms.app/dashboard/:userId
- Player: https://www.djamms.app/player/:venueId
- Admin: https://www.djamms.app/admin/:venueId
- Kiosk: https://www.djamms.app/kiosk/:venueId

**Last Deployment:** October 16, 2025  
**Commit:** a0f66fd (magic link fix)  
**Status:** ✅ Production Ready

---

## Rollback Procedure

If deployment fails:

```bash
# AppWrite preserves previous deployments
# In Console → Sites → Deployments:
# 1. Find previous working deployment
# 2. Click "Activate"
# 3. Previous version goes live immediately

# For functions:
cd functions/appwrite
git checkout <previous_commit>
npx appwrite push function --function-id <id>
```

---

## Next Steps

- **[Configuration Guide](./CONFIGURATION.md)** - Advanced settings
- **[Architecture](../architecture/ARCHITECTURE.md)** - System design
- **[Monitoring Guide](../../MONITORING_AND_LAUNCH_GUIDE.md)** - Operations

---

**Last Updated:** October 16, 2025  
**Maintained By:** SystemVirtue
