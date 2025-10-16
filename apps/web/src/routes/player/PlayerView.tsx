import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client, Databases } from 'appwrite';
import { PlayerBusyScreen } from './PlayerBusyScreen';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';

// Types
interface Track {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  isPaid?: boolean;
  requestedAt?: string;
  realEndOffset?: number;
}

interface PlayerState {
  venueId: string;
  nowPlaying?: Track;
  mainQueue: Track[];
  priorityQueue: Track[];
}

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function PlayerView() {
  const { venueId } = useParams<{ venueId: string }>();
  
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [error, setError] = useState<string>();
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(false);
  
  // YouTube player refs
  const playerRef = useRef<any>(null);
  const playerReadyRef = useRef(false);
  
  // AppWrite client for real-time sync
  const clientRef = useRef<Client | null>(null);
  const databasesRef = useRef<Databases | null>(null);

  // Initialize AppWrite client
  useEffect(() => {
    const client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    clientRef.current = client;
    databasesRef.current = new Databases(client);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize player and load queue
  useEffect(() => {
    if (!venueId) return;

    // Load autoplay preference
    const autoplayPref = localStorage.getItem('djammsAutoplay');
    if (autoplayPref !== null) {
      setAutoplay(autoplayPref === 'true');
    }

    // Check if master player
    const masterCheck = localStorage.getItem(`isMasterPlayer_${venueId}`) === 'true';
    setIsMaster(masterCheck);

    // Load initial queue
    loadQueue();

    // Set up real-time queue sync (poll every 5 seconds)
    const syncInterval = setInterval(loadQueue, 5000);
    
    return () => clearInterval(syncInterval);
  }, [venueId]);

  // Load queue from AppWrite or localStorage
  const loadQueue = async () => {
    if (!venueId) return;
    
    try {
      // Try AppWrite first
      if (databasesRef.current) {
        const response = await databasesRef.current.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'queues',
          []
        );
        
        const queueDoc = response.documents.find((doc: any) => doc.venueId === venueId);
        if (queueDoc) {
          const state: PlayerState = {
            venueId,
            nowPlaying: queueDoc.nowPlaying || undefined,
            mainQueue: queueDoc.mainQueue || [],
            priorityQueue: queueDoc.priorityQueue || []
          };
          setPlayerState(state);
          
          // Update current track if changed
          if (queueDoc.nowPlaying && queueDoc.nowPlaying.videoId !== currentTrack?.videoId) {
            setCurrentTrack(queueDoc.nowPlaying);
          }
          
          // Save to localStorage as backup
          localStorage.setItem(`djammsQueue_${venueId}`, JSON.stringify(state));
          return;
        }
      }
    } catch (error) {
      console.warn('AppWrite unavailable, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const localQueue = localStorage.getItem(`djammsQueue_${venueId}`);
    if (localQueue) {
      try {
        const parsed = JSON.parse(localQueue);
        setPlayerState(parsed);
        if (parsed.nowPlaying) {
          setCurrentTrack(parsed.nowPlaying);
        }
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
  };

  // Initialize YouTube player when track changes
  useEffect(() => {
    if (!currentTrack || !window.YT) return;

    const initPlayer = () => {
      if (playerRef.current) {
        // Player exists, load new video
        playerRef.current.loadVideoById(currentTrack.videoId);
        if (autoplay) {
          playerRef.current.playVideo();
        }
      } else {
        // Create new player
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: currentTrack.videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onReady: () => {
              playerReadyRef.current = true;
              if (volume !== 100) {
                playerRef.current?.setVolume(volume);
              }
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                handleTrackEnd();
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [currentTrack?.videoId]);

  // Handle volume changes
  useEffect(() => {
    if (playerRef.current && playerReadyRef.current) {
      playerRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  const handleTrackEnd = () => {
    // Play next track
    playNextTrack();
  };

  const playNextTrack = () => {
    if (!playerState) return;
    
    const nextTrack = playerState.priorityQueue[0] || playerState.mainQueue[0];
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      
      // Update queue state
      const updatedState = {
        ...playerState,
        nowPlaying: nextTrack,
        priorityQueue: playerState.priorityQueue[0] ? playerState.priorityQueue.slice(1) : playerState.priorityQueue,
        mainQueue: !playerState.priorityQueue[0] ? playerState.mainQueue.slice(1) : playerState.mainQueue
      };
      
      setPlayerState(updatedState);
      localStorage.setItem(`djammsQueue_${venueId}`, JSON.stringify(updatedState));
      
      // In production: update AppWrite
      updateQueueInAppWrite(updatedState);
    }
  };

  const skipTrack = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
    playNextTrack();
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const updateQueueInAppWrite = async (state: PlayerState) => {
    if (!databasesRef.current || !venueId) return;
    
    try {
      // Update queue document in AppWrite
      await databasesRef.current.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'queues',
        venueId,
        {
          nowPlaying: state.nowPlaying,
          mainQueue: state.mainQueue,
          priorityQueue: state.priorityQueue,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.warn('Failed to update AppWrite queue:', error);
    }
  };

  const handleAutoplayToggle = () => {
    const newAutoplay = !autoplay;
    setAutoplay(newAutoplay);
    localStorage.setItem('djammsAutoplay', newAutoplay.toString());
  };

  const handleRetry = useCallback(() => {
    setError(undefined);
    setIsMaster(null);
    setTimeout(() => setIsMaster(true), 1000);
  }, []);

  const handleOpenViewer = () => {
    window.location.href = `/viewer/${venueId}`;
  };

  const handleOpenAdmin = () => {
    window.location.href = `/admin/${venueId}`;
  };

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

  // Combine queues for display
  const allTracks = playerState ? [...playerState.priorityQueue, ...playerState.mainQueue] : [];

  if (isMaster === null) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-xl">Loading player...</div>
        </div>
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
    <div 
      className="min-h-screen bg-black text-white relative overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* YouTube Player Container */}
      <div className="relative w-full h-screen">
        {currentTrack ? (
          <div id="youtube-player" className="absolute inset-0 w-full h-full" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-2xl font-bold mb-2">No track playing</p>
              <p className="text-gray-400">Queue is {allTracks.length === 0 ? 'empty' : 'ready'}</p>
              {allTracks.length > 0 && (
                <button
                  onClick={playNextTrack}
                  className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold transition"
                >
                  ▶️ Start Playing
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Bar - Venue Info */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DJAMMS Player</h1>
            <p className="text-white/70">Venue: {venueId}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAutoplayToggle}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                autoplay
                  ? 'bg-green-500/20 text-green-400 border border-green-500'
                  : 'bg-gray-700/50 text-gray-400'
              }`}
            >
              Autoplay: {autoplay ? 'On' : 'Off'}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Master Player</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Now Playing Info */}
        {currentTrack && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">{currentTrack.title}</h2>
            <p className="text-xl text-white/80">{currentTrack.artist}</p>
            {currentTrack.isPaid && (
              <span className="inline-block mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                💿 Paid Request
              </span>
            )}
          </div>
        )}

        {/* Queue Preview */}
        {allTracks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
              Up Next ({allTracks.length} tracks)
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
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full" title="Paid Request" />
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
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              disabled={!currentTrack}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={skipTrack}
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
    </div>
  );
}
