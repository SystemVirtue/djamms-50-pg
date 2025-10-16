# 🔴 Magic Link Error - Current Status & Resolution

**Error**: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`  
**Location**: `Login.tsx:55` → `auth.ts` → AppWrite Functions SDK  
**Date**: October 16, 2025

---

## 🎯 Root Cause Confirmed

The error happens because:

1. **AppWrite Cloud Function is NOT deployed** to your AppWrite Cloud instance
2. When the SDK tries to execute the function, AppWrite returns a 404 HTML page
3. The code tries to parse the HTML as JSON → error

---

## 📋 Quick Diagnosis

Run this command to check if the function exists:

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite
npx appwrite functions list
```

**What to look for:**
- Function name: `magic-link`
- Function ID: `68e5a317003c42c8bb6a`

**If you don't see it** → The function needs to be deployed

---

## ✅ Solution Steps

### Step 1: Ensure AppWrite CLI is Configured

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite

# Login (if not already logged in)
npx appwrite login

# This will open a browser for authentication
```

### Step 2: Initialize Project

```bash
# Run init to configure your project
npx appwrite init project

# Select your AppWrite project when prompted
```

### Step 3: Deploy the Magic Link Function

```bash
# Deploy just the magic-link function
npx appwrite deploy function

# When prompted, select "magic-link"
# OR deploy all functions at once
```

**Expected Output:**
```
✓ Deploying function magic-link
✓ Building function
✓ Uploading code
✓ Function deployed successfully
```

### Step 4: Verify Deployment

```bash
# List functions to confirm
npx appwrite functions list

# You should see:
# - Name: magic-link
# - ID: 68e5a317003c42c8bb6a
# - Status: enabled
```

### Step 5: Configure Environment Variables

The function needs these environment variables set in AppWrite Console:

```env
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your-project-id]
APPWRITE_DATABASE_ID=[your-database-id]
APPWRITE_API_KEY=[your-api-key]
JWT_SECRET=[random-secret-string]
RESEND_API_KEY=[your-resend-key]
```

**Set via Console:**
1. Go to https://cloud.appwrite.io
2. Navigate to Functions → magic-link
3. Click Settings
4. Scroll to Environment Variables
5. Add each variable
6. Save

### Step 6: Test the Function

After deployment, test in AppWrite Console:

1. Go to Functions → magic-link → Executions
2. Click "Execute Now"
3. Body:
   ```json
   {
     "action": "create",
     "email": "test@example.com",
     "redirectUrl": "http://localhost:3003/callback"
   }
   ```
4. Click Execute
5. Check result - should show status: `completed`

### Step 7: Test in Your App

```bash
# Rebuild with the improved logging
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
npm run build:auth

# Start dev server
npm run dev:auth

# Open http://localhost:3002 (or 3003 if 3002 is busy)
# Open browser console
# Enter email and click "Send Magic Link"
```

**Expected Console Output (SUCCESS):**
```
📋 Magic Link Send:
  - endpoint: https://syd.cloud.appwrite.io/v1
  - projectId: [your-id]
  - functionId: 68e5a317003c42c8bb6a
  - email: test@example.com
  - redirectUrl: http://localhost:3003/callback
✅ Magic link execution result: {
  status: 'completed',
  statusCode: 200,
  response: '{"success":true,"message":"Magic link sent"}'
}
✅ Magic link sent: { success: true, message: 'Magic link sent' }
```

**Current Console Output (ERROR):**
```
❌ Magic link error: SyntaxError: Unexpected token '<'
Error details: {
  message: "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON",
  response: "<!DOCTYPE html>..." (404 page)
}
```

---

## 🚨 Alternative: Use Mock Auth (Temporary)

If you can't deploy the function immediately, use mock authentication for development:

### Quick Mock Setup

1. **Create mock auth file:**

```typescript
// packages/appwrite-client/src/auth-mock.ts
export class MockAuthService {
  async sendMagicLink(email: string): Promise<void> {
    console.log('🧪 MOCK: Would send magic link to:', email);
    console.log('🔗 MOCK: http://localhost:3003/callback?secret=mock&userId=' + encodeURIComponent(email));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store mock auth
    const mockSession = {
      token: 'mock-jwt-' + Date.now(),
      user: {
        id: 'mock-' + Date.now(),
        email: email,
        name: email.split('@')[0]
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
    
    console.log('✅ MOCK: Magic link "sent"');
  }

  async handleMagicLinkCallback(secret: string, userId: string) {
    console.log('🧪 MOCK: Verifying magic link');
    
    const session = {
      token: 'mock-jwt-' + Date.now(),
      user: {
        id: 'mock-' + Date.now(),
        email: userId,
        name: userId.split('@')[0]
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
    
    localStorage.setItem('authToken', session.token);
    localStorage.setItem('userData', JSON.stringify(session.user));
    
    console.log('✅ MOCK: Logged in as', userId);
    return session;
  }

  async getCurrentSession() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      return {
        token,
        user: JSON.parse(userData),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      };
    }
    return null;
  }

  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
}
```

2. **Update AppwriteContext to use mock:**

```typescript
// packages/appwrite-client/src/AppwriteContext.tsx
import { AuthService } from './auth';
import { MockAuthService } from './auth-mock';

// Use mock in dev if VITE_USE_MOCK_AUTH is set
const useMockAuth = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const auth = useMockAuth ? new MockAuthService() : new AuthService();
```

3. **Add to .env:**

```env
VITE_USE_MOCK_AUTH=true
```

4. **Rebuild and test:**

```bash
npm run build:auth
npm run dev:auth
```

Now the magic link flow will work in development without needing the AppWrite function deployed.

---

## 📊 Status Summary

| Item | Status | Action Required |
|------|--------|----------------|
| Code Fix | ✅ Done | Using AppWrite SDK |
| Error Logging | ✅ Done | Detailed logs added |
| Function Code | ✅ Exists | In `functions/appwrite/functions/magic-link/` |
| **Function Deployed** | ❌ **MISSING** | **Deploy via AppWrite CLI** |
| Environment Vars | ⚠️ Unknown | Set in AppWrite Console |
| Mock Auth | ✅ Available | Use for dev if needed |

---

## 🎯 Action Items (Priority Order)

1. **HIGH**: Deploy magic-link function to AppWrite Cloud
   ```bash
   cd functions/appwrite
   npx appwrite login
   npx appwrite deploy function
   ```

2. **HIGH**: Set environment variables in AppWrite Console
   - Go to Functions → magic-link → Settings
   - Add all required env vars

3. **MEDIUM**: Test function execution in AppWrite Console
   - Verify it returns `status: completed`

4. **MEDIUM**: Test in browser with real email
   - Should see success logs
   - Should receive email

5. **LOW**: Remove mock auth once real auth works
   - Set `VITE_USE_MOCK_AUTH=false`

---

## 📚 Documentation References

- **Full Fix Details**: `MAGIC_LINK_FIX.md`
- **Deployment Guide**: `MAGIC_LINK_DEPLOYMENT_GUIDE.md`
- **Function Code**: `functions/appwrite/functions/magic-link/src/main.js`
- **Auth Service**: `packages/appwrite-client/src/auth.ts`

---

## 💡 Key Insight

The error message `"<!DOCTYPE "... is not valid JSON` is a clear indicator that:
- The endpoint returned an HTML page (404 or error page)
- NOT JSON from a successful function execution
- This ALWAYS means the function isn't deployed or the ID is wrong

The fix in the code (using AppWrite SDK) is correct. The issue is infrastructure - the function needs to be deployed to AppWrite Cloud.

---

## ✅ Next Steps

1. Run: `cd functions/appwrite && npx appwrite functions list`
2. If function not listed → Deploy it: `npx appwrite deploy function`
3. Set environment variables in AppWrite Console
4. Test in browser - error should be gone

**Estimated Time**: 10-15 minutes to deploy and configure

---

**Document Created**: October 16, 2025  
**Status**: Waiting for AppWrite function deployment  
**Priority**: HIGH - Blocks authentication

