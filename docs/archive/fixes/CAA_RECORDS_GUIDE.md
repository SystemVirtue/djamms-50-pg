# CAA Records Configuration for AppWrite SSL

## ✅ **Do You Need CAA Records?**

**Short Answer: Only if you already have CAA records.**

### **Check if you have CAA records:**
```bash
dig djamms.app CAA +short
```

**If empty/no results:** ✅ You don't need to add anything!  
**If you see results:** You need to authorize `certainly.com`

---

## 📋 **Adding CAA Record (If Needed)**

### **In Porkbun Console:**

```
TYPE:   CAA
HOST:   @
TAG:    issue
VALUE:  certainly.com
FLAGS:  0
TTL:    600
```

### **Or Alternative Format:**
```
TYPE:   CAA
HOST:   @
VALUE:  0 issue "certainly.com"
TTL:    600
```

### **If you already have CAA records, ADD (don't replace):**
```
CAA  @  0 issue "letsencrypt.org"      ← Keep existing
CAA  @  0 issue "certainly.com"         ← Add this
```

---

## 🔐 **What is certainly.com?**

- AppWrite's SSL certificate provider
- Part of DigiCert/Sectigo certificate authority
- Required for automatic SSL certificate provisioning
- Only needed if you use CAA records (most people don't)

---

## ✅ **Most Likely: You Don't Need This**

CAA records are optional security records. If you haven't explicitly added them, they don't exist, and you don't need to worry about it!
