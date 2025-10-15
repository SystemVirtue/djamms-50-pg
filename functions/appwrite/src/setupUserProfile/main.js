/**
 * AppWrite Cloud Function: Setup New User Profile
 * 
 * Purpose: Create user profile and venue on first login (Venue-Centric Schema)
 * 
 * Flow:
 * 1. Check if user exists in any venue.users[] array
 * 2. If not: Create user profile and optionally create venue
 * 3. If exists: Return existing venue
 */

import { Client, Databases, Users, Query, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // Parse request body
    const { userId, email, venueId } = JSON.parse(req.body || '{}');

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

    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'main-db';

    log(`Setting up profile for user: ${userId}`);

    // Get user from Auth to get email
    let authUser;
    let userEmail = email;
    
    try {
      authUser = await users.get(userId);
      userEmail = authUser.email;
      log(`Auth user found: ${userEmail}`);
    } catch (err) {
      error(`User not found in Auth: ${err.message}`);
      return res.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found in authentication system'
      }, 404);
    }

    // 1. Check if user already belongs to a venue (venue-centric lookup)
    log(`Checking if user exists in any venue...`);
    
    let existingVenues;
    try {
      // Search for user in venue.users[] arrays
      existingVenues = await databases.listDocuments(
        DATABASE_ID,
        'venues',
        [Query.search('users', userId)]
      );
      
      if (existingVenues.total > 0) {
        const venue = existingVenues.documents[0];
        log(`User already has venue: ${venue.venueId}`);
        
        return res.json({
          success: true,
          isNewUser: false,
          requiresVenueSetup: false,
          venueId: venue.$id,
          venueName: venue.name,
          user: {
            userId: userId,
            email: userEmail
          }
        }, 200);
      }
      
      log(`No existing venue found - new user`);
    } catch (err) {
      error(`Error checking venues: ${err.message}`);
      // Continue - assume new user
    }

    // 2. User is new - check if venueId provided for venue creation
    if (!venueId) {
      log(`No venueId provided - prompting for venue setup`);
      return res.json({
        success: true,
        isNewUser: true,
        requiresVenueSetup: true,
        message: 'Please enter VenueID (a unique name for your venue)',
        user: {
          userId: userId,
          email: userEmail
        }
      }, 200);
    }

    // 3. Validate venueId
    if (!venueId || venueId.trim().length === 0) {
      return res.json({
        success: false,
        error: 'VENUE_ID_REQUIRED',
        message: 'Venue ID cannot be empty'
      }, 400);
    }

    // 4. Check if venueId is already taken
    try {
      const existingVenue = await databases.listDocuments(
        DATABASE_ID,
        'venues',
        [Query.equal('venueId', venueId.trim())]
      );

      if (existingVenue.total > 0) {
        return res.json({
          success: false,
          error: 'VENUE_ID_EXISTS',
          message: 'This Venue ID is already taken. Please choose another one.'
        }, 409);
      }
    } catch (err) {
      error(`Error checking venue availability: ${err.message}`);
    }

    // 5. Create user profile (simplified - auth only)
    try {
      await databases.createDocument(
        DATABASE_ID,
        'users',
        userId, // Use Auth userId as document ID
        {
          email: userEmail,
          name: authUser.name || '',
          preferences: {}
        }
      );

      log(`User profile created: ${userId}`);
    } catch (err) {
      // If user already exists, that's okay
      if (err.code !== 409) {
        error(`Error creating user profile: ${err.message}`);
      } else {
        log(`User profile already exists: ${userId}`);
      }
    }

    // 6. Create venue with user as owner (venue-centric)
    try {
      const newVenue = await databases.createDocument(
        DATABASE_ID,
        'venues',
        ID.unique(),
        {
          venueId: venueId.trim(),
          name: venueId.trim().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          ownerId: userId,
          users: JSON.stringify([{
            userId: userId,
            email: userEmail,
            name: authUser.name || '',
            role: 'owner',
            addedAt: new Date().toISOString(),
            addedBy: 'system'
          }]),
          playerConfig: {
            autoplay: true,
            crossfadeDuration: 3,
            volume: 85,
            defaultPlaylist: null
          },
          queueConfig: {
            mode: 'free',
            requestCost: 5.00,
            maxLength: 50,
            allowDuplicates: false,
            minDuration: 60,
            maxDuration: 600
          },
          isActive: true,
          settings: {}
        }
      );

      log(`Venue created successfully: ${newVenue.venueId} (${newVenue.$id})`);

      return res.json({
        success: true,
        isNewUser: true,
        profileCreated: true,
        venueCreated: true,
        venueId: newVenue.$id,
        venueName: newVenue.name,
        user: {
          userId: userId,
          email: userEmail,
          role: 'owner'
        }
      }, 201);

    } catch (err) {
      error(`Error creating venue: ${err.message}`);

      return res.json({
        success: false,
        error: 'VENUE_CREATION_FAILED',
        message: 'Failed to create venue. Please try again.'
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
