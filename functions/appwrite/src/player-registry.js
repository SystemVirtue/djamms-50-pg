// functions/appwrite/src/player-registry.js
const { Client, Databases, Query } = require('appwrite');

/**
 * Register a master player for a venue
 */
exports.registerMasterPlayer = async ({ venueId, deviceId, userAgent }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Cleanup expired players first
    await cleanupExpiredPlayers(databases);

    // Check for existing active master
    const existingMaster = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      [Query.equal('venueId', venueId), Query.equal('status', 'active')]
    );

    if (existingMaster.documents.length > 0) {
      const currentMaster = existingMaster.documents[0];

      // If same device, reconnect
      if (currentMaster.deviceId === deviceId) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'players',
          currentMaster.$id,
          {
            lastHeartbeat: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          }
        );
        return {
          status: 'reconnected',
          playerId: currentMaster.$id,
          currentMaster: {
            deviceId: currentMaster.deviceId,
            lastHeartbeat: currentMaster.lastHeartbeat,
          },
        };
      }

      // Check if master is still active (last heartbeat < 2 minutes)
      if (Date.now() - currentMaster.lastHeartbeat < 120000) {
        return {
          status: 'conflict',
          currentMaster: {
            deviceId: currentMaster.deviceId,
            lastHeartbeat: currentMaster.lastHeartbeat,
          },
        };
      }

      // Expire old master
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        currentMaster.$id,
        {
          status: 'offline',
          expiresAt: Date.now(),
        }
      );
    }

    // Register new master player
    const player = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      'unique()',
      {
        venueId,
        deviceId,
        userAgent,
        status: 'active',
        lastHeartbeat: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: new Date().toISOString(),
      }
    );

    return { status: 'registered', playerId: player.$id };
  } catch (error) {
    console.error('Player registration failed:', error);
    throw error;
  }
};

/**
 * Handle player heartbeat
 */
exports.handlePlayerHeartbeat = async ({ venueId, deviceId }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const players = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      [
        Query.equal('venueId', venueId),
        Query.equal('deviceId', deviceId),
        Query.equal('status', 'active'),
      ]
    );

    if (players.documents.length > 0) {
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        players.documents[0].$id,
        {
          lastHeartbeat: Date.now(),
        }
      );
      return { status: 'updated' };
    }

    return { status: 'not_found' };
  } catch (error) {
    console.error('Heartbeat failed:', error);
    throw error;
  }
};

/**
 * Cleanup expired players
 */
exports.cleanupExpiredPlayers = cleanupExpiredPlayers;

async function cleanupExpiredPlayers(databases) {
  try {
    const expiredPlayers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'players',
      [Query.lessThan('expiresAt', Date.now())]
    );

    for (const player of expiredPlayers.documents) {
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        player.$id,
        { status: 'offline' }
      );
    }

    return { cleaned: expiredPlayers.documents.length };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return { cleaned: 0 };
  }
}
