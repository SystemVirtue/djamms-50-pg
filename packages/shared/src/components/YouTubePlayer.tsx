import { useEffect, useRef, useState, useCallback } from 'react';
import type { Track } from '../types/player';

interface YouTubePlayerProps {
  track: Track | null;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  autoplay?: boolean;
  volume?: number;
  className?: string;
}

interface PlayerInstance {
  player: YT.Player;
  isActive: boolean;
  videoId: string | null;
}

/**
 * Dual YouTube iframe player with crossfading capability
 * Uses two iframes to enable seamless transitions between tracks
 */
export function YouTubePlayer({
  track,
  onEnded,
  onError,
  onReady,
  autoplay = true,
  volume = 100,
  className = '',
}: YouTubePlayerProps) {
  const [players, setPlayers] = useState<[PlayerInstance | null, PlayerInstance | null]>([
    null,
    null,
  ]);
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);
  const [isReady, setIsReady] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);
  
  const iframe1Ref = useRef<HTMLDivElement>(null);
  const iframe2Ref = useRef<HTMLDivElement>(null);
  const crossfadeTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayers();
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // YouTube calls this when ready
    window.onYouTubeIframeAPIReady = () => {
      initializePlayers();
    };

    return () => {
      // Cleanup
      players.forEach((p) => p?.player.destroy());
    };
  }, []);

  // Initialize both players
  const initializePlayers = useCallback(() => {
    if (!iframe1Ref.current || !iframe2Ref.current) return;
    if (!window.YT || !window.YT.Player) return;

    const player1 = new window.YT.Player(iframe1Ref.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => handlePlayerReady(event, 0),
        onStateChange: (event: YT.OnStateChangeEvent) => handleStateChange(event, 0),
        onError: handlePlayerError,
      },
    });

    const player2 = new window.YT.Player(iframe2Ref.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => handlePlayerReady(event, 1),
        onStateChange: (event: YT.OnStateChangeEvent) => handleStateChange(event, 1),
        onError: handlePlayerError,
      },
    });

    setPlayers([
      { player: player1, isActive: true, videoId: null },
      { player: player2, isActive: false, videoId: null },
    ]);
  }, []);

  // Handle player ready
  const handlePlayerReady = (event: YT.PlayerEvent, index: 0 | 1) => {
    const player = event.target;
    player.setVolume(index === activeIndex ? volume : 0);
    
    if (index === 1) {
      // Both players ready
      setIsReady(true);
      onReady?.();
    }
  };

  // Handle state changes
  const handleStateChange = (event: YT.OnStateChangeEvent, index: 0 | 1) => {
    const player = event.target;
    const state = player.getPlayerState();

    // Only handle events from active player
    if (index !== activeIndex) return;

    if (state === window.YT.PlayerState.ENDED) {
      onEnded?.();
    } else if (state === window.YT.PlayerState.PLAYING) {
      // Start crossfade timer (5 seconds before end)
      const duration = player.getDuration();
      const crossfadeStart = Math.max(0, duration - 5);
      
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current);
      }
      
      crossfadeTimeoutRef.current = setTimeout(() => {
        // Signal that crossfade should begin soon
        // Parent component can preload next track
      }, crossfadeStart * 1000);
    }
  };

  // Handle player errors
  const handlePlayerError = (event: YT.OnErrorEvent) => {
    const errorMessages: Record<number, string> = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found',
      101: 'Video not allowed to be embedded',
      150: 'Video not allowed to be embedded',
    };

    const message = errorMessages[event.data] || 'Unknown player error';
    onError?.(message);
  };

  // Play new track (with optional crossfade)
  useEffect(() => {
    if (!track || !isReady || !players[0] || !players[1]) return;

    const activePlayer = players[activeIndex];
    const inactivePlayer = players[activeIndex === 0 ? 1 : 0];

    if (!activePlayer || !inactivePlayer) return;

    // If same video, just ensure it's playing
    if (activePlayer.videoId === track.videoId) {
      if (autoplay && activePlayer.player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        activePlayer.player.playVideo();
      }
      return;
    }

    // Load new track
    if (inactivePlayer.player) {
      // Load in inactive player first
      inactivePlayer.player.loadVideoById(track.videoId);
      inactivePlayer.videoId = track.videoId;

      if (autoplay) {
        // If we have a currently playing track, crossfade
        if (activePlayer.videoId && activePlayer.player.getPlayerState() === window.YT.PlayerState.PLAYING) {
          startCrossfade();
        } else {
          // No current track, just start playing
          switchPlayers();
          inactivePlayer.player.playVideo();
        }
      }
    }
  }, [track, isReady, autoplay]);

  // Crossfade between players
  const startCrossfade = async () => {
    if (!players[0] || !players[1] || isCrossfading) return;

    setIsCrossfading(true);
    const activePlayer = players[activeIndex];
    const inactivePlayer = players[activeIndex === 0 ? 1 : 0];
    const inactiveIndex = activeIndex === 0 ? 1 : 0;

    if (!activePlayer || !inactivePlayer) {
      setIsCrossfading(false);
      return;
    }

    // Start inactive player
    inactivePlayer.player.playVideo();
    inactivePlayer.player.setVolume(0);

    // Crossfade over 3 seconds
    const fadeDuration = 3000;
    const steps = 30;
    const stepDuration = fadeDuration / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
      
      const fadeOut = Math.max(0, volume * (1 - i / steps));
      const fadeIn = Math.min(volume, volume * (i / steps));
      
      activePlayer.player.setVolume(fadeOut);
      inactivePlayer.player.setVolume(fadeIn);
    }

    // Stop the old player
    activePlayer.player.pauseVideo();
    activePlayer.player.setVolume(0);

    // Switch active player
    setActiveIndex(inactiveIndex);
    setIsCrossfading(false);
  };

  // Switch players without crossfade
  const switchPlayers = () => {
    const newIndex = activeIndex === 0 ? 1 : 0;
    setActiveIndex(newIndex);
  };

  // Update volume
  useEffect(() => {
    if (!isReady || !players[activeIndex]) return;
    players[activeIndex]?.player.setVolume(volume);
  }, [volume, activeIndex, isReady]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      {/* Player 1 */}
      <div
        ref={iframe1Ref}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          activeIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
        data-testid="youtube-player-1"
      />
      
      {/* Player 2 */}
      <div
        ref={iframe2Ref}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          activeIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
        data-testid="youtube-player-2"
      />

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-white text-xl">Loading player...</div>
        </div>
      )}

      {/* Now playing info overlay */}
      {track && isReady && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-20">
          <h2 className="text-2xl font-bold text-white mb-1">{track.title}</h2>
          <p className="text-gray-300 text-lg">{track.artist}</p>
          {track.isRequest && (
            <span className="inline-block mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
              Requested
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Extend Window type for YouTube API
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}
