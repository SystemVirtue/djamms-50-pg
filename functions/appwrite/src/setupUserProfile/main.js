/**
 * AppWrite Cloud Function: Setup New User Profile
 * 
 * Purpose: Create user profile and venue on first login
 * 
 * Flow:
 * 1. Check if user profile exists in 'users' collection
 * 2. If not: Create profile and prompt for venue setup
 * 3. If exists: Return existing profile
 */

import { Client, Databases, Users, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // Parse request body
    const { userId, venueId } = JSON.parse(req.body || '{}');

    if (!userId) {
      return res.json({
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'User ID is required'
      }, 400);
    }

    // Initialize AppWrite Admin Client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);

    const databaseId = process.env.APPWRITE_DATABASE_ID || 'main-db';
    const usersCollectionId = 'users';

    log(`Checking profile for user: ${userId}`);

    // Get user from Auth to get email
    let authUser;
    try {
      authUser = await users.get(userId);
      log(`Auth user found: ${authUser.email}`);
    } catch (err) {
      error(`User not found in Auth: ${err.message}`);
      return res.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found in authentication system'
      }, 404);
    }

    // Check if user profile exists in 'users' collection
    let userProfile;
    let isNewUser = false;

    try {
      const profiles = await databases.listDocuments(
        databaseId,
        usersCollectionId,
        [Query.equal('email', authUser.email)]
      );

      if (profiles.total > 0) {
        userProfile = profiles.documents[0];
        log(`Existing profile found: ${userProfile.$id}`);
      } else {
        isNewUser = true;
        log(`No profile found - new user`);
      }
    } catch (err) {
      error(`Error checking profile: ${err.message}`);
      isNewUser = true;
    }

    // If user profile doesn't exist, create it
    if (isNewUser) {
      log(`Creating new profile for: ${authUser.email}`);

      // If venueId not provided, return prompt
      if (!venueId) {
        return res.json({
          success: true,
          isNewUser: true,
          requiresVenueSetup: true,
          message: 'Please enter VenueID (a unique name for your venue)',
          user: {
            userId: userId,
            email: authUser.email
          }
        }, 200);
      }

      // Validate venueId
      if (!venueId || venueId.trim().length === 0) {
        return res.json({
          success: false,
          error: 'VENUE_ID_REQUIRED',
          message: 'Venue ID cannot be empty'
        }, 400);
      }

      // Create user profile
      try {
        userProfile = await databases.createDocument(
          databaseId,
          usersCollectionId,
          userId, // Use Auth userId as document ID
          {
            email: authUser.email,
            userId: userId,
            venueId: venueId.trim(),
            displayName: authUser.name || '',
            role: 'owner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );

        log(`Profile created successfully: ${userProfile.$id}`);

        return res.json({
          success: true,
          isNewUser: true,
          profileCreated: true,
          user: {
            userId: userProfile.userId,
            email: userProfile.email,
            venueId: userProfile.venueId,
            displayName: userProfile.displayName,
            role: userProfile.role
          }
        }, 201);

      } catch (err) {
        error(`Error creating profile: ${err.message}`);

        // Check if venueId already exists
        if (err.message.includes('unique') || err.code === 409) {
          return res.json({
            success: false,
            error: 'VENUE_ID_EXISTS',
            message: 'This Venue ID is already taken. Please choose another one.'
          }, 409);
        }

        return res.json({
          success: false,
          error: 'PROFILE_CREATION_FAILED',
          message: 'Failed to create user profile. Please try again.'
        }, 500);
      }
    }

    // User profile exists - return it
    return res.json({
      success: true,
      isNewUser: false,
      user: {
        userId: userProfile.userId,
        email: userProfile.email,
        venueId: userProfile.venueId,
        displayName: userProfile.displayName,
        role: userProfile.role
      }
    }, 200);

  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    return res.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    }, 500);
  }
};
