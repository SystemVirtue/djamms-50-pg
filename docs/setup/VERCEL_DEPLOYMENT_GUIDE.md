# DJAMMS - Vercel Deployment Guide

## 🚀 Complete Production Deployment to Vercel

This guide walks you through deploying all 6 DJAMMS apps to Vercel with custom domains.

---

## 📋 Prerequisites

- [x] GitHub repository: https://github.com/SystemVirtue/djamms-50-pg
- [x] Domain: djamms.app (configured on Porkbun)
- [x] AppWrite project configured and running
- [x] All environment variables from .env file

---

## 🛠️ Step 1: Install Vercel CLI

```bash
# Install globally
npm install -g vercel

# Login to Vercel
vercel login
```

Follow the prompts to authenticate with your GitHub account.

---

## 📦 Step 2: Link GitHub Repository to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `SystemVirtue/djamms-50-pg`
4. **DO NOT** deploy yet - we need to configure each app separately

### Option B: Via CLI

```bash
# From project root
vercel link
```

---

## 🎯 Step 3: Deploy Each App

You'll deploy each app as a **separate Vercel project** with its own domain.

### 3.1 Deploy Landing Page

```bash
cd apps/landing

# Initialize and deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? djamms-landing
# - Directory: ./apps/landing
# - Override settings? No

# Deploy to production
vercel --prod
```

**Set custom domain:**
1. Go to: https://vercel.com/your-username/djamms-landing/settings/domains
2. Add domain: `djamms.app`
3. Vercel will provide DNS records

### 3.2 Deploy Auth App

```bash
cd apps/auth

vercel

# Prompts:
# - Project name? djamms-auth
# - Directory: ./apps/auth

vercel --prod
```

**Set custom domain:**
- Add domain: `auth.djamms.app`

### 3.3 Deploy Player App

```bash
cd apps/player

vercel

# Prompts:
# - Project name? djamms-player
# - Directory: ./apps/player

vercel --prod
```

**Set custom domain:**
- Add domain: `player.djamms.app`

### 3.4 Deploy Admin App

```bash
cd apps/admin

vercel

# Prompts:
# - Project name? djamms-admin
# - Directory: ./apps/admin

vercel --prod
```

**Set custom domain:**
- Add domain: `admin.djamms.app`

### 3.5 Deploy Kiosk App

```bash
cd apps/kiosk

vercel

# Prompts:
# - Project name? djamms-kiosk
# - Directory: ./apps/kiosk

vercel --prod
```

**Set custom domain:**
- Add domain: `kiosk.djamms.app`

### 3.6 Deploy Dashboard App

```bash
cd apps/dashboard

vercel

# Prompts:
# - Project name? djamms-dashboard
# - Directory: ./apps/dashboard

vercel --prod
```

**Set custom domain:**
- Add domain: `dashboard.djamms.app`

---

## 🔐 Step 4: Configure Environment Variables

For **EACH** Vercel project, you need to add environment variables:

### Go to Project Settings

```
https://vercel.com/your-username/PROJECT_NAME/settings/environment-variables
```

### Add These Variables (Common to All Apps)

```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
VITE_JWT_SECRET=9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
```

### Add These Variables (App-Specific)

#### **djamms-landing**
```bash
VITE_APP_URL_LANDING=https://djamms.app
VITE_APP_URL_AUTH=https://auth.djamms.app
VITE_APP_URL_PLAYER=https://player.djamms.app
VITE_APP_URL_ADMIN=https://admin.djamms.app
VITE_APP_URL_KIOSK=https://kiosk.djamms.app
VITE_APP_URL_DASHBOARD=https://dashboard.djamms.app
```

#### **djamms-auth**
```bash
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/auth/callback
VITE_APP_URL_LANDING=https://djamms.app
VITE_APP_URL_PLAYER=https://player.djamms.app
VITE_ALLOW_AUTO_CREATE_USERS=false
```

#### **djamms-player**
```bash
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY=68e5a41f00222cab705b
VITE_YOUTUBE_API_KEY=AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
VITE_APP_URL_AUTH=https://auth.djamms.app
VITE_APP_URL_ADMIN=https://admin.djamms.app
```

#### **djamms-admin**
```bash
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=68e5a5a1001a19e7f5c2
VITE_APP_URL_AUTH=https://auth.djamms.app
VITE_APP_URL_PLAYER=https://player.djamms.app
```

#### **djamms-kiosk**
```bash
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=68e5a5a1001a19e7f5c2
VITE_YOUTUBE_API_KEY=AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
VITE_APP_URL_AUTH=https://auth.djamms.app
```

#### **djamms-dashboard**
```bash
VITE_APP_URL_AUTH=https://auth.djamms.app
VITE_APP_URL_PLAYER=https://player.djamms.app
VITE_APP_URL_ADMIN=https://admin.djamms.app
```

**Important:** Set environment variables for **Production**, **Preview**, and **Development** environments.

---

## 🌐 Step 5: Update DNS Records (Porkbun)

Vercel will provide you with DNS records. Update your Porkbun DNS:

### Update Existing Records

```
Type    Name                    Value                           TTL
----    ----                    -----                           ---
ALIAS   djamms.app              cname.vercel-dns.com           600
CNAME   auth.djamms.app         cname.vercel-dns.com           600
CNAME   player.djamms.app       cname.vercel-dns.com           600
CNAME   admin.djamms.app        cname.vercel-dns.com           600
CNAME   kiosk.djamms.app        cname.vercel-dns.com           600
CNAME   dashboard.djamms.app    cname.vercel-dns.com           600
```

**Keep this record for AppWrite:**
```
CNAME   68e5a36e0021b938b3a7.djamms.app   syd.cloud.appwrite.io   600
```

**Wait 10-15 minutes** for DNS propagation.

---

## 🧪 Step 6: Test Your Deployment

### Verify DNS Propagation

```bash
dig djamms.app
dig auth.djamms.app
dig player.djamms.app
dig admin.djamms.app
dig kiosk.djamms.app
dig dashboard.djamms.app
```

### Test Each App

1. **Landing**: https://djamms.app
   - Click "Login" button
   - Should redirect to https://auth.djamms.app

2. **Auth**: https://auth.djamms.app/auth/login
   - Enter email
   - Check browser console for magic link
   - Click the link to authenticate

3. **Player**: https://player.djamms.app/player/venue1
   - Should auto-register as master player
   - Check localStorage for JWT token

4. **Admin**: https://admin.djamms.app/admin/venue1
   - Should show real-time queue
   - Test adding songs

5. **Kiosk**: https://kiosk.djamms.app/kiosk/venue1
   - Search for songs
   - Submit requests

---

## 🔄 Step 7: Enable Auto-Deployments

For each Vercel project:

1. Go to: **Settings → Git**
2. Enable: **Automatic Deployments from Git**
3. Configure:
   - Production Branch: `main`
   - Preview Branches: All branches

Now every push to GitHub will:
- Deploy to production (main branch)
- Create preview deployments (other branches)

---

## 📊 Deployment Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Production Endpoints                                        │
├─────────────────────────────────────────────────────────────┤
│ https://djamms.app              → Landing (Vercel)         │
│ https://auth.djamms.app         → Auth (Vercel)            │
│ https://player.djamms.app       → Player (Vercel)          │
│ https://admin.djamms.app        → Admin (Vercel)           │
│ https://kiosk.djamms.app        → Kiosk (Vercel)           │
│ https://dashboard.djamms.app    → Dashboard (Vercel)       │
│ https://syd.cloud.appwrite.io   → Backend (AppWrite)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### Build Failures

**Issue:** Vercel build fails with TypeScript errors

**Solution:**
```bash
# Test build locally first
npm run build

# If successful, redeploy
vercel --prod --force
```

### Environment Variables Not Loading

**Issue:** App can't connect to AppWrite

**Solution:**
1. Check Vercel dashboard → Project → Settings → Environment Variables
2. Ensure all `VITE_*` variables are set
3. Redeploy: `vercel --prod`

### CORS Errors

**Issue:** Browser console shows CORS errors from AppWrite

**Solution:**
1. Go to AppWrite Console → Settings → Platforms
2. Add web platform with domain: `https://auth.djamms.app`
3. Add platforms for all subdomains
4. Clear browser cache

### Magic Links Not Working

**Issue:** Magic link redirects fail

**Solution:**
1. Update `.env` magic redirect URL
2. Update AppWrite function allowed domains
3. Redeploy auth app

### DNS Not Resolving

**Issue:** Subdomains show "Not Found"

**Solution:**
1. Wait 15-30 minutes for DNS propagation
2. Verify DNS records on Porkbun
3. Use `dig subdomain.djamms.app` to check

---

## 💰 Vercel Pricing

### Hobby (Free)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Custom domains with SSL
- ✅ Automatic HTTPS
- ⚠️ No team collaboration

### Pro ($20/month per user)
- ✅ Everything in Hobby
- ✅ 1TB bandwidth/month
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Password protection
- ✅ Priority support

**Recommendation:** Start with **Hobby (Free)** for MVP, upgrade to **Pro** when scaling.

---

## 📝 Next Steps After Deployment

1. **Update AppWrite Allowed Origins**
   - Add all production domains to AppWrite console
   
2. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking (Sentry)
   
3. **Configure Email Service**
   - Implement SendGrid for magic link emails
   - See EMAIL_ANALYSIS.md for setup
   
4. **Enable HTTPS Everywhere**
   - Vercel handles SSL automatically
   - Ensure all links use `https://`
   
5. **Test End-to-End Flow**
   - Register as master player
   - Submit song requests
   - Test real-time sync across venues

---

## 🎉 Deployment Complete!

Your DJAMMS app is now live on production domains with:
- ✅ Custom domains (djamms.app)
- ✅ SSL certificates (automatic)
- ✅ CDN edge caching (global)
- ✅ Auto-deployments from GitHub
- ✅ Environment variables secured
- ✅ AppWrite backend connected

**Total setup time:** ~30-45 minutes

**Monthly cost:** $0 (Hobby tier) or $20 (Pro tier)

---

## 📚 Additional Resources

- Vercel Documentation: https://vercel.com/docs
- AppWrite Documentation: https://appwrite.io/docs
- GitHub Repo: https://github.com/SystemVirtue/djamms-50-pg
- Project Guidelines: .github/copilot-instructions.md

**Need help?** Check the troubleshooting section or review the deployment logs on Vercel dashboard.
