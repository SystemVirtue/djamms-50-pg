# DJAMMS Endpoint Manual Testing Guide

## Production Site
**URL**: https://www.djamms.app  
**Deployment**: d9be6fa (October 10, 2025)

## Local Testing
**URL**: http://localhost:5175  
**Build**: Production dist build

---

## Endpoints to Test

### 1. Landing Page (/)
**URL**: `/`  
**Expected**: Welcome page with branding  
**Screenshot**: `01-landing-page.png`

### 2. Auth Page (/auth)
**URL**: `/auth`  
**Expected**: Magic link authentication form  
**Screenshot**: `02-auth-page.png`

### 3. Dashboard (/dashboard/:userId)
**URL**: `/dashboard/test-user-123`  
**Expected**:  
- Header with DJAMMS logo, user profile, status indicator
- Welcome section
- 6 launch cards (Player, Admin, Kiosk, Queue, Playlists, Activity)
- Quick Actions section
- Footer

**Interactive Tests**:
- Click "Queue Manager" → Should open Queue tab
- Click "Playlist Library" → Should open Playlists tab  
- Click "Admin" quick action → Should open Admin settings tab
- Click "Back to Dashboard" → Should return to main view
- Click "Video Player" card → Should navigate to /player/venue-001
- Click "Admin Console" card → Should navigate to /admin/venue-001
- Click "Jukebox Kiosk" card → Should navigate to /kiosk/venue-001

**Screenshots**:
- `03a-dashboard-home.png` - Main dashboard
- `03b-dashboard-queue-tab.png` - Queue Manager tab
- `03c-dashboard-playlists-tab.png` - Playlist Library tab
- `03d-dashboard-admin-tab.png` - Admin settings tab

### 4. Player Page (/player/:venueId)
**URL**: `/player/venue-001`  
**Expected**:
- YouTube player container (16:9 ratio)
- Now Playing section with track info
- Autoplay toggle
- Next Track button
- Queue preview (priority queue with ⭐, main queue)
- Master player status check

**Screenshot**: `04-player-page.png`

### 5. Admin Page (/admin/:venueId)
**URL**: `/admin/venue-001`  
**Expected**:
- Now Playing card with countdown timer
- Skip Track button
- Priority Queue section (with ⭐ indicators)
- Main Queue section (numbered 1-10)
- Queue Statistics cards (Main, Priority, Total counts)

**Interactive Tests**:
- Countdown timer should update every second
- Skip button should advance to next track

**Screenshot**: `05-admin-page.png`

### 6. Kiosk Page (/kiosk/:venueId)
**URL**: `/kiosk/venue-001`  
**Expected**:
- Header with venue info and credits
- Search form with large input field
- Search button
- Mode indicator (FREEPLAY/PAID)

**Interactive Tests**:
- Type "never gonna give you up" in search
- Click Search → Should show 3 mock results (Rick Astley, PSY, Despacito)
- Click "Add to Queue" on first result → Should show success notification
- Success notification should auto-dismiss after 3 seconds

**Screenshots**:
- `06a-kiosk-initial.png` - Initial state
- `06b-kiosk-search-results.png` - After searching
- `06c-kiosk-success.png` - Success notification

---

## Manual Testing Checklist

### Dashboard Tests
- [ ] Page loads without errors
- [ ] All 6 cards are visible
- [ ] User profile displays correctly
- [ ] Status indicator shows "CONNECTED"
- [ ] Hover effects work on cards
- [ ] Card badges show correctly (FULL APP vs TAB)
- [ ] Video Player card navigates to /player/venue-001
- [ ] Admin Console card navigates to /admin/venue-001
- [ ] Jukebox Kiosk card navigates to /kiosk/venue-001
- [ ] Queue Manager card opens Queue tab
- [ ] Playlist Library card opens Playlists tab
- [ ] Activity Logs card opens Activity tab
- [ ] Tab navigation works (switching between tabs)
- [ ] "Back to Dashboard" button returns to home
- [ ] Close Tab (X) button returns to home
- [ ] Quick Actions buttons work
- [ ] Logout button clears session
- [ ] Responsive design works on mobile/desktop

### Player Tests
- [ ] Page loads without errors
- [ ] YouTube player container displays
- [ ] Now Playing shows mock track
- [ ] Autoplay toggle is functional
- [ ] Next Track button is visible
- [ ] Queue preview shows tracks
- [ ] Priority queue items have ⭐
- [ ] Master player status displays

### Admin Tests
- [ ] Page loads without errors
- [ ] Now Playing card displays
- [ ] Countdown timer counts down
- [ ] Skip Track button is functional
- [ ] Priority queue displays (with ⭐)
- [ ] Main queue displays (numbered)
- [ ] Statistics cards show counts
- [ ] Queue totals are correct

### Kiosk Tests
- [ ] Page loads without errors
- [ ] Header shows venue ID
- [ ] Credits display correctly
- [ ] Search input accepts text
- [ ] Search button triggers search
- [ ] Mock results display (3 songs)
- [ ] Result cards show thumbnails
- [ ] Result cards show title/artist
- [ ] Add to Queue button works
- [ ] Success notification appears
- [ ] Success notification auto-dismisses
- [ ] Mode indicator displays

---

## Testing URLs

### Local (Development)
```
http://localhost:5175/
http://localhost:5175/auth
http://localhost:5175/dashboard/test-user-123
http://localhost:5175/player/venue-001
http://localhost:5175/admin/venue-001
http://localhost:5175/kiosk/venue-001
```

### Production (AppWrite)
```
https://www.djamms.app/
https://www.djamms.app/auth
https://www.djamms.app/dashboard/68e7e9cf9fe2383832cb
https://www.djamms.app/player/venue-001
https://www.djamms.app/admin/venue-001
https://www.djamms.app/kiosk/venue-001
```

---

## Console Commands for Testing

### Open URLs in Simple Browser (VS Code)
```javascript
// Open each endpoint sequentially
const urls = [
  'http://localhost:5175/',
  'http://localhost:5175/auth',
  'http://localhost:5175/dashboard/test-user-123',
  'http://localhost:5175/player/venue-001',
  'http://localhost:5175/admin/venue-001',
  'http://localhost:5175/kiosk/venue-001'
];

// Use Command Palette: "Simple Browser: Show"
// Or click URLs above while dev server is running
```

### Set Mock Data in Browser Console
```javascript
// Set user data
localStorage.setItem('djamms_user', JSON.stringify({
  userId: 'test-user-123',
  username: 'Test User',
  role: 'admin',
  email: 'test@djamms.app'
}));

// Set player state
localStorage.setItem('isMasterPlayer_venue-001', 'true');
localStorage.setItem('djamms_autoplay', 'true');

// Set queue data
localStorage.setItem('djammsQueue_venue-001', JSON.stringify({
  venueId: 'venue-001',
  nowPlaying: {
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    duration: 213,
    startTime: Date.now(),
    remaining: 180
  },
  mainQueue: [
    { videoId: '9bZkp7q19f0', title: 'GANGNAM STYLE', artist: 'PSY', duration: 253 },
    { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', duration: 282 }
  ],
  priorityQueue: [
    { videoId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', duration: 354, isRequest: true }
  ]
}));

// Reload page
location.reload();
```

---

## Expected Results Summary

### ✅ All Endpoints Should:
1. Load without console errors
2. Display correct header/navigation
3. Show appropriate content
4. Handle interactions correctly
5. Display loading states properly
6. Show error states when needed
7. Be responsive (mobile/desktop)
8. Have proper styling/gradients
9. Include hover effects
10. Support keyboard navigation

### ✅ Dashboard Should:
- Have 6 functional cards
- Support tab navigation
- Navigate to full endpoints (Player, Admin, Kiosk)
- Display user profile and status
- Show logout functionality
- Have responsive design

### ✅ Player Should:
- Show YouTube player placeholder
- Display queue preview
- Have autoplay toggle
- Show master player status
- Display countdown/progress

### ✅ Admin Should:
- Show now playing with countdown
- Display priority queue with ⭐
- Show main queue numbered
- Have skip functionality
- Display queue statistics

### ✅ Kiosk Should:
- Have search functionality
- Show mock results
- Support adding to queue
- Display success notifications
- Show credits/mode indicator

---

## Screenshot Capture Commands

### Using Browser DevTools (Manual)
1. Open URL in browser
2. Press F12 to open DevTools
3. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
4. Type "Capture full size screenshot"
5. Save to `test-screenshots/` folder

### Using Playwright (Automated)
```bash
# Run visual tests
npx playwright test endpoint-visual-tests --headed

# View test report
npx playwright show-report
```

---

**Testing Date**: October 10, 2025  
**Tester**: [Your Name]  
**Build**: d9be6fa  
**Status**: Ready for testing
