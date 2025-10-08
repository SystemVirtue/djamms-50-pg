# Default Playlist - Quick Reference

## ✅ What Was Done

1. **Created script** to fetch YouTube playlist via API
2. **Fetched 58 tracks** from playlist PLJ7vMjpVbhBWLWJpweVDki43Wlcqzsqdu
3. **Retrieved durations** for all videos
4. **Stored in AppWrite** database as document ID: `default_playlist`
5. **Verified** playlist is accessible and correct

---

## 🎯 Quick Commands

```bash
# Create/update default playlist from YouTube
npm run playlist:create

# Verify playlist exists and view contents
npm run playlist:verify
```

---

## 📦 What's Stored

- **Document ID:** `default_playlist`
- **Collection:** `playlists`
- **Total Tracks:** 58
- **Format:** JSON string in `tracks` field
- **Duration:** ~4 hours 15 minutes

---

## 💻 Usage in Code

```typescript
// Get default playlist
const playlist = await databases.getDocument(
  DATABASE_ID,
  'playlists',
  'default_playlist'
);

// Parse tracks
const tracks = JSON.parse(playlist.tracks);

// Use for new venue queue
await databases.createDocument(
  DATABASE_ID,
  'queues',
  ID.unique(),
  {
    venueId: newVenue.$id,
    mainQueue: playlist.tracks, // Already JSON string
    priorityQueue: JSON.stringify([]),
    // ...
  }
);
```

---

## 🎵 Sample Tracks

1. Gotye - Somebody That I Used To Know [4:04]
2. Dire Straits - Romeo And Juliet [6:01]
3. Rod Stewart - Maggie May [3:43]
4. Michael Jackson - Billie Jean [4:56]
5. The Police - Message In A Bottle [4:21]
6. Toto - Africa [4:32]
7. Fleetwood Mac - Gypsy [4:18]
8. The Cure - Just Like Heaven [3:27]
9. America - Ventura Highway [3:32]
10. Stealers Wheel - Stuck In The Middle With You [3:29]

*... and 48 more*

---

## 📄 Documentation

See `DEFAULT_PLAYLIST_COMPLETE.md` for full documentation.

---

## ✅ Status

- [x] Script created
- [x] Playlist fetched from YouTube
- [x] Stored in AppWrite
- [x] Verified working
- [x] npm scripts added
- [x] Documentation written
- [ ] Integrated with venue creation
- [ ] Integrated with player initialization
- [ ] Tested in production
