# 🌐 Vercel Domain Verification for Resend

**Date:** October 9, 2025  
**Domain:** djamms.app  
**Purpose:** Enable email sending via Resend

---

## 🚀 Quick Start

### Step 1: Get DNS Records from Resend

Run this script to get the exact DNS records you need:

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
node scripts/resend-setup.mjs
```

This will:
- Check if domain exists in Resend
- Add domain if needed
- Display all DNS records in Vercel format
- Provide step-by-step instructions

### Step 2: Add Records to Vercel

Go to: https://vercel.com/settings/domains

---

## 📋 DNS Records to Add to Vercel

You need to add **3 records** to Vercel:

### 1️⃣ MX Record (Mail Exchange)

**Purpose:** Receive bounce notifications from AWS SES

| Field | Value |
|-------|-------|
| Type | **MX** |
| Name | **send** |
| Value | `feedback-smtp.us-east-1.amazonses.com` |
| Priority | **10** (or 11/12 if 10 is taken) |
| TTL | **60** (default) |

⚠️ **Important:** 
- Use `send` NOT `send.djamms.app`
- If Priority 10 is already used, try 11 or 12

---

### 2️⃣ TXT Record - SPF (Sender Policy Framework)

**Purpose:** Authorize AWS SES to send emails on your behalf

| Field | Value |
|-------|-------|
| Type | **TXT** |
| Name | **send** |
| Value | `"v=spf1 include:amazonses.com ~all"` |
| TTL | **60** (default) |

⚠️ **Important:** 
- Use `send` NOT `send.djamms.app`
- Include the quotes in the value

---

### 3️⃣ TXT Record - DKIM (DomainKeys Identified Mail)

**Purpose:** Cryptographically sign emails to prevent spoofing

| Field | Value |
|-------|-------|
| Type | **TXT** |
| Name | **resend._domainkey** |
| Value | `p=MII...` (long string from Resend) |
| TTL | **60** (default) |

⚠️ **Important:** 
- Use `resend._domainkey` NOT `resend._domainkey.djamms.app`
- Get the exact value from Resend dashboard or the script output

---

## 🎯 Step-by-Step Process

### Phase 1: Get DNS Records (2 minutes)

1. **Run the setup script:**
   ```bash
   node scripts/resend-setup.mjs
   ```

2. **Copy the DNS record values** displayed by the script

3. **Keep the terminal open** for reference while adding records

---

### Phase 2: Add Records to Vercel (5 minutes)

1. **Open Vercel Dashboard:**
   - Go to https://vercel.com/settings/domains
   - Or navigate: Dashboard → Settings → Domains

2. **Find your domain:**
   - Look for `djamms.app` in the list
   - Click **Edit** or the settings icon

3. **Add MX Record:**
   - Click **Add Record** or **+**
   - Type: Select **MX** from dropdown
   - Name: `send`
   - Value: `feedback-smtp.us-east-1.amazonses.com`
   - Priority: `10` (or 11 if 10 is taken)
   - TTL: Leave default (60)
   - Click **Save** or **Add**

4. **Add TXT SPF Record:**
   - Click **Add Record** again
   - Type: Select **TXT** from dropdown
   - Name: `send`
   - Value: `"v=spf1 include:amazonses.com ~all"`
   - TTL: Leave default (60)
   - Click **Save** or **Add**

5. **Add TXT DKIM Record:**
   - Click **Add Record** again
   - Type: Select **TXT** from dropdown
   - Name: `resend._domainkey`
   - Value: (paste the long `p=MII...` string from script output)
   - TTL: Leave default (60)
   - Click **Save** or **Add**

---

### Phase 3: Wait for DNS Propagation (5-10 minutes)

DNS changes take time to propagate globally.

**Check propagation status:**
```bash
# Check MX record
dig send.djamms.app MX +short

# Check SPF record
dig send.djamms.app TXT +short

# Check DKIM record
dig resend._domainkey.djamms.app TXT +short
```

**Expected output:**
- MX: Should show `feedback-smtp.us-east-1.amazonses.com`
- TXT (send): Should show `"v=spf1 include:amazonses.com ~all"`
- TXT (DKIM): Should show `"p=MII..."` (long string)

If records don't appear immediately, **wait 5-10 minutes** and check again.

---

### Phase 4: Verify Domain in Resend (30 seconds)

After DNS records have propagated:

**Option A: Via Script (Recommended)**
```bash
node scripts/resend-setup.mjs --verify
```

**Option B: Via Resend Dashboard**
1. Go to https://resend.com/domains
2. Find `djamms.app`
3. Click **Verify**
4. Status should change to **Verified** ✅

**Option C: Programmatically**
```javascript
import { Resend } from 'resend';
const resend = new Resend('re_Ps9eqvDb_C8YeZ9TyD4aYHZh88fRmpVqw');
await resend.domains.verify('DOMAIN_ID');
```

---

## ✅ Verification Checklist

Use this checklist to ensure everything is configured correctly:

### Before Adding DNS Records
- [ ] Run `node scripts/resend-setup.mjs` to get DNS values
- [ ] Note the exact values for MX, SPF, and DKIM records
- [ ] Open Vercel dashboard in browser

### Adding DNS Records in Vercel
- [ ] MX record added with name `send` (not `send.djamms.app`)
- [ ] MX priority set to 10 (or 11/12 if 10 is taken)
- [ ] TXT SPF record added with name `send`
- [ ] TXT DKIM record added with name `resend._domainkey`
- [ ] All records saved successfully

### After Adding Records
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Verify records with `dig` commands
- [ ] Run `node scripts/resend-setup.mjs --verify`
- [ ] Check Resend dashboard shows domain as **Verified**

### Final Testing
- [ ] Redeploy magic-link function in AppWrite
- [ ] Run `node tests/test-email-sending.mjs`
- [ ] Check email inbox (and spam folder)
- [ ] Click magic link in email
- [ ] Verify authentication works

---

## 🔧 Troubleshooting

### Issue: "Priority 10 already exists"

**Solution:** Use a different priority number
```
Priority 10 is taken → Use 11
Priority 11 is taken → Use 12
etc.
```

Do not use the same priority for multiple MX records.

---

### Issue: DNS records not propagating

**Symptoms:** `dig` commands return no results after 10+ minutes

**Solutions:**
1. **Check TTL:** Should be 60 (1 minute)
2. **Check record names:**
   - Should be `send` not `send.djamms.app`
   - Should be `resend._domainkey` not `resend._domainkey.djamms.app`
3. **Clear DNS cache:**
   ```bash
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```
4. **Use Google DNS for testing:**
   ```bash
   dig @8.8.8.8 send.djamms.app MX
   ```

---

### Issue: "Domain verification failed"

**Check:**
1. **All 3 records added?** Need MX, SPF TXT, and DKIM TXT
2. **Correct values?** Run script again to compare
3. **DNS propagated?** Use `dig` commands to verify
4. **Waited long enough?** Sometimes takes 10-15 minutes

**Manual verification:**
```bash
# Should return 3 different record types
dig send.djamms.app ANY
dig resend._domainkey.djamms.app TXT
```

---

### Issue: Records added but emails still not sending

**Checklist:**
1. Domain verified in Resend? (green checkmark)
2. Function redeployed in AppWrite?
3. RESEND_API_KEY set in function environment?
4. SMTP_FROM set in function environment?

**Test again:**
```bash
node tests/test-email-sending.mjs
```

Look for "Email sent successfully" in logs.

---

## 📊 DNS Record Reference

### What Each Record Does

| Record Type | Purpose | Impact if Missing |
|-------------|---------|-------------------|
| MX | Receives bounce notifications | Won't know about failed deliveries |
| TXT (SPF) | Authorizes sender | Emails may go to spam |
| TXT (DKIM) | Cryptographic signature | Emails may be rejected/spam |

All three records are **required** for proper email delivery.

---

## 🎓 Understanding the Records

### MX Record
```
Name: send.djamms.app
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**What it does:** Tells email servers where to send bounce notifications when an email fails to deliver.

**Example:** If you send to `invalid@example.com`, AWS SES will send a bounce notification to `send.djamms.app`, which routes to AWS SES feedback system.

---

### SPF TXT Record
```
Name: send.djamms.app
Value: "v=spf1 include:amazonses.com ~all"
```

**What it does:** Lists authorized email servers for your domain.

**Breakdown:**
- `v=spf1` - SPF version 1
- `include:amazonses.com` - AWS SES is authorized to send
- `~all` - Soft fail for other servers (mark as spam but accept)

---

### DKIM TXT Record
```
Name: resend._domainkey.djamms.app
Value: "p=MIIBIj..."
```

**What it does:** Provides public key for email signature verification.

**How it works:**
1. Resend signs email with private key
2. Receiving server looks up public key in DNS
3. Signature is verified
4. Email is trusted as authentic

---

## 🔗 Quick Links

- **Resend Dashboard:** https://resend.com/domains
- **Vercel DNS Settings:** https://vercel.com/settings/domains
- **Setup Script:** `/Users/mikeclarkin/DJAMMS_50_page_prompt/scripts/resend-setup.mjs`
- **Test Script:** `/Users/mikeclarkin/DJAMMS_50_page_prompt/tests/test-email-sending.mjs`
- **Resend API Docs:** https://resend.com/docs/api-reference/domains

---

## 📞 Support

If you encounter issues:

1. **Check script output:** `node scripts/resend-setup.mjs`
2. **Verify DNS:** Use `dig` commands above
3. **Check Resend logs:** https://resend.com/logs
4. **Check AppWrite logs:** https://cloud.appwrite.io

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ `node scripts/resend-setup.mjs --verify` shows "SUCCESS"
2. ✅ Resend dashboard shows domain as "Verified" (green)
3. ✅ `dig` commands return expected values
4. ✅ `node tests/test-email-sending.mjs` shows "Email sent successfully"
5. ✅ Email arrives in inbox within 5-10 seconds

---

**Next step:** Run `node scripts/resend-setup.mjs` to get your DNS records! 🚀
