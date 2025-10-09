# 📧 Porkbun Email Management + Resend Configuration Guide

**Date:** October 9, 2025  
**Domain:** djamms.app  
**Setup:** Porkbun email forwarding + Resend for sending

---

## 🎯 Overview

You have **two separate email systems** working together:

1. **Resend (Sending Only):** For sending magic link emails via AWS SES
2. **Porkbun Email Forwarding:** For receiving emails sent to `*@djamms.app`

These don't conflict - they handle different directions of email flow!

---

## ✅ Current DNS Records (Correct Setup)

### For Resend (Outgoing Emails via AWS SES)

These records are for **sending** emails from your app:

```
Type: MX
Host: send.djamms.app
Value: feedback-smtp.ap-northeast-1.amazonses.com
Priority: 10
```

```
Type: TXT
Host: send.djamms.app
Value: v=spf1 include:amazonses.com ~all
```

```
Type: TXT
Host: resend._domainkey.djamms.app
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZArK2ONDa1UUluCUtEtJghLpMz40fZSyLZqnKfnTjvLrKhJNRqvyPEE6TeqC7WL5hptd8NY6oeWQxBhun9rZwTmhv+IwGpXdq+HhKOmFIr4KleUuH/j0Vz0GAdfonwlOUa96yGWKAzFvOslnK7YBLslvV4YffKvRedZl6tx/0lQIDAQAB
```

**Purpose:** These handle **sending** emails from `noreply@djamms.app` through your app.

---

### For Porkbun Email Forwarding (Incoming Emails)

For **receiving** emails at your domain, you need Porkbun's MX records:

```
Type: MX
Host: @ (or djamms.app)
Value: mx1.porkbun.com
Priority: 10

Type: MX
Host: @ (or djamms.app)
Value: mx2.porkbun.com
Priority: 20
```

**Purpose:** These handle **receiving** emails sent to any `*@djamms.app` address.

---

## 🔍 The Two Email Flows

### Flow 1: Sending (Your App → User) via Resend

```
Your App
  ↓
Resend API (via magic-link function)
  ↓
AWS SES (send.djamms.app subdomain)
  ↓
User's Inbox (e.g., mike@example.com)
```

**DNS Used:**
- MX: `send.djamms.app` → AWS SES
- SPF TXT: `send.djamms.app` → Authorizes AWS SES
- DKIM TXT: `resend._domainkey.djamms.app` → Signs emails

---

### Flow 2: Receiving (Someone → Your Domain) via Porkbun

```
Someone sends to admin@djamms.app
  ↓
Porkbun MX servers (mx1/mx2.porkbun.com)
  ↓
Porkbun Email Forwarding
  ↓
Your personal email (configured in Porkbun)
```

**DNS Used:**
- MX: `djamms.app` (root) → Porkbun MX servers

---

## 📋 Complete DNS Record List for Porkbun

Here's what you should have configured:

### 1. Root Domain MX Records (For Receiving Emails)

```
Type: MX
Host: @ (or blank, or djamms.app)
Value: mx1.porkbun.com
Priority: 10
TTL: 600
```

```
Type: MX
Host: @ (or blank, or djamms.app)
Value: mx2.porkbun.com
Priority: 20
TTL: 600
```

**Purpose:** Receives emails sent to `admin@djamms.app`, `info@djamms.app`, etc.

---

### 2. Subdomain MX Record (For Resend/AWS SES)

```
Type: MX
Host: send
Value: feedback-smtp.ap-northeast-1.amazonses.com
Priority: 10
TTL: 600
```

**Purpose:** Receives bounce notifications from AWS SES (for emails your app sends)

---

### 3. SPF Record for Sending Subdomain

```
Type: TXT
Host: send
Value: v=spf1 include:amazonses.com ~all
TTL: 600
```

**Purpose:** Authorizes AWS SES to send emails on behalf of `send.djamms.app`

---

### 4. DKIM Record for Email Signing

```
Type: TXT
Host: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZArK2ONDa1UUluCUtEtJghLpMz40fZSyLZqnKfnTjvLrKhJNRqvyPEE6TeqC7WL5hptd8NY6oeWQxBhun9rZwTmhv+IwGpXdq+HhKOmFIr4KleUuH/j0Vz0GAdfonwlOUa96yGWKAzFvOslnK7YBLslvV4YffKvRedZl6tx/0lQIDAQAB
TTL: 600
```

**Purpose:** Cryptographically signs emails sent from your app

---

### 5. Optional: DMARC Policy

```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none;
TTL: 600
```

**Purpose:** Email authentication policy (optional but recommended)

---

### 6. Optional: Root Domain SPF (If Sending from Root)

If you ever want to send emails from `@djamms.app` (not just `@send.djamms.app`):

```
Type: TXT
Host: @ (or blank)
Value: v=spf1 include:amazonses.com include:porkbun.com ~all
TTL: 600
```

**Purpose:** Authorizes both AWS SES and Porkbun to send from root domain

---

## 🔧 Porkbun Configuration Steps

### Step 1: Check Current MX Records

1. Log into https://porkbun.com
2. Go to your domain: **djamms.app**
3. Click **DNS Records**

### Step 2: Verify Root Domain MX Records

Look for MX records pointing to Porkbun:

```
MX @ mx1.porkbun.com (Priority 10)
MX @ mx2.porkbun.com (Priority 20)
```

**If missing:**
- Click **Add Record**
- Type: MX
- Host: @ (or leave blank)
- Value: `mx1.porkbun.com`
- Priority: 10
- Save

Repeat for `mx2.porkbun.com` with Priority 20.

### Step 3: Configure Email Forwarding

1. In Porkbun, go to **Email** or **Email Forwarding**
2. Set up catch-all forwarding:
   ```
   *@djamms.app → your-personal-email@example.com
   ```
3. Or set up specific addresses:
   ```
   admin@djamms.app → mike@example.com
   info@djamms.app → support@example.com
   noreply@djamms.app → (can leave unforwarded - Resend uses this for sending only)
   ```

### Step 4: Verify Resend Records Are Present

Ensure these subdomain records exist:

```
✅ MX: send → feedback-smtp.ap-northeast-1.amazonses.com
✅ TXT: send → v=spf1 include:amazonses.com ~all
✅ TXT: resend._domainkey → p=MIG...
```

These should already be configured (you did this earlier).

---

## ✅ Verification Commands

### Check Root Domain MX (Porkbun Email Receiving)

```bash
dig djamms.app MX +short
```

**Expected:**
```
10 mx1.porkbun.com.
20 mx2.porkbun.com.
```

### Check Subdomain MX (Resend/AWS SES)

```bash
dig send.djamms.app MX +short
```

**Expected:**
```
10 feedback-smtp.ap-northeast-1.amazonses.com.
```

### Check SPF Record

```bash
dig send.djamms.app TXT +short
```

**Expected:**
```
"v=spf1 include:amazonses.com ~all"
```

### Check DKIM Record

```bash
dig resend._domainkey.djamms.app TXT +short
```

**Expected:**
```
"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZArK..."
```

---

## 🎯 Common Scenarios

### Scenario 1: Sending Magic Link Emails

```
App → Resend API → AWS SES (send.djamms.app) → User
```

**From:** `noreply@djamms.app` (actually sent via send.djamms.app)  
**DNS Used:** MX, SPF, DKIM on `send.djamms.app`  
**Status:** ✅ Working (emails sending successfully!)

---

### Scenario 2: Someone Emails Your Domain

```
External → Porkbun MX → Email Forwarding → Your Personal Email
```

**To:** `admin@djamms.app`, `info@djamms.app`, etc.  
**DNS Used:** Root domain MX records → Porkbun  
**Action Required:** Verify Porkbun MX records exist

---

### Scenario 3: App Needs to Receive Emails

If your app ever needs to programmatically receive emails (not just forward):

**Option 1:** Use a service like SendGrid, Mailgun, or AWS SES (receive)
**Option 2:** Keep Porkbun forwarding to a monitored inbox
**Option 3:** Use IMAP to read from forwarded email account

---

## ⚠️ Important Notes

### 1. Two Separate MX Records - No Conflict!

```
Root Domain (@):
  MX → mx1.porkbun.com (for receiving at @djamms.app)

Subdomain (send):
  MX → feedback-smtp...amazonses.com (for Resend bounce handling)
```

These are **different subdomains** and don't interfere with each other!

---

### 2. Resend Uses Subdomain for Sending

Your app sends from `noreply@djamms.app`, but Resend actually routes it through `send.djamms.app` subdomain. This is why we have separate DNS records on the `send` subdomain.

---

### 3. Porkbun Forwarding is Independent

Porkbun's email forwarding works regardless of Resend. It handles incoming mail to your domain, while Resend handles outgoing mail from your app.

---

### 4. `noreply@djamms.app` Forwarding

You probably **don't need** to forward `noreply@djamms.app` emails since:
- It's a sending-only address
- Users shouldn't reply to it
- If they do, Porkbun's catch-all will forward it anyway

---

## 📊 Complete DNS Record Summary

| Type | Host | Value | Priority | Purpose |
|------|------|-------|----------|---------|
| **MX** | **@** | **mx1.porkbun.com** | **10** | **Receive emails (Porkbun)** |
| **MX** | **@** | **mx2.porkbun.com** | **20** | **Receive emails (Porkbun backup)** |
| MX | send | feedback-smtp.ap-northeast-1.amazonses.com | 10 | Resend bounce notifications |
| TXT | send | v=spf1 include:amazonses.com ~all | - | Authorize AWS SES |
| TXT | resend._domainkey | p=MIGf... | - | DKIM email signing |
| TXT | _dmarc | v=DMARC1; p=none; | - | Email policy (optional) |

**Bold = Most important for your email forwarding setup**

---

## 🔧 Troubleshooting

### Not Receiving Emails at Your Domain?

1. **Check Porkbun MX records:**
   ```bash
   dig djamms.app MX +short
   ```
   Should show `mx1.porkbun.com` and `mx2.porkbun.com`

2. **Check Porkbun email forwarding settings:**
   - Log into Porkbun
   - Verify forwarding is configured for `*@djamms.app`

3. **Test with external email:**
   - Send test email to `test@djamms.app`
   - Check if it arrives at your forwarding address

---

### Magic Link Emails Not Sending?

(Already fixed - but for reference)

1. **Check Resend domain status:**
   ```bash
   node scripts/check-resend-status.mjs
   ```

2. **Check subdomain DNS:**
   ```bash
   dig send.djamms.app MX +short
   dig send.djamms.app TXT +short
   dig resend._domainkey.djamms.app TXT +short
   ```

3. **Test email sending:**
   ```bash
   node tests/test-email-sending.mjs
   ```

---

## ✅ Recommended Setup

**For your use case (Porkbun forwarding + Resend sending):**

1. ✅ **Keep Porkbun MX records** on root domain (for receiving)
2. ✅ **Keep Resend MX/SPF/DKIM** on `send` subdomain (for sending)
3. ✅ **Configure catch-all forwarding** in Porkbun dashboard
4. ✅ **Don't forward `noreply@djamms.app`** (sending-only address)

This gives you:
- ✅ App can send emails via Resend
- ✅ You receive all emails sent to your domain
- ✅ No conflicts between systems
- ✅ Professional email setup

---

## 🔗 Quick Links

- **Porkbun Dashboard:** https://porkbun.com/account/domainsSpeedy
- **Porkbun DNS Management:** https://porkbun.com → djamms.app → DNS
- **Porkbun Email Forwarding:** https://porkbun.com → djamms.app → Email
- **Resend Dashboard:** https://resend.com/domains
- **Check DNS:** `dig djamms.app MX +short`

---

**Bottom Line:** You need **both** Porkbun MX records (for receiving) and Resend subdomain records (for sending). They work together without conflict! 📧
