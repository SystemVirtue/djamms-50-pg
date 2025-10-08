# 🚀 Vercel Deployment - Quick Reference

## One-Command Deployment Options

### Option 1: Deploy All Apps (Automated)
```bash
npm run deploy:vercel
```
This script will:
- Login to Vercel
- Deploy all 6 apps sequentially
- Prompt for configuration on first run

### Option 2: Deploy Individual Apps
```bash
npm run deploy:landing      # https://djamms.app
npm run deploy:auth         # https://auth.djamms.app
npm run deploy:player       # https://player.djamms.app
npm run deploy:admin        # https://admin.djamms.app
npm run deploy:kiosk        # https://kiosk.djamms.app
npm run deploy:dashboard    # https://dashboard.djamms.app
```

### Option 3: Build Then Deploy All
```bash
npm run deploy:all
```
This will:
1. Build all apps locally (verify no errors)
2. Deploy each app to production

---

## First Time Setup Checklist

### Before Deploying:
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Have your domain ready: djamms.app
- [ ] Copy all environment variables from .env

### During First Deploy:
When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → djamms-landing (or auth, player, etc.)
- **Override settings?** → No

### After Deploying Each App:
1. **Add Environment Variables**
   - Go to: `https://vercel.com/[your-username]/[project-name]/settings/environment-variables`
   - Add all `VITE_*` variables (see VERCEL_DEPLOYMENT_GUIDE.md for specific vars per app)
   - Set for: Production, Preview, Development

2. **Add Custom Domain**
   - Go to: `https://vercel.com/[your-username]/[project-name]/settings/domains`
   - Add domain (e.g., `djamms.app`, `auth.djamms.app`)
   - Copy the CNAME record Vercel provides

3. **Update DNS on Porkbun**
   - Go to: https://porkbun.com/account/domain
   - Update/add CNAME record with Vercel's value
   - Wait 10-15 minutes for propagation

---

## Environment Variables Quick Reference

### All Apps Need:
```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68e57de9003234a84cae
VITE_JWT_SECRET=[your-jwt-secret]
```

### App-Specific Variables:

**Auth App:**
```bash
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_APPWRITE_MAGIC_REDIRECT=https://auth.djamms.app/auth/callback
VITE_APP_URL_LANDING=https://djamms.app
VITE_APP_URL_PLAYER=https://player.djamms.app
```

**Player App:**
```bash
VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY=68e5a41f00222cab705b
VITE_YOUTUBE_API_KEY=[your-youtube-api-key]
VITE_APP_URL_AUTH=https://auth.djamms.app
VITE_APP_URL_ADMIN=https://admin.djamms.app
```

**Admin & Kiosk Apps:**
```bash
VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=68e5a5a1001a19e7f5c2
```

See `VERCEL_DEPLOYMENT_GUIDE.md` for complete environment variable lists.

---

## DNS Configuration (Porkbun)

Update these records:
```
Type    Host                    Value                       TTL
ALIAS   djamms.app              cname.vercel-dns.com       600
CNAME   auth.djamms.app         cname.vercel-dns.com       600
CNAME   player.djamms.app       cname.vercel-dns.com       600
CNAME   admin.djamms.app        cname.vercel-dns.com       600
CNAME   kiosk.djamms.app        cname.vercel-dns.com       600
CNAME   dashboard.djamms.app    cname.vercel-dns.com       600
```

**Note:** Vercel will provide the exact CNAME value when you add the domain.

---

## Verification Commands

### Check DNS Propagation:
```bash
dig djamms.app
dig auth.djamms.app
```

### Test Local Build Before Deploy:
```bash
npm run build
```

### Check Deployment Status:
```bash
vercel ls
```

### View Deployment Logs:
```bash
vercel logs [deployment-url]
```

---

## Common Issues & Quick Fixes

### Build Fails on Vercel
```bash
# Test build locally first
npm run build

# If successful, force redeploy
vercel --prod --force
```

### Environment Variables Not Working
1. Check they're set in Vercel dashboard
2. Ensure they're set for Production environment
3. Redeploy after adding variables

### Domain Not Working
1. Wait 15-30 minutes for DNS propagation
2. Verify DNS records on Porkbun
3. Check domain configuration in Vercel

### CORS Errors
1. Add production domains to AppWrite Console
2. Go to: Settings → Platforms
3. Add web platform for each subdomain

---

## Production URLs

After deployment, your apps will be live at:

```
🌐 Landing:    https://djamms.app
🔐 Auth:       https://auth.djamms.app
🎵 Player:     https://player.djamms.app
⚙️  Admin:      https://admin.djamms.app
📱 Kiosk:      https://kiosk.djamms.app
📊 Dashboard:  https://dashboard.djamms.app
```

---

## Auto-Deployment (After Initial Setup)

Once configured, every `git push` to `main` will automatically:
- ✅ Trigger Vercel deployment
- ✅ Build all apps
- ✅ Deploy to production
- ✅ Update live sites

Enable in Vercel dashboard: **Settings → Git → Automatic Deployments**

---

## Cost

**Hobby (Free):**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains + SSL
- Perfect for MVP

**Pro ($20/month):**
- 1TB bandwidth/month
- Team collaboration
- Advanced analytics
- Priority support

---

## Need More Help?

📚 **Full Guide:** `VERCEL_DEPLOYMENT_GUIDE.md`  
🔧 **Troubleshooting:** See "Troubleshooting" section in full guide  
🌐 **Vercel Docs:** https://vercel.com/docs  
💬 **AppWrite Docs:** https://appwrite.io/docs

---

## Quick Deploy Workflow

1. **First time only:**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy:**
   ```bash
   npm run deploy:vercel
   ```

3. **Configure in dashboard:**
   - Add environment variables
   - Set custom domains
   - Update DNS

4. **Test:**
   - Visit https://djamms.app
   - Click login → https://auth.djamms.app
   - Try player → https://player.djamms.app

5. **Done!** 🎉

Future deploys: Just `git push` and Vercel auto-deploys!
