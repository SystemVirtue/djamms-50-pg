# Authentication Deployment Checklist

**Start Time**: ___________  
**Completed**: ___________  
**Deployed By**: ___________

---

## Pre-Deployment Checklist

- [ ] Code committed to Git (commit: `cbff5ad`)
- [ ] All tests passing locally
- [ ] Documentation complete
- [ ] Backup plan ready

---

## Step 1: Deploy Cloud Functions (10 minutes)

### Option A: Using Deployment Script (Recommended)

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
./deploy-auth-functions.sh
```

### Option B: Manual Deployment

#### 1.1: Deploy validateAndSendMagicLink

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# Create function
appwrite functions create \
  --functionId "validateAndSendMagicLink" \
  --name "Validate and Send Magic Link" \
  --runtime "node-18.0" \
  --execute "any" \
  --timeout 15 \
  --enabled true

# Deploy code
appwrite functions createDeployment \
  --functionId "validateAndSendMagicLink" \
  --code "./src/validateAndSendMagicLink" \
  --activate true
```

**Status**: [ ] Complete

#### 1.2: Deploy setupUserProfile

```bash
# Create function
appwrite functions create \
  --functionId "setupUserProfile" \
  --name "Setup User Profile" \
  --runtime "node-18.0" \
  --execute "any" \
  --timeout 15 \
  --enabled true

# Deploy code
appwrite functions createDeployment \
  --functionId "setupUserProfile" \
  --code "./src/setupUserProfile" \
  --activate true
```

**Status**: [ ] Complete

---

## Step 2: Set Environment Variables (5 minutes)

### 2.1: Create Server API Key

1. [ ] Go to AppWrite Console: https://cloud.appwrite.io/console
2. [ ] Navigate to: **Project Settings** → **API Keys**
3. [ ] Click **"Create API Key"**
4. [ ] Name: `auth-functions-server-key`
5. [ ] Scopes:
   - [ ] `users.read`
   - [ ] `databases.write`
6. [ ] Expiration: Never (or 1 year)
7. [ ] **Copy the API key** (you won't see it again!)

**API Key**: `____________________________________`

### 2.2: Set Function Environment Variables

For **BOTH** functions (`validateAndSendMagicLink` AND `setupUserProfile`):

1. [ ] Go to: https://cloud.appwrite.io/console/project-YOUR_PROJECT/functions
2. [ ] Click on **validateAndSendMagicLink**
3. [ ] Go to **Settings** tab
4. [ ] Click **"Variables"**
5. [ ] Add these variables:

| Key | Value | Status |
|-----|-------|--------|
| `APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` | [ ] |
| `APPWRITE_PROJECT_ID` | `<your-project-id>` | [ ] |
| `APPWRITE_API_KEY` | `<api-key-from-step-2.1>` | [ ] |
| `APPWRITE_DATABASE_ID` | `main-db` | [ ] |
| `FRONTEND_URL` | `https://djamms.app` | [ ] |

6. [ ] Repeat for **setupUserProfile** function

---

## Step 3: Update Frontend Environment Variables (5 minutes)

### 3.1: Get Function URLs

Function URLs format:
```
https://cloud.appwrite.io/v1/functions/<functionId>/executions
```

**validateAndSendMagicLink URL**:
```
https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions
```

**setupUserProfile URL**:
```
https://cloud.appwrite.io/v1/functions/setupUserProfile/executions
```

### 3.2: Update apps/web/.env

Create or update: `/Users/mikeclarkin/DJAMMS_50_page_prompt/apps/web/.env`

```bash
# Existing variables (keep these)
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<your-project-id>

# NEW: Add these authentication function URLs
VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK=https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions
VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE=https://cloud.appwrite.io/v1/functions/setupUserProfile/executions
```

**Status**: [ ] Complete

### 3.3: Update Production Environment Variables

If deploying to AppWrite Sites:

1. [ ] Go to: https://cloud.appwrite.io/console/project-YOUR_PROJECT/sites
2. [ ] Click on your site (djamms-unified)
3. [ ] Go to **Settings** → **Environment Variables**
4. [ ] Add:
   - `VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK`
   - `VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE`

---

## Step 4: Add venueId Field to Database (5 minutes)

### 4.1: Using AppWrite Console (Recommended)

1. [ ] Go to: https://cloud.appwrite.io/console/project-YOUR_PROJECT/databases
2. [ ] Select database: **main-db**
3. [ ] Select collection: **users**
4. [ ] Click **"Add Attribute"**
5. [ ] Attribute settings:
   - **Key**: `venueId`
   - **Type**: String
   - **Size**: 255
   - **Required**: Yes ✅
   - **Default**: (leave empty)
   - **Array**: No
6. [ ] Click **"Create"**
7. [ ] Wait for attribute to be available (~30 seconds)

### 4.2: Create Unique Index

1. [ ] In **users** collection, go to **Indexes** tab
2. [ ] Click **"Create Index"**
3. [ ] Index settings:
   - **Key**: `venueId_unique`
   - **Type**: Unique
   - **Attributes**: `venueId`
4. [ ] Click **"Create"**

**Status**: [ ] Complete

### 4.3: Using CLI (Alternative)

```bash
# Add venueId attribute
appwrite databases createStringAttribute \
  --databaseId "main-db" \
  --collectionId "users" \
  --key "venueId" \
  --size 255 \
  --required true

# Wait 30 seconds for attribute to be ready
sleep 30

# Create unique index
appwrite databases createIndex \
  --databaseId "main-db" \
  --collectionId "users" \
  --key "venueId_unique" \
  --type "unique" \
  --attributes "venueId"
```

---

## Step 5: Test Authentication Flow (15 minutes)

### 5.1: Test Unregistered Email ❌

1. [ ] Visit: https://djamms.app/login
2. [ ] Enter email: `fake-test-user@notreal.com`
3. [ ] Click **"Send Magic Link"**
4. [ ] **Expected**: Alert popup with "Email is not registered - please enter a valid email address!"
5. [ ] **Expected**: Error message displayed below form
6. [ ] **Expected**: NO email sent

**Result**: [ ] Pass [ ] Fail

**Notes**: _______________________________________________

### 5.2: Test Registered User (Existing Profile) ✅

Prerequisites:
- [ ] Have existing user in Auth with email: `test@djamms.app`
- [ ] User already has profile in `users` collection

Steps:
1. [ ] Visit: https://djamms.app/login
2. [ ] Enter email: `test@djamms.app`
3. [ ] Click **"Send Magic Link"**
4. [ ] **Expected**: "Check your email!" success message
5. [ ] Check email inbox
6. [ ] Click magic link
7. [ ] **Expected**: Redirect to `/dashboard/<userId>`
8. [ ] **Expected**: NO venue setup screen

**Result**: [ ] Pass [ ] Fail

**Notes**: _______________________________________________

### 5.3: Test Registered User (First Login - New Profile) 🆕

Prerequisites:
- [ ] Create new user in AppWrite Auth console
- [ ] Email: `newuser-test@djamms.app`
- [ ] User does NOT have profile in `users` collection yet

Steps:
1. [ ] Visit: https://djamms.app/login
2. [ ] Enter email: `newuser-test@djamms.app`
3. [ ] Click **"Send Magic Link"**
4. [ ] **Expected**: "Check your email!" success message
5. [ ] Check email inbox
6. [ ] Click magic link
7. [ ] **Expected**: Venue setup screen appears
8. [ ] **Expected**: Input field: "Venue ID (unique name for your venue)"
9. [ ] Enter venue ID: `test-venue-$(date +%s)`
10. [ ] Click **"Continue to Dashboard"**
11. [ ] **Expected**: Profile created in `users` collection
12. [ ] **Expected**: Redirect to dashboard
13. [ ] Verify in AppWrite Console:
    - [ ] User profile exists in `users` collection
    - [ ] `email` field matches
    - [ ] `venueId` field matches entered value
    - [ ] `userId` field matches Auth user ID

**Result**: [ ] Pass [ ] Fail

**Venue ID Used**: _______________________

**Notes**: _______________________________________________

### 5.4: Test Duplicate Venue ID ⚠️

Prerequisites:
- [ ] Have existing venue ID: `existing-venue-001` in database

Steps:
1. [ ] Create another new user in Auth: `newuser2-test@djamms.app`
2. [ ] Go through login flow (Steps 1-8 from 5.3)
3. [ ] Enter venue ID: `existing-venue-001` (duplicate)
4. [ ] Click **"Continue to Dashboard"**
5. [ ] **Expected**: Alert: "This Venue ID is already taken. Please choose another one."
6. [ ] **Expected**: Stay on venue setup screen
7. [ ] Enter unique venue ID: `unique-venue-$(date +%s)`
8. [ ] Click **"Continue to Dashboard"**
9. [ ] **Expected**: Success, redirect to dashboard

**Result**: [ ] Pass [ ] Fail

**Notes**: _______________________________________________

### 5.5: Test Rate Limiting 🚫

1. [ ] Visit: https://djamms.app/login
2. [ ] Send 6 magic link requests within 1 minute (use any valid email)
3. [ ] **Expected**: After 5th request: "Too many attempts. Please try again in a few minutes."
4. [ ] Wait 15 minutes
5. [ ] Try again
6. [ ] **Expected**: Works normally

**Result**: [ ] Pass [ ] Fail

**Notes**: _______________________________________________

---

## Step 6: Deploy Frontend (5 minutes)

### 6.1: Build Frontend

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/apps/web
npm run build
```

**Status**: [ ] Complete

**Build Output**:
```
dist/index.html           _____ kB
dist/assets/index-xxx.css _____ kB
dist/assets/index-xxx.js  _____ kB
```

### 6.2: Commit Environment Variables

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

# Add .env to .gitignore if not already there
echo "apps/web/.env" >> .gitignore

# Commit gitignore update
git add .gitignore
git commit -m "chore: Add .env to gitignore"

# Commit deployment scripts
git add deploy-auth-functions.sh
git add functions/appwrite/src/validateAndSendMagicLink/package.json
git add functions/appwrite/src/setupUserProfile/package.json
git commit -m "chore: Add deployment scripts for auth functions"
git push origin main
```

**Status**: [ ] Complete

### 6.3: Deploy to Production

AppWrite Sites will auto-deploy when you push to main.

Monitor deployment:
1. [ ] Go to: https://cloud.appwrite.io/console/project-YOUR_PROJECT/sites
2. [ ] Check latest deployment status
3. [ ] Wait for "Ready" status

**Deployment ID**: _______________________

**Status**: [ ] Complete

---

## Step 7: Post-Deployment Verification (5 minutes)

### 7.1: Check Cloud Functions

1. [ ] Go to: https://cloud.appwrite.io/console/project-YOUR_PROJECT/functions
2. [ ] Check **validateAndSendMagicLink**:
   - [ ] Status: Active
   - [ ] Latest execution: Success
3. [ ] Check **setupUserProfile**:
   - [ ] Status: Active
   - [ ] Latest execution: Success

### 7.2: Check Database Schema

1. [ ] Go to: https://cloud.appwrite.io/console/project-YOUR_PROJECT/databases
2. [ ] Select: **main-db** → **users** collection
3. [ ] Verify attributes:
   - [ ] `venueId` (String, 255, Required)
4. [ ] Verify indexes:
   - [ ] `venueId_unique` (Unique, venueId)

### 7.3: Check Function Logs

1. [ ] Go to each function's **Executions** tab
2. [ ] Check recent executions for errors
3. [ ] Verify successful test runs

**Status**: [ ] Complete

---

## Step 8: Monitor (24 hours)

### 8.1: Set Up Monitoring

- [ ] Enable email notifications for function errors
- [ ] Check function execution logs daily
- [ ] Monitor user creation rate

### 8.2: Things to Watch

- [ ] **Error Rate**: Should be < 5%
- [ ] **Response Time**: Should be < 2 seconds
- [ ] **Failed Logins**: Look for patterns
- [ ] **Duplicate Venue IDs**: Should be rejected

---

## Rollback Plan (If Needed)

If critical issues occur:

### Immediate Rollback (Frontend Only)

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

# Revert to previous working version
git revert cbff5ad  # Revert auth implementation
git push origin main

# Wait for auto-deploy
```

### Disable Functions (If Needed)

1. [ ] Go to AppWrite Console
2. [ ] For each function, toggle **"Enabled"** to OFF
3. [ ] Old auth flow resumes automatically

### Notes on Rollback

- ✅ No data loss (existing users/profiles unaffected)
- ✅ New users created during deployment remain valid
- ✅ Functions can be re-enabled anytime

---

## Completion Checklist

- [ ] All functions deployed and active
- [ ] Environment variables set correctly
- [ ] Database schema updated
- [ ] All test scenarios passing
- [ ] Frontend deployed with new .env
- [ ] Monitoring enabled
- [ ] Documentation updated
- [ ] Team notified

---

## Sign-Off

**Deployed By**: _______________________________________________

**Date**: _______________________________________________

**Time**: _______________________________________________

**Status**: [ ] Success [ ] Partial [ ] Failed

**Issues Encountered**: _______________________________________________

_______________________________________________

_______________________________________________

**Resolution**: _______________________________________________

_______________________________________________

_______________________________________________

---

## Next Steps

After successful deployment:

1. [ ] Monitor for 24 hours
2. [ ] Update user documentation
3. [ ] Train support team on new flow
4. [ ] Implement Phase 2: Dashboard tabs
5. [ ] Schedule review meeting

---

**Reference Documents**:
- Full Implementation Guide: `NEW_AUTH_FLOW_IMPLEMENTATION.md`
- Quick Summary: `AUTH_MODIFICATION_SUMMARY.md`
- Deployment Script: `deploy-auth-functions.sh`

