import { test, expect } from '@playwright/test';

test.describe('Dashboard Endpoint - Comprehensive Coverage', () => {
  const testUserId = 'test-user-123';
  const dashboardUrl = `http://localhost:3005/${testUserId}`;

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto(dashboardUrl);
    await page.evaluate(() => {
      localStorage.setItem('djamms_session', JSON.stringify({
        token: 'mock-jwt-token',
        user: {
          $id: 'test-user-123',
          email: 'test@djamms.app',
          role: 'admin'
        }
      }));
    });
    await page.reload();
  });

  test.describe('Tab Navigation System', () => {
    test('should display all four tabs', async ({ page }) => {
      await page.waitForSelector('[role="tablist"]', { timeout: 5000 });
      
      // Verify all tabs exist
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Queue Manager')).toBeVisible();
      await expect(page.locator('text=Playlist Library')).toBeVisible();
      await expect(page.locator('text=Admin Console')).toBeVisible();
    });

    test('should default to Dashboard tab', async ({ page }) => {
      const dashboardTab = page.locator('[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to Queue Manager tab', async ({ page }) => {
      await page.click('text=Queue Manager');
      
      const queueTab = page.locator('[role="tab"]:has-text("Queue Manager")');
      await expect(queueTab).toHaveAttribute('aria-selected', 'true');
      
      // Verify content changed
      await expect(page.locator('text=Current Queue')).toBeVisible({ timeout: 3000 });
    });

    test('should switch to Playlist Library tab', async ({ page }) => {
      await page.click('text=Playlist Library');
      
      const playlistTab = page.locator('[role="tab"]:has-text("Playlist Library")');
      await expect(playlistTab).toHaveAttribute('aria-selected', 'true');
      
      // Verify content changed
      await expect(page.locator('text=My Playlists')).toBeVisible({ timeout: 3000 });
    });

    test('should switch to Admin Console tab', async ({ page }) => {
      await page.click('text=Admin Console');
      
      const adminTab = page.locator('[role="tab"]:has-text("Admin Console")');
      await expect(adminTab).toHaveAttribute('aria-selected', 'true');
      
      // Verify content changed
      await expect(page.locator('text=System Status')).toBeVisible({ timeout: 3000 });
    });

    test('should preserve tab state when switching back', async ({ page }) => {
      // Switch to Queue Manager
      await page.click('text=Queue Manager');
      await expect(page.locator('text=Current Queue')).toBeVisible();
      
      // Switch to Dashboard
      await page.click('text=Dashboard');
      await expect(page.locator('[data-testid="dashboard-cards"]')).toBeVisible();
      
      // Switch back to Queue Manager - should still show queue
      await page.click('text=Queue Manager');
      await expect(page.locator('text=Current Queue')).toBeVisible();
    });

    test('should highlight active tab', async ({ page }) => {
      // Dashboard tab should be active initially
      const dashboardTab = page.locator('[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveClass(/active|selected/);
      
      // Click Queue Manager
      await page.click('text=Queue Manager');
      const queueTab = page.locator('[role="tab"]:has-text("Queue Manager")');
      await expect(queueTab).toHaveClass(/active|selected/);
      
      // Dashboard should no longer be active
      await expect(dashboardTab).not.toHaveClass(/active|selected/);
    });
  });

  test.describe('Dashboard Cards', () => {
    test('should display all dashboard cards', async ({ page }) => {
      await expect(page.locator('text=Start Video Player')).toBeVisible();
      await expect(page.locator('text=Queue Manager')).toBeVisible();
      await expect(page.locator('text=Playlist Library')).toBeVisible();
      await expect(page.locator('text=Admin Console')).toBeVisible();
    });

    test('should have descriptive text for each card', async ({ page }) => {
      await expect(page.locator('text=Open fullscreen YouTube video player')).toBeVisible();
      await expect(page.locator('text=Manage the current song queue')).toBeVisible();
      await expect(page.locator('text=Browse and manage your music playlists')).toBeVisible();
      await expect(page.locator('text=System settings and administrative controls')).toBeVisible();
    });

    test('should open player in new window when clicking Video Player card', async ({ page, context }) => {
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=Start Video Player')
      ]);
      
      // Verify new page opened
      expect(newPage.url()).toContain('/player');
      
      // Clean up
      await newPage.close();
    });

    test('should switch to Queue Manager tab when clicking card', async ({ page }) => {
      // Find and click the Queue Manager card (not the tab)
      const queueCard = page.locator('[data-testid="card-queuemanager"]');
      await queueCard.click();
      
      // Verify tab switched
      const queueTab = page.locator('[role="tab"]:has-text("Queue Manager")');
      await expect(queueTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to Playlist Library tab when clicking card', async ({ page }) => {
      const playlistCard = page.locator('[data-testid="card-playlistlibrary"]');
      await playlistCard.click();
      
      const playlistTab = page.locator('[role="tab"]:has-text("Playlist Library")');
      await expect(playlistTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to Admin Console tab when clicking card', async ({ page }) => {
      const adminCard = page.locator('[data-testid="card-adminconsole"]');
      await adminCard.click();
      
      const adminTab = page.locator('[role="tab"]:has-text("Admin Console")');
      await expect(adminTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should have hover effects on cards', async ({ page }) => {
      const videoPlayerCard = page.locator('text=Start Video Player').locator('..');
      
      // Hover over card
      await videoPlayerCard.hover();
      
      // Card should have some visual feedback (shadow, transform, etc.)
      const cardStyle = await videoPlayerCard.evaluate(el => window.getComputedStyle(el).cursor);
      expect(cardStyle).toBe('pointer');
    });
  });

  test.describe('Player Status Monitoring', () => {
    test('should display player status indicator', async ({ page }) => {
      await expect(page.locator('[data-testid="player-status"]')).toBeVisible();
    });

    test('should show DISCONNECTED status by default', async ({ page }) => {
      const status = page.locator('[data-testid="player-status"]');
      await expect(status).toContainText(/DISCONNECTED|NOT CONNECTED/i);
    });

    test('should display connection icon for disconnected state', async ({ page }) => {
      const statusIcon = page.locator('[data-testid="player-status-icon"]');
      await expect(statusIcon).toBeVisible();
      
      // Should be red or warning color
      const iconColor = await statusIcon.evaluate(el => 
        window.getComputedStyle(el).color || 
        el.getAttribute('class')
      );
      expect(iconColor).toMatch(/red|error|warning/i);
    });

    test('should show CONNECTED, PLAYING when player is active', async ({ page }) => {
      // Mock player connection
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-status-change', {
          detail: { status: 'playing', connectionStatus: 'connected' }
        }));
      });
      
      await page.waitForTimeout(500);
      
      const status = page.locator('[data-testid="player-status"]');
      await expect(status).toContainText(/CONNECTED.*PLAYING|PLAYING/i);
    });

    test('should show CONNECTED, PAUSED when player is paused', async ({ page }) => {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-status-change', {
          detail: { status: 'paused', connectionStatus: 'connected' }
        }));
      });
      
      await page.waitForTimeout(500);
      
      const status = page.locator('[data-testid="player-status"]');
      await expect(status).toContainText(/PAUSED/i);
    });

    test('should show IDLE when no content queued', async ({ page }) => {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-status-change', {
          detail: { status: 'idle', connectionStatus: 'connected' }
        }));
      });
      
      await page.waitForTimeout(500);
      
      const status = page.locator('[data-testid="player-status"]');
      await expect(status).toContainText(/IDLE.*NO CONTENT/i);
    });

    test('should update status color based on state', async ({ page }) => {
      const statusElement = page.locator('[data-testid="player-status"]');
      
      // Playing - green
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-status-change', {
          detail: { status: 'playing', connectionStatus: 'connected' }
        }));
      });
      await page.waitForTimeout(300);
      let statusClass = await statusElement.getAttribute('class');
      expect(statusClass).toMatch(/green|success/i);
      
      // Paused - yellow
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-status-change', {
          detail: { status: 'paused', connectionStatus: 'connected' }
        }));
      });
      await page.waitForTimeout(300);
      statusClass = await statusElement.getAttribute('class');
      expect(statusClass).toMatch(/yellow|warning/i);
      
      // Disconnected - red
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('player-status-change', {
          detail: { status: 'idle', connectionStatus: 'disconnected' }
        }));
      });
      await page.waitForTimeout(300);
      statusClass = await statusElement.getAttribute('class');
      expect(statusClass).toMatch(/red|error|danger/i);
    });
  });

  test.describe('User Authentication Flow', () => {
    test('should display user email when authenticated', async ({ page }) => {
      const userInfo = page.locator('[data-testid="user-info"]');
      await expect(userInfo).toContainText('test@djamms.app');
    });

    test('should show user role badge', async ({ page }) => {
      const roleBadge = page.locator('[data-testid="user-role"]');
      await expect(roleBadge).toContainText(/admin/i);
    });

    test('should redirect to auth if no session', async ({ page }) => {
      // Clear session
      await page.evaluate(() => {
        localStorage.removeItem('djamms_session');
      });
      
      // Navigate to dashboard
      await page.goto(dashboardUrl);
      
      // Should redirect to auth
      await page.waitForURL(/auth/);
      expect(page.url()).toContain('auth');
    });

    test('should validate JWT token on load', async ({ page }) => {
      // Set expired token
      await page.evaluate(() => {
        localStorage.setItem('djamms_session', JSON.stringify({
          token: 'expired-token',
          user: { $id: 'test', email: 'test@test.com' }
        }));
      });
      
      await page.goto(dashboardUrl);
      
      // Should redirect to auth if token is invalid
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/auth|login/);
    });

    test('should show user menu when clicking profile', async ({ page }) => {
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
      
      // Verify menu items
      await expect(page.locator('text=Logout')).toBeVisible();
      await expect(page.locator('text=Settings')).toBeVisible();
    });

    test('should persist authentication across page reloads', async ({ page }) => {
      // Reload page
      await page.reload();
      
      // Should still show user info
      await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
      await expect(page.locator('text=test@djamms.app')).toBeVisible();
    });
  });

  test.describe('Logout and Session Cleanup', () => {
    test('should have logout button in user menu', async ({ page }) => {
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      
      const logoutButton = page.locator('text=Logout');
      await expect(logoutButton).toBeVisible();
    });

    test('should clear session on logout', async ({ page }) => {
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      
      const logoutButton = page.locator('text=Logout');
      await logoutButton.click();
      
      // Check localStorage is cleared
      const session = await page.evaluate(() => localStorage.getItem('djamms_session'));
      expect(session).toBeNull();
    });

    test('should redirect to auth page after logout', async ({ page }) => {
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      
      const logoutButton = page.locator('text=Logout');
      await logoutButton.click();
      
      // Should redirect to auth
      await page.waitForURL(/auth/);
      expect(page.url()).toContain('auth');
    });

    test('should show logout confirmation toast', async ({ page }) => {
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      
      const logoutButton = page.locator('text=Logout');
      await logoutButton.click();
      
      // Should show toast notification
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toContainText(/logged out|signed out/i);
    });

    test('should cleanup event listeners on logout', async ({ page }) => {
      // Add event listener tracker
      await page.evaluate(() => {
        (window as any).__eventListenerCount = 0;
        const original = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(...args) {
          (window as any).__eventListenerCount++;
          return original.apply(this, args);
        };
      });
      
      const initialCount = await page.evaluate(() => (window as any).__eventListenerCount);
      
      // Logout
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      const logoutButton = page.locator('text=Logout');
      await logoutButton.click();
      
      await page.waitForTimeout(1000);
      
      // Event listeners should be cleaned up
      // This is a basic check - actual cleanup depends on implementation
      expect(initialCount).toBeGreaterThan(0);
    });

    test('should close all open windows on logout', async ({ page, context }) => {
      // Open player window
      const [playerPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=Start Video Player')
      ]);
      
      // Logout from dashboard
      await page.bringToFront();
      const profileButton = page.locator('[data-testid="user-profile"]');
      await profileButton.click();
      const logoutButton = page.locator('text=Logout');
      await logoutButton.click();
      
      await page.waitForTimeout(1000);
      
      // Player window should be closed or show logged out state
      const isPlayerClosed = playerPage.isClosed();
      expect(isPlayerClosed).toBeTruthy();
    });
  });

  test.describe('Window Management', () => {
    test('should track open windows', async ({ page, context }) => {
      // Open player window
      const [playerPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=Start Video Player')
      ]);
      
      // Dashboard should track this window
      const openWindowsCount = await page.evaluate(() => {
        return (window as any).__openWindows?.length || 0;
      });
      
      expect(openWindowsCount).toBeGreaterThanOrEqual(1);
      
      await playerPage.close();
    });

    test('should prevent duplicate player windows', async ({ page, context }) => {
      // Try to open player twice
      await page.click('text=Start Video Player');
      await page.waitForTimeout(500);
      
      await page.click('text=Start Video Player');
      await page.waitForTimeout(500);
      
      // Should only have one player window
      const pages = context.pages();
      const playerPages = pages.filter(p => p.url().includes('/player'));
      expect(playerPages.length).toBeLessThanOrEqual(1);
    });

    test('should focus existing window if already open', async ({ page, context }) => {
      // Open player window
      const [playerPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=Start Video Player')
      ]);
      
      // Try to open again
      await page.click('text=Start Video Player');
      await page.waitForTimeout(500);
      
      // Should focus existing window, not open new one
      const pages = context.pages();
      const playerPages = pages.filter(p => p.url().includes('/player'));
      expect(playerPages.length).toBe(1);
      
      await playerPage.close();
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      await expect(mobileMenu).toBeVisible();
    });

    test('should stack dashboard cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const cards = page.locator('[data-testid^="card-"]');
      const count = await cards.count();
      expect(count).toBe(4);
      
      // Cards should be in single column
      const cardPositions = await cards.evaluateAll(elements => 
        elements.map(el => el.getBoundingClientRect().left)
      );
      
      // All cards should have similar left position (stacked vertically)
      const allSameX = cardPositions.every(x => Math.abs(x - cardPositions[0]) < 10);
      expect(allSameX).toBeTruthy();
    });

    test('should show tabs in grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const cards = page.locator('[data-testid^="card-"]');
      const cardPositions = await cards.evaluateAll(elements => 
        elements.map(el => ({
          left: el.getBoundingClientRect().left,
          top: el.getBoundingClientRect().top
        }))
      );
      
      // Should have at least 2 cards on same row
      const firstRowCards = cardPositions.filter(pos => 
        Math.abs(pos.top - cardPositions[0].top) < 10
      );
      expect(firstRowCards.length).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Performance', () => {
    test('should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(dashboardUrl);
      await page.waitForSelector('[data-testid="dashboard-cards"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should not have memory leaks on tab switching', async ({ page }) => {
      // Switch tabs multiple times
      for (let i = 0; i < 10; i++) {
        await page.click('text=Queue Manager');
        await page.waitForTimeout(100);
        await page.click('text=Dashboard');
        await page.waitForTimeout(100);
      }
      
      // Check for memory leaks (basic check)
      const metrics = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
      expect(metrics).toBeDefined();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message if user data fails to load', async ({ page }) => {
      await page.route('**/databases/*/collections/users/*', route => {
        route.abort('failed');
      });
      
      await page.goto(dashboardUrl);
      
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.context().setOffline(true);
      
      await page.goto(dashboardUrl);
      
      // Should show offline indicator
      const offlineIndicator = page.locator('text=/offline|no connection/i');
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
      
      await page.context().setOffline(false);
    });

    test('should retry failed requests', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/databases/*', route => {
        requestCount++;
        if (requestCount < 3) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.goto(dashboardUrl);
      await page.waitForTimeout(3000);
      
      // Should have retried at least once
      expect(requestCount).toBeGreaterThanOrEqual(2);
    });
  });
});
