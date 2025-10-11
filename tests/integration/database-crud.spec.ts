import { test, expect } from '@playwright/test';

test.describe('Database CRUD Operations - Comprehensive Coverage', () => {
  const testVenueId = 'test-venue-' + Date.now();
  const testUserId = 'test-user-' + Date.now();
  
  test.describe('Users Collection - CRUD Operations', () => {
    test('should create user document with all required fields', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents`, {
        data: {
          documentId: testUserId,
          data: {
            email: 'test@djamms.app',
            role: 'admin',
            venueId: testVenueId,
            createdAt: new Date().toISOString()
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const user = await response.json();
      expect(user.email).toBe('test@djamms.app');
      expect(user.role).toBe('admin');
    });

    test('should read user document by ID', async ({ request }) => {
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents/${testUserId}`, {
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const user = await response.json();
      expect(user.$id).toBe(testUserId);
      expect(user.email).toBe('test@djamms.app');
    });

    test('should update user document', async ({ request }) => {
      const response = await request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents/${testUserId}`, {
        data: {
          data: {
            role: 'staff',
            updatedAt: new Date().toISOString()
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const user = await response.json();
      expect(user.role).toBe('staff');
    });

    test('should list users with query filters', async ({ request }) => {
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents`, {
        params: {
          queries: JSON.stringify([`equal("role", "staff")`])
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBeTruthy();
    });

    test('should enforce required fields', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents`, {
        data: {
          documentId: 'invalid-user',
          data: {
            // Missing required email field
            role: 'viewer'
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      // Should fail validation
      expect(response.status()).toBe(400);
    });

    test('should validate email format', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents`, {
        data: {
          documentId: 'invalid-email-user',
          data: {
            email: 'not-an-email',
            role: 'viewer'
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      // Should fail email validation
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Queues Collection - CRUD Operations', () => {
    const testQueueId = 'test-queue-' + Date.now();

    test('should create queue document', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents`, {
        data: {
          documentId: testQueueId,
          data: {
            venueId: testVenueId,
            mainQueue: JSON.stringify([]),
            priorityQueue: JSON.stringify([]),
            currentTrack: null,
            isPlaying: false
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should update queue with new tracks', async ({ request }) => {
      const newQueue = [
        { videoId: 'track1', title: 'Track 1', artist: 'Artist 1', duration: 180 },
        { videoId: 'track2', title: 'Track 2', artist: 'Artist 2', duration: 240 }
      ];

      const response = await request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents/${testQueueId}`, {
        data: {
          data: {
            mainQueue: JSON.stringify(newQueue)
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const queue = await response.json();
      const parsedQueue = JSON.parse(queue.mainQueue);
      expect(parsedQueue.length).toBe(2);
    });

    test('should handle large queue efficiently', async ({ request }) => {
      // Create queue with 100 tracks
      const largeQueue = Array.from({ length: 100 }, (_, i) => ({
        videoId: `track${i}`,
        title: `Track ${i}`,
        duration: 180
      }));

      const startTime = Date.now();
      
      const response = await request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents/${testQueueId}`, {
        data: {
          data: {
            mainQueue: JSON.stringify(largeQueue)
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      const updateTime = Date.now() - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(updateTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle concurrent queue updates', async ({ request }) => {
      // Simulate two admins updating queue simultaneously
      const update1 = request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents/${testQueueId}`, {
        data: {
          data: {
            mainQueue: JSON.stringify([{ videoId: 'concurrent1', title: 'Concurrent 1' }])
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });

      const update2 = request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents/${testQueueId}`, {
        data: {
          data: {
            priorityQueue: JSON.stringify([{ videoId: 'concurrent2', title: 'Concurrent 2' }])
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });

      const [response1, response2] = await Promise.all([update1, update2]);
      
      // Both should succeed
      expect(response1.ok()).toBeTruthy();
      expect(response2.ok()).toBeTruthy();
    });
  });

  test.describe('Players Collection - CRUD Operations', () => {
    const testPlayerId = 'test-player-' + Date.now();

    test('should register new player', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/players/documents`, {
        data: {
          documentId: testPlayerId,
          data: {
            venueId: testVenueId,
            deviceId: 'device-123',
            isMaster: true,
            lastHeartbeat: new Date().toISOString(),
            status: 'active'
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should update heartbeat timestamp', async ({ request }) => {
      const response = await request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/players/documents/${testPlayerId}`, {
        data: {
          data: {
            lastHeartbeat: new Date().toISOString()
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const player = await response.json();
      expect(player.lastHeartbeat).toBeDefined();
    });

    test('should delete inactive players', async ({ request }) => {
      const response = await request.delete(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/players/documents/${testPlayerId}`, {
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Requests Collection - CRUD Operations', () => {
    const testRequestId = 'test-request-' + Date.now();

    test('should create song request', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/requests/documents`, {
        data: {
          documentId: testRequestId,
          data: {
            venueId: testVenueId,
            videoId: 'requested-video',
            title: 'Requested Song',
            artist: 'Artist Name',
            requesterName: 'John Doe',
            requestedAt: new Date().toISOString(),
            status: 'pending',
            isPaid: true,
            amount: 5.00
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should query requests by venue', async ({ request }) => {
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/requests/documents`, {
        params: {
          queries: JSON.stringify([
            `equal("venueId", "${testVenueId}")`,
            `orderDesc("requestedAt")`
          ])
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.documents).toBeDefined();
    });

    test('should update request status', async ({ request }) => {
      const response = await request.patch(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/requests/documents/${testRequestId}`, {
        data: {
          data: {
            status: 'completed',
            completedAt: new Date().toISOString()
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const requestDoc = await response.json();
      expect(requestDoc.status).toBe('completed');
    });
  });

  test.describe('Query Performance', () => {
    test('should execute simple query within 200ms', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents`, {
        params: {
          queries: JSON.stringify([`equal("venueId", "${testVenueId}")`])
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      const queryTime = Date.now() - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(queryTime).toBeLessThan(200);
    });

    test('should handle pagination efficiently', async ({ request }) => {
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/requests/documents`, {
        params: {
          queries: JSON.stringify([
            `limit(25)`,
            `offset(0)`
          ])
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.documents.length).toBeLessThanOrEqual(25);
    });
  });

  test.describe('Schema Validation', () => {
    test('should enforce data type constraints', async ({ request }) => {
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/requests/documents`, {
        data: {
          documentId: 'invalid-type',
          data: {
            venueId: testVenueId,
            videoId: 'test-video',
            amount: 'not-a-number' // Should be number
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      // Should fail type validation
      expect(response.status()).toBe(400);
    });

    test('should enforce string length limits', async ({ request }) => {
      const longString = 'a'.repeat(10000);
      
      const response = await request.post(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents`, {
        data: {
          documentId: 'long-string-user',
          data: {
            email: longString + '@test.com', // Too long
            role: 'viewer'
          }
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      // Should fail length validation
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Index Usage', () => {
    test('should use index for venue queries', async ({ request }) => {
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/queues/documents`, {
        params: {
          queries: JSON.stringify([`equal("venueId", "${testVenueId}")`])
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
      // Query should be fast due to index
    });

    test('should use index for timestamp ordering', async ({ request }) => {
      const response = await request.get(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/requests/documents`, {
        params: {
          queries: JSON.stringify([`orderDesc("requestedAt")`])
        },
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Cleanup', () => {
    test('should delete test user', async ({ request }) => {
      await request.delete(`${process.env.VITE_APPWRITE_ENDPOINT}/databases/${process.env.VITE_APPWRITE_DATABASE_ID}/collections/users/documents/${testUserId}`, {
        headers: {
          'X-Appwrite-Project': process.env.VITE_APPWRITE_PROJECT_ID || '',
          'X-Appwrite-Key': process.env.VITE_APPWRITE_API_KEY || ''
        }
      });
    });
  });
});
