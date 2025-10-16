import { useState, useEffect, useRef } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { usePlayerWithSync, useRequestHistory } from '@shared/hooks';
import { RequestHistoryService, SongRequest } from '@shared/services';
import { YouTubePlayer, BackgroundSlideshow } from '@shared/components';
import { PlayerBusyScreen } from './PlayerBusyScreen';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';

interface PlayerViewProps {
  venueId: string;
}

export function PlayerView({ venueId }: PlayerViewProps) {
  const { client } = useAppwrite();
  
  // Check if this player is master (simplified - in production, use master election)
  const isMasterPlayer = true; // TODO: Implement proper master election
  
  const {
    currentTrack,
    priorityQueue,
    mainQueue,
    isLoading,
    error,
    handleTrackEnd,
    skipTrack,
    queueStats,
    syncNow,
    getNextTrack,
    playTrack,
  } = usePlayerWithSync({
    venueId,
    client,
    isMasterPlayer,
    enableBidirectionalSync: true,
    onError: (err: string) => console.error('Player error:', err),
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Request history tracking
  const { updateStatus, requests, loadHistory } = useRequestHistory({
    venueId,
    client,
    autoLoad: false,
  });

  // Auto-start first track when queue loads
  useEffect(() => {
    // Only auto-start once, when we have tracks but no current track
    if (hasAutoStarted || isLoading || currentTrack) {
      return;
    }

    // Check if we have any tracks in the queue
    const hasTracks = priorityQueue.length > 0 || mainQueue.length > 0;
    
    if (hasTracks && getNextTrack && playTrack) {
      console.log('[PlayerView] Auto-starting first track from queue');
      setHasAutoStarted(true);
      
      // Get and play the first track
      getNextTrack()
        .then((track) => {
          if (track) {
            console.log('[PlayerView] Starting first track:', track.title);
            return playTrack(track);
          }
        })
        .catch((err: any) => {
          console.error('[PlayerView] Failed to auto-start first track:', err);
        });
    }
  }, [hasAutoStarted, isLoading, currentTrack, priorityQueue, mainQueue, getNextTrack, playTrack]);

  // Request history service for direct queries
  const requestServiceRef = useRef<RequestHistoryService | null>(null);
  if (!requestServiceRef.current) {
    requestServiceRef.current = new RequestHistoryService(
      client,
      import.meta.env.VITE_APPWRITE_DATABASE_ID || 'main-db'
    );
  }

  // Track the currently playing request ID to avoid duplicate updates
  const currentRequestIdRef = useRef<string | null>(null);

  /**
   * Find the most recent queued request matching the current track
   * Uses videoId and recent timestamp to match
   */
  const findRequestForTrack = async (track: typeof currentTrack): Promise<SongRequest | null> => {
    if (!track) return null;

    try {
      // Load recent queued requests if not already loaded
      if (requests.length === 0) {
        await loadHistory({ status: 'queued', limit: 50 });
      }

      // Find matching request by videoId and recent timestamp
      const matchingRequest = requests.find(
        (req: SongRequest) =>
          req.song.videoId === track.videoId &&
          Math.abs(new Date(req.timestamp).getTime() - new Date(track.requestedAt).getTime()) < 60000 // Within 1 minute
      );

      // If not found in loaded requests, query directly
      if (!matchingRequest && requestServiceRef.current) {
        const recentRequests = await requestServiceRef.current.getRequestHistory(venueId, {
          status: 'queued',
          limit: 50,
        });
        
        return recentRequests.find(
          (req: SongRequest) =>
            req.song.videoId === track.videoId &&
            Math.abs(new Date(req.timestamp).getTime() - new Date(track.requestedAt).getTime()) < 60000
        ) || null;
      }

      return matchingRequest || null;
    } catch (error) {
      console.error('[PlayerView] Failed to find request for track:', error);
      return null;
    }
  };

  /**
   * Update request status when track starts playing
   */
  useEffect(() => {
    if (!currentTrack) {
      currentRequestIdRef.current = null;
      return;
    }

    // Only update if this is a new track
    const trackKey = `${currentTrack.videoId}-${currentTrack.requestedAt}`;
    if (currentRequestIdRef.current === trackKey) {
      return;
    }

    // Update status to "playing"
    const updatePlaying = async () => {
      try {
        const request = await findRequestForTrack(currentTrack);
        if (request && request.status === 'queued') {
          await updateStatus(request.requestId, 'playing');
          currentRequestIdRef.current = trackKey;
          console.log('[PlayerView] ✓ Updated request status to playing:', request.requestId);
        }
      } catch (error) {
        console.error('[PlayerView] Failed to update request to playing:', error);
      }
    };

    updatePlaying();
  }, [currentTrack]);


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

  // Error state
  if (error) {
    return (
      <PlayerBusyScreen
        venueId={venueId}
        error={error.message || 'Unknown error'}
        onRetry={() => syncNow()}
        onOpenViewer={() => (window.location.href = `https://viewer.djamms.app/${venueId}`)}
        onOpenAdmin={() => (window.location.href = `https://admin.djamms.app/${venueId}`)}
      />
    );
  }

  // Combine priority and main queues for slideshow
  const allTracks = [...priorityQueue, ...mainQueue];

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

  /**
   * Enhanced track end handler that updates request status to 'completed'
   */
  const handleTrackEndWithStatus = async () => {
    // Update request status to completed
    if (currentTrack) {
      try {
        const request = await findRequestForTrack(currentTrack);
        if (request) {
          await updateStatus(request.requestId, 'completed', {
            completedAt: new Date().toISOString(),
          });
          console.log('[PlayerView] ✓ Updated request status to completed:', request.requestId);
        }
      } catch (error) {
        console.error('[PlayerView] Failed to update request to completed:', error);
      }
    }

    // Call original track end handler
    await handleTrackEnd();
  };

  /**
   * Enhanced skip handler that updates request status to 'cancelled'
   */
  const handleSkip = async () => {
    // Update request status to cancelled
    if (currentTrack) {
      try {
        const request = await findRequestForTrack(currentTrack);
        if (request) {
          await updateStatus(request.requestId, 'cancelled', {
            cancelledAt: new Date().toISOString(),
            cancelReason: 'Skipped by admin',
          });
          console.log('[PlayerView] ✓ Updated request status to cancelled:', request.requestId);
        }
      } catch (error) {
        console.error('[PlayerView] Failed to update request to cancelled:', error);
      }
    }

    // Call original skip handler
    await skipTrack();
  };

  // Convert QueueTrack to Track format for components
  const convertToTrack = (track: typeof currentTrack) => {
    if (!track) return null;
    return {
      ...track,
      isRequest: track.isPaid || false,
    };
  };

  const displayTrack = convertToTrack(currentTrack);
  const displayTracks = allTracks.map(t => ({ ...t, isRequest: t.isPaid || false }));

  return (
    <div
      className="relative min-h-screen bg-black overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Background slideshow when no track is playing */}
      {!currentTrack && (
        <div className="absolute inset-0">
          <BackgroundSlideshow tracks={displayTracks} className="w-full h-full" />
        </div>
      )}

      {/* YouTube player */}
      {currentTrack && displayTrack && (
        <YouTubePlayer
          track={displayTrack}
          onEnded={handleTrackEndWithStatus}
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
            {currentTrack.isPaid && (
              <span className="inline-block mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                💿 Paid Request
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
                {track.isPaid && (
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
              {queueStats.priorityCount} + {queueStats.mainCount}
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
