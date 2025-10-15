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
  mainQueue: QueueTrack[];
  priorityQueue: QueueTrack[];
  currentTrack: QueueTrack | null;
  $createdAt: string;
  $updatedAt: string;
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
   * Get or create queue for venue
   */
  async getQueue(venueId: string): Promise<QueueDocument> {
    try {
      const response = await this.databases.listDocuments<QueueDocument>(
        DATABASE_ID,
        'queues',
        [Query.equal('venueId', venueId), Query.limit(1)]
      );

      if (response.documents.length > 0) {
        return response.documents[0];
      }

      // Create new queue if doesn't exist
      return await this.databases.createDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        ID.unique(),
        {
          venueId,
          mainQueue: [],
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
      const currentQueue = queue[targetQueue];

      // Set position (last in queue)
      track.position = currentQueue.length;

      // Add to queue
      const updatedQueue = [...currentQueue, track];

      // Update in database
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          [targetQueue]: updatedQueue,
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

      // Remove from priority queue
      let priorityQueue = queue.priorityQueue.filter(t => t.id !== trackId);
      
      // Remove from main queue
      let mainQueue = queue.mainQueue.filter(t => t.id !== trackId);

      // Reindex positions
      priorityQueue = this.reindexPositions(priorityQueue);
      mainQueue = this.reindexPositions(mainQueue);

      // Update in database
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          priorityQueue,
          mainQueue,
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
      const currentQueue = queue[queueType];

      // Reorder based on trackIds array
      const reordered = trackIds
        .map(id => currentQueue.find(t => t.id === id))
        .filter((t): t is QueueTrack => t !== undefined);

      // Reindex positions
      const reindexed = this.reindexPositions(reordered);

      // Update in database
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          [queueType]: reindexed,
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

      // Check priority queue first
      if (queue.priorityQueue.length > 0) {
        return queue.priorityQueue[0];
      }

      // Then check main queue
      if (queue.mainQueue.length > 0) {
        return queue.mainQueue[0];
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

      // Find track in either queue
      let track = queue.priorityQueue.find(t => t.id === trackId);
      let queueType: 'priorityQueue' | 'mainQueue' = 'priorityQueue';

      if (!track) {
        track = queue.mainQueue.find(t => t.id === trackId);
        queueType = 'mainQueue';
      }

      if (!track) {
        throw new Error('Track not found in queue');
      }

      // Update track status
      track.status = 'playing';

      // Set as current track
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          currentTrack: track,
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

      if (!queue.currentTrack) {
        console.warn('[QueueService] No current track to complete');
        return queue;
      }

      const completedTrackId = queue.currentTrack.id;

      // Remove completed track from queues
      const priorityQueue = queue.priorityQueue.filter(t => t.id !== completedTrackId);
      const mainQueue = queue.mainQueue.filter(t => t.id !== completedTrackId);

      // Reindex positions
      const reindexedPriority = this.reindexPositions(priorityQueue);
      const reindexedMain = this.reindexPositions(mainQueue);

      // Log to requests collection for analytics
      await this.logRequest(queue.currentTrack, 'played');

      // Update in database
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          priorityQueue: reindexedPriority,
          mainQueue: reindexedMain,
          currentTrack: null, // Will be set by next playNextTrack call
        }
      );

      console.log('[QueueService] Completed track:', queue.currentTrack.title);
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

      if (!queue.currentTrack) {
        console.warn('[QueueService] No current track to skip');
        return queue;
      }

      const skippedTrackId = queue.currentTrack.id;

      // Remove skipped track from queues
      const priorityQueue = queue.priorityQueue.filter(t => t.id !== skippedTrackId);
      const mainQueue = queue.mainQueue.filter(t => t.id !== skippedTrackId);

      // Reindex positions
      const reindexedPriority = this.reindexPositions(priorityQueue);
      const reindexedMain = this.reindexPositions(mainQueue);

      // Log to requests collection for analytics
      await this.logRequest(queue.currentTrack, 'skipped');

      // Update in database
      const updated = await this.databases.updateDocument<QueueDocument>(
        DATABASE_ID,
        'queues',
        queue.$id,
        {
          priorityQueue: reindexedPriority,
          mainQueue: reindexedMain,
          currentTrack: null,
        }
      );

      console.log('[QueueService] Skipped track:', queue.currentTrack.title);
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

      // Check both queues
      const inPriority = queue.priorityQueue.some(t => t.videoId === videoId);
      const inMain = queue.mainQueue.some(t => t.videoId === videoId);
      const isCurrent = queue.currentTrack?.videoId === videoId;

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

      const priorityCount = queue.priorityQueue.length;
      const mainCount = queue.mainQueue.length;
      const totalCount = priorityCount + mainCount;

      // Calculate estimated wait time (sum of all durations)
      const priorityDuration = queue.priorityQueue.reduce((sum, t) => sum + t.duration, 0);
      const mainDuration = queue.mainQueue.reduce((sum, t) => sum + t.duration, 0);
      const currentDuration = queue.currentTrack?.duration || 0;

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
