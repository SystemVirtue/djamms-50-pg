# DJAMMS I/O Reference: Admin Endpoint

**Document ID**: DJAMMS_IO_Endpoint_05  
**Category**: BY ENDPOINT - Admin  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: Venue management console for staff/admin users  
**URL**: `https://admin.djamms.app/:venueId` | `http://localhost:3005/:venueId`  
**Technology**: React 18 + TypeScript + AppWrite  
**Authentication**: Required (staff/admin role)

---

## I/O Summary

### **Inputs**
- ✅ **Venue ID** (URL parameter)
- ✅ **Player controls** (play/pause, skip, volume)
- ✅ **Queue actions** (remove track, clear queue)
- ✅ **Settings** (venue name, mode, pricing)

### **Outputs**
- ✅ **Current track display**
- ✅ **Queue visualization** (main + priority)
- ✅ **System settings form**

### **Database Operations**
- ✅ **READ** venues document
- ✅ **UPDATE** venues document (settings)
- ✅ **READ** queues document
- ✅ **UPDATE** queues document (skip, remove, clear)
- ✅ **REALTIME** subscribe to queue updates

---

## Tabs

### **1. Player Controls**
- Current track info
- Play/pause/skip buttons
- Volume slider
- Progress bar

### **2. Queue Management**
- Main queue display
- Priority queue display
- Remove track button
- Clear queue buttons

### **3. System Settings**
- Venue name
- Mode (FREEPLAY/PAID)
- Credit pricing
- YouTube API key

---

## Player Controls

```tsx
const handleSkip = async () => {
  const queue = await databases.getDocument(databaseId, 'queues', queueId);
  const mainQueue = JSON.parse(queue.mainQueue || '[]');
  
  mainQueue.shift();
  
  await databases.updateDocument(databaseId, 'queues', queueId, {
    mainQueue: JSON.stringify(mainQueue)
  });

  showToast('Track skipped', 'success');
};
```

---

## Queue Management

```tsx
const handleRemove = async (trackId: string) => {
  const queue = await databases.getDocument(databaseId, 'queues', queueId);
  const mainQueue = JSON.parse(queue.mainQueue || '[]');
  
  const updatedQueue = mainQueue.filter((t: any) => t.$id !== trackId);
  
  await databases.updateDocument(databaseId, 'queues', queueId, {
    mainQueue: JSON.stringify(updatedQueue)
  });
};

const handleClearQueue = async (isPriority: boolean) => {
  await databases.updateDocument(databaseId, 'queues', queueId, {
    [isPriority ? 'priorityQueue' : 'mainQueue']: JSON.stringify([])
  });
};
```

---

## Settings Management

```tsx
const handleSave = async () => {
  await databases.updateDocument(databaseId, 'venues', venueId, {
    name: settings.venueName,
    settings: JSON.stringify(settings)
  });

  showToast('Settings saved', 'success');
};
```

---

## Related Documents

- 📄 **DJAMMS_IO_01_Database_Schema_Complete.md** - venues, queues collections
- 📄 **DJAMMS_IO_08_UI_Events_Complete.md** - Event handlers

---

**END OF DOCUMENT**
