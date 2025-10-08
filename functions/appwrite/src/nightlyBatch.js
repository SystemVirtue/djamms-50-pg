// functions/appwrite/src/nightlyBatch.js
const { Client, Databases, Query } = require('appwrite');
const { execSync } = require('child_process');

/**
 * Nightly batch processing for songs without realEndOffset
 */
exports.main = async () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Get all playlists
    const playlists = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      [Query.limit(100)]
    );

    let processed = 0;
    let errors = 0;

    for (const playlist of playlists.documents) {
      try {
        const tracks = JSON.parse(playlist.tracks || '[]');
        const tracksToProcess = tracks.filter((track) => !track.realEndOffset);

        if (tracksToProcess.length === 0) continue;

        console.log(`Processing ${tracksToProcess.length} tracks in playlist ${playlist.$id}`);

        for (const track of tracksToProcess) {
          try {
            // Get audio URL
            const audioUrl = execSync(
              `yt-dlp --get-url "https://youtube.com/watch?v=${track.videoId}"`
            )
              .toString()
              .trim();

            // Detect silence
            const cmd = `ffprobe -f lavfi -i "amovie=${audioUrl},astats=metadata=1:reset=1,silencedetect=noise=-30dB:d=2" -show_entries frame=pkt_pts_time -of csv=p=0`;
            const output = execSync(cmd, { timeout: 30000 }).toString().trim();
            
            const silencePoints = output
              .split('\n')
              .map((line) => parseFloat(line))
              .filter((val) => !isNaN(val));

            const realEndOffset =
              silencePoints.length > 0
                ? silencePoints[silencePoints.length - 1]
                : track.duration;

            // Update track
            track.realEndOffset = realEndOffset;
            processed++;

            // Rate limit: 1 per second
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (trackError) {
            console.error(`Failed to process track ${track.videoId}:`, trackError.message);
            errors++;
          }
        }

        // Update playlist
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'playlists',
          playlist.$id,
          {
            tracks: JSON.stringify(tracks),
            updatedAt: new Date().toISOString(),
          }
        );
      } catch (playlistError) {
        console.error(`Failed to process playlist ${playlist.$id}:`, playlistError.message);
        errors++;
      }
    }

    return {
      success: true,
      processed,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Nightly batch failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};
