# Authentication Modification - Summary

**Commit**: `e019d6a`  
**Date**: October 15, 2025  
**Status**: ✅ **CODE COMPLETE** - Awaiting Deployment

---

## What Was Implemented

### 🎯 Goal
Only allow users who exist in AppWrite 'Auth' table to receive magic-url links.

### ✅ Solution
Created two Cloud Functions to validate and setup users:

1. **validateAndSendMagicLink** - Checks if email is registered before sending magic link
2. **setupUserProfile** - Creates user profile with venue ID on first login

---

## User Flow

### Scenario 1: Unregistered Email ❌
```
User enters: fake@test.com
    ↓
Backend checks Auth table
    ↓
Email NOT found
    ↓
🚫 Show alert: "Email is not registered - please enter a valid email address!"
    ↓
Redirect back to login page
```

### Scenario 2: Registered User (First Time) ✅
```
User enters: newuser@djamms.app
    ↓
Backend checks Auth table
    ↓
Email FOUND in Auth
    ↓
📧 Send magic link
    ↓
User clicks link
    ↓
Backend checks 'users' collection
    ↓
Profile NOT found
    ↓
🏢 Show popup: "Please enter VenueID (a unique name for your venue)"
    ↓
User enters: "my-awesome-bar"
    ↓
Create user profile:
  - email: "newuser@djamms.app"
  - userId: "auth-user-id"
  - venueId: "my-awesome-bar"
    ↓
✅ Redirect to dashboard
```

### Scenario 3: Registered User (Returning) ✅
```
User enters: existing@djamms.app
    ↓
Backend checks Auth table
    ↓
Email FOUND in Auth
    ↓
📧 Send magic link
    ↓
User clicks link
    ↓
Backend checks 'users' collection
    ↓
Profile FOUND
    ↓
✅ Redirect to dashboard (no venue setup needed)
```

---

## Technical Implementation

### Backend (Cloud Functions)

**Function 1: validateAndSendMagicLink**
- Input: `{ email }`
- Checks: `SELECT * FROM auth WHERE email = ?`
- If found: Send magic link
- If not: Return `USER_NOT_REGISTERED` error

**Function 2: setupUserProfile**
- Input: `{ userId, venueId? }`
- Checks: `SELECT * FROM users WHERE email = ?`
- If no profile + no venueId: Return `requiresVenueSetup = true`
- If no profile + venueId: Create profile with venue ID
- If profile exists: Return existing profile

### Frontend

**Login Page** (`apps/web/src/routes/auth/Login.tsx`):
```typescript
// OLD:
await account.createMagicURLToken(email);

// NEW:
const response = await fetch(VALIDATE_FUNCTION_URL, {
  body: JSON.stringify({ email })
});

if (response.error === 'USER_NOT_REGISTERED') {
  alert('Email is not registered!');
}
```

**Callback Page** (`apps/web/src/routes/auth/Callback.tsx`):
```typescript
// After magic link verification:
const profile = await fetch(SETUP_PROFILE_URL, {
  body: JSON.stringify({ userId })
});

if (profile.requiresVenueSetup) {
  showVenueSetupUI();
} else {
  redirectToDashboard();
}
```

---

## Database Changes

### `users` Collection - New Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `email` | string | ✅ | ✅ | User's email (from Auth) |
| `userId` | string | ✅ | ✅ | AppWrite Auth user ID |
| `venueId` | string | ✅ | ✅ | Unique venue identifier |
| `displayName` | string | ❌ | ❌ | Optional display name |
| `role` | string | ✅ | ❌ | User role (owner/staff) |
| `createdAt` | datetime | ✅ | ❌ | Profile creation time |
| `updatedAt` | datetime | ✅ | ❌ | Last update time |

---

## Deployment Checklist

### ⏳ Step 1: Deploy Cloud Functions

```bash
cd functions/appwrite

# Deploy Function 1
appwrite functions create \
  --functionId validateAndSendMagicLink \
  --name "Validate and Send Magic Link" \
  --runtime node-18.0 \
  --execute role:all

appwrite functions createDeployment \
  --functionId validateAndSendMagicLink \
  --code ./src/validateAndSendMagicLink \
  --activate true

# Deploy Function 2
appwrite functions create \
  --functionId setupUserProfile \
  --name "Setup User Profile" \
  --runtime node-18.0 \
  --execute role:all

appwrite functions createDeployment \
  --functionId setupUserProfile \
  --code ./src/setupUserProfile \
  --activate true
```

### ⏳ Step 2: Set Environment Variables

**Backend (AppWrite Functions)**:
```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-server-api-key
APPWRITE_DATABASE_ID=main-db
FRONTEND_URL=https://djamms.app
```

**Frontend (apps/web/.env)**:
```bash
VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK=https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions
VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE=https://cloud.appwrite.io/v1/functions/setupUserProfile/executions
```

### ⏳ Step 3: Update Database Schema

```bash
# Add venueId attribute to users collection
appwrite databases createStringAttribute \
  --databaseId main-db \
  --collectionId users \
  --key venueId \
  --size 255 \
  --required true

# Create unique index
appwrite databases createIndex \
  --databaseId main-db \
  --collectionId users \
  --key venueId_unique \
  --type unique \
  --attributes venueId
```

### ⏳ Step 4: Deploy Frontend

```bash
cd apps/web
npm run build
git push origin main
```

### ⏳ Step 5: Test All Scenarios

- [ ] Test unregistered email (should show error)
- [ ] Test registered email + first login (should prompt for venue)
- [ ] Test registered email + existing profile (should redirect directly)
- [ ] Test duplicate venue ID (should show error + allow retry)
- [ ] Test rate limiting (5 requests per 15 min)

---

## Testing Commands

```bash
# Test 1: Unregistered Email
curl -X POST https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions \
  -H "Content-Type: application/json" \
  -d '{"email": "fake@test.com"}'

# Expected: {"success": false, "error": "USER_NOT_REGISTERED"}

# Test 2: Registered Email
curl -X POST https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions \
  -H "Content-Type: application/json" \
  -d '{"email": "real@djamms.app"}'

# Expected: {"success": true, "message": "Magic link sent!"}

# Test 3: Check Profile (New User)
curl -X POST https://cloud.appwrite.io/v1/functions/setupUserProfile/executions \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'

# Expected: {"success": true, "requiresVenueSetup": true}

# Test 4: Create Profile
curl -X POST https://cloud.appwrite.io/v1/functions/setupUserProfile/executions \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here", "venueId": "test-venue"}'

# Expected: {"success": true, "profileCreated": true}
```

---

## Security Features

✅ **Email Validation**: Only registered Auth users receive magic links  
✅ **Rate Limiting**: 5 magic link requests per 15 minutes per email  
✅ **Unique Venues**: Venue IDs enforced as unique (no duplicates)  
✅ **Input Validation**: Email format + venue ID format validated  
✅ **Error Messages**: Clear, user-friendly error messages  

---

## Rollback Plan

If issues occur:

1. **Disable new auth flow** (frontend only):
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Old flow resumes** automatically (Cloud Functions ignored)

3. **No data loss** - All existing users/profiles unaffected

---

## Documentation

📖 **Full Guide**: `NEW_AUTH_FLOW_IMPLEMENTATION.md` (500+ lines)  
📖 **Cloud Functions**: `functions/appwrite/src/validateAndSendMagicLink/main.js`  
📖 **Cloud Functions**: `functions/appwrite/src/setupUserProfile/main.js`  
📖 **Frontend Changes**: `apps/web/src/routes/auth/Login.tsx`, `Callback.tsx`

---

## Status

**Code**: ✅ Complete  
**Committed**: ✅ Commit `e019d6a`  
**Deployment**: ⏳ Awaiting manual deployment of Cloud Functions  
**Testing**: ⏳ Awaiting post-deployment testing

---

## Next Steps

1. Deploy Cloud Functions to AppWrite (estimated: 10 minutes)
2. Update environment variables (estimated: 5 minutes)
3. Test all 5 scenarios (estimated: 15 minutes)
4. Monitor for errors (24 hours)
5. Document any edge cases

**Total Deployment Time**: ~30 minutes

---

## Questions?

See `NEW_AUTH_FLOW_IMPLEMENTATION.md` for:
- Detailed flow diagrams
- Complete API reference
- Error handling guide
- Database schema details
- Security considerations

