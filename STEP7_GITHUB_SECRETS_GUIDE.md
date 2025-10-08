# Step 7: GitHub Secrets Configuration Guide

**Priority:** 🟡 HIGH - Required for CI/CD  
**Time:** 10 minutes  
**Status:** Ready to Configure

---

## 🎯 Overview

Your GitHub Actions CI/CD workflow currently has **10 warnings** because required secrets are not configured. This guide will show you exactly how to add them.

**Current CI Status:**
- ⚠️ 10 warnings in `.github/workflows/ci.yml`
- ❌ E2E tests skip if secrets missing
- ✅ Unit tests run without secrets

**After Configuration:**
- ✅ All secrets configured
- ✅ Full CI/CD pipeline active
- ✅ E2E tests run in CI (with mocks)
- ✅ Automated deployments possible

---

## 📝 Required Secrets

You need to configure **5 secrets** in your GitHub repository:

| Secret Name | Purpose | Source |
|-------------|---------|--------|
| `APPWRITE_ENDPOINT` | AppWrite API endpoint | From `.env` |
| `APPWRITE_PROJECT_ID` | AppWrite project ID | From `.env` |
| `APPWRITE_DATABASE_ID` | Database ID | From `.env` |
| `APPWRITE_API_KEY` | API key for functions | AppWrite Console |
| `JWT_SECRET` | JWT signing secret | From `.env` |

---

## 🔑 Get Secret Values

### Step 1: Extract from .env File

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

# View all relevant secrets
grep "APPWRITE\|JWT_SECRET" .env
```

**Your Current Values:**
```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=[your-project-id]
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
VITE_JWT_SECRET=[your-jwt-secret]
```

### Step 2: Get API Key from AppWrite Console

1. Go to https://cloud.appwrite.io/console
2. Select your project
3. Navigate to **Settings** → **API Keys**
4. Create new API key or copy existing one
5. **Scopes needed:**
   - `databases.read`
   - `databases.write`
   - `functions.read`
   - `functions.write`
   - `collections.read`
   - `collections.write`

---

## 🚀 Add Secrets to GitHub

### Method 1: GitHub Web Interface (Recommended)

1. **Navigate to Repository Settings**
   ```
   Go to: https://github.com/[YOUR_USERNAME]/djamms-prototype/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add Each Secret:**

   **Secret 1: APPWRITE_ENDPOINT**
   - Name: `APPWRITE_ENDPOINT`
   - Value: `https://syd.cloud.appwrite.io/v1`
   - Click "Add secret"

   **Secret 2: APPWRITE_PROJECT_ID**
   - Name: `APPWRITE_PROJECT_ID`
   - Value: [Copy from your `.env` file]
   - Click "Add secret"

   **Secret 3: APPWRITE_DATABASE_ID**
   - Name: `APPWRITE_DATABASE_ID`
   - Value: `68e57de9003234a84cae`
   - Click "Add secret"

   **Secret 4: APPWRITE_API_KEY**
   - Name: `APPWRITE_API_KEY`
   - Value: [Copy from AppWrite Console]
   - Click "Add secret"

   **Secret 5: JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: [Copy from your `.env` file]
   - Click "Add secret"

4. **Verify All Secrets Added**
   - You should see all 5 secrets listed
   - They will show as "Updated X minutes ago"
   - Values are hidden (encrypted)

### Method 2: GitHub CLI (Alternative)

```bash
# Install GitHub CLI if needed
brew install gh

# Authenticate
gh auth login

# Navigate to your repo
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

# Add secrets (replace values with yours)
gh secret set APPWRITE_ENDPOINT --body "https://syd.cloud.appwrite.io/v1"
gh secret set APPWRITE_PROJECT_ID --body "your-project-id"
gh secret set APPWRITE_DATABASE_ID --body "68e57de9003234a84cae"
gh secret set APPWRITE_API_KEY --body "your-api-key"
gh secret set JWT_SECRET --body "your-jwt-secret"

# Verify secrets
gh secret list
```

---

## ✅ Verification

### Step 1: Check Secrets in GitHub

1. Go to: `https://github.com/[YOUR_USERNAME]/djamms-prototype/settings/secrets/actions`
2. You should see:
   ```
   APPWRITE_ENDPOINT       Updated X minutes ago
   APPWRITE_PROJECT_ID     Updated X minutes ago
   APPWRITE_DATABASE_ID    Updated X minutes ago
   APPWRITE_API_KEY        Updated X minutes ago
   JWT_SECRET              Updated X minutes ago
   ```

### Step 2: Trigger a New CI Run

```bash
# Make a small change and push
git add .
git commit -m "test: trigger CI with secrets configured"
git push origin main
```

### Step 3: Monitor GitHub Actions

1. Go to: `https://github.com/[YOUR_USERNAME]/djamms-prototype/actions`
2. Click on the latest workflow run
3. Check that:
   - ✅ No warnings about missing secrets
   - ✅ "Build" job completes
   - ✅ "Unit Tests" pass
   - ✅ "E2E Tests" run (with mocks)

---

## 📊 What Changes After Configuration

### Before (Current State):
```yaml
# .github/workflows/ci.yml shows warnings:
⚠️ Context access might be invalid: APPWRITE_ENDPOINT
⚠️ Context access might be invalid: APPWRITE_PROJECT_ID
⚠️ Context access might be invalid: APPWRITE_DATABASE_ID
⚠️ Context access might be invalid: APPWRITE_API_KEY
⚠️ Context access might be invalid: JWT_SECRET
(10 warnings total - some secrets used twice)
```

### After Configuration:
```yaml
# .github/workflows/ci.yml:
✅ All secrets available
✅ .env file created in CI
✅ Tests run with proper configuration
✅ No warnings
```

---

## 🔧 How Secrets Are Used in CI

### In `.github/workflows/ci.yml`:

```yaml
- name: Create .env file
  run: |
    echo "APPWRITE_ENDPOINT=${{ secrets.APPWRITE_ENDPOINT }}" >> .env
    echo "APPWRITE_PROJECT_ID=${{ secrets.APPWRITE_PROJECT_ID }}" >> .env
    echo "APPWRITE_DATABASE_ID=${{ secrets.APPWRITE_DATABASE_ID }}" >> .env
    echo "APPWRITE_API_KEY=${{ secrets.APPWRITE_API_KEY }}" >> .env
    echo "VITE_APPWRITE_ENDPOINT=${{ secrets.APPWRITE_ENDPOINT }}" >> .env
    echo "VITE_APPWRITE_PROJECT_ID=${{ secrets.APPWRITE_PROJECT_ID }}" >> .env
    echo "VITE_APPWRITE_DATABASE_ID=${{ secrets.APPWRITE_DATABASE_ID }}" >> .env
    echo "VITE_APPWRITE_API_KEY=${{ secrets.APPWRITE_API_KEY }}" >> .env
    echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
    echo "VITE_JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
```

**Purpose:**
- Creates `.env` file in CI environment
- Makes secrets available to tests
- Enables full test suite to run
- Allows schema verification
- Enables production builds

---

## 🔐 Security Best Practices

### ✅ Do:
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use different secrets for production vs. staging
- ✅ Review secret access logs periodically
- ✅ Limit repository collaborator access

### ❌ Don't:
- ❌ Never commit secrets to git
- ❌ Don't share secrets via Slack/email
- ❌ Don't use same secrets for multiple projects
- ❌ Don't log secrets in console.log
- ❌ Don't expose secrets in error messages

### 🛡️ Secret Rotation Plan:
```bash
# Every 90 days:
1. Generate new JWT_SECRET
2. Create new AppWrite API key
3. Update GitHub secrets
4. Update production .env
5. Redeploy applications
6. Revoke old API key
```

---

## 🎯 What You Can Do After Configuration

### 1. Automated Testing ✅
- Every push triggers full test suite
- Unit tests run automatically
- E2E tests run with mocks
- Build validation on PRs

### 2. Continuous Integration ✅
- Automatic builds on push
- Type checking
- Linting
- Test coverage reports

### 3. Deployment Ready 🚀
- Can add deployment steps to workflow
- Automated deployments to Vercel/Netlify
- Production builds validated
- Schema migrations can run in CI

### 4. Pull Request Checks ✅
- Status checks on PRs
- Automatic code review
- Test results in PR comments
- Build previews

---

## 📈 CI/CD Workflow Status

### Current Jobs:
```yaml
jobs:
  build:
    - Install dependencies ✅
    - Create .env (needs secrets) ⏳
    - Type check ✅
    - Build all apps ✅

  test:
    - Unit tests ✅
    - E2E tests (with mocks) ⏳
    
  # Optional future jobs:
  deploy:
    - Deploy to Vercel
    - Deploy functions to AppWrite
    - Run database migrations
```

---

## 🎉 Quick Setup Checklist

- [ ] 1. Get values from `.env` file (2 min)
- [ ] 2. Get API key from AppWrite Console (3 min)
- [ ] 3. Add all 5 secrets to GitHub (5 min)
- [ ] 4. Verify secrets in GitHub UI (1 min)
- [ ] 5. Trigger new CI run (1 min)
- [ ] 6. Confirm workflow passes (check Actions tab)

**Total Time:** ~10 minutes

---

## 🆘 Troubleshooting

### Issue: "Secret not found"
**Solution:** Double-check secret name spelling (case-sensitive)

### Issue: "Invalid secret value"
**Solution:** Ensure no extra spaces or newlines in secret value

### Issue: "Workflow still shows warnings"
**Solution:** 
1. Verify all 5 secrets added
2. Re-run workflow (don't just push)
3. Check GitHub Actions logs

### Issue: "Tests fail in CI but pass locally"
**Solution:**
1. Check `.env` format matches locally
2. Verify all VITE_ prefixed secrets added
3. Check test mocks are properly configured

---

## 📚 Additional Resources

- **GitHub Secrets Docs:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **AppWrite API Keys:** https://appwrite.io/docs/keys
- **CI/CD Best Practices:** https://docs.github.com/en/actions/guides

---

## 🚀 Next Steps After Configuration

1. **Test CI Pipeline**
   - Make a commit and push
   - Watch Actions tab
   - Verify all checks pass

2. **Add Deployment Job** (optional)
   ```yaml
   deploy:
     needs: [build, test]
     if: github.ref == 'refs/heads/main'
     runs-on: ubuntu-latest
     steps:
       - name: Deploy to Vercel
         run: vercel --prod
   ```

3. **Enable Branch Protection**
   - Require status checks to pass
   - Require pull request reviews
   - Require linear history

---

**Ready to configure secrets? Go to:**
`https://github.com/[YOUR_USERNAME]/djamms-prototype/settings/secrets/actions`

🎉 **You got this!**
