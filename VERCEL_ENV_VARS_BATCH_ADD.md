# Add Environment Variables to All Vercel Projects

## Quick Links
- [djamms-landing](https://vercel.com/djamms-admins-projects/djamms-landing/settings/environment-variables)
- [djamms-auth](https://vercel.com/djamms-admins-projects/djamms-auth/settings/environment-variables)
- [djamms-player](https://vercel.com/djamms-admins-projects/djamms-player/settings/environment-variables)
- [djamms-admin](https://vercel.com/djamms-admins-projects/djamms-admin/settings/environment-variables)
- [djamms-kiosk](https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/environment-variables)
- [djamms-dashboard](https://vercel.com/djamms-admins-projects/djamms-dashboard/settings/environment-variables)

---

## Step-by-Step Process

For EACH project, follow these steps:

1. **Open the environment variables page** (use links above)
2. **Copy-paste ALL variables** for that app from sections below
3. **Select all 3 environments**: Production, Preview, Development
4. **Click "Save"** after each variable
5. **Redeploy** when done (Deployments tab → "..." → Redeploy)

---

## 1. djamms-landing

**Add these 4 variables:**

```
VITE_APPWRITE_ENDPOINT
https://syd.cloud.appwrite.io/v1
```

```
VITE_APPWRITE_PROJECT_ID
6796bf840008e3c4b9a0
```

```
VITE_AUTH_URL
https://auth.djamms.app
```

```
VITE_PLAYER_URL
https://player.djamms.app
```

---

## 2. djamms-auth

**Add these 8 variables:**

```
VITE_APPWRITE_ENDPOINT
https://syd.cloud.appwrite.io/v1
```

```
VITE_APPWRITE_PROJECT_ID
6796bf840008e3c4b9a0
```

```
VITE_APPWRITE_DATABASE_ID
djamms-db
```

```
VITE_APPWRITE_USERS_COLLECTION_ID
users
```

```
VITE_AUTH_MAGIC_LINK_FUNCTION_ID
authmagiclink
```

```
VITE_JWT_SECRET
your-super-secret-jwt-key-change-this-in-production
```

```
VITE_LANDING_URL
https://djamms.app
```

```
VITE_PLAYER_URL
https://player.djamms.app
```

---

## 3. djamms-player

**Add these 14 variables:**

```
VITE_APPWRITE_ENDPOINT
https://syd.cloud.appwrite.io/v1
```

```
VITE_APPWRITE_PROJECT_ID
6796bf840008e3c4b9a0
```

```
VITE_APPWRITE_DATABASE_ID
djamms-db
```

```
VITE_APPWRITE_USERS_COLLECTION_ID
users
```

```
VITE_APPWRITE_VENUES_COLLECTION_ID
venues
```

```
VITE_APPWRITE_QUEUE_COLLECTION_ID
queue
```

```
VITE_APPWRITE_NOW_PLAYING_COLLECTION_ID
nowplaying
```

```
VITE_APPWRITE_TRACKS_COLLECTION_ID
tracks
```

```
VITE_JWT_SECRET
your-super-secret-jwt-key-change-this-in-production
```

```
VITE_YOUTUBE_API_KEY
YOUR_YOUTUBE_API_KEY_HERE
```

```
VITE_PROCESS_REQUEST_FUNCTION_ID
processRequest
```

```
VITE_LANDING_URL
https://djamms.app
```

```
VITE_AUTH_URL
https://auth.djamms.app
```

```
VITE_DASHBOARD_URL
https://dashboard.djamms.app
```

---

## 4. djamms-admin

**Add these 14 variables:**

```
VITE_APPWRITE_ENDPOINT
https://syd.cloud.appwrite.io/v1
```

```
VITE_APPWRITE_PROJECT_ID
6796bf840008e3c4b9a0
```

```
VITE_APPWRITE_DATABASE_ID
djamms-db
```

```
VITE_APPWRITE_USERS_COLLECTION_ID
users
```

```
VITE_APPWRITE_VENUES_COLLECTION_ID
venues
```

```
VITE_APPWRITE_QUEUE_COLLECTION_ID
queue
```

```
VITE_APPWRITE_NOW_PLAYING_COLLECTION_ID
nowplaying
```

```
VITE_APPWRITE_TRACKS_COLLECTION_ID
tracks
```

```
VITE_JWT_SECRET
your-super-secret-jwt-key-change-this-in-production
```

```
VITE_PROCESS_REQUEST_FUNCTION_ID
processRequest
```

```
VITE_LANDING_URL
https://djamms.app
```

```
VITE_AUTH_URL
https://auth.djamms.app
```

```
VITE_PLAYER_URL
https://player.djamms.app
```

```
VITE_DASHBOARD_URL
https://dashboard.djamms.app
```

---

## 5. djamms-kiosk

**Add these 13 variables:**

```
VITE_APPWRITE_ENDPOINT
https://syd.cloud.appwrite.io/v1
```

```
VITE_APPWRITE_PROJECT_ID
6796bf840008e3c4b9a0
```

```
VITE_APPWRITE_DATABASE_ID
djamms-db
```

```
VITE_APPWRITE_USERS_COLLECTION_ID
users
```

```
VITE_APPWRITE_VENUES_COLLECTION_ID
venues
```

```
VITE_APPWRITE_QUEUE_COLLECTION_ID
queue
```

```
VITE_APPWRITE_TRACKS_COLLECTION_ID
tracks
```

```
VITE_JWT_SECRET
your-super-secret-jwt-key-change-this-in-production
```

```
VITE_PROCESS_REQUEST_FUNCTION_ID
processRequest
```

```
VITE_LANDING_URL
https://djamms.app
```

```
VITE_AUTH_URL
https://auth.djamms.app
```

```
VITE_PLAYER_URL
https://player.djamms.app
```

```
VITE_DASHBOARD_URL
https://dashboard.djamms.app
```

---

## 6. djamms-dashboard

**Add these 13 variables:**

```
VITE_APPWRITE_ENDPOINT
https://syd.cloud.appwrite.io/v1
```

```
VITE_APPWRITE_PROJECT_ID
6796bf840008e3c4b9a0
```

```
VITE_APPWRITE_DATABASE_ID
djamms-db
```

```
VITE_APPWRITE_USERS_COLLECTION_ID
users
```

```
VITE_APPWRITE_VENUES_COLLECTION_ID
venues
```

```
VITE_APPWRITE_QUEUE_COLLECTION_ID
queue
```

```
VITE_APPWRITE_TRACKS_COLLECTION_ID
tracks
```

```
VITE_JWT_SECRET
your-super-secret-jwt-key-change-this-in-production
```

```
VITE_PROCESS_REQUEST_FUNCTION_ID
processRequest
```

```
VITE_LANDING_URL
https://djamms.app
```

```
VITE_AUTH_URL
https://auth.djamms.app
```

```
VITE_PLAYER_URL
https://player.djamms.app
```

```
VITE_ADMIN_URL
https://admin.djamms.app
```

---

## Important Notes

### YouTube API Key
Replace `YOUR_YOUTUBE_API_KEY_HERE` with your actual YouTube Data API v3 key from:
https://console.cloud.google.com/apis/credentials

### JWT Secret
⚠️ **CRITICAL**: Change `your-super-secret-jwt-key-change-this-in-production` to a secure random string!

Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Environment Selection
**ALWAYS select all 3 environments** when adding each variable:
- ✅ Production
- ✅ Preview  
- ✅ Development

This ensures consistency across all deployments.

---

## After Adding Variables

For EACH project:

1. **Go to Deployments tab**
2. **Click "..." on latest deployment**
3. **Select "Redeploy"**
4. **Wait for build to complete** (should succeed now with env vars)
5. **Verify** by visiting the project URL

---

## Time Estimate

- Landing: ~2 minutes (4 variables)
- Auth: ~4 minutes (8 variables)
- Player: ~7 minutes (14 variables)
- Admin: ~7 minutes (14 variables)
- Kiosk: ~6 minutes (13 variables)
- Dashboard: ~6 minutes (13 variables)

**Total: ~30-35 minutes** if you copy-paste efficiently

---

## Verification Checklist

After adding all variables and redeploying:

- [ ] djamms-landing deployment successful
- [ ] djamms-auth deployment successful
- [ ] djamms-player deployment successful
- [ ] djamms-admin deployment successful
- [ ] djamms-kiosk deployment successful
- [ ] djamms-dashboard deployment successful

Then move on to custom domain setup! 🚀
