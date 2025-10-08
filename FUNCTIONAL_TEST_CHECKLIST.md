# DJAMMS Functional Testing Checklist

**Test Date:** October 9, 2025  
**Deployment Status:** ✅ 100% Operational (All infrastructure tests passed)  
**Tester:** _____________

---

## 🎯 Testing Overview

This checklist covers end-to-end functional testing of all DJAMMS applications now that infrastructure is fully deployed.

**Testing Environment:**
- All apps deployed to production (*.djamms.app)
- AppWrite backend operational
- SSL certificates valid
- DNS propagated globally

**Testing Tools:**
- Browser: Chrome/Firefox (with DevTools open - F12)
- Network tab: Monitor API calls
- Console tab: Check for errors
- AppWrite Console: Monitor database changes

---

## 1️⃣ Landing Page (https://djamms.app)

### Visual Tests
- [ ] Page loads without errors
- [ ] Logo/branding displays correctly
- [ ] Navigation menu renders
- [ ] Hero section displays
- [ ] Call-to-action buttons visible
- [ ] Footer displays correctly
- [ ] Responsive design works (test mobile view)

### Functional Tests
- [ ] "Login" button present and clickable
- [ ] "Get Started" button works (if present)
- [ ] Navigation links work
- [ ] External links open in new tabs
- [ ] No console errors (check F12 console)
- [ ] No 404s for assets (images, fonts, CSS)

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] Images are optimized (check Network tab)
- [ ] No layout shift (CLS)
- [ ] Smooth scrolling (if applicable)

### Console Checks
```javascript
// Expected: No errors in console
// Check for:
- ✅ No CORS errors
- ✅ No 404 errors
- ✅ No JavaScript errors
- ✅ Environment variables loaded
```

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## 2️⃣ Auth App (https://auth.djamms.app)

### Magic Link Flow - Email Input
- [ ] Auth page loads from landing redirect
- [ ] Email input field displays
- [ ] Email validation works (invalid format shows error)
- [ ] "Send Magic Link" button enabled when email valid
- [ ] Loading state shows when submitting
- [ ] Success message displays after submission

### Magic Link Generation
- [ ] Check AppWrite console for new magicLinks document
- [ ] Document contains: email, token, expiresAt, used=false
- [ ] Token is generated (check structure)
- [ ] ExpiresAt is set to +15 minutes

### Email Delivery (Manual Check)
- [ ] Email received in inbox (check spam folder)
- [ ] Email contains magic link
- [ ] Link format: `https://auth.djamms.app/callback?token=...`
- [ ] Token matches database token
- [ ] Email has professional formatting

### Magic Link Callback
- [ ] Click magic link from email
- [ ] Redirects to auth.djamms.app/callback
- [ ] Token validation occurs
- [ ] JWT token created and stored
- [ ] Redirect to player.djamms.app happens
- [ ] User document created/updated in database

### Error Handling
- [ ] Expired token shows error message
- [ ] Used token shows error message
- [ ] Invalid token shows error message
- [ ] Network errors handled gracefully

### Console Checks
```javascript
// Check localStorage after successful auth:
localStorage.getItem('djamms_jwt_token')  // Should exist
localStorage.getItem('djamms_user_id')     // Should exist

// Check for CORS errors (should be none with wildcard config)
```

**AppWrite Database Checks:**
```
magicLinks collection:
- [ ] New document created when email submitted
- [ ] used: false initially
- [ ] used: true after link clicked
- [ ] expiresAt timestamp correct

users collection:
- [ ] User document created on first login
- [ ] email field populated
- [ ] lastLoginAt timestamp updated
- [ ] createdAt timestamp set
```

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## 3️⃣ Player App (https://player.djamms.app)

### Authentication & Loading
- [ ] Redirects to auth if no JWT token
- [ ] Loads successfully if authenticated
- [ ] User info displays (if shown in UI)
- [ ] Venue selection available (if implemented)

### YouTube Player Integration
- [ ] YouTube iframe loads correctly
- [ ] YouTube API key working (no quota errors)
- [ ] Player controls visible
- [ ] Volume control works
- [ ] Play/Pause buttons functional

### Video Search
- [ ] Search bar displays
- [ ] Search query can be typed
- [ ] Search button triggers API call
- [ ] YouTube API returns results
- [ ] Results display in list/grid
- [ ] Thumbnail images load
- [ ] Video titles display
- [ ] Video duration shows

### Queue Management
- [ ] Current queue displays
- [ ] Add video to queue works
- [ ] Queue updates in real-time
- [ ] Queue items show: thumbnail, title, duration
- [ ] Remove from queue works
- [ ] Reorder queue works (if implemented)
- [ ] Queue syncs with database

### Playback Control
- [ ] Play next video from queue
- [ ] Auto-advance to next video
- [ ] Skip to next track works
- [ ] Previous track works (if implemented)
- [ ] Seek bar functional
- [ ] Current time displays
- [ ] Total duration displays

### Real-time Features
- [ ] Queue updates when other users add songs
- [ ] Player status syncs across devices
- [ ] Now playing updates correctly
- [ ] AppWrite Realtime connection active

### Master Player Logic
- [ ] Player heartbeat sent every 30 seconds
- [ ] Player marked as master if no other active
- [ ] Only master player controls playback
- [ ] Slave players display sync message

### Console Checks
```javascript
// Check for:
- ✅ YouTube API loaded: window.YT
- ✅ JWT token present: localStorage.getItem('djamms_jwt_token')
- ✅ No CORS errors
- ✅ WebSocket connection: Check Network tab for ws:// connections
- ✅ AppWrite Realtime subscribed to queues collection

// Check Network tab for API calls:
- GET to YouTube API (search)
- GET/POST to AppWrite (queues, players)
- Realtime subscription active
```

**AppWrite Database Checks:**
```
queues collection:
- [ ] New documents created when adding songs
- [ ] videoId, title, thumbnail stored
- [ ] venueId associated
- [ ] order field correct
- [ ] played: false initially

players collection:
- [ ] Player document exists
- [ ] lastHeartbeat updates every 30s
- [ ] isMaster flag correct
- [ ] currentVideoId updates

nowPlaying collection (if exists):
- [ ] Current track info stored
- [ ] Updates when track changes
```

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## 4️⃣ Admin App (https://admin.djamms.app)

### Authentication & Access Control
- [ ] Redirects to auth if not logged in
- [ ] Admin role check works
- [ ] Non-admin users blocked (if role-based)

### Venue Management
- [ ] Venue list displays
- [ ] Create new venue works
- [ ] Edit venue works
- [ ] Delete venue works (with confirmation)
- [ ] Venue details: name, location, settings

### User Management
- [ ] User list displays
- [ ] User details visible: email, role, lastLogin
- [ ] Edit user role (if implemented)
- [ ] Delete user (with confirmation)
- [ ] Search/filter users

### Queue Management
- [ ] View all queues across venues
- [ ] Clear queue works
- [ ] Remove specific tracks
- [ ] Reorder tracks
- [ ] Ban users from adding tracks (if implemented)

### Player Management
- [ ] View all active players
- [ ] See master player status
- [ ] Force player refresh/restart
- [ ] View player heartbeat timestamps
- [ ] Inactive player detection

### Analytics/Reports (if implemented)
- [ ] Most played songs
- [ ] Most active venues
- [ ] User activity stats
- [ ] Peak usage times

### Settings
- [ ] Update global settings
- [ ] Configure YouTube API key
- [ ] Set default queue limits
- [ ] Configure magic link expiry time

### Console Checks
```javascript
// Check for admin-specific API calls:
- GET /users (should succeed for admin)
- GET /venues (should succeed for admin)
- DELETE operations (should succeed for admin)

// Check for proper error handling if non-admin tries admin functions
```

**AppWrite Database Checks:**
```
All collections:
- [ ] Admin can read all documents
- [ ] Admin can update documents
- [ ] Admin can delete documents
- [ ] Permissions enforced via AppWrite roles
```

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## 5️⃣ Kiosk App (https://kiosk.djamms.app)

### Kiosk Mode Display
- [ ] Loads in fullscreen/kiosk mode
- [ ] No authentication required (or venue-specific auth)
- [ ] Venue selection works (if multiple venues)

### Queue Display
- [ ] Current queue displays (upcoming songs)
- [ ] Now playing section prominent
- [ ] Song thumbnails visible
- [ ] Song titles readable
- [ ] Artist/channel info shows
- [ ] Duration displayed
- [ ] Position in queue shown

### Song Request Interface
- [ ] Search bar available
- [ ] YouTube search works
- [ ] Add to queue button visible
- [ ] Success confirmation shows
- [ ] Queue updates immediately after add

### Real-time Updates
- [ ] Queue auto-updates when songs added
- [ ] Now playing updates automatically
- [ ] No page refresh needed
- [ ] Smooth transitions between tracks

### Public Display Features
- [ ] Large text for readability from distance
- [ ] Auto-scroll queue (if long list)
- [ ] Attract mode/screensaver (if implemented)
- [ ] Volume control disabled (or admin-only)

### Rate Limiting/Abuse Prevention
- [ ] Users can't spam requests
- [ ] Duplicate prevention (if implemented)
- [ ] Queue size limits enforced

### Console Checks
```javascript
// Kiosk should have minimal console output
// Check for:
- ✅ Realtime connection active
- ✅ Queue subscription working
- ✅ No authentication errors
```

**AppWrite Database Checks:**
```
requests collection (if separate from queues):
- [ ] New requests stored with IP/device info
- [ ] Timestamp recorded
- [ ] venueId associated

queues collection:
- [ ] Public can add (if permissions allow)
- [ ] Kiosk-specific venue filter working
```

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## 6️⃣ Dashboard App (https://dashboard.djamms.app)

### Authentication
- [ ] Requires login (redirects to auth)
- [ ] JWT token validated
- [ ] User-specific dashboard loads

### Overview/Home
- [ ] Welcome message with user name
- [ ] Quick stats display (if implemented)
- [ ] Recent activity feed
- [ ] Navigation menu accessible

### Venue Dashboard
- [ ] User's venues listed
- [ ] Create new venue option
- [ ] Select venue to manage
- [ ] Venue stats: songs played, active users

### Queue Management
- [ ] Current queue for selected venue
- [ ] Add songs to queue
- [ ] Remove songs from queue
- [ ] Reorder queue
- [ ] Clear entire queue

### Now Playing View
- [ ] Current track displayed prominently
- [ ] Progress bar showing playback position
- [ ] Next up preview
- [ ] Player controls (if owner/admin)

### Playlist Management (if implemented)
- [ ] Create new playlist
- [ ] Add songs to playlist
- [ ] Load playlist to queue
- [ ] Share playlist
- [ ] Delete playlist

### Settings
- [ ] User profile settings
- [ ] Email notifications toggle
- [ ] Venue preferences
- [ ] Theme selection (light/dark)

### Real-time Features
- [ ] Dashboard updates without refresh
- [ ] Queue changes reflect immediately
- [ ] Now playing syncs across tabs

### Console Checks
```javascript
// Check for:
- ✅ JWT authentication working
- ✅ User data loaded from AppWrite
- ✅ Realtime subscriptions active
- ✅ No CORS errors
- ✅ API calls successful

// Test localStorage:
localStorage.getItem('djamms_jwt_token')
localStorage.getItem('djamms_user_id')
localStorage.getItem('djamms_selected_venue')
```

**AppWrite Database Checks:**
```
users collection:
- [ ] User preferences saved
- [ ] Profile updates persist

venues collection:
- [ ] User's venues accessible
- [ ] Venue settings update correctly

playlists collection (if exists):
- [ ] User's playlists stored
- [ ] Playlist songs array populated
```

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## 7️⃣ Cross-App Integration Tests

### Authentication Flow
- [ ] Login from landing → auth → player redirect works
- [ ] JWT token shared across all apps
- [ ] Logout from one app logs out all apps
- [ ] Token expiry handled gracefully

### Real-time Synchronization
- [ ] Add song in player → shows in kiosk
- [ ] Add song in kiosk → shows in dashboard
- [ ] Remove song in admin → removed everywhere
- [ ] Now playing updates sync across all apps

### Data Consistency
- [ ] Queue order same across all apps
- [ ] User data consistent
- [ ] Venue settings synchronized
- [ ] Player status accurate everywhere

### CORS & API Access
- [ ] All apps can call AppWrite API
- [ ] No CORS errors in any app
- [ ] Wildcard domain (*.djamms.app) working
- [ ] Localhost development still works

### Navigation Between Apps
- [ ] Links between apps work correctly
- [ ] Deep links preserve authentication
- [ ] Back button works as expected
- [ ] Breadcrumb navigation (if implemented)

---

## 8️⃣ AppWrite Backend Tests

### Collections Accessibility
- [ ] All 7 collections responding
- [ ] CRUD operations work for each collection
- [ ] Permissions enforced correctly
- [ ] Indexes working (query performance good)

### Realtime Subscriptions
- [ ] Can subscribe to collections
- [ ] Events received when documents change
- [ ] Multiple clients can subscribe
- [ ] Subscription cleanup on disconnect

### Authentication System
- [ ] Magic link tokens stored correctly
- [ ] Token validation working
- [ ] JWT generation successful
- [ ] Token refresh working (if implemented)

### Database Performance
- [ ] Queries return in < 500ms
- [ ] Batch operations work
- [ ] No rate limiting errors
- [ ] Connection pooling working

### API Console Tests
```bash
# Test from terminal:

# List users
curl -X GET "https://68e5a36e0021b938b3a7.djamms.app/v1/databases/68e57de9003234a84cae/collections/users/documents" \
  -H "X-Appwrite-Project: 68e5a36e0021b938b3a7" \
  -H "X-Appwrite-Key: YOUR_API_KEY"

# Create test venue
curl -X POST "https://68e5a36e0021b938b3a7.djamms.app/v1/databases/68e57de9003234a84cae/collections/venues/documents" \
  -H "X-Appwrite-Project: 68e5a36e0021b938b3a7" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "unique()",
    "data": {
      "name": "Test Venue",
      "location": "Test Location"
    }
  }'
```

---

## 9️⃣ Performance & Load Testing

### Page Load Times
- [ ] Landing: < 2s
- [ ] Auth: < 2s
- [ ] Player: < 3s (includes YouTube API)
- [ ] Admin: < 3s
- [ ] Kiosk: < 2s
- [ ] Dashboard: < 3s

### API Response Times
- [ ] AppWrite queries: < 500ms
- [ ] YouTube API: < 1s
- [ ] Magic link generation: < 1s
- [ ] Real-time events: < 200ms

### Concurrent Users
- [ ] 10 users can queue songs simultaneously
- [ ] Multiple players in same venue work
- [ ] Admin operations don't block user operations
- [ ] Kiosk remains responsive under load

### Network Resilience
- [ ] Offline detection works
- [ ] Reconnection after network loss
- [ ] Queued operations retry
- [ ] Error messages shown to users

---

## 🔟 Security Tests

### Authentication Security
- [ ] Cannot access protected routes without token
- [ ] Token expiry enforced
- [ ] Invalid tokens rejected
- [ ] XSS protection in place

### API Security
- [ ] API keys not exposed in frontend
- [ ] CORS properly configured
- [ ] Rate limiting in place (if implemented)
- [ ] SQL injection protection (AppWrite handles this)

### Data Privacy
- [ ] User emails not exposed publicly
- [ ] Admin-only data protected
- [ ] Venue data scoped correctly
- [ ] PII handled according to policy

### SSL/TLS
- [ ] All apps use HTTPS
- [ ] No mixed content warnings
- [ ] Certificates valid and trusted
- [ ] TLS 1.2+ enforced

---

## 1️⃣1️⃣ Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile (Android)
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Responsive Design
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] 4K/Large screens (> 1920px)

---

## 1️⃣2️⃣ Error Handling & Edge Cases

### Network Errors
- [ ] Offline mode handled
- [ ] Slow network timeouts
- [ ] API unavailable error shown
- [ ] Retry mechanisms work

### Invalid Data
- [ ] Invalid email format rejected
- [ ] Empty required fields blocked
- [ ] Long text truncated or rejected
- [ ] Special characters handled

### Concurrent Operations
- [ ] Two users adding same song
- [ ] Two users deleting same item
- [ ] Race conditions handled
- [ ] Optimistic UI updates correctly

### Quota Limits
- [ ] YouTube API quota warnings
- [ ] AppWrite rate limits handled
- [ ] Storage limits checked (if applicable)
- [ ] User notified of limits

---

## ✅ Testing Sign-Off

### Infrastructure
- [x] DNS: 6/6 domains resolving ✅
- [x] SSL: 6/6 certificates valid ✅
- [x] AppWrite: Database operational ✅
- [x] Vercel: All deployments live ✅

### Functional Testing
- [ ] Landing: ___/10 tests passed
- [ ] Auth: ___/15 tests passed
- [ ] Player: ___/20 tests passed
- [ ] Admin: ___/15 tests passed
- [ ] Kiosk: ___/12 tests passed
- [ ] Dashboard: ___/15 tests passed

### Integration Testing
- [ ] Cross-app: ___/8 tests passed
- [ ] AppWrite: ___/10 tests passed
- [ ] Performance: ___/12 tests passed
- [ ] Security: ___/10 tests passed

### Total Score
**___ / 127 tests passed (____%)**

### Critical Issues Found
```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

### Non-Critical Issues
```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

### Recommendations
```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

---

## 📝 Next Steps After Testing

1. **Fix Critical Issues:** Address any blocking bugs found
2. **Log Non-Critical Issues:** Create GitHub issues for tracking
3. **Performance Optimization:** Address slow loading areas
4. **User Acceptance Testing:** Have real users test the system
5. **Documentation:** Update user guides based on findings
6. **Monitoring:** Set up error tracking (Sentry, etc.)
7. **Analytics:** Add Google Analytics or similar
8. **Backup Strategy:** Ensure AppWrite backups configured

---

**Tester Signature:** _________________ **Date:** _________

**Status:** ⬜ Ready for Production | ⬜ Needs Fixes | ⬜ Major Issues Found
