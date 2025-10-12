import { test } from '@playwright/test';

/**
 * DEBUG TEST: Test localStorage approach
 */
test.describe('Dashboard Debug - localStorage Auth', () => {
  const testUserId = 'test-user-123';
  const dashboardUrl = `http://localhost:3005/${testUserId}`;

  test('should test localStorage auth approach', async ({ page }) => {
    // Set localStorage BEFORE navigation
    await page.addInitScript(() => {
      console.log('Init script running - setting localStorage');
      localStorage.setItem('authToken', 'mock-jwt-token-12345');
      localStorage.setItem('userData', JSON.stringify({
        $id: 'test-user-123',
        email: 'test@djamms.app',
        name: 'Test User',
        emailVerification: true
      }));
    });

    // Capture console logs
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.text());
    });

    // Capture network requests
    page.on('request', request => {
      console.log('REQUEST:', request.url());
    });

    page.on('requestfailed', request => {
      console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText);
    });

    // Mock the auth verification endpoint
    await page.route('**/functions/auth/verify', (route) => {
      console.log('✅ Auth verify mock called!');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          user: { $id: testUserId, email: 'test@djamms.app', name: 'Test User' }
        })
      });
    });

    // Try to navigate
    try {
      console.log('Navigating to:', dashboardUrl);
      await page.goto(dashboardUrl, { timeout: 10000, waitUntil: 'domcontentloaded' });
      console.log('✅ Page loaded successfully!');
      
      // Check what's on the page
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText?.substring(0, 200));
    } catch (error) {
      console.log('❌ Navigation failed:', (error as Error).message);
      
      // Try to get page content anyway
      try {
        const bodyText = await page.locator('body').textContent();
        console.log('Page content on failure:', bodyText?.substring(0, 200));
      } catch (e) {
        console.log('Could not get page content');
      }
    }
  });
});
