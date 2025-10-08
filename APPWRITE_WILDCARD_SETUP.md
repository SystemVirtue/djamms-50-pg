# AppWrite Platforms - Wildcard Quick Setup

## 🎯 FREE TIER SOLUTION: Use Wildcards!

**Problem:** AppWrite Free tier only allows 3 platforms
**Solution:** Use wildcard domains to cover all subdomains

---

## ⚡ Quick Setup (2 minutes)

### Platform 1: All Subdomains
```
Type: React
Name: DJAMMS All Subdomains
Hostname: https://*.djamms.app
```

### Platform 2: Root Domain
```
Type: React
Name: DJAMMS Root
Hostname: https://djamms.app
```

### Platform 3: Localhost Development
```
Type: React
Name: Localhost Development
Hostname: http://localhost
```

---

## ✅ What This Covers

**Production:**
- ✅ https://djamms.app (root domain)
- ✅ https://www.djamms.app (via wildcard)
- ✅ https://auth.djamms.app (via wildcard)
- ✅ https://player.djamms.app (via wildcard)
- ✅ https://admin.djamms.app (via wildcard)
- ✅ https://kiosk.djamms.app (via wildcard)
- ✅ https://dashboard.djamms.app (via wildcard)
- ✅ Any future subdomain you create!

**Development:**
- ✅ http://localhost:3000 (via localhost wildcard)
- ✅ http://localhost:3001 (via localhost wildcard)
- ✅ http://localhost:3002 (via localhost wildcard)
- ✅ http://localhost:3003 (via localhost wildcard)
- ✅ http://localhost:3004 (via localhost wildcard)
- ✅ http://localhost:3005 (via localhost wildcard)
- ✅ Any other port you use!

---

## 📝 Important Notes

### Wildcard Behavior
- `*.djamms.app` matches ALL subdomains
- Does NOT match the root domain (djamms.app)
- That's why you need both `*.djamms.app` AND `djamms.app`

### Localhost Wildcard
- `http://localhost` matches ALL ports
- Much simpler than adding localhost:3000, localhost:3001, etc.
- No need for separate localhost platforms

### HTTPS vs HTTP
- Use `https://` for production domains (*.djamms.app, djamms.app)
- Use `http://` for localhost
- Must match exactly

---

## 🚀 Benefits

**vs Adding 7+ Individual Platforms:**
- ✅ Only uses 3 platform slots (fits free tier!)
- ✅ Faster to set up (2 min vs 4+ min)
- ✅ Easier to manage
- ✅ Automatically covers new subdomains
- ✅ No need to add new platforms when adding apps

**Future-proof:**
- Add test.djamms.app? ✅ Already covered
- Add staging.djamms.app? ✅ Already covered
- Add api.djamms.app? ✅ Already covered

---

## 🧪 Testing

After adding the 3 platforms, test CORS:

```javascript
// On https://auth.djamms.app
fetch('https://syd.cloud.appwrite.io/v1/health')
  .then(r => r.json())
  .then(console.log) // Should work!
  
// On https://player.djamms.app
fetch('https://syd.cloud.appwrite.io/v1/health')
  .then(r => r.json())
  .then(console.log) // Should work!

// On http://localhost:3002
fetch('https://syd.cloud.appwrite.io/v1/health')
  .then(r => r.json())
  .then(console.log) // Should work!
```

All should return: `{status: "pass", ping: <number>}`

---

## ⚠️ Troubleshooting

### Still getting CORS errors?
1. **Check hostname format:**
   - Must be `https://*.djamms.app` (not `*.djamms.app`)
   - Must be `https://djamms.app` (not `djamms.app`)
   - Must be `http://localhost` (not `localhost`)

2. **Wait 1-2 minutes** for AppWrite to propagate changes

3. **Hard refresh browser** (Cmd+Shift+R or Ctrl+Shift+R)

4. **Check AppWrite console:**
   - Settings → Platforms
   - Verify all 3 platforms are listed
   - Verify they're enabled (not disabled)

### Wildcard not working?
- AppWrite supports wildcards on the subdomain level
- `*.djamms.app` is valid
- `*` by itself is NOT valid
- Must be at the subdomain position

---

## 📊 Summary

| What You Need | Wildcard Solution | Without Wildcards |
|---------------|-------------------|-------------------|
| Platform slots | 3 | 10+ |
| Setup time | 2 min | 5+ min |
| Free tier? | ✅ Yes | ❌ No (exceeds limit) |
| Future-proof | ✅ Yes | ❌ Must add each new domain |
| Maintenance | ✅ Easy | ⚠️ Manual |

---

## ✅ Final Checklist

- [ ] Added: https://*.djamms.app (React)
- [ ] Added: https://djamms.app (React)
- [ ] Added: http://localhost (React)
- [ ] Tested CORS from auth.djamms.app
- [ ] Tested CORS from player.djamms.app
- [ ] No CORS errors in console

**Time:** 2 minutes
**Platforms used:** 3/3 (free tier limit)
**Domains covered:** ALL current and future! ✅

---

**You're done!** All your production and development domains are now whitelisted for CORS with AppWrite. 🎉
