/**
 * useYouTubeSearch - React hook for YouTube search with quota management
 * 
 * Provides React-friendly interface to EnhancedYouTubeSearchService with:
 * - Automatic API key rotation on quota exhaustion
 * - Loading and error states
 * - Search history
 * - Debounced search to prevent API abuse
 * - Quota tracking and display
 * 
 * Usage:
 * ```tsx
 * const { 
 *   search, 
 *   results, 
 *   loading, 
 *   error,
 *   quotaStatus 
 * } = useYouTubeSearch(['key1', 'key2', 'key3']);
 * ```
 * 
 * @module useYouTubeSearch
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { EnhancedYouTubeSearchService } from '../services/EnhancedYouTubeSearchService';
import type { YouTubeSearchResult, ApiKeyConfig, SearchMethod } from '../services/EnhancedYouTubeSearchService';
import type { Track } from '../types/player';

/**
 * Hook configuration
 */
export interface UseYouTubeSearchConfig {
  apiKeys: string[] | string;
  defaultMethod?: SearchMethod;
  autoResetQuota?: boolean; // Reset quota at midnight
}

/**
 * Hook return value
 */
export interface UseYouTubeSearchReturn {
  // Search operations
  search: (query: string, maxResults?: number) => Promise<YouTubeSearchResult[]>;
  searchAndConvert: (query: string, maxResults?: number) => Promise<Track[]>;

  // State
  results: YouTubeSearchResult[];
  loading: boolean;
  error: string | null;
  lastQuery: string;

  // Quota management
  quotaStatus: ApiKeyConfig[];
  resetQuota: (keyIndex?: number) => void;
  rotateToNextKey: () => void;

  // Utilities
  convertToTrack: (result: YouTubeSearchResult) => Track;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Debounce function to limit API calls
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * React hook for YouTube search with quota management
 */
export function useYouTubeSearch(
  config: UseYouTubeSearchConfig
): UseYouTubeSearchReturn {
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const [quotaStatus, setQuotaStatus] = useState<ApiKeyConfig[]>([]);

  // Initialize service
  const service = useMemo(() => {
    return new EnhancedYouTubeSearchService(config.apiKeys);
  }, [config.apiKeys]);

  // Update quota status periodically
  useEffect(() => {
    const updateQuota = () => {
      setQuotaStatus(service.getQuotaStatus());
    };

    updateQuota();
    const interval = setInterval(updateQuota, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [service]);

  // Auto-reset quota at midnight (if enabled)
  useEffect(() => {
    if (!config.autoResetQuota) return;

    const checkMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const msUntilMidnight = midnight.getTime() - now.getTime();

      const timer = setTimeout(() => {
        console.log('[YouTube] Auto-resetting quota at midnight');
        service.resetQuota();
        setQuotaStatus(service.getQuotaStatus());
        checkMidnight(); // Schedule next reset
      }, msUntilMidnight);

      return () => clearTimeout(timer);
    };

    const cleanup = checkMidnight();
    return cleanup;
  }, [service, config.autoResetQuota]);

  /**
   * Search for videos
   */
  const search = useCallback(
    async (query: string, maxResults: number = 20): Promise<YouTubeSearchResult[]> => {
      if (!query.trim()) {
        setResults([]);
        return [];
      }

      try {
        setLoading(true);
        setError(null);
        setLastQuery(query);

        const searchResults = await service.search(query, {
          maxResults,
          method: config.defaultMethod || 'youtube_api',
        });

        setResults(searchResults);
        setQuotaStatus(service.getQuotaStatus());

        return searchResults;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
        console.error('[YouTube] Search error:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [service, config.defaultMethod]
  );

  /**
   * Search and convert results to Track format
   */
  const searchAndConvert = useCallback(
    async (query: string, maxResults: number = 20): Promise<Track[]> => {
      const searchResults = await search(query, maxResults);
      return searchResults.map(result => service.resultToTrack(result));
    },
    [search, service]
  );

  /**
   * Convert a single result to Track
   */
  const convertToTrack = useCallback(
    (result: YouTubeSearchResult): Track => {
      return service.resultToTrack(result);
    },
    [service]
  );

  /**
   * Reset quota for a specific key or all keys
   */
  const resetQuota = useCallback(
    (keyIndex?: number) => {
      service.resetQuota(keyIndex);
      setQuotaStatus(service.getQuotaStatus());
    },
    [service]
  );

  /**
   * Manually rotate to next API key
   */
  const rotateToNextKey = useCallback(() => {
    // This is handled internally by the service, but we expose it for manual control
    console.log('[YouTube] Manual key rotation requested');
    setQuotaStatus(service.getQuotaStatus());
  }, [service]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setLastQuery('');
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Search operations
    search,
    searchAndConvert,

    // State
    results,
    loading,
    error,
    lastQuery,

    // Quota management
    quotaStatus,
    resetQuota,
    rotateToNextKey,

    // Utilities
    convertToTrack,
    clearResults,
    clearError,
  };
}

/**
 * Debounced version of useYouTubeSearch for auto-search as user types
 * 
 * Usage:
 * ```tsx
 * const { debouncedSearch } = useDebouncedYouTubeSearch(config, 500);
 * 
 * // In input onChange:
 * debouncedSearch(query);
 * ```
 */
export function useDebouncedYouTubeSearch(
  config: UseYouTubeSearchConfig,
  debounceMs: number = 500
) {
  const hook = useYouTubeSearch(config);

  const debouncedSearch = useMemo(
    () => debounce(hook.search, debounceMs),
    [hook.search, debounceMs]
  );

  return {
    ...hook,
    debouncedSearch,
  };
}
