# Console Ninja Quick Reference

## 🚀 Quick Start

```bash
# All servers running on correct ports:
✅ http://localhost:3000/ - Landing
✅ http://localhost:3001/player/venue1 - Player  
✅ http://localhost:3002/auth/login - Auth
✅ http://localhost:3003/admin/venue1 - Admin
✅ http://localhost:3004/kiosk/venue1 - Kiosk
```

## 📊 View Console Output

**VS Code Output Panel:**
1. Press `Cmd/Ctrl + Shift + U`
2. Select "Console Ninja" from dropdown
3. Watch real-time console output!

**Inline in Code:**
- Console logs appear as gray annotations next to the code
- Hover to see details
- Click to expand objects

## 🛠️ VS Code Commands

Open Command Palette (`Cmd/Ctrl + Shift + P`):

```
> Console Ninja: Runtime Errors
> Console Ninja: Runtime Logs  
> Console Ninja: Runtime Logs By Location
> Console Ninja: Toggle Extension
```

## 🎯 Current Status

| Metric | Status |
|--------|--------|
| Servers Running | 5/5 ✅ |
| Console Ninja Connected | All ✅ |
| Runtime Errors | 0 ✅ |
| Warnings | 0 ✅ |

## 🔧 Useful Scripts

```bash
# Start all servers
./scripts/start-dev-servers.sh

# Monitor for errors
node scripts/console-monitor.mjs

# Stop all servers
killall node
```

## 📝 Server Management

```bash
# Check server status
lsof -i :3000-3004 | grep LISTEN

# View server logs
tail -f /tmp/dev-player.log
tail -f /tmp/dev-admin.log
tail -f /tmp/dev-auth.log
tail -f /tmp/dev-kiosk.log
tail -f /tmp/dev-landing.log

# Restart a specific server
killall node && ./scripts/start-dev-servers.sh
```

## 🎨 Console Ninja Features

- ✅ Real-time console output in VS Code
- ✅ Inline log display next to code
- ✅ Object inspection without DevTools
- ✅ Click to jump to source
- ✅ Performance metrics
- ✅ Network request monitoring
- ✅ React component inspection
- ✅ Error highlighting

## 📚 Documentation

- **Setup Guide**: `CONSOLE_NINJA_GUIDE.md`
- **Status Report**: `CONSOLE_NINJA_STATUS.md`
- **Main README**: `README.md`
- **Running Guide**: `RUNNING.md`

---

**Everything is ready! Open the apps and start coding! 🚀**
