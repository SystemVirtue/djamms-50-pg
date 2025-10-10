import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { 
  Input, 
  Button, 
  VirtualKeyboard, 
  VideoCard,
  SearchResult,
  debounce,
  YouTubeSearchService
} from '@djamms/shared';

interface SearchInterfaceProps {
  venueId: string;
  onVideoSelect: (video: SearchResult) => void;
  credits: number;
  mode: 'FREEPLAY' | 'PAID';
  youtubeApiKey: string;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  venueId: _venueId, // Reserved for future venue-specific features
  onVideoSelect,
  credits,
  mode,
  youtubeApiKey
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [prevPageToken, setPrevPageToken] = useState<string | undefined>();
  const [totalResults, setTotalResults] = useState(0);

  const youtubeService = React.useMemo(
    () => new YouTubeSearchService(youtubeApiKey),
    [youtubeApiKey]
  );

  // Debounced search function
  const performSearch = useCallback(
    async (query: string, pageToken?: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const results = await youtubeService.search({
          query: query.trim(),
          maxResults: 12,
          pageToken
        });

        setSearchResults(results.items);
        setNextPageToken(results.nextPageToken);
        setPrevPageToken(results.prevPageToken);
        setTotalResults(results.totalResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [youtubeService]
  );

  // Debounce search to avoid too many API calls
  const debouncedSearch = React.useMemo(
    () => debounce(performSearch, 500),
    [performSearch]
  );

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    setPage(1);
  }, [searchQuery, debouncedSearch]);

  // Virtual keyboard handlers
  const handleKeyPress = (key: string) => {
    setSearchQuery(prev => prev + key);
  };

  const handleBackspace = () => {
    setSearchQuery(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleSpace = () => {
    setSearchQuery(prev => prev + ' ');
  };

  // Pagination
  const handleNextPage = () => {
    if (nextPageToken) {
      performSearch(searchQuery, nextPageToken);
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (prevPageToken) {
      performSearch(searchQuery, prevPageToken);
      setPage(prev => Math.max(1, prev - 1));
    }
  };

  const totalPages = Math.ceil(totalResults / 12);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for artist or song..."
              className="pl-12 h-14 text-lg"
              autoFocus
            />
          </div>

          {/* Virtual Keyboard */}
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onSpace={handleSpace}
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 container mx-auto p-4">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onSelect={() => onVideoSelect(video)}
                  mode={mode}
                  credits={credits}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-6 mt-6">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  variant="outline"
                  size="lg"
                >
                  Previous
                </Button>

                <span className="text-white font-medium text-lg">
                  Page {page} of {totalPages}
                </span>

                <Button
                  onClick={handleNextPage}
                  disabled={!nextPageToken}
                  size="lg"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : searchQuery.trim() ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No results found for "{searchQuery}"</p>
            <p className="text-slate-500 mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Search for music to get started</p>
            <p className="text-slate-500 mt-2">Use the keyboard below to type</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton loader for search results
const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-10 bg-slate-700 rounded mt-2" />
      </div>
    </div>
  );
};

export default SearchInterface;
