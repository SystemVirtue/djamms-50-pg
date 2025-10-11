# DJAMMS I/O Reference: Kiosk Endpoint

**Document ID**: DJAMMS_IO_Endpoint_06  
**Category**: BY ENDPOINT - Kiosk  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: Public song request interface for venue patrons  
**URL**: `https://kiosk.djamms.app/:venueId` | `http://localhost:3006/:venueId`  
**Technology**: React 18 + YouTube Data API + Stripe (planned)  
**Authentication**: None (public kiosk)

---

## I/O Summary

### **Inputs**
- ✅ **Search query** (text input)
- ✅ **Song selection** (click video card)
- ✅ **Payment** (Stripe - planned)

### **Outputs**
- ✅ **Search results** (YouTube videos)
- ✅ **Confirmation dialog**
- ✅ **Success message**

### **Database Operations**
- ✅ **CREATE** requests document
- ✅ **UPDATE** queues document (add to priority queue)

### **API Communications**
- ✅ **GET** YouTube Data API (search)
- ✅ **POST** to processRequest function
- ✅ **POST** to Stripe API (future)

---

## Search Flow

```tsx
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const youtubeService = new YouTubeSearchService(apiKey);
    const response = await youtubeService.search({
      query: searchQuery,
      maxResults: 20
    });

    setResults(response.items);
  } catch (error) {
    showToast('Search failed', 'error');
  }
};
```

---

## Request Flow

```tsx
const handleRequest = (video: SearchResult) => {
  setSelectedSong(video);
  setShowConfirmDialog(true);
};

const handleConfirmRequest = async () => {
  try {
    // Future: Process Stripe payment
    // const paymentIntent = await stripe.confirmCardPayment(...);
    
    await processRequestService.submit({
      venueId,
      song: selectedSong,
      paymentId: 'mock-payment-id',
      requesterId: 'kiosk-user'
    });

    showToast('Song request submitted!', 'success');
    setShowConfirmDialog(false);
  } catch (error) {
    showToast('Request failed', 'error');
  }
};
```

---

## YouTube Search Display

```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  {results.map(video => (
    <div key={video.id} onClick={() => handleRequest(video)}>
      <img src={video.thumbnailUrl} alt={video.title} />
      <h3>{video.title}</h3>
      <p>{video.channelTitle}</p>
      <p>{formatDuration(video.duration)}</p>
      {video.officialScore >= 3 && <span>✓ Official</span>}
    </div>
  ))}
</div>
```

---

## Business Rules

- **Max duration**: 5 minutes (300 seconds)
- **Artist rate limit**: 3 requests per 30 minutes
- **Payment**: $5 per request (planned)

---

## Related Documents

- 📄 **DJAMMS_IO_06_External_APIs_Complete.md** - YouTube Data API
- 📄 **DJAMMS_IO_07_Cloud_Functions_Complete.md** - processRequest function

---

**END OF DOCUMENT**
