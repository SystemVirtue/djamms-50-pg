# Where to Log In - October 22, 2025

## Current Situation

**The auth app is NOT deployed to production yet.** 🔒

Only the **player app** is currently live at `www.djamms.app`.

## Your Login Options

### Option 1: Local Development (Available Now ✅)

The auth app runs locally at:

**http://localhost:3002**

**To start local servers:**
```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
npm run dev
```

This starts all apps:
- Landing: http://localhost:3000
- Player: http://localhost:3001
- **Auth: http://localhost:3002** ← Login here
- Admin: http://localhost:3003
- Kiosk: http://localhost:3004

**Login routes:**
- `/` or `/login` - Magic link login form
- `/callback` - Magic link callback handler

### Option 2: Deploy Auth App (Recommended for Production 🚀)

The auth app is **built and ready** (`apps/auth/dist`) but needs deployment.

## Deployment Options

### Quick Option: Create Separate Auth Site

Create a new AppWrite site for the auth app:

**1. Create Site via AppWrite Console**
- Go to: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/sites
- Click "Create Site"
- Name: "DJAMMS Auth"
- Site ID: `djamms-auth`

**2. Configure Site**
```yaml
Framework: vite
Adapter: static
Build Runtime: node-20.0
Build Command: npm run build:auth
Output Directory: apps/auth/dist
Fallback File: index.html
VCS: Connect to SystemVirtue/djamms-50-pg (branch: main)
```

**3. Add Domain**
- Custom domain: `auth.djamms.app`
- Or use AppWrite subdomain: `djamms-auth.syd.cloud.appwrite.io`

**4. Deploy**
- Create deployment from GitHub (branch: main)
- Wait for build to complete
- Login at: **https://auth.djamms.app**

### Alternative: Use AppWrite's Built-in Auth

Since you're already using AppWrite, you could use their built-in authentication:

**AppWrite Console:**
https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/auth

This provides:
- Email/Password auth
- Magic URL (passwordless)
- OAuth providers (Google, GitHub, etc.)
- Session management

## Current Authentication Flow

Your system uses **magic link authentication**:

### How It Works

1. **User enters email** at login page
2. **System sends magic link** to email via AppWrite function
3. **User clicks link** in email
4. **Callback page validates** the token
5. **JWT created** with 7-day expiration
6. **User logged in** and redirected

### Files Involved

**Auth App:**
- `apps/auth/src/components/Login.tsx` - Login form
- `apps/auth/src/components/AuthCallback.tsx` - Callback handler
- Routes: `/login`, `/callback`

**AppWrite Function:**
- `functions/appwrite/functions/magic-link/` - Sends magic link emails

### Environment Variables Needed

The auth app needs these environment variables (currently set on djamms-unified site):

```env
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=<your-database-id>
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/callback
```

## Temporary Workaround

Since auth isn't deployed yet, you can:

### 1. Test Locally
```bash
npm run dev
# Visit http://localhost:3002
```

### 2. Use AppWrite Console Directly
- Go to: https://syd.cloud.appwrite.io/console/project-68cc86c3002b27e13947/auth/users
- Create test users manually
- Get session tokens from console

### 3. Add Auth to Landing Page (Placeholder)

I can add a note to the landing page about auth being in development:

```tsx
<div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-8">
  <p className="text-yellow-200 text-sm">
    🔒 Authentication is currently in development. 
    Check back soon or contact admin for access.
  </p>
</div>
```

## Next Steps

### To Get Login Working in Production:

**Option A: Quick Deploy (15 minutes)**

I can create and deploy the auth site for you right now using the MCP tools:

```bash
# Create site
mcp_appwrite-api_sites_create \
  --site_id djamms-auth \
  --name "DJAMMS Auth" \
  --framework vite \
  --build_command "npm run build:auth" \
  --output_directory "apps/auth/dist" \
  --build_runtime "node-20.0" \
  --adapter static \
  --fallback_file "index.html"

# Deploy from GitHub
mcp_appwrite-api_sites_create_vcs_deployment \
  --site_id djamms-auth \
  --type branch \
  --reference main \
  --activate true
```

**Option B: Manual Console Deployment (5 minutes)**

1. Go to AppWrite Console > Sites
2. Create new site with settings above
3. Deploy from GitHub

**Option C: Keep Using Local Dev**

Just run `npm run dev` whenever you need to test auth.

## Recommended Solution

**I recommend Option A** - Let me create and deploy the auth site now. It will be live at:

**https://djamms-auth.syd.cloud.appwrite.io** (AppWrite subdomain)

Or we can add custom domain:

**https://auth.djamms.app** (requires DNS setup)

## What Would You Like to Do?

1. **Deploy auth site now** - I'll create it via MCP tools (15 min)
2. **Manual console setup** - I'll give you step-by-step instructions
3. **Add login placeholder** - Add note to landing page about auth coming soon
4. **Just use local dev** - Keep using http://localhost:3002 for now

Let me know and I'll get you logged in! 🚀
