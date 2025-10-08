# Step 3: AppWrite Functions Deployment Guide

**Status:** ⚠️ FUNCTIONS NOT DEPLOYED - DEPLOYMENT REQUIRED  
**Priority:** 🔴 CRITICAL - Required for all backend features

---

## 🎯 Overview

Your DJAMMS system has **5 cloud functions** that need to be deployed to AppWrite. These functions provide all backend functionality including authentication, player management, and queue operations.

**Current Status:**
- ✅ AppWrite CLI installed: `/usr/local/bin/appwrite`
- ✅ AppWrite CLI authenticated (session active)
- ✅ Database configured (ID: `68e57de9003234a84cae`)
- ✅ Function code ready in `functions/appwrite/src/`
- ⚠️ Project not initialized in functions directory
- ❌ Functions not deployed

---

## 📦 Functions to Deploy

### 1. magic-link.js 🔐
**Purpose:** Passwordless authentication  
**Endpoints:**
- `POST /` - Send magic link email
- `POST /callback` - Validate magic link and generate JWT

**Required Variables:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
JWT_SECRET=your_jwt_secret
APPWRITE_DATABASE_ID=68e57de9003234a84cae
```

**Dependencies:**
- `appwrite`
- `jsonwebtoken`
- `nodemailer` (for email sending)

---

### 2. player-registry.js 🎵
**Purpose:** Master player management  
**Endpoints:**
- `POST /request` - Request master player status
- `POST /heartbeat` - Update player heartbeat
- `POST /check` - Check if master exists
- `POST /release` - Release master status

**Required Variables:**
```bash
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=your_api_key
```

**Logic:**
- Master expires after 2 minutes without heartbeat
- Only one master per venue
- Device fingerprinting for conflict resolution

---

### 3. processRequest.js 💳
**Purpose:** Handle paid song requests (priority queue)  
**Endpoints:**
- `POST /` - Process Stripe payment and add to priority queue

**Required Variables:**
```bash
STRIPE_SECRET_KEY=sk_test_...
APPWRITE_DATABASE_ID=68e57de9003234a84cae
```

**Features:**
- Stripe payment processing
- Priority queue insertion
- Real-time queue update notifications

---

### 4. addSongToPlaylist.js 📝
**Purpose:** Playlist management  
**Endpoints:**
- `POST /` - Add song to venue playlist

**Required Variables:**
```bash
APPWRITE_DATABASE_ID=68e57de9003234a84cae
YOUTUBE_API_KEY=your_youtube_api_key (optional)
```

**Features:**
- YouTube metadata fetching
- Playlist update
- Duplicate detection

---

### 5. nightlyBatch.js 🌙
**Purpose:** Cleanup and maintenance  
**Schedule:** Runs at 2:00 AM daily

**Tasks:**
- Expire old magic links
- Clean up stale player registrations
- Archive old logs
- Database optimization

**Required Variables:**
```bash
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=your_api_key
```

---

## 🚀 Deployment Steps

### Step 1: Initialize AppWrite Project

```bash
# Navigate to functions directory
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# Initialize project (if not already done)
appwrite init project

# Select your project from the list
# This creates appwrite.json configuration file
```

**Expected Output:**
```
? Select a project: 
  ❯ DJAMMS Production (your-project-id)
    Create a new project
```

---

### Step 2: Review Function Configuration

Check if `appwrite.json` exists:

```bash
cat appwrite.json
```

**Expected Structure:**
```json
{
  "projectId": "your-project-id",
  "projectName": "DJAMMS Production",
  "functions": [
    {
      "$id": "magic-link",
      "name": "Magic Link Authentication",
      "runtime": "node-18.0",
      "entrypoint": "src/magic-link.js",
      "execute": ["any"],
      "events": [],
      "schedule": "",
      "timeout": 30,
      "enabled": true
    },
    {
      "$id": "player-registry",
      "name": "Player Registry",
      "runtime": "node-18.0",
      "entrypoint": "src/player-registry.js",
      "execute": ["any"],
      "events": [],
      "schedule": "",
      "timeout": 30,
      "enabled": true
    },
    {
      "$id": "processRequest",
      "name": "Process Song Request",
      "runtime": "node-18.0",
      "entrypoint": "src/processRequest.js",
      "execute": ["any"],
      "events": [],
      "schedule": "",
      "timeout": 30,
      "enabled": true
    },
    {
      "$id": "addSongToPlaylist",
      "name": "Add Song to Playlist",
      "runtime": "node-18.0",
      "entrypoint": "src/addSongToPlaylist.js",
      "execute": ["any"],
      "events": [],
      "schedule": "",
      "timeout": 30,
      "enabled": true
    },
    {
      "$id": "nightlyBatch",
      "name": "Nightly Maintenance",
      "runtime": "node-18.0",
      "entrypoint": "src/nightlyBatch.js",
      "execute": ["any"],
      "events": [],
      "schedule": "0 2 * * *",
      "timeout": 300,
      "enabled": true
    }
  ]
}
```

---

### Step 3: Create appwrite.json (If Missing)

If `appwrite.json` doesn't exist, create it:

```bash
cat > appwrite.json << 'EOF'
{
  "projectId": "YOUR_PROJECT_ID_HERE",
  "projectName": "DJAMMS Production",
  "functions": []
}
EOF
```

Replace `YOUR_PROJECT_ID_HERE` with your actual project ID from `.env` file.

---

### Step 4: Deploy Individual Functions

#### Option A: Deploy All Functions at Once

```bash
# Deploy all functions defined in appwrite.json
appwrite deploy function

# Follow prompts for each function
```

#### Option B: Deploy One Function at a Time

```bash
# Deploy magic-link function
appwrite functions createDeployment \
  --functionId magic-link \
  --entrypoint src/magic-link.js \
  --code . \
  --activate true

# Deploy player-registry
appwrite functions createDeployment \
  --functionId player-registry \
  --entrypoint src/player-registry.js \
  --code . \
  --activate true

# Deploy processRequest
appwrite functions createDeployment \
  --functionId processRequest \
  --entrypoint src/processRequest.js \
  --code . \
  --activate true

# Deploy addSongToPlaylist
appwrite functions createDeployment \
  --functionId addSongToPlaylist \
  --entrypoint src/addSongToPlaylist.js \
  --code . \
  --activate true

# Deploy nightlyBatch
appwrite functions createDeployment \
  --functionId nightlyBatch \
  --entrypoint src/nightlyBatch.js \
  --code . \
  --activate true
```

#### Option C: Create Functions First (If Not Created)

```bash
# Create magic-link function
appwrite functions create \
  --functionId magic-link \
  --name "Magic Link Authentication" \
  --runtime "node-18.0" \
  --execute "any" \
  --entrypoint "src/magic-link.js" \
  --timeout 30

# Then deploy with Option B commands
```

---

### Step 5: Configure Environment Variables

**In AppWrite Console:**

1. Go to https://cloud.appwrite.io/console
2. Select your project
3. Navigate to Functions
4. For each function, click → Settings → Variables
5. Add required variables:

#### magic-link function:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxx
JWT_SECRET=[copy from your .env file]
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your project ID]
APPWRITE_API_KEY=[your API key]
```

#### player-registry function:
```
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your project ID]
APPWRITE_API_KEY=[your API key]
```

#### processRequest function:
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your project ID]
APPWRITE_API_KEY=[your API key]
```

#### addSongToPlaylist function:
```
YOUTUBE_API_KEY=[optional]
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your project ID]
APPWRITE_API_KEY=[your API key]
```

#### nightlyBatch function:
```
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your project ID]
APPWRITE_API_KEY=[your API key]
```

---

### Step 6: Verify Deployment

```bash
# List all functions
appwrite functions list

# Check specific function details
appwrite functions get --functionId magic-link

# View function deployments
appwrite functions listDeployments --functionId magic-link

# View function executions (logs)
appwrite functions listExecutions --functionId magic-link --limit 10
```

**Expected Output:**
```
┌────────────────┬──────────────────────────────┬─────────┬────────┐
│ ID             │ Name                         │ Runtime │ Status │
├────────────────┼──────────────────────────────┼─────────┼────────┤
│ magic-link     │ Magic Link Authentication    │ node-18 │ ready  │
│ player-registry│ Player Registry              │ node-18 │ ready  │
│ processRequest │ Process Song Request         │ node-18 │ ready  │
│ addSongToPlaylist│ Add Song to Playlist       │ node-18 │ ready  │
│ nightlyBatch   │ Nightly Maintenance          │ node-18 │ ready  │
└────────────────┴──────────────────────────────┴─────────┴────────┘
```

---

## 🧪 Testing Deployed Functions

### Test Magic Link Function

```bash
# Using curl
curl -X POST https://syd.cloud.appwrite.io/v1/functions/magic-link/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -d '{"email": "test@example.com", "redirectUrl": "http://localhost:3002/auth/callback"}'

# Or test via auth app
# Open: http://localhost:3002/auth/login
# Enter email and submit
# Check function logs in AppWrite console
```

### Test Player Registry Function

```bash
# Request master status
curl -X POST https://syd.cloud.appwrite.io/v1/functions/player-registry/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -d '{
    "action": "request",
    "venueId": "venue1",
    "deviceId": "test-device-123",
    "token": "test-jwt-token"
  }'
```

### Monitor Function Logs

```bash
# Real-time logs (in AppWrite Console)
# Functions → [function name] → Executions → View logs

# Or via CLI
appwrite functions listExecutions \
  --functionId magic-link \
  --limit 20 \
  --orderType DESC
```

---

## 📊 Deployment Checklist

### Pre-Deployment:
- [x] AppWrite CLI installed
- [x] AppWrite CLI authenticated
- [x] Database created and verified
- [x] Function code ready in `functions/appwrite/src/`
- [ ] `appwrite.json` configured
- [ ] Environment variables prepared

### Deployment:
- [ ] Initialize project (`appwrite init project`)
- [ ] Deploy magic-link function
- [ ] Deploy player-registry function
- [ ] Deploy processRequest function
- [ ] Deploy addSongToPlaylist function
- [ ] Deploy nightlyBatch function

### Post-Deployment:
- [ ] Configure environment variables in AppWrite Console
- [ ] Test magic-link with curl or auth app
- [ ] Test player-registry with curl or player app
- [ ] Verify function logs for errors
- [ ] Update frontend endpoints if needed
- [ ] Test end-to-end authentication flow
- [ ] Test player registration flow

---

## ⚠️ Common Issues & Solutions

### Issue: "Project not set"
```bash
Error: Project is not set. Please run `appwrite init project`
```
**Solution:** Run `appwrite init project` in `functions/appwrite` directory

---

### Issue: "Function not found"
```bash
Error: Function with ID 'magic-link' not found
```
**Solution:** Create function first:
```bash
appwrite functions create \
  --functionId magic-link \
  --name "Magic Link Authentication" \
  --runtime "node-18.0"
```

---

### Issue: "Build failed"
```bash
Error: Deployment build failed
```
**Solution:** Check `package.json` dependencies:
```bash
cd functions/appwrite
npm install
npm ls  # Check for missing dependencies
```

---

### Issue: "Timeout"
```bash
Error: Function execution timed out
```
**Solution:** Increase timeout in function settings (default 30s):
```bash
appwrite functions update \
  --functionId magic-link \
  --timeout 60
```

---

### Issue: "Missing environment variable"
```bash
Error: SMTP_HOST is not defined
```
**Solution:** Add variables in AppWrite Console:
- Functions → [function] → Settings → Variables → Add Variable

---

## 🎯 What You Can Do After Deployment

### ✅ With Functions Deployed:
1. **Test Authentication**
   - Send magic links
   - Receive emails
   - Complete login flow
   - Generate JWT tokens

2. **Test Player System**
   - Register as master player
   - Send heartbeats
   - Handle conflicts
   - Monitor player status

3. **Test Queue Management**
   - Add songs to queue
   - Process paid requests
   - Update playlists
   - Real-time synchronization

4. **Run E2E Tests**
   - Authentication flow tests
   - Player registration tests
   - Queue operation tests
   - Full integration tests

5. **Production Readiness**
   - Deploy to Vercel/Netlify
   - Configure production domains
   - Enable monitoring
   - Launch! 🚀

---

## 📚 Additional Resources

**AppWrite Documentation:**
- Functions: https://appwrite.io/docs/functions
- CLI: https://appwrite.io/docs/command-line
- Deployments: https://appwrite.io/docs/functions-deployments

**DJAMMS Documentation:**
- README.md - Project overview
- NEXT_STEPS.md - Priority roadmap
- STEP1_AUTH_TEST_RESULTS.md - Auth analysis

**Get Help:**
- AppWrite Discord: https://appwrite.io/discord
- AppWrite GitHub: https://github.com/appwrite/appwrite

---

## 🚀 Quick Start Commands

```bash
# Navigate to functions directory
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# Initialize project (if needed)
appwrite init project

# Deploy all functions
appwrite deploy function

# Check status
appwrite functions list

# View logs
appwrite functions listExecutions --functionId magic-link --limit 10

# Test authentication
open http://localhost:3002/auth/login
```

---

## ✅ Next Steps After Deployment

1. **Test Authentication Flow** (Step 1 revisited)
   - Complete magic link flow
   - Verify JWT generation
   - Test session persistence

2. **Test Player Registration** (Step 2)
   - Register master player
   - Monitor heartbeats
   - Test conflict scenarios

3. **Configure GitHub Secrets** (Step 7)
   - Enable CI/CD
   - Automated testing
   - Production deployment

---

**Status:** Ready to deploy! Follow the steps above to get your functions live! 🎉
