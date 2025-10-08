# Console Ninja - Live Console Monitoring

## ✅ Status: ACTIVE

Console Ninja is now connected to all development servers and providing real-time console output directly in VS Code!

## 🎯 What You'll See

Console Ninja shows console output inline in your code editor:
- `console.log()` output appears next to the line that generated it
- Errors and warnings are highlighted
- Object inspection without opening DevTools
- Performance metrics
- Network requests

## 🔍 How to Use Console Ninja

### 1. Open Your Browser
Visit any of these URLs in Chrome/Edge/Firefox:
- **Landing**: http://localhost:3000/
- **Player**: http://localhost:3001/player/venue1
- **Auth**: http://localhost:3002/auth/login
- **Admin**: http://localhost:3003/admin/venue1
- **Kiosk**: http://localhost:3004/kiosk/venue1

### 2. View Console Output in VS Code
Console Ninja automatically displays output in two places:

#### A. Inline in Your Code
- Console logs appear as comments next to the line that generated them
- Click the inline output to see full object details
- Hover over variables to see their current values

#### B. Console Ninja Panel (Bottom of VS Code)
- Open with: `View > Output` then select "Console Ninja" from dropdown
- Shows all console output in real-time
- Filterable by app/severity
- Click any log to jump to the source code line

### 3. Debug Interactively
- Set breakpoints in VS Code
- See live values without `console.log`
- Inspect objects and arrays inline
- Track function execution

## 📊 Current Server Status

All servers are running with Console Ninja connected:

| App | Port | URL | Status |
|-----|------|-----|--------|
| Landing | 3000 | http://localhost:3000/ | ✅ Connected |
| Player | 3001 | http://localhost:3001/player/venue1 | ✅ Connected |
| Auth | 3002 | http://localhost:3002/auth/login | ✅ Connected |
| Admin | 3003 | http://localhost:3003/admin/venue1 | ✅ Connected |
| Kiosk | 3004 | http://localhost:3004/kiosk/venue1 | ✅ Connected |

## 🛠️ Useful Console Ninja Features

### 1. Runtime Errors
Console Ninja shows errors with:
- Stack traces
- Variable states at time of error
- Network requests that were pending
- Automatic error grouping

### 2. Performance Monitoring
See performance metrics inline:
- Function execution times
- Render counts
- Re-render causes
- Memory usage

### 3. Network Requests
Track API calls:
- Request/response details
- Timing information
- Failed requests highlighted
- AppWrite API calls visible

### 4. React DevTools Integration
- Component tree
- Props and state
- Hooks inspection
- Re-render reasons

## 🎨 Console Ninja Commands

Add these to your code for enhanced debugging:

```typescript
// Log with object inspection
console.log('User data:', userData);

// Table view for arrays
console.table(queueItems);

// Timing operations
console.time('loadQueue');
// ... code ...
console.timeEnd('loadQueue');

// Group related logs
console.group('Player State');
console.log('Current track:', currentTrack);
console.log('Is master:', isMaster);
console.groupEnd();

// Assertions
console.assert(venueId, 'Venue ID is required');

// Trace call stack
console.trace('How did we get here?');
```

## 🔧 Testing Each App

### Test Player App
```typescript
// Open http://localhost:3001/player/venue1
// Check Console Ninja output in VS Code for:
// - usePlayerManager hook logs
// - Master player registration
// - Queue loading
// - Real-time sync messages
// - YouTube player events
```

### Test Auth App
```typescript
// Open http://localhost:3002/auth/login
// Watch for:
// - Magic link send attempts
// - AppWrite API calls
// - Authentication errors
// - Redirect logic
```

### Test Admin Dashboard
```typescript
// Open http://localhost:3003/admin/venue1
// Monitor:
// - Real-time subscription setup
// - Queue updates
// - Countdown timer calculations
// - Skip track actions
```

### Test Kiosk App
```typescript
// Open http://localhost:3004/kiosk/venue1
// Track:
// - YouTube API search requests
// - Song request submissions
// - Payment flow (if Stripe enabled)
// - Duration validation
```

## 🐛 Common Issues & Solutions

### Issue: Console Ninja Not Showing Output
**Solution**: 
1. Refresh the browser page
2. Check "Console Ninja" is selected in Output panel
3. Verify extension is enabled (check status bar)

### Issue: Too Much Output
**Solution**:
1. Use Console Ninja filters (click funnel icon)
2. Filter by app name (landing, player, auth, admin, kiosk)
3. Filter by severity (errors only, warnings, etc.)

### Issue: Can't See AppWrite API Calls
**Solution**:
1. Check Network tab in Console Ninja
2. Look for failed requests (red)
3. Verify .env configuration
4. Check AppWrite endpoint is accessible

## 📝 Alternative: Traditional DevTools

You can still use Chrome DevTools alongside Console Ninja:
1. Open browser at localhost URL
2. Press F12 or Right-click → Inspect
3. Go to Console tab
4. Both Console Ninja and DevTools will show output

## 🎯 Recommended Workflow

1. **Start Development**
   ```bash
   ./scripts/start-dev-servers.sh
   ```

2. **Open Console Ninja Panel**
   - View → Output → Select "Console Ninja"

3. **Open Browser Tabs**
   - Open all 5 apps in separate tabs
   - Keep VS Code visible alongside browser

4. **Monitor in Real-Time**
   - Watch Console Ninja panel for errors
   - Click errors to jump to source code
   - Fix issues and see results immediately

5. **Use Runtime Logs Tool**
   For comprehensive monitoring across all apps:
   ```bash
   # Get runtime errors from Console Ninja
   node scripts/console-monitor.mjs
   ```

## 🚀 Pro Tips

1. **Split View**: Use VS Code split editor to view code and Console Ninja output side-by-side

2. **Keyboard Shortcuts**:
   - `Cmd/Ctrl + Shift + U` - Toggle Output panel
   - `Cmd/Ctrl + Shift + Y` - Toggle Debug Console

3. **Custom Filters**: Create saved filters for specific apps or error types

4. **Export Logs**: Right-click in Console Ninja panel → Copy all logs for sharing

5. **Performance**: Disable Console Ninja for a specific app if it's too verbose (Settings → Console Ninja → Exclude patterns)

## 📚 Resources

- **Console Ninja Docs**: https://tinyurl.com/2vt8jxzw
- **VS Code Output Panel**: View → Output
- **Runtime Logs Tool**: `console-ninja_runtimeLogs` command
- **Runtime Errors Tool**: `console-ninja_runtimeErrors` command

## 🎉 You're Ready!

Console Ninja is now actively monitoring all your apps. Open the URLs in your browser and watch the console output appear in VS Code in real-time!

**No more switching between VS Code and browser DevTools!** 🚀
