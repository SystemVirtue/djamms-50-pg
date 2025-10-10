import { test, expect } from '@playwright/test';

test.describe('Admin Endpoint - Controls and Management', () => {
  const testVenueId = 'test-venue-001';
  const adminUrl = `http://localhost:3003/admin/${testVenueId}`;

  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd need to authenticate first
    await page.goto(adminUrl);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Player Controls Tab', () => {
    test('should display player controls interface', async ({ page }) => {
      // Navigate to Player Controls tab
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      // Verify player controls are visible
      await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    });

    test('should show current track information', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      // Look for now playing section
      const nowPlaying = page.locator('[data-testid="now-playing"]');
      await expect(nowPlaying).toBeVisible();
    });

    test('should have play/pause button', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      // Look for play or pause button
      const playPauseButton = page.locator('button[aria-label*="play"], button[aria-label*="pause"]');
      await expect(playPauseButton).toBeVisible();
    });

    test('should toggle play/pause when button clicked', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      const playPauseButton = page.locator('button[aria-label*="play"], button[aria-label*="pause"]').first();
      
      // Get initial state
      const initialState = await playPauseButton.getAttribute('aria-label');
      
      // Click button
      await playPauseButton.click();
      await page.waitForTimeout(500);

      // State should change
      const newState = await playPauseButton.getAttribute('aria-label');
      expect(newState).not.toBe(initialState);
    });

    test('should have skip button', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      const skipButton = page.locator('button[aria-label*="skip"], button:has-text(/skip|next/i)');
      await expect(skipButton).toBeVisible();
    });

    test('should send skip command when skip button clicked', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      const skipButton = page.locator('button[aria-label*="skip"], button:has-text(/skip|next/i)').first();
      await skipButton.click();

      // Should show success toast or track should change
      await page.waitForTimeout(1000);
      // Verify command was sent (this would check for toast or console message)
    });

    test('should have volume slider', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      const volumeSlider = page.locator('input[type="range"][aria-label*="volume"]');
      await expect(volumeSlider).toBeVisible();
    });

    test('should adjust volume with slider', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      if (await controlsTab.isVisible()) {
        await controlsTab.click();
      }

      const volumeSlider = page.locator('input[type="range"][aria-label*="volume"]');
      
      // Get initial volume
      const initialVolume = await volumeSlider.inputValue();
      
      // Adjust volume
      await volumeSlider.fill('75');
      await page.waitForTimeout(500);

      // Volume should change
      const newVolume = await volumeSlider.inputValue();
      expect(newVolume).toBe('75');
      expect(newVolume).not.toBe(initialVolume);
    });
  });

  test.describe('Queue Management Tab', () => {
    test('should display queue management interface', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      await expect(page.locator('[data-testid="queue-management"]')).toBeVisible();
    });

    test('should show queue statistics', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      // Look for stats cards
      const statsCards = page.locator('[data-testid="queue-stats"]');
      await expect(statsCards).toBeVisible();
    });

    test('should display priority queue section', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      const prioritySection = page.locator('[data-testid="priority-queue"]');
      await expect(prioritySection).toBeVisible();
    });

    test('should display main queue section', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      const mainQueue = page.locator('[data-testid="main-queue"]');
      await expect(mainQueue).toBeVisible();
    });

    test('should show track cards with details', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      // Look for track cards
      const trackCards = page.locator('[data-testid="track-card"]');
      const firstCard = trackCards.first();

      if (await firstCard.isVisible()) {
        // Verify track card has required elements
        await expect(firstCard.locator('img')).toBeVisible(); // Thumbnail
        await expect(firstCard.locator('text=*')).toBeVisible(); // Title
      }
    });

    test('should have remove button for each track', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      const trackCards = page.locator('[data-testid="track-card"]');
      const firstCard = trackCards.first();

      if (await firstCard.isVisible()) {
        const removeButton = firstCard.locator('button[aria-label*="remove"]');
        await expect(removeButton).toBeVisible();
      }
    });

    test('should have clear all button for queues', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      const clearButtons = page.locator('button:has-text(/clear|remove all/i)');
      await expect(clearButtons.first()).toBeVisible();
    });

    test('should remove track when remove button clicked', async ({ page }) => {
      const queueTab = page.locator('button:has-text("Queue Management")');
      if (await queueTab.isVisible()) {
        await queueTab.click();
      }

      const trackCards = page.locator('[data-testid="track-card"]');
      const initialCount = await trackCards.count();

      if (initialCount > 0) {
        const firstCard = trackCards.first();
        const removeButton = firstCard.locator('button[aria-label*="remove"]');
        await removeButton.click();

        // Confirm if modal appears
        const confirmButton = page.locator('button:has-text(/confirm|yes|delete/i)');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Track count should decrease
        const newCount = await trackCards.count();
        expect(newCount).toBeLessThan(initialCount);
      }
    });
  });

  test.describe('System Settings Tab', () => {
    test('should display system settings interface', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
    });

    test('should have venue name input', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      const venueNameInput = page.locator('input[name="venueName"]');
      await expect(venueNameInput).toBeVisible();
    });

    test('should have mode toggle (FREEPLAY/PAID)', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      // Look for mode toggle buttons
      const freeplayButton = page.locator('button:has-text("FREEPLAY")');
      const paidButton = page.locator('button:has-text("PAID")');

      await expect(freeplayButton).toBeVisible();
      await expect(paidButton).toBeVisible();
    });

    test('should toggle between FREEPLAY and PAID modes', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      const freeplayButton = page.locator('button:has-text("FREEPLAY")');
      const paidButton = page.locator('button:has-text("PAID")');

      // Click PAID mode
      await paidButton.click();
      await page.waitForTimeout(300);

      // PAID button should be active
      const paidActive = await paidButton.getAttribute('data-state');
      expect(paidActive).toBe('active');

      // Click FREEPLAY mode
      await freeplayButton.click();
      await page.waitForTimeout(300);

      // FREEPLAY button should be active
      const freeplayActive = await freeplayButton.getAttribute('data-state');
      expect(freeplayActive).toBe('active');
    });

    test('should show credit cost inputs in PAID mode', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      // Switch to PAID mode
      const paidButton = page.locator('button:has-text("PAID")');
      await paidButton.click();
      await page.waitForTimeout(300);

      // Credit cost inputs should be visible
      const creditCostInput = page.locator('input[name="creditCost"]');
      const priorityCostInput = page.locator('input[name="priorityCost"]');

      await expect(creditCostInput).toBeVisible();
      await expect(priorityCostInput).toBeVisible();
    });

    test('should have YouTube API key input', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      const apiKeyInput = page.locator('input[name="youtubeApiKey"]');
      await expect(apiKeyInput).toBeVisible();
      
      // Should be password type
      const inputType = await apiKeyInput.getAttribute('type');
      expect(inputType).toBe('password');
    });

    test('should show unsaved changes indicator when editing', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      const venueNameInput = page.locator('input[name="venueName"]');
      
      // Edit venue name
      await venueNameInput.fill('Modified Venue Name');
      await page.waitForTimeout(300);

      // Should show unsaved changes warning
      const unsavedWarning = page.locator('text=/unsaved changes/i');
      await expect(unsavedWarning).toBeVisible();
    });

    test('should save settings when save button clicked', async ({ page }) => {
      const settingsTab = page.locator('button:has-text("System Settings")');
      if (await settingsTab.isVisible()) {
        await settingsTab.click();
      }

      const venueNameInput = page.locator('input[name="venueName"]');
      
      // Edit venue name
      await venueNameInput.fill('Test Venue Updated');
      await page.waitForTimeout(300);

      // Click save button
      const saveButton = page.locator('button:has-text(/save/i)');
      await saveButton.click();

      // Should show success message
      await expect(page.locator('text=/saved|success/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation and Layout', () => {
    test('should display admin header with venue info', async ({ page }) => {
      const header = page.locator('header');
      await expect(header).toContainText('DJAMMS Admin');
      await expect(header).toContainText(testVenueId);
    });

    test('should show connection status indicator', async ({ page }) => {
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toBeVisible();
    });

    test('should have navigation tabs', async ({ page }) => {
      const tabs = page.locator('[role="tablist"]');
      await expect(tabs).toBeVisible();

      // Should have 3 tabs
      const tabButtons = tabs.locator('button');
      expect(await tabButtons.count()).toBe(3);
    });

    test('should switch between tabs', async ({ page }) => {
      const controlsTab = page.locator('button:has-text("Player Controls")');
      const queueTab = page.locator('button:has-text("Queue Management")');
      const settingsTab = page.locator('button:has-text("System Settings")');

      // Click each tab and verify content changes
      await controlsTab.click();
      await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();

      await queueTab.click();
      await expect(page.locator('[data-testid="queue-management"]')).toBeVisible();

      await settingsTab.click();
      await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
    });
  });
});
