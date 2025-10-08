# Vercel Environment Variables - Optimized Copy-Paste Format

## 🎯 Strategy: Copy Common Variables Once, Paste 6 Times

Instead of individually adding 70+ variables, we'll:
1. Add the **10 common variables** to all 6 projects (copy-paste 6x)
2. Add **app-specific variables** only where needed

**Time savings: 30-35 minutes → 15-20 minutes**

---

## Step 1: Common Variables (Add to ALL 6 projects)

Copy these 10 variables and paste into each project. Open all 6 environment variable pages in tabs:

- [djamms-landing](https://vercel.com/djamms-admins-projects/djamms-landing/settings/environment-variables)
- [djamms-auth](https://vercel.com/djamms-admins-projects/djamms-auth/settings/environment-variables)
- [djamms-player](https://vercel.com/djamms-admins-projects/djamms-player/settings/environment-variables)
- [djamms-admin](https://vercel.com/djamms-admins-projects/djamms-admin/settings/environment-variables)
- [djamms-kiosk](https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/environment-variables)
- [djamms-dashboard](https://vercel.com/djamms-admins-projects/djamms-dashboard/settings/environment-variables)

### Core AppWrite Config (add to ALL 6)

```
Key: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_DATABASE_ID
Value: 68e57de9003234a84cae
Environments: Production, Preview, Development
```

```
Key: VITE_JWT_SECRET
Value: 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
Environments: Production, Preview, Development
```

### App URLs (add to ALL 6)

```
Key: VITE_LANDING_URL
Value: https://djamms.app
Environments: Production, Preview, Development
```

```
Key: VITE_AUTH_URL
Value: https://auth.djamms.app
Environments: Production, Preview, Development
```

```
Key: VITE_PLAYER_URL
Value: https://player.djamms.app
Environments: Production, Preview, Development
```

```
Key: VITE_ADMIN_URL
Value: https://admin.djamms.app
Environments: Production, Preview, Development
```

```
Key: VITE_DASHBOARD_URL
Value: https://dashboard.djamms.app
Environments: Production, Preview, Development
```

```
Key: VITE_KIOSK_URL
Value: https://kiosk.djamms.app
Environments: Production, Preview, Development
```

---

## Step 2: App-Specific Variables

### djamms-landing (DONE - already has common vars)

No additional variables needed! ✅

---

### djamms-auth (add 3 more)

```
Key: VITE_APPWRITE_USERS_COLLECTION_ID
Value: users
Environments: Production, Preview, Development
```

```
Key: VITE_AUTH_MAGIC_LINK_FUNCTION_ID
Value: authmagiclink
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_MAGIC_REDIRECT
Value: https://auth.djamms.app/auth/callback
Environments: Production, Preview, Development
```

---

### djamms-player (add 6 more)

```
Key: VITE_APPWRITE_USERS_COLLECTION_ID
Value: users
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_VENUES_COLLECTION_ID
Value: venues
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_QUEUE_COLLECTION_ID
Value: queue
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_NOW_PLAYING_COLLECTION_ID
Value: nowplaying
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_TRACKS_COLLECTION_ID
Value: tracks
Environments: Production, Preview, Development
```

```
Key: VITE_YOUTUBE_API_KEY
Value: AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
Environments: Production, Preview, Development
```

```
Key: VITE_PROCESS_REQUEST_FUNCTION_ID
Value: processRequest
Environments: Production, Preview, Development
```

---

### djamms-admin (add 6 more)

```
Key: VITE_APPWRITE_USERS_COLLECTION_ID
Value: users
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_VENUES_COLLECTION_ID
Value: venues
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_QUEUE_COLLECTION_ID
Value: queue
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_NOW_PLAYING_COLLECTION_ID
Value: nowplaying
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_TRACKS_COLLECTION_ID
Value: tracks
Environments: Production, Preview, Development
```

```
Key: VITE_PROCESS_REQUEST_FUNCTION_ID
Value: processRequest
Environments: Production, Preview, Development
```

---

### djamms-kiosk (add 5 more)

```
Key: VITE_APPWRITE_USERS_COLLECTION_ID
Value: users
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_VENUES_COLLECTION_ID
Value: venues
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_QUEUE_COLLECTION_ID
Value: queue
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_TRACKS_COLLECTION_ID
Value: tracks
Environments: Production, Preview, Development
```

```
Key: VITE_PROCESS_REQUEST_FUNCTION_ID
Value: processRequest
Environments: Production, Preview, Development
```

---

### djamms-dashboard (add 5 more)

```
Key: VITE_APPWRITE_USERS_COLLECTION_ID
Value: users
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_VENUES_COLLECTION_ID
Value: venues
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_QUEUE_COLLECTION_ID
Value: queue
Environments: Production, Preview, Development
```

```
Key: VITE_APPWRITE_TRACKS_COLLECTION_ID
Value: tracks
Environments: Production, Preview, Development
```

```
Key: VITE_PROCESS_REQUEST_FUNCTION_ID
Value: processRequest
Environments: Production, Preview, Development
```

---

## 📊 Time Breakdown

**Step 1: Common variables (10 vars × 6 projects)**
- Open 6 tabs: 1 min
- Add 10 vars to each project: ~10 min (1 min per project)
- **Subtotal: 11 minutes**

**Step 2: App-specific variables**
- Landing: 0 vars (already done)
- Auth: 3 vars → 2 min
- Player: 7 vars → 4 min
- Admin: 6 vars → 3 min  
- Kiosk: 5 vars → 3 min
- Dashboard: 5 vars → 3 min
- **Subtotal: 15 minutes**

**Total: ~26 minutes** vs 35+ minutes doing it the old way

---

## ✅ Verification Checklist

After adding all variables:

**Landing (10 total):**
- [ ] 4 core AppWrite vars
- [ ] 6 app URL vars

**Auth (13 total):**
- [ ] 4 core AppWrite vars
- [ ] 6 app URL vars
- [ ] 3 auth-specific vars

**Player (17 total):**
- [ ] 4 core AppWrite vars
- [ ] 6 app URL vars
- [ ] 7 player-specific vars

**Admin (16 total):**
- [ ] 4 core AppWrite vars
- [ ] 6 app URL vars
- [ ] 6 admin-specific vars

**Kiosk (15 total):**
- [ ] 4 core AppWrite vars
- [ ] 6 app URL vars
- [ ] 5 kiosk-specific vars

**Dashboard (15 total):**
- [ ] 4 core AppWrite vars
- [ ] 6 app URL vars
- [ ] 5 dashboard-specific vars

---

## 🚀 After Adding Variables

For each project, go to **Deployments** and click **Redeploy** to apply the new environment variables.

Then verify each deployment succeeds! ✅
