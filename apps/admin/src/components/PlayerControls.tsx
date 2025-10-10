import { useState, useEffect } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { PlayerSyncService } from '@shared/services';
import { Play, Pause, SkipForward, Volume2, Settings } from 'lucide-react';
import { Button } from '@shared/components';
import { toast } from 'sonner';

interface PlayerControlsProps {
  venueId: string;
  databaseId: string;
}

export function PlayerControls({ venueId, databaseId }: PlayerControlsProps) {
  const { client } = useAppwrite();
  const [syncService] = useState(() => new PlayerSyncService(client));
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  // Load current player state
  useEffect(() => {
    loadPlayerState();
    subscribeToPlayerState();
  }, [venueId]);

  const loadPlayerState = async () => {
    try {
      const state = await syncService.getPlayerState(venueId, databaseId);
      if (state) {
        setIsPlaying(state.isPlaying);
        setVolume(state.volume);
        setCurrentTrack(state.nowPlaying);
      }
    } catch (error) {
      console.error('Failed to load player state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPlayerState = () => {
    syncService.subscribeToPlayerState(venueId, databaseId, client, (state) => {
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
      setCurrentTrack(state.nowPlaying);
    });
  };

  const sendCommand = async (command: 'play' | 'pause' | 'skip' | 'volume', payload?: any) => {
    try {
      await syncService.issueCommand(
        venueId,
        command,
        payload,
        'admin', // issuedBy
        databaseId
      );
      toast.success(`Command sent: ${command}`);
    } catch (error) {
      toast.error(`Failed to send ${command} command`);
      console.error('Command failed:', error);
    }
  };

  const handlePlayPause = () => {
    sendCommand(isPlaying ? 'pause' : 'play');
  };

  const handleSkip = () => {
    sendCommand('skip');
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    sendCommand('volume', { volume: newVolume });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-24 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Player Controls</h2>

      {/* Now Playing */}
      {currentTrack ? (
        <div className="mb-6 bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Now Playing</div>
          <div className="text-xl font-semibold">{currentTrack.title}</div>
          <div className="text-gray-300">{currentTrack.artist}</div>
          {currentTrack.isRequest && (
            <span className="inline-block mt-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
              Requested
            </span>
          )}
        </div>
      ) : (
        <div className="mb-6 bg-gray-700 rounded-lg p-4 text-center text-gray-400">
          No track currently playing
        </div>
      )}

      {/* Playback Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Button
          onClick={handlePlayPause}
          variant="default"
          size="lg"
          className="h-20 text-lg"
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2" size={24} />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2" size={24} />
              Play
            </>
          )}
        </Button>

        <Button
          onClick={handleSkip}
          variant="outline"
          size="lg"
          className="h-20 text-lg"
        >
          <SkipForward className="mr-2" size={24} />
          Skip
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-20 text-lg"
          disabled
        >
          <Settings className="mr-2" size={24} />
          Settings
        </Button>
      </div>

      {/* Volume Control */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Volume2 size={24} className="text-gray-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Volume</span>
              <span className="text-sm font-semibold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
