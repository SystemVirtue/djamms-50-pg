import { useEffect, useCallback } from 'react';
import { Client } from 'appwrite';
import { QueueService } from '../services/QueueService';
import { Track } from '../types/player';
import { SearchResult } from '../components/VideoCard';

export interface UseQueueSyncOptions {
  venueId: string;
  enabled?: boolean;
  onQueueUpdate?: (priorityQueue: Track[], mainQueue: Track[]) => void;
  onError?: (error: Error) => void;
}

export interface UseQueueSyncReturn {
  addToQueue: (video: SearchResult, isPriority: boolean) => Promise<void>;
  removeFromQueue: (trackId: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Custom hook for syncing local queue state with AppWrite
 * Combines local state management with real-time AppWrite synchronization
 */
export function useQueueSync(
  client: Client,
  options: UseQueueSyncOptions
): UseQueueSyncReturn {
  const { venueId, enabled = true, onQueueUpdate, onError } = options;
  
  const queueService = new QueueService(client);

  // Subscribe to real-time queue updates
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = queueService.subscribeToQueue(venueId, (response) => {
      // Handle real-time updates
      const eventType = response.events[0];
      
      if (eventType.includes('create') || eventType.includes('update') || eventType.includes('delete')) {
        // Fetch updated queue
        queueService.getQueue(venueId)
          .then(({ priorityQueue, mainQueue }) => {
            onQueueUpdate?.(priorityQueue, mainQueue);
          })
          .catch((error) => {
            console.error('Error fetching updated queue:', error);
            onError?.(error as Error);
          });
      }
    });

    // Initial fetch
    queueService.getQueue(venueId)
      .then(({ priorityQueue, mainQueue }) => {
        onQueueUpdate?.(priorityQueue, mainQueue);
      })
      .catch((error) => {
        console.error('Error fetching initial queue:', error);
        onError?.(error as Error);
      });

    return () => {
      unsubscribe();
    };
  }, [venueId, enabled, queueService, onQueueUpdate, onError]);

  /**
   * Add track to AppWrite queue
   */
  const addToQueue = useCallback(async (video: SearchResult, isPriority: boolean) => {
    try {
      const track: Track = {
        videoId: video.id,
        title: video.title,
        artist: video.channelTitle,
        duration: video.duration,
        isRequest: isPriority,
        position: 0 // Will be calculated by QueueService
      };

      await queueService.addToQueue(venueId, track);
    } catch (error) {
      console.error('Error adding to queue:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [venueId, queueService, onError]);

  /**
   * Remove track from AppWrite queue
   */
  const removeFromQueue = useCallback(async (trackId: string) => {
    try {
      await queueService.removeFromQueue(trackId);
    } catch (error) {
      console.error('Error removing from queue:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [queueService, onError]);

  /**
   * Clear entire queue
   */
  const clearQueue = useCallback(async () => {
    try {
      await queueService.clearQueue(venueId);
    } catch (error) {
      console.error('Error clearing queue:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [venueId, queueService, onError]);

  return {
    addToQueue,
    removeFromQueue,
    clearQueue,
    isLoading: false // TODO: Add loading state tracking
  };
}

export default useQueueSync;
