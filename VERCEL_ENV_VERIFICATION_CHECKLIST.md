# ⚡ Quick Vercel Environment Variables Checklist

**Time to Complete:** 10 minutes

Use this checklist to manually verify your Vercel environment variables match your `.env` file.

---

## 🎯 How to Use This Checklist

1. Open Vercel dashboard: https://vercel.com/dashboard
2. For each app below, click the link to go directly to its environment variables
3. Check off each variable as you verify it exists and matches your .env
4. Mark "MISSING" if not found, "WRONG" if value differs

---

## 🌐 Landing App (djamms-landing)

**Direct Link:** https://vercel.com/djamms-admins-projects/djamms-landing/settings/environment-variables

### Production Environment:
- [ ] `VITE_APPWRITE_ENDPOINT` = `https://syd.cloud.appwrite.io/v1`
- [ ] `VITE_APPWRITE_PROJECT_ID` = `68cc86c3002b27e13947`
- [ ] `VITE_APP_URL_AUTH` = `https://auth.djamms.app`

**Status:** ___/3 variables verified

---

## 🔐 Auth App (djamms-auth)

**Direct Link:** https://vercel.com/djamms-admins-projects/djamms-auth/settings/environment-variables

### Production Environment:
- [ ] `VITE_APPWRITE_ENDPOINT` = `https://syd.cloud.appwrite.io/v1`
- [ ] `VITE_APPWRITE_PROJECT_ID` = `68cc86c3002b27e13947`
- [ ] `VITE_APPWRITE_DATABASE_ID` = `68e57de9003234a84cae`
- [ ] `VITE_APPWRITE_FUNCTION_MAGIC_LINK` = `68e5a317003c42c8bb6a`
- [ ] `VITE_JWT_SECRET` = `9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8`
- [ ] `VITE_APPWRITE_MAGIC_REDIRECT` = `https://auth.djamms.app/auth/callback`
- [ ] `VITE_ALLOW_AUTO_CREATE_USERS` = `false`
- [ ] `VITE_APP_URL_LANDING` = `https://djamms.app`
- [ ] `VITE_APP_URL_PLAYER` = `https://player.djamms.app`

**Status:** ___/9 variables verified

---

## 🎵 Player App (djamms-player)

**Direct Link:** https://vercel.com/djamms-admins-projects/djamms-player/settings/environment-variables

### Production Environment:
- [ ] `VITE_APPWRITE_ENDPOINT` = `https://syd.cloud.appwrite.io/v1`
- [ ] `VITE_APPWRITE_PROJECT_ID` = `68cc86c3002b27e13947`
- [ ] `VITE_APPWRITE_DATABASE_ID` = `68e57de9003234a84cae`
- [ ] `VITE_JWT_SECRET` = `9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8`
- [ ] `VITE_YOUTUBE_API_KEY` = `AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few`
- [ ] `VITE_APP_URL_AUTH` = `https://auth.djamms.app`
- [ ] `VITE_APP_URL_ADMIN` = `https://admin.djamms.app`

**Status:** ___/7 variables verified

---

## 🎮 Admin App (djamms-admin)

**Direct Link:** https://vercel.com/djamms-admins-projects/djamms-admin/settings/environment-variables

### Production Environment:
- [ ] `VITE_APPWRITE_ENDPOINT` = `https://syd.cloud.appwrite.io/v1`
- [ ] `VITE_APPWRITE_PROJECT_ID` = `68cc86c3002b27e13947`
- [ ] `VITE_APPWRITE_DATABASE_ID` = `68e57de9003234a84cae`
- [ ] `VITE_JWT_SECRET` = `9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8`
- [ ] `VITE_APP_URL_AUTH` = `https://auth.djamms.app`
- [ ] `VITE_APP_URL_PLAYER` = `https://player.djamms.app`

**Status:** ___/6 variables verified

---

## 🖥️ Kiosk App (djamms-kiosk)

**Direct Link:** https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/environment-variables

### Production Environment:
- [ ] `VITE_APPWRITE_ENDPOINT` = `https://syd.cloud.appwrite.io/v1`
- [ ] `VITE_APPWRITE_PROJECT_ID` = `68cc86c3002b27e13947`
- [ ] `VITE_APPWRITE_DATABASE_ID` = `68e57de9003234a84cae`
- [ ] `VITE_JWT_SECRET` = `9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8`
- [ ] `VITE_YOUTUBE_API_KEY` = `AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few`
- [ ] `VITE_APP_URL_AUTH` = `https://auth.djamms.app`

**Status:** ___/6 variables verified

---

## 📊 Overall Status

- **Landing:** ___/3 ✅
- **Auth:** ___/9 ✅
- **Player:** ___/7 ✅
- **Admin:** ___/6 ✅
- **Kiosk:** ___/6 ✅

**Total:** ___/31 variables verified

---

## 🚨 If Variables Are Missing

### To Add a Variable in Vercel:

1. Click "Add New" button
2. Enter variable name (e.g., `VITE_JWT_SECRET`)
3. Enter value (copy from your .env file)
4. Select environments: **Production, Preview, Development** ✅
5. Click "Save"

### Common Issues:

**Issue:** Variable shows as "Redacted"
- **Solution:** This is normal for secrets. Vercel hides values for security.
- **Action:** Click "Edit" to verify the value if needed.

**Issue:** Variable exists but app not working
- **Solution:** Redeploy the app after adding variables
- **Action:** Go to Deployments → Click "..." on latest → Redeploy

**Issue:** Can't find project
- **Solution:** Project names might be different
- **Action:** Check https://vercel.com/dashboard for actual project names

---

## ✅ Quick Verification Script

If you have `jq` installed, you can also export from Vercel dashboard:

```bash
# For each project, go to: Settings → Environment Variables → Export
# This will download a .env file you can compare

# Then compare with your local .env:
diff <(sort .env) <(sort downloaded-from-vercel.env)
```

---

## 🎯 Next Steps After Verification

### If All Variables Match:
✅ You're good to go! Environment is properly configured.

### If Variables Missing:
1. Use VERCEL_ENV_VARS_GUIDE.md for detailed setup
2. Add missing variables via Vercel dashboard
3. Redeploy affected apps
4. Test at production URLs

### If Variables Wrong:
1. Update incorrect values in Vercel
2. Redeploy affected apps
3. Clear browser cache
4. Test again

---

## 📝 Notes

- **Preview/Development environments** can use localhost URLs for cross-app navigation
- **Production environment** must use actual domain URLs (djamms.app, auth.djamms.app, etc.)
- **Secrets** (JWT_SECRET, API keys) should be the same across all environments
- **AppWrite configuration** must match your Sydney cloud instance

---

## 💡 Pro Tips

1. **Use Browser Inspector:** Check `localStorage` after auth to verify JWT is being set
2. **Check Network Tab:** Look for failed API calls that might indicate wrong endpoint/project ID
3. **Console Errors:** Open browser console on production sites to see configuration issues
4. **Vercel Logs:** Check deployment logs for build-time errors related to env vars

---

**Created:** $(date)
**Purpose:** Manual verification of Vercel environment variables
**Reason:** Vercel CLI link issue prevents automated verification
