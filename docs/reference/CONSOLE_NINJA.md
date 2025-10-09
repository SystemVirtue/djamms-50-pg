# Console Ninja - Live Console Monitoring

**Status:** ✅ ACTIVE & Connected to All Apps

---

## 🎯 Quick Start

### 1. View Console Output in VS Code

**Console Ninja Panel (Recommended):**
1. Press `Cmd/Ctrl + Shift + U` (or `View > Output`)
2. Select "Console Ninja" from dropdown
3. Open any app URL in browser
4. Watch real-time console output!

**Inline in Code:**
- Console logs appear as gray annotations next to the code
- Hover to see full details
- Click to expand objects/arrays

### 2. Open Development Apps

All servers running with Console Ninja connected:

```
✅ Landing:  http://localhost:3000/
✅ Player:   http://localhost:3001/player/venue1
✅ Auth:     http://localhost:3002/auth/login
✅ Admin:    http://localhost:3003/admin/venue1
✅ Kiosk:    http://localhost:3004/kiosk/venue1
```

---

## 🛠️ Features & Capabilities

### Real-Time Monitoring
Console Ninja shows console output directly in VS Code:
- **Inline Logs:** Output appears next to code that generated it
- **Object Inspection:** See object details without DevTools
- **Performance Metrics:** Function execution times, render counts
- **Network Requests:** Track API calls and responses
- **Error Highlighting:** Automatic error detection with stack traces

### VS Code Commands

Open Command Palette (`Cmd/Ctrl + Shift + P`):

```
> Console Ninja: Runtime Errors
> Console Ninja: Runtime Logs
> Console Ninja: Runtime Logs By Location
> Console Ninja: Toggle Extension
```

### Interactive Debugging
- Set breakpoints in VS Code
- See live variable values without `console.log`
- Inspect objects and arrays inline
- Track function execution flow

---

## 📊 Current Status

| Metric | Status |
|--------|--------|
| Servers Running | 5/5 ✅ |
| Console Ninja Connected | All ✅ |
| Runtime Errors | 0 ✅ |
| Warnings | 0 ✅ |

---

## 💡 Usage Examples

### Basic Logging
```typescript
// Log with object inspection
console.log('User data:', userData);

// Table view for arrays
console.table(queueItems);

// Timing operations
console.time('loadQueue');
// ... code ...
console.timeEnd('loadQueue');

// Grouping related logs
console.group('Player State');
console.log('isPlaying:', isPlaying);
console.log('currentTrack:', currentTrack);
console.groupEnd();
```

### Error Monitoring
Console Ninja automatically captures:
- Stack traces
- Variable states at time of error
- Pending network requests
- Component render states (React)

### Performance Tracking
Monitor performance metrics:
- Function execution times
- React component render counts
- Re-render causes
- Memory usage
- Network request timing

### Network Monitoring
Track API calls:
- Request/response details
- Timing information
- Failed requests highlighted
- AppWrite API calls visible
- GraphQL queries/mutations

---

## 🔧 Server Management

### Start All Servers
```bash
./scripts/start-dev-servers.sh
```

### Check Server Status
```bash
lsof -i :3000-3004 | grep LISTEN
```

### View Server Logs
```bash
tail -f /tmp/dev-player.log
tail -f /tmp/dev-admin.log
tail -f /tmp/dev-auth.log
tail -f /tmp/dev-kiosk.log
tail -f /tmp/dev-landing.log
```

### Restart Servers
```bash
killall node && ./scripts/start-dev-servers.sh
```

### Monitor for Errors
```bash
node scripts/console-monitor.mjs
```

---

## 🎨 Advanced Features

### React DevTools Integration
Console Ninja integrates with React:
- Component tree visualization
- Props and state inspection
- Hooks inspection
- Re-render reason analysis
- Performance profiling

### TypeScript Support
Full TypeScript integration:
- Type information in tooltips
- IntelliSense support
- Source map support
- Proper error messages

### Hot Module Replacement (HMR)
Console Ninja works with Vite HMR:
- Fast refresh support
- State preservation
- No full page reloads
- Instant feedback

---

## 🐛 Troubleshooting

### Console Ninja Not Showing Output

1. **Check Extension is Active:**
   ```
   Cmd/Ctrl + Shift + P > Console Ninja: Toggle Extension
   ```

2. **Verify Browser Extension:**
   - Install Console Ninja browser extension
   - Chrome: https://chrome.google.com/webstore
   - Firefox: https://addons.mozilla.org

3. **Check Server is Running:**
   ```bash
   lsof -i :3000-3004 | grep LISTEN
   ```

4. **Clear Browser Cache:**
   - Hard reload: `Cmd/Ctrl + Shift + R`
   - Or use incognito/private window

### Output Panel Not Updating

1. **Select Console Ninja:**
   - Output panel dropdown must show "Console Ninja"
   
2. **Refresh Browser:**
   - Generate new logs to trigger update

3. **Restart VS Code:**
   - Sometimes extension needs restart

### Inline Annotations Not Appearing

1. **Check File is Saved:**
   - Console Ninja only works with saved files
   
2. **Verify Source Maps:**
   - Ensure `vite.config.ts` has `sourcemap: true`

3. **Check File Path:**
   - File must be in workspace folder

---

## 📚 Related Documentation

- **Setup Guide:** [`docs/setup/QUICKSTART.md`](../setup/QUICKSTART.md)
- **Running Servers:** [`docs/reference/RUNNING.md`](./RUNNING.md)
- **Quick Reference:** [`docs/reference/QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)
- **Main README:** [`/README.md`](../../README.md)

---

## 🎉 Benefits

✅ **Faster Debugging:** See console output without switching windows  
✅ **Better Context:** Logs appear next to code that generated them  
✅ **Object Inspection:** Expand objects inline without DevTools  
✅ **Performance Insights:** Track execution times automatically  
✅ **Network Visibility:** See all API calls in one place  
✅ **Error Tracking:** Automatic error detection with full context  
✅ **React Integration:** Component inspection and profiling  

---

**Everything is ready! Open the apps and start coding with live console feedback! 🚀**
