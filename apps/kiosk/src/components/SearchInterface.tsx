/**
 * Enhanced Kiosk Search Interface
 * 
 * Features:
 * - YouTube search with quota management
 * - Official video highlighting
 * - Touch-optimized virtual keyboard
 * - Pagination controls
 * - Direct queue integration (paid requests)
 * - Credit display and validation
 * - Loading skeletons
 * 
 * Integrates:
 * - useYouTubeSearch (with multi-key rotation)
 * - useQueueManagement (for adding paid requests)
 * 
 * Based on prod-jukebox SearchInterface.tsx with modern React patterns
 */

import * as React from 'react';
import { useState } from 'react';
import { Search, DollarSign, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  useYouTubeSearch,
  useQueueManagement,
  type YouTubeSearchResult
} from '@djamms/shared';

interface SearchInterfaceProps {
  venueId: string;
  youtubeApiKeys: string[]; // Support multiple keys for rotation
  pricePerSong?: number; // Price in credits (default 5)
  mode?: 'FREEPLAY' | 'PAID';
  credits?: number;
  onCreditInsufficient?: () => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  venueId,
  youtubeApiKeys,
  pricePerSong = 5,
  mode = 'PAID',
  credits = 0,
  onCreditInsufficient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8; // 4x2 grid

  // YouTube search with quota management
  const {
    search,
    results,
    loading,
    error: searchError,
    quotaStatus,
    convertToTrack,
    clearResults,
  } = useYouTubeSearch({
    apiKeys: youtubeApiKeys,
    autoResetQuota: true,
  });

  // Queue management for adding paid requests
  const {
    addTrack,
    isLoading: queueLoading,
    error: queueError,
  } = useQueueManagement({
    venueId,
    enableRealtime: true,
  });

  /**
   * Handle search execution
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      clearResults();
      return;
    }

    setPage(1);
    await search(searchQuery, 20); // Search for 20 results
  };

  /**
   * Handle video selection and add to queue
   */
  const handleVideoSelect = async (video: YouTubeSearchResult) => {
    // Check credits for paid mode
    if (mode === 'PAID' && credits < pricePerSong) {
      onCreditInsufficient?.();
      return;
    }

    try {
      setSelectedVideoId(video.id);

      // Convert YouTube result to Track format
      const track = convertToTrack(video);

      // Add to priority queue as paid request
      await addTrack({
        ...track,
        isRequest: true,
        paidCredit: pricePerSong,
      }, 'priority');

      // Show success feedback
      setTimeout(() => setSelectedVideoId(null), 2000);
    } catch (error) {
      console.error('Failed to add track:', error);
      setSelectedVideoId(null);
    }
  };

  /**
   * Virtual keyboard handlers
   */
  const handleKeyPress = (key: string) => {
    setSearchQuery(prev => prev + key);
  };

  const handleBackspace = () => {
    setSearchQuery(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSearchQuery('');
    clearResults();
  };

  const handleSpace = () => {
    setSearchQuery(prev => prev + ' ');
  };

  const handleEnter = () => {
    handleSearch();
  };

  /**
   * Pagination
   */
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  const error = searchError || queueError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header with Credits */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl">
        <div className="container mx-auto p-4 sm:p-6">
          {/* Title and Credits */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-400">
              Search Music
            </h1>
            {mode === 'PAID' && (
              <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span className="text-xl font-bold text-amber-300">
                  {credits} Credits
                </span>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              placeholder="Search for artist or song..."
              className="w-full pl-14 pr-4 h-16 text-xl bg-slate-800/60 border-2 border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Virtual Keyboard - Placeholder */}
          <div className="grid grid-cols-10 gap-2 mb-4">
            {['1','2','3','4','5','6','7','8','9','0'].map(key => (
              <button key={key} onClick={() => handleKeyPress(key)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">
                {key}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-10 gap-2 mb-4">
            {['Q','W','E','R','T','Y','U','I','O','P'].map(key => (
              <button key={key} onClick={() => handleKeyPress(key)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">
                {key}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2 mb-2">
            {['A','S','D','F','G','H','J','K','L'].map(key => (
              <button key={key} onClick={() => handleKeyPress(key)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                {key}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            {['Z','X','C','V','B','N','M'].map(key => (
              <button key={key} onClick={() => handleKeyPress(key)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                {key}
              </button>
            ))}
            <button onClick={handleSpace} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Space
            </button>
            <button onClick={handleBackspace} className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              ⌫
            </button>
            <button onClick={handleClear} className="bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Clear
            </button>
            <button onClick={handleEnter} className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Enter
            </button>
          </div>

          {/* Quota Status */}
          {quotaStatus.length > 0 && (
            <div className="mt-2 flex gap-2 text-xs">
              {quotaStatus.map((key, i) => (
                <div key={i} className={`px-2 py-1 rounded ${key.isExhausted ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                  Key {i + 1}: {key.quotaUsed}/10000
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 sm:p-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-semibold">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(itemsPerPage)].map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedResults.length > 0 ? (
          <>
            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedResults.map((video) => (
                <EnhancedVideoCard
                  key={video.id}
                  video={video}
                  onSelect={() => handleVideoSelect(video)}
                  mode={mode}
                  credits={credits}
                  pricePerSong={pricePerSong}
                  isSelected={selectedVideoId === video.id}
                  isLoading={queueLoading && selectedVideoId === video.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 py-8 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-semibold text-lg transition-colors border-2 border-slate-700 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <span className="text-white font-bold text-xl">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={page >= totalPages}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-semibold text-lg transition-colors border-2 border-amber-500 disabled:border-slate-700 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : searchQuery.trim() ? (
          <div className="text-center py-20">
            <Search className="w-20 h-20 text-slate-700 mx-auto mb-6" />
            <p className="text-slate-300 text-2xl font-semibold mb-2">
              No results found
            </p>
            <p className="text-slate-500 text-lg">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-24 h-24 text-slate-700 mx-auto mb-6" />
            <p className="text-slate-300 text-2xl font-semibold mb-2">
              Search for music
            </p>
            <p className="text-slate-500 text-lg">
              Use the keyboard above to type and press Enter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced Video Card with official badge and better styling
 */
interface EnhancedVideoCardProps {
  video: YouTubeSearchResult;
  onSelect: () => void;
  mode: 'FREEPLAY' | 'PAID';
  credits: number;
  pricePerSong: number;
  isSelected: boolean;
  isLoading: boolean;
}

const EnhancedVideoCard: React.FC<EnhancedVideoCardProps> = ({
  video,
  onSelect,
  mode,
  credits,
  pricePerSong,
  isSelected,
  isLoading,
}) => {
  const canAfford = mode === 'FREEPLAY' || credits >= pricePerSong;
  const isOfficial = video.officialScore > 5;

  return (
    <div className={`bg-slate-800/80 rounded-xl overflow-hidden border-2 transition-all transform hover:scale-105 ${
      isSelected ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-slate-700 hover:border-amber-500'
    }`}>
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {/* Official Badge */}
        {isOfficial && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            Official
          </div>
        )}
        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm font-semibold">
          {video.durationFormatted}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-white font-semibold line-clamp-2 text-sm leading-tight">
          {video.title}
        </h3>
        <p className="text-slate-400 text-xs line-clamp-1">
          {video.artist}
        </p>

        {/* Action Button */}
        {isSelected ? (
          <div className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-bold">
            <CheckCircle2 className="w-5 h-5" />
            Added!
          </div>
        ) : (
          <button
            onClick={onSelect}
            disabled={!canAfford || isLoading}
            className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              canAfford
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-900 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>Processing...</>
            ) : mode === 'PAID' ? (
              <>
                <DollarSign className="w-4 h-4" />
                Add ${pricePerSong}
              </>
            ) : (
              'Add to Queue'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Loading skeleton for video cards
 */
const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-800/80 rounded-xl overflow-hidden border-2 border-slate-700 animate-pulse">
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
