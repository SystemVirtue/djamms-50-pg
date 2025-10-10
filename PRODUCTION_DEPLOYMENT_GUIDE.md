# 🚀 Production Deployment Guide - Magic Link Auth

## ✅ Local Testing: SUCCESS!
Magic link authentication working perfectly at `localhost:5173/auth`

---

## 🌐 **DNS Configuration: OPTION B (CNAME) - RECOMMENDED**

### **✅ Answer to Your Questions:**

**Q: Use URL forwarding or CNAME?**  
**A: Use CNAME (Option B)** ✅

**Q: Do I need to change nameservers?**  
**A: NO! Keep Porkbun nameservers** ✅

---

## 📋 **Step-by-Step Production Deployment**

### **Step 1: Add Custom Domain in AppWrite Console** 🔧

1. **Go to AppWrite Console:**
   ```
   https://cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites/djamms-unified
   ```

2. **Click "Domains" tab**

3. **Click "Add Domain"**

4. **Enter domain:** `www.djamms.app`
   - ⚠️ Use `www.djamms.app` (not bare `djamms.app`)
   - This works better with CNAME records

5. **AppWrite will show you the CNAME target:**
   ```
   Expected: 68e7c589d3e464cd7a93.appwrite.network
   ```

6. **Wait for SSL certificate** (automatic, takes 5-10 minutes)

---

### **Step 2: Update DNS Records in Porkbun** 🌐

**Login to Porkbun:**
```
https://porkbun.com/account/domain/djamms.app
```

**Add/Update These Records:**

```dns
TYPE     HOST    VALUE                                      TTL     ACTION
─────    ─────   ─────                                      ────    ──────
CNAME    www     68e7c589d3e464cd7a93.appwrite.network    600     ➕ ADD

# For root domain redirect (optional):
ALIAS    @       www.djamms.app                            600     ➕ ADD
   OR
URL      @       https://www.djamms.app                    N/A     ➕ ADD (redirect)
```

**KEEP These Records (Email Forwarding):**
```dns
TYPE     HOST    VALUE                          TTL     ACTION
─────    ─────   ─────                          ────    ──────
MX       @       [Porkbun mail servers]        3600     ✅ KEEP
TXT      @       v=spf1 include:porkbun.com    3600     ✅ KEEP
```

**DELETE These Records (Resend.com - if they exist):**
```dns
TYPE     HOST    VALUE                          TTL     ACTION
─────    ─────   ─────                          ────    ──────
TXT      @       resend-domain-verification    N/A      ❌ DELETE
CNAME    em*     [Resend CNAME]                N/A      ❌ DELETE
```

---

### **Step 3: Update Environment Variables** ⚙️

**Update Production Redirect URL:**

In AppWrite Console → Sites → djamms-unified → Variables:

```bash
# Update this variable:
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback

# Keep these the same:
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68cc86f2003873d8555b
```

**Or via CLI:**
```bash
# Update the magic redirect URL
appwrite sites update-variable \
  --site-id "djamms-unified" \
  --variable-id "68e7be41176412c9ae94" \
  --key "VITE_APPWRITE_MAGIC_REDIRECT" \
  --value "https://www.djamms.app/auth/callback"
```

---

### **Step 4: Update Local .env File** 📝

Update `apps/web/.env` for future builds:

```bash
# AppWrite Configuration
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68cc86f2003873d8555b

# Magic Link Configuration (PRODUCTION)
VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
```

---

### **Step 5: Rebuild with Production Config** 🔨

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/apps/web
npm run build
```

Expected output:
```
✓ 42 modules transformed.
dist/index.html                   0.48 kB │ gzip:  0.31 kB
dist/assets/index-*.css          12.75 kB │ gzip:  3.29 kB
dist/assets/index-*.js          203.73 kB │ gzip: 62.59 kB
✓ built in ~12s
```

---

### **Step 6: Deploy to AppWrite** 🚀

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

appwrite sites create-deployment \
  --site-id "djamms-unified" \
  --code "apps/web/dist" \
  --activate true
```

**Monitor deployment:**
```bash
watch -n 5 'appwrite sites get --site-id "djamms-unified" | grep -E "(live|latestDeploymentStatus)"'
```

---

### **Step 7: Wait for DNS Propagation** ⏰

**DNS propagation typically takes:**
- Minimum: 5-10 minutes
- Average: 30 minutes
- Maximum: 24-48 hours (rare)

**Check propagation status:**
```bash
# Check from your location
dig www.djamms.app CNAME +short

# Expected output:
# 68e7c589d3e464cd7a93.appwrite.network

# Check from multiple locations:
# https://dnschecker.org/#CNAME/www.djamms.app
```

---

### **Step 8: Test Production Magic Link** 🧪

Once DNS propagates:

1. **Visit:** `https://www.djamms.app/auth`
2. **Enter your email**
3. **Click "Send Magic Link"**
4. **Check email** (from AppWrite)
5. **Click magic link**
6. **Verify callback:** `https://www.djamms.app/auth/callback?userId=XXX&secret=YYY`
7. **Confirm authentication** and redirect to dashboard

---

## 🔍 **Why CNAME (Not URL Forwarding)?**

### **❌ URL Forwarding Problems:**
```
1. User visits: djamms.app
   ↓ [Redirect]
2. Browser shows: 68e7c589d3e464cd7a93.appwrite.network
   ↓ [Magic link sent]
3. Email contains: https://68e7c589d3e464cd7a93.appwrite.network/auth/callback
   ↓ [User clicks]
4. Callback URL doesn't match configured domain
   ↓ [Authentication fails]
```

### **✅ CNAME Benefits:**
```
1. User visits: www.djamms.app
   ↓ [DNS resolves via CNAME]
2. Browser shows: www.djamms.app (URL unchanged)
   ↓ [Magic link sent]
3. Email contains: https://www.djamms.app/auth/callback
   ↓ [User clicks]
4. Callback URL matches configured domain
   ↓ [Authentication succeeds] ✅
```

---

## 🔐 **Nameservers: NO CHANGES NEEDED**

### **Current Setup (Porkbun Nameservers):**
```
✅ Keep these:
forrest.ns.porkbun.com
marge.ns.porkbun.com
```

### **Why You DON'T Need AppWrite Nameservers:**

**CNAME records work with ANY nameservers!**

```
Nameservers control WHERE DNS records are stored.
CNAME records control WHERE traffic is DIRECTED.

Your setup:
  DNS Records: Managed by Porkbun (via their nameservers)
  Traffic: Directed to AppWrite (via CNAME record)
  
This is the standard setup! ✅
```

**Only change nameservers if:**
- You want AppWrite to manage ALL DNS records
- You're using AppWrite DNS service (you're not)
- Porkbun explicitly requires it (they don't)

---

## 📊 **Complete DNS Configuration**

### **Final Porkbun DNS Records:**

```dns
TYPE     NAME    VALUE                                      TTL     PURPOSE
─────    ─────   ─────────────────────────────────────────  ────    ─────────────────────
CNAME    www     68e7c589d3e464cd7a93.appwrite.network    600     Web hosting (AppWrite)
ALIAS    @       www.djamms.app                            600     Root domain redirect
MX       @       [Porkbun MX records]                      3600    Email forwarding
TXT      @       v=spf1 include:porkbun.com ~all           3600    Email authentication
```

**Nameservers (Unchanged):**
```
forrest.ns.porkbun.com
marge.ns.porkbun.com
```

---

## ✅ **Verification Checklist**

### **After DNS Propagation:**

```bash
# 1. DNS Resolution
dig www.djamms.app CNAME +short
# Expected: 68e7c589d3e464cd7a93.appwrite.network

# 2. SSL Certificate
curl -I https://www.djamms.app
# Expected: HTTP/2 200, SSL valid

# 3. Landing Page
curl https://www.djamms.app
# Expected: HTML content with DJAMMS

# 4. Auth Page
curl https://www.djamms.app/auth
# Expected: HTML with login form

# 5. Magic Link Test
# Visit https://www.djamms.app/auth
# Send magic link
# Click link in email
# Verify authentication
```

---

## 🐛 **Troubleshooting**

### **Issue: "Domain not verified in AppWrite"**
```
Solution: Wait for AppWrite SSL certificate provisioning (5-10 min)
Check: AppWrite Console → Sites → Domains → Status
```

### **Issue: "CNAME not resolving"**
```
Solution: Wait for DNS propagation (30 min typical)
Check: dig www.djamms.app CNAME +short
Verify: CNAME points to 68e7c589d3e464cd7a93.appwrite.network
```

### **Issue: "Magic link callback fails"**
```
Solution: Verify redirect URL matches production domain
Check: AppWrite Console → Sites → Variables
Expected: VITE_APPWRITE_MAGIC_REDIRECT=https://www.djamms.app/auth/callback
```

### **Issue: "Email forwarding stopped working"**
```
Solution: Verify MX records still exist
Check: dig djamms.app MX +short
Expected: Porkbun mail servers present
```

---

## 📋 **Quick Command Reference**

### **Update Environment Variable:**
```bash
appwrite sites update-variable \
  --site-id "djamms-unified" \
  --variable-id "68e7be41176412c9ae94" \
  --key "VITE_APPWRITE_MAGIC_REDIRECT" \
  --value "https://www.djamms.app/auth/callback"
```

### **Rebuild & Deploy:**
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/apps/web
npm run build
cd ..
appwrite sites create-deployment --site-id "djamms-unified" --code "apps/web/dist" --activate true
```

### **Check Deployment Status:**
```bash
appwrite sites get --site-id "djamms-unified" | grep -E "(live|latestDeploymentStatus)"
```

### **Check DNS:**
```bash
dig www.djamms.app CNAME +short
dig djamms.app MX +short
```

---

## 🎯 **Summary**

### **Your Actions:**

1. ✅ **AppWrite Console:** Add domain `www.djamms.app`
2. ✅ **Porkbun DNS:** Add CNAME: `www` → `68e7c589d3e464cd7a93.appwrite.network`
3. ✅ **AppWrite Console:** Update magic redirect variable
4. ✅ **Local:** Update `.env` file
5. ✅ **Terminal:** Rebuild and deploy
6. ⏰ **Wait:** DNS propagation (30 min)
7. 🧪 **Test:** Visit `https://www.djamms.app/auth`

### **What to Keep:**
- ✅ Porkbun nameservers (forrest/marge)
- ✅ MX records (email forwarding)
- ✅ SPF TXT records (email authentication)

### **What to Change:**
- ➕ Add CNAME for `www` subdomain
- 🔄 Update AppWrite magic redirect URL
- 🔄 Rebuild app with production config

### **What to Delete:**
- ❌ Resend.com verification TXT records (if any)
- ❌ Resend.com CNAME records (if any)

---

**🚀 Ready to deploy! Start with Step 1 above.**
