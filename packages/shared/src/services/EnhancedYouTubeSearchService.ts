/**
 * Enhanced YouTube Search Service with Quota Management
 * 
 * Features:
 * - API key rotation when quota exhausted
 * - Quota tracking and management
 * - Multiple search methods (YouTube API, fallback proxy)
 * - Official video filtering and scoring
 * - Duration parsing and formatting
 * - Embeddability checking
 * - Rate limiting to prevent API abuse
 * 
 * Based on prod-jukebox musicSearch.ts and youtubeQuota.ts
 * 
 * @module EnhancedYouTubeSearchService
 */

import type { Track } from '../types/player';

export interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string; // channelTitle
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // seconds
  durationFormatted: string; // "3:45"
  officialScore: number;
  isEmbeddable: boolean;
}

export interface QuotaUsage {
  used: number;
  limit: number;
  percentage: number;
  lastUpdated: string;
}

export interface ApiKeyConfig {
  key: string;
  label: string;
  quotaUsed: number;
  isExhausted: boolean;
}

export type SearchMethod = 'youtube_api' | 'iframe_search';

/**
 * Enhanced YouTube Search Service with quota management and API key rotation
 */
export class EnhancedYouTubeSearchService {
  private apiKeys: ApiKeyConfig[] = [];
  private currentKeyIndex = 0;
  private readonly QUOTA_LIMIT = 10000;
  private readonly QUOTA_COSTS = {
    search: 100,
    videos: 1,
  };
  private lastSearchTimes: { [key: string]: number } = {};
  private readonly MIN_SEARCH_INTERVAL = 1000; // 1 second between searches

  /**
   * Initialize with API keys
   * @param apiKeys - Array of YouTube Data API v3 keys
   */
  constructor(apiKeys: string[] | string) {
    const keyArray = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.apiKeys = keyArray.map((key, index) => ({
      key,
      label: `Key ${index + 1}`,
      quotaUsed: 0,
      isExhausted: false,
    }));
  }

  /**
   * Get current active API key
   */
  private getCurrentKey(): string {
    // Find first non-exhausted key
    for (let i = 0; i < this.apiKeys.length; i++) {
      const index = (this.currentKeyIndex + i) % this.apiKeys.length;
      if (!this.apiKeys[index].isExhausted) {
        this.currentKeyIndex = index;
        return this.apiKeys[index].key;
      }
    }
    // All keys exhausted, return current key anyway (will fail gracefully)
    return this.apiKeys[this.currentKeyIndex].key;
  }

  /**
   * Rotate to next available API key
   */
  private rotateApiKey(): void {
    this.apiKeys[this.currentKeyIndex].isExhausted = true;
    console.log(`[YouTube] Key ${this.currentKeyIndex + 1} exhausted, rotating...`);

    // Find next available key
    for (let i = 1; i < this.apiKeys.length; i++) {
      const nextIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      if (!this.apiKeys[nextIndex].isExhausted) {
        this.currentKeyIndex = nextIndex;
        console.log(`[YouTube] Rotated to Key ${nextIndex + 1}`);
        return;
      }
    }
    console.warn('[YouTube] All API keys exhausted!');
  }

  /**
   * Track API usage for quota management
   */
  private trackUsage(operation: 'search' | 'videos'): void {
    const cost = this.QUOTA_COSTS[operation];
    this.apiKeys[this.currentKeyIndex].quotaUsed += cost;

    // Check if quota exceeded
    if (this.apiKeys[this.currentKeyIndex].quotaUsed >= this.QUOTA_LIMIT) {
      this.rotateApiKey();
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(query: string): void {
    const now = Date.now();
    const lastSearch = this.lastSearchTimes[query] || 0;

    if (now - lastSearch < this.MIN_SEARCH_INTERVAL) {
      throw new Error('Search rate limited. Please wait before searching again.');
    }

    this.lastSearchTimes[query] = now;
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format duration seconds to MM:SS or H:MM:SS
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate official video score
   */
  private calculateOfficialScore(title: string, channelTitle: string): number {
    let score = 0;
    const titleLower = title.toLowerCase();
    const channelLower = channelTitle.toLowerCase();

    // VEVO is always official
    if (channelLower.includes('vevo')) score += 10;

    // Official keywords in title
    const officialKeywords = [
      'official video',
      'official music video',
      'official audio',
      'official lyric video',
    ];
    for (const keyword of officialKeywords) {
      if (titleLower.includes(keyword)) {
        score += 3;
        break;
      }
    }

    // Official channel
    if (channelLower.includes('official')) score += 3;

    // Topic channels (auto-generated by YouTube)
    if (channelTitle.includes(' - Topic')) score += 5;

    // Penalties for covers/remixes
    if (titleLower.includes('cover') || titleLower.includes('remix')) score -= 5;

    // Bonus for karaoke (useful for bars)
    if (titleLower.includes('karaoke')) score += 3;

    return score;
  }

  /**
   * Search YouTube with API
   */
  async searchWithYouTubeAPI(
    query: string,
    maxResults: number = 20
  ): Promise<YouTubeSearchResult[]> {
    try {
      // Rate limiting
      this.checkRateLimit(query);

      const apiKey = this.getCurrentKey();

      // Search for videos
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${apiKey}`;

      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        if (searchResponse.status === 403) {
          // Quota exceeded, rotate key and retry
          this.rotateApiKey();
          throw new Error('YouTube API quota exceeded. Rotated to next key.');
        }
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      this.trackUsage('search');

      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get video details (duration, embeddability)
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${videoIds}&key=${apiKey}`;

      const detailsResponse = await fetch(detailsUrl);

      if (!detailsResponse.ok) {
        if (detailsResponse.status === 403) {
          this.rotateApiKey();
        }
        throw new Error(`YouTube API error: ${detailsResponse.status}`);
      }

      const detailsData = await detailsResponse.json();
      this.trackUsage('videos');

      // Create details map
      const detailsMap: { [id: string]: any } = {};
      for (const item of detailsData.items) {
        detailsMap[item.id] = item;
      }

      // Combine and filter results
      const results: YouTubeSearchResult[] = searchData.items
        .map((video: any) => {
          const details = detailsMap[video.id.videoId];
          if (!details) return null;

          // Filter out non-embeddable videos
          if (details.status && details.status.embeddable === false) {
            return null;
          }

          const durationSeconds = this.parseDuration(details.contentDetails.duration);
          const officialScore = this.calculateOfficialScore(
            video.snippet.title,
            video.snippet.channelTitle
          );

          return {
            id: video.id.videoId,
            title: video.snippet.title.replace(/\([^)]*\)/g, '').trim(),
            artist: video.snippet.channelTitle,
            channelTitle: video.snippet.channelTitle,
            thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
            videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            duration: durationSeconds,
            durationFormatted: this.formatDuration(durationSeconds),
            officialScore,
            isEmbeddable: true,
          };
        })
        .filter((video: YouTubeSearchResult | null): video is YouTubeSearchResult => video !== null);

      // Sort by official score (highest first)
      return results.sort((a, b) => b.officialScore - a.officialScore);
    } catch (error) {
      console.error('[YouTube] Search error:', error);
      throw error;
    }
  }

  /**
   * Search using fallback iframe method (no API key needed)
   * Note: This requires a backend proxy server
   */
  async searchWithIframeMethod(
    _query: string,
    _maxResults: number = 20
  ): Promise<YouTubeSearchResult[]> {
    try {
      // This would call a backend proxy that scrapes YouTube
      // For now, throw error to indicate not implemented
      throw new Error(
        'Iframe search method requires backend proxy server. Use YouTube API instead.'
      );
    } catch (error) {
      console.error('[YouTube] Iframe search error:', error);
      throw error;
    }
  }

  /**
   * Main search method with automatic fallback
   */
  async search(
    query: string,
    options: {
      maxResults?: number;
      method?: SearchMethod;
    } = {}
  ): Promise<YouTubeSearchResult[]> {
    const { maxResults = 20, method = 'youtube_api' } = options;

    try {
      if (method === 'youtube_api') {
        return await this.searchWithYouTubeAPI(query, maxResults);
      } else {
        return await this.searchWithIframeMethod(query, maxResults);
      }
    } catch (error) {
      console.error('[YouTube] Search failed:', error);
      throw error;
    }
  }

  /**
   * Convert search result to Track format
   */
  resultToTrack(result: YouTubeSearchResult): Track {
    return {
      videoId: result.id,
      title: result.title,
      artist: result.artist,
      duration: result.duration,
      isRequest: false, // Default to false, caller can override
    };
  }

  /**
   * Get quota status for all API keys
   */
  getQuotaStatus(): ApiKeyConfig[] {
    return this.apiKeys.map(key => ({ ...key }));
  }

  /**
   * Reset quota for a specific key (call at midnight UTC)
   */
  resetQuota(keyIndex?: number): void {
    if (keyIndex !== undefined) {
      this.apiKeys[keyIndex].quotaUsed = 0;
      this.apiKeys[keyIndex].isExhausted = false;
    } else {
      // Reset all keys
      this.apiKeys.forEach(key => {
        key.quotaUsed = 0;
        key.isExhausted = false;
      });
    }
    console.log('[YouTube] Quota reset');
  }
}
