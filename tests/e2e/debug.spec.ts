import { test, expect } from '@playwright/test';

test('debug player load', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  // Listen for request failures
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to player...');
  await page.goto('/player/venue1');

  console.log('Waiting for load state...');
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  console.log('Checking root element...');
  const root = await page.locator('#root').innerHTML();
  console.log('Root innerHTML:', root);

  console.log('Checking for errors...');
  const errorText = await page.locator('body').textContent();
  console.log('Body text:', errorText);

  // Take a screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved to debug-screenshot.png');
});
