# AppWrite Architecture Analysis for DJAMMS

**Date:** October 10, 2025  
**Current Plan:** AppWrite Free Tier  
**Question:** Do we need 6 separate projects vs a single monorepo?

---

## TL;DR Answer

**NO - You DON'T need 6 separate projects!** 

Your use of **subdomains** (auth.djamms.app, player.djamms.app, etc.) is the reason for the perceived complexity, but AppWrite can handle this elegantly with:

1. **Single AppWrite Project** ✅
2. **Single Storage Bucket** ✅ (already configured as `static-apps`)
3. **Subdirectories in bucket** ✅ (one per app: /auth, /landing, /player, etc.)
4. **AppWrite Function for routing** ✅ (routes subdomains to subdirectories)

**Total Free Tier Usage:**
- 1 Project (out of 2 allowed) ✅
- 1 Bucket (out of 1 allowed) ✅
- 1 Function (out of 5 allowed) ✅

---

## Deep Dive: Why Your Architecture Works Perfectly on Free Tier

### Current Situation

You have **6 React SPAs** that need to be hosted on **6 different subdomains**:

```
auth.djamms.app       → apps/auth/dist
djamms.app           → apps/landing/dist
player.djamms.app    → apps/player/dist
admin.djamms.app     → apps/admin/dist
dashboard.djamms.app → apps/dashboard/dist
kiosk.djamms.app     → apps/kiosk/dist
```

### The Solution: AppWrite Storage + Function-Based Routing

Based on the documentation I just read, here's how AppWrite handles this:

#### 1. **Storage Buckets Can Serve Static Files**

From the docs:
- Storage buckets support `getFileView()` endpoint
- Files can have `read("any")` permissions (public access)
- Buckets support compression (gzip) for faster delivery
- Files accessed via: `https://syd.cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view`

#### 2. **File IDs Can Include Paths**

Critical insight from the docs:
- File IDs can be custom: `ID.unique()` or custom string
- **File IDs can simulate directory structures**: `auth/index.html`, `auth/assets/main.js`
- This creates a "virtual directory structure" within a single bucket

#### 3. **AppWrite Functions Can Route Requests**

From Functions docs:
- Functions can be triggered by HTTP requests
- Functions get full request context (domain, path, headers)
- Functions can proxy/redirect to storage bucket files
- Perfect for subdomain → subdirectory routing

---

## Architecture Diagram

### Current (Vercel - Multiple Projects Problem)

```
auth.djamms.app ────> Vercel Project 1 ─> apps/auth/dist
djamms.app ─────────> Vercel Project 2 ─> apps/landing/dist
player.djamms.app ──> Vercel Project 3 ─> apps/player/dist
...
(6 separate Vercel projects needed = COMPLEX)
```

### Proposed (AppWrite - Single Project)

```
                      ┌─────────────────────────────────────┐
                      │   AppWrite Project (DJAMMS)         │
                      │   Free Tier: 1 of 2 projects used   │
                      └─────────────────────────────────────┘
                                      │
                      ┌───────────────┴────────────────┐
                      │                                │
        ┌─────────────▼────────────┐    ┌─────────────▼────────────┐
        │  Storage Bucket          │    │  Function: router        │
        │  ID: static-apps         │    │  HTTP trigger enabled    │
        │  Free Tier: 1 of 1       │    │  Free Tier: 1 of 5       │
        │                          │    │                          │
        │  Files:                  │◄───┤  Logic:                  │
        │  - auth/index.html       │    │  if (domain == "auth")   │
        │  - auth/assets/...       │    │    return bucket/auth/*  │
        │  - landing/index.html    │    │  if (domain == "player") │
        │  - landing/assets/...    │    │    return bucket/player/*│
        │  - player/index.html     │    │  ...                     │
        │  - player/assets/...     │    │                          │
        │  - admin/index.html      │    └──────────────────────────┘
        │  - admin/assets/...      │                │
        │  - dashboard/...         │                │
        │  - kiosk/...             │                │
        └──────────────────────────┘                │
                                                    │
        ┌───────────────────────────────────────────┘
        │
        ▼
    DNS (Porkbun):
    auth.djamms.app ──────> CNAME ──> function-router.appwrite-function.io
    djamms.app ───────────> CNAME ──> function-router.appwrite-function.io
    player.djamms.app ────> CNAME ──> function-router.appwrite-function.io
    ...
```

---

## Why Subdomains vs Subdirectories Matters

### Subdirectories (Easier - Single Domain)

If your architecture was:
```
djamms.app/auth       → Easy: Single AppWrite Site
djamms.app/player     → Just use client-side routing
djamms.app/admin      → No server routing needed
```

**This would be trivial** - just one AppWrite Site or one Storage bucket with client-side React Router.

### Subdomains (Your Case - Requires Routing)

But you're using:
```
auth.djamms.app       → Requires server to route to /auth
player.djamms.app     → Requires server to route to /player
admin.djamms.app      → Requires server to route to /admin
```

**This is why you need the Function** - to intercept HTTP requests and route based on the `Host` header.

---

## The Free Tier Solution: AppWrite Function Router

### Function Code (Pseudo-code)

```javascript
// functions/static-router/index.js

export default async ({ req, res, log }) => {
  const host = req.headers['host'];
  const path = req.path || '/';
  
  // Extract subdomain
  const subdomain = host.split('.')[0]; // "auth" from "auth.djamms.app"
  
  // Map subdomain to bucket directory
  const appMap = {
    'auth': 'auth',
    'djamms': 'landing',      // Root domain
    'www': 'landing',
    'player': 'player',
    'admin': 'admin',
    'dashboard': 'dashboard',
    'kiosk': 'kiosk'
  };
  
  const appDir = appMap[subdomain] || 'landing';
  
  // Construct bucket file path
  let filePath = `${appDir}${path}`;
  
  // Handle SPA routing - always serve index.html for non-asset paths
  if (!filePath.includes('.')) {
    filePath = `${appDir}/index.html`;
  }
  
  try {
    // Fetch file from storage bucket
    const storage = new Storage(client);
    const file = await storage.getFileView(
      'static-apps',  // bucketId
      filePath        // fileId (e.g., "auth/index.html")
    );
    
    // Determine content type
    const contentType = getContentType(filePath);
    
    // Return file content
    return res.send(file, 200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    
  } catch (error) {
    log(`File not found: ${filePath}`);
    
    // Fallback to index.html for SPA routing
    const indexPath = `${appDir}/index.html`;
    const indexFile = await storage.getFileView('static-apps', indexPath);
    
    return res.send(indexFile, 200, {
      'Content-Type': 'text/html'
    });
  }
};

function getContentType(path) {
  const ext = path.split('.').pop();
  const types = {
    'html': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}
```

### How It Works

1. **User visits** `auth.djamms.app/callback`
2. **DNS resolves** to AppWrite Function URL
3. **Function extracts** subdomain: `"auth"`
4. **Function maps** to directory: `"auth"`
5. **Function constructs** file path: `"auth/callback"` → no extension → `"auth/index.html"`
6. **Function fetches** from bucket: `storage.getFileView('static-apps', 'auth/index.html')`
7. **Function returns** HTML with proper headers
8. **React app loads** and handles `/callback` route client-side

---

## Free Tier Viability Check

### What You're Using:

| Resource | Limit | Usage | Status |
|----------|-------|-------|--------|
| **Projects** | 2 | 1 (DJAMMS) | ✅ 50% |
| **Databases** | 1 | 1 (existing) | ✅ 100% (OK) |
| **Buckets** | 1 | 1 (static-apps) | ✅ 100% (OK) |
| **Functions** | 5 | 1 (router) + existing | ✅ 20-40% |
| **Storage** | 2GB | ~50-100MB (6 apps) | ✅ 5% |
| **Bandwidth** | 5GB/month | Est. 500MB-1GB | ✅ 10-20% |
| **Executions** | 750K/month | Est. 10K-50K | ✅ 1-7% |

### Conclusion: **FREE TIER IS PERFECT FOR THIS** ✅

You have:
- ✅ Room for 1 more project (future expansion)
- ✅ 4 more functions available (API endpoints, webhooks, etc.)
- ✅ Plenty of bandwidth (5GB = ~5,000 page loads/day at 1MB/page)
- ✅ Plenty of executions (750K = ~25,000/day)

---

## Why NOT Use AppWrite Sites?

After reading the docs, I understand why Sites won't work:

### AppWrite Sites Limitations

1. **One Site = One Git Repo + One Framework Config**
   - Sites are designed for **single applications**
   - Built-in build system expects one `package.json` at root
   - Can't configure multiple build outputs in one Site

2. **Free Tier: Only 1 Site Allowed**
   - You'd need 6 Sites (one per subdomain)
   - Would require paid plan

3. **Sites Are For Git-Based Deployments**
   - Automatic builds from GitHub pushes
   - Not designed for manual monorepo management

### Why Storage + Function Is Better

1. **Manual Control**
   - You control the build process locally
   - Upload only what you need
   - No build time limits

2. **Monorepo Friendly**
   - Build all 6 apps locally: `npm run build --workspaces`
   - Upload all to single bucket
   - Single deployment script

3. **Free Tier Compliant**
   - 1 bucket (allowed)
   - 1 function (allowed)
   - No site limits to worry about

---

## Implementation Strategy

### Phase 1: Deploy Apps to Storage Bucket ✅

1. ✅ **Bucket configured**: `static-apps` already in appwrite.json
2. **Build all apps**:
   ```bash
   npm run build --workspace=apps/auth
   npm run build --workspace=apps/landing
   npm run build --workspace=apps/player
   npm run build --workspace=apps/admin
   npm run build --workspace=apps/dashboard
   npm run build --workspace=apps/kiosk
   ```

3. **Upload with file IDs as paths**:
   ```bash
   # For each file in apps/auth/dist:
   appwrite storage createFile \
     --bucketId="static-apps" \
     --fileId="auth/index.html" \
     --file="apps/auth/dist/index.html" \
     --permissions='read("any")'
   
   appwrite storage createFile \
     --bucketId="static-apps" \
     --fileId="auth/assets/index-Bwx8Rz2_.js" \
     --file="apps/auth/dist/assets/index-Bwx8Rz2_.js" \
     --permissions='read("any")'
   # ... repeat for all files
   ```

### Phase 2: Create Router Function

1. **Create function**:
   ```bash
   appwrite init function
   # Name: static-router
   # Runtime: node-22
   # HTTP trigger: Yes
   ```

2. **Implement routing logic** (see pseudo-code above)

3. **Deploy function**:
   ```bash
   appwrite deploy function
   ```

4. **Get function URL**: e.g., `https://68cc86c3002b27e13947.appwrite.global/functions/static-router`

### Phase 3: Configure DNS

1. **Update all 6 CNAME records at Porkbun**:
   ```
   auth.djamms.app      → CNAME → 68cc86c3002b27e13947.appwrite.global
   djamms.app           → CNAME → 68cc86c3002b27e13947.appwrite.global
   player.djamms.app    → CNAME → 68cc86c3002b27e13947.appwrite.global
   admin.djamms.app     → CNAME → 68cc86c3002b27e13947.appwrite.global
   dashboard.djamms.app → CNAME → 68cc86c3002b27e13947.appwrite.global
   kiosk.djamms.app     → CNAME → 68cc86c3002b27e13947.appwrite.global
   ```

2. **Configure custom domains in AppWrite Console**:
   - Add each domain to the Function
   - AppWrite will generate SSL certificates

### Phase 4: Test & Deploy

1. **Test routing**: Visit each subdomain, verify correct app loads
2. **Test SPA routing**: Navigate to `/callback`, `/dashboard`, etc.
3. **Test magic link**: End-to-end authentication flow

---

## Alternative: Hybrid Approach (RECOMMENDED)

After this analysis, I actually recommend a **hybrid approach**:

### Keep Vercel for Hosting (Fixed Config)

**Pros:**
- ✅ Vercel is **designed** for this (multi-app monorepo)
- ✅ 15-minute fix (root vercel.json with domain rewrites)
- ✅ No custom routing function needed
- ✅ Better performance (Vercel Edge Network)
- ✅ Automatic builds on git push

**Cons:**
- ❌ Keeps custom magic link complexity

### Use AppWrite for Backend Only

**Pros:**
- ✅ Native Magic URL authentication (fixes 404)
- ✅ Simpler auth code
- ✅ Database, Storage, Functions for backend logic
- ✅ Free tier is plenty for backend-only usage

**Implementation:**
1. Fix Vercel config (15 mins) → Hosting works
2. Migrate auth to AppWrite Magic URL (30 mins) → 404 fixed
3. Best of both worlds!

---

## Final Recommendation

### Option A: Full AppWrite Migration (2-3 hours)
**Choose if:** You want full control, learning experience, all-in on AppWrite

**Steps:**
1. Create storage bucket ✅ (already done)
2. Upload all apps to bucket (30 mins)
3. Create router function (60 mins)
4. Configure DNS (15 mins)
5. Test thoroughly (30 mins)

### Option B: Vercel + AppWrite Hybrid (45 mins) ⭐ **RECOMMENDED**
**Choose if:** You want pragmatic solution, faster time to production

**Steps:**
1. Fix Vercel root config (15 mins) → hosting works immediately
2. Migrate auth to AppWrite Magic URL (30 mins) → 404 fixed
3. Done!

### Option C: Full Vercel (30 mins via Option A in VERCEL_QUICK_FIX.md)
**Choose if:** You want minimal changes, keep everything as-is

---

## Cost Analysis

### Free Tier Sustainability

**Current Usage Estimates:**
- 10 users/day × 5 pages/user × 30 days = **1,500 page loads/month**
- Each page load = 1 HTML + 3 assets = **4 API calls**
- Total API calls = 1,500 × 4 = **6,000/month**
- Bandwidth = 1,500 × 1MB = **1.5GB/month**

**Free Tier Limits:**
- ✅ Executions: 750,000/month (you'd use 6,000 = 0.8%)
- ✅ Bandwidth: 5GB/month (you'd use 1.5GB = 30%)
- ✅ Storage: 2GB (you'd use ~100MB = 5%)

**Scaling Headroom:**
- Can support **10x traffic** (100 users/day) before hitting limits
- At 100 users/day: 60,000 API calls, still only 8% of execution limit

### When to Upgrade?

**Upgrade to Pro ($15/month) when:**
- Traffic > 50,000 page loads/month
- Storage > 2GB
- Need > 1 database or > 1 bucket (Not relevant with single bucket approach)
- Need > 5 functions

**For now: FREE TIER IS PERFECT** ✅

---

## Answer to Your Question

> **Q: WHY do we need the application split over six different projects, versus a single monorepo?**

**A: You DON'T need 6 projects!** You can use a single AppWrite project with:
- 1 storage bucket
- 1 routing function
- Subdirectories in bucket (virtual folders)

> **Q: Is the issue primarily due to the use of subdomains versus subdirectories for endpoints?**

**A: YES, exactly!** 

If you used:
- `djamms.app/auth` 
- `djamms.app/player`
- `djamms.app/admin`

→ **Single React app with React Router** (simplest, no server routing needed)

But you're using:
- `auth.djamms.app`
- `player.djamms.app`
- `admin.djamms.app`

→ **Need server-side routing** (Function or Vercel config) to map subdomains to apps

The subdomain architecture adds one layer of complexity (routing), but it's absolutely **manageable on Free Tier** with the Function approach.

---

## Next Steps

**What's your preference?**

1. **Full AppWrite** - I'll create the router function and upload script
2. **Hybrid (Recommended)** - I'll fix Vercel config + migrate auth to AppWrite
3. **Keep Vercel** - I'll implement the quick fix from VERCEL_QUICK_FIX.md

All three are viable on Free Tier. Option 2 is fastest to production (45 mins total).
