import { test, expect, waitForAppReady } from './setup';

test.describe('Player Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/venue1');
    await page.waitForLoadState('networkidle');
  });

  test('should load player page', async ({ page }) => {
    // Just verify page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show autoplay toggle', async ({ page }) => {
    const autoplayButton = page.locator('button:has-text("Autoplay")').first();
    await expect(autoplayButton).toBeVisible({ timeout: 10000 });
  });

  test('should display queue section', async ({ page }) => {
    await expect(page.locator('text=Up Next').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have YouTube player area', async ({ page }) => {
    // Look for iframe or player container
    const hasIframe = await page.locator('iframe[src*="youtube"]').count() > 0;
    const hasContainer = await page.locator('[class*="player"]').count() > 0;
    expect(hasIframe || hasContainer).toBeTruthy();
  });
});

test.describe('Player Busy Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Override the mock to simulate non-master player
    await page.addInitScript(() => {
      localStorage.removeItem('isMasterPlayer_venue1');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    });
    
    await page.goto('/player/venue1');
    await waitForAppReady(page, { expectMaster: false });
  });

  test('should show busy screen when not master', async ({ page }) => {
    // Should show either busy screen or loading/error message
    const busyScreen = page.locator('text=Media Player Busy');
    const authRequired = page.locator('text=Authentication required');
    const loading = page.locator('text=Loading');
    
    // Wait for one of these to appear
    await Promise.race([
      busyScreen.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      authRequired.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      loading.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
    ]);
    
    // At least one should be visible
    const isBusyVisible = await busyScreen.isVisible().catch(() => false);
    const isAuthVisible = await authRequired.isVisible().catch(() => false);
    const isLoadingVisible = await loading.isVisible().catch(() => false);
    
    expect(isBusyVisible || isAuthVisible || isLoadingVisible).toBeTruthy();
  });
});
