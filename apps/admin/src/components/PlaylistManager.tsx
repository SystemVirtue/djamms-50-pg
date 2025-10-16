/**
 * Playlist Manager Component
 * 
 * Simple playlist management UI for viewing and creating playlists
 * Uses usePlaylistManagement hook from @djamms/shared
 */

import * as React from 'react';
import { useState } from 'react';
import { Plus, List, Music, Trash2 } from 'lucide-react';
import { usePlaylistManagement } from '@djamms/shared';
import type { Client } from 'appwrite';

interface PlaylistManagerProps {
  venueId: string;
  ownerId: string; // User ID of the admin
  client?: Client; // Optional - service initializes from env
  className?: string;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  venueId,
  ownerId,
  className = '',
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  const {
    playlists,
    loading,
    error,
    createPlaylist,
    deletePlaylist,
  } = usePlaylistManagement({
    venueId,
  });

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      return;
    }

    try {
      await createPlaylist({
        name: newPlaylistName,
        description: newPlaylistDescription,
        ownerId,
        venueId,
        tracks: [],
      });

      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist? This cannot be undone.')) {
      return;
    }

    try {
      await deletePlaylist(playlistId);
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="mt-2 text-sm text-gray-400">Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-900/50 border border-red-700 rounded-lg ${className}`}>
        <p className="text-red-300 text-sm">
          Failed to load playlists: {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Playlist Manager</h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium text-white bg-orange-600
            hover:bg-orange-700 transition-colors
          "
        >
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {/* Playlists List */}
      <div className="space-y-3">
        {playlists.map((playlist) => (
          <div
            key={playlist.playlistId}
            className="border border-gray-700 rounded-lg p-4 bg-gray-800 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-white">{playlist.name}</h3>
              </div>
              <button
                onClick={() => handleDeletePlaylist(playlist.playlistId)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {playlist.description && (
              <p className="text-sm text-gray-400 mb-3">{playlist.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Music className="w-4 h-4" />
                <span>{playlist.tracks?.length || 0} tracks</span>
              </div>
              {playlist.updatedAt && (
                <div className="text-xs">
                  Updated {new Date(playlist.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Show first few tracks */}
            {playlist.tracks && playlist.tracks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="space-y-1">
                  {playlist.tracks.slice(0, 3).map((track: any, index: number) => (
                    <div key={`${track.videoId}-${index}`} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{index + 1}.</span>
                      <span className="text-gray-300 truncate">{track.title}</span>
                    </div>
                  ))}
                  {playlist.tracks.length > 3 && (
                    <div className="text-xs text-gray-500 pl-5">
                      +{playlist.tracks.length - 3} more tracks
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {playlists.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">No playlists yet</p>
            <p className="text-sm text-gray-500">Create your first playlist to get started</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Playlist</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                    text-white placeholder-gray-400
                    focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                  "
                  placeholder="e.g., Top Hits 2025"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                    text-white placeholder-gray-400
                    focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                  "
                  placeholder="Brief description of this playlist"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="
                  flex-1 px-4 py-2 rounded-lg font-medium text-white
                  bg-orange-600 hover:bg-orange-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                Create Playlist
              </button>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                }}
                className="
                  flex-1 px-4 py-2 rounded-lg font-medium
                  border border-gray-600 text-gray-300
                  hover:bg-gray-700 transition-colors
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
