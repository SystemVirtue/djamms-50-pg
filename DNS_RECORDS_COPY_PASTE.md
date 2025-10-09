# 📋 DNS Records for Vercel - Copy & Paste Values

**Quick Reference:** Copy these exact values into Vercel DNS settings

---

## 🌐 Go to Vercel Dashboard

**URL:** https://vercel.com/settings/domains

**Find:** djamms.app → Click "Edit" or manage DNS

---

## 1️⃣ MX RECORD

```
Type:     MX
Name:     send
Value:    feedback-smtp.ap-northeast-1.amazonses.com
Priority: 10
TTL:      60
```

**⚠️ IMPORTANT:** Use `send` NOT `send.djamms.app`

---

## 2️⃣ TXT RECORD #1 - SPF

```
Type:  TXT
Name:  send
Value: v=spf1 include:amazonses.com ~all
TTL:   60
```

**⚠️ IMPORTANT:** Use `send` NOT `send.djamms.app`

---

## 3️⃣ TXT RECORD #2 - DKIM

```
Type:  TXT
Name:  resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZArK2ONDa1UUluCUtEtJghLpMz40fZSyLZqnKfnTjvLrKhJNRqvyPEE6TeqC7WL5hptd8NY6oeWQxBhun9rZwTmhv+IwGpXdq+HhKOmFIr4KleUuH/j0Vz0GAdfonwlOUa96yGWKAzFvOslnK7YBLslvV4YffKvRedZl6tx/0lQIDAQAB
TTL:   60
```

**⚠️ IMPORTANT:** Use `resend._domainkey` NOT `resend._domainkey.djamms.app`

---

## ✅ After Adding All 3 Records

### Wait 5-10 minutes for DNS propagation

### Then verify with:

```bash
# Check MX record
dig send.djamms.app MX +short

# Check SPF record  
dig send.djamms.app TXT +short

# Check DKIM record
dig resend._domainkey.djamms.app TXT +short
```

### Then run verification:

```bash
node scripts/resend-setup.mjs --verify
```

---

## 🎯 Success Checklist

- [ ] Added MX record with name `send`
- [ ] Added TXT record with name `send` (SPF)
- [ ] Added TXT record with name `resend._domainkey` (DKIM)
- [ ] Waited 5-10 minutes
- [ ] Ran `dig` commands to verify
- [ ] Ran `node scripts/resend-setup.mjs --verify`
- [ ] Domain shows "Verified" in Resend dashboard

---

**Next:** Add these 3 records to Vercel, wait 10 minutes, then verify! 🚀
