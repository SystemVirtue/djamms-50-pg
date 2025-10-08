const { Client, Databases, Query } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const body = req.bodyJson || JSON.parse(req.body || '{}');
    const { action, venueId, deviceId, userAgent } = body;

    log(`Player-registry: action=${action}, venueId=${venueId}, deviceId=${deviceId}`);

    if (action === 'register') {
      if (!venueId || !deviceId || !userAgent) {
        return res.json({ success: false, error: 'Missing required fields' }, 400);
      }

      const now = Date.now();
      
      try {
        const expired = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          'players',
          [Query.lessThan('expiresAt', now)]
        );

        for (const player of expired.documents) {
          await databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID,
            'players',
            player.$id
          );
        }
        log(`Cleaned up ${expired.documents.length} expired players`);
      } catch (cleanupError) {
        log('Cleanup warning: ' + cleanupError.message);
      }

      const existing = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        [
          Query.equal('venueId', [venueId]),
          Query.equal('status', ['active'])
        ]
      );

      if (existing.documents.length > 0) {
        const current = existing.documents[0];

        if (current.deviceId === deviceId) {
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            'players',
            current.$id,
            {
              lastHeartbeat: now,
              expiresAt: now + 2 * 60 * 1000
            }
          );

          log(`Device reconnected: ${deviceId}`);
          return res.json({
            success: true,
            isMaster: true,
            playerId: current.$id,
            status: 'reconnected'
          });
        }

        if (current.lastHeartbeat > now - 2 * 60 * 1000) {
          log(`Master conflict: ${current.deviceId} still active`);
          return res.json({
            success: false,
            isMaster: false,
            reason: 'MASTER_ACTIVE',
            currentMaster: {
              deviceId: current.deviceId,
              lastHeartbeat: current.lastHeartbeat
            }
          });
        }

        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'players',
          current.$id,
          { status: 'offline', expiresAt: now }
        );
      }

      const player = await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        'unique()',
        {
          playerId: `player_${Date.now()}`,
          venueId,
          deviceId,
          userAgent,
          status: 'active',
          lastHeartbeat: now,
          expiresAt: now + 2 * 60 * 1000,
          createdAt: new Date().toISOString()
        }
      );

      log(`New master registered: ${deviceId}`);
      return res.json({
        success: true,
        isMaster: true,
        playerId: player.$id,
        status: 'registered'
      });
    }

    if (action === 'heartbeat') {
      if (!venueId || !deviceId) {
        return res.json({ success: false, error: 'Missing required fields' }, 400);
      }

      const players = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        [
          Query.equal('venueId', [venueId]),
          Query.equal('deviceId', [deviceId]),
          Query.equal('status', ['active'])
        ]
      );

      if (players.documents.length === 0) {
        return res.json({ success: false, error: 'Player not found or not active' }, 404);
      }

      const player = players.documents[0];
      const now = Date.now();

      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        player.$id,
        {
          lastHeartbeat: now,
          expiresAt: now + 2 * 60 * 1000
        }
      );

      return res.json({ success: true, message: 'Heartbeat updated' });
    }

    if (action === 'status') {
      if (!venueId) {
        return res.json({ success: false, error: 'Missing venueId' }, 400);
      }

      const now = Date.now();
      const players = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        [
          Query.equal('venueId', [venueId]),
          Query.equal('status', ['active']),
          Query.greaterThan('expiresAt', now)
        ]
      );

      if (players.documents.length > 0) {
        const master = players.documents[0];
        return res.json({
          success: true,
          hasMaster: true,
          deviceId: master.deviceId,
          lastHeartbeat: master.lastHeartbeat
        });
      }

      return res.json({ success: true, hasMaster: false });
    }

    if (action === 'release') {
      if (!venueId || !deviceId) {
        return res.json({ success: false, error: 'Missing required fields' }, 400);
      }

      const players = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'players',
        [
          Query.equal('venueId', [venueId]),
          Query.equal('deviceId', [deviceId])
        ]
      );

      if (players.documents.length > 0) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'players',
          players.documents[0].$id,
          { status: 'offline', expiresAt: Date.now() }
        );
      }

      return res.json({ success: true, message: 'Master status released' });
    }

    return res.json({ success: false, error: 'Invalid action' }, 400);

  } catch (err) {
    error('Player-registry error: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
