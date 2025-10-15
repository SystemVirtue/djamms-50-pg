/**
 * usePlaylistManagement - React hook for playlist CRUD operations
 * 
 * Provides React-friendly interface to PlaylistManagementService with:
 * - Automatic initialization from environment variables
 * - Error handling and loading states
 * - Memoized callbacks to prevent re-renders
 * 
 * Usage:
 * ```tsx
 * const { 
 *   playlists, 
 *   loading, 
 *   error,
 *   createPlaylist,
 *   updatePlaylist,
 *   deletePlaylist,
 *   addTrack,
 *   removeTrack 
 * } = usePlaylistManagement(venueId);
 * ```
 * 
 * @module usePlaylistManagement
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlaylistManagementService } from '../services/PlaylistManagementService';
import type { Playlist, Track } from '../types';

/**
 * Hook configuration
 */
export interface UsePlaylistManagementConfig {
  venueId?: string;
  ownerId?: string;
}

/**
 * Hook return value
 */
export interface UsePlaylistManagementReturn {
  // State
  playlists: Playlist[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createPlaylist: (data: {
    name: string;
    description?: string;
    ownerId: string;
    venueId?: string;
    tracks?: Track[];
  }) => Promise<Playlist>;
  updatePlaylist: (
    playlistId: string,
    updates: {
      name?: string;
      description?: string;
      venueId?: string;
    }
  ) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;

  // Track operations
  addTrack: (playlistId: string, track: Track) => Promise<Playlist>;
  removeTrack: (playlistId: string, videoId: string) => Promise<Playlist>;
  reorderTracks: (playlistId: string, trackOrder: string[]) => Promise<Playlist>;
  updateTracks: (playlistId: string, tracks: Track[]) => Promise<Playlist>;

  // Utility functions
  getPlaylist: (playlistId: string) => Promise<Playlist>;
  refreshPlaylists: () => Promise<void>;
  getTotalDuration: (playlist: Playlist) => number;
  hasTrack: (playlist: Playlist, videoId: string) => boolean;
}

/**
 * React hook for playlist management
 * 
 * @param config - Configuration object with venueId or ownerId
 * @returns Playlist management interface
 */
export function usePlaylistManagement(
  config: UsePlaylistManagementConfig = {}
): UsePlaylistManagementReturn {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service from environment
  const service = useMemo(() => {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
    const collectionId = import.meta.env.VITE_APPWRITE_PLAYLISTS_COLLECTION_ID || 'playlists';

    return new PlaylistManagementService({
      endpoint,
      projectId,
      databaseId,
      collectionId,
    });
  }, []);

  /**
   * Refresh playlists from database
   */
  const refreshPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedPlaylists: Playlist[] = [];

      // Fetch by venue if venueId provided
      if (config.venueId) {
        fetchedPlaylists = await service.getPlaylistsByVenue(config.venueId);
      }
      // Fetch by owner if ownerId provided
      else if (config.ownerId) {
        fetchedPlaylists = await service.getPlaylistsByOwner(config.ownerId);
      }

      setPlaylists(fetchedPlaylists);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch playlists';
      setError(message);
      console.error('Failed to fetch playlists:', err);
    } finally {
      setLoading(false);
    }
  }, [config.venueId, config.ownerId, service]);

  /**
   * Load playlists on mount and when config changes
   */
  useEffect(() => {
    if (config.venueId || config.ownerId) {
      refreshPlaylists();
    } else {
      setLoading(false);
    }
  }, [config.venueId, config.ownerId, refreshPlaylists]);

  /**
   * Get a single playlist by ID
   */
  const getPlaylist = useCallback(
    async (playlistId: string): Promise<Playlist> => {
      try {
        return await service.getPlaylist(playlistId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get playlist';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Create a new playlist
   */
  const createPlaylist = useCallback(
    async (data: {
      name: string;
      description?: string;
      ownerId: string;
      venueId?: string;
      tracks?: Track[];
    }): Promise<Playlist> => {
      try {
        setError(null);
        const newPlaylist = await service.createPlaylist(data);
        setPlaylists((prev) => [newPlaylist, ...prev]);
        return newPlaylist;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create playlist';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Update playlist metadata
   */
  const updatePlaylist = useCallback(
    async (
      playlistId: string,
      updates: {
        name?: string;
        description?: string;
        venueId?: string;
      }
    ): Promise<Playlist> => {
      try {
        setError(null);
        const updated = await service.updatePlaylist(playlistId, updates);
        setPlaylists((prev) =>
          prev.map((p) => (p.playlistId === playlistId ? updated : p))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update playlist';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Delete a playlist
   */
  const deletePlaylist = useCallback(
    async (playlistId: string): Promise<void> => {
      try {
        setError(null);
        await service.deletePlaylist(playlistId);
        setPlaylists((prev) => prev.filter((p) => p.playlistId !== playlistId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete playlist';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Add a track to a playlist
   */
  const addTrack = useCallback(
    async (playlistId: string, track: Track): Promise<Playlist> => {
      try {
        setError(null);
        const updated = await service.addTrack(playlistId, track);
        setPlaylists((prev) =>
          prev.map((p) => (p.playlistId === playlistId ? updated : p))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add track';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Remove a track from a playlist
   */
  const removeTrack = useCallback(
    async (playlistId: string, videoId: string): Promise<Playlist> => {
      try {
        setError(null);
        const updated = await service.removeTrack(playlistId, videoId);
        setPlaylists((prev) =>
          prev.map((p) => (p.playlistId === playlistId ? updated : p))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove track';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Reorder tracks in a playlist
   */
  const reorderTracks = useCallback(
    async (playlistId: string, trackOrder: string[]): Promise<Playlist> => {
      try {
        setError(null);
        const updated = await service.reorderTracks(playlistId, trackOrder);
        setPlaylists((prev) =>
          prev.map((p) => (p.playlistId === playlistId ? updated : p))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder tracks';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Update all tracks in a playlist (bulk replace)
   */
  const updateTracks = useCallback(
    async (playlistId: string, tracks: Track[]): Promise<Playlist> => {
      try {
        setError(null);
        const updated = await service.updateTracks(playlistId, tracks);
        setPlaylists((prev) =>
          prev.map((p) => (p.playlistId === playlistId ? updated : p))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tracks';
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Get total duration of playlist
   */
  const getTotalDuration = useCallback(
    (playlist: Playlist): number => {
      return service.calculateTotalDuration(playlist);
    },
    [service]
  );

  /**
   * Check if playlist has a track
   */
  const hasTrack = useCallback(
    (playlist: Playlist, videoId: string): boolean => {
      return service.hasTrack(playlist, videoId);
    },
    [service]
  );

  return {
    // State
    playlists,
    loading,
    error,

    // CRUD operations
    createPlaylist,
    updatePlaylist,
    deletePlaylist,

    // Track operations
    addTrack,
    removeTrack,
    reorderTracks,
    updateTracks,

    // Utility functions
    getPlaylist,
    refreshPlaylists,
    getTotalDuration,
    hasTrack,
  };
}
