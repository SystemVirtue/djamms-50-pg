# 🚀 Vercel Deployment - Step-by-Step Guide

## ✅ Issue Fixed: Environment Variable References

The `vercel.json` files have been updated to remove secret references (`@vite_*`). 

**Why?** Vercel secrets need to be created before they can be referenced. For simpler deployment, we'll add environment variables directly through the Vercel dashboard after each app is deployed.

---

## 📋 Deployment Workflow (Updated)

### Step 1: Deploy Each App (One at a Time)

**Start with Landing Page:**

```bash
cd apps/landing
vercel
```

**Prompts you'll see:**
```
? Set up and deploy "~/DJAMMS_50_page_prompt/apps/landing"? [Y/n] y
? Which scope do you want to deploy to? [Your Account]
? Link to existing project? [y/N] n
? What's your project's name? djamms-landing
? In which directory is your code located? ./
```

**Then deploy to production:**
```bash
vercel --prod
```

**Repeat for other apps:**

```bash
# Auth App
cd ../auth
vercel
vercel --prod

# Player App
cd ../player
vercel
vercel --prod

# Admin App
cd ../admin
vercel
vercel --prod

# Kiosk App
cd ../kiosk
vercel
vercel --prod

# Dashboard App
cd ../dashboard
vercel
vercel --prod
```

---

### Step 2: Add Environment Variables in Vercel Dashboard

**For EACH deployed app:**

1. **Go to Project Settings:**
   ```
   https://vercel.com/[your-username]/[project-name]/settings/environment-variables
   ```

2. **Click "Add New"**

3. **Add Variables from Your .env File**

#### 🌐 Landing App (`djamms-landing`)

Add these variables:
```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
```

**Environments:** Production, Preview, Development ✅

---

#### 🔐 Auth App (`djamms-auth`)

Add these variables:
```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
VITE_APPWRITE_FUNCTION_MAGIC_LINK = 68e5a317003c42c8bb6a
VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
VITE_ALLOW_AUTO_CREATE_USERS = false
```

**For production, update this after domain is configured:**
```
VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/auth/callback
```

**For preview/dev:**
```
VITE_APPWRITE_MAGIC_REDIRECT = http://localhost:3002/auth/callback
```

---

#### 🎵 Player App (`djamms-player`)

Add these variables:
```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY = 68e5a41f00222cab705b
VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
VITE_YOUTUBE_API_KEY = AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
```

---

#### ⚙️ Admin App (`djamms-admin`)

Add these variables:
```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST = 68e5a5a1001a19e7f5c2
VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
```

---

#### 📱 Kiosk App (`djamms-kiosk`)

Add these variables:
```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST = 68e5a5a1001a19e7f5c2
VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
VITE_YOUTUBE_API_KEY = AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
```

---

#### 📊 Dashboard App (`djamms-dashboard`)

Add these variables:
```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
```

---

### Step 3: Redeploy After Adding Variables

After adding environment variables for each project:

```bash
cd apps/landing
vercel --prod

cd ../auth
vercel --prod

cd ../player
vercel --prod

cd ../admin
vercel --prod

cd ../kiosk
vercel --prod

cd ../dashboard
vercel --prod
```

Or from project root:
```bash
npm run deploy:all
```

---

### Step 4: Configure Custom Domains

For **EACH** Vercel project:

1. **Go to Domains Settings:**
   ```
   https://vercel.com/[your-username]/[project-name]/settings/domains
   ```

2. **Add Domain:**
   - Landing: `djamms.app`
   - Auth: `auth.djamms.app`
   - Player: `player.djamms.app`
   - Admin: `admin.djamms.app`
   - Kiosk: `kiosk.djamms.app`
   - Dashboard: `dashboard.djamms.app`

3. **Copy CNAME Record** that Vercel provides

---

### Step 5: Update DNS on Porkbun

1. **Log into Porkbun:** https://porkbun.com/account/domain
2. **Select djamms.app**
3. **Update/Add DNS Records:**

```
Type    Host                    Value                           TTL
ALIAS   @                       [Vercel CNAME for djamms.app]  600
CNAME   auth                    [Vercel CNAME]                  600
CNAME   player                  [Vercel CNAME]                  600
CNAME   admin                   [Vercel CNAME]                  600
CNAME   kiosk                   [Vercel CNAME]                  600
CNAME   dashboard               [Vercel CNAME]                  600
```

**Keep existing AppWrite CNAME:**
```
CNAME   68e5a36e0021b938b3a7   syd.cloud.appwrite.io          600
```

4. **Wait 10-15 minutes** for DNS propagation

---

### Step 6: Update AppWrite Allowed Origins

1. **Go to AppWrite Console:** https://cloud.appwrite.io
2. **Select your project:** DJAMMS Prototype
3. **Go to Settings → Platforms**
4. **Add Web Platforms:**
   - Name: Landing, Hostname: `https://djamms.app`
   - Name: Auth, Hostname: `https://auth.djamms.app`
   - Name: Player, Hostname: `https://player.djamms.app`
   - Name: Admin, Hostname: `https://admin.djamms.app`
   - Name: Kiosk, Hostname: `https://kiosk.djamms.app`
   - Name: Dashboard, Hostname: `https://dashboard.djamms.app`

---

### Step 7: Update Magic Link Redirect

After `auth.djamms.app` is live:

1. **Go to Vercel:** djamms-auth project
2. **Settings → Environment Variables**
3. **Edit `VITE_APPWRITE_MAGIC_REDIRECT`** (Production only):
   ```
   VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/auth/callback
   ```
4. **Redeploy:**
   ```bash
   cd apps/auth
   vercel --prod
   ```

---

### Step 8: Test Everything

#### Test Domains:
```bash
dig djamms.app
dig auth.djamms.app
dig player.djamms.app
dig admin.djamms.app
dig kiosk.djamms.app
dig dashboard.djamms.app
```

#### Test Apps:

1. **Landing:** https://djamms.app
   - [ ] Page loads
   - [ ] Click "Login" → redirects to auth.djamms.app

2. **Auth:** https://auth.djamms.app/auth/login
   - [ ] Enter email
   - [ ] Check console for magic link
   - [ ] Click link → should authenticate

3. **Player:** https://player.djamms.app/player/venue1
   - [ ] Player loads
   - [ ] Registers as master player
   - [ ] YouTube iframe visible

4. **Admin:** https://admin.djamms.app/admin/venue1
   - [ ] Dashboard loads
   - [ ] Can search songs
   - [ ] Real-time updates work

5. **Kiosk:** https://kiosk.djamms.app/kiosk/venue1
   - [ ] Search works
   - [ ] Can submit requests

6. **Dashboard:** https://dashboard.djamms.app
   - [ ] Loads correctly
   - [ ] Shows user info

---

## 🎯 Quick Commands

### Deploy Individual Apps:
```bash
npm run deploy:landing
npm run deploy:auth
npm run deploy:player
npm run deploy:admin
npm run deploy:kiosk
npm run deploy:dashboard
```

### Deploy All (after initial setup):
```bash
npm run deploy:all
```

### Check Deployment Status:
```bash
vercel ls
```

### View Logs:
```bash
vercel logs [deployment-url]
```

---

## 🔧 Troubleshooting

### Build Fails with "Cannot find module"
**Solution:** Make sure you deployed from the app directory, not project root

### Environment Variables Not Working
**Solution:** 
1. Check they're set for Production environment in Vercel
2. Redeploy after adding variables: `vercel --prod`

### Domain Shows "Not Found"
**Solution:**
1. Wait 15-30 minutes for DNS propagation
2. Check DNS with `dig domain.com`
3. Verify domain is added in Vercel dashboard

### CORS Errors in Browser
**Solution:**
1. Add domains to AppWrite Console → Settings → Platforms
2. Clear browser cache
3. Check Network tab for specific CORS errors

---

## 📊 Deployment Checklist

- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Deploy each app: `vercel` then `vercel --prod`
- [ ] Add environment variables in Vercel dashboard
- [ ] Redeploy after adding variables
- [ ] Configure custom domains
- [ ] Update DNS on Porkbun
- [ ] Add domains to AppWrite platforms
- [ ] Update magic link redirect URL
- [ ] Test all apps
- [ ] Enable auto-deployments from GitHub

---

## 💰 Cost Estimate

**Free Tier (Hobby):**
- 6 projects × 100GB bandwidth = 600GB total/month
- Unlimited deployments
- Custom domains + SSL included
- **Cost: $0/month**

**If you exceed free tier:**
- Pro: $20/month per user
- Includes 1TB bandwidth
- Team features
- Advanced analytics

---

## 🎉 After Setup Complete

Once everything is deployed and tested:

✅ **Auto-deployments enabled**
- Every `git push` to `main` automatically deploys to production
- No manual deployment needed
- Vercel builds and deploys all changes

✅ **Production URLs live:**
- https://djamms.app
- https://auth.djamms.app
- https://player.djamms.app
- https://admin.djamms.app
- https://kiosk.djamms.app
- https://dashboard.djamms.app

✅ **SSL certificates automatic**
- All domains have HTTPS
- Certificates auto-renew

✅ **CDN edge caching**
- Global distribution
- Fast load times worldwide

---

## 📚 Additional Resources

- **Vercel CLI Docs:** https://vercel.com/docs/cli
- **Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Custom Domains:** https://vercel.com/docs/concepts/projects/domains
- **Deployment Docs:** https://vercel.com/docs/concepts/deployments/overview

---

## ✅ Summary

**New Workflow:**
1. Deploy each app individually with `vercel` + `vercel --prod`
2. Add environment variables through Vercel dashboard
3. Redeploy after adding variables
4. Configure custom domains
5. Update DNS
6. Test everything

**Removed:**
- ❌ Secret references in vercel.json (was causing errors)

**Added:**
- ✅ Simple vercel.json with just build config
- ✅ Manual environment variable setup (more reliable)

This approach is simpler and avoids the secret reference errors! 🎉
