# 🔗 UI Implementation Linking Guide

## Overview
This document maps the available UI implementations to their respective endpoints in the unified web app.

**Status**: Enhanced UI placeholders linked ✅  
**Date**: 2025-10-10

---

## 📍 Endpoint Mapping

### 1. **Dashboard** → `/dashboard/:userId`

**Current Implementation**: Enhanced placeholder with visual elements  
**File**: `apps/web/src/routes/dashboard/DashboardView.tsx`

**Features Implemented**:
- ✅ Gradient background
- ✅ Connection status indicator
- ✅ Welcome section
- ✅ Launch cards (6 modules) with gradient backgrounds
- ✅ System status cards (CPU, Memory, Storage)
- ✅ Hover effects on cards
- ✅ Responsive grid layout

**Full Implementation Available**:
- **Source**: `functions/appwrite/sites/DJAMMS Web App/routes/dashboard/+page.svelte` (650+ lines)
- **Format**: Svelte (needs React conversion)
- **Includes**:
  - Tabbed interface system
  - Window manager for multi-screen setups
  - Real-time connection monitoring
  - Activity logs with filtering
  - System resource graphs
  - Player instance management

**Test URL**: `http://localhost:5173/dashboard/mike.clarkin@gmail.com`

---

### 2. **Player** → `/player/:venueId`

**Current Implementation**: Enhanced placeholder with player mockup  
**File**: `apps/web/src/routes/player/PlayerView.tsx`

**Features Implemented**:
- ✅ Player container layout
- ✅ YouTube player placeholder (16:9 aspect ratio)
- ✅ Now Playing section
- ✅ Autoplay toggle button
- ✅ Queue preview section

**Full Implementation Available**:
- **Source**: `apps/player/src/components/AdvancedPlayer.tsx` (133 lines)
- **Format**: React/TypeScript ✅ (ready to copy)
- **Includes**:
  - Dual YouTube iframe system
  - Crossfading logic (5-second fade)
  - Master player selection via heartbeat
  - PlayerBusyScreen component
  - Queue display (up next 5 tracks)
  - Autoplay controls
  - Real-time sync

**Dependencies Required**:
```bash
npm install react-youtube
npm install @types/youtube-player
```

**Additional Files Needed**:
- `apps/player/src/components/PlayerBusyScreen.tsx` (100 lines)
- `apps/player/src/hooks/usePlayerManager.ts` (custom hook)
- `@shared/types` (Track interface)

**Test URL**: `http://localhost:5173/player/venue-001`

---

### 3. **Admin** → `/admin/:venueId`

**Current Implementation**: Enhanced placeholder with queue sections  
**File**: `apps/web/src/routes/admin/AdminView.tsx`

**Features Implemented**:
- ✅ Admin dashboard layout
- ✅ Now Playing section with timer placeholder
- ✅ Priority Queue section
- ✅ Main Queue section
- ✅ Card-based layout

**Full Implementation Available**:
- **Source**: `apps/admin/src/components/AdminDashboard.tsx` (184 lines)
- **Format**: React/TypeScript ✅ (ready to copy)
- **Includes**:
  - Real-time queue monitoring
  - Now Playing with countdown timer
  - Priority queue with ⭐ indicators
  - Skip track button
  - AppWrite real-time subscriptions
  - Track duration formatting

**Dependencies Required**:
- AppWrite context (`@appwrite/AppwriteContext`)
- Config (`@shared/config/env`)
- Types (`@shared/types` - Queue interface)
- Toast notifications (`sonner`)

**Test URL**: `http://localhost:5173/admin/venue-001`

---

### 4. **Kiosk** → `/kiosk/:venueId`

**Current Implementation**: Enhanced placeholder with search interface  
**File**: `apps/web/src/routes/kiosk/KioskView.tsx`

**Features Implemented**:
- ✅ Search form with input field
- ✅ Search button with states
- ✅ Result card example (hidden)
- ✅ Empty state messaging

**Full Implementation Available**:
- **Source**: `apps/kiosk/src/components/KioskView.tsx` (120 lines)
- **Format**: React/TypeScript ✅ (ready to copy)
- **Includes**:
  - YouTube search integration
  - Search results with thumbnails
  - Request button with pricing (£0.50)
  - Stripe payment placeholder
  - Loading states
  - Error handling

**Dependencies Required**:
- Config (`@shared/config/env` - YouTube API key)
- Toast notifications (`sonner`)
- (Future) Stripe SDK for payments

**API Keys Needed**:
- `VITE_YOUTUBE_API_KEY` in `.env`

**Test URL**: `http://localhost:5173/kiosk/venue-001`

---

## 🎨 Design System Used

All implementations follow the consistent DJAMMS design system:

### Colors:
- **Background**: `bg-gray-900` (primary), `bg-gray-800` (cards)
- **Text**: `text-white`, `text-gray-400` (secondary)
- **Actions**: 
  - Blue: `bg-blue-600` (primary)
  - Green: `bg-green-600` (success)
  - Red: `bg-red-600` (destructive)
  - Yellow: `text-yellow-400` (priority markers)

### Gradients:
- Dashboard cards: `from-blue-600 to-blue-800`, `from-purple-600 to-purple-800`, etc.
- Main background: `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`

### Typography:
- H1: `text-3xl font-bold`
- H2: `text-xl font-semibold`
- Body: Default size, `text-gray-400` for secondary

### Components:
- Cards: `rounded-lg` or `rounded-xl`, padding `p-6`
- Buttons: `px-4 py-2` or `px-6 py-3`, `rounded-lg`, `transition`
- Inputs: `px-4 py-3`, `bg-gray-800 border border-gray-700`, focus ring

---

## 📋 Implementation Priority

### ✅ Phase 1: Enhanced Placeholders (COMPLETE)
All four endpoints now have functional placeholder UIs with visual elements.

### 🔄 Phase 2: Copy React Implementations (NEXT)

**Priority Order**:
1. **Kiosk** (easiest - 120 lines, minimal dependencies)
2. **Admin** (medium - 184 lines, needs AppWrite context)
3. **Player** (complex - 133 lines + hooks, needs react-youtube)
4. **Dashboard** (most complex - needs Svelte→React conversion)

### 📦 Phase 3: Install Dependencies

For Kiosk & Admin:
```bash
cd apps/web
npm install sonner  # Toast notifications (if not installed)
```

For Player:
```bash
cd apps/web
npm install react-youtube @types/youtube-player
```

For Dashboard:
```bash
# No additional dependencies needed
# Convert Svelte code to React components
```

---

## 🔧 Step-by-Step Implementation Guide

### Implementing Kiosk (Easiest Start)

1. **Copy the implementation**:
   ```bash
   # Source: apps/kiosk/src/components/KioskView.tsx
   # Target: apps/web/src/routes/kiosk/KioskView.tsx
   ```

2. **Update imports**:
   - Ensure `@shared/config/env` path is correct
   - Check `sonner` is installed

3. **Add YouTube API key** to `apps/web/.env`:
   ```env
   VITE_YOUTUBE_API_KEY=your_key_here
   ```

4. **Test**:
   - Search functionality
   - Results display
   - Request button

---

### Implementing Admin Dashboard

1. **Copy the implementation**:
   ```bash
   # Source: apps/admin/src/components/AdminDashboard.tsx
   # Target: apps/web/src/routes/admin/AdminView.tsx
   ```

2. **Verify dependencies**:
   - AppWrite context available
   - `@shared/types` has Queue interface
   - `config.appwrite.databaseId` configured

3. **Test**:
   - Queue loading
   - Real-time updates
   - Skip functionality

---

### Implementing Player

1. **Install react-youtube**:
   ```bash
   npm install react-youtube @types/youtube-player
   ```

2. **Copy components**:
   - AdvancedPlayer.tsx → apps/web/src/routes/player/PlayerView.tsx
   - PlayerBusyScreen.tsx → apps/web/src/components/PlayerBusyScreen.tsx

3. **Copy hook**:
   - usePlayerManager.ts → apps/web/src/hooks/usePlayerManager.ts

4. **Test**:
   - Master player logic
   - Crossfading
   - Queue display

---

### Implementing Dashboard

1. **Reference Svelte implementation**:
   ```
   functions/appwrite/sites/DJAMMS Web App/routes/dashboard/+page.svelte
   ```

2. **Convert components**:
   - Tab system → React state + conditional rendering
   - Window manager → Custom React hook
   - Svelte stores → React Context or Zustand

3. **Port sub-components**:
   - QueueManagerTab.svelte → QueueManagerTab.tsx
   - PlaylistLibraryTab.svelte → PlaylistLibraryTab.tsx
   - AdminConsoleTab.svelte → AdminConsoleTab.tsx

4. **Test**:
   - Tab switching
   - Window launching
   - Real-time status

---

## 📊 Current Status Summary

| Endpoint | Placeholder | Full Code Available | Format | Lines | Status |
|----------|-------------|---------------------|--------|-------|--------|
| `/dashboard/:userId` | ✅ Enhanced | ✅ Yes | Svelte | 650+ | 🔄 Needs conversion |
| `/player/:venueId` | ✅ Enhanced | ✅ Yes | React | 133 | ✅ Ready to copy |
| `/admin/:venueId` | ✅ Enhanced | ✅ Yes | React | 184 | ✅ Ready to copy |
| `/kiosk/:venueId` | ✅ Enhanced | ✅ Yes | React | 120 | ✅ Ready to copy |

---

## 🎯 Testing Checklist

### Local Development Testing:

- [x] Dashboard loads at `/dashboard/:userId`
- [x] Player loads at `/player/:venueId`
- [x] Admin loads at `/admin/:venueId`
- [x] Kiosk loads at `/kiosk/:venueId`
- [x] All placeholders show enhanced UI
- [x] Responsive layouts work
- [x] Implementation notes visible

### After Full Implementation:

- [ ] Kiosk: YouTube search works
- [ ] Kiosk: Request button functional
- [ ] Admin: Queue loads from AppWrite
- [ ] Admin: Skip track works
- [ ] Player: YouTube video plays
- [ ] Player: Crossfading works
- [ ] Dashboard: Tabs switch correctly
- [ ] Dashboard: System monitoring shows data

---

## 📝 Implementation Notes

### Warning Banners
Each placeholder includes a yellow warning banner with:
- Path to source code
- Key features available
- Implementation complexity hint

### Design Consistency
All placeholders follow the same design patterns as the full implementations:
- Dark theme (gray-900 base)
- Consistent card styles
- Same color palette
- Matching typography

### Progressive Enhancement
The current placeholders can be enhanced incrementally:
1. ✅ Basic structure (done)
2. ✅ Visual placeholders (done)
3. 🔄 Copy full implementations (next)
4. 🔄 Add real data connections
5. 🔄 Enable real-time features

---

## 🔗 Related Documentation

- **UI Design Inventory**: `UI_DESIGN_INVENTORY.md`
- **Database Schema**: `docs/architecture/DATABASE_SCHEMA_COMPLETE.md`
- **Authentication Flow**: `docs/architecture/AUTHENTICATION_FLOW.md`
- **Setup Guide**: `docs/setup/QUICKSTART.md`

---

## 🚀 Quick Commands

### View Current Implementations:
```bash
# Dashboard (placeholder)
open http://localhost:5173/dashboard/test-user

# Player (placeholder)
open http://localhost:5173/player/venue-001

# Admin (placeholder)
open http://localhost:5173/admin/venue-001

# Kiosk (placeholder)
open http://localhost:5173/kiosk/venue-001
```

### View Source Code:
```bash
# Player (React - ready to use)
code apps/player/src/components/AdvancedPlayer.tsx

# Admin (React - ready to use)
code apps/admin/src/components/AdminDashboard.tsx

# Kiosk (React - ready to use)
code apps/kiosk/src/components/KioskView.tsx

# Dashboard (Svelte - needs conversion)
code "functions/appwrite/sites/DJAMMS Web App/routes/dashboard/+page.svelte"
```

### Build & Test:
```bash
cd apps/web
npm run dev
# Open http://localhost:5173
```

---

**Last Updated**: 2025-10-10  
**Status**: Enhanced placeholders linked, ready for full implementation  
**Next Step**: Copy React implementations (Kiosk → Admin → Player → Dashboard)
