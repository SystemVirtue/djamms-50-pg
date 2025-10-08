import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '@shared/config/env';
import { toast } from 'sonner';

export const KioskView: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !config.youtube.apiKey) {
      toast.error('Search unavailable');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=video&key=${config.youtube.apiKey}&maxResults=10`
      );

      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!config.features.stripePayments) {
      toast.info('Payments not enabled');
      return;
    }

    // TODO: Integrate Stripe payment
    toast.info('Payment integration coming soon');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Request a Song</h1>
          <p className="text-gray-400">Venue: {venueId}</p>
        </header>

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
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {searchResults.map((video) => (
            <div
              key={video.id.videoId}
              className="bg-gray-800 rounded-lg p-4 flex items-center gap-4"
            >
              <img
                src={video.snippet.thumbnails.default.url}
                alt={video.snippet.title}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{video.snippet.title}</h3>
                <p className="text-sm text-gray-400">{video.snippet.channelTitle}</p>
              </div>
              <button
                onClick={handleRequest}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition whitespace-nowrap"
              >
                Request (£0.50)
              </button>
            </div>
          ))}
        </div>

        {!config.youtube.apiKey && (
          <div className="text-center text-gray-400 mt-8">
            <p>YouTube search is not configured.</p>
            <p className="text-sm">Add VITE_YOUTUBE_API_KEY to enable search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
