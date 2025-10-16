require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkData() {
  try {
    // Check venues
    console.log('=== VENUES ===');
    const venues = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'venues'
    );
    console.log('Total venues:', venues.total);
    venues.documents.forEach(v => {
      console.log(`- ${v.venueId}: ${v.name || 'No name'} (playlist: ${v.defaultPlaylistId || 'none'})`);
    });
    
    // Check playlists
    console.log('\n=== PLAYLISTS ===');
    const playlists = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'playlists'
    );
    console.log('Total playlists:', playlists.total);
    playlists.documents.forEach(p => {
      console.log(`- ${p.$id}: ${p.name} (${p.tracks?.length || 0} tracks)`);
    });
    
    // Check queues
    console.log('\n=== QUEUES ===');
    const queues = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'queues'
    );
    console.log('Total queues:', queues.total);
    queues.documents.forEach(q => {
      console.log(`- ${q.venueId}: ${q.mainQueue?.length || 0} main, ${q.priorityQueue?.length || 0} priority`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

checkData();
