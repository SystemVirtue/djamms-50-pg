// functions/appwrite/src/processRequest.js
const { Client, Databases, Query } = require('appwrite');
const { v4: uuidv4 } = require('uuid');

/**
 * Process paid song request and add to priority queue
 */
exports.main = async ({ venueId, song, paymentId, requesterId }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Validate song duration (<5 minutes)
    if (song.duration > 300) {
      throw new Error('Song duration exceeds 5 minutes');
    }

    // Check for too many requests from same artist in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const recentRequests = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'requests',
      [
        Query.equal('venueId', venueId),
        Query.greaterThan('timestamp', thirtyMinutesAgo),
      ]
    );

    const sameArtistCount = recentRequests.documents.filter(
      (req) => {
        const reqSong = typeof req.song === 'string' ? JSON.parse(req.song) : req.song;
        return reqSong.artist === song.artist;
      }
    ).length;

    if (sameArtistCount >= 3) {
      throw new Error('Too many requests for this artist in the last 30 minutes');
    }

    // Get venue queue
    const queueDoc = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'queues',
      [Query.equal('venueId', venueId)]
    );

    let queue;
    if (queueDoc.documents.length > 0) {
      queue = queueDoc.documents[0];
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

    // Parse queues
    const priorityQueue = JSON.parse(queue.priorityQueue || '[]');
    const mainQueue = JSON.parse(queue.mainQueue || '[]');

    // Add to priority queue
    priorityQueue.push({
      ...song,
      requesterId,
      paidCredit: 0.5,
      position: priorityQueue.length + 1,
      isRequest: true,
    });

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
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'requests',
      'unique()',
      {
        requestId: uuidv4(),
        venueId,
        song: JSON.stringify(song),
        status: 'pending',
        paymentId,
        timestamp: new Date().toISOString(),
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Request processing failed:', error);
    
    // TODO: Trigger refund via Stripe webhook
    // await refundPayment(paymentId);
    
    return { success: false, error: error.message };
  }
};
