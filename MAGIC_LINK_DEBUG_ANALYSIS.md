# 🔍 MAGIC LINK ISSUE - ENVIRONMENT ANALYSIS

**Date**: October 16, 2025  
**Status**: 🔍 **INVESTIGATING**

---

## 📊 Current State

### ✅ Environment Variables (Root .env)
All clean - no broken function URLs:
```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY=68e5a41f00222cab705b
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=68e5acf100104d806321
```

### ✅ Config File (Hardcoded)
`packages/shared/src/config/env.ts` has correct function IDs:
```typescript
functions: {
  magicLink: '68e5a317003c42c8bb6a',
  playerRegistry: '68e5a41f00222cab705b',
  processRequest: '68e5acf100104d806321',
}
```

### ⚠️ apps/web/.env (Different!)
Has **different database ID**:
```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68cc86f2003873d8555b  # ← DIFFERENT!
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
```

Root .env uses: `68e57de9003234a84cae`  
apps/web/.env uses: `68cc86f2003873d8555b`

---

## 🎯 Key Finding: TWO APPS, TWO CONFIGS

### apps/auth/ (Primary - Port 3002)
- **Uses**: `packages/appwrite-client` (SDK-based)
- **Config**: Hardcoded function IDs in `packages/shared/src/config/env.ts`
- **Login Component**: `apps/auth/src/components/Login.tsx`
- **Method**: Calls `useAppwrite().login()` → SDK

### apps/web/ (Secondary - Unknown Port)
- **Uses**: Direct AppWrite SDK in component
- **Config**: Reads from `apps/web/.env` OR root `.env`
- **Login Component**: `apps/web/src/routes/auth/Login.tsx`
- **Method**: Direct `functions.createExecution()` in component

---

## 🐛 Error Analysis

### Stack Trace
```
Magic link error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
at Login.tsx:43
```

### Which Login.tsx?

**If line 43 is the error location:**

**apps/auth/Login.tsx** - Line 43:
```tsx
className="w-full px-4 py-3 bg-gray-700..."  // ← Not a function call
```

**apps/web/Login.tsx** - Line 43:
```tsx
console.error('Magic link execution failed:', result.responseBody);  // ← Could log HTML
```

### Most Likely Scenario

You're running **apps/web** which:
1. Creates its own AppWrite client at module scope (lines 4-11)
2. Uses `import.meta.env` which gets values at BUILD TIME
3. If the dev server was started with old .env, it still has cached values
4. Even though we fixed .env, the running server hasn't restarted

---

## 🔍 Questions to Answer

### 1. Which app are you accessing?
```bash
# Check your browser URL:
http://localhost:3002  → apps/auth (primary)
http://localhost:????  → apps/web (secondary)
```

### 2. Is a dev server actually running?
```bash
ps aux | grep vite | grep -v grep
# Shows: Port 3002 PID 78117 Status: T (stopped!)
```

### 3. Are you accessing a production build?
```bash
# Check if you're on:
https://auth.djamms.app  → Production (Vercel?)
http://localhost:????     → Local dev
```

---

## 🔧 Solutions by Scenario

### Scenario A: Running apps/auth Locally
```bash
# Kill any old servers
pkill -f vite

# Start fresh
npm run dev:auth

# Should start on: http://localhost:3002
# This uses the CORRECT SDK-based approach
```

### Scenario B: Running apps/web Locally
```bash
# Option 1: Kill and restart
pkill -f vite
cd apps/web
npm install
npm run dev

# Option 2: Fix apps/web/.env database ID
# Edit apps/web/.env and change:
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae  # Match root .env
```

### Scenario C: Accessing Production
If you're on `https://auth.djamms.app`:
- The production build was made with OLD .env values
- You need to rebuild and redeploy with clean .env
- Vercel/deployment needs environment variables updated

### Scenario D: Browser Cache
```bash
# In browser:
# 1. Open DevTools (F12)
# 2. Right-click refresh button
# 3. Choose "Empty Cache and Hard Reload"
# 4. Or: Cmd+Shift+Delete → Clear cache
```

---

## 🎯 Recommended Actions (In Order)

### 1. Identify Which App You're Using
```bash
# In browser console, run:
window.location.href
# This tells us which app is loaded
```

### 2. Kill ALL Dev Servers
```bash
pkill -f vite
pkill -f node
```

### 3. Fix apps/web/.env Database ID
```bash
# Edit apps/web/.env and change to match root:
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
```

### 4. Start ONLY apps/auth
```bash
npm run dev:auth
# This is the PRIMARY app that works correctly
```

### 5. Test with Fresh Browser Tab
```bash
# Open: http://localhost:3002
# Hard refresh: Cmd+Shift+R
# Enter email, click "Send Magic Link"
```

---

## 📝 Expected Behavior (apps/auth)

### What SHOULD Happen:
1. User enters email
2. Click "Send Magic Link"
3. Console shows:
   ```javascript
   📋 Magic Link Send:
     - endpoint: https://syd.cloud.appwrite.io/v1
     - projectId: 68cc86c3002b27e13947
     - functionId: 68e5a317003c42c8bb6a
     - email: test@example.com
   
   ✅ Magic link execution result: {
     status: "completed",
     statusCode: 200,
     response: "{"success":true,...}"
   }
   ```
4. Toast message: "Magic link sent! Check your email."
5. **NO ERRORS**

### What You're Seeing:
```javascript
Magic link error: SyntaxError: Unexpected token '<'
```

This means:
- `result.responseBody` contains HTML (404 page)
- Either wrong function URL
- Or function doesn't exist
- Or endpoint is wrong

---

## 🔬 Debug Commands

### Check What's Running
```bash
./debug-magic-link.sh
```

### Check Browser Network Tab
1. Open DevTools → Network
2. Click "Send Magic Link"
3. Look for request to AppWrite
4. Check:
   - Request URL
   - Request Payload
   - Response (HTML or JSON?)
   - Status Code

### Check Function Execution in AppWrite Console
1. Go to: https://cloud.appwrite.io/console
2. Navigate to: Functions → magic-link
3. Click: Executions
4. Look for recent failed executions

---

## 🎉 Success Criteria

When fixed, you should see:
- ✅ No "SyntaxError" in console
- ✅ "Magic link sent!" toast message
- ✅ Email received (if Resend configured)
- ✅ Magic link works when clicked
- ✅ User redirected to dashboard

---

## 📌 Summary

**Root Cause Options:**
1. ❌ Old dev server still running with cached .env
2. ❌ Using apps/web instead of apps/auth
3. ❌ apps/web/.env has wrong database ID
4. ❌ Browser cache has old JavaScript
5. ❌ Production deployment has old env vars

**Next Step:**
Tell me:
1. What URL are you accessing? (localhost:??? or production?)
2. What does browser console show when you run: `window.location.href`
3. Can you see the Network tab request to AppWrite?

Then we can pinpoint the exact issue!

---

**Status**: 🔍 WAITING FOR USER INPUT  
**Debug Script**: `./debug-magic-link.sh`  
**Recommended**: Kill servers, restart `npm run dev:auth`, test on :3002

