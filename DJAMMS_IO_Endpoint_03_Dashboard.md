# DJAMMS I/O Reference: Dashboard Endpoint

**Document ID**: DJAMMS_IO_Endpoint_03  
**Category**: BY ENDPOINT - Dashboard  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: Central hub for authenticated users to access all DJAMMS features  
**URL**: `https://dashboard.djamms.app/:userId` | `http://localhost:3003/:userId`  
**Technology**: React 18 + TypeScript + Vite + AppWrite  
**Authentication**: Required (JWT token)

---

## I/O Summary

### **Inputs**
- ✅ **User ID** (URL parameter)
- ✅ **JWT token** (localStorage)
- ✅ **Tab selections** (UI state)
- ✅ **Card clicks** (navigation triggers)

### **Outputs**
- ✅ **Dashboard cards** (feature navigation)
- ✅ **Tab content** (queue manager, playlist library, admin console)
- ✅ **Player status** (connected/disconnected, playing/paused/idle)
- ✅ **User info display** (email, role)

### **Database Operations**
- ✅ **READ** user document (get user details)
- ✅ **READ** venues document (if user has venueId)
- ✅ **READ** players document (check player status)

### **Navigation**
- ✅ **Open player** (`/player/:venueId` in new window)
- ✅ **Switch tabs** (internal routing)
- ✅ **Logout** (clear session, redirect to auth)

---

## Features

### **1. Dashboard Tab**

**Purpose**: Main landing page with feature cards

```tsx
const dashboardCards: DashboardCard[] = [
  {
    id: 'videoplayer',
    title: 'Start Video Player',
    description: 'Open fullscreen YouTube video player window',
    action: () => window.open('/player', '_blank', 'width=1280,height=720')
  },
  {
    id: 'queuemanager',
    title: 'Queue Manager',
    description: 'Manage the current song queue and playback order',
    action: () => setActiveTab('queuemanager')
  },
  {
    id: 'playlistlibrary',
    title: 'Playlist Library',
    description: 'Browse and manage your music playlists',
    action: () => setActiveTab('playlistlibrary')
  },
  {
    id: 'adminconsole',
    title: 'Admin Console',
    description: 'System settings and administrative controls',
    action: () => setActiveTab('adminconsole')
  }
];
```

### **2. Queue Manager Tab**

**Features**:
- View current queue
- View recently played tracks
- (Future: Reorder, remove tracks)

### **3. Playlist Library Tab**

**Features**:
- My playlists
- Shared playlists
- Favorites
- (Future: Create, edit, delete playlists)

### **4. Admin Console Tab**

**Features**:
- System status
- Player settings
- User management
- (Future: Full admin controls)

---

## Player Status Display

```tsx
const getStatusDisplay = () => {
  const { status, connectionStatus } = playerStatus;
  
  switch (status) {
    case 'playing':
      return { 
        icon: Circle, 
        text: 'CONNECTED, PLAYING', 
        className: 'text-green-500' 
      };
    case 'paused':
      return { 
        icon: Clock, 
        text: 'CONNECTED, PAUSED', 
        className: 'text-yellow-500' 
      };
    case 'idle':
      return { 
        icon: AlertTriangle, 
        text: 'IDLE - NO CONTENT QUEUED', 
        className: 'text-orange-500' 
      };
    default:
      return { 
        icon: WifiOff, 
        text: 'DISCONNECTED', 
        className: 'text-red-500' 
      };
  }
};
```

---

## Authentication Check

```tsx
useEffect(() => {
  const checkAuth = async () => {
    const session = authService.getCurrentSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUser(session.user);
  };

  checkAuth();
}, []);
```

---

## Related Documents

- 📄 **DJAMMS_IO_05_Auth_Complete.md** - Authentication
- 📄 **DJAMMS_IO_Endpoint_04_Player.md** - Player window
- 📄 **DJAMMS_IO_Endpoint_05_Admin.md** - Admin console

---

**END OF DOCUMENT**
