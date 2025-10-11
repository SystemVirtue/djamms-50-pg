import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    
    await expect(page.getByRole('heading', { name: 'DJAMMS' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Magic Link/i })).toBeVisible();
  });

  test('should handle magic link callback', async ({ page }) => {
    // Mock the API response
    await page.route('**/functions/magic-link/callback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            userId: '123',
            email: 'test@example.com',
            role: 'staff',
            venueId: 'venue1',
            autoplay: true,
            createdAt: '2023-01-01T00:00:00Z',
          },
        }),
      });
    });

    await page.goto('http://localhost:3002/callback?userId=123&secret=test-secret');

    // Should redirect to admin
    await expect(page).toHaveURL(/\/admin\/venue1/, { timeout: 10000 });
  });

  test('should show error for invalid magic link', async ({ page }) => {
    await page.goto('http://localhost:3002/callback');

    await expect(page.locator('text=Invalid magic link').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
  });
});
