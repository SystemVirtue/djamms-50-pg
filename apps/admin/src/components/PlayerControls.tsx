/**
 * Player Controls Tab
 * 
 * Admin controls for the player:
 * - Now playing display from queue
 * - Volume control (UI only, integration pending)
 * - Player status
 */

import { useState, useEffect } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { useQueueManagement } from '@shared/hooks/useQueueManagement';
import { Play, SkipForward, Volume2, Music } from 'lucide-react';
import { Button } from '@shared/components';
import { toast } from 'sonner';

interface PlayerControlsProps {
  venueId: string;
  databaseId: string;
}

export function PlayerControls({ venueId }: PlayerControlsProps) {
  const { client } = useAppwrite();
  const [volume, setVolume] = useState(75);
  
  const {
    priorityQueue,
    mainQueue,
    isLoading,
    error,
  } = useQueueManagement({
    venueId,
    client,
    enableRealtime: true,
  });

  useEffect(() => {
    if (error) {
      toast.error(`Queue error: ${error}`);
    }
  }, [error]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // TODO: Integrate with PlayerStateService when available
    toast.info(`Volume set to ${newVolume}% (player integration pending)`);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-24 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // Get next track from queue
  const nextTrack = priorityQueue[0] || mainQueue[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Music className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-white">Player Controls</h1>
      </div>

      {/* Now Playing / Next Track */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Next in Queue</div>
        {nextTrack ? (
          <div>
            <div className="text-xl font-semibold text-white mb-1">
              {nextTrack.title}
            </div>
            <div className="text-gray-300 mb-2">{nextTrack.artist}</div>
            {priorityQueue[0] && (
              <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                Priority
              </span>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Queue is empty</p>
          </div>
        )}
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Priority Queue</div>
          <div className="text-2xl font-bold text-orange-500">
            {priorityQueue.length}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Main Queue</div>
          <div className="text-2xl font-bold text-white">
            {mainQueue.length}
          </div>
        </div>
      </div>

      {/* Playback Controls (Disabled - Integration Pending) */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="default"
          size="lg"
          className="h-20 text-lg"
          disabled
        >
          <Play className="mr-2" size={24} />
          Play/Pause
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-20 text-lg"
          disabled
        >
          <SkipForward className="mr-2" size={24} />
          Skip
        </Button>
      </div>

      {/* Volume Control */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-4">
          <Volume2 size={24} className="text-gray-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Volume</span>
              <span className="text-sm font-semibold text-white">{volume}%</span>
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
                [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Status Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="text-sm text-blue-300">
          <strong>Note:</strong> Direct playback controls are in development. 
          Currently displaying queue status. Full player control integration 
          will be added with PlayerStateService.
        </div>
      </div>
    </div>
  );
}
