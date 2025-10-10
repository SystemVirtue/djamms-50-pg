# Kiosk App Testing Guide

## Overview
The Kiosk endpoint is now fully functional with search interface, queue management, and AppWrite synchronization (without Stripe payment integration).

## Features Implemented ✅

### 1. Search Interface
- **Virtual Keyboard**: Touch-optimized QWERTY layout with haptic feedback
- **YouTube Search**: Debounced search (500ms) with official content scoring
- **Results Grid**: Responsive 1-4 column layout
- **Pagination**: Next/Previous with page numbers
- **Loading States**: Skeleton loaders during search

### 2. Song Request Flow
- **Confirmation Dialog**: Preview selected video before adding
- **Queue Submission**: Sync to AppWrite queues collection
- **Success Screen**: Beautiful confirmation with queue position
- **Credits System**: FREEPLAY/PAID mode support
- **Real-time Sync**: AppWrite Realtime subscriptions

### 3. UI Components
- **Header**: Venue info + credits display
- **Now Playing Banner**: Shows current track
- **Confirmation Screen**: Post-request success view
- **Error Handling**: Graceful fallbacks

## Setup

### 1. Environment Variables

Create `.env` file in the root:

```bash
# YouTube API
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

# AppWrite
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=main-db
```

### 2. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials → API Key
5. Copy the API key to `.env`

### 3. AppWrite Setup

Make sure your AppWrite database has the `queues` collection with these attributes:
- `venueId` (string, required)
- `videoId` (string, required)
- `title` (string, required)
- `artist` (string, required)
- `duration` (integer, required)
- `thumbnailUrl` (string, optional)
- `position` (integer, required)
- `isPriority` (boolean, required)
- `addedAt` (string, required)
- `requestedBy` (string, optional)

## Running the Kiosk

### Development Mode

```bash
# Start kiosk dev server
npm run dev:kiosk

# Navigate to
http://localhost:3004/kiosk/test-venue-id
```

Replace `test-venue-id` with any venue ID you want to test.

### Production Build

```bash
# Build kiosk app
npm run build:kiosk

# Preview production build
npm run preview
```

## Testing Checklist

### ✅ Search Functionality
- [ ] Type in search input updates results
- [ ] Virtual keyboard keys work
- [ ] Search is debounced (500ms delay)
- [ ] Results display in grid layout
- [ ] Pagination works (Next/Previous)
- [ ] Loading skeletons show during search
- [ ] Error message displays on API failure

### ✅ Video Card
- [ ] Thumbnail loads correctly
- [ ] Duration displays in MM:SS format
- [ ] Official badge shows for VEVO/official videos
- [ ] "Add to Queue" button is clickable
- [ ] Hover effects work

### ✅ Request Flow
- [ ] Clicking video opens confirmation dialog
- [ ] Video preview shows in dialog
- [ ] Credits warning shows in PAID mode
- [ ] "Cancel" button closes dialog
- [ ] "Add to Queue" button submits request
- [ ] Success screen shows after submission
- [ ] Queue position is displayed
- [ ] "Add Another Song" returns to search

### ✅ Credits System (Dev Mode)
- [ ] Credits display in header
- [ ] "+5 Credits" dev button works
- [ ] FREEPLAY mode allows free requests
- [ ] PAID mode requires 1 credit
- [ ] Insufficient credits shows error

### ✅ Now Playing Banner
- [ ] Shows current track title
- [ ] Updates in real-time
- [ ] Hidden when no track playing

### ✅ AppWrite Sync
- [ ] Songs sync to AppWrite `queues` collection
- [ ] Real-time updates work across devices
- [ ] Queue position calculated correctly
- [ ] Priority vs main queue handled

## User Flow Example

### FREEPLAY Mode (Default)

1. User arrives at `/kiosk/venue-123`
2. Header shows "DJAMMS Kiosk" with credits (0 in FREEPLAY)
3. User types "foo fighters" using virtual keyboard
4. Search results appear after 500ms
5. User clicks on "Times Like These"
6. Confirmation dialog shows video preview
7. User clicks "Add to Queue"
8. Request submits to AppWrite
9. Success screen shows:
   - ✅ Song title and artist
   - ✅ Queue position: #5
   - ✅ Estimated wait: ~20 minutes
10. User clicks "Add Another Song"
11. Returns to search interface

### PAID Mode (With Credits)

1. User has 3 credits
2. User searches and selects a song
3. Confirmation shows "This will use 1 credit"
4. User confirms
5. Credit deducted (2 remaining)
6. Song added to **priority queue**
7. Success screen shows priority badge
8. User can add more songs until credits run out

## Dev Tools

### Add Credits Button (Dev Only)

In development mode, a floating button appears in bottom-right:
```
[+5 Credits (Dev)]
```

Click this to add 5 credits for testing PAID mode.

### Console Logs

Watch browser console for:
- Search API calls
- Queue sync events
- Real-time updates
- Error messages

### AppWrite Console

Monitor the `queues` collection in AppWrite console to see:
- New documents created
- Real-time updates
- Queue positions
- Priority vs main queue

## Troubleshooting

### Search Not Working

1. Check YouTube API key in `.env`
2. Verify API quota not exceeded
3. Check browser console for errors
4. Test API key with direct API call

### Queue Not Syncing

1. Verify AppWrite endpoint and project ID
2. Check `queues` collection exists
3. Verify collection permissions
4. Check browser console for sync errors

### Credits Not Working

1. In FREEPLAY mode, credits are not required
2. Switch to PAID mode to test credits
3. Use dev button to add credits
4. Check local state in React DevTools

## Next Steps

### For Full Production:

1. **Stripe Integration**: Add payment processing for credits
2. **Venue Settings**: Load mode (FREEPLAY/PAID) from venue config
3. **Credit Purchase**: Implement credit purchase flow
4. **Receipt Screen**: Show payment confirmation
5. **Error Recovery**: Better offline handling
6. **Analytics**: Track search queries and requests

### Recommended Testing:

1. Test on actual touchscreen device
2. Test with slow network (throttle in DevTools)
3. Test with API quota exhausted
4. Test with multiple concurrent users
5. Test real-time sync across multiple tabs

## Files Modified

```
packages/shared/src/
├── hooks/
│   └── useQueueSync.ts (NEW)
├── components/
│   └── ConfirmationScreen.tsx (NEW)

apps/kiosk/src/components/
└── KioskView.tsx (UPDATED with queue sync)
```

## API Calls

### YouTube Search
```
GET https://www.googleapis.com/youtube/v3/search
Parameters:
  - part: snippet
  - q: search query
  - type: video
  - videoCategoryId: 10 (Music)
  - maxResults: 12
  - key: API key
  - pageToken: (for pagination)
```

### AppWrite Queue Operations
```
createDocument(database, collection, document)
listDocuments(database, collection, queries)
deleteDocument(database, collection, documentId)
subscribe(channel, callback)
```

---

**Status**: ✅ Kiosk Request Flow Complete (without Stripe)  
**Progress**: 40% of total project  
**Next**: Player endpoint implementation
