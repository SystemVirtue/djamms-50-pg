import { useState, useCallback, useEffect } from 'react';
import { SearchResult } from '../components/VideoCard';
import { Track, NowPlaying } from '../types/player';

export type JukeboxMode = 'FREEPLAY' | 'PAID';

export interface JukeboxState {
  mode: JukeboxMode;
  credits: number;
  priorityQueue: Track[];
  mainQueue: Track[];
  nowPlaying: NowPlaying | null;
  isPlayerRunning: boolean;
  isPlayerPaused: boolean;
  countdown: number;
}

export interface UseJukeboxStateReturn {
  state: JukeboxState;
  addCredits: (amount: number) => void;
  setMode: (mode: JukeboxMode) => void;
  addToQueue: (video: SearchResult, isPriority?: boolean) => void;
  removeFromQueue: (trackIndex: number, isPriority: boolean) => void;
  setNowPlaying: (track: Track | null) => void;
  setPlayerState: (isRunning: boolean, isPaused: boolean) => void;
  getNextTrack: () => Track | null;
  clearQueue: () => void;
}

/**
 * Custom hook for managing jukebox state
 * Adapted from prod-jukebox useJukeboxState
 * 
 * Note: This is the LOCAL state management
 * For multi-device sync, this needs to be combined with AppWrite Realtime
 */
export function useJukeboxState(
  _venueId: string, // Reserved for future AppWrite integration
  initialMode: JukeboxMode = 'FREEPLAY'
): UseJukeboxStateReturn {
  const [state, setState] = useState<JukeboxState>({
    mode: initialMode,
    credits: 0,
    priorityQueue: [],
    mainQueue: [],
    nowPlaying: null,
    isPlayerRunning: false,
    isPlayerPaused: false,
    countdown: 0
  });

  // Update countdown timer
  useEffect(() => {
    if (!state.nowPlaying || state.isPlayerPaused) {
      return;
    }

    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.nowPlaying) return prev;
        
        const remaining = Math.max(0, prev.nowPlaying.remaining - 1);

        // Track ended
        if (remaining === 0) {
          return {
            ...prev,
            nowPlaying: null,
            countdown: 0
          };
        }

        return {
          ...prev,
          nowPlaying: {
            ...prev.nowPlaying,
            remaining
          },
          countdown: remaining
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.nowPlaying, state.isPlayerPaused]);

  const addCredits = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      credits: prev.credits + amount
    }));
  }, []);

  const setMode = useCallback((mode: JukeboxMode) => {
    setState(prev => ({
      ...prev,
      mode
    }));
  }, []);

  const addToQueue = useCallback((video: SearchResult, isPriority = false) => {
    const track: Track = {
      videoId: video.id,
      title: video.title,
      artist: video.channelTitle,
      duration: video.duration,
      isRequest: isPriority,
      position: 0 // Will be set when syncing with AppWrite
    };

    setState(prev => {
      if (isPriority) {
        return {
          ...prev,
          priorityQueue: [...prev.priorityQueue, track],
          credits: prev.mode === 'PAID' ? prev.credits - 1 : prev.credits
        };
      } else {
        return {
          ...prev,
          mainQueue: [...prev.mainQueue, track]
        };
      }
    });
  }, []);

  const removeFromQueue = useCallback((trackIndex: number, isPriority: boolean) => {
    setState(prev => {
      if (isPriority) {
        return {
          ...prev,
          priorityQueue: prev.priorityQueue.filter((_, i) => i !== trackIndex)
        };
      } else {
        return {
          ...prev,
          mainQueue: prev.mainQueue.filter((_, i) => i !== trackIndex)
        };
      }
    });
  }, []);

  const setNowPlaying = useCallback((track: Track | null) => {
    if (!track) {
      setState(prev => ({
        ...prev,
        nowPlaying: null,
        countdown: 0
      }));
      return;
    }

    const nowPlaying: NowPlaying = {
      ...track,
      startTime: Date.now(),
      remaining: track.duration
    };

    setState(prev => ({
      ...prev,
      nowPlaying,
      countdown: track.duration
    }));
  }, []);

  const setPlayerState = useCallback((isRunning: boolean, isPaused: boolean) => {
    setState(prev => ({
      ...prev,
      isPlayerRunning: isRunning,
      isPlayerPaused: isPaused
    }));
  }, []);

  const getNextTrack = useCallback((): Track | null => {
    // Priority queue first
    if (state.priorityQueue.length > 0) {
      return state.priorityQueue[0];
    }

    // Then main queue
    if (state.mainQueue.length > 0) {
      return state.mainQueue[0];
    }

    return null;
  }, [state.priorityQueue, state.mainQueue]);

  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      priorityQueue: [],
      mainQueue: []
    }));
  }, []);

  return {
    state,
    addCredits,
    setMode,
    addToQueue,
    removeFromQueue,
    setNowPlaying,
    setPlayerState,
    getNextTrack,
    clearQueue
  };
}

export default useJukeboxState;
