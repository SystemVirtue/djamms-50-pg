import { useState, useEffect } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { QueueService } from '@shared/services';
import { Trash2, Music, Clock, User } from 'lucide-react';
import { Button } from '@shared/components';
import { toast } from 'sonner';
import type { Track } from '@shared/types/player';

interface QueueManagementProps {
  venueId: string;
  databaseId: string;
}

export function QueueManagement({ venueId }: QueueManagementProps) {
  const { client } = useAppwrite();
  const [queueService] = useState(() => new QueueService(client));
  const [priorityQueue, setPriorityQueue] = useState<Track[]>([]);
  const [mainQueue, setMainQueue] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    subscribeToQueue();
  }, [venueId]);

  const loadQueue = async () => {
    try {
      const { priorityQueue: pq, mainQueue: mq } = await queueService.getQueue(venueId);
      setPriorityQueue(pq);
      setMainQueue(mq);
    } catch (error) {
      console.error('Failed to load queue:', error);
      toast.error('Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToQueue = () => {
    queueService.subscribeToQueue(venueId, async () => {
      await loadQueue();
    });
  };

  const handleRemove = async (trackId: string) => {
    try {
      await queueService.removeFromQueue(trackId);
      toast.success('Track removed from queue');
    } catch (error) {
      toast.error('Failed to remove track');
      console.error('Remove failed:', error);
    }
  };

  const handleClearQueue = async (isPriority: boolean) => {
    if (!confirm(`Are you sure you want to clear the ${isPriority ? 'priority' : 'main'} queue?`)) {
      return;
    }

    try {
      await queueService.clearQueue(venueId);
      toast.success('Queue cleared');
    } catch (error) {
      toast.error('Failed to clear queue');
      console.error('Clear failed:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTrackList = (tracks: Track[], isPriority: boolean) => {
    if (tracks.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <Music size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tracks in {isPriority ? 'priority' : 'main'} queue</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <div
            key={`${track.videoId}-${index}`}
            className="bg-gray-700 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-650 transition"
          >
            {/* Position */}
            <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-semibold">
              {index + 1}
            </div>

            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${track.videoId}/default.jpg`}
              alt={track.title}
              className="w-16 h-16 object-cover rounded"
            />

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{track.title}</div>
              <div className="text-sm text-gray-300 truncate">{track.artist}</div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDuration(track.duration)}
                </span>
                {track.isRequest && track.requesterId && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {track.requesterId}
                  </span>
                )}
                {isPriority && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full">
                    Priority
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove((track as any).$id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalTracks = priorityQueue.length + mainQueue.length;
  const totalDuration = [...priorityQueue, ...mainQueue].reduce(
    (sum, track) => sum + track.duration,
    0
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-3xl font-bold text-white mb-1">{totalTracks}</div>
          <div className="text-sm text-gray-400">Total Tracks</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-3xl font-bold text-orange-500 mb-1">{priorityQueue.length}</div>
          <div className="text-sm text-gray-400">Priority Queue</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-3xl font-bold text-white mb-1">
            {Math.floor(totalDuration / 60)}m
          </div>
          <div className="text-sm text-gray-400">Total Duration</div>
        </div>
      </div>

      {/* Priority Queue */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Priority Queue</h2>
          {priorityQueue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearQueue(true)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={16} className="mr-2" />
              Clear All
            </Button>
          )}
        </div>
        {renderTrackList(priorityQueue, true)}
      </div>

      {/* Main Queue */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Main Queue</h2>
          {mainQueue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearQueue(false)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={16} className="mr-2" />
              Clear All
            </Button>
          )}
        </div>
        {renderTrackList(mainQueue, false)}
      </div>
    </div>
  );
}
