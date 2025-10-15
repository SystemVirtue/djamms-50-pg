/**
 * useQueueManagement Hook
 * React hook for managing venue queue with real-time sync
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Databases, Client } from 'appwrite';
import {
  QueueManagementService,
  QueueDocument,
  QueueTrack,
  AddTrackOptions,
} from '../services/QueueManagementService';

export interface UseQueueManagementOptions {
  venueId: string;
  client: any; // AppWrite Client instance
  enableRealtime?: boolean;
}

export interface UseQueueManagementReturn {
  queue: QueueDocument | null;
  priorityQueue: QueueTrack[];
  mainQueue: QueueTrack[];
  currentTrack: QueueTrack | null;
  isLoading: boolean;
  error: Error | null;
  
  // Queue operations
  addTrack: (options: AddTrackOptions) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  reorderQueue: (queueType: 'mainQueue' | 'priorityQueue', trackIds: string[]) => Promise<void>;
  getNextTrack: () => Promise<QueueTrack | null>;
  startTrack: (trackId: string) => Promise<void>;
  completeTrack: () => Promise<void>;
  skipTrack: () => Promise<void>;
  clearQueue: (queueType?: 'mainQueue' | 'priorityQueue' | 'both') => Promise<void>;
  checkDuplicate: (videoId: string) => Promise<boolean>;
  
  // Queue stats
  queueStats: {
    priorityCount: number;
    mainCount: number;
    totalCount: number;
    estimatedWaitTime: number;
  };
}

/**
 * Hook for queue management
 */
export function useQueueManagement(
  options: UseQueueManagementOptions
): UseQueueManagementReturn {
  const { venueId, client, enableRealtime = true } = options;
  const queryClient = useQueryClient();
  
  const [error, setError] = useState<Error | null>(null);
  const serviceRef = useRef<QueueManagementService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize service
  useEffect(() => {
    if (client) {
      const databases = new Databases(client);
      serviceRef.current = new QueueManagementService(databases);
    }
  }, [client]);

  // Fetch queue
  const {
    data: queue,
    isLoading,
  } = useQuery({
    queryKey: ['queue', venueId],
    queryFn: async () => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.getQueue(venueId);
    },
    enabled: !!serviceRef.current && !!venueId,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: enableRealtime ? false : 5000, // Poll every 5s if no realtime
  });

  // Setup real-time subscription
  useEffect(() => {
    if (!enableRealtime || !client || !queue) return;

    const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    // Subscribe to queue document updates
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.queues.documents.${queue.$id}`,
      (response: any) => {
        console.log('[useQueueManagement] Real-time update:', response);

        // Update query cache with new data
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          queryClient.setQueryData(['queue', venueId], response.payload);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enableRealtime, client, queue, venueId, queryClient]);

  // Add track mutation
  const addTrackMutation = useMutation({
    mutationFn: async (trackOptions: AddTrackOptions) => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.addTrack(venueId, trackOptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error adding track:', err);
    },
  });

  // Remove track mutation
  const removeTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.removeTrack(venueId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error removing track:', err);
    },
  });

  // Reorder queue mutation
  const reorderQueueMutation = useMutation({
    mutationFn: async (params: {
      queueType: 'mainQueue' | 'priorityQueue';
      trackIds: string[];
    }) => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.reorderQueue(
        venueId,
        params.queueType,
        params.trackIds
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error reordering queue:', err);
    },
  });

  // Start track mutation
  const startTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.startTrack(venueId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error starting track:', err);
    },
  });

  // Complete track mutation
  const completeTrackMutation = useMutation({
    mutationFn: async () => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.completeTrack(venueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error completing track:', err);
    },
  });

  // Skip track mutation
  const skipTrackMutation = useMutation({
    mutationFn: async () => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.skipTrack(venueId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error skipping track:', err);
    },
  });

  // Clear queue mutation
  const clearQueueMutation = useMutation({
    mutationFn: async (queueType?: 'mainQueue' | 'priorityQueue' | 'both') => {
      if (!serviceRef.current) throw new Error('Service not initialized');
      return await serviceRef.current.clearQueue(venueId, queueType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', venueId] });
    },
    onError: (err: Error) => {
      setError(err);
      console.error('[useQueueManagement] Error clearing queue:', err);
    },
  });

  // Get next track
  const getNextTrack = useCallback(async (): Promise<QueueTrack | null> => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    return await serviceRef.current.getNextTrack(venueId);
  }, [venueId]);

  // Check duplicate
  const checkDuplicate = useCallback(
    async (videoId: string): Promise<boolean> => {
      if (!serviceRef.current) {
        throw new Error('Service not initialized');
      }
      return await serviceRef.current.checkDuplicate(venueId, videoId);
    },
    [venueId]
  );

  // Calculate queue stats
  const queueStats = {
    priorityCount: queue?.priorityQueue.length || 0,
    mainCount: queue?.mainQueue.length || 0,
    totalCount: (queue?.priorityQueue.length || 0) + (queue?.mainQueue.length || 0),
    estimatedWaitTime:
      (queue?.priorityQueue.reduce((sum, t) => sum + t.duration, 0) || 0) +
      (queue?.mainQueue.reduce((sum, t) => sum + t.duration, 0) || 0) +
      (queue?.currentTrack?.duration || 0),
  };

  return {
    queue: queue || null,
    priorityQueue: queue?.priorityQueue || [],
    mainQueue: queue?.mainQueue || [],
    currentTrack: queue?.currentTrack || null,
    isLoading,
    error,

    // Operations
    addTrack: async (options: AddTrackOptions) => {
      await addTrackMutation.mutateAsync(options);
    },
    removeTrack: async (trackId: string) => {
      await removeTrackMutation.mutateAsync(trackId);
    },
    reorderQueue: async (queueType: 'mainQueue' | 'priorityQueue', trackIds: string[]) => {
      await reorderQueueMutation.mutateAsync({ queueType, trackIds });
    },
    getNextTrack,
    startTrack: async (trackId: string) => {
      await startTrackMutation.mutateAsync(trackId);
    },
    completeTrack: async () => {
      await completeTrackMutation.mutateAsync();
    },
    skipTrack: async () => {
      await skipTrackMutation.mutateAsync();
    },
    clearQueue: async (queueType?: 'mainQueue' | 'priorityQueue' | 'both') => {
      await clearQueueMutation.mutateAsync(queueType);
    },
    checkDuplicate,

    // Stats
    queueStats,
  };
}
