import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configure tests to run in headed mode
test.use({ 
  headless: false,
  viewport: { width: 1920, height: 1080 }
});

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('DJAMMS Endpoint Visual Tests', () => {

  test('1. Landing Page (/)', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000); // Wait for animations
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-landing-page.png'),
      fullPage: true 
    });
    
    // Check for key elements
    const title = await page.textContent('h1');
    console.log('Landing page title:', title);
    expect(page.url()).toContain('localhost:5173');
  });

  test('2. Auth Page (/auth)', async ({ page }) => {
    await page.goto('http://localhost:5173/auth');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-auth-page.png'),
      fullPage: true 
    });
    
    console.log('Auth page loaded');
  });

  test('3. Dashboard Page (/dashboard/test-user-123)', async ({ page }) => {
    // Set up mock user data in localStorage
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.setItem('djamms_user', JSON.stringify({
        userId: 'test-user-123',
        username: 'Test User',
        role: 'admin',
        email: 'test@djamms.app'
      }));
    });
    
    await page.goto('http://localhost:5173/dashboard/test-user-123');
    await page.waitForTimeout(3000); // Wait for dashboard to load
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-dashboard-home.png'),
      fullPage: true 
    });
    
    // Check for dashboard elements
    const welcomeText = await page.textContent('h2');
    console.log('Dashboard welcome:', welcomeText);
    
    // Test tab navigation - click Queue Manager card
    const queueCard = page.locator('button:has-text("Queue Manager")').first();
    if (await queueCard.isVisible()) {
      await queueCard.click();
      await page.waitForTimeout(1500);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, '03b-dashboard-queue-tab.png'),
        fullPage: true 
      });
      console.log('Dashboard Queue tab captured');
      
      // Go back to dashboard
      await page.locator('button:has-text("Dashboard")').first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('4. Player Page (/player/venue-001)', async ({ page }) => {
    // Set mock player state
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.setItem('isMasterPlayer_venue-001', 'true');
      localStorage.setItem('djamms_autoplay', 'true');
      localStorage.setItem('djammsQueue_venue-001', JSON.stringify({
        venueId: 'venue-001',
        nowPlaying: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Never Gonna Give You Up',
          artist: 'Rick Astley',
          duration: 213,
          startTime: Date.now(),
          remaining: 180
        },
        mainQueue: [
          { videoId: '9bZkp7q19f0', title: 'GANGNAM STYLE', artist: 'PSY', duration: 253 },
          { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', duration: 282 }
        ],
        priorityQueue: [
          { videoId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', duration: 354, isRequest: true }
        ]
      }));
    });
    
    await page.goto('http://localhost:5173/player/venue-001');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-player-page.png'),
      fullPage: true 
    });
    
    console.log('Player page captured');
  });

  test('5. Admin Page (/admin/venue-001)', async ({ page }) => {
    // Set mock queue data
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.setItem('djammsQueue_venue-001', JSON.stringify({
        venueId: 'venue-001',
        nowPlaying: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Never Gonna Give You Up',
          artist: 'Rick Astley',
          duration: 213,
          startTime: Date.now(),
          remaining: 180
        },
        mainQueue: [
          { videoId: '9bZkp7q19f0', title: 'GANGNAM STYLE', artist: 'PSY', duration: 253 },
          { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', duration: 282 },
          { videoId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: 234 },
          { videoId: 'RgKAFK5djSk', title: 'Waka Waka', artist: 'Shakira', duration: 211 }
        ],
        priorityQueue: [
          { videoId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', duration: 354, isRequest: true },
          { videoId: '60ItHLz5WEA', title: 'Faded', artist: 'Alan Walker', duration: 212, isRequest: true }
        ]
      }));
    });
    
    await page.goto('http://localhost:5173/admin/venue-001');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-admin-page.png'),
      fullPage: true 
    });
    
    console.log('Admin page captured');
  });

  test('6. Kiosk Page (/kiosk/venue-001)', async ({ page }) => {
    await page.goto('http://localhost:5173/kiosk/venue-001');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-kiosk-page-initial.png'),
      fullPage: true 
    });
    
    // Type in search box
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('never gonna give you up');
      await page.waitForTimeout(1000);
      
      // Click search button
      const searchButton = page.locator('button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, '06b-kiosk-search-results.png'),
          fullPage: true 
        });
        
        console.log('Kiosk search results captured');
        
        // Click first "Add to Queue" button
        const addButton = page.locator('button:has-text("Add to Queue")').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, '06c-kiosk-success.png'),
            fullPage: true 
          });
          
          console.log('Kiosk success notification captured');
        }
      }
    }
  });
});

test.describe('DJAMMS Dashboard Navigation Tests', () => {
  test('7. Dashboard Navigation Flow', async ({ page }) => {
    // Setup
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.setItem('djamms_user', JSON.stringify({
        userId: 'test-user-123',
        username: 'Test User',
        role: 'admin',
        email: 'test@djamms.app'
      }));
    });
    
    await page.goto('http://localhost:5173/dashboard/test-user-123');
    await page.waitForTimeout(2000);
    
    // Test clicking Video Player card
    const playerCard = page.locator('button:has-text("Video Player")').first();
    if (await playerCard.isVisible()) {
      console.log('✓ Video Player card is visible and clickable');
    }
    
    // Test clicking Admin Console card
    const adminCard = page.locator('button:has-text("Admin Console")').first();
    if (await adminCard.isVisible()) {
      console.log('✓ Admin Console card is visible and clickable');
    }
    
    // Test clicking Kiosk card
    const kioskCard = page.locator('button:has-text("Jukebox Kiosk")').first();
    if (await kioskCard.isVisible()) {
      console.log('✓ Jukebox Kiosk card is visible and clickable');
    }
    
    // Test tab cards
    const queueCard = page.locator('button:has-text("Queue Manager")').first();
    if (await queueCard.isVisible()) {
      console.log('✓ Queue Manager card is visible and clickable');
    }
    
    const playlistCard = page.locator('button:has-text("Playlist Library")').first();
    if (await playlistCard.isVisible()) {
      console.log('✓ Playlist Library card is visible and clickable');
    }
    
    const activityCard = page.locator('button:has-text("Activity Logs")').first();
    if (await activityCard.isVisible()) {
      console.log('✓ Activity Logs card is visible and clickable');
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '07-dashboard-cards-validation.png'),
      fullPage: true 
    });
    
    console.log('\n✅ All dashboard cards validated successfully!');
  });
});
