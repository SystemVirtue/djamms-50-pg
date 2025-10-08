// AppWrite Cloud Function v5: magic-link
// Handles passwordless authentication via magic links

const { Client, Databases, Query } = require('node-appwrite');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Main handler for AppWrite Cloud Function
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    // Parse request
    const body = req.bodyJson || JSON.parse(req.body || '{}');
    const { action, email, token: magicToken } = body;

    log(`Magic-link: action=${action}, email=${email}`);

    // Initialize AppWrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Create magic link
    if (action === 'create') {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000;

      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        'unique()',
        {
          email,
          token,
          redirectUrl: body.redirectUrl || 'https://auth.djamms.app/callback',
          expiresAt,
          used: false
        }
      );

      log(`Magic link created: ${token}`);

      return res.json({
        success: true,
        message: 'Magic link created',
        token: token,
        magicLink: `https://auth.djamms.app/callback?token=${token}&email=${encodeURIComponent(email)}`
      });
    }

    // Verify magic link
    if (action === 'callback' || action === 'verify') {
      const response = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        [
          Query.equal('email', email),
          Query.equal('token', magicToken),
          Query.equal('used', false)
        ]
      );

      if (response.documents.length === 0) {
        return res.json({ success: false, error: 'Invalid magic link' }, 401);
      }

      const link = response.documents[0];

      if (link.expiresAt < Date.now()) {
        return res.json({ success: false, error: 'Expired magic link' }, 401);
      }

      // Mark as used
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        'magicLinks',
        link.$id,
        { used: true }
      );

      // Get or create user
      const usersResp = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        'users',
        [Query.equal('email', email)]
      );

      let user;
      if (usersResp.documents.length > 0) {
        user = usersResp.documents[0];
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'users',
          user.$id,
          { updatedAt: new Date().toISOString() }
        );
      } else {
        const newUser = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          'users',
          'unique()',
          {
            userId: `user_${Date.now()}`,
            email,
            role: 'staff',
            autoplay: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        user = newUser;
      }

      // Generate JWT
      const jwtToken = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          role: user.role,
          venueId: user.venueId,
          autoplay: user.autoplay
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      log(`JWT issued for: ${user.email}`);

      return res.json({
        success: true,
        token: jwtToken,
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          venueId: user.venueId,
          autoplay: user.autoplay
        }
      });
    }

    return res.json({ success: false, error: 'Invalid action' }, 400);

  } catch (err) {
    error(`Error: ${err.message}`);
    error(err.stack);
    return res.json({ success: false, error: err.message }, 500);
  }
};
