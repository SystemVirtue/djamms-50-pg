// E2E Test Setup with AppWrite Mocking
// This file provides mock implementations for AppWrite services
// to enable E2E testing without deployed functions

import { test as base } from '@playwright/test';

// Extend Playwright test with mock setup
export const test = base.extend({
  page: async ({ page }, use) => {
    // Setup mocks before each test
    await setupAppWriteMocks(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Setup AppWrite API mocks for E2E testing
 * Intercepts all AppWrite API calls and returns mock responses
 */
async function setupAppWriteMocks(page: any) {
  // Mock AppWrite health endpoint
  await page.route('**/v1/health', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'pass',
        version: '1.0.0'
      }),
    });
  });

  // Mock magic-link function (authentication)
  await page.route('**/functions/magic-link', (route: any) => {
    const request = route.request();
    const method = request.method();

    if (method === 'POST') {
      // Mock sending magic link
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Magic link sent successfully',
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock magic-link callback
  await page.route('**/functions/magic-link/callback', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          userId: 'mock-user-123',
          email: 'test@example.com',
          role: 'admin',
          venueId: 'venue1',
          autoplay: true,
        },
      }),
    });
  });

  // Mock auth/verify endpoint (used by getCurrentSession)
  await page.route('**/functions/auth/verify', (route: any) => {
    const authHeader = route.request().headers()['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          userId: 'mock-user-123',
        }),
      });
    } else {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    }
  });

  // Mock player-registry function
  await page.route('**/functions/player-registry/**', (route: any) => {
    const url = route.request().url();
    console.log('[ROUTE MOCK] player-registry:', url);
    
    if (url.includes('/status')) {
      // Mock master status check - return our mock device as master
      console.log('[ROUTE MOCK] Returning master status');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          masterDeviceId: 'mock-device-123', // Matches the deviceId in localStorage
        }),
      });
    } else if (url.includes('/register')) {
      // Mock master player registration
      console.log('[ROUTE MOCK] Returning player registration success');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isMaster: true,
          playerId: 'mock-player-' + Date.now(),
          message: 'Master player registered',
        }),
      });
    } else if (url.includes('/heartbeat')) {
      // Mock heartbeat
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          acknowledged: true,
        }),
      });
    } else if (url.includes('/check')) {
      // Mock master status check
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exists: false,
          isMaster: true,
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock database queries (read queue)
  await page.route('**/databases/*/collections/queues/documents', (route: any) => {
    const method = route.request().method();

    if (method === 'GET') {
      // Mock queue data
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total: 1,
          documents: [
            {
              $id: 'queue-venue1',
              venueId: 'venue1',
              nowPlaying: {
                videoId: 'abc123',
                title: 'Test Song',
                artist: 'Test Artist',
                duration: 180,
                startTime: Date.now(),
                remaining: 180,
              },
              mainQueue: [
                {
                  videoId: 'def456',
                  title: 'Next Song',
                  artist: 'Next Artist',
                  duration: 200,
                  position: 1,
                },
              ],
              priorityQueue: [],
            },
          ],
        }),
      });
    } else if (method === 'POST') {
      // Mock queue creation
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          $id: 'queue-' + Date.now(),
          venueId: 'venue1',
          nowPlaying: null,
          mainQueue: [],
          priorityQueue: [],
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock database queries (read players)
  await page.route('**/databases/*/collections/players/documents', (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total: 0,
        documents: [], // No active players
      }),
    });
  });

  // Mock realtime subscription (WebSocket)
  await page.addInitScript(() => {
    // Override WebSocket for realtime subscriptions
    (window as any).WebSocket = class MockWebSocket {
      onopen: any;
      onmessage: any;
      onerror: any;
      onclose: any;

      constructor(url: string) {
        console.log('[MOCK] WebSocket connection to:', url);
        setTimeout(() => {
          if (this.onopen) this.onopen({});
        }, 100);
      }

      send(data: string) {
        console.log('[MOCK] WebSocket send:', data);
      }

      close() {
        console.log('[MOCK] WebSocket closed');
        if (this.onclose) this.onclose({});
      }
    };
  });

  // Setup mock authentication in localStorage BEFORE page loads
  await page.addInitScript(() => {
    // Mock session data with proper JWT structure
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtb2NrLXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwidmVudWVJZCI6InZlbnVlMSIsImV4cCI6OTk5OTk5OTk5OX0.mock';
    
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('userData', JSON.stringify({
      userId: 'mock-user-123',
      email: 'test@example.com',
      role: 'admin',
      venueId: 'venue1',
      autoplay: true,
    }));
    localStorage.setItem('isMasterPlayer_venue1', 'true');
    localStorage.setItem('djammsAutoplay', 'true');
    
    // Mock device ID for player registry
    localStorage.setItem('deviceId', 'mock-device-123');
    
    // Mock queue data
    localStorage.setItem('djammsQueue_venue1', JSON.stringify({
      venueId: 'venue1',
      nowPlaying: {
        videoId: 'abc123',
        title: 'Test Song',
        duration: 180,
        artist: 'Test Artist',
        isRequest: false,
        startTime: Date.now(),
        remaining: 180,
      },
      mainQueue: [
        {
          videoId: 'def456',
          title: 'Next Song',
          duration: 200,
          artist: 'Next Artist',
          isRequest: false,
          position: 1,
        },
      ],
      priorityQueue: [],
    }));
    
    // Override fetch to mock AppWrite responses globally
    const originalFetch = window.fetch;
    (window as any).fetch = async function(url: string, options?: any): Promise<Response> {
      console.log('[MOCK FETCH]', url);
      
      // Mock auth verification endpoint
      if (url.includes('/functions/auth/verify')) {
        console.log('[MOCK] Auth verify called');
        return new Response(JSON.stringify({
          valid: true,
          userId: 'mock-user-123',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Mock player registry requests
      if (url.includes('/functions/player-registry') || url.includes('checkMasterStatus')) {
        console.log('[MOCK] Player registry called');
        return new Response(JSON.stringify({
          success: true,
          isMaster: true,
          playerId: 'mock-player-123'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Default: pass through to original fetch (will be mocked by route handlers)
      return originalFetch(url, options);
    };
  });
}

/**
 * Helper function to wait for app initialization
 */
export async function waitForAppReady(page: any, options: { expectMaster?: boolean } = {}) {
  const { expectMaster = true } = options;
  
  // Wait for React to mount (check if root has children)
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  }, { timeout: 15000 });
  
  // Wait for app to finish loading
  if (expectMaster) {
    // If expecting master player, wait for either player content or error
    await page.waitForFunction(() => {
      const body = document.body.innerText;
      return body.includes('Test Song') || 
             body.includes('Media Player Busy') || 
             body.includes('Loading');
    }, { timeout: 10000 }).catch(() => {
      // Ignore timeout - continue with test
    });
  }
  
  // Small delay for state updates
  await page.waitForTimeout(1000);
}

/**
 * Helper function to clear all mocks and reset state
 */
export async function resetMocks(page: any) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}
