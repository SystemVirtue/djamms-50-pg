# DJAMMS Architecture Analysis - Summary

## 📋 Documents Created

I've analyzed your DJAMMS codebase and created three comprehensive documents:

### 1. **DJAMMS_ARCHITECTURE_COMPLETE.md** (Main Reference)
Complete architectural documentation covering:
- Three endpoint model (Player/Admin/Kiosk)
- Database schema and collections
- State management (4-layer sync system)
- Queue management implementation
- Dual YouTube iframe crossfading
- Master election via heartbeat
- Technology stack overview

### 2. **DJAMMS_DEVELOPMENT_ROADMAP.md** (Implementation Plan)
Detailed 4-week development plan with:
- Phase 1: Player Endpoint (Week 1)
- Phase 2: Admin Endpoint (Week 2)
- Phase 3: Kiosk Endpoint (Week 3)
- Phase 4: Real-Time Sync Enhancement (Week 4)
- Step-by-step implementation guide
- Testing strategy and success criteria
- Risk mitigation and timeline

### 3. **DJAMMS_ARCHITECTURE_DIAGRAM.md** (Quick Reference)
Visual diagrams showing:
- System overview
- Player startup flow
- Dual iframe architecture
- Queue management data flow
- Synchronization layers
- Admin-Player-Kiosk interaction
- Common operations quick reference

---

## 🔑 Key Architectural Insights

### The Three Endpoints Explained

#### **Player (`/player/:venueId`)**
- **Purpose**: Master playback device (dedicated tablet/PC at venue)
- **Key Features**: 
  - Dual YouTube iframes for seamless crossfading
  - Master election (only one active player per venue)
  - Heartbeat mechanism (30s updates, 60s expiry)
  - Local queue caching for offline resilience
- **Current Status**: Fully implemented in standalone app, needs porting to unified app

#### **Admin (`/admin/:venueId`)**
- **Purpose**: Venue staff control panel
- **Key Features**:
  - View now playing with countdown
  - Skip tracks, remove from queue
  - Manage priority queue (paid requests)
  - Real-time updates via WebSocket
- **Current Status**: Fully implemented in standalone app, needs porting to unified app

#### **Kiosk (`/kiosk/:venueId`)**
- **Purpose**: Guest-facing song request interface
- **Key Features**:
  - YouTube search integration
  - Stripe payment (£0.50 per request)
  - Add tracks to priority queue
  - View now playing and queue position
- **Current Status**: Basic implementation in standalone app, needs Stripe integration

---

## 🗄️ Database Schema (Simplified)

### **queues** Collection
The heart of the system - stores current playback state per venue.

```typescript
{
  venueId: string,
  nowPlaying?: {
    videoId, title, artist, duration,
    startTime, remaining, isRequest
  },
  mainQueue: Track[],      // Rotates (play → move to end)
  priorityQueue: Track[]   // Linear (play → remove)
}
```

### **player_instances** Collection
Master election and heartbeat tracking.

```typescript
{
  playerId: string,
  venueId: string,
  deviceId: string,
  status: 'active' | 'idle' | 'offline',
  lastHeartbeat: number,   // Updated every 30s
  expiresAt: number        // Now + 60s
}
```

---

## 🔄 State Synchronization (4-Layer System)

### Layer 1: **localStorage** (0ms latency)
- Instant load on page refresh
- Offline resilience
- Key: `djammsQueue_{venueId}`

### Layer 2: **BroadcastChannel** (10-50ms latency)
- Cross-tab/window sync (same origin)
- In-memory message passing
- Faster than WebSocket for same-device updates

### Layer 3: **AppWrite Realtime** (200-500ms latency)
- WebSocket subscriptions to database changes
- Cross-device synchronization
- Primary sync mechanism

### Layer 4: **Polling** (up to 15s latency)
- 15-second interval fallback
- Ensures sync even if WebSocket fails
- Query: `databases.listDocuments()`

**Priority**: localStorage → BroadcastChannel → Realtime → Polling

---

## 🎵 Queue Management Logic

### Track Progression
```typescript
// Priority queue takes precedence
getNextTrack(state) {
  if (state.priorityQueue.length > 0) 
    return state.priorityQueue[0];  // Paid request
  if (state.mainQueue.length > 0) 
    return state.mainQueue[0];      // Regular queue
  return undefined;
}
```

### Queue Behavior
- **Priority Queue** (Paid Requests): Linear - play once, remove
- **Main Queue** (Standard): Circular - play, move to end, repeat forever

### Example Flow
```
Initial State:
  mainQueue: [Track1, Track2, Track3]
  priorityQueue: [RequestA]

After playing RequestA:
  mainQueue: [Track1, Track2, Track3]  // Unchanged
  priorityQueue: []                    // RequestA removed

After playing Track1:
  mainQueue: [Track2, Track3, Track1]  // Track1 moved to end
  priorityQueue: []
```

---

## 🎬 Dual YouTube Iframe Crossfading

### Why Dual Iframes?
- **Primary**: Visible, currently playing
- **Secondary**: Hidden, pre-loading next track
- **Benefit**: Zero buffering between tracks

### Crossfade Process (5 seconds)
```
1. Secondary iframe loads next track (hidden)
2. 5 seconds before current track ends:
   - Start volume fade:
     Primary: 100 → 0 (fade out)
     Secondary: 0 → 100 (fade in)
3. After 5s fade:
   - Swap roles: Secondary becomes Primary
   - Old Primary becomes new Secondary
4. Schedule next crossfade
```

---

## 🚀 Recommended Development Approach

### **Strategy: Adapt Standalone Apps into Unified App**

**Why this approach?**
- ✅ Standalone apps have proven, working implementations
- ✅ Reduce development time (weeks vs months)
- ✅ Single deployment target (www.djamms.app)
- ✅ Consistent user experience

**Implementation Steps:**

#### **Phase 1: Player Endpoint** (Week 1)
1. Extract `usePlayerManager` hook from standalone app
2. Implement `PlayerRegistry` for master election
3. Port dual iframe player component
4. Add heartbeat mechanism (30s updates)
5. Test master election, queue sync, crossfading

#### **Phase 2: Admin Endpoint** (Week 2)
1. Port admin dashboard component
2. Set up AppWrite Realtime subscriptions
3. Implement skip track, remove track functions
4. Add countdown timer for now playing
5. Test real-time sync with player

#### **Phase 3: Kiosk Endpoint** (Week 3)
1. Port kiosk interface with YouTube search
2. Integrate Stripe payment flow
3. Add request submission to priority queue
4. Display now playing and queue position
5. Test end-to-end request flow

#### **Phase 4: Enhancement** (Week 4)
1. Add BroadcastChannel for cross-tab sync
2. Implement optimistic UI updates
3. Add retry logic for network failures
4. UI polish and responsive design
5. Comprehensive testing

---

## 🎯 Current Status vs Target

### ✅ **Completed** (Standalone Apps)
- Magic URL authentication
- Player with dual iframe crossfading
- Admin dashboard with real-time updates
- Kiosk search interface
- Master election via heartbeat
- Queue rotation logic
- AppWrite Realtime subscriptions

### 🚧 **In Progress** (Unified App)
- `/player/:venueId` - Static mockup only
- `/admin/:venueId` - Static mockup only
- `/kiosk/:venueId` - Static mockup only

### ⏳ **Not Implemented**
- Stripe payment integration (kiosk)
- Queue reordering (drag-and-drop in admin)
- Request approval workflow
- Player settings UI
- Analytics dashboard

---

## 🔧 Required Setup

### **Environment Variables Needed**
```bash
# YouTube API (for kiosk search)
VITE_YOUTUBE_API_KEY=your_key_here

# Stripe (for kiosk payments)
VITE_STRIPE_PUBLIC_KEY=your_key_here
APPWRITE_STRIPE_SECRET_KEY=your_key_here
```

### **NPM Packages to Install**
```bash
npm install react-youtube          # YouTube player
npm install @stripe/stripe-js      # Stripe payments
npm install @dnd-kit/core          # Drag-and-drop (admin)
npm install date-fns               # Date utilities
```

### **AppWrite Functions to Create**
- `add-request` - Add track to priority queue after payment
- `player-heartbeat` - Update master player heartbeat (optional, can be client-side)
- `cleanup-expired-players` - Remove stale player instances (cron job)

---

## ❓ Questions for You

Before starting implementation, please confirm:

1. **Approach Approval**: Do you approve adapting standalone apps into unified app? (vs building from scratch)

2. **Phase Priority**: Should we start with Player (core functionality), Admin (control), or Kiosk (revenue)?

3. **Stripe Setup**: Do you have a Stripe account configured? Need help setting this up?

4. **YouTube API**: Do you have a YouTube Data API key? (Free tier: 10,000 units/day)

5. **Testing Environment**: Should we create a staging site on AppWrite for testing before production deployment?

6. **Timeline**: Is a 4-week timeline acceptable (1 week per phase), or do you need faster delivery for a specific endpoint?

7. **Feature Scope**: Any features you want to add/remove from the roadmap?

---

## 📚 How to Use These Documents

### For **Understanding Architecture**:
Read **DJAMMS_ARCHITECTURE_COMPLETE.md** for comprehensive details on:
- How endpoints interact with AppWrite
- State management implementation
- Queue management functions
- Synchronization mechanisms

### For **Quick Reference**:
Use **DJAMMS_ARCHITECTURE_DIAGRAM.md** for:
- Visual flow diagrams
- Common operations
- Quick code snippets
- File structure reference

### For **Implementation**:
Follow **DJAMMS_DEVELOPMENT_ROADMAP.md** for:
- Step-by-step implementation guide
- Testing strategy
- Success criteria
- Risk mitigation

---

## ✅ Next Steps

Once you confirm the approach, I'll help you:

1. **Set up environment variables** (YouTube API, Stripe keys)
2. **Create Phase 1 branch** (`feature/player-endpoint`)
3. **Extract usePlayerManager hook** from standalone app
4. **Implement master election** with PlayerRegistry
5. **Port dual YouTube player** component
6. **Test master election** and queue sync
7. **Deploy to staging** for testing
8. **Move to Phase 2** (Admin endpoint)

**Estimated Timeline**: 4 weeks total, 1 endpoint per week

---

## 🚨 Critical Implementation Notes

### **Master Election is Critical**
- Only ONE player can be active per venue
- Heartbeat must update every 30s
- Expired masters (60s) can be reclaimed
- Non-master devices show "Player Busy" screen

### **Queue Rotation Must Be Correct**
- Main queue: Play → Move to end (circular)
- Priority queue: Play → Remove (linear)
- Priority queue always takes precedence

### **Crossfading Requires Timing**
- Schedule fade 5s before track ends
- Fade duration: 5 seconds
- Volume: Primary 100→0, Secondary 0→100
- Swap iframes after fade completes

### **Real-Time Sync is Essential**
- Subscribe to `databases.*.collections.queues.documents`
- Update local state on WebSocket events
- Cache in localStorage on every update
- Polling fallback every 15s

---

## 💡 Key Takeaways

1. **Three distinct endpoints** serve different purposes (player/admin/kiosk)
2. **Master election** ensures only one player per venue
3. **Dual YouTube iframes** enable seamless crossfading
4. **4-layer sync system** (localStorage → BroadcastChannel → Realtime → Polling)
5. **Queue rotation logic** differs (main: circular, priority: linear)
6. **AppWrite Realtime** provides instant cross-device sync
7. **Standalone apps** provide working reference implementations
8. **Unified app** needs these features ported from standalone

---

**Ready to proceed?** Please review these documents and let me know:
- Do you approve the development approach?
- Which phase should we start with?
- Do you have any questions about the architecture?
- Should we begin Phase 1 (Player Endpoint) implementation?

I'm ready to start coding as soon as you give the green light! 🚀
