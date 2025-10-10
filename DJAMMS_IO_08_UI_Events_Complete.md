# DJAMMS I/O Reference: UI Events & User Interactions Complete

**Document ID**: DJAMMS_IO_08  
**Category**: BY TYPE - UI Events & User Interactions  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Table of Contents

1. [UI Events Overview](#ui-events-overview)
2. [Click Events](#click-events)
3. [Form Events](#form-events)
4. [Input Events](#input-events)
5. [Navigation Events](#navigation-events)
6. [Media Events](#media-events)
7. [Custom Events](#custom-events)
8. [Event Patterns](#event-patterns)

---

## UI Events Overview

### **React Event System**

DJAMMS uses React's **synthetic event system** for cross-browser compatibility:
- ✅ **onClick** - Button and element clicks
- ✅ **onSubmit** - Form submissions
- ✅ **onChange** - Input value changes
- ✅ **onKeyDown/onKeyUp** - Keyboard interactions
- ✅ **Custom Events** - Cross-component communication

### **Event Flow**

```
User Action → DOM Event → React Synthetic Event → Event Handler → State Update → Re-render
```

---

## Click Events

### **Button Click Handlers**

#### **Player Controls**

```tsx
// apps/admin/src/components/PlayerControls.tsx
const handlePlayPause = async () => {
  if (!currentTrack) return;

  setIsPlaying(!isPlaying);
  
  // Broadcast to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'PLAYBACK_STATE_CHANGED',
      isPlaying: !isPlaying
    });
  }
};

const handleSkip = async () => {
  try {
    // Update queue in database
    const queue = await databases.getDocument(databaseId, 'queues', queueId);
    const mainQueue = JSON.parse(queue.mainQueue || '[]');
    
    // Remove first track
    mainQueue.shift();
    
    await databases.updateDocument(databaseId, 'queues', queueId, {
      mainQueue: JSON.stringify(mainQueue),
      updatedAt: new Date().toISOString()
    });

    showToast('Track skipped', 'success');
  } catch (error) {
    console.error('Skip failed:', error);
    showToast('Failed to skip track', 'error');
  }
};

// Usage
<button onClick={handlePlayPause}>
  {isPlaying ? <Pause /> : <Play />}
</button>

<button onClick={handleSkip}>
  <SkipForward /> Skip
</button>
```

#### **Queue Management**

```tsx
// apps/admin/src/components/QueueManagement.tsx
const handleRemove = async (trackId: string) => {
  try {
    const queue = await databases.getDocument(databaseId, 'queues', queueId);
    const mainQueue = JSON.parse(queue.mainQueue || '[]');
    
    // Remove track by ID
    const updatedQueue = mainQueue.filter((t: any) => t.$id !== trackId);
    
    await databases.updateDocument(databaseId, 'queues', queueId, {
      mainQueue: JSON.stringify(updatedQueue)
    });

    showToast('Track removed from queue', 'success');
  } catch (error) {
    showToast('Failed to remove track', 'error');
  }
};

const handleClearQueue = async (isPriority: boolean) => {
  const confirm = window.confirm(
    `Clear ${isPriority ? 'priority' : 'main'} queue?`
  );
  
  if (!confirm) return;

  try {
    await databases.updateDocument(databaseId, 'queues', queueId, {
      [isPriority ? 'priorityQueue' : 'mainQueue']: JSON.stringify([])
    });

    showToast('Queue cleared', 'success');
  } catch (error) {
    showToast('Failed to clear queue', 'error');
  }
};

// Usage
<button onClick={() => handleRemove(track.$id)}>
  <X size={16} /> Remove
</button>

<button onClick={() => handleClearQueue(false)}>
  Clear Main Queue
</button>
```

#### **Navigation**

```tsx
// apps/admin/src/components/AdminView.tsx
const [activeTab, setActiveTab] = useState<'controls' | 'queue' | 'settings'>('controls');

// Tab switching
<button
  onClick={() => setActiveTab('controls')}
  className={activeTab === 'controls' ? 'active' : ''}
>
  Player Controls
</button>

<button
  onClick={() => setActiveTab('queue')}
  className={activeTab === 'queue' ? 'active' : ''}
>
  Queue Management
</button>
```

---

## Form Events

### **Search Form**

```tsx
// apps/kiosk/src/components/SearchInterface.tsx
const [searchQuery, setSearchQuery] = useState('');
const [results, setResults] = useState<SearchResult[]>([]);

const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault(); // Prevent page reload

  if (!searchQuery.trim()) return;

  try {
    const youtubeService = new YouTubeSearchService(config.youtube.apiKey);
    const response = await youtubeService.search({
      query: searchQuery,
      maxResults: 20
    });

    setResults(response.items);
  } catch (error) {
    console.error('Search failed:', error);
    showToast('Search failed. Please try again.', 'error');
  }
};

// Usage
<form onSubmit={handleSearch}>
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search for a song..."
  />
  <button type="submit">Search</button>
</form>
```

### **Settings Form**

```tsx
// apps/admin/src/components/SystemSettings.tsx
interface SettingsState {
  venueName: string;
  mode: 'FREEPLAY' | 'PAID';
  creditCost: number;
  priorityCost: number;
  youtubeApiKey: string;
}

const [settings, setSettings] = useState<SettingsState>({
  venueName: '',
  mode: 'FREEPLAY',
  creditCost: 5,
  priorityCost: 10,
  youtubeApiKey: ''
});

const handleChange = (field: keyof SettingsState, value: any) => {
  setSettings(prev => ({ ...prev, [field]: value }));
};

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await databases.updateDocument(databaseId, 'venues', venueId, {
      name: settings.venueName,
      settings: JSON.stringify(settings)
    });

    showToast('Settings saved', 'success');
  } catch (error) {
    showToast('Failed to save settings', 'error');
  }
};

// Usage
<form onSubmit={handleSave}>
  <input
    value={settings.venueName}
    onChange={(e) => handleChange('venueName', e.target.value)}
  />
  
  <select
    value={settings.mode}
    onChange={(e) => handleChange('mode', e.target.value)}
  >
    <option value="FREEPLAY">Free Play</option>
    <option value="PAID">Paid Requests</option>
  </select>

  <button type="submit">Save Settings</button>
</form>
```

---

## Input Events

### **Text Input**

```tsx
// Debounced search input
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useRef<NodeJS.Timeout>();

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchQuery(value);

  // Debounce search (wait 500ms after typing stops)
  if (debouncedSearch.current) {
    clearTimeout(debouncedSearch.current);
  }

  debouncedSearch.current = setTimeout(() => {
    performSearch(value);
  }, 500);
};

<input
  type="text"
  value={searchQuery}
  onChange={handleInputChange}
  placeholder="Search..."
/>
```

### **Range Input (Volume)**

```tsx
// apps/player/src/components/PlayerView.tsx
const [volume, setVolume] = useState(75);

const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newVolume = parseInt(e.target.value);
  setVolume(newVolume);

  // Update YouTube player volume
  if (playerRef.current) {
    playerRef.current.setVolume(newVolume);
  }

  // Store in localStorage
  localStorage.setItem('djammsVolume', newVolume.toString());
};

<input
  type="range"
  min="0"
  max="100"
  value={volume}
  onChange={handleVolumeChange}
  className="w-32"
/>
```

### **Checkbox/Toggle**

```tsx
const [autoplay, setAutoplay] = useState(true);

const handleAutoplayToggle = async () => {
  const newValue = !autoplay;
  setAutoplay(newValue);

  // Update user preferences
  try {
    await authService.updateUserPreferences(newValue);
    localStorage.setItem('djammsAutoplay', newValue.toString());
  } catch (error) {
    console.error('Failed to update autoplay:', error);
  }
};

<button onClick={handleAutoplayToggle}>
  Autoplay: {autoplay ? 'On' : 'Off'}
</button>
```

---

## Navigation Events

### **Tab Navigation**

```tsx
// apps/dashboard/src/main.tsx
type DashboardTab = 'dashboard' | 'playlistlibrary' | 'adminconsole';

const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

const handleTabChange = (tab: DashboardTab) => {
  setActiveTab(tab);
  
  // Update URL (optional)
  window.history.pushState({}, '', `/dashboard?tab=${tab}`);
};

// Navigation buttons
<button
  onClick={() => handleTabChange('dashboard')}
  className={activeTab === 'dashboard' ? 'active' : ''}
>
  Dashboard
</button>

<button
  onClick={() => handleTabChange('playlistlibrary')}
  className={activeTab === 'playlistlibrary' ? 'active' : ''}
>
  Playlist Library
</button>
```

### **Route Navigation**

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleLogout = () => {
  authService.clearSession();
  navigate('/auth');
};

const handleCardClick = (card: DashboardCard) => {
  if (card.action) {
    card.action(); // Execute action
  } else if (card.route) {
    navigate(card.route); // Navigate to route
  }
};

<button onClick={handleLogout}>Logout</button>
<div onClick={() => handleCardClick(card)}>
  {card.title}
</div>
```

### **Pagination**

```tsx
// apps/kiosk/src/components/SearchInterface.tsx
const [currentPage, setCurrentPage] = useState(1);
const [nextPageToken, setNextPageToken] = useState<string>();
const [prevPageToken, setPrevPageToken] = useState<string>();

const handleNextPage = async () => {
  if (!nextPageToken) return;

  const response = await youtubeService.search({
    query: searchQuery,
    maxResults: 20,
    pageToken: nextPageToken
  });

  setResults(response.items);
  setNextPageToken(response.nextPageToken);
  setPrevPageToken(response.prevPageToken);
  setCurrentPage(prev => prev + 1);
};

const handlePrevPage = async () => {
  if (!prevPageToken) return;

  const response = await youtubeService.search({
    query: searchQuery,
    maxResults: 20,
    pageToken: prevPageToken
  });

  setResults(response.items);
  setNextPageToken(response.nextPageToken);
  setPrevPageToken(response.prevPageToken);
  setCurrentPage(prev => prev - 1);
};

<button onClick={handlePrevPage} disabled={!prevPageToken}>
  Previous
</button>

<button onClick={handleNextPage} disabled={!nextPageToken}>
  Next
</button>
```

---

## Media Events

### **YouTube Player Events**

```tsx
// apps/player/src/components/AdvancedPlayer.tsx
const onPlayerReady = (event: YT.PlayerEvent) => {
  const player = event.target;
  setPlayerRef(player);

  // Set initial volume
  const savedVolume = localStorage.getItem('djammsVolume');
  if (savedVolume) {
    player.setVolume(parseInt(savedVolume));
  }
};

const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
  const state = event.data;

  if (state === YT.PlayerState.PLAYING) {
    setIsPlaying(true);
  } else if (state === YT.PlayerState.PAUSED) {
    setIsPlaying(false);
  } else if (state === YT.PlayerState.ENDED) {
    playNextTrack();
  }
};

const onPlayerError = (event: YT.OnErrorEvent) => {
  console.error('Player error:', event.data);

  if (event.data === 100 || event.data === 101 || event.data === 150) {
    // Video not found or not embeddable
    showToast('Video unavailable, skipping...', 'error');
    playNextTrack();
  }
};

<YouTube
  videoId={currentTrack?.videoId}
  onReady={onPlayerReady}
  onStateChange={onPlayerStateChange}
  onError={onPlayerError}
  onEnd={playNextTrack}
/>
```

---

## Custom Events

### **BroadcastChannel Events**

```tsx
// Cross-tab communication
const broadcastChannel = useRef<BroadcastChannel>();

useEffect(() => {
  broadcastChannel.current = new BroadcastChannel('djamms-sync');

  broadcastChannel.current.onmessage = (event) => {
    const { type, data } = event.data;

    switch (type) {
      case 'PLAYBACK_STATE_CHANGED':
        setIsPlaying(data.isPlaying);
        break;

      case 'TRACK_SKIPPED':
        loadNextTrack();
        break;

      case 'QUEUE_UPDATED':
        refreshQueue();
        break;

      default:
        console.log('Unknown broadcast:', type);
    }
  };

  return () => {
    broadcastChannel.current?.close();
  };
}, []);

// Send custom event
const skipTrack = () => {
  broadcastChannel.current?.postMessage({
    type: 'TRACK_SKIPPED',
    timestamp: Date.now()
  });
};
```

### **Window Events**

```tsx
// Crossfade trigger event
useEffect(() => {
  const handleCrossfade = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.nextTrack) {
      startCrossfade(customEvent.detail.nextTrack);
    }
  };

  window.addEventListener('startCrossfade', handleCrossfade);
  
  return () => {
    window.removeEventListener('startCrossfade', handleCrossfade);
  };
}, []);

// Trigger crossfade
const triggerCrossfade = (nextTrack: Track) => {
  window.dispatchEvent(new CustomEvent('startCrossfade', {
    detail: { nextTrack }
  }));
};
```

### **AppWrite Realtime Events**

```tsx
// Subscribe to queue updates
useEffect(() => {
  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.queues.documents.${queueId}`,
    (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        const updatedQueue = response.payload;
        setQueue(updatedQueue);
      }
    }
  );

  return () => {
    unsubscribe();
  };
}, [queueId]);
```

---

## Event Patterns

### **Event Handler Pattern**

```tsx
// Standard event handler
const handleEvent = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Handle event
  performAction();
};
```

### **Async Event Handler**

```tsx
const handleAsyncEvent = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);
    const result = await performAsyncOperation();
    showToast('Success!', 'success');
  } catch (error) {
    console.error('Operation failed:', error);
    showToast('Failed', 'error');
  } finally {
    setLoading(false);
  }
};
```

### **Debounced Event Handler**

```tsx
import { useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useCallback(
  debounce((query: string) => {
    performSearch(query);
  }, 500),
  []
);

const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchQuery(value);
  debouncedSearch(value);
};
```

### **Throttled Event Handler**

```tsx
import { useCallback } from 'react';
import { throttle } from 'lodash';

const throttledHeartbeat = useCallback(
  throttle(() => {
    sendHeartbeat();
  }, 30000), // Max once per 30 seconds
  []
);

useEffect(() => {
  const interval = setInterval(throttledHeartbeat, 30000);
  return () => clearInterval(interval);
}, []);
```

### **Conditional Event Handler**

```tsx
const handleConditionalClick = (item: Item) => {
  if (!isAuthenticated) {
    showToast('Please log in first', 'warning');
    navigate('/auth');
    return;
  }

  if (!hasPermission('admin')) {
    showToast('Access denied', 'error');
    return;
  }

  performAction(item);
};
```

### **Event Delegation Pattern**

```tsx
// Handle multiple items with one handler
const handleQueueItemClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const target = e.target as HTMLElement;
  const trackElement = target.closest('[data-track-id]');
  
  if (trackElement) {
    const trackId = trackElement.getAttribute('data-track-id');
    selectTrack(trackId);
  }
};

<div onClick={handleQueueItemClick}>
  {tracks.map(track => (
    <div key={track.id} data-track-id={track.id}>
      {track.title}
    </div>
  ))}
</div>
```

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   DOM Event (Browser)                       │
│  • click, submit, change, keydown, etc.                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             React Synthetic Event System                    │
│  • Cross-browser normalization                              │
│  • Event pooling for performance                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Event Handler                             │
│  • onClick={handleClick}                                    │
│  • onSubmit={handleSubmit}                                  │
│  • onChange={handleChange}                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic                             │
│  • Validation                                               │
│  • API calls                                                │
│  • State updates                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Update                              │
│  • setState()                                               │
│  • Context update                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Component Re-render                        │
│  • Virtual DOM diff                                         │
│  • DOM updates                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Side Effects                              │
│  • BroadcastChannel messages                                │
│  • localStorage updates                                     │
│  • Custom events                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- 📄 **DJAMMS_IO_04_State_Management_Complete.md** - React hooks and state updates
- 📄 **DJAMMS_IO_Endpoint_04_Player.md** - Player UI interactions
- 📄 **DJAMMS_IO_Endpoint_05_Admin.md** - Admin dashboard events
- 📄 **DJAMMS_IO_Endpoint_06_Kiosk.md** - Kiosk search and request events

---

**END OF DOCUMENT**
