# AppWrite Platforms Setup Guide

## 🎯 Adding Production Domains to AppWrite

This is **CRITICAL** for preventing CORS errors when your apps try to communicate with AppWrite.

---

## Step-by-Step Instructions

### 1. Open AppWrite Console

Go to: https://cloud.appwrite.io

**Login credentials:** Your AppWrite account

---

### 2. Select Your Project

- Click on **"DJAMMS Prototype"** project
- Or the project with ID: `68cc86c3002b27e13947`

---

### 3. Navigate to Platforms

1. Click **"Settings"** in the left sidebar
2. Click **"Platforms"** tab
3. You'll see your existing platforms (localhost URLs)

---

### 4. Add Web Platforms

Click **"Add Platform"** button (usually top right)

**IMPORTANT: Select Platform Type:**
- ✅ **Select: "React"** 
- Your apps are built with React + Vite, so React is the correct choice
- This tells AppWrite to allow CORS from these domains for React applications

---

### 5. Add Each Domain

**⚠️ FREE TIER LIMITATION:** AppWrite Free tier only allows **3 platforms**.

**SOLUTION: Use Wildcard!** ✅

Instead of adding 7 separate platforms, add **3 platforms with wildcards**:

#### Platform 1: Wildcard for all subdomains
```
Platform Type: React
Name: DJAMMS All Subdomains
Hostname: https://*.djamms.app
```
This covers: auth, player, admin, kiosk, dashboard, www, and any future subdomains!

#### Platform 2: Root domain
```
Platform Type: React
Name: DJAMMS Root
Hostname: https://djamms.app
```

#### Platform 3: Localhost (for development)
```
Platform Type: React
Name: Localhost Development
Hostname: http://localhost
```
This covers localhost:3000, localhost:3001, etc. for local dev!

---

## 🎯 Wildcard Explanation

**What `*.djamms.app` does:**
- ✅ Matches `auth.djamms.app`
- ✅ Matches `player.djamms.app`
- ✅ Matches `admin.djamms.app`
- ✅ Matches `kiosk.djamms.app`
- ✅ Matches `dashboard.djamms.app`
- ✅ Matches `www.djamms.app`
- ✅ Matches ANY subdomain you create in the future
- ❌ Does NOT match `djamms.app` (root domain - add separately)

**Why you need both:**
1. `https://*.djamms.app` - All subdomains
2. `https://djamms.app` - Root domain (wildcard doesn't cover this)
3. `http://localhost` - Local development

---

## 🔍 Why "React"?

**AppWrite Platform Types Explained:**

Your apps are built with:
- ✅ React 18
- ✅ Vite 7
- ✅ TypeScript

**Available Platform Types:**
- **React** ← ✅ **Choose this one**
- Vue
- Angular
- Svelte
- Next.js
- Nuxt
- JavaScript (vanilla)

**Why React specifically?**
- ✅ Matches your tech stack (React + Vite)
- ✅ Configures proper CORS headers for React apps
- ✅ Enables React-specific SDK features
- ✅ Optimizes for React's rendering patterns

**TL;DR:** Use **"React"** for all 7 platforms since all your apps are React-based.

---

## ✅ Verification

After adding the 3 platforms, you should see them listed:

```
Web Platforms:
- DJAMMS All Subdomains (https://*.djamms.app) [React]
- DJAMMS Root (https://djamms.app) [React]
- Localhost Development (http://localhost) [React]
```

**This configuration covers:**
- ✅ All production subdomains (auth, player, admin, kiosk, dashboard, www)
- ✅ Root domain (djamms.app)
- ✅ All localhost ports for development

**You can delete any old specific localhost platforms** (localhost:3000, localhost:3001, etc.) since the wildcard `http://localhost` covers them all!

---

## 🚨 What This Does

Adding these platforms tells AppWrite to:
1. ✅ Accept API requests from these domains (CORS whitelist)
2. ✅ Include proper CORS headers in responses
3. ✅ Allow authentication flows from these origins
4. ✅ Permit file uploads from these domains
5. ✅ Enable real-time subscriptions from these origins

**Without this setup:**
- ❌ CORS errors in browser console
- ❌ API requests blocked
- ❌ Authentication fails
- ❌ Real-time features don't work

---

## 🎯 Quick Checklist

- [ ] Opened AppWrite Console
- [ ] Selected DJAMMS Prototype project
- [ ] Navigated to Settings → Platforms
- [ ] Added platform: DJAMMS All Subdomains (https://*.djamms.app)
- [ ] Added platform: DJAMMS Root (https://djamms.app)
- [ ] Added platform: Localhost Development (http://localhost)
- [ ] Verified all 3 platforms are listed
- [ ] Deleted old specific localhost platforms (optional cleanup)

---

## 🧪 Testing After Setup

After adding all platforms, test CORS by:

1. **Open any production app** (e.g., https://auth.djamms.app)
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Look for errors:**
   - ✅ No CORS errors = success
   - ❌ "blocked by CORS policy" = platform not added correctly

4. **Test API call:**
   ```javascript
   // In browser console on auth.djamms.app
   fetch('https://syd.cloud.appwrite.io/v1/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```
   - ✅ Should return: `{status: "pass", ping: <number>}`
   - ❌ CORS error = check platform configuration

---

## 🔧 Troubleshooting

### "Platform already exists"
- Another project might be using that domain
- Check if you accidentally added it to the wrong AppWrite project
- Remove it from the other project first

### CORS errors persist after adding platforms
1. **Wait 1-2 minutes** for AppWrite to propagate changes
2. **Hard refresh** the browser (Cmd+Shift+R or Ctrl+Shift+R)
3. **Clear browser cache**
4. **Verify hostname is EXACTLY correct** (https://, no trailing slash, correct subdomain)

### Wrong platform type selected
- If you accidentally chose the wrong type, you can delete and re-add
- Or edit the platform and change the hostname if needed
- React is the correct choice for all your apps

---

## 📸 Visual Guide

**What you'll see when adding a platform:**

```
┌─────────────────────────────────────┐
│  Add Platform                       │
├─────────────────────────────────────┤
│  Platform Type: [React ▼]          │
│                                     │
│  Name: Landing                      │
│                                     │
│  Hostname: https://djamms.app      │
│                                     │
│  [Cancel]              [Add]       │
└─────────────────────────────────────┘
```

**Key points:**
- ✅ Select "React" from dropdown
- ✅ Include `https://` in hostname
- ✅ NO trailing slash
- ✅ Use exact subdomain (auth, player, etc.)
- ✅ Match the Vercel domain exactly

---

## ⏱️ Time Estimate

- **Per platform:** 30 seconds
- **Total (3 platforms):** ~2 minutes

**Much faster with wildcards!** Instead of 7 individual platforms taking 4 minutes, you only need 3 platforms taking 2 minutes.

---

## 🎉 Success Indicators

After setup, you should be able to:
- ✅ Visit any production domain without CORS errors
- ✅ Authenticate users via magic links
- ✅ Make API calls to AppWrite
- ✅ Upload files
- ✅ Subscribe to real-time updates
- ✅ See proper CORS headers in network tab

---

## 📞 Need Help?

If you encounter issues:
1. **Double-check hostnames** (most common mistake)
2. **Verify HTTPS** is included
3. **Check AppWrite project ID** matches your .env
4. **Look at browser console** for specific errors
5. **Check Network tab** to see blocked requests

---

## 📚 Additional Resources

- **AppWrite Platforms Docs:** https://appwrite.io/docs/getting-started-for-web
- **AppWrite CORS Guide:** https://appwrite.io/docs/response-codes#cors
- **AppWrite Console:** https://cloud.appwrite.io

---

## ✅ After Completion

Once all platforms are added:
1. ✅ Test each production app in browser
2. ✅ Verify no CORS errors in console
3. ✅ Test authentication flow
4. ✅ Test API interactions
5. ✅ Test real-time features

Then you're **100% DEPLOYED!** 🎉

---

**Quick Answer for Your Question:**

**Platform Type:** ✅ **"React"**

**Why React?**
- Your apps are built with React 18 + Vite 7
- React is the correct framework choice for your tech stack
- Configures AppWrite to work optimally with React applications

**Available Options:**
- React ← ✅ **Select this**
- Vue
- Angular  
- Svelte
- Next.js
- Nuxt
- JavaScript

All your apps use React, so select "React" for all 7 platforms.
