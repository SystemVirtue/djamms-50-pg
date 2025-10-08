import { test, expect, waitForAppReady } from './setup';

test('quick auth check', async ({ page }) => {
  // Listen for console messages
  const logs: string[] = [];
  const errors: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });
  
  // Navigate to player
  await page.goto('/player/venue1');
  
  // Wait for app to load
  await waitForAppReady(page);
  
  // Check localStorage
  const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
  const isMaster = await page.evaluate(() => localStorage.getItem('isMasterPlayer_venue1'));
  const deviceId = await page.evaluate(() => localStorage.getItem('deviceId'));
  
  console.log('Auth token:', authToken ? 'present' : 'missing');
  console.log('Master status:', isMaster);
  console.log('Device ID:', deviceId);
  console.log('Errors:', errors);
  console.log('Total logs:', logs.length);
  
  // Check what's actually displayed
  const bodyText = await page.locator('body').textContent();
  console.log('Body contains Test Song:', bodyText?.includes('Test Song'));
  console.log('Body contains Busy:', bodyText?.includes('Media Player Busy'));
  
  // Take screenshot
  await page.screenshot({ path: 'quick-test.png', fullPage: true });
  
  // Check for either player content OR busy screen
  const hasPlayer = bodyText?.includes('Test Song') || bodyText?.includes('Autoplay');
  const hasBusyScreen = bodyText?.includes('Media Player Busy');
  
  console.log('Has player content:', hasPlayer);
  console.log('Has busy screen:', hasBusyScreen);
  
  // Show first few error logs
  if (errors.length > 0) {
    console.log('First 5 errors:');
    errors.slice(0, 5).forEach(e => console.log(' -', e));
  }
  
  // We expect it to work now
  expect(hasPlayer).toBeTruthy();
});
