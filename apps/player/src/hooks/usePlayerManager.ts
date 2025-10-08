import { useCallback, useEffect, useRef, useState } from 'react';
import { Databases, Query } from 'appwrite';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { PlayerRegistry } from '@appwrite/player-registry';
import { config } from '@shared/config/env';
import type { PlayerState, Track } from '@shared/types';

export const usePlayerManager = (venueId: string) => {
  const [playerState, setPlayerState] = useState<PlayerState>();
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track>();
  const [error, setError] = useState<string>();
  const { auth, databases, client } = useAppwrite();
  const playerRegistry = useRef(new PlayerRegistry());
  const realtimeSubscription = useRef<(() => void) | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializePlayer();
    return () => {
      // Cleanup synchronously, call async cleanup without awaiting
      cleanup();
    };
  }, [venueId]);

  const initializePlayer = async () => {
    try {
      // Validate environment is available (basic check)
      if (!config.appwrite.endpoint || !config.appwrite.projectId) {
        throw new Error('Missing required AppWrite configuration');
      }
    } catch (err: any) {
      setError(err.message);
      setIsMaster(false);
      return;
    }

    const session = await auth.getCurrentSession();
    if (!session) {
      setIsMaster(false);
      setError('Authentication required');
      return;
    }

    try {
      const wasMaster = localStorage.getItem(`isMasterPlayer_${venueId}`) === 'true';
      let masterStatus: boolean;

      if (wasMaster) {
        masterStatus = await playerRegistry.current.checkMasterStatus(
          venueId,
          session.token
        );
      } else {
        const result = await playerRegistry.current.requestMasterPlayer(
          venueId,
          session.token
        );
        masterStatus = result.success;

        if (!result.success) {
          setError(
            result.reason === 'MASTER_ACTIVE'
              ? 'Player is active on another device'
              : 'Failed to connect to player service'
          );
        }
      }

      setIsMaster(masterStatus);

      if (masterStatus) {
        await loadQueue();
        startRealtimeSubscription();
        startPolling();
      }
    } catch (err: any) {
      setError('Failed to initialize player');
      setIsMaster(false);
    }
  };

  const loadQueue = async () => {
    try {
      const localQueue = localStorage.getItem(`djammsQueue_${venueId}`);
      if (localQueue) {
        const parsed = JSON.parse(localQueue);
        setPlayerState(parsed);
        setCurrentTrack(parsed.nowPlaying);
        return;
      }

      const queueDoc = await databases.listDocuments(
        config.appwrite.databaseId,
        'queues',
        [Query.equal('venueId', venueId)]
      );

      const serverQueue = queueDoc.documents[0] || {
        venueId,
        mainQueue: [],
        priorityQueue: [],
        createdAt: new Date().toISOString(),
      };

      setPlayerState(serverQueue as any);
      setCurrentTrack(serverQueue.nowPlaying);
      localStorage.setItem(`djammsQueue_${venueId}`, JSON.stringify(serverQueue));
    } catch (err) {
      setError('Failed to load queue');
    }
  };

  const startRealtimeSubscription = () => {
    const channelName = `databases.${config.appwrite.databaseId}.collections.queues.documents`;

    const unsubscribe = client.subscribe(channelName, (response: any) => {
      if (response.payload && response.payload.venueId === venueId) {
        setPlayerState(response.payload);
        setCurrentTrack(response.payload.nowPlaying);
        localStorage.setItem(
          `djammsQueue_${venueId}`,
          JSON.stringify(response.payload)
        );
      }
    });

    realtimeSubscription.current = unsubscribe;
  };

  const startPolling = () => {
    pollingInterval.current = setInterval(async () => {
      if (isMaster) {
        await syncWithServer();
      }
    }, 15000);
  };

  const syncWithServer = async () => {
    try {
      const session = await auth.getCurrentSession();
      if (!session) return;

      const response = await fetch(
        `${config.appwrite.endpoint}/functions/player-registry/sync`,
        {
          headers: { Authorization: `Bearer ${session.token}` },
        }
      );

      if (response.ok) {
        // Implement sync logic if needed
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  };

  const playNextTrack = useCallback(async () => {
    if (!playerState || !isMaster) return;

    try {
      const nextTrack = getNextTrack(playerState);
      if (nextTrack) {
        setCurrentTrack(nextTrack);
        const session = await auth.getCurrentSession();
        if (session) {
          await updateNowPlaying(venueId, nextTrack, databases);
        }

        if (nextTrack.realEndOffset) {
          scheduleCrossfade(nextTrack, playerState);
        }
      }
    } catch (err) {
      setError('Failed to play next track');
    }
  }, [playerState, isMaster, venueId]);

  const scheduleCrossfade = (track: Track, state: PlayerState) => {
    const fadeStartTime = ((track.duration - (track.realEndOffset || 0)) - 5) * 1000;
    if (fadeStartTime > 0) {
      setTimeout(() => {
        const nextTrack = getNextTrack(state);
        window.dispatchEvent(
          new CustomEvent('startCrossfade', { detail: { nextTrack } })
        );
      }, fadeStartTime);
    }
  };

  const cleanup = () => {
    if (realtimeSubscription.current) {
      realtimeSubscription.current();
    }

    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Cleanup player registry asynchronously without blocking
    auth.getCurrentSession().then(session => {
      if (session) {
        playerRegistry.current.cleanup(venueId, session.token);
      }
    }).catch(err => {
      console.error('Cleanup error:', err);
    });
  };

  const retryConnection = async () => {
    setError(undefined);
    await initializePlayer();
  };

  return {
    playerState,
    isMaster,
    currentTrack,
    error,
    playNextTrack,
    skipTrack: playNextTrack,
    retryConnection,
  };
};

const getNextTrack = (state: PlayerState): Track | undefined => {
  if (state.priorityQueue.length > 0) {
    return state.priorityQueue[0];
  }
  if (state.mainQueue.length > 0) {
    return state.mainQueue[0];
  }
  return undefined;
};

const updateNowPlaying = async (
  venueId: string,
  track: Track,
  databases: Databases
) => {
  const queueDoc = await databases.listDocuments(
    config.appwrite.databaseId,
    'queues',
    [Query.equal('venueId', venueId)]
  );

  const queue = queueDoc.documents[0] || {
    venueId,
    mainQueue: [],
    priorityQueue: [],
    createdAt: new Date().toISOString(),
  };

  const isRequest = track.isRequest;
  const updatedPriorityQueue = isRequest
    ? queue.priorityQueue.slice(1)
    : queue.priorityQueue;
  const updatedMainQueue = isRequest ? queue.mainQueue : queue.mainQueue.slice(1);

  if (!isRequest && queue.mainQueue.length > 0) {
    updatedMainQueue.push({
      ...queue.mainQueue[0],
      position: updatedMainQueue.length + 1,
    });
  }

  await databases.updateDocument(
    config.appwrite.databaseId,
    'queues',
    queue.$id || 'unique()',
    {
      ...queue,
      nowPlaying: {
        ...track,
        startTime: Date.now(),
        remaining: track.duration - 1,
      },
      mainQueue: updatedMainQueue.map((t: any, i: number) => ({
        ...t,
        position: i + 1,
      })),
      priorityQueue: updatedPriorityQueue.map((t: any, i: number) => ({
        ...t,
        position: i + 1,
      })),
    }
  );
};
