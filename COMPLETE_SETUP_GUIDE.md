# Complete AppWrite Functions Setup Guide

**Date:** October 8, 2025  
**Status:** 2/5 Functions Deployed & Working ✅

---

## ✅ Already Completed

### 1. Magic-Link Function (Authentication) - WORKING ✅
- **Function ID:** `68e5a317003c42c8bb6a`
- **Status:** Deployed and tested successfully
- **Test Result:** Creates magic links and returns tokens
- **Environment Variables:** All 5 configured

### 2. Player-Registry Function (Master Player) - DEPLOYED ✅
- **Function ID:** `68e5a41f00222cab705b`
- **Status:** Deployed with environment variables
- **Next:** Needs code update to use node-appwrite SDK

---

## 🔧 Manual Steps Required (Quick Reference)

### Step 1: Update Player-Registry Function Code

The player-registry function needs to be updated to use `node-appwrite` SDK and Cloud Functions v5 format.

**Commands:**
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite/functions/player-registry

# Update package.json to remove "type": "module"
# Update src/main.js to use Cloud Functions v5 format
# Change require('appwrite') to require('node-appwrite')
# Install node-appwrite
npm uninstall appwrite
npm install node-appwrite

# Redeploy
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite
appwrite push function --function-id 68e5a41f00222cab705b
```

---

### Step 2: Deploy Remaining Functions (Optional)

These functions are **optional** for basic testing but recommended for full functionality:

#### A. addSongToPlaylist Function
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# Initialize function
appwrite init function
# Name: addSongToPlaylist
# ID: unique()
# Runtime: Node.js 18.0
# Specification: 0.5 CPU, 512MB RAM

# Copy source code
cp src/addSongToPlaylist.js functions/addSongToPlaylist/src/main.js

# Update package.json (remove "type": "module")
# Update imports to use node-appwrite
# Install dependencies
cd functions/addSongToPlaylist
npm install node-appwrite
cd ../..

# Get function ID and deploy
FUNC_ID=$(python3 -c "import json; config=json.load(open('appwrite.config.json')); funcs=[f for f in config.get('functions',[]) if f.get('name')=='addSongToPlaylist']; print(funcs[0].get('\$id') if funcs else 'Not found')")
appwrite push function --function-id $FUNC_ID

# Add environment variables
appwrite functions create-variable --function-id $FUNC_ID --key "APPWRITE_ENDPOINT" --value "https://syd.cloud.appwrite.io/v1"
appwrite functions create-variable --function-id $FUNC_ID --key "APPWRITE_PROJECT_ID" --value "68cc86c3002b27e13947"
appwrite functions create-variable --function-id $FUNC_ID --key "APPWRITE_DATABASE_ID" --value "68e57de9003234a84cae"
appwrite functions create-variable --function-id $FUNC_ID --key "APPWRITE_API_KEY" --value "your_api_key"
```

#### B. processRequest Function (for paid requests)
```bash
# Same process as addSongToPlaylist
# Additional variable: STRIPE_SECRET_KEY (if using Stripe)
```

---

## 🧪 Testing Functions

### Test Magic-Link (Authentication)
```bash
# Create magic link
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{"body":"{\"action\":\"create\",\"email\":\"test@djamms.app\"}"}'

# Verify magic link and get JWT
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{"body":"{\"action\":\"callback\",\"email\":\"test@djamms.app\",\"token\":\"TOKEN_FROM_CREATE\"}"}'
```

### Test Player-Registry
```bash
# After getting JWT token from magic-link:
curl -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a41f00222cab705b/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"body":"{\"action\":\"register\",\"venueId\":\"venue1\",\"deviceId\":\"test-device\"}"}'
```

---

## 📝 Key Learnings from Deployment

### Critical Requirements:
1. ✅ Use `node-appwrite` NOT `appwrite` (server SDK vs browser SDK)
2. ✅ Remove `"type": "module"` from package.json (use CommonJS)
3. ✅ Cloud Functions v5 format: `module.exports = async ({ req, res, log, error }) => {}`
4. ✅ Request body via: `req.bodyJson` or `JSON.parse(req.body)`
5. ✅ Environment variables stored as secrets (values not visible in console)

### Common Issues & Solutions:
- **"Identifier 'X' has already been declared"** → Duplicate imports, check file integrity
- **"setKey is not a function"** → Using wrong SDK (appwrite vs node-appwrite)
- **"Unexpected end of JSON input"** → Request body format issue
- **500 errors** → Check execution logs with `appwrite functions get-execution`

---

## 🎯 Next Steps for Full System

### Immediate (Critical for Testing):
1. ✅ **DONE:** Magic-link function working
2. 🔄 **IN PROGRESS:** Update player-registry code format
3. 🔄 **RECOMMENDED:** Test player-registry with JWT token
4. ✅ **READY:** Run E2E tests with real authentication

### Optional (For Full Features):
1. Deploy addSongToPlaylist (playlist management)
2. Deploy processRequest (paid song requests with Stripe)
3. Configure SMTP for magic-link emails (currently returns token in API response)
4. Deploy nightlyBatch (cleanup tasks)

---

## 📊 Deployment Status

| Function | Status | SDK | Env Vars | Tested |
|----------|--------|-----|----------|--------|
| magic-link | ✅ Working | node-appwrite | 5/5 | ✅ Pass |
| player-registry | 🔄 Needs Update | appwrite | 4/4 | ⏳ Pending |
| addSongToPlaylist | ⏳ Ready to Deploy | - | 0/4 | - |
| processRequest | ⏳ Ready to Deploy | - | 0/5 | - |
| nightlyBatch | 📦 Optional | - | 0/4 | - |

**Progress:** 2/5 deployed (40%), 1/5 working (20%)

---

## 🔐 Environment Variables Reference

All functions need these base variables:
```
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68cc86c3002b27e13947
APPWRITE_DATABASE_ID=68e57de9003234a84cae
APPWRITE_API_KEY=standard_25289f...
```

Additional per function:
- **magic-link:** JWT_SECRET
- **processRequest:** STRIPE_SECRET_KEY
- **addSongToPlaylist:** YOUTUBE_API_KEY (optional)

---

## 🚀 Quick Test After Setup

Once player-registry is updated, you can test the full authentication flow:

```bash
# 1. Create magic link
RESPONSE=$(curl -s -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d '{"body":"{\"action\":\"create\",\"email\":\"test@djamms.app\"}"}')

# Extract token from response
TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['responseBody'])" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# 2. Get JWT
JWT_RESPONSE=$(curl -s -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d "{\"body\":\"{\\\"action\\\":\\\"callback\\\",\\\"email\\\":\\\"test@djamms.app\\\",\\\"token\\\":\\\"$TOKEN\\\"}\"}")

# Extract JWT token
JWT=$(echo $JWT_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); body=json.loads(data.get('responseBody','{}')); print(body.get('token',''))")

echo "JWT Token: $JWT"

# 3. Test player registration
curl -s -X POST "https://syd.cloud.appwrite.io/v1/functions/68e5a41f00222cab705b/executions" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 68cc86c3002b27e13947" \
  -d "{\"body\":\"{\\\"action\\\":\\\"register\\\",\\\"venueId\\\":\\\"venue1\\\",\\\"deviceId\\\":\\\"test-device\\\",\\\"userAgent\\\":\\\"Test\\\"}\"}"
```

---

**Last Updated:** October 8, 2025 1:00 PM  
**Next Action:** Update player-registry function code and test
