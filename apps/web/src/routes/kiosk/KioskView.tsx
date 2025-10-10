import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function KioskView() {
  const { venueId } = useParams<{ venueId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Placeholder for now - full KioskView implementation requires:
  // - YouTube API integration
  // - Stripe payment integration
  // - Config for API keys
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🖥️ Request a Song</h1>
          <p className="text-gray-400">Venue: {venueId}</p>
        </header>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a song..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Results Placeholder */}
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Search for Songs</h3>
          <p className="text-gray-400">
            Enter a song name, artist, or keywords to find music
          </p>
        </div>

        {/* Example Result Card (hidden by default) */}
        <div className="mt-6 space-y-4 hidden">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-3xl">🎵</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Song Title</h3>
              <p className="text-sm text-gray-400">Artist Name</p>
            </div>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition whitespace-nowrap">
              Request (£0.50)
            </button>
          </div>
        </div>

        {/* Implementation Note */}
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            <strong>⚠️ Full Implementation Available:</strong> Complete kiosk code exists in{' '}
            <code className="bg-black/30 px-2 py-1 rounded">apps/kiosk/src/components/KioskView.tsx</code>
          </p>
          <p className="text-yellow-200/80 text-xs mt-2">
            Includes: YouTube search integration, song request interface, Stripe payment placeholder, thumbnail display
          </p>
        </div>
      </div>
    </div>
  );
}
