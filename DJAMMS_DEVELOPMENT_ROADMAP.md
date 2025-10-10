# DJAMMS Frontend Development Roadmap

## Strategy Overview

**Approach**: Adapt existing standalone implementations into unified app (`apps/web/src/routes/`)

**Why This Approach**:
- ✅ Standalone apps have proven, working implementations
- ✅ Reduce development time by reusing tested code
- ✅ Single deployment target (www.djamms.app)
- ✅ Consistent user experience across all endpoints
- ✅ Shared state management and authentication

**Alternative Considered**: Build from scratch following Svelte patterns
- ❌ More time-consuming
- ❌ Risk of introducing new bugs
- ❌ Duplicate effort (already have working code)

---

## Phase 1: Player Endpoint Implementation

### Objective
Implement fully functional player endpoint at `/player/:venueId` with:
- Master election and heartbeat system
- Dual YouTube iframe with crossfading
- Queue management and rotation
- Real-time sync with AppWrite
- localStorage caching

### Step 1.1: Extract and Adapt Core Player Logic
**File**: Create `apps/web/src/hooks/usePlayerManager.ts`

**Actions**:
1. Copy from `apps/player/src/hooks/usePlayerManager.ts`
2. Adjust imports to use unified app structure
3. Ensure AppwriteContext compatibility
4. Test master election logic in isolation

**Dependencies**:
- `@appwrite/AppwriteContext` (ensure exported)
- `@shared/types` (PlayerState, Track, etc.)
- `@shared/config/env` (AppWrite config)

**Key Code to Port**:
```typescript
export const usePlayerManager = (venueId: string) => {
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track>();
  const [playerState, setPlayerState] = useState<PlayerState>();
  
  // Master election logic
  // Queue loading from localStorage + server
  // AppWrite Realtime subscriptions
  // 15s polling sync
  // Track progression (playNextTrack)
  
  return { isMaster, currentTrack, playerState, playNextTrack, ... };
};
```

**Testing**:
- Unit test master election logic
- Mock AppWrite responses
- Verify localStorage caching works

---

### Step 1.2: Implement Master Election Service
**File**: Create `apps/web/src/services/PlayerRegistry.ts`

**Actions**:
1. Implement heartbeat mechanism (30s interval)
2. Master expiry check (60s timeout)
3. Device registration with AppWrite
4. Conflict resolution (multiple masters)

**Key Functions**:
```typescript
class PlayerRegistry {
  async requestMasterPlayer(venueId: string, token: string): Promise<{
    success: boolean;
    reason?: string;
    playerId?: string;
  }> {
    // Check for active master
    // If none, create player_instance with status='active'
    // Start heartbeat
  }
  
  async checkMasterStatus(venueId: string, token: string): Promise<boolean> {
    // Check if this device is still master
    // Validate expiry timestamp
  }
  
  async cleanup(venueId: string, token: string): Promise<void> {
    // Set status='offline' on unmount
  }
}
```

**AppWrite Integration**:
- Collection: `player_instances`
- Operations: create, update (heartbeat), query (check master)

---

### Step 1.3: Build Dual YouTube Player Component
**File**: Replace `apps/web/src/routes/player/PlayerView.tsx`

**Actions**:
1. Copy from `apps/player/src/components/AdvancedPlayer.tsx`
2. Integrate with `usePlayerManager` hook
3. Implement dual iframe setup
4. Add crossfade logic (5s fade, volume control)
5. Add PlayerBusyScreen for non-master devices

**Component Structure**:
```tsx
export const PlayerView: React.FC = () => {
  const { venueId } = useParams();
  const { isMaster, currentTrack, playerState, playNextTrack } = 
    usePlayerManager(venueId);
  
  const [primaryPlayer, setPrimaryPlayer] = useState<YT.Player>();
  const [secondaryPlayer, setSecondaryPlayer] = useState<YT.Player>();
  
  // If not master, show PlayerBusyScreen
  if (!isMaster) return <PlayerBusyScreen />;
  
  return (
    <div className="player-container">
      {/* Primary YouTube iframe (visible) */}
      <YouTube videoId={currentTrack?.videoId} onEnd={playNextTrack} />
      
      {/* Secondary YouTube iframe (hidden, pre-loading) */}
      <YouTube style={{ display: 'none' }} />
      
      {/* Now Playing UI */}
      {/* Queue Preview UI */}
      {/* Autoplay Toggle */}
    </div>
  );
};
```

**Crossfade Implementation**:
- Listen for `startCrossfade` custom event
- Gradually fade primary volume 100→0, secondary 0→100
- Swap primary/secondary players after fade
- Schedule next crossfade 5s before track end

---

### Step 1.4: Add PlayerBusyScreen Component
**File**: Create `apps/web/src/components/PlayerBusyScreen.tsx`

**Actions**:
1. Copy from `apps/player/src/components/PlayerBusyScreen.tsx`
2. Show when another device is master
3. Display last heartbeat time
4. Provide links to admin/viewer modes
5. Add "Retry Connection" button

**UI Elements**:
- Device ID of current master
- Last seen timestamp
- Error message (if any)
- Alternative links (admin, kiosk)

---

### Step 1.5: Testing & Validation
**Tests**:
- ✅ Master election works (one device becomes master)
- ✅ Non-master shows PlayerBusyScreen
- ✅ Queue loads from localStorage on startup
- ✅ Queue syncs with AppWrite in real-time
- ✅ Track progression works (play next on track end)
- ✅ Crossfade activates 5s before track end
- ✅ Dual iframes swap correctly
- ✅ Heartbeat maintains master status
- ✅ Master expires after 60s without heartbeat

**Manual Testing**:
1. Open player on Device A → Should become master
2. Open player on Device B → Should show busy screen
3. Close Device A → Device B should claim master after 60s
4. Add track via admin → Player should update queue
5. Let track finish → Should auto-play next track with crossfade

---

## Phase 2: Admin Endpoint Implementation

### Objective
Implement admin dashboard at `/admin/:venueId` with:
- Real-time now playing display with countdown
- Queue viewing (main + priority queues)
- Skip track functionality
- Queue manipulation (remove, reorder)
- Request approval workflow

### Step 2.1: Create Admin Dashboard Component
**File**: Replace `apps/web/src/routes/admin/AdminView.tsx`

**Actions**:
1. Copy from `apps/admin/src/components/AdminDashboard.tsx`
2. Set up AppWrite Realtime subscriptions
3. Parse queue JSON from database
4. Implement countdown timer for now playing

**Key State**:
```typescript
const [queue, setQueue] = useState<Queue | null>(null);
const [countdown, setCountdown] = useState(0);
const [loading, setLoading] = useState(true);
```

**Realtime Subscription**:
```typescript
client.subscribe(
  `databases.${databaseId}.collections.queues.documents`,
  (response) => {
    if (response.payload.venueId === venueId) {
      const queueData = parseQueue(response.payload);
      setQueue(queueData);
      setCountdown(queueData.nowPlaying?.remaining || 0);
    }
  }
);
```

---

### Step 2.2: Implement Skip Track Function
**Action**: Call AppWrite function to move to next track

```typescript
const handleSkip = async () => {
  const nextTrack = getNextTrack(queue);
  if (!nextTrack) {
    toast.error('No tracks in queue');
    return;
  }
  
  try {
    await databases.updateDocument(databaseId, 'queues', queueId, {
      nowPlaying: {
        ...nextTrack,
        startTime: Date.now(),
        remaining: nextTrack.duration - 1
      },
      mainQueue: updateMainQueue(queue),
      priorityQueue: updatePriorityQueue(queue)
    });
    
    toast.success('Track skipped');
  } catch (error) {
    toast.error('Failed to skip track');
  }
};
```

**Note**: Reuse track progression logic from `usePlayerManager`

---

### Step 2.3: Add Queue Management UI
**Features**:
- Remove track from queue (confirm dialog)
- Reorder tracks (drag-and-drop using `@dnd-kit/core`)
- Approve/reject requests (priority queue)
- View request details (requester, payment amount)

**Queue Removal**:
```typescript
const handleRemoveTrack = async (trackIndex: number, isPriority: boolean) => {
  const updatedQueue = isPriority
    ? queue.priorityQueue.filter((_, i) => i !== trackIndex)
    : queue.mainQueue.filter((_, i) => i !== trackIndex);
  
  await databases.updateDocument(databaseId, 'queues', queueId, {
    [isPriority ? 'priorityQueue' : 'mainQueue']: updatedQueue
  });
};
```

**Drag-and-Drop** (future enhancement):
- Install `@dnd-kit/core` and `@dnd-kit/sortable`
- Wrap queue items in `<SortableItem>`
- On drop, reorder positions and update database

---

### Step 2.4: Testing & Validation
**Tests**:
- ✅ Admin loads queue on mount
- ✅ Now playing displays with countdown
- ✅ Countdown decrements every second
- ✅ Skip track updates database and UI
- ✅ Queue updates reflect instantly (realtime)
- ✅ Remove track works for both queues
- ✅ Priority queue shows payment badge

**Manual Testing**:
1. Open admin → Should show now playing
2. Wait for countdown → Should decrement
3. Click skip → Player should change track
4. Add track via kiosk → Should appear in priority queue
5. Remove track → Should disappear from queue

---

## Phase 3: Kiosk Endpoint Implementation

### Objective
Implement kiosk interface at `/kiosk/:venueId` with:
- YouTube search integration
- Song request with payment
- View current queue
- See now playing

### Step 3.1: Create Kiosk Component
**File**: Replace `apps/web/src/routes/kiosk/KioskView.tsx`

**Actions**:
1. Copy from `apps/kiosk/src/components/KioskView.tsx`
2. Implement YouTube Data API search
3. Add Stripe payment integration
4. Submit request to priority queue

**Search Implementation**:
```typescript
const handleSearch = async (query: string) => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&q=${encodeURIComponent(query)}` +
    `&type=video&key=${config.youtube.apiKey}&maxResults=10`
  );
  
  const data = await response.json();
  setSearchResults(data.items || []);
};
```

---

### Step 3.2: Integrate Stripe Payment
**Action**: Add Stripe checkout for song requests

**Flow**:
1. User clicks "Request (£0.50)"
2. Open Stripe checkout modal
3. On payment success → Get payment ID
4. Call AppWrite function to add track to priority queue

**AppWrite Function**: `add-request`
```typescript
// functions/add-request/src/main.ts
export default async ({ req, res }) => {
  const { venueId, track, paymentId } = JSON.parse(req.body);
  
  // Verify payment with Stripe
  const payment = await stripe.payments.retrieve(paymentId);
  if (payment.status !== 'succeeded') {
    return res.json({ error: 'Payment failed' }, 400);
  }
  
  // Add to priority queue
  const queue = await databases.getDocument(databaseId, 'queues', venueId);
  const updatedPriorityQueue = [
    ...queue.priorityQueue,
    {
      ...track,
      isRequest: true,
      requesterId: paymentId,
      paidCredit: payment.amount / 100,
      position: queue.priorityQueue.length + 1
    }
  ];
  
  await databases.updateDocument(databaseId, 'queues', venueId, {
    priorityQueue: updatedPriorityQueue
  });
  
  return res.json({ success: true, queuePosition: updatedPriorityQueue.length });
};
```

---

### Step 3.3: Display Current Queue
**Action**: Subscribe to queue updates and show position

```typescript
useEffect(() => {
  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.queues.documents`,
    (response) => {
      if (response.payload.venueId === venueId) {
        setNowPlaying(response.payload.nowPlaying);
        setQueueLength(
          response.payload.mainQueue.length + 
          response.payload.priorityQueue.length
        );
      }
    }
  );
  
  return unsubscribe;
}, [venueId]);
```

**UI Elements**:
- Now playing banner (fixed top)
- Queue position counter
- Search results with thumbnails
- Request button with price

---

### Step 3.4: Testing & Validation
**Tests**:
- ✅ YouTube search returns results
- ✅ Stripe modal opens on request click
- ✅ Payment success adds to priority queue
- ✅ Kiosk shows now playing in real-time
- ✅ Queue position updates when tracks added/removed
- ✅ Request confirmation shown after payment

**Manual Testing**:
1. Search "Ed Sheeran" → Should show results
2. Click request → Stripe modal opens
3. Complete payment → Should add to priority queue
4. Check admin → Should see new request in priority queue
5. Check player → Should prioritize request on next track

---

## Phase 4: Real-Time Synchronization Enhancement

### Objective
Ensure all endpoints sync seamlessly with AppWrite and each other

### Step 4.1: Implement BroadcastChannel Sync (Optional)
**File**: Create `apps/web/src/services/PlayerSync.ts`

**Purpose**: Instant sync across tabs/windows (same-origin)

**Implementation**:
```typescript
class PlayerSyncService {
  private channel = new BroadcastChannel('djamms-sync');
  
  broadcastQueueUpdate(queue: Queue) {
    this.channel.postMessage({ type: 'queue_update', queue });
  }
  
  listenForUpdates(callback: (queue: Queue) => void) {
    this.channel.onmessage = (event) => {
      if (event.data.type === 'queue_update') {
        callback(event.data.queue);
      }
    };
  }
}
```

**Use Case**: 
- User has player + admin open in separate tabs
- Admin skips track → BroadcastChannel notifies player instantly
- Faster than AppWrite Realtime (~10ms vs ~200ms)

---

### Step 4.2: Add Optimistic UI Updates
**Pattern**: Update UI immediately, rollback on error

**Example** (Skip Track):
```typescript
const handleSkip = async () => {
  const originalQueue = queue;
  const nextQueue = getNextQueueState(queue);
  
  setQueue(nextQueue);  // Optimistic update
  
  try {
    await databases.updateDocument(...);
  } catch (error) {
    setQueue(originalQueue);  // Rollback
    toast.error('Failed to skip track');
  }
};
```

---

### Step 4.3: Implement Retry Logic for Failed Syncs
**Pattern**: Exponential backoff on network errors

```typescript
const syncWithRetry = async (operation: () => Promise<void>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

---

## Phase 5: UI Polish & Enhancements

### Step 5.1: Responsive Design
- Mobile-first layouts for kiosk (guest users)
- Tablet-optimized player interface
- Desktop admin dashboard

### Step 5.2: Loading States
- Skeleton screens during data fetch
- Spinner for API calls
- Toast notifications for errors

### Step 5.3: Accessibility
- ARIA labels for player controls
- Keyboard navigation for admin
- Screen reader support

### Step 5.4: Error Boundaries
- Catch React errors
- Display fallback UI
- Log to error tracking service

---

## Implementation Timeline

### Week 1: Player Endpoint
- Day 1-2: Extract and adapt `usePlayerManager` hook
- Day 3-4: Implement master election service
- Day 5-6: Build dual YouTube player component
- Day 7: Testing and bug fixes

### Week 2: Admin Endpoint
- Day 1-2: Create admin dashboard component
- Day 3-4: Implement skip track and queue management
- Day 5-6: Add request approval workflow
- Day 7: Testing and bug fixes

### Week 3: Kiosk Endpoint
- Day 1-2: Create kiosk component with YouTube search
- Day 3-4: Integrate Stripe payment
- Day 5-6: Display queue and now playing
- Day 7: Testing and bug fixes

### Week 4: Integration & Polish
- Day 1-3: Real-time sync enhancement (BroadcastChannel)
- Day 4-5: Optimistic UI and retry logic
- Day 6-7: UI polish, responsive design, accessibility

---

## Testing Strategy

### Unit Tests (Vitest)
- `usePlayerManager` hook logic
- Queue manipulation functions
- Master election logic
- Track progression algorithm

### Integration Tests (Playwright)
- Player becomes master on first load
- Admin skip track updates player
- Kiosk request appears in priority queue
- Real-time updates work across endpoints

### Manual Testing Checklist
- [ ] Player master election works
- [ ] Dual iframe crossfading works
- [ ] Queue rotates correctly (main queue)
- [ ] Priority queue takes precedence
- [ ] Admin skip track works
- [ ] Admin remove track works
- [ ] Kiosk search works
- [ ] Kiosk payment works
- [ ] Kiosk request adds to priority queue
- [ ] Real-time sync works across all endpoints
- [ ] localStorage caching works offline
- [ ] Polling fallback works when WebSocket fails

---

## Dependencies to Install

### NPM Packages
```bash
# YouTube player
npm install react-youtube

# Drag-and-drop (admin queue reordering)
npm install @dnd-kit/core @dnd-kit/sortable

# Stripe payments
npm install @stripe/stripe-js

# Toast notifications (already installed)
# npm install sonner

# Date/time utilities
npm install date-fns
```

### AppWrite Functions
- `add-request` - Add track to priority queue after payment
- `player-heartbeat` - Update master player heartbeat
- `cleanup-expired-players` - Remove stale player instances

---

## Environment Variables Required

```env
# YouTube API (for kiosk search)
VITE_YOUTUBE_API_KEY=your_key_here

# Stripe (for kiosk payments)
VITE_STRIPE_PUBLIC_KEY=your_key_here
APPWRITE_STRIPE_SECRET_KEY=your_key_here

# AppWrite (already configured)
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=your_db_id
```

---

## Deployment Plan

### Development
1. Implement each phase locally
2. Test in development environment
3. Commit to feature branch

### Staging
1. Deploy to AppWrite Sites (separate site)
2. Run E2E tests with Playwright
3. Manual QA testing

### Production
1. Merge feature branch to main
2. Deploy to www.djamms.app
3. Monitor for errors
4. Rollback if critical issues

---

## Success Criteria

### Player Endpoint
- ✅ Becomes master on first load
- ✅ Shows busy screen when master active
- ✅ Dual iframe crossfading works smoothly
- ✅ Queue rotates correctly
- ✅ Real-time sync with admin changes
- ✅ Heartbeat maintains master status

### Admin Endpoint
- ✅ Displays now playing with countdown
- ✅ Shows main and priority queues
- ✅ Skip track works instantly
- ✅ Remove track updates queue
- ✅ Real-time updates from player/kiosk

### Kiosk Endpoint
- ✅ YouTube search returns accurate results
- ✅ Stripe payment flow completes
- ✅ Request adds to priority queue
- ✅ Shows now playing and queue position
- ✅ Request confirmation displayed

---

## Risk Mitigation

### Risk 1: Master Election Conflicts
**Mitigation**: Implement server-side mutex (AppWrite function)

### Risk 2: WebSocket Connection Drops
**Mitigation**: 15s polling fallback already in place

### Risk 3: localStorage Quota Exceeded
**Mitigation**: Limit cached queue to last 100 tracks

### Risk 4: YouTube Iframe API Rate Limits
**Mitigation**: Cache video metadata locally

### Risk 5: Stripe Payment Failures
**Mitigation**: Retry logic + manual refund workflow

---

## Post-Launch Enhancements

### Phase 6: Advanced Features (Future)
- Drag-and-drop queue reordering (admin)
- Request approval workflow (admin review)
- Player settings UI (volume, crossfade duration)
- Venue onboarding wizard
- Analytics dashboard (tracks played, revenue)
- Multi-venue management (owner portal)
- Mobile app (React Native)

---

## Questions for Confirmation

1. **Approach Approval**: Do you approve adapting standalone apps into unified app?
2. **Phase Priority**: Should we start with Player, Admin, or Kiosk?
3. **Stripe Setup**: Do you have Stripe account configured?
4. **YouTube API**: Do you have YouTube Data API key?
5. **Testing Environment**: Should we create staging site for testing?
6. **Timeline**: Is 4-week timeline acceptable, or should we prioritize faster delivery?

Please review and confirm before we begin implementation! 🚀
