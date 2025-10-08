import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { usePlayerManager } from '../hooks/usePlayerManager';
import { PlayerBusyScreen } from './PlayerBusyScreen';
import type { Track } from '@shared/types';

interface AdvancedPlayerProps {
  venueId: string;
}

export const AdvancedPlayer: React.FC<AdvancedPlayerProps> = ({ venueId }) => {
  const { playerState, isMaster, currentTrack, error, playNextTrack, retryConnection } =
    usePlayerManager(venueId);
  const [primaryPlayer, setPrimaryPlayer] = useState<YT.Player>();
  const [secondaryPlayer, setSecondaryPlayer] = useState<YT.Player>();
  const [isCrossfading, setIsCrossfading] = useState(false);

  useEffect(() => {
    const handleCrossfade = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (primaryPlayer && secondaryPlayer && customEvent.detail.nextTrack) {
        startCrossfade(customEvent.detail.nextTrack);
      }
    };

    window.addEventListener('startCrossfade', handleCrossfade);
    return () => window.removeEventListener('startCrossfade', handleCrossfade);
  }, [primaryPlayer, secondaryPlayer]);

  const onPlayerReady = (event: YT.PlayerEvent, playerType: 'primary' | 'secondary') => {
    if (playerType === 'primary') {
      setPrimaryPlayer(event.target);
    } else {
      setSecondaryPlayer(event.target);
    }
  };

  const startCrossfade = async (nextTrack: Track) => {
    if (!primaryPlayer || !secondaryPlayer) return;

    setIsCrossfading(true);
    secondaryPlayer.loadVideoById(nextTrack.videoId);

    const fadeDuration = 5000;
    const steps = 50;
    const stepDuration = fadeDuration / steps;

    for (let i = 0; i <= steps; i++) {
      const primaryVolume = 100 - i * 2;
      const secondaryVolume = i * 2;
      primaryPlayer.setVolume(primaryVolume);
      secondaryPlayer.setVolume(secondaryVolume);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    setPrimaryPlayer(secondaryPlayer);
    setSecondaryPlayer(primaryPlayer);
    setIsCrossfading(false);
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
        venueId={venueId}
        error={error}
        onRetry={retryConnection}
        onOpenViewer={() => (window.location.href = `https://viewer.djamms.app/${venueId}`)}
        onOpenAdmin={() => (window.location.href = `https://admin.djamms.app/${venueId}`)}
      />
    );
  }

  return (
    <div className="player-container min-h-screen bg-gray-900 text-white relative">
      <YouTube
        videoId={currentTrack?.videoId}
        opts={{
          playerVars: {
            autoplay: localStorage.getItem('djammsAutoplay') === 'true' ? 1 : 0,
          },
        }}
        onReady={(e: YT.PlayerEvent) => onPlayerReady(e, 'primary')}
        onEnd={playNextTrack}
        className={`w-full h-full ${isCrossfading ? 'opacity-50 transition-opacity duration-5000' : ''}`}
        iframeClassName="absolute top-0 left-0 w-full h-full"
        data-testid="yt-player-container"
      />
      <YouTube
        opts={{ playerVars: { autoplay: 0 } }}
        onReady={(e: YT.PlayerEvent) => onPlayerReady(e, 'secondary')}
        style={{ display: 'none' }}
      />
      <div className="absolute bottom-0 w-full p-4 bg-black bg-opacity-50">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{currentTrack?.title || 'No track playing'}</h2>
            <p className="text-sm text-gray-400">{currentTrack?.artist || '-'}</p>
          </div>
          <button
            onClick={() => {
              const current = localStorage.getItem('djammsAutoplay') === 'true';
              localStorage.setItem('djammsAutoplay', (!current).toString());
            }}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            data-testid="autoplay-toggle"
          >
            Autoplay: {localStorage.getItem('djammsAutoplay') === 'true' ? 'On' : 'Off'}
          </button>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Up Next</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {playerState?.mainQueue.slice(0, 5).map((track, idx) => (
              <li key={`${track.videoId}-${idx}`} className="flex items-center">
                <span className="w-6 text-gray-500">{idx + 1}.</span>
                <span className="flex-1">{track.title} - {track.artist}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
