# DJAMMS I/O Reference: Player Endpoint

**Document ID**: DJAMMS_IO_Endpoint_04  
**Category**: BY ENDPOINT - Player  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: Fullscreen YouTube video player with master election  
**URL**: `https://player.djamms.app/:venueId` | `http://localhost:3004/:venueId`  
**Technology**: React 18 + YouTube IFrame API + AppWrite Realtime  
**Authentication**: Optional (public player view)

---

## I/O Summary

### **Inputs**
- ✅ **Venue ID** (URL parameter)
- ✅ **Device ID** (generated fingerprint)
- ✅ **User actions** (autoplay toggle, skip button)

### **Outputs**
- ✅ **Video playback** (YouTube IFrame)
- ✅ **Queue display** (next 5 tracks)
- ✅ **Player status** (isMaster, currentTrack, isPlaying)

### **Database Operations**
- ✅ **CREATE/UPDATE** players document (master registration)
- ✅ **READ** queues document (get current queue)
- ✅ **UPDATE** queues document (skip track)
- ✅ **REALTIME** subscribe to queue updates

### **API Communications**
- ✅ **POST** to player-registry function (register as master)
- ✅ **POST** to player-registry function (heartbeat every 30s)
- ✅ **YouTube IFrame API** (playback control)

---

## Master Election Flow

```tsx
const registerAsMaster = async () => {
  try {
    const result = await playerRegistryService.register(venueId, deviceId);

    if (result.status === 'registered' || result.status === 'reconnected') {
      setIsMaster(true);
      startHeartbeat();
    } else if (result.status === 'conflict') {
      setIsMaster(false);
      showBusyScreen();
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

---

## Dual YouTube Player (Crossfading)

```tsx
<YouTube
  videoId={currentTrack?.videoId}
  onReady={onPlayerReady}
  onEnd={playNextTrack}
  iframeClassName="absolute top-0 left-0 w-full h-full"
/>

<YouTube
  opts={{ playerVars: { autoplay: 0 } }}
  onReady={onSecondaryPlayerReady}
  style={{ display: 'none' }}
/>
```

---

## Heartbeat System

```tsx
useEffect(() => {
  if (!isMaster) return;

  const interval = setInterval(() => {
    playerRegistryService.heartbeat(venueId, deviceId);
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, [isMaster]);
```

---

## Queue Sync

```tsx
useEffect(() => {
  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.queues.documents.${queueId}`,
    (response) => {
      if (response.events.includes('update')) {
        const queue = JSON.parse(response.payload.mainQueue);
        setMainQueue(queue);
      }
    }
  );

  return () => unsubscribe();
}, [queueId]);
```

---

## Related Documents

- 📄 **DJAMMS_IO_03_Realtime_Sync_Complete.md** - Real-time updates
- 📄 **DJAMMS_IO_06_External_APIs_Complete.md** - YouTube IFrame API
- 📄 **DJAMMS_IO_07_Cloud_Functions_Complete.md** - player-registry function

---

**END OF DOCUMENT**
