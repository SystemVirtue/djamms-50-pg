const { Client, Databases, Query } = require('node-appwrite');
const { v4: uuidv4 } = require('uuid');

/**
 * Process paid song request and add to priority queue
 * Cloud Functions v5 format
 */
module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const body = req.bodyJson || JSON.parse(req.body || '{}');
    const { venueId, song, paymentId, requesterId } = body;

    if (!venueId || !song || !paymentId || !requesterId) {
      return res.json(
        { success: false, error: 'Missing required fields' },
        400
      );
    }

    log(`Processing request for venue ${venueId}: ${song.title}`);

    // Validate song duration (<5 minutes)
    if (song.duration > 300) {
      return res.json(
        { success: false, error: 'Song duration exceeds 5 minutes' },
        400
      );
    }

    // Check for too many requests from same artist in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    try {
      const recentRequests = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'requests',
        [
          Query.equal('venueId', venueId),
          Query.greaterThan('timestamp', thirtyMinutesAgo),
        ]
      );

      const sameArtistCount = recentRequests.documents.filter((req) => {
        const reqSong = typeof req.song === 'string' ? JSON.parse(req.song) : req.song;
        return reqSong.artist === song.artist;
      }).length;

      if (sameArtistCount >= 3) {
        return res.json(
          { success: false, error: 'Too many requests for this artist in the last 30 minutes' },
          429
        );
      }
    } catch (queryError) {
      log('Warning: Could not check recent requests: ' + queryError.message);
    }

    // Get venue queue
    let queue;
    try {
      const queueDocs = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'queues',
        [Query.equal('venueId', venueId)]
      );

      if (queueDocs.documents.length > 0) {
        queue = queueDocs.documents[0];
      } else {
        // Create new queue
        queue = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          'queues',
          'unique()',
          {
            venueId,
            mainQueue: JSON.stringify([]),
            priorityQueue: JSON.stringify([]),
            createdAt: new Date().toISOString(),
          }
        );
      }
    } catch (queueError) {
      error('Failed to get/create queue: ' + queueError.message);
      return res.json(
        { success: false, error: 'Queue access failed' },
        500
      );
    }

    // Parse queues
    const priorityQueue = JSON.parse(queue.priorityQueue || '[]');

    // Add to priority queue
    const newRequest = {
      ...song,
      requesterId,
      paymentId,
      paidCredit: 0.5,
      position: priorityQueue.length + 1,
      isRequest: true,
      timestamp: new Date().toISOString()
    };

    priorityQueue.push(newRequest);

    // Update queue
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'queues',
      queue.$id,
      {
        priorityQueue: JSON.stringify(priorityQueue),
        updatedAt: new Date().toISOString(),
      }
    );

    // Create request record
    const requestRecord = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'requests',
      'unique()',
      {
        requestId: uuidv4(),
        venueId,
        song: JSON.stringify(song),
        requesterId,
        paymentId,
        status: 'queued',
        timestamp: new Date().toISOString(),
      }
    );

    log(`Request processed successfully. Queue position: ${priorityQueue.length}`);

    return res.json({
      success: true,
      requestId: requestRecord.requestId,
      queuePosition: priorityQueue.length,
      estimatedWait: priorityQueue.length * 3.5 // Average song length in minutes
    });

  } catch (err) {
    error('Process request failed: ' + err.message);
    return res.json(
      { success: false, error: err.message },
      500
    );
  }
};
