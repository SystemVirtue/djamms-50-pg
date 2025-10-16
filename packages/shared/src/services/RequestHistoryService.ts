/**
 * Request History Service
 * 
 * Tracks all song requests through their lifecycle:
 * - queued: Added to queue (payment completed)
 * - playing: Currently playing
 * - completed: Finished playing
 * - cancelled: Removed before playing
 * 
 * Provides analytics and history queries for venue admins.
 */

import { Client, Databases, Query, ID } from 'appwrite';

export interface SongRequest {
  requestId: string;
  venueId: string;
  song: {
    videoId: string;
    title: string;
    artist: string;
    duration: number;
    thumbnail: string;
  };
  requesterId: string; // User ID or session ID
  paymentId: string; // Payment transaction ID
  status: 'queued' | 'playing' | 'completed' | 'cancelled';
  timestamp: string; // ISO date string
  // Additional metadata
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface RequestHistoryFilters {
  status?: 'queued' | 'playing' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  requesterId?: string;
  limit?: number;
}

export interface RequestAnalytics {
  totalRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  totalRevenue: number;
  averagePerDay: number;
  topRequester: {
    requesterId: string;
    count: number;
  } | null;
  popularSongs: Array<{
    videoId: string;
    title: string;
    artist: string;
    requestCount: number;
  }>;
}

export class RequestHistoryService {
  private databases: Databases;
  private databaseId: string;
  private collectionId = 'requests';

  constructor(client: Client, databaseId: string = 'main-db') {
    this.databases = new Databases(client);
    this.databaseId = databaseId;
  }

  /**
   * Log a new song request
   */
  async logRequest(request: Omit<SongRequest, 'requestId'>): Promise<SongRequest> {
    try {
      const requestId = ID.unique();
      
      const document = await this.databases.createDocument(
        this.databaseId,
        this.collectionId,
        requestId,
        {
          requestId,
          venueId: request.venueId,
          song: JSON.stringify(request.song), // Store as JSON string
          requesterId: request.requesterId,
          paymentId: request.paymentId,
          status: request.status || 'queued',
          timestamp: request.timestamp || new Date().toISOString(),
        }
      );

      return this.mapDocumentToRequest(document);
    } catch (error) {
      console.error('[RequestHistoryService] Failed to log request:', error);
      throw new Error(`Failed to log request: ${(error as Error).message}`);
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    requestId: string,
    status: SongRequest['status'],
    additionalData?: {
      completedAt?: string;
      cancelledAt?: string;
      cancelReason?: string;
    }
  ): Promise<SongRequest> {
    try {
      const updateData: any = { status };
      
      if (additionalData?.completedAt) {
        updateData.completedAt = additionalData.completedAt;
      }
      if (additionalData?.cancelledAt) {
        updateData.cancelledAt = additionalData.cancelledAt;
      }
      if (additionalData?.cancelReason) {
        updateData.cancelReason = additionalData.cancelReason;
      }

      const document = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        requestId,
        updateData
      );

      return this.mapDocumentToRequest(document);
    } catch (error) {
      console.error('[RequestHistoryService] Failed to update status:', error);
      throw new Error(`Failed to update status: ${(error as Error).message}`);
    }
  }

  /**
   * Get request history for a venue with filters
   */
  async getRequestHistory(
    venueId: string,
    filters?: RequestHistoryFilters
  ): Promise<SongRequest[]> {
    try {
      const queries: string[] = [
        Query.equal('venueId', venueId),
        Query.orderDesc('timestamp'),
      ];

      if (filters?.status) {
        queries.push(Query.equal('status', filters.status));
      }

      if (filters?.startDate) {
        queries.push(Query.greaterThanEqual('timestamp', filters.startDate));
      }

      if (filters?.endDate) {
        queries.push(Query.lessThanEqual('timestamp', filters.endDate));
      }

      if (filters?.requesterId) {
        queries.push(Query.equal('requesterId', filters.requesterId));
      }

      if (filters?.limit) {
        queries.push(Query.limit(filters.limit));
      } else {
        queries.push(Query.limit(100)); // Default limit
      }

      const response = await this.databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return response.documents.map(doc => this.mapDocumentToRequest(doc));
    } catch (error) {
      console.error('[RequestHistoryService] Failed to get history:', error);
      throw new Error(`Failed to get history: ${(error as Error).message}`);
    }
  }

  /**
   * Get analytics for a venue within a date range
   */
  async getRequestAnalytics(
    venueId: string,
    startDate?: string,
    endDate?: string
  ): Promise<RequestAnalytics> {
    try {
      const queries: string[] = [
        Query.equal('venueId', venueId),
        Query.limit(10000), // Get all for analytics
      ];

      if (startDate) {
        queries.push(Query.greaterThanEqual('timestamp', startDate));
      }

      if (endDate) {
        queries.push(Query.lessThanEqual('timestamp', endDate));
      }

      const response = await this.databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      const requests = response.documents.map(doc => this.mapDocumentToRequest(doc));

      // Calculate analytics
      const totalRequests = requests.length;
      const completedRequests = requests.filter(r => r.status === 'completed').length;
      const cancelledRequests = requests.filter(r => r.status === 'cancelled').length;

      // Revenue (assuming $1 per request, adjust based on venue pricing)
      const totalRevenue = completedRequests * 1.0;

      // Average per day
      const dayCount = this.calculateDayCount(startDate, endDate);
      const averagePerDay = dayCount > 0 ? totalRequests / dayCount : totalRequests;

      // Top requester
      const requesterCounts = new Map<string, number>();
      requests.forEach(r => {
        const count = requesterCounts.get(r.requesterId) || 0;
        requesterCounts.set(r.requesterId, count + 1);
      });

      let topRequester: RequestAnalytics['topRequester'] = null;
      if (requesterCounts.size > 0) {
        const [requesterId, count] = Array.from(requesterCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        topRequester = { requesterId, count };
      }

      // Popular songs
      const songCounts = new Map<string, { title: string; artist: string; count: number }>();
      requests.forEach(r => {
        const song = r.song;
        const existing = songCounts.get(song.videoId);
        if (existing) {
          existing.count++;
        } else {
          songCounts.set(song.videoId, {
            title: song.title,
            artist: song.artist,
            count: 1,
          });
        }
      });

      const popularSongs = Array.from(songCounts.entries())
        .map(([videoId, data]) => ({
          videoId,
          title: data.title,
          artist: data.artist,
          requestCount: data.count,
        }))
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10);

      return {
        totalRequests,
        completedRequests,
        cancelledRequests,
        totalRevenue,
        averagePerDay,
        topRequester,
        popularSongs,
      };
    } catch (error) {
      console.error('[RequestHistoryService] Failed to get analytics:', error);
      throw new Error(`Failed to get analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Delete old completed/cancelled requests (cleanup)
   */
  async cleanupOldRequests(venueId: string, daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const queries: string[] = [
        Query.equal('venueId', venueId),
        Query.lessThan('timestamp', cutoffDate.toISOString()),
        Query.equal('status', ['completed', 'cancelled']),
        Query.limit(1000),
      ];

      const response = await this.databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      let deletedCount = 0;
      for (const doc of response.documents) {
        await this.databases.deleteDocument(
          this.databaseId,
          this.collectionId,
          doc.$id
        );
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('[RequestHistoryService] Failed to cleanup:', error);
      throw new Error(`Failed to cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Map AppWrite document to SongRequest
   */
  private mapDocumentToRequest(doc: any): SongRequest {
    return {
      requestId: doc.requestId,
      venueId: doc.venueId,
      song: JSON.parse(doc.song),
      requesterId: doc.requesterId,
      paymentId: doc.paymentId,
      status: doc.status,
      timestamp: doc.timestamp,
      completedAt: doc.completedAt,
      cancelledAt: doc.cancelledAt,
      cancelReason: doc.cancelReason,
    };
  }

  /**
   * Calculate day count between dates
   */
  private calculateDayCount(startDate?: string, endDate?: string): number {
    if (!startDate || !endDate) {
      return 1;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
