/**
 * Queue Service for DJAMMS
 * Handles queue operations for kiosk requests, player consumption, and admin management
 * 
 * Features:
 * - Add tracks to main queue (free) or priority queue (paid)
 * - Remove tracks from queue
 * - Reorder queue items
 * - Get next track for playback
 * - Real-time sync via AppWrite
 */

import { Databases, Query, ID } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export interface QueueTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  requestedBy?: string;
  requestedByEmail?: string;
  requestedAt: string;
  position: number;
  status: 'queued' | 'playing' | 'played' | 'skipped';
  isPaid: boolean;
  paidAmount?: number;
  paymentId?: string;
}

export interface QueueDocument {
  $id: string;
  venueId: string;
  mainQueue: string | QueueTrack[]; // Stored as JSON string in DB, parsed to array in code
  priorityQueue: string | QueueTrack[]; // Stored as JSON string in DB, parsed to array in code
  nowPlaying: string | null; // Stored as JSON string in DB
  createdAt: string;
  updatedAt: string;
  $createdAt: string;
  $updatedAt: string;
  $collectionId: string;
  $databaseId: string;
  $permissions: string[];
}

export interface AddTrackOptions {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  requestedBy?: string;
  requestedByEmail?: string;
  isPaid?: boolean;
  paidAmount?: number;
  paymentId?: string;
}

/**
 * Queue Management Service
 */
export class QueueManagementService {
  private databases: Databases;

  constructor(databases: Databases) {
    this.databases = databases;
  }

  /**
   * Helper: Parse queue from string or array
   */
  private parseQueue(queueData: string | QueueTrack[]): QueueTrack[] {
    if (typeof queueData === 'string') {
      try {
        return JSON.parse(queueData);
      } catch {
        return [];
      }
    }
    return Array.isArray(queueData) ? queueData : [];
  }

  /**
   * Helper: Get parsed queues from document
   */
  private getParsedQueues(queue: QueueDocument): { 
    mainQueue: QueueTrack[]; 
    priorityQueue: QueueTrack[];
  } {
    return {
      mainQueue: this.parseQueue(queue.mainQueue),
      priorityQueue: this.parseQueue(queue.priorityQueue),
    };
  }

  /**
   * Load tracks from venue's default playlist into the queue
   */
  private async loadPlaylistIntoQueue(venueId: string): Promise<QueueTrack[]> {
    try {
      // Get venue's default playlist ID
      const venueResponse = await this.databases.listDocuments(
        DATABASE_ID,
        'venues',
        [Query.equal('venueId', venueId), Query.limit(1)]
      );

      if (venueResponse.documents.length === 0) {
        console.warn('[QueueService] Venue not found:', venueId);
        return [];
      }

      const venue = venueResponse.documents[0];
      const playlistId = venue.defaultPlaylistId || 'default_playlist';

      console.log(`[QueueService] Loading playlist ${playlistId} for venue ${venueId}`);

      // Get playlist
      const playlistResponse = await this.databases.listDocuments(
        DATABASE_ID,
        'playlists',
        [Query.equal('playlistId', playlistId), Query.limit(1)]
      );

      if (playlistResponse.documents.length === 0) {
        console.warn('[QueueService] Playlist not found:', playlistId);
        return [];
      }

      const playlist = playlistResponse.documents[0];
      const tracksJson = playlist.tracks;

      // Parse tracks
      let tracks: any[];
      try {
        tracks = typeof tracksJson === 'string' ? JSON.parse(tracksJson) : tracksJson;
        if (!Array.isArray(tracks)) {
          console.warn('[QueueService] Invalid tracks format in playlist');
          return [];
        }
      } catch (error) {
        console.error('[QueueService] Failed to parse playlist tracks:', error);
        return [];
      }

      // Limit to first 50 tracks to avoid overloading
      const limitedTracks = tracks.slice(0, 50);

      // Convert to QueueTrack format
      const queueTracks: QueueTrack[] = limitedTracks.map((track, index) => ({
        id: ID.unique(),
        videoId: track.videoId || track.id || '',
        title: track.title || 'Unknown Track',
        artist: track.artist || 'Unknown Artist',
        duration: track.duration || 0,
        thumbnail: track.thumbnail || '',
        requestedBy: 'System',
        requestedByEmail: 'system@djamms.app',
        requestedAt: new Date().toISOString(),
        position: index,
        status: 'queued' as const,
        isPaid: false,
      }));

      console.log(`[QueueService] Loaded ${queueTracks.length} tracks from playlist`);
      return queueTracks;
    } catch (error) {
      console.error('[QueueService] Error loading playlist into queue:', error);
      return [];
    }
  }

  /**
   * Get or create queue for venue
   * Automatically loads default playlist if queue is empty
   */
  async getQueue(venueId: string): Promise<QueueDocument> {
    try {
      const response = await this.databases.listDocuments<QueueDocument>(
        DATABASE_ID,
        'queues',
        [Query.equal('venueId', venueId), Query.limit(1)]
      );

      if (response.documents.length > 0) {
        const existingQueue = response.documents[0];
        
        // Check if queue is empty and needs initialization
        // Note: queues are stored as JSON strings in the database
        let mainQueue: QueueTrack[] = [];
        let priorityQueue: QueueTrack[] = [];
        
        try {
          mainQueue = typeof existingQueue.mainQueue === 'string' 
            ? JSON.parse(existingQueue.mainQueue) 
            : (Array.isArray(existingQueue.mainQueue) ? existingQueue.mainQueue : []);
          
          priorityQueue = typeof existingQueue.priorityQueue === 'string'
            ? JSON.parse(existingQueue.priorityQueue)
            : (Array.isArray(existingQueue.priorityQueue) ? existingQueue.priorityQueue : []);
        } catch (parseError) {
          console.error('[QueueService] Error parsing queues:', parseError);
          mainQueue = [];
          priorityQueue = [];
        }
        
        if (mainQueue.length === 0 && priorityQueue.length === 0 && !existingQueue.nowPlaying) {
          console.log('[QueueService] Queue is empty, loading default playlist');
          
          // Load playlist tracks
          const playlistTracks = await this.loadPlaylistIntoQueue(venueId);
          
          if (playlistTracks.length > 0) {
            // Update queue with playlist tracks (store as JSON string)
            const updated = await this.databases.updateDocument<QueueDocument>(
              DATABASE_ID,
              'queues',
              existingQueue.$id,
              {
                mainQueue: JSON.stringify(playlistTracks),
                updatedAt: new Date().toISOString(),
              }
            );
            
            console.log(`[QueueService] Initialized queue with ${playlistTracks.length} tracks`);
            return updated;
          }
        }
        
        return existingQueue;
      }

      // Create new queue if doesn't exist
      console.log('[QueueService] Creating new queue for venue:', venueId);
      
      // Try to load playlist tracks for new queue
      const playlistTracks = await this.loadPlaylistIntoQueue(venueId);
      
      return await this.databases.createDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        ID.unique(),
        {
          venueId,
          mainQueue: playlistTracks,
          priorityQueue: [],
          currentTrack: null,
        }
      );
    } catch (error) {
      console.error('[QueueService] Error getting queue:', error);
      throw error;
    }
  }

  /**
   * Add track to queue
   */
  async addTrack(
    venueId: string,
    options: AddTrackOptions
  ): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);

      const track: QueueTrack = {
        id: ID.unique(),
        videoId: options.videoId,
        title: options.title,
        artist: options.artist,
        duration: options.duration,
        thumbnail: options.thumbnail,
        requestedBy: options.requestedBy,
        requestedByEmail: options.requestedByEmail,
        requestedAt: new Date().toISOString(),
        position: 0, // Will be set below
        status: 'queued',
        isPaid: options.isPaid || false,
        paidAmount: options.paidAmount,
        paymentId: options.paymentId,
      };

      // Determine which queue to add to
      const targetQueue = track.isPaid ? 'priorityQueue' : 'mainQueue';
      
      // Parse current queue from JSON string if needed
      let currentQueue: QueueTrack[];
      const queueData = queue[targetQueue];
      if (typeof queueData === 'string') {
        currentQueue = JSON.parse(queueData);
      } else if (Array.isArray(queueData)) {
        currentQueue = queueData;
      } else {
        currentQueue = [];
      }

      // Set position (last in queue)
      track.position = currentQueue.length;

      // Add to queue
      const updatedQueue = [...currentQueue, track];

      // Update in database (must stringify for database storage)
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          [targetQueue]: JSON.stringify(updatedQueue),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log(`[QueueService] Added track to ${targetQueue}:`, track.title);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error adding track:', error);
      throw error;
    }
  }

  /**
   * Remove track from queue
   */
  async removeTrack(
    venueId: string,
    trackId: string
  ): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);

      // Parse queues from JSON strings
      const priorityQueueData = typeof queue.priorityQueue === 'string' 
        ? JSON.parse(queue.priorityQueue) 
        : (Array.isArray(queue.priorityQueue) ? queue.priorityQueue : []);
      
      const mainQueueData = typeof queue.mainQueue === 'string'
        ? JSON.parse(queue.mainQueue)
        : (Array.isArray(queue.mainQueue) ? queue.mainQueue : []);

      // Remove from priority queue
      let priorityQueue = priorityQueueData.filter((t: QueueTrack) => t.id !== trackId);
      
      // Remove from main queue
      let mainQueue = mainQueueData.filter((t: QueueTrack) => t.id !== trackId);

      // Reindex positions
      priorityQueue = this.reindexPositions(priorityQueue);
      mainQueue = this.reindexPositions(mainQueue);

      // Update in database (must stringify)
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          priorityQueue: JSON.stringify(priorityQueue),
          mainQueue: JSON.stringify(mainQueue),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('[QueueService] Removed track:', trackId);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error removing track:', error);
      throw error;
    }
  }

  /**
   * Reorder queue
   */
  async reorderQueue(
    venueId: string,
    queueType: 'mainQueue' | 'priorityQueue',
    trackIds: string[]
  ): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);
      const currentQueue = this.parseQueue(queue[queueType]);

      // Reorder based on trackIds array
      const reordered = trackIds
        .map(id => currentQueue.find((t: QueueTrack) => t.id === id))
        .filter((t): t is QueueTrack => t !== undefined);

      // Reindex positions
      const reindexed = this.reindexPositions(reordered);

      // Update in database (must stringify)
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          [queueType]: JSON.stringify(reindexed),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log(`[QueueService] Reordered ${queueType}`);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error reordering queue:', error);
      throw error;
    }
  }

  /**
   * Get next track for playback
   * Priority: Current priority queue item > Current main queue item
   */
  async getNextTrack(venueId: string): Promise<QueueTrack | null> {
    try {
      const queue = await this.getQueue(venueId);
      const { priorityQueue, mainQueue } = this.getParsedQueues(queue);

      // Check priority queue first
      if (priorityQueue.length > 0) {
        return priorityQueue[0];
      }

      // Then check main queue
      if (mainQueue.length > 0) {
        return mainQueue[0];
      }

      return null;
    } catch (error) {
      console.error('[QueueService] Error getting next track:', error);
      return null;
    }
  }

  /**
   * Mark track as playing
   */
  async startTrack(
    venueId: string,
    trackId: string
  ): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);
      const { priorityQueue, mainQueue } = this.getParsedQueues(queue);

      // Find track in either queue
      let track = priorityQueue.find((t: QueueTrack) => t.id === trackId);

      if (!track) {
        track = mainQueue.find((t: QueueTrack) => t.id === trackId);
      }

      if (!track) {
        throw new Error('Track not found in queue');
      }

      // Update track status
      track.status = 'playing';

      // Set as current track (store as JSON string)
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          nowPlaying: JSON.stringify(track),
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('[QueueService] Started track:', track.title);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error starting track:', error);
      throw error;
    }
  }

  /**
   * Mark track as completed and move to next
   */
  async completeTrack(venueId: string): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);

      // Parse nowPlaying
      let currentTrack: QueueTrack | null = null;
      if (queue.nowPlaying) {
        try {
          currentTrack = typeof queue.nowPlaying === 'string' 
            ? JSON.parse(queue.nowPlaying) 
            : queue.nowPlaying;
        } catch {
          currentTrack = null;
        }
      }

      if (!currentTrack) {
        console.warn('[QueueService] No current track to complete');
        return queue;
      }

      const completedTrackId = currentTrack.id;
      const { priorityQueue, mainQueue } = this.getParsedQueues(queue);

      // Remove completed track from queues
      const filteredPriority = priorityQueue.filter((t: QueueTrack) => t.id !== completedTrackId);
      const filteredMain = mainQueue.filter((t: QueueTrack) => t.id !== completedTrackId);

      // Reindex positions
      const reindexedPriority = this.reindexPositions(filteredPriority);
      const reindexedMain = this.reindexPositions(filteredMain);

      // Log to requests collection for analytics
      await this.logRequest(currentTrack, 'played');

      // Update in database (must stringify)
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          priorityQueue: JSON.stringify(reindexedPriority),
          mainQueue: JSON.stringify(reindexedMain),
          nowPlaying: null,
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('[QueueService] Completed track:', currentTrack.title);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error completing track:', error);
      throw error;
    }
  }

  /**
   * Skip current track
   */
  async skipTrack(venueId: string): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);

      // Parse nowPlaying
      let currentTrack: QueueTrack | null = null;
      if (queue.nowPlaying) {
        try {
          currentTrack = typeof queue.nowPlaying === 'string' 
            ? JSON.parse(queue.nowPlaying) 
            : queue.nowPlaying;
        } catch {
          currentTrack = null;
        }
      }

      if (!currentTrack) {
        console.warn('[QueueService] No current track to skip');
        return queue;
      }

      const skippedTrackId = currentTrack.id;
      const { priorityQueue, mainQueue } = this.getParsedQueues(queue);

      // Remove skipped track from queues
      const filteredPriority = priorityQueue.filter((t: QueueTrack) => t.id !== skippedTrackId);
      const filteredMain = mainQueue.filter((t: QueueTrack) => t.id !== skippedTrackId);

      // Reindex positions
      const reindexedPriority = this.reindexPositions(filteredPriority);
      const reindexedMain = this.reindexPositions(filteredMain);

      // Log to requests collection for analytics
      await this.logRequest(currentTrack, 'skipped');

      // Update in database (must stringify)
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          priorityQueue: JSON.stringify(reindexedPriority),
          mainQueue: JSON.stringify(reindexedMain),
          nowPlaying: null,
          updatedAt: new Date().toISOString(),
        }
      );

      console.log('[QueueService] Skipped track:', currentTrack.title);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error skipping track:', error);
      throw error;
    }
  }

  /**
   * Clear entire queue (main or priority)
   */
  async clearQueue(
    venueId: string,
    queueType: 'mainQueue' | 'priorityQueue' | 'both' = 'both'
  ): Promise<QueueDocument> {
    try {
      const queue = await this.getQueue(venueId);

      const updateData: Partial<QueueDocument> = {};

      if (queueType === 'mainQueue' || queueType === 'both') {
        updateData.mainQueue = [];
      }

      if (queueType === 'priorityQueue' || queueType === 'both') {
        updateData.priorityQueue = [];
      }

      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        updateData
      );

      console.log(`[QueueService] Cleared ${queueType}`);
      return updated;
    } catch (error) {
      console.error('[QueueService] Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Check for duplicate tracks
   */
  async checkDuplicate(
    venueId: string,
    videoId: string
  ): Promise<boolean> {
    try {
      const queue = await this.getQueue(venueId);
      const { priorityQueue, mainQueue } = this.getParsedQueues(queue);

      // Check both queues
      const inPriority = priorityQueue.some((t: QueueTrack) => t.videoId === videoId);
      const inMain = mainQueue.some((t: QueueTrack) => t.videoId === videoId);
      
      // Check now playing
      let isCurrent = false;
      if (queue.nowPlaying) {
        try {
          const nowPlaying = typeof queue.nowPlaying === 'string' 
            ? JSON.parse(queue.nowPlaying) 
            : queue.nowPlaying;
          isCurrent = nowPlaying?.videoId === videoId;
        } catch {
          isCurrent = false;
        }
      }

      return inPriority || inMain || isCurrent;
    } catch (error) {
      console.error('[QueueService] Error checking duplicate:', error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(venueId: string): Promise<{
    priorityCount: number;
    mainCount: number;
    totalCount: number;
    estimatedWaitTime: number; // in seconds
  }> {
    try {
      const queue = await this.getQueue(venueId);
      const { priorityQueue, mainQueue } = this.getParsedQueues(queue);

      const priorityCount = priorityQueue.length;
      const mainCount = mainQueue.length;
      const totalCount = priorityCount + mainCount;

      // Calculate estimated wait time (sum of all durations)
      const priorityDuration = priorityQueue.reduce((sum: number, t: QueueTrack) => sum + t.duration, 0);
      const mainDuration = mainQueue.reduce((sum: number, t: QueueTrack) => sum + t.duration, 0);
      
      // Get current track duration
      let currentDuration = 0;
      if (queue.nowPlaying) {
        try {
          const nowPlaying = typeof queue.nowPlaying === 'string' 
            ? JSON.parse(queue.nowPlaying) 
            : queue.nowPlaying;
          currentDuration = nowPlaying?.duration || 0;
        } catch {
          currentDuration = 0;
        }
      }

      const estimatedWaitTime = priorityDuration + mainDuration + currentDuration;

      return {
        priorityCount,
        mainCount,
        totalCount,
        estimatedWaitTime,
      };
    } catch (error) {
      console.error('[QueueService] Error getting queue stats:', error);
      return {
        priorityCount: 0,
        mainCount: 0,
        totalCount: 0,
        estimatedWaitTime: 0,
      };
    }
  }

  /**
   * Helper: Reindex positions in queue
   */
  private reindexPositions(tracks: QueueTrack[]): QueueTrack[] {
    return tracks.map((track, index) => ({
      ...track,
      position: index,
    }));
  }

  /**
   * Helper: Log request to requests collection for analytics
   */
  private async logRequest(
    track: QueueTrack,
    status: 'played' | 'skipped' | 'refunded'
  ): Promise<void> {
    try {
      await this.databases.createDocument(
        DATABASE_ID,
        'requests',
        ID.unique(),
        {
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          requestedBy: track.requestedBy,
          requestedByEmail: track.requestedByEmail,
          requestedAt: track.requestedAt,
          completedAt: new Date().toISOString(),
          status,
          isPaid: track.isPaid,
          paidAmount: track.paidAmount,
          paymentId: track.paymentId,
        }
      );

      console.log('[QueueService] Logged request to history:', track.title);
    } catch (error) {
      console.error('[QueueService] Error logging request:', error);
      // Non-critical error, don't throw
    }
  }
}
