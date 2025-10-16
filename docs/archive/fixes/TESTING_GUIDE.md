# DJAMMS Testing Guide

## Overview
This document outlines the comprehensive testing strategy for the DJAMMS music player system, including unit tests, E2E tests, and multi-device synchronization testing.

## Test Structure

```
tests/
├── unit/                          # Unit tests (Vitest)
│   ├── authService.spec.ts       # Authentication service tests
│   └── PlayerSyncService.spec.ts # Player sync service tests (NEW)
├── e2e/                           # End-to-end tests (Playwright)
│   ├── auth.spec.ts              # Authentication flow tests
│   ├── player.spec.ts            # Basic player tests
│   ├── kiosk.spec.ts             # Kiosk search and request tests (NEW)
│   ├── admin.spec.ts             # Admin controls and management tests (NEW)
│   └── player-sync.spec.ts       # Player synchronization tests (NEW)
└── setup.ts                       # Test setup and configuration
```

## Running Tests

### Unit Tests (Vitest)
```bash
# Run all unit tests
npm test

# Run specific test file
npm test PlayerSyncService

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test kiosk

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui

# Run specific test suite
npx playwright test --grep "Player Controls"

# Generate test report
npx playwright show-report
```

### Run All Tests
```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Coverage

### Unit Tests

#### PlayerSyncService (`tests/unit/PlayerSyncService.spec.ts`)
Tests the player state synchronization service:
- ✅ Update player state (create/update)
- ✅ Get current player state
- ✅ Issue commands (play/pause/skip/volume)
- ✅ Mark commands as executed
- ✅ Subscribe to state changes
- ✅ Subscribe to commands
- ✅ Cleanup old commands

**Coverage Target**: >80%

### E2E Tests

#### Kiosk Endpoint (`tests/e2e/kiosk.spec.ts`)
Tests the customer-facing kiosk interface:

**Search Interface**
- ✅ Display kiosk interface with search bar
- ✅ Search for songs via YouTube API
- ✅ Display track details when clicking results
- ✅ Display video thumbnails in search results
- ✅ Handle empty search gracefully
- ✅ Clear search results when clearing input

**Request Flow**
- ✅ Use virtual keyboard to enter username
- ✅ Submit a song request to queue
- ✅ Handle priority requests in PAID mode
- ✅ Navigate back from request form to search

**Total Tests**: 10

#### Admin Endpoint (`tests/e2e/admin.spec.ts`)
Tests the administrative control interface:

**Player Controls Tab**
- ✅ Display player controls interface
- ✅ Show current track information
- ✅ Have play/pause button
- ✅ Toggle play/pause when button clicked
- ✅ Have skip button
- ✅ Send skip command
- ✅ Have volume slider
- ✅ Adjust volume with slider

**Queue Management Tab**
- ✅ Display queue management interface
- ✅ Show queue statistics
- ✅ Display priority queue section
- ✅ Display main queue section
- ✅ Show track cards with details
- ✅ Have remove button for each track
- ✅ Have clear all button
- ✅ Remove track when button clicked

**System Settings Tab**
- ✅ Display system settings interface
- ✅ Have venue name input
- ✅ Have mode toggle (FREEPLAY/PAID)
- ✅ Toggle between modes
- ✅ Show credit cost inputs in PAID mode
- ✅ Have YouTube API key input
- ✅ Show unsaved changes indicator
- ✅ Save settings when button clicked

**Navigation and Layout**
- ✅ Display admin header with venue info
- ✅ Show connection status indicator
- ✅ Have navigation tabs
- ✅ Switch between tabs

**Total Tests**: 28

#### Player Endpoint (`tests/e2e/player-sync.spec.ts`)
Tests the player interface and synchronization:

**Player Interface**
- ✅ Display player interface
- ✅ Show now playing section
- ✅ Display queue list
- ✅ Show autoplay toggle
- ✅ Display background slideshow

**YouTube Player Integration**
- ✅ Load YouTube player iframes
- ✅ Initialize YouTube API
- ✅ Display current track information

**Master Election**
- ✅ Register as player instance
- ✅ Send heartbeat periodically
- ✅ Become master if no other master exists

**Queue Synchronization**
- ✅ Load queue from database
- ✅ Update queue in real-time
- ✅ Play next track when current ends

**Crossfading**
- ✅ Have two YouTube iframes for crossfading
- ✅ Switch between iframes during playback

**Multi-Device Synchronization**
- ✅ Sync state between multiple player instances
- ✅ Respond to admin commands
- ✅ Broadcast state changes to viewers

**Autoplay Mode**
- ✅ Toggle autoplay on/off
- ✅ Play random tracks when autoplay enabled

**Error Handling**
- ✅ Handle YouTube API errors gracefully
- ✅ Reconnect if AppWrite connection drops
- ✅ Display error message when queue is empty

**Total Tests**: 24

### Total Test Count: **62 tests**

## Test Scenarios

### 1. Kiosk Search and Request Flow
```
User Flow:
1. Customer visits kiosk
2. Searches for "jazz music"
3. Browses results with thumbnails
4. Clicks a track
5. Enters username via virtual keyboard
6. Optionally selects priority (PAID mode)
7. Submits request
8. Sees success message
```

### 2. Player Master Election
```
Scenario:
1. Player A starts → becomes master
2. Player B starts → becomes backup
3. Player A sends heartbeat every 5 seconds
4. Player A crashes
5. Player B detects missing heartbeat
6. Player B becomes master
7. Playback continues seamlessly
```

### 3. Admin Remote Control
```
Admin Flow:
1. Admin opens admin panel
2. Views current track and queue
3. Clicks pause button
4. Command sent to database
5. Master player receives command
6. Master player pauses playback
7. State broadcast to all viewers
8. Admin sees paused state
```

### 4. Multi-Device Queue Sync
```
Sync Flow:
1. Kiosk adds track to queue → Database update
2. All players subscribe to queue changes
3. Players receive real-time update
4. Queue UI updates instantly
5. Master player adds to internal queue
6. Background slideshow updates thumbnails
```

### 5. Crossfading Between Tracks
```
Crossfade Flow:
1. Track A playing in iframe 1 (100% volume)
2. Track B loaded in iframe 2 (0% volume, paused)
3. Track A reaches 10 seconds remaining
4. Track B starts playing (0% volume)
5. 10-second crossfade:
   - Track A: 100% → 0%
   - Track B: 0% → 100%
6. Track A stops, iframe 1 available for next track
```

## Test Data Requirements

### AppWrite Setup
```bash
# Required collections
- queues
- player_instances
- player_state
- player_commands
- venues

# Required indexes
queues:
  - venueId (ascending)
  - position (ascending)
  - isPriority (descending)

player_instances:
  - venueId (ascending)
  - lastHeartbeat (descending)

player_state:
  - venueId (ascending)

player_commands:
  - venueId (ascending)
  - executedBy (ascending)
  - executedAt (ascending)
```

### Environment Variables
```bash
# .env.test
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=test-project-id
VITE_APPWRITE_DATABASE_ID=test-db
VITE_YOUTUBE_API_KEY=test-youtube-api-key
```

### Test Venues
```javascript
{
  venueId: 'test-venue-001',
  name: 'Test Venue',
  mode: 'FREEPLAY',
  youtubeApiKey: 'test-key',
  creditCost: 1,
  priorityCost: 2
}
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Benchmarks

### Target Metrics
- **Page Load**: < 3 seconds
- **Search Response**: < 500ms
- **Queue Update Latency**: < 200ms
- **State Sync Latency**: < 100ms
- **Crossfade Smoothness**: No audio gaps
- **Heartbeat Interval**: 5 seconds
- **Master Failover**: < 10 seconds

## Testing Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use unique venue IDs for parallel tests

### 2. Real-Time Testing
- Use `page.waitForTimeout()` for real-time updates
- Monitor WebSocket connections
- Test reconnection scenarios

### 3. Multi-Device Testing
- Use separate browser contexts
- Test master election with multiple instances
- Verify state synchronization

### 4. Error Scenarios
- Test offline/online transitions
- Test API failures
- Test malformed data

### 5. Performance Testing
- Monitor memory usage during playback
- Test with large queues (100+ tracks)
- Test rapid command dispatching

## Debugging Tests

### View Test Results
```bash
# Open HTML report
npx playwright show-report

# Debug specific test
npx playwright test --debug kiosk.spec.ts
```

### Console Logging
```typescript
// Add to test
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

### Screenshots on Failure
```typescript
// Automatically enabled in playwright.config.ts
screenshot: 'only-on-failure'
```

### Video Recording
```typescript
// Enable in playwright.config.ts
video: 'retain-on-failure'
```

## Known Issues and Limitations

### Current Limitations
1. **YouTube API Rate Limits**: Tests may fail if API quota exceeded
2. **Real-Time Delays**: WebSocket connections may have network latency
3. **Master Election**: Timing-dependent, may need longer timeouts
4. **Browser-Specific**: Some tests may behave differently across browsers

### Future Improvements
- [ ] Add visual regression testing
- [ ] Add performance profiling tests
- [ ] Add accessibility (a11y) tests
- [ ] Add load testing for concurrent users
- [ ] Add security testing for API endpoints
- [ ] Add mobile device testing

## Maintenance

### Regular Tasks
1. Update test data quarterly
2. Review and update test timeouts
3. Monitor CI/CD test duration
4. Update Playwright to latest version
5. Review and fix flaky tests

### Test Health Metrics
- **Pass Rate**: >95%
- **Flakiness**: <5%
- **Duration**: <10 minutes total
- **Coverage**: >80%

## Support

For test-related issues:
1. Check CI/CD logs
2. Review Playwright HTML report
3. Run tests locally with `--debug`
4. Check AppWrite database for test data
5. Verify environment variables

---

**Last Updated**: January 2025
**Test Count**: 62 tests
**Coverage**: 70% (estimated)
**Status**: ✅ All tests passing
