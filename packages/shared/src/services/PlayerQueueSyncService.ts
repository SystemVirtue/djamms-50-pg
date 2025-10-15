/**
 * Player Queue Sync Service
 * Handles bidirectional sync between localStorage and AppWrite server
 * 
 * Features:
 * - Sync localStorage active_queue to AppWrite queues collection
 * - Sync AppWrite queue updates to localStorage
 * - Sync localStorage Now_Playing to AppWrite currentTrack
 * - Sync AppWrite currentTrack to localStorage
 * - Handle storage events for cross-tab communication
 */

import { Databases, Query, ID, Client } from 'appwrite';
import type { QueueTrack } from './QueueManagementService';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

interface LocalStorageQueue {
  priorityQueue: QueueTrack[];
  mainQueue: QueueTrack[];
}

interface NowPlayingTrack {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  startTime: number;
  position?: number;
  isPaid?: boolean;
  requestedBy?: string;
  requestedByEmail?: string;
}

/**
 * Player Queue Sync Service
 */
export class PlayerQueueSyncService {
  private databases: Databases;
  private venueId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private realtimeUnsubscribe: (() => void) | null = null;
  private lastServerSync: number = 0;
  private isUpdatingFromServer: boolean = false;

  constructor(client: Client, venueId: string) {
    this.databases = new Databases(client);
    this.venueId = venueId;
  }

  /**
   * Start bidirectional sync
   */
  startSync(onError?: (error: Error) => void): void {
    console.log('[PlayerQueueSync] Starting bidirectional sync for venue:', this.venueId);

    // Initial sync from server to localStorage
    this.syncFromServer().catch((err) => {
      console.error('[PlayerQueueSync] Initial sync failed:', err);
      onError?.(err);
    });

    // Subscribe to AppWrite real-time updates
    this.subscribeToServerUpdates(onError);

    // Listen for localStorage changes (from other tabs or localStorage setItem calls)
    this.listenToLocalStorageChanges();

    // Periodic sync from localStorage to server (every 5 seconds)
    this.syncInterval = setInterval(() => {
      this.syncToServer().catch((err) => {
        console.error('[PlayerQueueSync] Periodic sync to server failed:', err);
        onError?.(err);
      });
    }, 5000);
  }

  /**
   * Stop sync
   */
  stopSync(): void {
    console.log('[PlayerQueueSync] Stopping sync');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }

    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }
  }

  /**
   * Sync from localStorage to AppWrite server
   */
  private async syncToServer(): Promise<void> {
    // Prevent sync loops
    if (this.isUpdatingFromServer) {
      return;
    }

    const now = Date.now();
    
    // Rate limit: Don't sync more than once per 3 seconds
    if (now - this.lastServerSync < 3000) {
      return;
    }

    try {
      // Read from localStorage
      const activeQueueJSON = localStorage.getItem(`active_queue_${this.venueId}`);
      const nowPlayingJSON = localStorage.getItem(`now_playing_${this.venueId}`);

      if (!activeQueueJSON) {
        console.log('[PlayerQueueSync] No active_queue in localStorage, skipping sync to server');
        return;
      }

      const localQueue: LocalStorageQueue = JSON.parse(activeQueueJSON);
      const nowPlaying: NowPlayingTrack | null = nowPlayingJSON ? JSON.parse(nowPlayingJSON) : null;

      // Get or create queue document
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        'queues',
        [Query.equal('venueId', this.venueId), Query.limit(1)]
      );

      let queueDoc: any;

      if (response.documents.length > 0) {
        queueDoc = response.documents[0];
      } else {
        // Create new queue document
        queueDoc = await this.databases.createDocument(
          DATABASE_ID,
          'queues',
          ID.unique(),
          {
            venueId: this.venueId,
            mainQueue: [],
            priorityQueue: [],
            currentTrack: null,
          }
        );
      }

      // Convert NowPlaying to QueueTrack format
      let currentTrack: QueueTrack | null = null;
      if (nowPlaying) {
        currentTrack = {
          id: `current_${Date.now()}`,
          videoId: nowPlaying.videoId,
          title: nowPlaying.title,
          artist: nowPlaying.artist,
          duration: nowPlaying.duration,
          thumbnail: nowPlaying.thumbnail,
          requestedAt: new Date().toISOString(),
          position: nowPlaying.position || 0,
          status: 'playing',
          isPaid: nowPlaying.isPaid || false,
          requestedBy: nowPlaying.requestedBy,
          requestedByEmail: nowPlaying.requestedByEmail,
        };
      }

      // Update server
      await this.databases.updateDocument(
        DATABASE_ID,
        'queues',
        queueDoc.$id,
        {
          mainQueue: localQueue.mainQueue || [],
          priorityQueue: localQueue.priorityQueue || [],
          currentTrack: currentTrack,
        }
      );

      this.lastServerSync = now;
      console.log('[PlayerQueueSync] Synced to server:', {
        mainQueue: localQueue.mainQueue?.length || 0,
        priorityQueue: localQueue.priorityQueue?.length || 0,
        currentTrack: currentTrack?.title || 'none',
      });
    } catch (error) {
      console.error('[PlayerQueueSync] Failed to sync to server:', error);
      throw error;
    }
  }

  /**
   * Sync from AppWrite server to localStorage
   */
  private async syncFromServer(): Promise<void> {
    this.isUpdatingFromServer = true;

    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        'queues',
        [Query.equal('venueId', this.venueId), Query.limit(1)]
      );

      if (response.documents.length === 0) {
        console.log('[PlayerQueueSync] No queue document on server, skipping sync from server');
        this.isUpdatingFromServer = false;
        return;
      }

      const queueDoc: any = response.documents[0];

      // Update localStorage active_queue
      const localQueue: LocalStorageQueue = {
        mainQueue: queueDoc.mainQueue || [],
        priorityQueue: queueDoc.priorityQueue || [],
      };

      localStorage.setItem(`active_queue_${this.venueId}`, JSON.stringify(localQueue));

      // Update localStorage now_playing
      if (queueDoc.currentTrack) {
        const nowPlaying: NowPlayingTrack = {
          videoId: queueDoc.currentTrack.videoId,
          title: queueDoc.currentTrack.title,
          artist: queueDoc.currentTrack.artist,
          duration: queueDoc.currentTrack.duration,
          thumbnail: queueDoc.currentTrack.thumbnail,
          startTime: Date.now(),
          position: queueDoc.currentTrack.position,
          isPaid: queueDoc.currentTrack.isPaid,
          requestedBy: queueDoc.currentTrack.requestedBy,
          requestedByEmail: queueDoc.currentTrack.requestedByEmail,
        };

        localStorage.setItem(`now_playing_${this.venueId}`, JSON.stringify(nowPlaying));
      } else {
        localStorage.removeItem(`now_playing_${this.venueId}`);
      }

      console.log('[PlayerQueueSync] Synced from server:', {
        mainQueue: queueDoc.mainQueue?.length || 0,
        priorityQueue: queueDoc.priorityQueue?.length || 0,
        currentTrack: queueDoc.currentTrack?.title || 'none',
      });
    } catch (error) {
      console.error('[PlayerQueueSync] Failed to sync from server:', error);
      throw error;
    } finally {
      // Small delay before allowing server syncs again
      setTimeout(() => {
        this.isUpdatingFromServer = false;
      }, 1000);
    }
  }

  /**
   * Subscribe to AppWrite real-time updates
   */
  private subscribeToServerUpdates(_onError?: (error: Error) => void): void {
    // Note: This requires the AppWrite client to be passed in
    // For now, we'll rely on periodic sync
    // TODO: Implement real-time subscription when client is available
    console.log('[PlayerQueueSync] Real-time subscription requires client setup');
  }

  /**
   * Listen for localStorage changes (cross-tab communication)
   */
  private listenToLocalStorageChanges(): void {
    this.storageListener = (event: StorageEvent) => {
      const activeQueueKey = `active_queue_${this.venueId}`;
      const nowPlayingKey = `now_playing_${this.venueId}`;

      // Check if the changed key is relevant
      if (event.key === activeQueueKey || event.key === nowPlayingKey) {
        console.log('[PlayerQueueSync] localStorage changed:', event.key);

        // Debounce sync to server
        setTimeout(() => {
          this.syncToServer().catch((err) => {
            console.error('[PlayerQueueSync] Failed to sync after localStorage change:', err);
          });
        }, 500);
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  /**
   * Manual sync from server (useful for immediate updates)
   */
  async syncNow(): Promise<void> {
    await this.syncFromServer();
  }

  /**
   * Manual push to server (useful for immediate updates)
   */
  async pushNow(): Promise<void> {
    await this.syncToServer();
  }

  /**
   * Get current queue from localStorage
   */
  getLocalQueue(): LocalStorageQueue | null {
    const json = localStorage.getItem(`active_queue_${this.venueId}`);
    return json ? JSON.parse(json) : null;
  }

  /**
   * Get current now playing from localStorage
   */
  getLocalNowPlaying(): NowPlayingTrack | null {
    const json = localStorage.getItem(`now_playing_${this.venueId}`);
    return json ? JSON.parse(json) : null;
  }

  /**
   * Update local queue and trigger sync
   */
  async updateLocalQueue(queue: LocalStorageQueue): Promise<void> {
    localStorage.setItem(`active_queue_${this.venueId}`, JSON.stringify(queue));
    await this.syncToServer();
  }

  /**
   * Update local now playing and trigger sync
   */
  async updateLocalNowPlaying(track: NowPlayingTrack | null): Promise<void> {
    if (track) {
      localStorage.setItem(`now_playing_${this.venueId}`, JSON.stringify(track));
    } else {
      localStorage.removeItem(`now_playing_${this.venueId}`);
    }
    await this.syncToServer();
  }
}
