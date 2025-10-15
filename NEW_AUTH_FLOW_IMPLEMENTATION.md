# New Authentication Flow - Implementation Guide

**Date**: October 15, 2025  
**Status**: 🔄 **IMPLEMENTATION IN PROGRESS**

---

## Overview

Modified authentication to **only allow registered users** to receive magic links, with automatic profile creation on first login.

---

## Flow Changes

### OLD FLOW (Before):
1. User enters any email
2. AppWrite sends magic link (even if email not registered)
3. User clicks link
4. If email not in Auth → Creates new Auth user + sends link

### NEW FLOW (After):
1. User enters email
2. **Backend checks if email exists in AppWrite Auth**
3. If NOT registered → Show error popup, block magic link
4. If registered → Send magic link
5. User clicks link → Verify session
6. **Backend checks if user profile exists in 'users' collection**
7. If NO profile → Prompt for Venue ID, create profile
8. If profile exists → Redirect to dashboard

---

## Architecture

### Cloud Functions Created

#### 1. **validateAndSendMagicLink**
**File**: `functions/appwrite/src/validateAndSendMagicLink/main.js`

**Purpose**: Validate user exists before sending magic link

**Inputs**:
```json
{
  "email": "user@example.com"
}
```

**Outputs**:

Success:
```json
{
  "success": true,
  "message": "Magic link sent! Check your email.",
  "userId": "68e7e9cf9fe2383832cb"
}
```

User Not Registered:
```json
{
  "success": false,
  "error": "USER_NOT_REGISTERED",
  "message": "Email is not registered - please enter a valid email address!"
}
```

Rate Limited:
```json
{
  "success": false,
  "error": "RATE_LIMIT",
  "message": "Too many attempts. Please try again in a few minutes."
}
```

**Database Queries**:
1. `SELECT * FROM auth_users WHERE email = 'user@example.com'`
2. If found: `INSERT INTO tokens {...}` (magic link token)
3. Send email via AppWrite mail service

---

#### 2. **setupUserProfile**
**File**: `functions/appwrite/src/setupUserProfile/main.js`

**Purpose**: Create user profile on first login

**Inputs** (Initial Check):
```json
{
  "userId": "68e7e9cf9fe2383832cb"
}
```

**Outputs** (New User):
```json
{
  "success": true,
  "isNewUser": true,
  "requiresVenueSetup": true,
  "message": "Please enter VenueID (a unique name for your venue)",
  "user": {
    "userId": "68e7e9cf9fe2383832cb",
    "email": "user@example.com"
  }
}
```

**Inputs** (With Venue ID):
```json
{
  "userId": "68e7e9cf9fe2383832cb",
  "venueId": "my-awesome-bar"
}
```

**Outputs** (Profile Created):
```json
{
  "success": true,
  "isNewUser": true,
  "profileCreated": true,
  "user": {
    "userId": "68e7e9cf9fe2383832cb",
    "email": "user@example.com",
    "venueId": "my-awesome-bar",
    "displayName": "",
    "role": "owner"
  }
}
```

**Outputs** (Existing User):
```json
{
  "success": true,
  "isNewUser": false,
  "user": {
    "userId": "68e7e9cf9fe2383832cb",
    "email": "user@example.com",
    "venueId": "existing-venue",
    "displayName": "John Doe",
    "role": "owner"
  }
}
```

**Database Queries**:
1. `SELECT * FROM auth_users WHERE $id = 'userId'` (get email from Auth)
2. `SELECT * FROM users WHERE email = 'user@example.com'` (check profile exists)
3. If no profile: `INSERT INTO users {...}` (create profile with venue ID)

---

### Frontend Changes

#### 1. **Login Page** (`apps/web/src/routes/auth/Login.tsx`)

**Changed**: Now calls Cloud Function instead of direct AppWrite SDK

**Before**:
```typescript
await account.createMagicURLToken(
  'unique()',
  email,
  redirectUrl
);
```

**After**:
```typescript
const response = await fetch(VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK, {
  method: 'POST',
  body: JSON.stringify({ email })
});

const data = await response.json();

if (data.error === 'USER_NOT_REGISTERED') {
  alert('Email is not registered - please enter a valid email address!');
  setError('This email is not registered. Please contact your administrator.');
}
```

---

#### 2. **Auth Callback** (`apps/web/src/routes/auth/Callback.tsx`)

**Changed**: Now checks for user profile and prompts for Venue ID

**New States**:
- `'verifying'` - Checking magic link
- `'setup'` - **NEW** - Prompting for Venue ID
- `'success'` - Authenticated, redirecting
- `'error'` - Authentication failed

**New UI - Venue Setup**:
```tsx
if (status === 'setup') {
  return (
    <div className="venue-setup-modal">
      <h2>Welcome to DJAMMS!</h2>
      <label>Venue ID (unique name for your venue)</label>
      <input 
        value={venueId}
        onChange={(e) => setVenueId(e.target.value)}
        placeholder="e.g., my-awesome-bar"
      />
      <button onClick={handleVenueSetup}>
        Continue to Dashboard
      </button>
    </div>
  );
}
```

**Flow**:
1. Magic link verified → Session created
2. Call `setupUserProfile` function
3. If `requiresVenueSetup === true` → Show venue input
4. User enters venue ID → Call `setupUserProfile` again with venue ID
5. Profile created → Redirect to dashboard

---

## Environment Variables Required

### Backend (AppWrite Functions)

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-server-api-key  # Needs users.read permission
APPWRITE_DATABASE_ID=main-db
FRONTEND_URL=https://djamms.app
```

### Frontend (apps/web/.env)

```bash
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK=https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions
VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE=https://cloud.appwrite.io/v1/functions/setupUserProfile/executions
```

---

## Database Schema Changes

### `users` Collection

**New Required Fields**:
```typescript
{
  $id: string,              // Matches Auth user ID
  email: string,            // From Auth 'identifier'
  userId: string,           // Same as $id
  venueId: string,          // Unique venue identifier
  displayName: string,      // Optional display name
  role: 'owner' | 'staff',  // User role
  createdAt: string,        // ISO 8601 timestamp
  updatedAt: string         // ISO 8601 timestamp
}
```

**Indexes Required**:
- `email` (unique)
- `venueId` (unique)
- `userId` (unique)

---

## Deployment Steps

### 1. Create Cloud Functions in AppWrite

**Function 1: validateAndSendMagicLink**
```bash
cd functions/appwrite
appwrite functions create \
  --functionId validateAndSendMagicLink \
  --name "Validate and Send Magic Link" \
  --runtime node-18.0 \
  --execute role:all \
  --timeout 15

# Upload code
appwrite functions createDeployment \
  --functionId validateAndSendMagicLink \
  --code ./src/validateAndSendMagicLink \
  --activate true
```

**Function 2: setupUserProfile**
```bash
appwrite functions create \
  --functionId setupUserProfile \
  --name "Setup User Profile" \
  --runtime node-18.0 \
  --execute role:all \
  --timeout 15

# Upload code
appwrite functions createDeployment \
  --functionId setupUserProfile \
  --code ./src/setupUserProfile \
  --activate true
```

---

### 2. Update Environment Variables

**Backend**:
```bash
# Set function environment variables
appwrite functions updateVariables \
  --functionId validateAndSendMagicLink \
  --variables APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
              APPWRITE_PROJECT_ID=your-project \
              APPWRITE_API_KEY=your-api-key \
              FRONTEND_URL=https://djamms.app
```

**Frontend**:
```bash
# Update apps/web/.env
echo "VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK=https://cloud.appwrite.io/v1/functions/validateAndSendMagicLink/executions" >> apps/web/.env
echo "VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE=https://cloud.appwrite.io/v1/functions/setupUserProfile/executions" >> apps/web/.env
```

---

### 3. Update `users` Collection Schema

```bash
# Add venueId field (unique)
appwrite databases createStringAttribute \
  --databaseId main-db \
  --collectionId users \
  --key venueId \
  --size 255 \
  --required true

# Create unique index on venueId
appwrite databases createIndex \
  --databaseId main-db \
  --collectionId users \
  --key venueId_unique \
  --type unique \
  --attributes venueId
```

---

### 4. Deploy Frontend

```bash
cd apps/web
npm run build
git add -A
git commit -m "feat: Implement restricted authentication with profile setup"
git push origin main
```

---

## Testing Checklist

### Test Case 1: Unregistered User
1. ✅ Visit https://djamms.app/login
2. ✅ Enter unregistered email: `fake@test.com`
3. ✅ Click "Send Magic Link"
4. ✅ **Expected**: Alert popup: "Email is not registered - please enter a valid email address!"
5. ✅ **Expected**: Error message displayed
6. ✅ **Expected**: NO magic link sent

---

### Test Case 2: Registered User (Existing Profile)
1. ✅ Visit https://djamms.app/login
2. ✅ Enter registered email: `existing@djamms.app`
3. ✅ Click "Send Magic Link"
4. ✅ **Expected**: "Check your email!" success message
5. ✅ Check email inbox
6. ✅ Click magic link
7. ✅ **Expected**: Redirect to `/dashboard/userId` (no venue setup prompt)

---

### Test Case 3: Registered User (New Profile - First Login)
1. ✅ Create new Auth user in AppWrite console
2. ✅ Email: `newuser@djamms.app`
3. ✅ Visit https://djamms.app/login
4. ✅ Enter: `newuser@djamms.app`
5. ✅ Click "Send Magic Link"
6. ✅ **Expected**: "Check your email!" success message
7. ✅ Click magic link in email
8. ✅ **Expected**: Venue setup screen appears
9. ✅ **Expected**: Input field: "Venue ID (unique name for your venue)"
10. ✅ Enter: `test-venue-123`
11. ✅ Click "Continue to Dashboard"
12. ✅ **Expected**: Profile created in `users` collection
13. ✅ **Expected**: Redirect to dashboard

---

### Test Case 4: Duplicate Venue ID
1. ✅ Follow Test Case 3 steps 1-8
2. ✅ Enter existing venue ID: `venue-001`
3. ✅ Click "Continue to Dashboard"
4. ✅ **Expected**: Alert: "This Venue ID is already taken. Please choose another one."
5. ✅ **Expected**: Stay on venue setup screen
6. ✅ Enter unique venue ID: `new-venue-456`
7. ✅ Click "Continue to Dashboard"
8. ✅ **Expected**: Success, redirect to dashboard

---

### Test Case 5: Rate Limiting
1. ✅ Visit https://djamms.app/login
2. ✅ Send 6 magic link requests within 1 minute
3. ✅ **Expected**: After 5 requests: "Too many attempts. Please try again in a few minutes."

---

## Error Handling

| Error | Frontend Display | User Action |
|-------|------------------|-------------|
| **USER_NOT_REGISTERED** | Alert popup + error message | Contact administrator |
| **RATE_LIMIT** | "Too many attempts..." | Wait 15 minutes |
| **VENUE_ID_EXISTS** | Alert: "Venue ID taken..." | Enter different venue ID |
| **PROFILE_CREATION_FAILED** | Alert: "Failed to create profile..." | Try again |
| **INVALID_EMAIL** | "Please enter a valid email" | Fix email format |
| **MAGIC_LINK_FAILED** | "Failed to send magic link..." | Try again |

---

## Security Considerations

### 1. **API Key Permissions**
Server API key must have:
- `users.read` - To check if user exists in Auth
- `databases.write` - To create user profile
- `functions.execute` - To call Cloud Functions

### 2. **Rate Limiting**
- **Magic link requests**: 5 per 15 minutes per email
- **Function executions**: 60 per hour per IP
- **Profile creation**: 1 per user (enforced by unique userId)

### 3. **Input Validation**
- Email: RFC 5322 format validation
- Venue ID: Alphanumeric + hyphens only, 3-255 characters
- User ID: Must match Auth user ID

### 4. **CORS Configuration**
Cloud Functions must allow:
```javascript
{
  "origin": "https://djamms.app",
  "methods": ["POST"],
  "headers": ["Content-Type"]
}
```

---

## Rollback Plan

If issues occur:

### 1. Disable New Flow
```bash
# Revert frontend to old auth method
git revert HEAD
git push origin main
```

### 2. Keep Cloud Functions
- Functions can remain deployed (unused)
- No database changes needed to rollback

### 3. Re-enable Old Flow
```typescript
// apps/web/src/routes/auth/Login.tsx
await account.createMagicURLToken('unique()', email, redirectUrl);
```

---

## Success Metrics

- ✅ **0% unauthorized magic links sent** (only registered users)
- ✅ **100% new users complete venue setup** (required field)
- ✅ **Duplicate venue IDs rejected** (unique constraint)
- ✅ **Clear error messages** (user-friendly)

---

## Status

**Current**: 🔄 Implementation complete, awaiting deployment

**Next Steps**:
1. Deploy Cloud Functions to AppWrite
2. Update frontend environment variables
3. Test all scenarios
4. Deploy to production
5. Monitor error logs

---

## Documentation

- **Authentication Flow**: See detailed flow diagram above
- **API Reference**: See Cloud Functions section
- **Database Schema**: See Database Schema Changes section
- **Error Codes**: See Error Handling table

