# Porkbun DNS Configuration for DJAMMS

## 🌐 Complete DNS Records List

### Required Records for djamms.app

Copy these records exactly into your Porkbun DNS management page.

---

## 1. Vercel Deployment Records

### Root Domain (Landing Page)
```
Type:    ALIAS (or CNAME if ALIAS not available)
Host:    @ (or blank)
Answer:  cname.vercel-dns.com
TTL:     600
```

**Note:** If Porkbun doesn't support ALIAS for root domain, you may need to use their forwarding feature or A records. Check Vercel dashboard for the specific CNAME/A records for your djamms-landing project.

### Auth Subdomain
```
Type:    CNAME
Host:    auth
Answer:  cname.vercel-dns.com
TTL:     600
```

### Player Subdomain
```
Type:    CNAME
Host:    player
Answer:  cname.vercel-dns.com
TTL:     600
```

### Admin Subdomain
```
Type:    CNAME
Host:    admin
Answer:  cname.vercel-dns.com
TTL:     600
```

### Kiosk Subdomain
```
Type:    CNAME
Host:    kiosk
Answer:  cname.vercel-dns.com
TTL:     600
```

### Dashboard Subdomain
```
Type:    CNAME
Host:    dashboard
Answer:  cname.vercel-dns.com
TTL:     600
```

---

## 2. AppWrite Custom Domain (KEEP EXISTING)

### AppWrite Cloud Instance
```
Type:    CNAME
Host:    68e5a36e0021b938b3a7
Answer:  syd.cloud.appwrite.io
TTL:     600
```

**⚠️ IMPORTANT:** This record should already exist. **DO NOT DELETE IT.** It's required for your AppWrite custom domain to work.

---

## 3. Email Records (Recommended)

If you want to receive emails at your domain (e.g., admin@djamms.app):

### MX Records (if using email)
```
Type:     MX
Host:     @
Answer:   [Your email provider's MX server]
Priority: 10
TTL:      600
```

**Skip this if not using email with this domain.**

---

## 🎯 Vercel-Specific CNAME Values

The `cname.vercel-dns.com` is a generic value. To get the **exact CNAME** for each project:

1. **Go to each Vercel project:**
   - [djamms-landing](https://vercel.com/djamms-admins-projects/djamms-landing/settings/domains)
   - [djamms-auth](https://vercel.com/djamms-admins-projects/djamms-auth/settings/domains)
   - [djamms-player](https://vercel.com/djamms-admins-projects/djamms-player/settings/domains)
   - [djamms-admin](https://vercel.com/djamms-admins-projects/djamms-admin/settings/domains)
   - [djamms-kiosk](https://vercel.com/djamms-admins-projects/djamms-kiosk/settings/domains)
   - [djamms-dashboard](https://vercel.com/djamms-admins-projects/djamms-dashboard/settings/domains)

2. **Click "Add Domain"** for each project

3. **Enter the domain name:**
   - Landing: `djamms.app`
   - Auth: `auth.djamms.app`
   - Player: `player.djamms.app`
   - Admin: `admin.djamms.app`
   - Kiosk: `kiosk.djamms.app`
   - Dashboard: `dashboard.djamms.app`

4. **Copy the CNAME value** Vercel provides

---

## 📋 Quick Reference Table

| Record Type | Host               | Answer/Value              | TTL | Priority | Notes                    |
|-------------|--------------------|---------------------------|-----|----------|--------------------------|
| ALIAS/CNAME | @                  | [From Vercel]             | 600 | -        | Landing page             |
| CNAME       | auth               | [From Vercel]             | 600 | -        | Auth app                 |
| CNAME       | player             | [From Vercel]             | 600 | -        | Player app               |
| CNAME       | admin              | [From Vercel]             | 600 | -        | Admin app                |
| CNAME       | kiosk              | [From Vercel]             | 600 | -        | Kiosk app                |
| CNAME       | dashboard          | [From Vercel]             | 600 | -        | Dashboard app            |
| CNAME       | 68e5a36e0021b938b3a7 | syd.cloud.appwrite.io | 600 | -        | AppWrite (KEEP EXISTING) |

---

## 🔍 Alternative: If Porkbun Doesn't Support ALIAS

Some registrars don't support ALIAS records for the root domain (@). If Porkbun doesn't:

### Option 1: Use A Records (for root domain only)

Get the A record IP addresses from Vercel:

1. Go to your djamms-landing project settings
2. Add domain `djamms.app`
3. Vercel will show you A records like:

```
Type:    A
Host:    @
Answer:  76.76.21.21
TTL:     600
```

You may need multiple A records (Vercel typically provides 2-3 IPs).

### Option 2: Use CNAME Flattening

If Porkbun supports "CNAME Flattening" or "ANAME":

```
Type:    ANAME (or CNAME with flattening)
Host:    @
Answer:  cname.vercel-dns.com
TTL:     600
```

---

## ⏱️ DNS Propagation Time

- **Minimum:** 5-10 minutes
- **Typical:** 15-30 minutes
- **Maximum:** 48 hours (rare)

### Check Propagation Status:

```bash
# Check root domain
dig djamms.app

# Check subdomains
dig auth.djamms.app
dig player.djamms.app
dig admin.djamms.app
dig kiosk.djamms.app
dig dashboard.djamms.app
```

Expected output should show CNAME pointing to Vercel.

---

## ✅ Verification Checklist

After adding all DNS records:

- [ ] Root domain (djamms.app) points to Vercel
- [ ] auth.djamms.app CNAME added
- [ ] player.djamms.app CNAME added
- [ ] admin.djamms.app CNAME added
- [ ] kiosk.djamms.app CNAME added
- [ ] dashboard.djamms.app CNAME added
- [ ] AppWrite CNAME (68e5a36e0021b938b3a7) still exists
- [ ] Waited 15-30 minutes for propagation
- [ ] Tested all domains with dig command
- [ ] Verified SSL certificates are active (https://)

---

## 🚨 Common Issues

### Issue 1: "Domain is already in use"

**Cause:** Domain is configured in another Vercel account or project.

**Solution:**
1. Remove domain from old Vercel project
2. Wait 5 minutes
3. Add to correct project

### Issue 2: Root domain not working (404)

**Cause:** ALIAS/ANAME not supported, or wrong A records.

**Solution:**
1. Use Vercel's A record IPs instead
2. Add all A records Vercel provides (usually 2-3)

### Issue 3: Subdomain shows "DNS_PROBE_FINISHED_NXDOMAIN"

**Cause:** DNS not propagated yet, or CNAME value incorrect.

**Solution:**
1. Wait 15-30 more minutes
2. Verify CNAME value matches Vercel exactly
3. Check for typos in Host field

### Issue 4: SSL certificate not working

**Cause:** Domain not verified yet, or DNS not fully propagated.

**Solution:**
1. Wait up to 24 hours for Vercel to issue SSL
2. Check domain status in Vercel dashboard
3. If stuck, remove and re-add domain

---

## 📖 Step-by-Step Porkbun Instructions

1. **Login to Porkbun:**
   - Go to https://porkbun.com/account/domainsSpeedy
   - Find `djamms.app`
   - Click "DNS" button

2. **Remove Conflicting Records:**
   - If there are existing A or CNAME records for @, auth, player, etc., delete them
   - **KEEP** the AppWrite CNAME (68e5a36e0021b938b3a7)

3. **Add New Records:**
   - Click "Add" button
   - Fill in Type, Host, Answer
   - Set TTL to 600
   - Click "Add"
   - Repeat for all 6 Vercel records

4. **Verify:**
   - Wait 15 minutes
   - Run `dig` commands to check
   - Visit each domain in browser

---

## 🎯 Final Domain Structure

After setup complete:

```
djamms.app                          → Landing page (Vercel)
auth.djamms.app                     → Auth app (Vercel)
player.djamms.app                   → Player app (Vercel)
admin.djamms.app                    → Admin app (Vercel)
kiosk.djamms.app                    → Kiosk app (Vercel)
dashboard.djamms.app                → Dashboard app (Vercel)
68e5a36e0021b938b3a7.djamms.app     → AppWrite custom domain
```

---

## 💡 Pro Tip

**Add all domains to Vercel projects BEFORE updating DNS:**

This way, when DNS propagates, Vercel is already expecting the traffic and SSL certificates will be issued immediately.

1. ✅ Add domains in Vercel (get CNAME values)
2. ✅ Update DNS in Porkbun
3. ✅ Wait for propagation
4. ✅ SSL certificates auto-issued

---

## 🎉 Success Indicators

Your setup is complete when:

- ✅ All 6 domains resolve with `dig`
- ✅ All domains load in browser (may show 404 initially, that's OK)
- ✅ SSL padlock shows in browser (https://)
- ✅ Vercel dashboard shows "Ready" for all domains
- ✅ AppWrite custom domain still works

---

## 📞 Need Help?

If you run into issues:

1. **Check Vercel Status:** https://vercel-status.com
2. **Check Porkbun Status:** https://status.porkbun.com
3. **Vercel Support:** https://vercel.com/support
4. **DNS Checker:** https://dnschecker.org

Enter your domain to see propagation status worldwide.

---

## ✅ Summary

**Add these 7 DNS records to Porkbun:**

1. Root domain → Vercel (ALIAS or A records)
2. auth subdomain → Vercel (CNAME)
3. player subdomain → Vercel (CNAME)
4. admin subdomain → Vercel (CNAME)
5. kiosk subdomain → Vercel (CNAME)
6. dashboard subdomain → Vercel (CNAME)
7. AppWrite subdomain → Keep existing (CNAME to syd.cloud.appwrite.io)

**Get exact CNAME values from Vercel dashboard for each project!**
