import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
// Note: Install react-youtube: npm install react-youtube @types/youtube-player
// import YouTube from 'react-youtube';
import { PlayerBusyScreen } from './PlayerBusyScreen';

// Simplified types for web app
interface Track {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  isRequest?: boolean;
  realEndOffset?: number;
}

interface PlayerState {
  venueId: string;
  nowPlaying?: Track;
  mainQueue: Track[];
  priorityQueue: Track[];
}

export function PlayerView() {
  const { venueId } = useParams<{ venueId: string }>();
  
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [error, setError] = useState<string>();
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  
  // Simplified player manager for web app
  // In production, this would use usePlayerManager hook from packages
  useEffect(() => {
    if (!venueId) return;

    // Load autoplay preference
    const autoplayPref = localStorage.getItem('djammsAutoplay') === 'true';
    setAutoplay(autoplayPref);

    // Check if master player
    const masterCheck = localStorage.getItem(`isMasterPlayer_${venueId}`) === 'true';
    setIsMaster(masterCheck);

    // Load queue from localStorage (simplified)
    const localQueue = localStorage.getItem(`djammsQueue_${venueId}`);
    if (localQueue) {
      try {
        const parsed = JSON.parse(localQueue);
        setPlayerState(parsed);
        setCurrentTrack(parsed.nowPlaying || null);
      } catch (e) {
        console.error('Failed to parse queue:', e);
      }
    } else {
      // Initialize empty queue
      setPlayerState({
        venueId,
        mainQueue: [],
        priorityQueue: []
      });
    }
  }, [venueId]);

  const handleAutoplayToggle = () => {
    const newAutoplay = !autoplay;
    setAutoplay(newAutoplay);
    localStorage.setItem('djammsAutoplay', newAutoplay.toString());
  };

  const handleRetry = useCallback(() => {
    setError(undefined);
    setIsMaster(null);
    // Re-run initialization
    setTimeout(() => setIsMaster(true), 1000);
  }, []);

  const handleOpenViewer = () => {
    window.location.href = `/viewer/${venueId}`;
  };

  const handleOpenAdmin = () => {
    window.location.href = `/admin/${venueId}`;
  };

  const playNextTrack = () => {
    if (!playerState) return;
    
    const nextTrack = playerState.priorityQueue[0] || playerState.mainQueue[0];
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      // In production: update AppWrite and sync state
    }
  };

  if (isMaster === null) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading player...</div>
      </div>
    );
  }

  if (!isMaster) {
    return (
      <PlayerBusyScreen
        venueId={venueId || 'unknown'}
        error={error}
        onRetry={handleRetry}
        onOpenViewer={handleOpenViewer}
        onOpenAdmin={handleOpenAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* YouTube Player Container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {currentTrack ? (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">▶️</div>
              <p className="text-lg">YouTube Player</p>
              <p className="text-sm text-gray-400">Video ID: {currentTrack.videoId}</p>
              <p className="text-xs text-gray-500 mt-2">
                Note: Install react-youtube package for full implementation
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🎵</div>
              <p>No track loaded</p>
            </div>
          </div>
        )}
      </div>

      {/* Player Controls Overlay */}
      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Now Playing */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">
            {currentTrack?.title || 'No track playing'}
          </h2>
          <p className="text-gray-400">
            {currentTrack?.artist || 'Select a track to begin'}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleAutoplayToggle}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              autoplay
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Autoplay: {autoplay ? 'On' : 'Off'}
          </button>
          
          <button
            onClick={playNextTrack}
            disabled={!playerState || (playerState.mainQueue.length === 0 && playerState.priorityQueue.length === 0)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            ⏭️ Next Track
          </button>
        </div>

        {/* Queue Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Up Next</h3>
          {playerState && (playerState.priorityQueue.length > 0 || playerState.mainQueue.length > 0) ? (
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {/* Priority Queue */}
              {playerState.priorityQueue.slice(0, 3).map((track, idx) => (
                <li key={`priority-${idx}`} className="flex items-center gap-3 text-sm">
                  <span className="text-yellow-400 font-bold">⭐</span>
                  <span className="flex-1">{track.title}</span>
                  <span className="text-gray-400">{track.artist}</span>
                </li>
              ))}
              {/* Main Queue */}
              {playerState.mainQueue.slice(0, 5).map((track, idx) => (
                <li key={`main-${idx}`} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-gray-500">{idx + 1}.</span>
                  <span className="flex-1">{track.title}</span>
                  <span className="text-gray-400">{track.artist}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Queue is empty</p>
          )}
        </div>
      </div>

      {/* Implementation Note - REMOVED */}
    </div>
  );
}
