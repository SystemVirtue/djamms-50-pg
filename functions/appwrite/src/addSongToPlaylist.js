// functions/appwrite/src/addSongToPlaylist.js
const { Client, Databases } = require('appwrite');
const { execSync } = require('child_process');

/**
 * Add song to playlist with FFmpeg pre-processing for silence detection
 */
exports.main = async ({ playlistId, song }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Get audio URL using yt-dlp
    const audioUrl = execSync(`yt-dlp --get-url "https://youtube.com/watch?v=${song.videoId}"`)
      .toString()
      .trim();

    // Detect silence at end using FFmpeg
    const cmd = `ffprobe -f lavfi -i "amovie=${audioUrl},astats=metadata=1:reset=1,silencedetect=noise=-30dB:d=2" -show_entries frame=pkt_pts_time -of csv=p=0`;
    
    let realEndOffset = song.duration;
    
    try {
      const output = execSync(cmd, { timeout: 30000 }).toString().trim();
      const silencePoints = output
        .split('\n')
        .map((line) => parseFloat(line))
        .filter((val) => !isNaN(val));

      if (silencePoints.length > 0) {
        realEndOffset = silencePoints[silencePoints.length - 1];
      }
    } catch (ffmpegError) {
      console.warn('FFmpeg processing failed, using full duration:', ffmpegError.message);
    }

    // Get playlist and update
    const playlist = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId
    );

    const updatedTracks = JSON.parse(playlist.tracks || '[]');
    updatedTracks.push({
      ...song,
      realEndOffset,
    });

    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      'playlists',
      playlistId,
      {
        tracks: JSON.stringify(updatedTracks),
        updatedAt: new Date().toISOString(),
      }
    );

    return { success: true, realEndOffset };
  } catch (error) {
    console.error('Add song failed:', error);
    return { success: false, error: error.message };
  }
};
