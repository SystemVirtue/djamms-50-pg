# 🎨 DJAMMS UI Design Inventory

## Overview
This document catalogs all existing UI implementations, design patterns, and visual aesthetics across the DJAMMS project.

---

## 📁 Repository Structure - UI Assets

### 1. **Standalone React Apps** (`/apps/`)
These are TypeScript + React + Tailwind implementations:

#### ✅ `/apps/player/` - Advanced Player (FULLY IMPLEMENTED)
**File**: `apps/player/src/components/AdvancedPlayer.tsx`

**Features**:
- Dual YouTube iframe crossfading system
- Master player state management
- Player busy screen with retry/fallback options
- Dark theme (bg-gray-900)
- Real-time AppWrite database sync
- Heartbeat mechanism for master selection

**UI Components**:
- `AdvancedPlayer.tsx` (133 lines) - Main player container
- `PlayerBusyScreen.tsx` - Non-master player view with:
  - Venue ID display
  - Error messages
  - Retry connection button
  - Open Viewer button
  - Open Admin button
  - Current master status

**Key Design Elements**:
```tsx
className="player-container min-h-screen bg-gray-900 text-white relative"
className="min-h-screen bg-gray-900 text-white flex items-center justify-center"
```

---

#### ✅ `/apps/admin/` - Admin Dashboard (FULLY IMPLEMENTED)
**File**: `apps/admin/src/components/AdminDashboard.tsx`

**Features**:
- Real-time queue monitoring
- Now Playing display with countdown timer
- Priority queue visualization (yellow star ⭐)
- Main queue list view
- Skip track controls
- Real-time AppWrite subscriptions

**UI Components**:
- Now Playing card (large display)
  - Track title (text-2xl font-bold)
  - Artist name (text-gray-400)
  - Countdown timer (text-3xl font-mono)
  - Skip button (bg-red-600 hover:bg-red-700)
  
- Priority Queue section
  - Yellow star indicators
  - Track cards (bg-gray-700)
  - Duration badges
  
- Main Queue section
  - Similar card layout
  - Scrollable list

**Key Design Elements**:
```tsx
className="min-h-screen bg-gray-900 text-white p-6"
className="bg-gray-800 rounded-lg p-6 mb-6"
className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
```

**Color Scheme**:
- Background: `bg-gray-900`
- Cards: `bg-gray-800`, `bg-gray-700`
- Text: `text-white`, `text-gray-400`
- Actions: `bg-red-600` (destructive), `bg-blue-600` (primary)
- Accent: `text-yellow-400` (priority markers)

---

#### ✅ `/apps/kiosk/` - Public Kiosk (FULLY IMPLEMENTED)
**File**: `apps/kiosk/src/components/KioskView.tsx`

**Features**:
- YouTube search integration
- Song request interface
- Stripe payment integration placeholder
- Search results with thumbnails
- Request button with pricing (£0.50)

**UI Components**:
- Search bar (full-width input + button)
  - `flex-1 px-4 py-3 bg-gray-800 border border-gray-700`
  - Focus states: `focus:ring-2 focus:ring-blue-500`
  
- Results cards
  - Thumbnail (w-24 h-24, rounded corners)
  - Track title + channel name
  - Request button (bg-green-600)
  - Horizontal flex layout

**Key Design Elements**:
```tsx
className="min-h-screen bg-gray-900 text-white p-6"
className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
className="bg-green-600 hover:bg-green-700 rounded-lg"
```

**Color Scheme**:
- Primary action: `bg-blue-600` (search)
- Success action: `bg-green-600` (request)
- Disabled state: `bg-blue-400`

---

#### 🔲 `/apps/dashboard/` - User Dashboard (PLACEHOLDER ONLY)
**File**: `apps/web/src/routes/dashboard/DashboardView.tsx`

**Current State**: Minimal placeholder
```tsx
<div className="min-h-screen bg-gray-900 text-white p-8">
  <h1 className="text-4xl font-bold mb-4">📊 Dashboard</h1>
  <p className="text-gray-400">User ID: {userId}</p>
</div>
```

**Note**: Full implementation exists in Svelte version (see below)

---

### 2. **Svelte-Based Advanced Implementations** (`/functions/appwrite/sites/DJAMMS Web App/`)
These contain production-ready, feature-rich UI implementations:

#### ⭐ `/routes/dashboard/+page.svelte` - FULL DASHBOARD
**Features** (650+ lines):
- Tabbed interface for multiple tools
- Window manager for multi-screen setups
- Real-time connection status indicators
- System resource monitoring (CPU, Memory, Storage)
- Activity logs with filtering
- Integrated sub-apps (Video Player, Queue Manager, Playlist Library, Admin Console)
- Status banners for user roles
- Launch cards with gradient backgrounds

**UI Components**:
- **Header**: Glass morphism effect, connection indicators (Wifi/WifiOff icons)
- **Welcome Section**: Large centered heading + description
- **Status Banners**: Role-based (admin/developer/user) with colored borders
- **Launch Cards**: 
  - Gradient backgrounds (from-music-blue to-blue-700, etc.)
  - Icons from lucide-svelte
  - Tab mode + window mode options
  - Hover effects with scaling

**Design Patterns**:
- Glass morphism: `glass-morphism border-b border-white/10`
- Gradients: `bg-gradient-to-br from-youtube-dark via-youtube-darker to-music-pink`
- Status indicators: Color-coded dots (green/yellow/red)
- Icon system: Lucide icons throughout

**Color Palette**:
- `from-music-blue to-blue-700` (Video Player)
- `from-music-purple to-purple-700` (Queue Manager)
- `from-music-pink to-pink-700` (Playlist Library)
- `from-blue-500 to-blue-700` (Admin Console)

---

#### ⭐ `/routes/adminconsole/+page.svelte` - FULL ADMIN CONSOLE
**Features** (700+ lines):
- Multi-tab interface (Player, Queue, UI, Privacy, System, Backup)
- Real-time player sync status
- Settings panels with toggles and sliders
- Queue management (drag-and-drop, reordering)
- Theme customization
- Privacy controls
- Performance monitoring
- Backup/restore functionality

**UI Components**:
- **Tab Navigation**: Horizontal scrollable tabs with active states
- **Settings Cards**: Glass morphism panels with organized sections
- **Toggle Switches**: Custom checkbox styling (`class="toggle"`)
- **Sliders**: Volume, playback speed controls
- **Status Indicators**: Connection status with icons
- **Action Buttons**: Save, Reset, Download, Upload

**Design Patterns**:
```svelte
<button class="tab-button" class:active={activeTab === 'player'}>
  <Volume2 class="w-4 h-4" />
  Player
</button>
```

**Settings Organization**:
1. **Player Tab**: Autoplay, shuffle, repeat, volume, crossfade, skip intros/outros
2. **UI Tab**: Theme, compact mode, animations, font size
3. **Privacy Tab**: Analytics, data collection, sharing options
4. **System Tab**: Performance metrics, cache management, error logs
5. **Backup Tab**: Export/import settings, queue backups

---

#### ⭐ `/routes/djamms-dashboard/+page.svelte` - TECHNICAL DASHBOARD
**Features** (800+ lines):
- System architecture view
- Player instance management
- Activity logs with filtering
- System resource graphs (CPU, Memory, Storage)
- Instance status indicators (Local/External/None)
- Window launcher buttons
- Real-time connection monitoring

**UI Components**:
- **System Status Cards**: CPU/Memory/Storage with percentage indicators
- **Activity Log Panel**: Filterable logs by source (player, queue-manager, kiosk, admin, system)
- **Launcher Buttons**: Large cards with icons, status indicators, hover effects
- **Connection Status**: Real-time indicators with color coding

**Design Elements**:
```svelte
<div class="glass-morphism rounded-2xl p-6">
  <div class="flex items-center gap-4">
    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl">
      <Settings class="w-6 h-6 text-white" />
    </div>
  </div>
</div>
```

---

### 3. **Unified Web App** (`/apps/web/`)
This is the new React-based unified app being migrated to:

#### Current Routes (All with placeholders):
- `/` - Landing page ✅ (has content)
- `/auth` - Magic link login ✅ (fully implemented)
- `/auth/callback` - Auth callback ✅ (fully implemented)
- `/dashboard/:userId` - 🔲 Placeholder
- `/player/:venueId` - 🔲 Placeholder
- `/admin/:venueId` - 🔲 Placeholder
- `/kiosk/:venueId` - 🔲 Placeholder

---

## 🎨 Design System Summary

### Color Palette

#### Background Colors:
- Primary: `bg-gray-900` (main background)
- Secondary: `bg-gray-800` (cards, panels)
- Tertiary: `bg-gray-700` (nested elements)

#### Text Colors:
- Primary: `text-white`
- Secondary: `text-gray-400`
- Muted: `text-gray-500`

#### Accent Colors:
- **Blue** (Primary actions): `bg-blue-600`, `hover:bg-blue-700`
- **Green** (Success/Confirm): `bg-green-600`, `hover:bg-green-700`
- **Red** (Destructive): `bg-red-600`, `hover:bg-red-700`
- **Yellow** (Warning/Priority): `text-yellow-400`, `bg-yellow-500`
- **Purple** (Special features): `from-music-purple to-purple-700`
- **Pink** (Accent): `from-music-pink to-pink-700`

#### Gradient Backgrounds:
```css
bg-gradient-to-br from-youtube-dark via-youtube-darker to-music-pink
bg-gradient-to-br from-music-blue to-blue-700
bg-gradient-to-br from-music-purple to-purple-700
bg-gradient-to-br from-music-pink to-pink-700
```

### Typography

#### Headings:
- H1: `text-4xl font-bold` or `text-3xl font-bold`
- H2: `text-2xl font-bold` or `text-xl font-semibold`
- H3: `text-lg font-semibold`

#### Body Text:
- Primary: `text-base` (default)
- Secondary: `text-sm text-gray-400`
- Small: `text-xs text-gray-500`

#### Special:
- Monospace (timers): `text-3xl font-mono`

### Layout Patterns

#### Container:
```tsx
<div className="min-h-screen bg-gray-900 text-white p-6">
  <div className="max-w-7xl mx-auto">
    {/* Content */}
  </div>
</div>
```

#### Card:
```tsx
<div className="bg-gray-800 rounded-lg p-6 mb-6">
  <h2 className="text-xl font-semibold mb-4">Card Title</h2>
  {/* Card content */}
</div>
```

#### Glass Morphism:
```svelte
<div class="glass-morphism border-b border-white/10">
  {/* Content */}
</div>
```

### Component Patterns

#### Button Variants:
```tsx
// Primary
className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"

// Destructive
className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"

// Success
className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"

// Disabled
className="px-6 py-3 bg-blue-400 rounded-lg font-medium"
```

#### Input Fields:
```tsx
className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
           focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
```

#### Status Indicators:
```tsx
// Connected
<div className="flex items-center gap-2 text-green-400">
  <Circle className="w-3 h-3 fill-current" />
  <span>Connected</span>
</div>

// Warning
<div className="flex items-center gap-2 text-yellow-400">
  <AlertTriangle className="w-3 h-3" />
  <span>Warning</span>
</div>

// Disconnected
<div className="flex items-center gap-2 text-red-400">
  <XCircle className="w-3 h-3" />
  <span>Disconnected</span>
</div>
```

---

## 📸 Screenshots

### Existing Screenshots:
1. **`debug-screenshot.png`** - Test screenshot from E2E tests
2. **`quick-test.png`** - Quick authentication check screenshot

**Location**: Root directory
**Source**: Playwright E2E tests (`tests/e2e/`)

---

## 🎯 Design Specifications from Svelte Apps

### Video Player Interface:
- Full-screen dark background
- YouTube embed with custom controls
- Overlay UI for track info
- Volume controls
- Crossfade visualization

### Queue Manager:
- Drag-and-drop track reordering
- Priority vs. main queue sections
- Track cards with thumbnails
- Duration badges
- Add/remove controls

### Playlist Library:
- Grid or list view toggle
- Playlist cards with cover art
- Create/edit/delete controls
- Search and filter
- Track count indicators

### Admin Console:
- Tabbed settings interface
- Toggle switches for binary options
- Sliders for ranges (volume, speed)
- Save/reset buttons
- Performance graphs

### Kiosk View:
- Search-first interface
- Large touch-friendly buttons
- Clear pricing display
- Thumbnail previews
- Request confirmation flow

---

## 🔄 Migration Status

### ✅ Fully Migrated to `/apps/web/`:
- Landing page
- Authentication (login + callback)

### 🔄 Needs Migration (has full Svelte implementation):
- Dashboard (`/routes/dashboard/+page.svelte` → `/apps/web/src/routes/dashboard/DashboardView.tsx`)
- Admin Console (`/routes/adminconsole/+page.svelte` → `/apps/web/src/routes/admin/AdminView.tsx`)

### ✅ Has Standalone Implementation (can be ported):
- Player (`/apps/player/src/components/AdvancedPlayer.tsx` - already React)
- Kiosk (`/apps/kiosk/src/components/KioskView.tsx` - already React)

---

## 🎨 Icon System

**Library**: Lucide Icons (React & Svelte versions)

**Common Icons**:
- `Play`, `Pause` - Playback controls
- `Volume2`, `VolumeX` - Volume controls
- `Settings` - Configuration
- `User` - User profile
- `Monitor`, `Wifi`, `WifiOff` - Connection status
- `Circle`, `AlertTriangle`, `CheckCircle`, `XCircle` - Status indicators
- `Music`, `Headphones`, `ListMusic` - Music-related
- `Plus`, `Trash2`, `RefreshCw` - Actions
- `Eye`, `EyeOff` - Visibility toggles
- `Lock`, `Unlock` - Privacy controls
- `Database`, `Download`, `Upload` - Data management

---

## 📋 Next Steps for Migration

### Priority 1: Dashboard View
**Source**: `functions/appwrite/sites/DJAMMS Web App/routes/dashboard/+page.svelte`
**Target**: `apps/web/src/routes/dashboard/DashboardView.tsx`

**Components to Port**:
1. Tabbed interface system
2. Launch cards with gradients
3. Connection status indicators
4. Tab content components (QueueManagerTab, PlaylistLibraryTab, AdminConsoleTab)

### Priority 2: Admin View
**Source**: `functions/appwrite/sites/DJAMMS Web App/routes/adminconsole/+page.svelte`
**Target**: `apps/web/src/routes/admin/AdminView.tsx`

**Components to Port**:
1. Multi-tab settings interface
2. Toggle switches and sliders
3. Queue management with drag-and-drop
4. Backup/restore functionality

### Priority 3: Player View
**Source**: `apps/player/src/components/AdvancedPlayer.tsx` (already React)
**Target**: `apps/web/src/routes/player/PlayerView.tsx`

**Action**: Copy implementation, adapt for unified routing

### Priority 4: Kiosk View
**Source**: `apps/kiosk/src/components/KioskView.tsx` (already React)
**Target**: `apps/web/src/routes/kiosk/KioskView.tsx`

**Action**: Copy implementation, adapt for unified routing

---

## 🎯 Design References

### Tailwind Custom Colors (from `tailwind.config.js`):
```js
colors: {
  'youtube-dark': '#0f0f0f',
  'youtube-darker': '#0a0a0a',
  'music-blue': '#1e40af',
  'music-purple': '#7c3aed',
  'music-pink': '#ec4899'
}
```

### Custom CSS Classes:
- `.glass-morphism` - Glassmorphism effect
- `.tab-button` - Tab navigation button
- `.toggle` - Custom checkbox/toggle switch
- `.status-indicator` - Connection status badge

---

## 📝 Design Notes

1. **Consistent Dark Theme**: All apps use `bg-gray-900` base with lighter grays for elevation
2. **Accent Colors**: Blue (primary), Green (success), Red (destructive), Yellow (warning)
3. **Rounded Corners**: `rounded-lg` (8px) standard, `rounded-xl` (12px) for larger elements
4. **Spacing**: `p-6` (24px) standard card padding, `p-8` (32px) for main containers
5. **Typography**: Clean hierarchy with bold headings and gray-400 for secondary text
6. **Icons**: Lucide icons throughout for consistency
7. **Animations**: `transition` class for smooth state changes
8. **Focus States**: Blue ring (`focus:ring-2 focus:ring-blue-500`) for keyboard navigation
9. **Hover Effects**: Darker shades on hover (e.g., `hover:bg-blue-700`)
10. **Gradients**: Used for branding elements (cards, backgrounds) with music-themed colors

---

## 🔗 Related Files

- **Tailwind Config**: `tailwind.config.js`
- **PostCSS Config**: `postcss.config.js`
- **Global Styles**: `apps/*/src/index.css`
- **Component Library**: `packages/shared/src/components/` (if exists)
- **Type Definitions**: `packages/shared/src/types/` (Track, Queue, PlayerState, etc.)

---

**Last Updated**: 2025-10-10
**Status**: Migration in progress (auth complete, endpoints need porting)
