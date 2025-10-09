# 🎯 CALLBACK PAGE - What Should Display

## Your Question Answered

> "What should be displaying when the user clicks on 'Sign into DJAMMS' from their email link?"

---

## The Complete Flow

### 1. Email Link
```
URL in email:
https://auth.djamms.app/callback?secret=92f19716...&userId=mike.clarkin%40icloud.com
```

### 2. User Clicks Link
Browser opens: `https://auth.djamms.app/callback?secret=...&userId=...`

### 3. What SHOULD Display (After Deployment)

#### **Phase 1: Loading State** (Immediate)
```
┌───────────────────────────────────────────┐
│                                           │
│                                           │
│                                           │
│           Authenticating...               │
│                                           │
│                                           │
│                                           │
└───────────────────────────────────────────┘
```

**Code**: From `apps/auth/src/components/AuthCallback.tsx`
```tsx
return (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-xl">Authenticating...</div>
  </div>
);
```

#### **Phase 2: Verification** (2-3 seconds)
Behind the scenes:
1. Extract `secret` and `userId` from URL
2. Call Appwrite function to verify token
3. Receive JWT token
4. Store in localStorage
5. Toast message: "Logged in successfully" ✅

#### **Phase 3: Redirect** (After verification)
```javascript
window.location.href = 'https://dashboard.djamms.app/mike.clarkin@icloud.com'
```

#### **Phase 4: Dashboard Page**
```
┌───────────────────────────────────────────┐
│  Welcome, mike.clarkin@icloud.com         │
│  User ID: mike.clarkin@icloud.com         │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  │  Dashboard                          │ │
│  │  Dashboard implementation           │ │
│  │  coming soon...                     │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

---

## Where Redirect URL is Defined

### Path 1: Frontend → Config → Appwrite Function

```
1. User clicks "Send Magic Link"
   ↓
2. apps/auth/src/components/Login.tsx
   await login(email)
   ↓
3. packages/appwrite-client/src/AppwriteContext.tsx
   await auth.sendMagicLink(email, redirectUrl)
   ↓
4. packages/appwrite-client/src/auth.ts
   const url = redirectUrl || config.auth.magicLinkRedirect
   ↓
5. packages/shared/src/config/env.ts
   magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
     window.location.origin + '/callback'
   ↓
6. Sends to Appwrite function with body.redirectUrl
   ↓
7. functions/appwrite/functions/magic-link/src/main.js
   const magicLink = `${body.redirectUrl || 'https://auth.djamms.app/callback'}?secret=${token}...`
   ↓
8. Email sent with magic link URL
```

### Path 2: User Clicks Link → Route Handler

```
1. User clicks: https://auth.djamms.app/callback?secret=...
   ↓
2. Browser opens URL
   ↓
3. apps/auth/src/main.tsx (React Router)
   <Route path="/callback" element={<AuthCallback />} />
   ↓
4. apps/auth/src/components/AuthCallback.tsx
   - Extract secret & userId from URL
   - Verify with Appwrite
   - Store JWT in localStorage
   - Redirect to dashboard
```

---

## File Locations (Complete Reference)

### 1. **Config** (Defines default redirect URL)
**File**: `packages/shared/src/config/env.ts`
```typescript
auth: {
  magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
    (typeof window !== 'undefined' ? `${window.location.origin}/callback` : ''),
  // ...
}
```

### 2. **Auth Service** (Sends magic link request)
**File**: `packages/appwrite-client/src/auth.ts`
```typescript
async sendMagicLink(email: string, redirectUrl?: string): Promise<void> {
  const url = redirectUrl || config.auth.magicLinkRedirect;
  // ... sends to Appwrite function with url
}
```

### 3. **Appwrite Function** (Generates email)
**File**: `functions/appwrite/functions/magic-link/src/main.js`
```javascript
const magicLink = `${body.redirectUrl || 'https://auth.djamms.app/callback'}?secret=${token}&userId=${encodeURIComponent(email)}`;
// ... sends email with this URL
```

### 4. **Auth Routes** (Handles callback)
**File**: `apps/auth/src/main.tsx`
```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/callback" element={<AuthCallback />} />  ← THIS ONE!
  <Route path="/" element={<Login />} />
</Routes>
```

### 5. **Callback Component** (Displays page & handles auth)
**File**: `apps/auth/src/components/AuthCallback.tsx`
```tsx
export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { auth } = useAppwrite();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const secret = searchParams.get('secret');
    const userId = searchParams.get('userId');

    if (!secret || !userId) {
      setError('Invalid magic link');
      return;
    }

    auth
      .handleMagicLinkCallback(secret, userId)
      .then((session) => {
        toast.success('Logged in successfully');
        
        // Redirect to dashboard
        const dashboardUrl = import.meta.env.PROD
          ? `https://dashboard.djamms.app/${session.user.userId}`
          : `http://localhost:3003/${session.user.userId}`;
        
        window.location.href = dashboardUrl;
      })
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      });
  }, [searchParams, auth]);

  // Shows "Authenticating..." while verifying
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-xl">Authenticating...</div>
    </div>
  );
};
```

---

## Current Problem: 404 Error

### What's Happening:
```
URL: https://auth.djamms.app/callback
Status: 404 NOT_FOUND ❌
```

### Why:
The **route doesn't exist** on the deployed Vercel site yet because:
1. ✅ Code is fixed and committed (commit 9333c74)
2. ✅ Code is pushed to GitHub
3. ❌ Vercel hasn't deployed the new code yet

### What Vercel Should Have:
**File**: `apps/auth/src/main.tsx` (on production)
```tsx
<Route path="/callback" element={<AuthCallback />} />
```

### What Vercel Currently Has:
**File**: `apps/auth/src/main.tsx` (old version)
```tsx
<Route path="/auth/callback" element={<AuthCallback />} />
```

**Result**: Your URL (`/callback`) doesn't match the route (`/auth/callback`) = 404

---

## Solution: Deploy New Code

### Method 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Find project for `auth.djamms.app`
3. Go to **Deployments** tab
4. Click **⋯** → **Redeploy**
5. **Uncheck** "Use existing Build Cache"
6. Click **Redeploy**
7. Wait 2 minutes

### Method 2: Vercel CLI

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
npx vercel --prod apps/auth
```

---

## After Deployment

### Test 1: Route Exists
```bash
curl -I https://auth.djamms.app/callback
```

**Expected**: `HTTP/2 200` ✅

### Test 2: Page Loads
Visit: https://auth.djamms.app/callback

**Expected**: Shows "Authenticating..." page ✅

### Test 3: Magic Link Works
1. Go to: https://auth.djamms.app
2. Enter email: `mike.clarkin@icloud.com`
3. Click "Send Magic Link"
4. Check email
5. Click magic link
6. **Should see**: "Authenticating..." page
7. **Then**: Redirects to dashboard
8. **Final**: Welcome message on dashboard! 🎉

---

## Visual Summary

### Current State (404):
```
Email Link → https://auth.djamms.app/callback
                              ↓
                         [404 NOT_FOUND]
                              ↓
                    Old code: /auth/callback exists
                    New code: /callback exists
                    Deployed: Old code still running ❌
```

### After Deployment (Working):
```
Email Link → https://auth.djamms.app/callback
                              ↓
                    [AuthCallback Component]
                              ↓
                      "Authenticating..."
                              ↓
                      Verify with Appwrite
                              ↓
                       Store JWT token
                              ↓
                   Redirect to Dashboard ✅
```

---

## Summary

**What should display**: "Authenticating..." message, then redirect to dashboard  
**What's displaying**: 404 NOT_FOUND ❌  
**Why**: Old code still deployed on Vercel  
**Fix**: Manually redeploy auth app from Vercel dashboard  
**ETA**: 2 minutes after triggering deployment
