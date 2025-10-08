# Quick Test Guide - Getting Started

**Time Required:** 10-15 minutes for basic smoke tests

---

## 🚀 Quick Start Testing (5 minutes)

Let's verify the core flow works end-to-end:

### Step 1: Landing Page (30 seconds)
```
1. Open: https://djamms.app
2. ✅ Check: Page loads without errors
3. ✅ Check: Press F12 - Console should have no red errors
4. ✅ Check: Look for "Login" or "Get Started" button
```

**Expected Console Output:**
```
✅ No CORS errors
✅ No 404 errors  
✅ Environment variables loaded (check for VITE_APPWRITE_* in console if logging enabled)
```

---

### Step 2: Authentication Flow (2 minutes)

```
1. Click "Login" button on landing page
2. ✅ Should redirect to: https://auth.djamms.app
3. Enter your email address
4. ✅ Click "Send Magic Link"
5. ✅ Check console - should show API call to AppWrite
6. ✅ Check email inbox (including spam)
```

**Check Browser Console:**
```javascript
// Open console (F12) and check Network tab
// You should see:
✅ POST request to AppWrite API (magic link creation)
✅ Status 201 (Created) or 200 (OK)
✅ No CORS errors
```

**Check AppWrite Console:**
```
1. Go to: https://cloud.appwrite.io
2. Select your project
3. Go to Databases → djamms_production → magicLinks
4. ✅ You should see a new document with:
   - email: your email
   - token: generated token
   - used: false
   - expiresAt: timestamp ~15 min in future
```

---

### Step 3: Magic Link Callback (1 minute)

```
1. Check your email for magic link
2. Click the link
3. ✅ Should redirect back to: https://auth.djamms.app/callback?token=...
4. ✅ Token validated
5. ✅ Should redirect to: https://player.djamms.app
```

**Check Browser Console:**
```javascript
// After clicking magic link, check localStorage:
localStorage.getItem('djamms_jwt_token')  // ✅ Should exist
localStorage.getItem('djamms_user_id')     // ✅ Should exist

// Check console for:
✅ Token validation API call
✅ Redirect to player
✅ No errors
```

**Check AppWrite Console:**
```
magicLinks collection:
✅ used: true (should change from false)

users collection:
✅ New user document created (if first login)
✅ lastLoginAt timestamp updated
```

---

### Step 4: Player Page (2 minutes)

```
1. You should now be on: https://player.djamms.app
2. ✅ Page loads without errors
3. ✅ YouTube player iframe visible
4. ✅ Search bar present
5. ✅ Queue area visible
```

**Check Browser Console:**
```javascript
// Open console (F12) and check for:
✅ window.YT exists (YouTube API loaded)
✅ localStorage has JWT token
✅ No CORS errors
✅ WebSocket connection established (for real-time)

// Check Network tab:
✅ Connection to AppWrite (Realtime)
✅ ws:// or wss:// connection active
```

**Quick Functional Test:**
```
1. Type "rick astley never gonna give you up" in search
2. ✅ Click search
3. ✅ YouTube API returns results
4. ✅ Results display with thumbnails
5. ✅ Click "Add to Queue" on a video
6. ✅ Video appears in queue
```

---

## 🔍 What to Look For (Key Indicators)

### ✅ SUCCESS Indicators:
- No red errors in console
- No CORS errors (should say `access-control-allow-origin: *`)
- API calls return 200/201 status codes
- JWT token stored in localStorage
- AppWrite Realtime connected (ws:// in Network tab)
- Smooth redirects between pages

### ❌ FAILURE Indicators:
- CORS errors: `blocked by CORS policy`
- 401 Unauthorized errors
- 404 errors for assets
- Infinite redirect loops
- JWT token not saved
- WebSocket connection failed

---

## 🐛 Common Issues & Quick Fixes

### Issue: CORS Error
```
Error: blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```
**Fix:** Check AppWrite platforms include `*.djamms.app` wildcard

**Verify:**
```bash
# Check AppWrite console → Settings → Platforms
# Should have:
- https://*.djamms.app (React)
- https://djamms.app (React)  
- http://localhost (React)
```

---

### Issue: JWT Token Not Saving
```
localStorage.getItem('djamms_jwt_token') returns null
```
**Fix:** Check auth flow completes properly

**Debug:**
```javascript
// In auth app console, check:
console.log('Token received:', token);
console.log('Saving to localStorage...');
localStorage.setItem('djamms_jwt_token', token);
console.log('Token saved:', localStorage.getItem('djamms_jwt_token'));
```

---

### Issue: YouTube API Not Loading
```
window.YT is undefined
```
**Fix:** Check YouTube API key in environment variables

**Verify:**
```javascript
// In player app console:
console.log('API Key exists:', !!import.meta.env.VITE_YOUTUBE_API_KEY);

// Check Vercel env vars:
VITE_YOUTUBE_API_KEY=your_key_here
```

---

### Issue: Real-time Not Working
```
Queue doesn't update when adding songs
```
**Fix:** Check AppWrite Realtime subscription

**Debug:**
```javascript
// In player console, should see:
✅ ws://... or wss://... connection in Network tab
✅ Subscribed to collection: queues
✅ Events received when queue changes

// Look for console logs like:
"Realtime: Connected"
"Subscribed to queues collection"
```

---

## 📊 Quick Health Check Script

Run this in browser console on any page:

```javascript
// DJAMMS Health Check
console.log('=== DJAMMS Health Check ===');

// 1. Check JWT Token
const token = localStorage.getItem('djamms_jwt_token');
console.log('JWT Token:', token ? '✅ Present' : '❌ Missing');

// 2. Check User ID
const userId = localStorage.getItem('djamms_user_id');
console.log('User ID:', userId ? '✅ Present' : '❌ Missing');

// 3. Check Environment
console.log('Environment:', {
  appwriteEndpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
});

// 4. Check Current URL
console.log('Current App:', window.location.hostname);

// 5. Check CORS
fetch('https://68e5a36e0021b938b3a7.djamms.app/v1/health')
  .then(r => console.log('AppWrite Health:', '✅ Reachable'))
  .catch(e => console.error('AppWrite Health:', '❌ CORS Error', e));

console.log('=== End Health Check ===');
```

---

## 🎯 Next Steps After Basic Tests

Once basic flow works:

1. **Test Other Apps:**
   - Admin: https://admin.djamms.app
   - Kiosk: https://kiosk.djamms.app
   - Dashboard: https://dashboard.djamms.app

2. **Test Advanced Features:**
   - YouTube playback
   - Queue reordering
   - Real-time sync across tabs
   - Master player logic
   - Venue selection

3. **Test Edge Cases:**
   - Expired magic link
   - Invalid token
   - Network offline
   - Concurrent users

4. **Performance Testing:**
   - Multiple songs in queue
   - Long session duration
   - Multiple tabs open
   - Slow network simulation

---

## 📝 Recording Your Results

As you test, note:

```
✅ Working:
- Landing page loads
- Auth flow completes
- Player displays
- _______________________

❌ Issues Found:
- CORS error on kiosk app
- YouTube search slow
- _______________________

⚠️ Needs Investigation:
- Real-time sometimes delays
- Token refresh unclear
- _______________________
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check browser console** (F12) - most errors show here
2. **Check Network tab** - see API calls and responses
3. **Check AppWrite console** - verify database operations
4. **Check Vercel logs** - see deployment/runtime errors

**Common Debug Commands:**
```bash
# Check DNS still working
dig player.djamms.app

# Check SSL certificate
curl -vI https://player.djamms.app 2>&1 | grep -E "SSL|certificate"

# Check AppWrite API
curl https://68e5a36e0021b938b3a7.djamms.app/v1/health

# Check Vercel deployment status
vercel ls
```

---

Ready to start testing? Begin with Step 1 above! 🚀
