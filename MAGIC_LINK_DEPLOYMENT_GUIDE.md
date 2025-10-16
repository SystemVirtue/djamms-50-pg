# Magic Link Function Deployment & Troubleshooting

**Issue**: Magic link returns HTML instead of JSON  
**Error**: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause**: The AppWrite function is either:
1. Not deployed to AppWrite Cloud
2. Function ID is incorrect
3. Function exists but isn't properly configured

---

## Step 1: Verify Function Deployment

### Check if Function Exists in AppWrite Cloud

1. **Login to AppWrite Console**:
   - Go to https://cloud.appwrite.io
   - Navigate to your project

2. **Check Functions**:
   - Go to "Functions" in the left sidebar
   - Look for a function named "magic-link" or with ID `68e5a317003c42c8bb6a`

3. **If Function Doesn't Exist** → Deploy it (see Step 2)
4. **If Function Exists** → Verify configuration (see Step 3)

---

## Step 2: Deploy Magic Link Function

### Option A: Deploy via AppWrite CLI

```bash
# Navigate to functions directory
cd functions/appwrite

# Login to AppWrite CLI (if not already logged in)
npx appwrite login

# Set project
npx appwrite init project

# Deploy the magic-link function
npx appwrite deploy function --functionId magic-link

# Or deploy all functions
npx appwrite deploy function
```

### Option B: Manual Deployment via Console

1. Go to AppWrite Console → Functions
2. Click "Create Function"
3. Configure:
   - **Name**: magic-link
   - **Runtime**: Node.js 18.x
   - **Entry point**: `src/main.js`
   - **Build Command**: `npm install`
4. Upload code from `functions/appwrite/functions/magic-link/`
5. Set environment variables (see Step 3)

---

## Step 3: Configure Environment Variables

The function needs these environment variables:

```env
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=[your-project-id]
APPWRITE_DATABASE_ID=[your-database-id]
APPWRITE_API_KEY=[your-api-key]
JWT_SECRET=[your-jwt-secret]
RESEND_API_KEY=[your-resend-api-key]
```

### Set via AppWrite Console

1. Go to Functions → magic-link → Settings
2. Scroll to "Environment Variables"
3. Add each variable above
4. Save and redeploy

### Set via CLI

```bash
cd functions/appwrite

# Set environment variables
npx appwrite functions updateVar \
  --functionId magic-link \
  --key APPWRITE_ENDPOINT \
  --value "https://syd.cloud.appwrite.io/v1"

npx appwrite functions updateVar \
  --functionId magic-link \
  --key APPWRITE_PROJECT_ID \
  --value "YOUR_PROJECT_ID"

# Repeat for all variables...
```

---

## Step 4: Verify Function Configuration

### Check Function ID Matches

**In Code** (`packages/shared/src/config/env.ts`):
```typescript
functions: {
  magicLink: '68e5a317003c42c8bb6a', // ← This ID
}
```

**In AppWrite Console**:
- Go to Functions → magic-link
- Check the Function ID in the URL or settings
- IDs must match exactly

### If IDs Don't Match

Update the function ID in your config:

```typescript
// packages/shared/src/config/env.ts
functions: {
  magicLink: 'YOUR_ACTUAL_FUNCTION_ID', // Update this
}
```

---

## Step 5: Test Function Execution

### Via AppWrite Console

1. Go to Functions → magic-link → Executions
2. Click "Execute Now"
3. Body:
   ```json
   {
     "action": "create",
     "email": "test@example.com",
     "redirectUrl": "http://localhost:3002/callback"
   }
   ```
4. Check execution result
5. Should return status: `completed`

### Via Code (with Better Logging)

The updated `auth.ts` now includes detailed logging:

```typescript
console.log('📋 Magic Link Send:');
console.log('  - endpoint:', config.appwrite.endpoint);
console.log('  - projectId:', config.appwrite.projectId);
console.log('  - functionId:', config.appwrite.functions.magicLink);

console.log('✅ Magic link execution result:', {
  status: result.status,
  statusCode: result.statusCode,
  response: result.response,
});
```

**Expected console output**:
```
📋 Magic Link Send:
  - endpoint: https://syd.cloud.appwrite.io/v1
  - projectId: 67e5a...
  - functionId: 68e5a317003c42c8bb6a
  - email: test@example.com
  - redirectUrl: http://localhost:3002/callback
✅ Magic link execution result: {
  status: 'completed',
  statusCode: 200,
  response: '{"success":true,"message":"Magic link sent"}'
}
✅ Magic link sent: { success: true, message: 'Magic link sent' }
```

**If you see HTML in response**:
```
❌ Magic link execution result: {
  status: 'failed',
  statusCode: 404,
  response: '<!DOCTYPE html>...'
}
```

→ Function is not deployed or ID is wrong

---

## Step 6: Common Issues & Solutions

### Issue 1: Function Not Found (404)

**Symptoms**:
- Response contains HTML
- Status code: 404
- Error: "Function not found"

**Solution**:
```bash
# Deploy the function
cd functions/appwrite
npx appwrite deploy function --functionId magic-link
```

### Issue 2: Function Execution Failed

**Symptoms**:
- Status: 'failed'
- Status code: 500
- Error in execution logs

**Solution**:
1. Check function logs in AppWrite Console
2. Verify environment variables are set
3. Check function code for errors
4. Verify database collection "magicLinks" exists

### Issue 3: Function Timeout

**Symptoms**:
- Execution takes too long
- Times out without response

**Solution**:
1. Increase function timeout in AppWrite Console
2. Go to Functions → magic-link → Settings
3. Set timeout to 15 seconds (default is 15s)

### Issue 4: Email Not Sending

**Symptoms**:
- Function executes successfully
- But no email arrives

**Solution**:
1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for delivery logs
3. Verify "from" email is verified in Resend
4. Check spam folder

### Issue 5: Incorrect Function ID

**Symptoms**:
- Different function executes
- Unexpected behavior

**Solution**:
```bash
# List all functions to find correct ID
npx appwrite functions list

# Update config with correct ID
# Edit: packages/shared/src/config/env.ts
```

---

## Step 7: Alternative: Mock Authentication (Development Only)

If you can't get the function deployed immediately, use mock auth for development:

### Create Mock Auth Service

```typescript
// packages/appwrite-client/src/auth-mock.ts
export class MockAuthService {
  async sendMagicLink(email: string): Promise<void> {
    console.log('🧪 MOCK: Magic link would be sent to:', email);
    console.log('🔗 MOCK: Link: http://localhost:3002/callback?secret=mock-token&userId=' + email);
    
    // Simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async handleMagicLinkCallback(secret: string, userId: string) {
    console.log('🧪 MOCK: Verifying magic link');
    
    return {
      token: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        email: userId,
        name: 'Test User'
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
  }

  async getCurrentSession() {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        token,
        user: JSON.parse(localStorage.getItem('userData') || '{}'),
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

### Use Mock in Development

```typescript
// packages/appwrite-client/src/AppwriteContext.tsx
import { AuthService } from './auth';
import { MockAuthService } from './auth-mock';

const auth = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_AUTH
  ? new MockAuthService()
  : new AuthService();
```

---

## Step 8: Verify Complete Setup

### Checklist

- [ ] AppWrite project exists
- [ ] Database created with "magicLinks" collection
- [ ] Function "magic-link" deployed
- [ ] Function ID matches config
- [ ] Environment variables set in function
- [ ] Resend API key valid
- [ ] Function executes successfully in console
- [ ] Code updated with SDK calls
- [ ] Auth app builds without errors
- [ ] Test email sent successfully

### Test End-to-End

1. **Start dev server**:
   ```bash
   npm run dev:auth
   ```

2. **Open browser**:
   - Go to http://localhost:3002
   - Open browser console

3. **Request magic link**:
   - Enter your email
   - Click "Send Magic Link"
   - Watch console logs

4. **Expected logs**:
   ```
   📋 Magic Link Send:
     - endpoint: https://syd.cloud.appwrite.io/v1
     - projectId: [your-id]
     - functionId: 68e5a317003c42c8bb6a
     - email: your@email.com
   ✅ Magic link execution result: {
     status: 'completed',
     statusCode: 200,
     response: '{"success":true}'
   }
   ✅ Magic link sent: { success: true }
   ```

5. **Check email**:
   - Email should arrive within 1-2 minutes
   - Click magic link
   - Should redirect to callback URL
   - Should log you in

---

## Step 9: Production Deployment

### Before Deploying

1. Verify function works in development
2. Test with real email address
3. Verify email delivery
4. Test full authentication flow

### Deploy Function to Production

```bash
cd functions/appwrite

# Set production environment
npx appwrite init

# Select production project

# Deploy function
npx appwrite deploy function --functionId magic-link
```

### Update Frontend Environment Variables

```env
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=[production-project-id]
VITE_APPWRITE_DATABASE_ID=[production-database-id]
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/callback
```

### Deploy Frontend

```bash
npm run build
vercel --prod
```

---

## Debugging Commands

```bash
# Check function exists
npx appwrite functions list

# Get function details
npx appwrite functions get --functionId 68e5a317003c42c8bb6a

# List recent executions
npx appwrite functions listExecutions --functionId 68e5a317003c42c8bb6a

# Get specific execution
npx appwrite functions getExecution \
  --functionId 68e5a317003c42c8bb6a \
  --executionId [execution-id]

# View function logs (in console)
# Go to Functions → magic-link → Executions → Click execution → View logs
```

---

## Quick Fix Summary

If you're seeing the HTML error:

1. **Verify function is deployed**:
   ```bash
   npx appwrite functions list
   ```

2. **If not deployed, deploy it**:
   ```bash
   cd functions/appwrite
   npx appwrite deploy function --functionId magic-link
   ```

3. **Verify function ID matches**:
   - Check AppWrite Console
   - Check `packages/shared/src/config/env.ts`

4. **Set environment variables** in AppWrite Console

5. **Test** by running dev server and checking console logs

6. **Rebuild and test**:
   ```bash
   npm run build:auth
   npm run dev:auth
   ```

---

**Document Updated**: October 16, 2025  
**Status**: Ready for deployment verification

