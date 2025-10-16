require('dotenv').config();
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

async function updateVenuesWithDefaultPlaylist() {
  try {
    console.log('🔄 Starting venue updates...\n');
    
    // 1. Get the default playlist
    console.log('📋 Fetching default playlist...');
    const playlists = await databases.listDocuments(DATABASE_ID, 'playlists');
    const defaultPlaylist = playlists.documents.find(p => p.$id === 'default_playlist');
    
    if (!defaultPlaylist) {
      console.error('❌ default_playlist not found!');
      return;
    }
    
    console.log(`✅ Found default playlist: "${defaultPlaylist.name}" with ${defaultPlaylist.tracks?.length || 0} tracks\n`);
    
    // 2. Get all venues
    console.log('🏢 Fetching venues...');
    const venues = await databases.listDocuments(DATABASE_ID, 'venues');
    console.log(`Found ${venues.total} venue(s)\n`);
    
    // 3. Get all queues
    console.log('🎵 Fetching queues...');
    const queues = await databases.listDocuments(DATABASE_ID, 'queues');
    console.log(`Found ${queues.total} queue(s)\n`);
    
    // 4. Create venue-001 if it doesn't exist
    let venue001 = venues.documents.find(v => v.venueId === 'venue-001');
    if (!venue001) {
      console.log('🆕 Creating venue-001...');
      venue001 = await databases.createDocument(
        DATABASE_ID,
        'venues',
        ID.unique(),
        {
          venueId: 'venue-001',
          name: 'Venue 001',
          slug: 'venue-001',
          ownerId: 'admin@systemvirtue.com',
          activePlayerInstanceId: null,
          defaultPlaylistId: 'default_playlist',
          users: JSON.stringify([]),
          createdAt: new Date().toISOString()
        }
      );
      console.log(`✅ Created venue-001 (${venue001.$id})\n`);
    } else {
      console.log(`✅ venue-001 already exists (${venue001.$id})\n`);
    }
    
    // 5. Update all venues to use default_playlist
    console.log('🔄 Updating venues with default playlist...');
    const allVenues = [...venues.documents];
    if (venue001 && !allVenues.find(v => v.$id === venue001.$id)) {
      allVenues.push(venue001);
    }
    
    for (const venue of allVenues) {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          'venues',
          venue.$id,
          {
            defaultPlaylistId: 'default_playlist'
          }
        );
        console.log(`✅ Updated ${venue.venueId} → defaultPlaylistId: default_playlist`);
      } catch (error) {
        console.error(`❌ Failed to update ${venue.venueId}:`, error.message);
      }
    }
    console.log('');
    
    // 6. Add playlist tracks to queues
    const playlistTracks = (defaultPlaylist.tracks || []).slice(0, 50); // First 50 tracks
    console.log(`🔄 Adding ${playlistTracks.length} tracks to queues...\n`);
    
    for (const venue of allVenues) {
      let queue = queues.documents.find(q => q.venueId === venue.venueId);
      
      if (!queue) {
        // Create new queue
        console.log(`🆕 Creating queue for ${venue.venueId}...`);
        try {
          await databases.createDocument(
            DATABASE_ID,
            'queues',
            ID.unique(),
            {
              venueId: venue.venueId,
              mainQueue: JSON.stringify(playlistTracks),
              priorityQueue: JSON.stringify([]),
              nowPlaying: null,
              createdAt: new Date().toISOString()
            }
          );
          console.log(`✅ Created queue for ${venue.venueId} with ${playlistTracks.length} tracks`);
        } catch (error) {
          console.error(`❌ Failed to create queue for ${venue.venueId}:`, error.message);
        }
      } else {
        // Update existing queue
        console.log(`🔄 Updating queue for ${venue.venueId}...`);
        const currentMainQueue = JSON.parse(queue.mainQueue || '[]');
        
        if (currentMainQueue.length < 10) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              'queues',
              queue.$id,
              {
                mainQueue: JSON.stringify([...currentMainQueue, ...playlistTracks])
              }
            );
            console.log(`✅ Updated queue for ${venue.venueId} (added ${playlistTracks.length} tracks, total: ${currentMainQueue.length + playlistTracks.length})`);
          } catch (error) {
            console.error(`❌ Failed to update queue for ${venue.venueId}:`, error.message);
          }
        } else {
          console.log(`ℹ️  Queue for ${venue.venueId} already has ${currentMainQueue.length} tracks, skipping`);
        }
      }
    }
    
    console.log('\n✅ All done! Summary:');
    console.log(`- ${allVenues.length} venue(s) now use default_playlist`);
    console.log('- venue-001 created/verified');
    console.log('- Queues populated with playlist tracks');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

updateVenuesWithDefaultPlaylist();
