# 🔐 Adding Environment Variables to Vercel

## Quick Answer: Manual via Dashboard (But We Can Help!)

Yes, environment variables must be added manually through the Vercel dashboard, **BUT** I've created tools to make this much faster:

1. **Copy-paste ready variable lists** (below)
2. **Vercel CLI commands** (experimental, may not work for all variables)
3. **Step-by-step checklist**

---

## 🚀 Fastest Method: Copy-Paste from Below

For each project, you'll:
1. Open: `https://vercel.com/djamms-admins-projects/[project-name]/settings/environment-variables`
2. Click "Add New"
3. Copy-paste the variables from below
4. Select: **Production, Preview, Development** ✅
5. Click "Save"

---

## 📋 Environment Variables by App

### 🌐 Landing (`djamms-landing`)

```
Name: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: Production, Preview, Development

Name: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: Production, Preview, Development

Name: VITE_APP_URL_AUTH
Value: https://auth.djamms.app
Environments: Production

Name: VITE_APP_URL_AUTH
Value: http://localhost:3002
Environments: Preview, Development
```

**Direct link:** https://vercel.com/djamms-admins-projects/djamms-landing/settings/environment-variables

---

### 🔐 Auth (`djamms-auth`)

```
Name: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: All

Name: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: All

Name: VITE_APPWRITE_DATABASE_ID
Value: 68e57de9003234a84cae
Environments: All

Name: VITE_APPWRITE_FUNCTION_MAGIC_LINK
Value: 68e5a317003c42c8bb6a
Environments: All

Name: VITE_JWT_SECRET
Value: 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
Environments: All

Name: VITE_APPWRITE_MAGIC_REDIRECT
Value: https://auth.djamms.app/auth/callback
Environments: Production

Name: VITE_APPWRITE_MAGIC_REDIRECT
Value: http://localhost:3002/auth/callback
Environments: Preview, Development

Name: VITE_ALLOW_AUTO_CREATE_USERS
Value: false
Environments: All

Name: VITE_APP_URL_LANDING
Value: https://djamms.app
Environments: Production

Name: VITE_APP_URL_LANDING
Value: http://localhost:3000
Environments: Preview, Development

Name: VITE_APP_URL_PLAYER
Value: https://player.djamms.app
Environments: Production

Name: VITE_APP_URL_PLAYER
Value: http://localhost:3001
Environments: Preview, Development
```

**Direct link:** https://vercel.com/djamms-admins-projects/djamms-auth/settings/environment-variables

---

### 🎵 Player (`djamms-player`)

```
Name: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: All

Name: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: All

Name: VITE_APPWRITE_DATABASE_ID
Value: 68e57de9003234a84cae
Environments: All

Name: VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY
Value: 68e5a41f00222cab705b
Environments: All

Name: VITE_JWT_SECRET
Value: 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
Environments: All

Name: VITE_YOUTUBE_API_KEY
Value: AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
Environments: All

Name: VITE_APP_URL_AUTH
Value: https://auth.djamms.app
Environments: Production

Name: VITE_APP_URL_AUTH
Value: http://localhost:3002
Environments: Preview, Development

Name: VITE_APP_URL_ADMIN
Value: https://admin.djamms.app
Environments: Production

Name: VITE_APP_URL_ADMIN
Value: http://localhost:3003
Environments: Preview, Development
```

**Direct link:** https://vercel.com/djamms-admins-projects/djamms-player/settings/environment-variables

---

### ⚙️ Admin (`djamms-admin`)

```
Name: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: All

Name: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: All

Name: VITE_APPWRITE_DATABASE_ID
Value: 68e57de9003234a84cae
Environments: All

Name: VITE_APPWRITE_FUNCTION_PROCESS_REQUEST
Value: 68e5a5a1001a19e7f5c2
Environments: All

Name: VITE_JWT_SECRET
Value: 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
Environments: All

Name: VITE_APP_URL_AUTH
Value: https://auth.djamms.app
Environments: Production

Name: VITE_APP_URL_AUTH
Value: http://localhost:3002
Environments: Preview, Development

Name: VITE_APP_URL_PLAYER
Value: https://player.djamms.app
Environments: Production

Name: VITE_APP_URL_PLAYER
Value: http://localhost:3001
Environments: Preview, Development
```

**Direct link:** https://vercel.com/djamms-admins-projects/djamms-admin/settings/environment-variables

---

### 📱 Kiosk (`djamms-kiosk`)

```
Name: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: All

Name: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: All

Name: VITE_APPWRITE_DATABASE_ID
Value: 68e57de9003234a84cae
Environments: All

Name: VITE_APPWRITE_FUNCTION_PROCESS_REQUEST
Value: 68e5a5a1001a19e7f5c2
Environments: All

Name: VITE_JWT_SECRET
Value: 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
Environments: All

Name: VITE_YOUTUBE_API_KEY
Value: AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
Environments: All

Name: VITE_APP_URL_AUTH
Value: https://auth.djamms.app
Environments: Production

Name: VITE_APP_URL_AUTH
Value: http://localhost:3002
Environments: Preview, Development
```

**Direct link:** https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/environment-variables

---

### 📊 Dashboard (`djamms-dashboard`)

```
Name: VITE_APPWRITE_ENDPOINT
Value: https://syd.cloud.appwrite.io/v1
Environments: All

Name: VITE_APPWRITE_PROJECT_ID
Value: 68cc86c3002b27e13947
Environments: All

Name: VITE_APPWRITE_DATABASE_ID
Value: 68e57de9003234a84cae
Environments: All

Name: VITE_JWT_SECRET
Value: 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
Environments: All

Name: VITE_APP_URL_AUTH
Value: https://auth.djamms.app
Environments: Production

Name: VITE_APP_URL_AUTH
Value: http://localhost:3002
Environments: Preview, Development

Name: VITE_APP_URL_PLAYER
Value: https://player.djamms.app
Environments: Production

Name: VITE_APP_URL_PLAYER
Value: http://localhost:3001
Environments: Preview, Development

Name: VITE_APP_URL_ADMIN
Value: https://admin.djamms.app
Environments: Production

Name: VITE_APP_URL_ADMIN
Value: http://localhost:3003
Environments: Preview, Development
```

**Direct link:** https://vercel.com/djamms-admins-projects/djamms-dashboard/settings/environment-variables

---

## ⚡ Alternative: Vercel CLI (Experimental)

You can try using the Vercel CLI to add variables programmatically, but this is more complex:

```bash
# Set environment variable via CLI
vercel env add VITE_APPWRITE_ENDPOINT production --scope djamms-admins-projects

# You'd need to run this for each variable, for each app, for each environment
# Not recommended - manual is actually faster!
```

---

## ✅ Step-by-Step Checklist

### Landing App (2 minutes)
- [ ] Open: https://vercel.com/djamms-admins-projects/djamms-landing/settings/environment-variables
- [ ] Add all 4 variables from above
- [ ] Select correct environments
- [ ] Save

### Auth App (5 minutes)
- [ ] Open: https://vercel.com/djamms-admins-projects/djamms-auth/settings/environment-variables
- [ ] Add all 10 variables from above
- [ ] Select correct environments
- [ ] Save

### Player App (5 minutes)
- [ ] Open: https://vercel.com/djamms-admins-projects/djamms-player/settings/environment-variables
- [ ] Add all 10 variables from above
- [ ] Select correct environments
- [ ] Save

### Admin App (4 minutes)
- [ ] Open: https://vercel.com/djamms-admins-projects/djamms-admin/settings/environment-variables
- [ ] Add all 8 variables from above
- [ ] Select correct environments
- [ ] Save

### Kiosk App (4 minutes)
- [ ] Open: https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/environment-variables
- [ ] Add all 8 variables from above
- [ ] Select correct environments
- [ ] Save

### Dashboard App (4 minutes)
- [ ] Open: https://vercel.com/djamms-admins-projects/djamms-dashboard/settings/environment-variables
- [ ] Add all 10 variables from above
- [ ] Select correct environments
- [ ] Save

**Total time:** ~25-30 minutes

---

## 🔄 After Adding Variables

You need to **redeploy** each app for the variables to take effect:

```bash
./scripts/deploy-app.sh landing
./scripts/deploy-app.sh auth
./scripts/deploy-app.sh player
./scripts/deploy-app.sh admin
./scripts/deploy-app.sh kiosk
./scripts/deploy-app.sh dashboard
```

Or from Vercel dashboard: **Deployments → [latest] → ⋮ → Redeploy**

---

## 💡 Pro Tips

### Tip 1: Use Keyboard Shortcuts
- `Cmd/Ctrl + V` to paste values
- `Tab` to move between fields
- Works on most fields in Vercel dashboard

### Tip 2: Do Production First
- Add all Production variables first
- Then add Preview/Development overrides
- This way you won't forget critical production configs

### Tip 3: Common Variables
These are the same across ALL apps:
- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID`
- `VITE_JWT_SECRET`

You can copy-paste these quickly across all 6 apps!

### Tip 4: Verify After Each App
After adding variables, check the "Environment Variables" page shows all of them before moving to the next app.

---

## 🚨 Important Notes

### Production vs Preview URLs
**Production environment** uses production domains:
- `https://djamms.app`
- `https://auth.djamms.app`
- etc.

**Preview/Development** uses localhost:
- `http://localhost:3000`
- `http://localhost:3002`
- etc.

Make sure you set the right values for each environment!

### Secrets are Encrypted
Once you add variables to Vercel, they're encrypted and secure. Even you won't be able to see the full value again (just edit it).

---

## 📚 Why Manual?

Vercel doesn't allow bulk import for security reasons. Each variable needs to be:
1. Explicitly added
2. Assigned to specific environments
3. Confirmed by you

This prevents accidental exposure of secrets and ensures you know exactly what's being deployed.

---

## ⏱️ Time Estimate

- **Fast way:** 25-30 minutes (copy-paste from above)
- **Slow way:** 45-60 minutes (typing each variable)

**Recommendation:** Use two browser windows side-by-side:
1. This guide (for copy-paste)
2. Vercel dashboard (for adding variables)

---

## ✅ Completion

After all variables are added and redeployed, your apps will be fully functional in production! 🎉

You can verify by visiting:
- https://djamms.app (landing)
- https://auth.djamms.app (login)
- https://player.djamms.app/player/venue1
- etc.
