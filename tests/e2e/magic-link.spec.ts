import { test, expect } from '@playwright/test';

test.describe('Magic Link Authentication', () => {
  test('should send magic link and handle callback successfully', async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Navigate to auth page
    await page.goto('http://localhost:3002');
    await expect(page).toHaveTitle(/DJAMMS/i);

    // Step 2: Fill in email
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);

    // Step 3: Submit form
    await page.click('button[type="submit"]');

    // Step 4: Wait for success message
    await page.waitForSelector('text=/Magic link sent|Check your email/i', { timeout: 10000 });
    
    // Check for console errors during submission
    expect(consoleErrors.length).toBe(0);
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors);
    }

    // Step 5: Simulate getting the magic link via API
    const createResponse = await page.request.post(
      'https://syd.cloud.appwrite.io/v1/functions/68e5a317003c42c8bb6a/executions',
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': '68cc86c3002b27e13947',
        },
        data: {
          body: JSON.stringify({
            action: 'create',
            email: testEmail,
            redirectUrl: 'http://localhost:3002/auth/callback',
          }),
        },
      }
    );

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    const responseBody = JSON.parse(createData.responseBody);
    
    expect(responseBody.success).toBe(true);
    expect(responseBody.magicLink).toBeTruthy();
    expect(responseBody.token).toBeTruthy();

    // Step 6: Navigate to the magic link
    await page.goto(responseBody.magicLink);

    // Step 7: Wait for authentication to complete
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10000 });

    // Step 8: Verify JWT token is stored
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(authToken).toBeTruthy();

    // Step 9: Verify user data is stored
    const userData = await page.evaluate(() => localStorage.getItem('userData'));
    expect(userData).toBeTruthy();
    
    const user = JSON.parse(userData!);
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe('staff');

    // Step 10: Final check for console errors
    expect(consoleErrors.length).toBe(0);
    if (consoleErrors.length > 0) {
      console.log('Console errors detected during full flow:', consoleErrors);
    }
  });

  test('should display error for invalid magic link', async ({ page }) => {
    // Navigate directly to callback with invalid params
    await page.goto('http://localhost:3002/auth/callback?secret=invalid&userId=test@example.com');

    // Should show error message
    await expect(page.locator('text=/Authentication Error|Invalid/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle expired magic link', async ({ page }) => {
    // This would require creating a link and waiting 15+ minutes, so we'll just
    // verify the UI handles errors gracefully
    await page.goto('http://localhost:3002/auth/callback?secret=expired123&userId=test@example.com');
    await expect(page.locator('text=/Error|Invalid|Expired/i')).toBeVisible({ timeout: 5000 });
  });

  test('should have no console errors on auth page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3002');
    
    // Wait a moment for any delayed errors
    await page.waitForTimeout(2000);

    expect(consoleErrors.length).toBe(0);
    if (consoleErrors.length > 0) {
      console.log('Console errors on page load:', consoleErrors);
    }
  });
});
