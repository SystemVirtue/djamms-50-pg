import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from 'appwrite';
import { PlayerService } from '../services/PlayerService';
import { QueueService } from '../services/QueueService';
import { PlayerSyncService } from '../services/PlayerSyncService';
import type { Track, NowPlaying, PlayerState } from '../types/player';

export interface UsePlayerManagerOptions {
  venueId: string;
  databaseId: string;
  client: Client;
  onError?: (error: string) => void;
  onMasterStatusChange?: (isMaster: boolean) => void;
  enableStateSync?: boolean; // Enable cross-device state synchronization
}

export interface UsePlayerManagerReturn {
  playerState: PlayerState | null;
  isMaster: boolean | null;
  currentTrack: NowPlaying | null;
  isLoading: boolean;
  error: string | null;
  playNextTrack: () => void;
  retryConnection: () => void;
  setVolume: (volume: number) => void;
  volume: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

/**
 * Hook for managing player state, master election, and queue synchronization
 */
export function usePlayerManager({
  venueId,
  databaseId,
  client,
  onError,
  onMasterStatusChange,
  enableStateSync = true,
}: UsePlayerManagerOptions): UsePlayerManagerReturn {
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [currentTrack, setCurrentTrack] = useState<NowPlaying | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(100);
  const [isPlaying, setIsPlayingState] = useState(true);

  const playerServiceRef = useRef<PlayerService>(new PlayerService(client));
  const queueServiceRef = useRef<QueueService>(new QueueService(client));
  const syncServiceRef = useRef<PlayerSyncService>(new PlayerSyncService(client));
  const playerIdRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string>(generateDeviceId());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const stateSyncUnsubscribeRef = useRef<(() => void) | null>(null);
  const commandUnsubscribeRef = useRef<(() => void) | null>(null);

  // Generate unique device ID
  function generateDeviceId(): string {
    const stored = localStorage.getItem('djamms_device_id');
    if (stored) return stored;

    const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('djamms_device_id', id);
    return id;
  }

  // Initialize player and request master status
  useEffect(() => {
    initializePlayer();

    return () => {
      cleanup();
    };
  }, [venueId]);

  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request master status
      const result = await playerServiceRef.current.requestMaster(
        venueId,
        deviceIdRef.current,
        databaseId
      );

      if (result.success && result.playerId) {
        // We are now master
        playerIdRef.current = result.playerId;
        setIsMaster(true);
        onMasterStatusChange?.(true);

        // Start heartbeat
        playerServiceRef.current.startHeartbeat(result.playerId, databaseId);

        // Load queue
        await loadQueue();

        // Subscribe to queue updates
        subscribeToQueue();

        // Subscribe to player commands (if state sync enabled)
        if (enableStateSync) {
          subscribeToCommands();
        }
      } else {
        // Another player is master
        setIsMaster(false);
        onMasterStatusChange?.(false);
        setError(result.reason || 'Another player is active');
        onError?.(result.reason || 'Another player is active');

        // Non-master players can still listen to state updates
        if (enableStateSync) {
          subscribeToPlayerState();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize player';
      setError(message);
      setIsMaster(false);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load queue from AppWrite
  const loadQueue = async () => {
    try {
      const { priorityQueue, mainQueue } = await queueServiceRef.current.getQueue(venueId);

      // Get now playing from localStorage or start first track
      const storedNowPlaying = localStorage.getItem(`djamms_now_playing_${venueId}`);
      let nowPlaying: NowPlaying | null = null;

      if (storedNowPlaying) {
        nowPlaying = JSON.parse(storedNowPlaying);
      } else if (priorityQueue.length > 0) {
        // Start first priority track
        nowPlaying = {
          ...priorityQueue[0],
          startTime: Date.now(),
          remaining: priorityQueue[0].duration,
        };
      } else if (mainQueue.length > 0) {
        // Start first main track
        nowPlaying = {
          ...mainQueue[0],
          startTime: Date.now(),
          remaining: mainQueue[0].duration,
        };
      }

      setPlayerState({
        venueId,
        nowPlaying: nowPlaying || undefined,
        mainQueue: mainQueue.map((track: Track, index: number) => ({ ...track, position: index })),
        priorityQueue: priorityQueue.map((track: Track, index: number) => ({
          ...track,
          requesterId: track.requesterId || 'unknown',
          paidCredit: track.paidCredit || 1,
          position: index,
        })),
        isMaster: true,
      });

      setCurrentTrack(nowPlaying);

      if (nowPlaying) {
        localStorage.setItem(`djamms_now_playing_${venueId}`, JSON.stringify(nowPlaying));
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
      setError('Failed to load queue');
    }
  };

  // Subscribe to queue updates
  const subscribeToQueue = () => {
    const unsubscribe = queueServiceRef.current.subscribeToQueue(
      venueId,
      async (response) => {
        console.log('Queue updated:', response);
        // Reload queue
        await loadQueue();
      }
    );

    unsubscribeRef.current = unsubscribe;
  };

  // Subscribe to player state updates (for viewers/admin)
  const subscribeToPlayerState = () => {
    const unsubscribe = syncServiceRef.current.subscribeToPlayerState(
      venueId,
      databaseId,
      client,
      (state) => {
        console.log('Player state updated:', state);
        // Update local state from master player
        if (state.nowPlaying) {
          setCurrentTrack(state.nowPlaying);
        }
        setVolumeState(state.volume);
        setIsPlayingState(state.isPlaying);
      }
    );

    stateSyncUnsubscribeRef.current = unsubscribe;
  };

  // Subscribe to player commands (for master player to execute)
  const subscribeToCommands = () => {
    const unsubscribe = syncServiceRef.current.subscribeToCommands(
      venueId,
      databaseId,
      client,
      async (command) => {
        console.log('Received command:', command);
        
        if (!playerIdRef.current) return;

        try {
          // Execute command
          switch (command.command) {
            case 'play':
              setIsPlayingState(true);
              break;
            case 'pause':
              setIsPlayingState(false);
              break;
            case 'skip':
              await playNextTrack();
              break;
            case 'volume':
              if (command.payload && typeof command.payload.volume === 'number') {
                setVolumeState(command.payload.volume);
              }
              break;
          }

          // Mark as executed
          await syncServiceRef.current.markCommandExecuted(
            command.$id,
            playerIdRef.current,
            databaseId
          );

          // Sync updated state
          await syncPlayerState();
        } catch (error) {
          console.error('Failed to execute command:', error);
        }
      }
    );

    commandUnsubscribeRef.current = unsubscribe;
  };

  // Sync current player state to database (master only)
  const syncPlayerState = async () => {
    if (!isMaster || !playerIdRef.current) return;

    try {
      await syncServiceRef.current.updatePlayerState(
        venueId,
        playerIdRef.current,
        {
          venueId,
          nowPlaying: currentTrack,
          isPlaying,
          volume,
          lastUpdated: Date.now(),
          updatedBy: playerIdRef.current,
        } as any,
        databaseId
      );
    } catch (error) {
      console.error('Failed to sync player state:', error);
    }
  };

  // Play next track
  const playNextTrack = useCallback(async () => {
    if (!playerState) return;

    try {
      // Get next track
      let nextTrack: Track | null = null;

      if (playerState.priorityQueue.length > 0) {
        nextTrack = playerState.priorityQueue[0];
      } else if (playerState.mainQueue.length > 0) {
        nextTrack = playerState.mainQueue[0];
      }

      if (nextTrack) {
        const nowPlaying: NowPlaying = {
          ...nextTrack,
          startTime: Date.now(),
          remaining: nextTrack.duration,
        };

        setCurrentTrack(nowPlaying);
        localStorage.setItem(`djamms_now_playing_${venueId}`, JSON.stringify(nowPlaying));

        // Update player state
        setPlayerState((prev) => prev ? { ...prev, nowPlaying } : null);
        
        // Note: Actual removal from AppWrite queue happens via real-time sync
        // when queue updates are received
      } else {
        // No more tracks
        setCurrentTrack(null);
        localStorage.removeItem(`djamms_now_playing_${venueId}`);
        setPlayerState((prev) => prev ? { ...prev, nowPlaying: undefined } : null);
      }
    } catch (err) {
      console.error('Failed to play next track:', err);
    }
  }, [playerState, currentTrack, venueId]);

  // Retry connection (for non-master players)
  const retryConnection = useCallback(() => {
    initializePlayer();
  }, [venueId]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    localStorage.setItem('djamms_volume', clampedVolume.toString());
  }, []);

  // Load saved volume on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('djamms_volume');
    if (savedVolume) {
      setVolumeState(parseInt(savedVolume, 10));
    }
  }, []);

  // Sync player state when it changes (master only)
  useEffect(() => {
    if (isMaster && enableStateSync && playerIdRef.current) {
      syncPlayerState();
    }
  }, [currentTrack, isPlaying, volume, isMaster]);

  // Cleanup
  const cleanup = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    if (stateSyncUnsubscribeRef.current) {
      stateSyncUnsubscribeRef.current();
    }

    if (commandUnsubscribeRef.current) {
      commandUnsubscribeRef.current();
    }

    if (playerIdRef.current) {
      playerServiceRef.current.releaseMaster(playerIdRef.current, databaseId);
    }
  };

  // Wrapper for setIsPlaying that syncs state
  const setIsPlaying = useCallback((playing: boolean) => {
    setIsPlayingState(playing);
  }, []);

  return {
    playerState,
    isMaster,
    currentTrack,
    isLoading,
    error,
    playNextTrack,
    retryConnection,
    setVolume,
    volume,
    isPlaying,
    setIsPlaying,
  };
}
