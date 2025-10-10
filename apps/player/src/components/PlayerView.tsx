import { useState } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { usePlayerManager } from '@shared/hooks';
import { YouTubePlayer, BackgroundSlideshow } from '@shared/components';
import { PlayerBusyScreen } from './PlayerBusyScreen';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';

interface PlayerViewProps {
  venueId: string;
}

export function PlayerView({ venueId }: PlayerViewProps) {
  const { client } = useAppwrite();
  const {
    playerState,
    isMaster,
    currentTrack,
    isLoading,
    error,
    playNextTrack,
    retryConnection,
    volume,
    setVolume,
    isPlaying,
    setIsPlaying,
  } = usePlayerManager({
    venueId,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'main-db',
    client,
    onError: (err: string) => console.error('Player error:', err),
    onMasterStatusChange: (master: boolean) => {
      console.log(`Master status changed: ${master}`);
      localStorage.setItem(`isMasterPlayer_${venueId}`, master.toString());
    },
    enableStateSync: true,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-xl">Connecting to player...</div>
        </div>
      </div>
    );
  }

  // Not master - show busy screen
  if (isMaster === false || error) {
    return (
      <PlayerBusyScreen
        venueId={venueId}
        error={error || undefined}
        onRetry={retryConnection}
        onOpenViewer={() => (window.location.href = `https://viewer.djamms.app/${venueId}`)}
        onOpenAdmin={() => (window.location.href = `https://admin.djamms.app/${venueId}`)}
      />
    );
  }

  // Combine priority and main queues for slideshow
  const allTracks = [
    ...(playerState?.priorityQueue || []),
    ...(playerState?.mainQueue || []),
  ];

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSkip = () => {
    playNextTrack();
  };

  return (
    <div
      className="relative min-h-screen bg-black overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Background slideshow when no track is playing */}
      {!currentTrack && (
        <div className="absolute inset-0">
          <BackgroundSlideshow tracks={allTracks} className="w-full h-full" />
        </div>
      )}

      {/* YouTube player */}
      {currentTrack && (
        <YouTubePlayer
          track={currentTrack}
          onEnded={playNextTrack}
          onError={(err: string) => console.error('YouTube player error:', err)}
          autoplay={isPlaying}
          volume={isMuted ? 0 : volume}
          className="w-full h-full"
        />
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Now playing info */}
        {currentTrack && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{currentTrack.title}</h2>
            <p className="text-xl text-white/80">{currentTrack.artist}</p>
            {currentTrack.isRequest && (
              <span className="inline-block mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                💿 Requested
              </span>
            )}
          </div>
        )}

        {/* Queue preview */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Up Next
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTracks.slice(0, 6).map((track, index) => (
              <div
                key={`${track.videoId}-${index}`}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate text-sm">{track.title}</div>
                  <div className="text-white/60 text-xs truncate">{track.artist}</div>
                </div>
                {track.isRequest && (
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </div>
            ))}
          </div>
          {allTracks.length > 6 && (
            <div className="mt-3 text-center text-white/50 text-sm">
              +{allTracks.length - 6} more tracks
            </div>
          )}
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={handleSkip}
              disabled={allTracks.length === 0}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward size={24} />
            </button>
          </div>

          {/* Center: Volume control */}
          <div className="flex items-center gap-4 flex-1 max-w-md mx-6">
            <button
              onClick={toggleMute}
              className="text-white hover:text-orange-500 transition"
            >
              {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition
                [&::-webkit-slider-thumb]:hover:bg-orange-600"
            />
            <span className="text-white text-sm w-12 text-right">{isMuted ? 0 : volume}%</span>
          </div>

          {/* Right: Queue stats */}
          <div className="text-right">
            <div className="text-white/70 text-sm">Queue</div>
            <div className="text-white font-bold text-lg">
              {playerState?.priorityQueue.length || 0} + {playerState?.mainQueue.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Top bar - Venue info */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">DJAMMS Player</h1>
            <p className="text-white/70">Venue: {venueId}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white text-sm">Master Player</span>
          </div>
        </div>
      </div>
    </div>
  );
}
