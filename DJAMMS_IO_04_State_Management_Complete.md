# DJAMMS I/O Reference: State Management Complete

**Document ID**: DJAMMS_IO_04  
**Category**: BY TYPE - State Management  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Table of Contents

1. [State Management Overview](#state-management-overview)
2. [React Hooks Architecture](#react-hooks-architecture)
3. [Custom Hooks](#custom-hooks)
4. [AppWrite Context Provider](#appwrite-context-provider)
5. [State Update Patterns](#state-update-patterns)
6. [Optimistic UI Updates](#optimistic-ui-updates)
7. [State Persistence](#state-persistence)
8. [Performance Optimization](#performance-optimization)

---

## State Management Overview

### **Architecture**
DJAMMS uses **React Hooks** for state management with:
- ✅ **No Redux** (hooks-first architecture)
- ✅ **Context API** for global state (AppWrite client, auth)
- ✅ **Custom hooks** for complex logic (player, queue, sync)
- ✅ **localStorage** for persistence

### **State Categories**

| Category | Scope | Storage | Persistence |
|----------|-------|---------|-------------|
| **UI State** | Component-local | React state | Memory only |
| **Application State** | App-wide | Context + hooks | localStorage |
| **Server State** | Synchronized | AppWrite DB | Database |
| **Session State** | User session | localStorage | 7 days |

### **State Flow Architecture**

```
User Action
    ↓
Component Handler
    ↓
Custom Hook (usePlayerManager, etc.)
    ↓
├─→ Update React State (immediate UI)
├─→ Update localStorage (persist)
└─→ Update AppWrite DB (sync)
        ↓
    Realtime Event
        ↓
    Update other devices
```

---

## React Hooks Architecture

### **Core React Hooks Usage**

#### **useState - Component State**

```typescript
// Simple state
const [isPlaying, setIsPlaying] = useState<boolean>(false);
const [volume, setVolume] = useState<number>(100);

// Complex state with type
interface QueueState {
  venueId: string;
  nowPlaying?: Track;
  mainQueue: Track[];
  priorityQueue: Track[];
}

const [queueState, setQueueState] = useState<QueueState>({
  venueId: '',
  mainQueue: [],
  priorityQueue: []
});
```

**Example - Player State**:
```typescript
// apps/player/src/hooks/usePlayerManager.ts
const [playerState, setPlayerState] = useState<PlayerState>();
const [isMaster, setIsMaster] = useState<boolean | null>(null);
const [currentTrack, setCurrentTrack] = useState<Track>();
const [error, setError] = useState<string>();
```

---

#### **useEffect - Side Effects**

```typescript
// Run on mount
useEffect(() => {
  initializePlayer();
}, []); // Empty deps = mount only

// Run when venueId changes
useEffect(() => {
  loadQueue(venueId);
}, [venueId]);

// Run when isMaster changes
useEffect(() => {
  if (isMaster) {
    startHeartbeat();
  } else {
    stopHeartbeat();
  }
  
  return () => {
    // Cleanup on unmount or before next effect
    stopHeartbeat();
  };
}, [isMaster]);
```

**Example - Realtime Subscription**:
```typescript
// apps/player/src/hooks/usePlayerManager.ts
useEffect(() => {
  if (!isMaster) return;

  const channelName = `databases.${config.appwrite.databaseId}.collections.queues.documents`;
  
  const unsubscribe = client.subscribe(channelName, (response) => {
    if (response.payload?.venueId === venueId) {
      setPlayerState(response.payload);
      setCurrentTrack(response.payload.nowPlaying);
    }
  });

  return () => unsubscribe(); // Cleanup
}, [isMaster, venueId, client]);
```

---

#### **useCallback - Memoized Functions**

```typescript
// Prevent unnecessary re-renders when passing callbacks to child components
const handleSkipTrack = useCallback(async () => {
  if (!playerState) return;

  const nextTrack = getNextTrack(playerState);
  
  await databases.updateDocument(
    config.appwrite.databaseId,
    'queues',
    queueId,
    {
      nowPlaying: JSON.stringify(nextTrack),
      updatedAt: new Date().toISOString()
    }
  );
}, [playerState, databases, queueId]);

// Pass to child without causing re-render on every parent render
<SkipButton onClick={handleSkipTrack} />
```

**Example - Track Progression**:
```typescript
const playNextTrack = useCallback(async () => {
  if (!playerState || !isMaster) return;

  const nextTrack = playerState.priorityQueue[0] || playerState.mainQueue[0];
  
  if (!nextTrack) return;

  // Update nowPlaying
  const updatedState = {
    ...playerState,
    nowPlaying: {
      ...nextTrack,
      startTime: Date.now(),
      remaining: nextTrack.duration
    }
  };

  // Optimistic update
  setPlayerState(updatedState);
  setCurrentTrack(updatedState.nowPlaying);

  // Sync to server
  await databases.updateDocument(
    config.appwrite.databaseId,
    'queues',
    queueId,
    {
      nowPlaying: JSON.stringify(updatedState.nowPlaying),
      updatedAt: new Date().toISOString()
    }
  );
}, [playerState, isMaster, databases, queueId]);
```

---

#### **useMemo - Memoized Values**

```typescript
// Expensive computation, only recalculate when dependencies change
const queueStatistics = useMemo(() => {
  if (!playerState) return null;

  return {
    totalTracks: playerState.mainQueue.length + playerState.priorityQueue.length,
    totalDuration: [...playerState.mainQueue, ...playerState.priorityQueue]
      .reduce((sum, track) => sum + track.duration, 0),
    paidRequests: playerState.priorityQueue.length,
    nextTrack: playerState.priorityQueue[0] || playerState.mainQueue[0]
  };
}, [playerState]);
```

**Example - AppWrite Client**:
```typescript
// packages/appwrite-client/src/AppwriteContext.tsx
export const AppwriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useMemo(() => 
    new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId),
    [] // Never recreate (config is static)
  );

  const databases = useMemo(() => new Databases(client), [client]);
  const account = useMemo(() => new Account(client), [client]);

  return (
    <AppwriteContext.Provider value={{ client, databases, account }}>
      {children}
    </AppwriteContext.Provider>
  );
};
```

---

#### **useRef - Persistent Values & DOM References**

```typescript
// Store values that don't trigger re-renders
const playerRegistry = useRef(new PlayerRegistry());
const realtimeSubscription = useRef<(() => void) | null>(null);
const pollingInterval = useRef<NodeJS.Timeout>();

// Access current value
playerRegistry.current.requestMasterPlayer(venueId, token);

// DOM reference
const videoRef = useRef<HTMLIFrameElement>(null);
useEffect(() => {
  if (videoRef.current) {
    // Access iframe DOM
  }
}, []);
```

**Example - YouTube Player References**:
```typescript
// apps/player/src/components/AdvancedPlayer.tsx
const primaryPlayerRef = useRef<any>(null);
const secondaryPlayerRef = useRef<any>(null);

const onPlayerReady = (player: any, isPrimary: boolean) => {
  if (isPrimary) {
    primaryPlayerRef.current = player.target;
  } else {
    secondaryPlayerRef.current = player.target;
  }
};

const startCrossfade = () => {
  const primary = primaryPlayerRef.current;
  const secondary = secondaryPlayerRef.current;
  
  if (!primary || !secondary) return;

  // Fade out primary, fade in secondary
  let elapsed = 0;
  const fadeInterval = setInterval(() => {
    elapsed += 100;
    const progress = elapsed / 5000; // 5 second fade

    primary.setVolume(100 * (1 - progress));
    secondary.setVolume(100 * progress);

    if (elapsed >= 5000) {
      clearInterval(fadeInterval);
      // Swap players
      swapPlayers();
    }
  }, 100);
};
```

---

#### **useContext - Access Context**

```typescript
// Define context
interface AppwriteContextType {
  client: Client;
  databases: Databases;
  account: Account;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined);

// Custom hook to use context
export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) {
    throw new Error('useAppwrite must be used within AppwriteProvider');
  }
  return context;
};

// Usage in components
const MyComponent = () => {
  const { databases, account } = useAppwrite();
  
  const fetchData = async () => {
    const docs = await databases.listDocuments(...);
  };
};
```

---

## Custom Hooks

### **usePlayerManager**

**Purpose**: Manage player state, master election, and queue synchronization.

**Location**: `apps/player/src/hooks/usePlayerManager.ts`

```typescript
export const usePlayerManager = (venueId: string) => {
  const [playerState, setPlayerState] = useState<PlayerState>();
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track>();
  const [error, setError] = useState<string>();
  
  const { auth, databases, client } = useAppwrite();
  const playerRegistry = useRef(new PlayerRegistry());
  const realtimeSubscription = useRef<(() => void) | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout>();

  // Initialize on mount
  useEffect(() => {
    initializePlayer();
    return () => cleanup();
  }, [venueId]);

  const initializePlayer = async () => {
    const session = await auth.getCurrentSession();
    if (!session) {
      setIsMaster(false);
      setError('Authentication required');
      return;
    }

    const result = await playerRegistry.current.requestMasterPlayer(
      venueId,
      session.token
    );

    setIsMaster(result.success);

    if (result.success) {
      await loadQueue();
      startRealtimeSubscription();
      startPolling();
    }
  };

  const playNextTrack = useCallback(async () => {
    // Implementation...
  }, [playerState, isMaster]);

  const skipTrack = useCallback(async () => {
    // Implementation...
  }, [playerState]);

  return {
    playerState,
    isMaster,
    currentTrack,
    error,
    playNextTrack,
    skipTrack
  };
};
```

**Usage**:
```typescript
const PlayerView = () => {
  const { venueId } = useParams();
  const {
    playerState,
    isMaster,
    currentTrack,
    playNextTrack,
    skipTrack
  } = usePlayerManager(venueId);

  if (!isMaster) {
    return <PlayerBusyScreen />;
  }

  return (
    <div>
      <AdvancedPlayer
        track={currentTrack}
        onTrackEnd={playNextTrack}
      />
      <button onClick={skipTrack}>Skip</button>
    </div>
  );
};
```

---

### **useAuth (Custom Authentication Hook)**

**Purpose**: Manage authentication state and session.

```typescript
// packages/appwrite-client/src/hooks/useAuth.ts
export const useAuth = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = useRef(new AuthService());

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    const currentSession = await authService.current.getCurrentSession();
    setSession(currentSession);
    setLoading(false);
  };

  const login = async (email: string, redirectUrl: string) => {
    await authService.current.sendMagicLink(email, redirectUrl);
  };

  const handleCallback = async (secret: string, userId: string) => {
    const newSession = await authService.current.handleMagicLinkCallback(secret, userId);
    setSession(newSession);
    return newSession;
  };

  const logout = () => {
    authService.current.clearSession();
    setSession(null);
  };

  return {
    session,
    loading,
    isAuthenticated: !!session,
    login,
    handleCallback,
    logout
  };
};
```

**Usage**:
```typescript
const AuthPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, '/dashboard');
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Send Magic Link</button>
    </form>
  );
};
```

---

### **useQueueManager (Admin/Kiosk)**

**Purpose**: Manage queue operations (skip, remove, add).

```typescript
export const useQueueManager = (venueId: string) => {
  const [queue, setQueue] = useState<QueueState>();
  const { databases } = useAppwrite();

  useEffect(() => {
    loadQueue();
    subscribeToUpdates();
  }, [venueId]);

  const loadQueue = async () => {
    const docs = await databases.listDocuments(
      config.appwrite.databaseId,
      'queues',
      [Query.equal('venueId', venueId)]
    );
    setQueue(parseQueueDocument(docs.documents[0]));
  };

  const skipTrack = useCallback(async () => {
    if (!queue) return;

    const nextTrack = queue.priorityQueue[0] || queue.mainQueue[0];
    
    await databases.updateDocument(
      config.appwrite.databaseId,
      'queues',
      queue.$id,
      {
        nowPlaying: JSON.stringify(nextTrack),
        priorityQueue: JSON.stringify(queue.priorityQueue.slice(1)),
        updatedAt: new Date().toISOString()
      }
    );
  }, [queue, databases]);

  const removeTrack = useCallback(async (trackId: string, fromPriority: boolean) => {
    if (!queue) return;

    const targetQueue = fromPriority ? queue.priorityQueue : queue.mainQueue;
    const updated = targetQueue.filter(t => t.videoId !== trackId);

    await databases.updateDocument(
      config.appwrite.databaseId,
      'queues',
      queue.$id,
      {
        [fromPriority ? 'priorityQueue' : 'mainQueue']: JSON.stringify(updated),
        updatedAt: new Date().toISOString()
      }
    );
  }, [queue, databases]);

  const addRequest = useCallback(async (track: Track, paymentId: string) => {
    if (!queue) return;

    const updated = [...queue.priorityQueue, { ...track, paymentId }];

    await databases.updateDocument(
      config.appwrite.databaseId,
      'queues',
      queue.$id,
      {
        priorityQueue: JSON.stringify(updated),
        updatedAt: new Date().toISOString()
      }
    );
  }, [queue, databases]);

  return {
    queue,
    skipTrack,
    removeTrack,
    addRequest
  };
};
```

---

## AppWrite Context Provider

### **Context Definition**

```typescript
// packages/appwrite-client/src/AppwriteContext.tsx
import { createContext, useContext, useMemo } from 'react';
import { Client, Databases, Account } from 'appwrite';
import { config } from '@shared/config/env';

interface AppwriteContextType {
  client: Client;
  databases: Databases;
  account: Account;
  auth: AuthService;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined);

export const AppwriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useMemo(() => 
    new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId),
    []
  );

  const databases = useMemo(() => new Databases(client), [client]);
  const account = useMemo(() => new Account(client), [client]);
  const auth = useMemo(() => new AuthService(), []);

  const value = useMemo(
    () => ({ client, databases, account, auth }),
    [client, databases, account, auth]
  );

  return (
    <AppwriteContext.Provider value={value}>
      {children}
    </AppwriteContext.Provider>
  );
};

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) {
    throw new Error('useAppwrite must be used within AppwriteProvider');
  }
  return context;
};
```

### **App-Level Setup**

```typescript
// apps/player/src/main.tsx
import { AppwriteProvider } from '@appwrite/AppwriteContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppwriteProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/player/:venueId" element={<PlayerView />} />
        </Routes>
      </BrowserRouter>
    </AppwriteProvider>
  </React.StrictMode>
);
```

---

## State Update Patterns

### **Pattern 1: Optimistic Updates**

Update UI immediately, sync to server in background.

```typescript
const handleSkipTrack = async () => {
  // 1. Optimistic update (instant UI)
  const nextTrack = getNextTrack(playerState);
  setCurrentTrack(nextTrack);
  
  try {
    // 2. Sync to server (background)
    await databases.updateDocument(
      config.appwrite.databaseId,
      'queues',
      queueId,
      { nowPlaying: JSON.stringify(nextTrack) }
    );
  } catch (error) {
    // 3. Revert on error
    setCurrentTrack(previousTrack);
    toast.error('Failed to skip track');
  }
};
```

### **Pattern 2: Server-First Updates**

Wait for server confirmation before updating UI.

```typescript
const handleAddRequest = async (track: Track) => {
  setLoading(true);
  
  try {
    const response = await databases.updateDocument(
      config.appwrite.databaseId,
      'queues',
      queueId,
      { priorityQueue: JSON.stringify([...queue.priorityQueue, track]) }
    );
    
    // Update UI after server confirms
    setQueue(response);
    toast.success('Request added');
  } catch (error) {
    toast.error('Failed to add request');
  } finally {
    setLoading(false);
  }
};
```

### **Pattern 3: Batch Updates**

Debounce rapid updates to reduce API calls.

```typescript
import { debounce } from 'lodash';

// Create debounced function
const debouncedSync = useCallback(
  debounce(async (newState: QueueState) => {
    await databases.updateDocument(
      config.appwrite.databaseId,
      'queues',
      queueId,
      { mainQueue: JSON.stringify(newState.mainQueue) }
    );
  }, 1000), // Wait 1s after last change
  [databases, queueId]
);

// Update UI immediately, sync after 1s of inactivity
const reorderQueue = (newOrder: Track[]) => {
  const newState = { ...playerState, mainQueue: newOrder };
  setPlayerState(newState);
  debouncedSync(newState);
};
```

---

## Optimistic UI Updates

### **Implementation**

```typescript
interface OptimisticUpdate<T> {
  id: string;
  optimisticData: T;
  serverData?: T;
  status: 'pending' | 'confirmed' | 'failed';
}

const useOptimisticUpdates = <T,>() => {
  const [updates, setUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map());

  const addOptimistic = (id: string, data: T) => {
    setUpdates(prev => new Map(prev).set(id, {
      id,
      optimisticData: data,
      status: 'pending'
    }));
  };

  const confirm = (id: string, serverData: T) => {
    setUpdates(prev => {
      const update = prev.get(id);
      if (!update) return prev;
      
      return new Map(prev).set(id, {
        ...update,
        serverData,
        status: 'confirmed'
      });
    });
  };

  const fail = (id: string) => {
    setUpdates(prev => {
      const update = prev.get(id);
      if (!update) return prev;
      
      return new Map(prev).set(id, {
        ...update,
        status: 'failed'
      });
    });
  };

  return { updates, addOptimistic, confirm, fail };
};
```

**Usage**:
```typescript
const { updates, addOptimistic, confirm, fail } = useOptimisticUpdates<Track>();

const skipTrack = async () => {
  const updateId = `skip-${Date.now()}`;
  const nextTrack = getNextTrack();

  // Optimistic update
  addOptimistic(updateId, nextTrack);
  setCurrentTrack(nextTrack);

  try {
    const result = await databases.updateDocument(...);
    confirm(updateId, result.nowPlaying);
  } catch (error) {
    fail(updateId);
    // Revert UI
    setCurrentTrack(previousTrack);
  }
};
```

---

## State Persistence

### **localStorage Strategy**

```typescript
// Save state
const persistState = (key: string, state: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data: state,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
};

// Load state with expiry
const loadPersistedState = <T,>(key: string, maxAge: number = 5 * 60 * 1000): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return null;
  }
};
```

---

## Performance Optimization

### **Optimization Techniques**

| Technique | Purpose | Example |
|-----------|---------|---------|
| `useMemo` | Cache computed values | Queue statistics |
| `useCallback` | Prevent function recreation | Event handlers |
| `React.memo` | Prevent component re-renders | TrackListItem |
| Debouncing | Batch rapid updates | Search, drag-drop |
| Throttling | Limit update frequency | Scroll, resize |
| Code splitting | Reduce bundle size | Lazy load routes |

### **Component Memoization**

```typescript
// Prevent re-render unless props change
const TrackListItem = React.memo<{ track: Track; onRemove: (id: string) => void }>(
  ({ track, onRemove }) => {
    return (
      <div>
        <span>{track.title}</span>
        <button onClick={() => onRemove(track.videoId)}>Remove</button>
      </div>
    );
  },
  // Custom comparison (optional)
  (prevProps, nextProps) => {
    return prevProps.track.videoId === nextProps.track.videoId;
  }
);
```

---

## Related Documents

- 📄 **DJAMMS_IO_03_Realtime_Sync_Complete.md** - Sync integration
- 📄 **DJAMMS_IO_02_API_Communications_Complete.md** - API calls
- 📄 **DJAMMS_IO_Endpoint_04_Player.md** - Player implementation

---

**END OF DOCUMENT**
