import { Library, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Client, Databases, Query, ID } from 'appwrite';

interface Playlist {
  $id: string;
  name: string;
  description?: string;
  tracks: Array<{ videoId: string; title: string; artist: string }>;
  createdAt: string;
}

interface PlaylistLibraryTabProps {
  venueId: string;
}

export function PlaylistLibraryTab({ venueId }: PlaylistLibraryTabProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, [venueId]);

  const loadPlaylists = async () => {
    try {
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
      
      const databases = new Databases(client);
      
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'playlists',
        [Query.equal('venueId', venueId), Query.limit(100)]
      );

      setPlaylists(response.documents as unknown as Playlist[]);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      // Fallback to localStorage
      const localPlaylists = localStorage.getItem(`djammsPlaylists_${venueId}`);
      if (localPlaylists) {
        setPlaylists(JSON.parse(localPlaylists));
      }
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
      
      const databases = new Databases(client);

      const newPlaylist = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'playlists',
        ID.unique(),
        {
          venueId,
          name: newPlaylistName,
          description: newPlaylistDescription,
          tracks: [],
          createdAt: new Date().toISOString()
        }
      );

      setPlaylists([...playlists, newPlaylist as unknown as Playlist]);
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      // Fallback to localStorage
      const playlist: Playlist = {
        $id: Date.now().toString(),
        name: newPlaylistName,
        description: newPlaylistDescription,
        tracks: [],
        createdAt: new Date().toISOString()
      };
      const updated = [...playlists, playlist];
      setPlaylists(updated);
      localStorage.setItem(`djammsPlaylists_${venueId}`, JSON.stringify(updated));
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
      
      const databases = new Databases(client);

      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'playlists',
        playlistId
      );

      setPlaylists(playlists.filter(p => p.$id !== playlistId));
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      // Fallback to localStorage
      const updated = playlists.filter(p => p.$id !== playlistId);
      setPlaylists(updated);
      localStorage.setItem(`djammsPlaylists_${venueId}`, JSON.stringify(updated));
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white py-12">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading playlists...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Library className="w-8 h-8 text-pink-400" />
            <h2 className="text-3xl font-bold text-white">Playlist Library</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>

        {/* Playlists Grid */}
        {playlists.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.$id}
                className="glass-morphism rounded-xl p-6 hover:bg-white/10 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <Library className="w-10 h-10 text-pink-400" />
                  <button
                    onClick={() => deletePlaylist(playlist.$id)}
                    className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-gray-300 text-sm mb-3">{playlist.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{playlist.tracks.length} tracks</span>
                  <span className="text-gray-500">
                    {new Date(playlist.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-morphism rounded-xl p-12 text-center">
            <Library className="w-20 h-20 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">No playlists yet</h3>
            <p className="text-gray-400 mb-6">Create your first playlist to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition font-medium"
            >
              Create Your First Playlist
            </button>
          </div>
        )}

        {/* Create Playlist Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-6">Create New Playlist</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter playlist name..."
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    placeholder="Describe your playlist..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createPlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="flex-1 px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
