# DJAMMS AppWrite Deployment Guide

## Deployment Status

**Date**: January 10, 2025  
**Version**: 1.0.0  
**Status**: Ready for Production Deployment

---

## Pre-Deployment Checklist

### ✅ Build Status
- [x] Player app built successfully (183.83 kB)
- [x] Auth app built successfully (230.29 kB)
- [x] Admin app built successfully (325.71 kB)
- [x] Kiosk app built successfully (324.95 kB)
- [x] Landing app built successfully (146.05 kB)
- [x] Dashboard app built successfully (192.45 kB)

### ✅ Git Status
- [x] All changes committed
- [x] Pushed to GitHub (main branch)
- [x] Commit: 88b68ff - "feat: Complete DJAMMS implementation"

### ✅ AppWrite Configuration
- [x] Project ID: 68cc86c3002b27e13947
- [x] Project Name: DJAMMS_v1
- [x] Endpoint: https://syd.cloud.appwrite.io/v1
- [x] CLI authenticated

### ✅ Database Collections
- [x] queues (with indexes)
- [x] player_instances (with indexes)
- [x] player_state (with indexes)
- [x] player_commands (with indexes)
- [x] venues (with indexes)

---

## Deployment Steps

### Step 1: Deploy Sites to AppWrite

#### Option A: Using AppWrite CLI (Recommended)

```bash
# Navigate to project root
cd /Users/mikeclarkin/DJAMMS_50_page_prompt

# Deploy all sites
cd functions/appwrite
appwrite deploy sites
```

#### Option B: Manual Deployment via Console

1. **Login to AppWrite Console**: https://cloud.appwrite.io
2. **Select Project**: DJAMMS_v1
3. **Navigate to Sites**: Left sidebar → Sites
4. **Create Sites**:

**Site 1: Landing**
- Name: `djamms-landing`
- Source: Upload `apps/landing/dist/`
- Domain: Auto-generated or custom
- Environment: Production

**Site 2: Auth**
- Name: `djamms-auth`
- Source: Upload `apps/auth/dist/`
- Domain: Auto-generated or custom
- Environment: Production

**Site 3: Dashboard**
- Name: `djamms-dashboard`
- Source: Upload `apps/dashboard/dist/`
- Domain: Auto-generated or custom
- Environment: Production

**Site 4: Kiosk**
- Name: `djamms-kiosk`
- Source: Upload `apps/kiosk/dist/`
- Domain: Auto-generated or custom
- Environment: Production

**Site 5: Player**
- Name: `djamms-player`
- Source: Upload `apps/player/dist/`
- Domain: Auto-generated or custom
- Environment: Production

**Site 6: Admin**
- Name: `djamms-admin`
- Source: Upload `apps/admin/dist/`
- Domain: Auto-generated or custom
- Environment: Production

### Step 2: Configure Environment Variables

For each site, add environment variables:

```bash
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=main-db
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Important**: Replace `your_youtube_api_key_here` with actual YouTube Data API v3 key.

### Step 3: Verify Database Schema

```bash
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
npm run schema:check
```

If schema needs updates:
```bash
npm run schema:apply
```

### Step 4: Test Deployments

1. **Landing Page**: Visit landing site URL
   - Should show marketing page
   - "Get Started" button works
   - Navigation functional

2. **Auth**: Visit auth site URL
   - Email input visible
   - Magic link sends successfully
   - Verification redirects correctly

3. **Dashboard**: Visit dashboard URL
   - Requires authentication
   - Shows venue selection
   - Navigation to apps works

4. **Kiosk**: Visit kiosk URL + `/kiosk/{venueId}`
   - Search interface loads
   - YouTube search works
   - Request submission works

5. **Player**: Visit player URL + `/player/{venueId}`
   - Player interface loads
   - YouTube iframes load
   - Queue displays
   - Master election works

6. **Admin**: Visit admin URL + `/admin/{venueId}`
   - Requires admin auth
   - Tabs work (Controls, Queue, Settings)
   - Commands dispatch successfully
   - Settings save

---

## Post-Deployment Configuration

### Custom Domains (Optional)

1. **Add Domains in AppWrite Console**:
   - Sites → Select site → Domains → Add Domain
   
2. **Suggested Domain Structure**:
   - `djamms.app` → Landing
   - `auth.djamms.app` → Auth
   - `dashboard.djamms.app` → Dashboard
   - `kiosk.djamms.app` → Kiosk
   - `player.djamms.app` → Player
   - `admin.djamms.app` → Admin

3. **Configure DNS**:
   - Add CNAME records pointing to AppWrite domains
   - Wait for DNS propagation (up to 48 hours)
   - Enable SSL certificates in AppWrite

### Security Configuration

1. **CORS Settings**:
   - Add deployed domains to allowed origins
   - Console → Settings → Security → Platform

2. **Authentication**:
   - Verify magic link URLs point to deployed auth domain
   - Update redirect URLs in auth service
   - Test login flow end-to-end

3. **API Keys**:
   - Rotate any exposed keys
   - Store production keys securely
   - Update environment variables

### Performance Optimization

1. **CDN Configuration**:
   - AppWrite Sites includes CDN
   - Verify edge caching working
   - Check cache headers

2. **Asset Optimization**:
   - All assets already minified in build
   - Images optimized
   - CSS purged of unused styles

3. **Monitoring**:
   - Enable AppWrite analytics
   - Monitor site performance
   - Track error rates

---

## Rollback Plan

If deployment issues occur:

1. **Quick Rollback**:
   ```bash
   # Revert to previous git commit
   git revert HEAD
   git push origin main
   
   # Redeploy previous version
   npm run build
   appwrite deploy sites
   ```

2. **Site-Specific Rollback**:
   - AppWrite Console → Sites → Select site
   - Deployments tab → Select previous deployment
   - Click "Redeploy"

3. **Database Rollback**:
   ```bash
   # If schema changes cause issues
   # Restore from backup (if available)
   # Or manually revert schema changes
   ```

---

## Monitoring & Maintenance

### Health Checks

**Daily**:
- Check site availability
- Monitor error logs
- Review authentication success rate
- Check queue processing

**Weekly**:
- Review AppWrite analytics
- Check database performance
- Monitor storage usage
- Review user feedback

**Monthly**:
- Update dependencies
- Review security patches
- Optimize performance
- Scale resources if needed

### Log Monitoring

**AppWrite Console**:
- Functions → Logs
- Databases → Logs
- Sites → Analytics

**Browser Console**:
- Check for JavaScript errors
- Monitor network requests
- Review console warnings

### Alerts Setup

Configure alerts for:
- Site downtime
- Database errors
- Authentication failures
- High error rates
- Storage limits
- API quota limits

---

## Troubleshooting

### Issue: Site Not Loading

**Symptoms**: Blank page or 404 error

**Solutions**:
1. Check deployment status in AppWrite Console
2. Verify build artifacts exist in dist/ folder
3. Check browser console for errors
4. Verify environment variables set
5. Check CORS settings

### Issue: Authentication Failing

**Symptoms**: Magic link not working or redirects fail

**Solutions**:
1. Verify auth domain in magic link URLs
2. Check AppWrite project settings
3. Verify session configuration
4. Check email delivery logs
5. Test with different email provider

### Issue: Real-Time Not Working

**Symptoms**: Queue updates not appearing, commands not executing

**Solutions**:
1. Check WebSocket connection
2. Verify AppWrite endpoint in environment
3. Check browser network tab for realtime connections
4. Verify database permissions
5. Check collection subscriptions in code

### Issue: YouTube Search Not Working

**Symptoms**: Search returns no results or errors

**Solutions**:
1. Verify YouTube API key set
2. Check API quota in Google Cloud Console
3. Test API key with direct API call
4. Check browser console for CORS errors
5. Verify API key restrictions (if any)

### Issue: Master Player Not Electing

**Symptoms**: Multiple masters or no master

**Solutions**:
1. Check player_instances collection
2. Verify heartbeat interval
3. Check cleanup of expired instances
4. Review browser console logs
5. Test with single player first

---

## Success Criteria

Deployment is successful when:

✅ All 6 sites deployed and accessible  
✅ Authentication flow working end-to-end  
✅ Kiosk can search and submit requests  
✅ Player can play tracks with crossfading  
✅ Admin can control player remotely  
✅ Real-time sync working across devices  
✅ Queue updates propagate instantly  
✅ Master election functioning correctly  
✅ No console errors on any endpoint  
✅ All tests passing (73/73)  

---

## Deployment Commands Summary

```bash
# 1. Build all apps
npm run build

# 2. Verify builds
ls -lh apps/*/dist/

# 3. Deploy to AppWrite
cd functions/appwrite
appwrite deploy sites

# 4. Verify database schema
npm run schema:check

# 5. Test deployments
# Visit each site URL and verify functionality

# 6. Monitor logs
# Check AppWrite Console for any errors
```

---

## Production URLs (After Deployment)

Will be available at:
- Landing: `https://[site-id].appwrite.io` or custom domain
- Auth: `https://[site-id].appwrite.io` or `auth.djamms.app`
- Dashboard: `https://[site-id].appwrite.io` or `dashboard.djamms.app`
- Kiosk: `https://[site-id].appwrite.io` or `kiosk.djamms.app`
- Player: `https://[site-id].appwrite.io` or `player.djamms.app`
- Admin: `https://[site-id].appwrite.io` or `admin.djamms.app`

---

## Support & Resources

- **AppWrite Documentation**: https://appwrite.io/docs
- **AppWrite Status**: https://status.appwrite.io
- **GitHub Repository**: https://github.com/SystemVirtue/djamms-50-pg
- **Admin Guide**: See ADMIN_GUIDE.md
- **API Documentation**: See API_DOCS.md
- **Testing Guide**: See TESTING_GUIDE.md

---

**Deployment Prepared By**: GitHub Copilot  
**Date**: January 10, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Deployment
