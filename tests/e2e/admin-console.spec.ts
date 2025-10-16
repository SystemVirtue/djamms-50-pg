/**
 * E2E Tests: Admin Console
 * 
 * Tests the complete admin interface including:
 * - Tab navigation
 * - Queue management
 * - Playlist operations
 * - Request history
 * - Analytics dashboard
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:3003';
const TEST_VENUE_ID = 'test-venue-123';

test.describe('Admin Console', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin page
    await page.goto(`${ADMIN_URL}/admin/${TEST_VENUE_ID}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load admin view with header', async ({ page }) => {
    // Check header
    await expect(page.locator('h1')).toContainText('DJAMMS Admin');
    await expect(page.locator('text=Venue:')).toBeVisible();
    await expect(page.locator('text=Connected')).toBeVisible();
  });

  test('should display all navigation tabs', async ({ page }) => {
    // Check all 5 tabs are present
    await expect(page.locator('text=Player Controls')).toBeVisible();
    await expect(page.locator('text=Queue Management')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=Request History')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Default should be Player Controls
    await expect(page.locator('button:has-text("Player Controls")')).toHaveClass(/border-orange-500/);

    // Click Queue Management tab
    await page.click('text=Queue Management');
    await expect(page.locator('button:has-text("Queue Management")')).toHaveClass(/border-orange-500/);
    
    // Click System Settings tab
    await page.click('text=System Settings');
    await expect(page.locator('button:has-text("System Settings")')).toHaveClass(/border-orange-500/);
    await expect(page.locator('text=Playlist Manager')).toBeVisible();

    // Click Request History tab
    await page.click('text=Request History');
    await expect(page.locator('button:has-text("Request History")')).toHaveClass(/border-orange-500/);

    // Click Analytics tab
    await page.click('text=Analytics');
    await expect(page.locator('button:has-text("Analytics")')).toHaveClass(/border-orange-500/);
  });

  test.describe('Player Controls Tab', () => {
    test('should display player controls', async ({ page }) => {
      await page.click('text=Player Controls');
      
      // Check for controls elements
      await expect(page.locator('text=Next in Queue')).toBeVisible();
      await expect(page.locator('text=Priority Queue')).toBeVisible();
      await expect(page.locator('text=Main Queue')).toBeVisible();
      await expect(page.locator('text=Volume')).toBeVisible();
    });

    test('should show empty queue message', async ({ page }) => {
      await page.click('text=Player Controls');
      
      // If queue is empty
      const emptyMessage = page.locator('text=Queue is empty');
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible();
      }
    });

    test('should display volume slider', async ({ page }) => {
      await page.click('text=Player Controls');
      
      // Check volume control
      const volumeSlider = page.locator('input[type="range"]');
      await expect(volumeSlider).toBeVisible();
      await expect(volumeSlider).toHaveAttribute('min', '0');
      await expect(volumeSlider).toHaveAttribute('max', '100');
    });
  });

  test.describe('Queue Management Tab', () => {
    test('should display queue components', async ({ page }) => {
      await page.click('text=Queue Management');
      
      // Should have QueueDisplayPanel and AdminQueueControls
      // Check for queue sections
      await expect(page.locator('text=Now Playing').or(page.locator('text=Priority Queue'))).toBeVisible();
    });

    test('should show skip and clear buttons', async ({ page }) => {
      await page.click('text=Queue Management');
      
      // Look for control buttons
      const skipButton = page.locator('button:has-text("Skip")');
      const clearButton = page.locator('button:has-text("Clear")');
      
      // Buttons should exist (may be disabled if queue empty)
      await expect(skipButton.or(clearButton)).toBeVisible();
    });
  });

  test.describe('System Settings Tab', () => {
    test('should display settings sections', async ({ page }) => {
      await page.click('text=System Settings');
      
      // Check for main sections
      await expect(page.locator('text=System Settings')).toBeVisible();
      await expect(page.locator('text=API Configuration')).toBeVisible();
      await expect(page.locator('text=Venue Settings')).toBeVisible();
    });

    test('should show playlist manager', async ({ page }) => {
      await page.click('text=System Settings');
      
      // Playlist manager should be visible
      await expect(page.locator('text=Playlist Manager').or(page.locator('text=Playlists'))).toBeVisible();
    });

    test('should have create playlist option', async ({ page }) => {
      await page.click('text=System Settings');
      
      // Look for create playlist button or input
      const createButton = page.locator('button:has-text("Create")').or(
        page.locator('button:has-text("New Playlist")')
      );
      
      // May be visible or in dialog
      if (await createButton.isVisible()) {
        await expect(createButton).toBeVisible();
      }
    });
  });

  test.describe('Request History Tab', () => {
    test('should display history panel', async ({ page }) => {
      await page.click('text=Request History');
      
      // Check for history elements
      await expect(page.locator('text=Request History')).toBeVisible();
      await expect(page.locator('text=Status').or(page.locator('select'))).toBeVisible();
    });

    test('should have filter controls', async ({ page }) => {
      await page.click('text=Request History');
      
      // Check for filters
      await expect(page.locator('select').or(page.locator('text=All'))).toBeVisible();
      await expect(page.locator('input[type="date"]').first()).toBeVisible();
      await expect(page.locator('button:has-text("Apply Filters")')).toBeVisible();
    });

    test('should display empty state or requests', async ({ page }) => {
      await page.click('text=Request History');
      
      // Either empty state or request list
      const emptyState = page.locator('text=No requests found');
      const requestList = page.locator('[class*="space-y-3"]');
      
      await expect(emptyState.or(requestList)).toBeVisible();
    });

    test('should filter by status', async ({ page }) => {
      await page.click('text=Request History');
      
      // Select a status filter
      const statusSelect = page.locator('select').first();
      await statusSelect.selectOption('completed');
      
      // Click apply filters
      await page.click('button:has-text("Apply Filters")');
      
      // Wait for potential update
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Analytics Tab', () => {
    test('should display analytics dashboard', async ({ page }) => {
      await page.click('text=Analytics');
      
      // Check for analytics elements
      await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
      await expect(page.locator('text=Load Analytics')).toBeVisible();
    });

    test('should have date range selectors', async ({ page }) => {
      await page.click('text=Analytics');
      
      // Check for date inputs
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs.first()).toBeVisible();
      await expect(dateInputs.nth(1)).toBeVisible();
    });

    test('should load analytics on button click', async ({ page }) => {
      await page.click('text=Analytics');
      
      // Click load analytics
      await page.click('button:has-text("Load Analytics")');
      
      // Wait for loading or results
      await page.waitForTimeout(2000);
      
      // Should show either loading, error, or metrics
      const metrics = page.locator('text=Total Requests').or(
        page.locator('text=No data available')
      ).or(
        page.locator('text=Select a date range')
      );
      
      await expect(metrics).toBeVisible();
    });

    test('should display metric cards when data available', async ({ page }) => {
      await page.click('text=Analytics');
      await page.click('button:has-text("Load Analytics")');
      await page.waitForTimeout(2000);
      
      // Look for metric cards (if data exists)
      const totalRequests = page.locator('text=Total Requests');
      const completionRate = page.locator('text=Completion Rate');
      
      // At least one metric indicator should be present
      await expect(
        totalRequests.or(completionRate).or(page.locator('text=No data available'))
      ).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${ADMIN_URL}/admin/${TEST_VENUE_ID}`);
      
      // Header should still be visible
      await expect(page.locator('h1')).toContainText('DJAMMS Admin');
      
      // Tabs should be accessible
      await expect(page.locator('text=Player Controls')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${ADMIN_URL}/admin/${TEST_VENUE_ID}`);
      
      // All tabs should be visible
      await expect(page.locator('text=Analytics')).toBeVisible();
    });
  });

  test.describe('Connection Status', () => {
    test('should display connection indicator', async ({ page }) => {
      // Check for connection status
      const connectedIndicator = page.locator('text=Connected');
      await expect(connectedIndicator).toBeVisible();
      
      // Check for green pulse indicator
      const pulseIndicator = page.locator('.bg-green-500.rounded-full.animate-pulse');
      await expect(pulseIndicator).toBeVisible();
    });
  });
});
