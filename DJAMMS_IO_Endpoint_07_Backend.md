# DJAMMS I/O Reference: Backend Services

**Document ID**: DJAMMS_IO_Endpoint_07  
**Category**: BY ENDPOINT - Backend  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: AppWrite backend services and Cloud Functions  
**Provider**: AppWrite Cloud (Sydney region)  
**Database**: NoSQL (AppWrite Databases)  
**Functions**: Node.js 18 serverless

---

## Services

### **1. AppWrite Databases**

**8 Collections**:
- users
- venues
- queues
- players
- magicLinks
- playlists
- requests
- payments (planned)

### **2. AppWrite Realtime**

**Subscriptions**:
- Queue updates
- Player status
- Request notifications

### **3. Cloud Functions**

**5 Functions**:
- magic-link (auth)
- player-registry (master election)
- processRequest (paid requests)
- addSongToPlaylist (FFmpeg)
- nightlyBatch (scheduled)

---

## Database Schema Summary

| Collection | Documents | Purpose |
|------------|-----------|---------|
| **users** | ~100s | User accounts |
| **venues** | ~10s | Venue configurations |
| **queues** | ~10s | Playback state |
| **players** | ~20s | Master player tracking |
| **magicLinks** | ~1000s | Auth tokens (15min TTL) |
| **playlists** | ~50s | Song collections |
| **requests** | ~1000s | Song request history |

---

## API Endpoints

### **Database API**

```
POST   /v1/databases/{databaseId}/collections/{collectionId}/documents
GET    /v1/databases/{databaseId}/collections/{collectionId}/documents
GET    /v1/databases/{databaseId}/collections/{collectionId}/documents/{documentId}
PATCH  /v1/databases/{databaseId}/collections/{collectionId}/documents/{documentId}
DELETE /v1/databases/{databaseId}/collections/{collectionId}/documents/{documentId}
```

### **Realtime API**

```
WebSocket: wss://syd.cloud.appwrite.io/v1/realtime
Channels: databases.{dbId}.collections.{collectionId}.documents.{documentId}
```

### **Functions API**

```
POST /v1/functions/{functionId}/executions
GET  /v1/functions/{functionId}/executions/{executionId}
```

---

## Performance Metrics

### **Database Operations**

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| **listDocuments** | 50ms | 120ms | 250ms |
| **getDocument** | 30ms | 80ms | 150ms |
| **createDocument** | 80ms | 180ms | 350ms |
| **updateDocument** | 70ms | 160ms | 320ms |
| **deleteDocument** | 60ms | 140ms | 280ms |

### **Realtime Updates**

| Metric | Value |
|--------|-------|
| **Connection latency** | 200-500ms |
| **Update propagation** | 100-300ms |
| **Max connections** | 1000/project |

### **Cloud Functions**

| Function | Timeout | Avg Duration |
|----------|---------|-------------|
| **magic-link** | 15s | 2-5s |
| **player-registry** | 15s | 0.5-1s |
| **processRequest** | 15s | 1-3s |
| **addSongToPlaylist** | 30s | 10-20s |
| **nightlyBatch** | 900s | 300-600s |

---

## Rate Limits

### **Database**

- **Reads**: 60/min per IP
- **Writes**: 30/min per IP
- **Realtime connections**: 100/user

### **Functions**

- **Executions**: 100/min per function
- **Concurrent**: 10 per function

---

## Related Documents

- 📄 **DJAMMS_IO_01_Database_Schema_Complete.md**
- 📄 **DJAMMS_IO_02_API_Communications_Complete.md**
- 📄 **DJAMMS_IO_03_Realtime_Sync_Complete.md**
- 📄 **DJAMMS_IO_07_Cloud_Functions_Complete.md**

---

**END OF DOCUMENT**
