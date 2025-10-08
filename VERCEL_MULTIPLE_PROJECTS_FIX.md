# 🚨 Multiple Apps Issue - Solution

## Problem

All your apps deployed to the same "landing" project in Vercel. This happened because:
1. We're deploying from the project root
2. The `.vercel` folder links to a specific project
3. Each deployment reused that same project

## Solution: Deploy Each App as a Separate Project

You need to **manually create separate Vercel projects** for each app. Here's how:

---

## 🛠️ Method 1: Via Vercel Dashboard (Recommended)

### Step 1: Import Your GitHub Repo 6 Times

For each app, you'll:

1. **Go to:** https://vercel.com/new
2. **Select:** SystemVirtue/djamms-50-pg
3. **Configure project:**
   - **Project Name:** `djamms-auth` (or player, admin, etc.)
   - **Framework Preset:** Other
   - **Root Directory:** Leave as `./` (root)
   - **Build Command:** Override with `npm run build:auth`
   - **Output Directory:** Override with `apps/auth/dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables** (before deploying)
5. **Click Deploy**

**Repeat for all 6 apps:**
- djamms-landing (✅ already exists)
- djamms-auth
- djamms-player
- djamms-admin
- djamms-kiosk
- djamms-dashboard

---

## 🛠️ Method 2: Via CLI (More Complex)

Since all apps are currently in the "landing" project, we need to start fresh:

### Step 1: Remove .vercel Link
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
rm -rf .vercel
```

### Step 2: Deploy Auth App (New Project)
```bash
# Update vercel.json for auth
cat > vercel.json <<EOF
{
  "buildCommand": "npm run build:auth",
  "outputDirectory": "apps/auth/dist",
  "installCommand": "npm install"
}
EOF

# Deploy (will prompt to create NEW project)
vercel --prod

# When prompted:
# - Create new project? YES
# - Project name? djamms-auth
```

### Step 3: Remove .vercel Link Again
```bash
rm -rf .vercel
```

### Step 4: Repeat for Each App
```bash
# Player
cat > vercel.json <<EOF
{
  "buildCommand": "npm run build:player",
  "outputDirectory": "apps/player/dist",
  "installCommand": "npm install"
}
EOF
vercel --prod
# Name it: djamms-player
rm -rf .vercel

# Admin
cat > vercel.json <<EOF
{
  "buildCommand": "npm run build:admin",
  "outputDirectory": "apps/admin/dist",
  "installCommand": "npm install"
}
EOF
vercel --prod
# Name it: djamms-admin
rm -rf .vercel

# Kiosk
cat > vercel.json <<EOF
{
  "buildCommand": "npm run build:kiosk",
  "outputDirectory": "apps/kiosk/dist",
  "installCommand": "npm install"
}
EOF
vercel --prod
# Name it: djamms-kiosk
rm -rf .vercel

# Dashboard
cat > vercel.json <<EOF
{
  "buildCommand": "npm run build:dashboard",
  "outputDirectory": "apps/dashboard/dist",
  "installCommand": "npm install"
}
EOF
vercel --prod
# Name it: djamms-dashboard
rm -rf .vercel
```

---

## 🎯 Recommended Approach: Use Vercel Dashboard

**Method 1 (Dashboard) is easier** because:
- ✅ Visual interface
- ✅ Can add env vars before first deploy
- ✅ No risk of mistakes
- ✅ All projects visible immediately

**Method 2 (CLI) is tedious** because:
- ⚠️ Have to remove .vercel each time
- ⚠️ Easy to make mistakes
- ⚠️ Can't add env vars during setup

---

## 📋 Dashboard Deployment Checklist

### 1. Auth App
- [ ] Go to https://vercel.com/new
- [ ] Import: SystemVirtue/djamms-50-pg
- [ ] Name: djamms-auth
- [ ] Build: `npm run build:auth`
- [ ] Output: `apps/auth/dist`
- [ ] Add environment variables
- [ ] Deploy

### 2. Player App
- [ ] Go to https://vercel.com/new
- [ ] Import: SystemVirtue/djamms-50-pg
- [ ] Name: djamms-player
- [ ] Build: `npm run build:player`
- [ ] Output: `apps/player/dist`
- [ ] Add environment variables
- [ ] Deploy

### 3. Admin App
- [ ] Go to https://vercel.com/new
- [ ] Import: SystemVirtue/djamms-50-pg
- [ ] Name: djamms-admin
- [ ] Build: `npm run build:admin`
- [ ] Output: `apps/admin/dist`
- [ ] Add environment variables
- [ ] Deploy

### 4. Kiosk App
- [ ] Go to https://vercel.com/new
- [ ] Import: SystemVirtue/djamms-50-pg
- [ ] Name: djamms-kiosk
- [ ] Build: `npm run build:kiosk`
- [ ] Output: `apps/kiosk/dist`
- [ ] Add environment variables
- [ ] Deploy

### 5. Dashboard App
- [ ] Go to https://vercel.com/new
- [ ] Import: SystemVirtue/djamms-50-pg
- [ ] Name: djamms-dashboard
- [ ] Build: `npm run build:dashboard`
- [ ] Output: `apps/dashboard/dist`
- [ ] Add environment variables
- [ ] Deploy

---

## 🎬 Step-by-Step: Create Auth App via Dashboard

1. **Open:** https://vercel.com/new

2. **Click "Add New..." → Project**

3. **Import Git Repository:**
   - Search for: `djamms-50-pg`
   - Click "Import"

4. **Configure Project:**
   - Project Name: `djamms-auth`
   - Framework Preset: `Other`
   - Root Directory: `./` (leave default)

5. **Build and Output Settings:**
   Click "Override" and set:
   - Build Command: `npm run build:auth`
   - Output Directory: `apps/auth/dist`
   - Install Command: `npm install`

6. **Environment Variables:**
   Click "Add" and add these:
   ```
   VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
   VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
   VITE_APPWRITE_FUNCTION_MAGIC_LINK = 68e5a317003c42c8bb6a
   VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
   VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/auth/callback
   VITE_ALLOW_AUTO_CREATE_USERS = false
   ```

7. **Click "Deploy"**

8. **Wait ~2 minutes** for deployment to complete

9. **Repeat for other apps!**

---

## 🔄 After All Apps Are Created

You'll have 6 separate Vercel projects:
```
djamms-landing   → djamms.app
djamms-auth      → auth.djamms.app
djamms-player    → player.djamms.app
djamms-admin     → admin.djamms.app
djamms-kiosk     → kiosk.djamms.app
djamms-dashboard → dashboard.djamms.app
```

Each with:
- ✅ Own environment variables
- ✅ Own deployment history
- ✅ Own custom domain
- ✅ Auto-deploy from GitHub

---

## 🎉 Result

When you visit your Vercel dashboard, you'll see **6 projects** instead of 1.

Each project independently deploys when you push to GitHub (once auto-deploy is enabled).

---

## 💡 Why This Happened

The issue was deploying from the root directory with a changing `vercel.json`. Vercel linked to the first project created ("landing") and all subsequent deploys went there.

The solution is to create each project separately, either via the dashboard or by clearing the `.vercel` folder between deployments.

---

## ⏱️ Time Estimate

- **Dashboard method:** 30-40 minutes (5-7 min per app)
- **CLI method:** 20-30 minutes (but more error-prone)

**Recommendation:** Use the dashboard! It's more reliable and you can add environment variables during setup.
