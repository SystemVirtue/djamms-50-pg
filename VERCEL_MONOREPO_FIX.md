# 🚀 Vercel Monorepo Deployment - FIXED

## ✅ Issue Fixed: Monorepo Path Configuration

The `vercel.json` files have been updated to work correctly with the monorepo structure.

**Problem:** Vercel was trying to run `npm install` in the `apps/landing` directory, but there's no `package.json` there (it's in the project root).

**Solution:** Updated all `vercel.json` files to:
- Install from project root: `cd ../.. && npm install`
- Build from project root: `cd ../.. && npm run build:landing`
- Output to correct path: `apps/landing/dist`

---

## 🚀 Deploy Now (Fixed Commands)

### From the Landing Directory:

```bash
cd apps/landing
vercel --prod
```

This should now work! ✅

---

## 📋 What Changed in vercel.json

### Before (Broken):
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### After (Working):
```json
{
  "installCommand": "cd ../.. && npm install",
  "buildCommand": "cd ../.. && npm run build:landing",
  "outputDirectory": "apps/landing/dist"
}
```

---

## 🎯 Deploy All Apps

```bash
# Landing
cd apps/landing
vercel --prod

# Auth
cd ../auth
vercel --prod

# Player
cd ../player
vercel --prod

# Admin
cd ../admin
vercel --prod

# Kiosk
cd ../kiosk
vercel --prod

# Dashboard
cd ../dashboard
vercel --prod
```

Each deployment will:
1. Navigate to project root
2. Install all dependencies
3. Build the specific app
4. Deploy from the correct dist folder

---

## ⚠️ After First Deployment

**Don't forget to add environment variables!**

For each app, go to:
```
https://vercel.com/[username]/[project-name]/settings/environment-variables
```

See `VERCEL_DEPLOYMENT_STEPBYSTEP.md` for the complete list of variables per app.

---

## 🧪 Test Build Locally First

Before deploying, you can test the build:

```bash
npm run build:landing
npm run build:auth
npm run build:player
npm run build:admin
npm run build:kiosk
npm run build:dashboard
```

If these work locally, they'll work on Vercel! ✅

---

## 📊 Deployment Process

```
1. You run: cd apps/landing && vercel --prod
2. Vercel uploads files from apps/landing/
3. Vercel runs: cd ../.. && npm install (installs from root)
4. Vercel runs: cd ../.. && npm run build:landing (builds from root)
5. Vercel deploys: apps/landing/dist/ (correct output path)
6. Done! ✅
```

---

## 🎉 Ready to Deploy!

The configuration is now correct for monorepo deployment. Run:

```bash
cd apps/landing
vercel --prod
```

It should deploy successfully! 🚀

---

## 📚 Related Docs

- **Full Guide:** `VERCEL_DEPLOYMENT_STEPBYSTEP.md`
- **Environment Variables:** Listed in step-by-step guide
- **Quick Reference:** `VERCEL_QUICKSTART.md`
