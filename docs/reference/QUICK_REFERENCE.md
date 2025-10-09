# 🚀 Quick Reference - DJAMMS Setup

---

## ⚡ Email Fix - 5 Minute Setup

### 1. Create Resend Account
```
→ https://resend.com
→ Sign up (free)
→ Verify email
```

### 2. Add Domain
```
Resend Dashboard → Domains → Add Domain
Enter: djamms.app
Copy DNS records (save for step 3)
```

### 3. Update DNS (Porkbun)
```
Add Record 1:
  Type: TXT
  Host: _resend
  Value: [from Resend]

Add Record 2:
  Type: TXT
  Host: resend._domainkey
  Value: [from Resend]
  
Wait 5 minutes → Verify in Resend
```

### 4. Get API Key
```
Resend Dashboard → API Keys → Create
Name: DJAMMS Magic Link
Copy key (starts with re_...)
```

### 5. Configure AppWrite
```
cloud.appwrite.io → Functions → magic-link → Settings

Add Variables:
  RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxx
  SMTP_FROM = DJAMMS <noreply@djamms.app>

Click Deploy
```

### 6. Test
```
Open: https://auth.djamms.app
Enter email → Send Magic Link
Check inbox (and spam)
Click link → Should authenticate ✅
```

---

## 📋 Checklist

**Email Setup:**
- [ ] Resend account created
- [ ] Domain added to Resend
- [ ] DNS records added to Porkbun
- [ ] Domain verified in Resend
- [ ] API key generated
- [ ] Environment variables added to AppWrite
- [ ] Function redeployed
- [ ] Email received successfully
- [ ] Magic link works

**Playlist Integration:**
- [ ] Venue service updated
- [ ] Player service updated
- [ ] Admin UI created
- [ ] Route added
- [ ] Navigation link added
- [ ] Test: Create venue → queue exists
- [ ] Test: Load player → tracks show
- [ ] Test: Admin UI displays

---

## 📚 Documents Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **EMAIL_FIX_COMPLETE.md** | Overview of email fix | Start here for context |
| **CONFIGURATION_GUIDE.md** | Step-by-step setup | Follow for Resend setup |
| **PLAYLIST_INTEGRATION_GUIDE.md** | Code implementation | Use when coding features |
| **SESSION_SUMMARY.md** | Complete session recap | Review what was done |
| **MAGIC_LINK_FIX.md** | Technical deep-dive | Reference for debugging |
| **DEFAULT_PLAYLIST_COMPLETE.md** | Playlist details | Understand data structure |

---

## 🐛 Quick Troubleshooting

### Email Not Received?
```bash
# Check DNS
dig TXT _resend.djamms.app +short

# Should return verification string
# If empty, wait 5 more minutes
```

### Function Errors?
```
1. Check AppWrite → Functions → magic-link → Logs
2. Look for "Email sent successfully"
3. If errors, verify:
   - RESEND_API_KEY starts with re_
   - SMTP_FROM format: Name <email@domain>
   - Domain verified in Resend dashboard
```

### Playlist Issues?
```bash
# Verify playlist exists
node scripts/verify-default-playlist.mjs

# Should show 58 tracks
# If error, run creation script again
node scripts/create-default-playlist.mjs
```

---

## 💻 Quick Commands

```bash
# Test magic link function
curl -X POST https://api.djamms.app/v1/functions/[id]/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: [project-id]" \
  -d '{"action":"create","email":"test@example.com"}'

# Verify playlist
npm run playlist:verify

# Recreate playlist
npm run playlist:create

# Deploy function
cd functions/appwrite && npm run deploy

# Check DNS propagation
dig TXT _resend.djamms.app +short
dig TXT resend._domainkey.djamms.app +short
```

---

## 🎯 Success Indicators

**Email Working:**
- ✅ Resend dashboard shows "Verified" for djamms.app
- ✅ Test email received within 10 seconds
- ✅ AppWrite logs show "Email sent successfully"
- ✅ Magic link in email works

**Playlist Working:**
- ✅ New venues auto-create queue with 58 tracks
- ✅ Player loads without manual setup
- ✅ Admin UI shows all tracks
- ✅ Real-time sync working

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Resend setup | 5 min |
| DNS configuration | 5 min |
| AppWrite config | 2 min |
| Testing email | 5 min |
| **Email Total** | **~17 min** |
| | |
| Venue integration | 30 min |
| Player integration | 45 min |
| Admin UI | 1-2 hours |
| Testing | 30 min |
| **Playlist Total** | **~3 hours** |

---

## 🔗 Quick Links

- **Resend Dashboard:** https://resend.com/dashboard
- **AppWrite Console:** https://cloud.appwrite.io
- **Porkbun DNS:** https://porkbun.com/account/domainsSpeedy
- **Auth App:** https://auth.djamms.app
- **Admin App:** https://admin.djamms.app
- **Player App:** https://player.djamms.app

---

## 📞 Need Help?

1. **Check Documentation:** All guides in repo root
2. **Review Logs:** AppWrite function logs
3. **Verify DNS:** Use `dig` commands above
4. **Test Manually:** curl commands provided
5. **Check Dashboard:** Resend delivery status

---

## 🎉 When Complete

You'll have:
- ✅ Working magic link authentication
- ✅ Beautiful branded emails
- ✅ Auto-populated venue queues
- ✅ Instant player functionality
- ✅ Professional admin UI

**Enjoy your DJAMMS system! 🎵**

---

*Last Updated: January 2025*
