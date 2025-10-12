import { test } from '@playwright/test';

test('minimal dashboard load test', async ({ page }) => {
  console.log('1. Setting up page...');
  
  // Block redirects
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('userData', JSON.stringify({ $id: 'test', email: 'test@test.com' }));
    
    // Block window.location changes
    let realLocation = window.location.href;
    Object.defineProperty(window, 'location', {
      get: () => ({ href: realLocation }),
      set: (val) => { console.log('BLOCKED REDIRECT TO:', val); }
    });
  });

  console.log('2. Attempting navigation with networkidle...');
  try {
    await page.goto('http://localhost:3005/test-user', { 
      waitUntil: 'networkidle',
      timeout: 5000 
    });
    console.log('✅ Loaded with networkidle');
  } catch (e) {
    console.log('❌ Failed with networkidle:', (e as Error).message);
  }

  console.log('3. Attempting navigation with commit...');
  try {
    await page.goto('http://localhost:3005/test-user', { 
      waitUntil: 'commit',
      timeout: 5000 
    });
    console.log('✅ Loaded with commit');
  } catch (e) {
    console.log('❌ Failed with commit:', (e as Error).message);
  }

  console.log('4. Attempting navigation with no wait...');
  try {
    const response = await page.goto('http://localhost:3005/test-user', { 
      waitUntil: 'commit',
      timeout: 5000 
    });
    console.log('✅ Response status:', response?.status());
    console.log('✅ Can access page');
    
    // Wait a bit and check what's on the page
    await page.waitForTimeout(1000);
    const text = await page.evaluate(() => document.body.textContent?.substring(0, 100));
    console.log('Page content:', text);
  } catch (e) {
    console.log('❌ Complete failure:', (e as Error).message);
  }
});
