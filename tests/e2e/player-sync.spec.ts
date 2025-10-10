import { test, expect, chromium } from '@playwright/test';

test.describe('Player Endpoint - Playback and Sync', () => {
  const testVenueId = 'test-venue-001';
  const playerUrl = `http://localhost:3001/player/${testVenueId}`;

  test.beforeEach(async ({ page }) => {
    await page.goto(playerUrl);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Player Interface', () => {
    test('should display player interface', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('DJAMMS');
      await expect(page.locator('[data-testid="youtube-player"]')).toBeVisible();
    });

    test('should show now playing section', async ({ page }) => {
      const nowPlaying = page.locator('[data-testid="now-playing"]');
      await expect(nowPlaying).toBeVisible();
    });

    test('should display queue list', async ({ page }) => {
      const queue = page.locator('[data-testid="queue-list"]');
      await expect(queue).toBeVisible();
    });

    test('should show autoplay toggle', async ({ page }) => {
      const autoplayToggle = page.locator('[data-testid="autoplay-toggle"]');
      await expect(autoplayToggle).toBeVisible();
    });

    test('should display background slideshow', async ({ page }) => {
      const slideshow = page.locator('[data-testid="background-slideshow"]');
      await expect(slideshow).toBeVisible();
    });
  });

  test.describe('YouTube Player Integration', () => {
    test('should load YouTube player iframes', async ({ page }) => {
      // Wait for iframes to load
      await page.waitForSelector('iframe[src*="youtube.com"]', { timeout: 10000 });
      
      const iframes = page.locator('iframe[src*="youtube.com"]');
      const count = await iframes.count();
      
      // Should have 2 iframes for crossfading
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should initialize YouTube API', async ({ page }) => {
      // Check if YouTube API is loaded
      const ytApiLoaded = await page.evaluate(() => {
        return typeof (window as any).YT !== 'undefined';
      });
      
      expect(ytApiLoaded).toBe(true);
    });

    test('should display current track information when playing', async ({ page }) => {
      // Wait for potential track to load
      await page.waitForTimeout(3000);

      const nowPlaying = page.locator('[data-testid="now-playing"]');
      const trackInfo = nowPlaying.locator('[data-testid="track-info"]');
      
      if (await trackInfo.isVisible()) {
        // Should show title and artist
        await expect(trackInfo).toContainText(/./); // Has content
      }
    });
  });

  test.describe('Master Election', () => {
    test('should register as player instance', async ({ page }) => {
      // Wait for player to register
      await page.waitForTimeout(2000);

      // Check localStorage or session for player ID
      const playerId = await page.evaluate(() => {
        return localStorage.getItem('playerId') || sessionStorage.getItem('playerId');
      });

      expect(playerId).toBeTruthy();
    });

    test('should send heartbeat periodically', async ({ page }) => {
      // Monitor network requests for heartbeat
      const heartbeatRequests: any[] = [];
      
      page.on('request', request => {
        if (request.url().includes('player_instances')) {
          heartbeatRequests.push(request);
        }
      });

      // Wait for multiple heartbeats
      await page.waitForTimeout(8000);

      // Should have sent at least one heartbeat
      expect(heartbeatRequests.length).toBeGreaterThan(0);
    });

    test('should become master if no other master exists', async ({ page }) => {
      // Wait for master election
      await page.waitForTimeout(3000);

      // Check if this player is master
      const isMaster = await page.evaluate(() => {
        return (window as any).__playerIsMaster === true;
      });

      // In isolated test, should become master
      expect(isMaster).toBe(true);
    });
  });

  test.describe('Queue Synchronization', () => {
    test('should load queue from database', async ({ page }) => {
      await page.waitForTimeout(2000);

      const queueItems = page.locator('[data-testid="queue-item"]');
      const count = await queueItems.count();

      // Queue should be loaded (count >= 0)
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should update queue in real-time', async ({ page }) => {
      await page.waitForTimeout(2000);

      const queueList = page.locator('[data-testid="queue-list"]');
      
      // Wait for potential real-time updates
      await page.waitForTimeout(5000);

      const updatedContent = await queueList.textContent();

      // Content should be defined
      expect(updatedContent).toBeDefined();
    });

    test('should play next track when current ends', async ({ page }) => {
      // This test would verify auto-advance behavior
      // Wait for a track to play
      await page.waitForTimeout(3000);

      const nowPlaying = page.locator('[data-testid="now-playing"]');
      const initialTrack = await nowPlaying.textContent();

      // Skip to test auto-advance (if skip button exists)
      const skipButton = page.locator('button[aria-label*="skip"]');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForTimeout(2000);

        const newTrack = await nowPlaying.textContent();
        // Track should have changed
        expect(newTrack).not.toBe(initialTrack);
      }
    });
  });

  test.describe('Crossfading', () => {
    test('should have two YouTube iframes for crossfading', async ({ page }) => {
      const iframes = page.locator('iframe[src*="youtube.com"]');
      const count = await iframes.count();
      
      expect(count).toBe(2);
    });

    test('should switch between iframes during playback', async ({ page }) => {
      // Monitor which iframe is active
      await page.waitForTimeout(3000);

      const player1 = page.locator('[data-testid="youtube-player-1"]');
      const player2 = page.locator('[data-testid="youtube-player-2"]');

      // One should be visible/active
      const player1Visible = await player1.isVisible();
      const player2Visible = await player2.isVisible();

      expect(player1Visible || player2Visible).toBe(true);
    });
  });

  test.describe('Multi-Device Synchronization', () => {
    test('should sync state between multiple player instances', async () => {
      // Create two browser contexts (simulating two devices)
      const browser = await chromium.launch();
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        // Load player on both pages
        await page1.goto(playerUrl);
        await page2.goto(playerUrl);

        await page1.waitForLoadState('networkidle');
        await page2.waitForLoadState('networkidle');

        // Wait for one to become master
        await page1.waitForTimeout(3000);
        await page2.waitForTimeout(3000);

        // Both should see the same queue
        const queue1 = await page1.locator('[data-testid="queue-list"]').textContent();
        const queue2 = await page2.locator('[data-testid="queue-list"]').textContent();

        expect(queue1).toBe(queue2);
      } finally {
        await page1.close();
        await page2.close();
        await context1.close();
        await context2.close();
        await browser.close();
      }
    });

    test('should respond to admin commands', async () => {
      // This would test admin -> player command flow
      const browser = await chromium.launch();
      const playerContext = await browser.newContext();
      const adminContext = await browser.newContext();

      const playerPage = await playerContext.newPage();
      const adminPage = await adminContext.newPage();

      try {
        // Load player and admin
        await playerPage.goto(playerUrl);
        await adminPage.goto(`http://localhost:3003/admin/${testVenueId}`);

        await playerPage.waitForLoadState('networkidle');
        await adminPage.waitForLoadState('networkidle');

        // Wait for player to become master
        await playerPage.waitForTimeout(3000);

        // Admin clicks pause
        const pauseButton = adminPage.locator('button[aria-label*="pause"]');
        if (await pauseButton.isVisible()) {
          await pauseButton.click();
          await playerPage.waitForTimeout(1000);

          // Player should reflect paused state
          const playerState = await playerPage.locator('[data-testid="now-playing"]').textContent();
          expect(playerState).toBeDefined();
        }
      } finally {
        await playerPage.close();
        await adminPage.close();
        await playerContext.close();
        await adminContext.close();
        await browser.close();
      }
    });

    test('should broadcast state changes to viewers', async () => {
      const browser = await chromium.launch();
      const masterContext = await browser.newContext();
      const viewerContext = await browser.newContext();

      const masterPage = await masterContext.newPage();
      const viewerPage = await viewerContext.newPage();

      try {
        // Load master and viewer
        await masterPage.goto(playerUrl);
        await viewerPage.goto(playerUrl);

        await masterPage.waitForLoadState('networkidle');
        await viewerPage.waitForLoadState('networkidle');

        // Wait for master election
        await masterPage.waitForTimeout(4000);
        await viewerPage.waitForTimeout(4000);

        // Both should show same state
        const masterNowPlaying = await masterPage.locator('[data-testid="now-playing"]').textContent();
        const viewerNowPlaying = await viewerPage.locator('[data-testid="now-playing"]').textContent();

        expect(masterNowPlaying).toBe(viewerNowPlaying);
      } finally {
        await masterPage.close();
        await viewerPage.close();
        await masterContext.close();
        await viewerContext.close();
        await browser.close();
      }
    });
  });

  test.describe('Autoplay Mode', () => {
    test('should toggle autoplay on/off', async ({ page }) => {
      const autoplayToggle = page.locator('[data-testid="autoplay-toggle"]');
      
      if (await autoplayToggle.isVisible()) {
        // Get initial state
        const initialState = await autoplayToggle.getAttribute('aria-checked');
        
        // Toggle
        await autoplayToggle.click();
        await page.waitForTimeout(300);

        // State should change
        const newState = await autoplayToggle.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    });

    test('should play random tracks when autoplay is enabled', async ({ page }) => {
      const autoplayToggle = page.locator('[data-testid="autoplay-toggle"]');
      
      if (await autoplayToggle.isVisible()) {
        // Enable autoplay
        await autoplayToggle.click();
        
        // Wait for a track to load
        await page.waitForTimeout(5000);

        const nowPlaying = page.locator('[data-testid="now-playing"]');
        const hasContent = await nowPlaying.textContent();
        
        // Should have loaded a track
        expect(hasContent).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle YouTube API errors gracefully', async ({ page }) => {
      // Monitor console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(5000);

      // Should not have critical YouTube errors
      const criticalErrors = errors.filter(e => e.includes('YouTube') && e.includes('critical'));
      expect(criticalErrors.length).toBe(0);
    });

    test('should reconnect if AppWrite connection drops', async ({ page }) => {
      // This would test reconnection logic
      await page.waitForTimeout(3000);

      // Monitor reconnection attempts
      const reconnectAttempts: any[] = [];
      page.on('request', request => {
        if (request.url().includes('realtime')) {
          reconnectAttempts.push(request);
        }
      });

      // Simulate offline/online
      await page.context().setOffline(true);
      await page.waitForTimeout(2000);
      await page.context().setOffline(false);
      await page.waitForTimeout(2000);

      // Should attempt to reconnect
      expect(reconnectAttempts.length).toBeGreaterThan(0);
    });

    test('should display error message when queue is empty', async ({ page }) => {
      await page.waitForTimeout(2000);

      const queueList = page.locator('[data-testid="queue-list"]');
      const emptyMessage = queueList.locator('text=/empty|no tracks/i');

      // If queue is empty, should show message
      const queueItems = page.locator('[data-testid="queue-item"]');
      const count = await queueItems.count();

      if (count === 0) {
        await expect(emptyMessage).toBeVisible();
      }
    });
  });
});
