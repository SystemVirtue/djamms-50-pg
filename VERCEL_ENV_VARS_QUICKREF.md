# 🔐 Environment Variables - Quick Reference

## Common Variables (All Apps)

Copy-paste these into **ALL 6 apps**:

```
VITE_APPWRITE_ENDPOINT = https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID = 68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID = 68e57de9003234a84cae
VITE_JWT_SECRET = 9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8
```

---

## App-Specific Variables

### Auth App ONLY:
```
VITE_APPWRITE_FUNCTION_MAGIC_LINK = 68e5a317003c42c8bb6a
VITE_APPWRITE_MAGIC_REDIRECT = https://auth.djamms.app/auth/callback (Production)
VITE_ALLOW_AUTO_CREATE_USERS = false
```

### Player App ONLY:
```
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY = 68e5a41f00222cab705b
VITE_YOUTUBE_API_KEY = AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
```

### Admin & Kiosk Apps ONLY:
```
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST = 68e5a5a1001a19e7f5c2
```

### Kiosk App ONLY (also needs):
```
VITE_YOUTUBE_API_KEY = AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few
```

---

## Quick Links

- **Landing:** https://vercel.com/djamms-admins-projects/djamms-landing/settings/environment-variables
- **Auth:** https://vercel.com/djamms-admins-projects/djamms-auth/settings/environment-variables
- **Player:** https://vercel.com/djamms-admins-projects/djamms-player/settings/environment-variables
- **Admin:** https://vercel.com/djamms-admins-projects/djamms-admin/settings/environment-variables
- **Kiosk:** https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/environment-variables
- **Dashboard:** https://vercel.com/djamms-admins-projects/djamms-dashboard/settings/environment-variables

---

## After Adding Variables

Redeploy all apps:
```bash
./scripts/deploy-app.sh landing
./scripts/deploy-app.sh auth
./scripts/deploy-app.sh player
./scripts/deploy-app.sh admin
./scripts/deploy-app.sh kiosk
./scripts/deploy-app.sh dashboard
```

**Time:** ~30 minutes total 📋

**Full guide:** `VERCEL_ENV_VARS_GUIDE.md`
