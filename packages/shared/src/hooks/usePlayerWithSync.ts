/**
 * Enhanced Player Manager with Queue Sync
 * Integrates player state management with bidirectional localStorage/server sync
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from 'appwrite';
import { useQueueManagement, UseQueueManagementReturn } from './useQueueManagement';
import { PlayerQueueSyncService } from '../services/PlayerQueueSyncService';
import type { QueueTrack } from '../services/QueueManagementService';

export interface UsePlayerWithSyncOptions {
  venueId: string;
  client: Client;
  isMasterPlayer: boolean;
  enableBidirectionalSync?: boolean;
  onError?: (error: string) => void;
}

export interface UsePlayerWithSyncReturn extends Omit<UseQueueManagementReturn, 'addTrack'> {
  // Player-specific methods
  playTrack: (track: QueueTrack) => Promise<void>;
  handleTrackEnd: () => Promise<void>;
  
  // Sync control
  syncNow: () => Promise<void>;
  pushToServer: () => Promise<void>;
  
  // Local storage access
  localQueue: { mainQueue: QueueTrack[]; priorityQueue: QueueTrack[] } | null;
  localNowPlaying: QueueTrack | null;
}

/**
 * Hook for player with bidirectional localStorage/server sync
 */
export function usePlayerWithSync(
  options: UsePlayerWithSyncOptions
): UsePlayerWithSyncReturn {
  const { venueId, client, isMasterPlayer, enableBidirectionalSync = true, onError } = options;
  
  const [localNowPlaying, setLocalNowPlaying] = useState<QueueTrack | null>(null);
  const [localQueue, setLocalQueue] = useState<{ mainQueue: QueueTrack[]; priorityQueue: QueueTrack[] } | null>(null);
  
  const syncServiceRef = useRef<PlayerQueueSyncService | null>(null);
  
  // Use queue management hook
  const queueManagement = useQueueManagement({
    venueId,
    client,
    enableRealtime: true,
  });

  // Initialize sync service
  useEffect(() => {
    if (!isMasterPlayer || !enableBidirectionalSync) return;

    syncServiceRef.current = new PlayerQueueSyncService(client, venueId);
    
    // Start bidirectional sync
    syncServiceRef.current.startSync((error) => {
      console.error('[PlayerWithSync] Sync error:', error);
      onError?.(error.message);
    });

    // Load initial local state
    updateLocalState();

    // Listen for localStorage changes
    const interval = setInterval(() => {
      updateLocalState();
    }, 1000);

    return () => {
      clearInterval(interval);
      if (syncServiceRef.current) {
        syncServiceRef.current.stopSync();
      }
    };
  }, [venueId, client, isMasterPlayer, enableBidirectionalSync]);

  // Update local state from localStorage
  const updateLocalState = useCallback(() => {
    if (!syncServiceRef.current) return;

    const queue = syncServiceRef.current.getLocalQueue();
    const nowPlaying = syncServiceRef.current.getLocalNowPlaying();

    setLocalQueue(queue);
    
    if (nowPlaying) {
      setLocalNowPlaying({
        id: `local_${Date.now()}`,
        videoId: nowPlaying.videoId,
        title: nowPlaying.title,
        artist: nowPlaying.artist,
        duration: nowPlaying.duration,
        thumbnail: nowPlaying.thumbnail,
        requestedAt: new Date(nowPlaying.startTime).toISOString(),
        position: nowPlaying.position || 0,
        status: 'playing',
        isPaid: nowPlaying.isPaid || false,
        requestedBy: nowPlaying.requestedBy,
        requestedByEmail: nowPlaying.requestedByEmail,
      });
    } else {
      setLocalNowPlaying(null);
    }
  }, []);

  // Play a specific track
  const playTrack = useCallback(async (track: QueueTrack) => {
    try {
      // Update server
      await queueManagement.startTrack(track.id);

      // Update localStorage
      if (syncServiceRef.current) {
        await syncServiceRef.current.updateLocalNowPlaying({
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          thumbnail: track.thumbnail,
          startTime: Date.now(),
          position: track.position,
          isPaid: track.isPaid,
          requestedBy: track.requestedBy,
          requestedByEmail: track.requestedByEmail,
        });
      }

      setLocalNowPlaying(track);

      console.log('[PlayerWithSync] Playing track:', track.title);
    } catch (error) {
      console.error('[PlayerWithSync] Failed to play track:', error);
      onError?.('Failed to play track');
      throw error;
    }
  }, [queueManagement, onError]);

  // Handle track end - get next track and play
  const handleTrackEnd = useCallback(async () => {
    try {
      // Complete current track on server
      await queueManagement.completeTrack();

      // Get next track
      const nextTrack = await queueManagement.getNextTrack();

      if (nextTrack) {
        // Play next track
        await playTrack(nextTrack);
      } else {
        // No more tracks
        console.log('[PlayerWithSync] Queue empty');
        
        // Clear localStorage
        if (syncServiceRef.current) {
          await syncServiceRef.current.updateLocalNowPlaying(null);
        }
        
        setLocalNowPlaying(null);
      }
    } catch (error) {
      console.error('[PlayerWithSync] Failed to handle track end:', error);
      onError?.('Failed to get next track');
    }
  }, [queueManagement, playTrack, onError]);

  // Manual sync from server
  const syncNow = useCallback(async () => {
    if (syncServiceRef.current) {
      await syncServiceRef.current.syncNow();
      updateLocalState();
    }
  }, [updateLocalState]);

  // Manual push to server
  const pushToServer = useCallback(async () => {
    if (syncServiceRef.current) {
      await syncServiceRef.current.pushNow();
    }
  }, []);

  return {
    // Queue management methods (from useQueueManagement)
    ...queueManagement,
    
    // Player-specific overrides
    currentTrack: localNowPlaying || queueManagement.currentTrack,
    
    // Player methods
    playTrack,
    handleTrackEnd,
    
    // Sync control
    syncNow,
    pushToServer,
    
    // Local storage state
    localQueue,
    localNowPlaying,
  };
}
