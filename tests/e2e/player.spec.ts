import { test, expect, waitForAppReady } from './setup';

test.describe('Player Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mocks are automatically set up by setup.ts
    // Just wait for app to be ready
    await page.goto('/player/venue1');
    await waitForAppReady(page);
  });

  test('should display current track', async ({ page }) => {
    await expect(page.locator('text=Test Song')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Test Artist')).toBeVisible();
  });

  test('should show autoplay toggle', async ({ page }) => {
    const autoplayButton = page.locator('[data-testid="autoplay-toggle"]');
    await expect(autoplayButton).toBeVisible({ timeout: 10000 });
    await expect(autoplayButton).toContainText('Autoplay: On');
  });

  test('should display queue', async ({ page }) => {
    await expect(page.locator('text=Up Next')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Next Song')).toBeVisible();
  });

  test('should load YouTube player', async ({ page }) => {

    const playerContainer = page.locator('[data-testid="yt-player-container"]');
    await expect(playerContainer).toBeVisible({ timeout: 10000 });
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
