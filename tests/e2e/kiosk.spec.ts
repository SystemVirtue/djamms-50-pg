import { test, expect } from '@playwright/test';

test.describe('Kiosk Endpoint - Search and Request Flow', () => {
  const testVenueId = 'test-venue-001';
  const kioskUrl = `http://localhost:3000/kiosk/${testVenueId}`;

  test.beforeEach(async ({ page }) => {
    await page.goto(kioskUrl);
    await page.waitForLoadState('networkidle');
  });

  test('should display kiosk interface with search bar', async ({ page }) => {
    // Check for main kiosk elements
    await expect(page.locator('h1')).toContainText('DJAMMS');
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should search for songs via YouTube API', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    // Type search query
    await searchInput.fill('test song');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(2000);

    // Should display results grid
    const results = page.locator('[data-testid="search-results"]').locator('> div');
    await expect(results.first()).toBeVisible();
  });

  test('should display track details when clicking a result', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    // Search for a song
    await searchInput.fill('jazz');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    // Click first result
    const firstResult = page.locator('[data-testid="search-results"]').locator('> div').first();
    await firstResult.click();

    // Should show track details or request form
    await expect(page.locator('text=/title|artist|duration/i')).toBeVisible();
  });

  test('should use virtual keyboard to enter username', async ({ page }) => {
    // This test would verify the virtual keyboard functionality
    // Navigate to request flow
    const searchInput = page.locator('input[placeholder*="search"]');
    await searchInput.fill('rock');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    const firstResult = page.locator('[data-testid="search-results"]').locator('> div').first();
    await firstResult.click();

    // Look for virtual keyboard
    const keyboard = page.locator('[data-testid="virtual-keyboard"]');
    if (await keyboard.isVisible()) {
      // Test keyboard letter clicks
      await keyboard.locator('button:has-text("A")').click();
      await keyboard.locator('button:has-text("B")').click();
      await keyboard.locator('button:has-text("C")').click();

      // Verify input was updated
      const usernameInput = page.locator('input[name="username"]');
      await expect(usernameInput).toHaveValue(/ABC/i);
    }
  });

  test('should submit a song request to queue', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    // Search and select a song
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    const firstResult = page.locator('[data-testid="search-results"]').locator('> div').first();
    await firstResult.click();

    // Fill username
    const usernameInput = page.locator('input[name="username"]');
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('TestUser');
    }

    // Submit request
    const submitButton = page.locator('button:has-text(/request|submit/i)');
    await submitButton.click();

    // Should show success message
    await expect(page.locator('text=/success|added|queued/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle priority requests when in PAID mode', async ({ page }) => {
    // This test assumes venue is in PAID mode
    const searchInput = page.locator('input[placeholder*="search"]');
    
    await searchInput.fill('priority test');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    const firstResult = page.locator('[data-testid="search-results"]').locator('> div').first();
    await firstResult.click();

    // Look for priority toggle or checkbox
    const priorityToggle = page.locator('input[type="checkbox"][name*="priority"]');
    if (await priorityToggle.isVisible()) {
      await priorityToggle.check();
    }

    const usernameInput = page.locator('input[name="username"]');
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('PriorityUser');
    }

    const submitButton = page.locator('button:has-text(/request|submit/i)');
    await submitButton.click();

    await expect(page.locator('text=/success|added|queued/i')).toBeVisible({ timeout: 5000 });
  });

  test('should clear search results when clearing input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    // Perform search
    await searchInput.fill('clear test');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    // Verify results exist
    const results = page.locator('[data-testid="search-results"]');
    await expect(results.locator('> div').first()).toBeVisible();

    // Clear input
    await searchInput.clear();
    
    // Results should be cleared or message shown
    await expect(results.locator('> div').first()).not.toBeVisible();
  });

  test('should handle empty search gracefully', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    // Try to search with empty input
    await searchInput.press('Enter');

    // Should show validation or remain on search page
    await expect(page.locator('h1')).toContainText('DJAMMS');
    await expect(searchInput).toBeVisible();
  });

  test('should display video thumbnails in search results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    await searchInput.fill('music video');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    // Check for thumbnail images
    const thumbnails = page.locator('[data-testid="search-results"] img');
    await expect(thumbnails.first()).toBeVisible();
    
    // Verify thumbnail has src attribute
    const firstThumbnail = thumbnails.first();
    const src = await firstThumbnail.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('http');
  });

  test('should navigate back from request form to search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"]');
    
    // Navigate to request form
    await searchInput.fill('navigate test');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    const firstResult = page.locator('[data-testid="search-results"]').locator('> div').first();
    await firstResult.click();

    // Look for back button
    const backButton = page.locator('button:has-text(/back|cancel/i)');
    if (await backButton.isVisible()) {
      await backButton.click();

      // Should return to search interface
      await expect(searchInput).toBeVisible();
    }
  });
});
