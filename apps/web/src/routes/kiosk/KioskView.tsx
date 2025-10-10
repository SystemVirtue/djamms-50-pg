import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Music, Coins } from 'lucide-react';

// Simplified types for web app
interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
}

interface Track {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  isRequest?: boolean;
}

export function KioskView() {
  const { venueId } = useParams<{ venueId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mode] = useState<'FREEPLAY' | 'PAID'>('FREEPLAY');
  const [credits] = useState(5);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Simulate search (in production: call YouTube API)
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          videoId: 'dQw4w9WgXcQ',
          title: 'Rick Astley - Never Gonna Give You Up',
          channelTitle: 'Rick Astley',
          thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
          duration: '3:33'
        },
        {
          videoId: '9bZkp7q19f0',
          title: 'PSY - GANGNAM STYLE',
          channelTitle: 'officialpsy',
          thumbnailUrl: 'https://i.ytimg.com/vi/9bZkp7q19f0/default.jpg',
          duration: '4:13'
        },
        {
          videoId: 'kJQP7kiw5Fk',
          title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
          channelTitle: 'Luis Fonsi',
          thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/default.jpg',
          duration: '4:42'
        }
      ].filter(song => 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleRequest = (result: SearchResult) => {
    const isPaid = mode === 'PAID';
    
    if (isPaid && credits < 1) {
      alert('Insufficient credits');
      return;
    }

    // Add to queue (simplified - uses localStorage)
    const venueKey = `djammsQueue_${venueId}`;
    const existingQueue = localStorage.getItem(venueKey);
    const queue = existingQueue ? JSON.parse(existingQueue) : { mainQueue: [], priorityQueue: [] };

    const track: Track = {
      videoId: result.videoId,
      title: result.title,
      artist: result.channelTitle,
      duration: 180, // Default 3 minutes
      isRequest: isPaid
    };

    if (isPaid) {
      queue.priorityQueue.push(track);
    } else {
      queue.mainQueue.push(track);
    }

    localStorage.setItem(venueKey, JSON.stringify(queue));

    setSelectedSong(result.title);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedSong(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Venue Info */}
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="text-lg font-bold text-white">DJAMMS Kiosk</h1>
              <p className="text-xs text-slate-400">Venue: {venueId}</p>
            </div>
          </div>

          {/* Credits Display */}
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">CREDITS</span>
            <span className="text-xl font-bold text-white">{credits}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for artist or song..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-lg"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="w-full mt-4 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium text-white transition"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-600/50 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-1">✅ Song Requested!</h3>
            <p className="text-green-300 text-sm">
              {selectedSong} has been added to the queue
            </p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.map((result) => (
              <div
                key={result.videoId}
                className="bg-slate-800 rounded-lg p-4 flex items-center gap-4 hover:bg-slate-750 transition"
              >
                {/* Thumbnail */}
                <div className="w-24 h-24 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">🎵</div>';
                    }}
                  />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1 truncate">{result.title}</h3>
                  <p className="text-sm text-slate-400 truncate">{result.channelTitle}</p>
                  {result.duration && (
                    <p className="text-xs text-slate-500 mt-1">{result.duration}</p>
                  )}
                </div>

                {/* Request Button */}
                <button
                  onClick={() => handleRequest(result)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-white transition whitespace-nowrap flex-shrink-0"
                >
                  {mode === 'PAID' ? 'Request (£0.50)' : 'Add to Queue'}
                </button>
              </div>
            ))}
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-slate-400">
              Try searching with different keywords
            </p>
          </div>
        ) : !searchQuery ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-white mb-2">Search for Songs</h3>
            <p className="text-slate-400 mb-4">
              Enter a song name, artist, or keywords to find music
            </p>
            <div className="inline-block px-4 py-2 bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-300">
                Mode: <strong className={mode === 'PAID' ? 'text-yellow-400' : 'text-green-400'}>
                  {mode === 'PAID' ? 'Paid Requests' : 'Free Play'}
                </strong>
              </p>
            </div>
          </div>
        ) : null}

        {/* Implementation Note */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>✅ Simplified Implementation</strong>
          </p>
          <p className="text-blue-200/80 text-xs mt-2">
            This is a simplified version with mock search results. Full implementation with YouTube API,
            Stripe payments, virtual keyboard, and real-time sync is available in{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded">apps/kiosk/</code>
          </p>
          <p className="text-blue-200/70 text-xs mt-2">
            To enable YouTube search: Add <code className="bg-black/30 px-1 py-0.5 rounded">VITE_YOUTUBE_API_KEY</code> to .env
          </p>
        </div>
      </div>
    </div>
  );
}
