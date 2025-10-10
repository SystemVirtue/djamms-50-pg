# DJAMMS I/O Reference: Landing Page Endpoint

**Document ID**: DJAMMS_IO_Endpoint_01  
**Category**: BY ENDPOINT - Landing Page  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: Public marketing page showcasing DJAMMS features  
**URL**: `https://www.djamms.app` (production) | `http://localhost:3001` (dev)  
**Technology**: React 18 + TypeScript + Vite  
**Authentication**: None required (public page)

---

## I/O Summary

### **Inputs**
- ❌ **No user data inputs** (static marketing page)
- ✅ **Environment variables** (AUTH_URL)

### **Outputs**
- ✅ **Static HTML/CSS** rendering
- ✅ **Navigation links** to auth endpoint

### **External Communications**
- ✅ **Redirects to auth.djamms.app** for login

---

## Component Structure

```tsx
// apps/landing/src/main.tsx
function App() {
  const authUrl = import.meta.env.PROD 
    ? 'https://auth.djamms.app' 
    : 'http://localhost:3002';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav>
        <h1>DJAMMS</h1>
        <a href={authUrl}>Login</a>
      </nav>

      {/* Hero Section */}
      <main>
        <h2>YouTube-Based Music Player</h2>
        <p>Professional music queue management for bars and venues</p>
        <a href={authUrl}>Log in to DJAMMS</a>
      </main>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard title="Master Player System" icon="🎵" />
        <FeatureCard title="Real-time Sync" icon="⚡" />
        <FeatureCard title="Paid Requests" icon="💳" />
      </div>
    </div>
  );
}
```

---

## Features Showcased

### **1. Master Player System**
- Single active player per venue
- Automatic failover
- Heartbeat monitoring

### **2. Real-time Sync**
- Live queue updates
- Cross-device synchronization
- AppWrite Realtime API

### **3. Paid Requests**
- Priority queue
- Stripe payment integration
- Monetization for venues

---

## Environment Configuration

```bash
# .env
VITE_AUTH_URL=https://auth.djamms.app
```

---

## Related Documents

- 📄 **DJAMMS_IO_Endpoint_02_Auth.md** - Authentication endpoint (login destination)

---

**END OF DOCUMENT**
