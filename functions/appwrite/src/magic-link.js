// functions/appwrite/src/magic-link.js
const { Client, Databases, Query } = require('appwrite');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Create and send a magic link for authentication
 */
exports.createMagicURLSession = async ({ email, redirectUrl }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  try {
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'magicLinks',
      'unique()',
      {
        email,
        token,
        redirectUrl: redirectUrl || process.env.VITE_APPWRITE_MAGIC_REDIRECT,
        expiresAt,
        used: false,
      }
    );

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // await sendMagicLinkEmail(email, token, redirectUrl);
    console.log(`Magic link created for ${email}: ${token}`);

    return { success: true, message: 'Magic link sent to your email' };
  } catch (error) {
    console.error('Magic link creation failed:', error);
    throw new Error('Failed to create magic link');
  }
};

/**
 * Handle magic link callback and issue JWT
 */
exports.handleMagicLinkCallback = async ({ secret, userId }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const magicLinks = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'magicLinks',
      [
        Query.equal('token', secret),
        Query.equal('used', false),
        Query.greaterThan('expiresAt', Date.now()),
      ]
    );

    if (magicLinks.documents.length === 0) {
      throw new Error('Invalid or expired magic link');
    }

    const magicLink = magicLinks.documents[0];

    // Find or create user
    let user = await findUserByEmail(databases, magicLink.email);

    if (!user && process.env.VITE_ALLOW_AUTO_CREATE_USERS === 'true') {
      user = await createUser(databases, {
        userId: userId || require('uuid').v4(),
        email: magicLink.email,
        role: 'staff',
        autoplay: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (!user) {
      throw new Error('User not found and auto-creation is disabled');
    }

    // Mark magic link as used
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'magicLinks',
      magicLink.$id,
      { used: true }
    );

    // Issue JWT
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        venueId: user.venueId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  } catch (error) {
    console.error('Magic link callback failed:', error);
    throw error;
  }
};

async function findUserByEmail(databases, email) {
  const users = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    'users',
    [Query.equal('email', email)]
  );
  return users.documents[0];
}

async function createUser(databases, userData) {
  return await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    'users',
    userData.userId,
    userData
  );
}

// Placeholder for email service integration
async function sendMagicLinkEmail(email, token, redirectUrl) {
  // TODO: Integrate with actual email service
  const magicLinkUrl = `${redirectUrl}?secret=${token}&userId=${email}`;
  console.log(`Magic link URL: ${magicLinkUrl}`);
}
