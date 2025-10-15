/**
 * AppWrite Cloud Function: Validate and Send Magic Link
 * 
 * Purpose: Only allow registered users to receive magic links
 * 
 * Flow:
 * 1. Check if email exists in AppWrite Auth (users collection)
 * 2. If exists: Generate and send magic link
 * 3. If not exists: Return error for frontend to display
 */

import { Client, Users, Account, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // Parse request body
    const { email } = JSON.parse(req.body || '{}');

    if (!email) {
      return res.json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email address is required'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Please enter a valid email address'
      }, 400);
    }

    // Initialize AppWrite Admin Client (server-side with API key)
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY); // Server API key with users.read permission

    const users = new Users(client);

    // Check if user exists in AppWrite Auth
    log(`Checking if user exists: ${email}`);
    
    let userExists = false;
    let userId = null;

    try {
      // List users by email (searches the 'identifier' field in Auth)
      const userList = await users.list([
        `email=${email}`
      ]);

      if (userList.total > 0) {
        userExists = true;
        userId = userList.users[0].$id;
        log(`User found: ${userId}`);
      } else {
        log(`User not found: ${email}`);
      }
    } catch (err) {
      log(`Error checking user: ${err.message}`);
      // If error checking, assume user doesn't exist
      userExists = false;
    }

    // If user doesn't exist in Auth, reject
    if (!userExists) {
      return res.json({
        success: false,
        error: 'USER_NOT_REGISTERED',
        message: 'Email is not registered - please enter a valid email address!'
      }, 403);
    }

    // User exists - generate and send magic link
    log(`Generating magic link for: ${email}`);

    // Initialize Account client (for magic URL creation)
    // Note: We need to use createMagicURLToken instead of createMagicURLSession
    // because we're on the server side
    try {
      const token = await users.createMagicURLToken(
        userId,
        email,
        `${process.env.FRONTEND_URL || 'https://djamms.app'}/auth/callback`
      );

      log(`Magic link sent to: ${email}`);

      return res.json({
        success: true,
        message: 'Magic link sent! Check your email.',
        userId: userId // Return userId for frontend reference
      }, 200);

    } catch (err) {
      error(`Error creating magic URL: ${err.message}`);
      
      // Check for rate limit errors
      if (err.message.includes('rate limit') || err.code === 429) {
        return res.json({
          success: false,
          error: 'RATE_LIMIT',
          message: 'Too many attempts. Please try again in a few minutes.'
        }, 429);
      }

      return res.json({
        success: false,
        error: 'MAGIC_LINK_FAILED',
        message: 'Failed to send magic link. Please try again.'
      }, 500);
    }

  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    return res.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    }, 500);
  }
};
