# Vercel to AppWrite Migration Guide

**Status:** Planning Document - For Future Implementation  
**Target:** Fork of Current Repository  
**Date Created:** October 9, 2025

---

## ⚠️ Important Notice

**This guide is for a FUTURE migration to a forked repository.**

- ✅ **Current Project:** Continue using Vercel + AppWrite
- 🔄 **Future Project:** Create fork and migrate to AppWrite-only
- ❌ **Do NOT apply to current repository**

The migration will create a completely separate project variant for experimentation and evaluation.

---

## 📊 Executive Summary

### Current Architecture
- **Frontend Hosting:** Vercel (6 React SPAs)
- **Backend:** AppWrite Cloud (database, functions, storage)
- **Email:** Resend via AppWrite functions
- **DNS:** Porkbun
- **Cost:** Vercel Free ($0) + AppWrite Pro ($15/month) = **$15/month**

### Proposed Architecture
- **Frontend Hosting:** AppWrite Static Sites
- **Backend:** AppWrite Cloud (database, functions, storage)
- **Email:** Resend via AppWrite functions
- **DNS:** Porkbun → AppWrite CDN
- **Cost:** AppWrite Pro ($15/month) = **$15/month**

### Key Benefits
- ✅ **Simpler:** Single platform for everything
- ✅ **Lower cost:** Save $20/month if upgrading to Vercel Pro
- ✅ **No rate limits:** No 100 deploys/day restriction
- ✅ **Better integration:** Frontend and backend in same ecosystem
- ✅ **Unified tooling:** One CLI, one dashboard

### Key Challenges
- ⚠️ **Migration effort:** 2-4 days of work
- ⚠️ **Less mature:** AppWrite static hosting newer than Vercel
- ⚠️ **Fewer docs:** Smaller community than Vercel
- ⚠️ **CI/CD setup:** Manual GitHub Actions configuration

---

## 🎯 Migration Strategy

### Phase 1: Planning & Preparation (1 day)

#### 1.1 Fork Repository
```bash
# On GitHub:
# 1. Go to https://github.com/SystemVirtue/djamms-50-pg
# 2. Click "Fork" button
# 3. Name: "djamms-appwrite-only" or similar
# 4. Create fork

# Clone the fork locally:
git clone https://github.com/YOUR_USERNAME/djamms-appwrite-only.git
cd djamms-appwrite-only

# Add original as upstream (for syncing)
git remote add upstream https://github.com/SystemVirtue/djamms-50-pg.git
```

#### 1.2 Create New AppWrite Project
```bash
# Log into AppWrite Console
# Create new project: "DJAMMS AppWrite Migration Test"
# Note project ID: will be different from production
```

#### 1.3 Document Current State
```bash
# Document current Vercel setup
vercel ls > VERCEL_CURRENT_STATE.txt
vercel env ls > VERCEL_ENV_BACKUP.txt

# Export AppWrite schema from PRODUCTION
cd scripts/schema-manager
node appwrite-schema.cjs export

# Commit documentation
git add -A
git commit -m "MIGRATION: Document baseline state"
```

---

### Phase 2: AppWrite Static Sites Setup (1 day)

#### 2.1 Configure AppWrite for Static Hosting

**In AppWrite Console:**
1. Go to Project Settings → Platforms
2. Add Web Platform for each subdomain:
   - `https://auth-test.djamms.app`
   - `https://player-test.djamms.app`
   - `https://admin-test.djamms.app`
   - `https://dashboard-test.djamms.app`
   - `https://kiosk-test.djamms.app`
   - `https://landing-test.djamms.app`

#### 2.2 Create Storage Buckets for Static Sites

```bash
# Using AppWrite CLI
appwrite login

# Create buckets for each app
appwrite storage createBucket \
  --bucketId "auth-static" \
  --name "Auth App Static Files" \
  --permissions "read(*)" \
  --enabled true

appwrite storage createBucket \
  --bucketId "player-static" \
  --name "Player App Static Files" \
  --permissions "read(*)" \
  --enabled true

appwrite storage createBucket \
  --bucketId "admin-static" \
  --name "Admin App Static Files" \
  --permissions "read(*)" \
  --enabled true

appwrite storage createBucket \
  --bucketId "dashboard-static" \
  --name "Dashboard App Static Files" \
  --permissions "read(*)" \
  --enabled true

appwrite storage createBucket \
  --bucketId "kiosk-static" \
  --name "Kiosk App Static Files" \
  --permissions "read(*)" \
  --enabled true

appwrite storage createBucket \
  --bucketId "landing-static" \
  --name "Landing App Static Files" \
  --permissions "read(*)" \
  --enabled true
```

#### 2.3 Configure Buckets as Websites

```bash
# Enable website serving for each bucket
appwrite storage updateBucket \
  --bucketId "auth-static" \
  --fileSecurity false \
  --enabled true

# Repeat for all buckets...
```

---

### Phase 3: Build & Deploy Pipeline (1 day)

#### 3.1 Create Deployment Script

**File:** `scripts/deploy-to-appwrite.sh`

```bash
#!/bin/bash
set -e

echo "🔨 Building all apps..."

# Build each app
npm run build --workspace=apps/auth
npm run build --workspace=apps/player
npm run build --workspace=apps/admin
npm run build --workspace=apps/dashboard
npm run build --workspace=apps/kiosk
npm run build --workspace=apps/landing

echo "📦 Packaging for AppWrite..."

# Package each dist folder
cd apps/auth/dist && tar -czf ../../../auth-dist.tar.gz . && cd ../../..
cd apps/player/dist && tar -czf ../../../player-dist.tar.gz . && cd ../../..
cd apps/admin/dist && tar -czf ../../../admin-dist.tar.gz . && cd ../../..
cd apps/dashboard/dist && tar -czf ../../../dashboard-dist.tar.gz . && cd ../../..
cd apps/kiosk/dist && tar -czf ../../../kiosk-dist.tar.gz . && cd ../../..
cd apps/landing/dist && tar -czf ../../../landing-dist.tar.gz . && cd ../../..

echo "☁️  Uploading to AppWrite Storage..."

# Upload to AppWrite buckets
appwrite storage createFile \
  --bucketId "auth-static" \
  --fileId "unique()" \
  --file "auth-dist.tar.gz"

# Repeat for all apps...

echo "✅ Deployment complete!"
```

#### 3.2 Create GitHub Actions Workflow

**File:** `.github/workflows/deploy-appwrite.yml`

```yaml
name: Deploy to AppWrite

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build all apps
        run: |
          npm run build --workspace=apps/auth
          npm run build --workspace=apps/player
          npm run build --workspace=apps/admin
          npm run build --workspace=apps/dashboard
          npm run build --workspace=apps/kiosk
          npm run build --workspace=apps/landing
      
      - name: Install AppWrite CLI
        run: npm install -g appwrite-cli
      
      - name: Login to AppWrite
        run: |
          appwrite login \
            --email ${{ secrets.APPWRITE_EMAIL }} \
            --password ${{ secrets.APPWRITE_PASSWORD }}
      
      - name: Deploy Auth App
        run: |
          cd apps/auth/dist
          tar -czf ../../../auth-dist.tar.gz .
          cd ../../..
          appwrite storage createFile \
            --bucketId "auth-static" \
            --fileId "unique()" \
            --file "auth-dist.tar.gz"
      
      # Repeat for other apps...
      
      - name: Notify Deployment
        run: echo "✅ Deployed to AppWrite!"
```

#### 3.3 Configure GitHub Secrets

```bash
# In GitHub repo settings → Secrets and variables → Actions
# Add:
APPWRITE_EMAIL=your-appwrite-email@example.com
APPWRITE_PASSWORD=your-appwrite-password
APPWRITE_PROJECT_ID=your-test-project-id
APPWRITE_API_KEY=your-api-key
```

---

### Phase 4: DNS Migration (2 hours)

#### 4.1 Update Porkbun DNS Records

**Current Setup (Vercel):**
```
CNAME  auth.djamms.app       → vercel-dns-017.com
CNAME  player.djamms.app     → vercel-dns-017.com
CNAME  admin.djamms.app      → vercel-dns-017.com
CNAME  dashboard.djamms.app  → vercel-dns-017.com
CNAME  kiosk.djamms.app      → vercel-dns-017.com
CNAME  www.djamms.app        → vercel-dns-017.com
```

**New Setup (AppWrite):**
```
CNAME  auth-test.djamms.app       → appwrite.network
CNAME  player-test.djamms.app     → appwrite.network
CNAME  admin-test.djamms.app      → appwrite.network
CNAME  dashboard-test.djamms.app  → appwrite.network
CNAME  kiosk-test.djamms.app      → appwrite.network
CNAME  landing-test.djamms.app    → appwrite.network
```

**Note:** Use `-test` subdomains initially to avoid disrupting production!

#### 4.2 Configure Custom Domains in AppWrite

```bash
# For each bucket/site
appwrite storage updateBucket \
  --bucketId "auth-static" \
  --enabled true \
  --fileSecurity false

# In AppWrite Console:
# Project Settings → Domains
# Add custom domain for each:
# - auth-test.djamms.app → auth-static bucket
# - player-test.djamms.app → player-static bucket
# etc.
```

---

### Phase 5: Testing & Validation (4 hours)

#### 5.1 Test Static Site Serving

```bash
# Test each subdomain
curl -I https://auth-test.djamms.app
curl -I https://player-test.djamms.app
curl -I https://admin-test.djamms.app
curl -I https://dashboard-test.djamms.app
curl -I https://kiosk-test.djamms.app
curl -I https://landing-test.djamms.app

# All should return HTTP 200
```

#### 5.2 Test Application Functionality

**Auth Flow:**
1. Visit `https://auth-test.djamms.app`
2. Request magic link
3. Check email
4. Click link → should redirect to dashboard
5. Verify authentication works

**Player Functionality:**
1. Visit `https://player-test.djamms.app/player/test-venue`
2. Verify auth redirect works
3. Login and test player controls
4. Verify real-time sync

**Admin Functionality:**
1. Visit `https://admin-test.djamms.app/admin/test-venue`
2. Verify protected route
3. Test admin controls

**Dashboard:**
1. Visit `https://dashboard-test.djamms.app`
2. Verify session persistence
3. Test user management

**Kiosk:**
1. Visit `https://kiosk-test.djamms.app/kiosk/test-venue`
2. Test song request flow
3. Verify queue updates

**Landing:**
1. Visit `https://landing-test.djamms.app`
2. Verify public access
3. Test "Log in" button

#### 5.3 Performance Testing

```bash
# Use Lighthouse or WebPageTest
npm install -g lighthouse

lighthouse https://auth-test.djamms.app
lighthouse https://player-test.djamms.app
# etc.

# Compare with Vercel performance
lighthouse https://auth.djamms.app
```

#### 5.4 Load Testing

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 https://auth-test.djamms.app/

# Compare with Vercel
ab -n 1000 -c 10 https://auth.djamms.app/
```

---

### Phase 6: Migration Decision (Review)

#### 6.1 Performance Comparison

| Metric | Vercel | AppWrite | Winner |
|--------|--------|----------|--------|
| Initial Load Time | ___ ms | ___ ms | |
| Time to Interactive | ___ ms | ___ ms | |
| Lighthouse Score | ___ | ___ | |
| CDN Response Time | ___ ms | ___ ms | |
| Build Time | ___ min | ___ min | |

#### 6.2 Cost Comparison

| Item | Current | AppWrite-Only | Savings |
|------|---------|---------------|---------|
| Vercel Free | $0 | $0 | $0 |
| Vercel Pro (future) | $20 | $0 | $20 |
| AppWrite Pro | $15 | $15 | $0 |
| **Total** | **$15-35** | **$15** | **$0-20** |

#### 6.3 Feature Comparison

| Feature | Vercel | AppWrite | Notes |
|---------|--------|----------|-------|
| Auto-deploy from Git | ✅ Excellent | ⚠️ Manual setup | GitHub Actions required |
| Preview deployments | ✅ Automatic | ❌ Not available | Manual staging needed |
| Rollback | ✅ One-click | ⚠️ Manual | Requires versioning strategy |
| Build cache | ✅ Automatic | ⚠️ Manual | Slower builds initially |
| CDN | ✅ Global | ✅ Global | Both good |
| SSL | ✅ Automatic | ✅ Automatic | Both good |
| Environment variables | ✅ Per-project | ✅ Per-project | Both good |
| Logs | ✅ Excellent | ✅ Good | Vercel slightly better |

#### 6.4 Developer Experience

| Aspect | Vercel | AppWrite | Notes |
|--------|--------|----------|-------|
| Setup complexity | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate | Vercel simpler |
| Documentation | ⭐⭐⭐⭐⭐ Extensive | ⭐⭐⭐ Good | Vercel better docs |
| Community | ⭐⭐⭐⭐⭐ Large | ⭐⭐⭐ Growing | Vercel more mature |
| Debugging | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | Both solid |
| Integration | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | AppWrite unified |

---

## 🔄 Rollback Plan

If migration doesn't meet expectations:

### Immediate Rollback (< 5 minutes)

```bash
# 1. Update DNS back to Vercel
# In Porkbun:
# Change CNAME records back to vercel-dns-017.com

# 2. Wait for DNS propagation (1-5 minutes)
dig auth.djamms.app

# 3. Verify Vercel is serving
curl -I https://auth.djamms.app
```

### Data Preservation

- ✅ **Database:** Not affected (stays on AppWrite)
- ✅ **Functions:** Not affected (stays on AppWrite)
- ✅ **User sessions:** Not affected (JWT-based)
- ✅ **Git history:** Preserved in fork
- ✅ **Vercel deployments:** Still active (not deleted)

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Fork repository
- [ ] Create new AppWrite project
- [ ] Document current Vercel setup
- [ ] Export AppWrite schema
- [ ] Backup environment variables
- [ ] Test current production functionality

### AppWrite Setup
- [ ] Create storage buckets (6 apps)
- [ ] Configure bucket permissions
- [ ] Enable website serving
- [ ] Add web platforms
- [ ] Configure custom domains

### Build Pipeline
- [ ] Create deployment script
- [ ] Test local deployment
- [ ] Create GitHub Actions workflow
- [ ] Configure GitHub secrets
- [ ] Test CI/CD pipeline

### DNS Migration
- [ ] Update Porkbun CNAME records (use -test subdomains)
- [ ] Wait for DNS propagation
- [ ] Verify DNS resolution
- [ ] Test SSL certificates

### Testing
- [ ] Test static site serving (all 6 apps)
- [ ] Test auth flow end-to-end
- [ ] Test player functionality
- [ ] Test admin functionality
- [ ] Test dashboard
- [ ] Test kiosk
- [ ] Test landing page
- [ ] Run performance tests
- [ ] Run load tests
- [ ] Compare metrics with Vercel

### Decision
- [ ] Review performance data
- [ ] Review cost comparison
- [ ] Review developer experience
- [ ] Team discussion
- [ ] Document decision
- [ ] Create migration plan (if proceeding)
- [ ] Create rollback plan (if reverting)

### Go-Live (if approved)
- [ ] Update DNS to production subdomains
- [ ] Monitor for 24 hours
- [ ] Verify all functionality
- [ ] Update documentation
- [ ] Archive Vercel projects (don't delete yet)
- [ ] Celebrate! 🎉

### Post-Migration
- [ ] Monitor performance for 1 week
- [ ] Collect feedback
- [ ] Document lessons learned
- [ ] Update this guide
- [ ] Share results with team

---

## 🛠️ Troubleshooting

### Issue: Static files not serving

**Symptoms:** 404 errors on all routes

**Solutions:**
1. Check bucket permissions: `read(*)`
2. Verify bucket is enabled
3. Check file upload succeeded
4. Verify website serving is enabled
5. Check DNS points to AppWrite

### Issue: Slow build times

**Symptoms:** GitHub Actions taking > 10 minutes

**Solutions:**
1. Enable build caching in GitHub Actions
2. Use smaller Docker images
3. Parallelize builds
4. Consider incremental builds

### Issue: DNS not resolving

**Symptoms:** `dig` shows old records

**Solutions:**
1. Wait for propagation (up to 48 hours)
2. Lower TTL before migration (to 300)
3. Flush local DNS cache
4. Check Porkbun propagation status

### Issue: CORS errors

**Symptoms:** API calls failing from frontend

**Solutions:**
1. Add domains to AppWrite platform list
2. Configure CORS in AppWrite Console
3. Verify API endpoint URLs
4. Check browser console for exact error

---

## 📚 Additional Resources

### AppWrite Documentation
- **Static Sites:** https://appwrite.io/docs/products/storage/buckets#website
- **Custom Domains:** https://appwrite.io/docs/advanced/platform#custom-domains
- **CLI Reference:** https://appwrite.io/docs/command-line
- **Storage API:** https://appwrite.io/docs/client/storage

### GitHub Actions
- **Workflow Syntax:** https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Caching:** https://docs.github.com/en/actions/using-workflows/caching-dependencies

### DNS & CDN
- **DNS Propagation:** https://www.whatsmydns.net/
- **CDN Comparison:** Multiple providers benchmarked

---

## 💰 Cost Analysis (Detailed)

### Current Setup (Vercel + AppWrite)

**Month 1-3 (Free Tier):**
- Vercel Free: $0
- AppWrite Pro: $15
- **Total: $15/month**

**After exceeding Vercel free limits:**
- Vercel Pro: $20
- AppWrite Pro: $15
- **Total: $35/month**

### AppWrite-Only Setup

**All Months:**
- AppWrite Pro: $15
- **Total: $15/month**

### Savings Timeline

| Month | Current | AppWrite-Only | Savings |
|-------|---------|---------------|---------|
| 1-3 | $15 | $15 | $0 |
| 4+ | $35 | $15 | $20/month |
| Year 1 | $240 | $180 | $60/year |
| Year 2 | $420 | $180 | $240/year |

**Break-even:** Immediate (if already on Vercel Pro)  
**ROI:** $20/month = $240/year savings after migration

---

## 🎯 Success Criteria

Migration is considered successful if:

### Performance
- [ ] Page load times within 10% of Vercel
- [ ] Lighthouse scores ≥ 90
- [ ] 99.9% uptime over 1 month
- [ ] CDN response times < 100ms

### Functionality
- [ ] All 6 apps fully functional
- [ ] Auth flow works end-to-end
- [ ] Real-time sync operational
- [ ] No user-facing errors

### Developer Experience
- [ ] Deployment takes < 10 minutes
- [ ] CI/CD pipeline reliable
- [ ] Documentation complete
- [ ] Team comfortable with workflow

### Cost
- [ ] Total cost ≤ $15/month
- [ ] No unexpected charges
- [ ] Clear billing breakdown

---

## 📅 Timeline Estimate

**Total Time:** 2-4 days (depending on experience level)

- **Day 1 (8 hours):** Planning, setup, bucket configuration
- **Day 2 (8 hours):** Build pipeline, GitHub Actions, initial deployment
- **Day 3 (4 hours):** DNS migration, testing
- **Day 4 (4 hours):** Performance testing, decision review

**Ongoing:** Monitor for 1 week post-migration

---

## ✅ Recommendation

### When to Migrate

**Migrate now if:**
- ✅ Already hitting Vercel rate limits (100 deploys/day)
- ✅ Planning to upgrade to Vercel Pro ($20/month)
- ✅ Want simpler architecture
- ✅ Team comfortable with manual CI/CD setup
- ✅ Have 2-4 days for migration work

**Stay with Vercel if:**
- ✅ Vercel free tier is sufficient
- ✅ Team prefers Vercel's DX
- ✅ Need preview deployments
- ✅ Want one-click rollbacks
- ✅ Don't have time for migration

### Final Recommendation

**For DJAMMS project specifically:**

After launch and stable, **consider migrating** if:
1. Hitting Vercel rate limits regularly
2. Comfortable with current AppWrite setup
3. Want to consolidate platforms
4. Have time for proper testing

**Best approach:** Run both for 1 month on test subdomains, compare metrics, then decide.

---

**This guide will be updated based on actual migration experience when implemented.**

**Last Updated:** October 9, 2025  
**Status:** Planning Document  
**Next Review:** After forking and initial testing
