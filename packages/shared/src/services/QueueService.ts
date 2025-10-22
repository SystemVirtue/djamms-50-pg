import { Client, Databases, Query, ID, RealtimeResponseEvent } from 'appwrite';
import { Track } from '../hooks/useJukeboxState';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68e57de9003234a84cae';
const QUEUES_COLLECTION_ID = 'queues';

export interface QueueDocument {
  $id: string;
  venueId: string;
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  position: number;
  isPriority: boolean;
  addedAt: string;
  requestedBy?: string;
}

export class QueueService {
  private client: Client;
  private databases: Databases;

  constructor(client: Client) {
    this.client = client;
    this.databases = new Databases(client);
  }

  /**
   * Add track to queue in AppWrite
   */
  async addToQueue(
    venueId: string,
    track: Track
  ): Promise<QueueDocument> {
    try {
      const position = await this.getNextPosition(venueId, track.isPriority);

      const document = await this.databases.createDocument(
        DATABASE_ID,
        QUEUES_COLLECTION_ID,
        ID.unique(),
        {
          venueId,
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          thumbnailUrl: track.thumbnailUrl,
          position,
          isPriority: track.isPriority,
          addedAt: track.addedAt.toISOString(),
          requestedBy: track.requestedBy || null
        }
      );

      return document as unknown as QueueDocument;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Get all tracks in queue for a venue
   */
  async getQueue(venueId: string): Promise<{
    priorityQueue: Track[];
    mainQueue: Track[];
  }> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        QUEUES_COLLECTION_ID,
        [
          Query.equal('venueId', venueId),
          Query.orderAsc('position')
        ]
      );

      const documents = response.documents as unknown as QueueDocument[];

      const priorityQueue: Track[] = [];
      const mainQueue: Track[] = [];

      documents.forEach(doc => {
        const track: Track = {
          id: doc.$id,
          videoId: doc.videoId,
          title: doc.title,
          artist: doc.artist,
          duration: doc.duration,
          thumbnailUrl: doc.thumbnailUrl,
          isPriority: doc.isPriority,
          addedAt: new Date(doc.addedAt),
          requestedBy: doc.requestedBy
        };

        if (doc.isPriority) {
          priorityQueue.push(track);
        } else {
          mainQueue.push(track);
        }
      });

      return { priorityQueue, mainQueue };
    } catch (error) {
      console.error('Error getting queue:', error);
      throw error;
    }
  }

  /**
   * Remove track from queue
   */
  async removeFromQueue(trackId: string): Promise<void> {
    try {
      await this.databases.deleteDocument(
        DATABASE_ID,
        QUEUES_COLLECTION_ID,
        trackId
      );
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  }

  /**
   * Clear entire queue for a venue
   */
  async clearQueue(venueId: string): Promise<void> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        QUEUES_COLLECTION_ID,
        [Query.equal('venueId', venueId)]
      );

      // Delete all documents
      await Promise.all(
        response.documents.map(doc =>
          this.databases.deleteDocument(
            DATABASE_ID,
            QUEUES_COLLECTION_ID,
            doc.$id
          )
        )
      );
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Subscribe to queue changes
   */
  subscribeToQueue(
    venueId: string,
    callback: (payload: RealtimeResponseEvent<QueueDocument>) => void
  ): () => void {
    const unsubscribe = this.client.subscribe(
      `databases.${DATABASE_ID}.collections.${QUEUES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response as RealtimeResponseEvent<QueueDocument>;
        
        // Only handle events for this venue
        if (payload.payload.venueId === venueId) {
          callback(payload);
        }
      }
    );

    return unsubscribe;
  }

  /**
   * Get next position number for queue
   */
  private async getNextPosition(
    venueId: string,
    isPriority: boolean
  ): Promise<number> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        QUEUES_COLLECTION_ID,
        [
          Query.equal('venueId', venueId),
          Query.equal('isPriority', isPriority),
          Query.orderDesc('position'),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        return 0;
      }

      const lastDoc = response.documents[0] as unknown as QueueDocument;
      return lastDoc.position + 1;
    } catch (error) {
      console.error('Error getting next position:', error);
      return 0;
    }
  }

  /**
   * Reorder queue (update positions)
   */
  async reorderQueue(
    trackId: string,
    newPosition: number
  ): Promise<void> {
    try {
      await this.databases.updateDocument(
        DATABASE_ID,
        QUEUES_COLLECTION_ID,
        trackId,
        {
          position: newPosition
        }
      );
    } catch (error) {
      console.error('Error reordering queue:', error);
      throw error;
    }
  }
}

export default QueueService;
