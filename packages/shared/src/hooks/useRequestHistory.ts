/**
 * useRequestHistory Hook
 * 
 * React hook for tracking and querying song request history
 * with analytics support
 */

import { useState, useEffect, useCallback } from 'react';
import { Client } from 'appwrite';
import {
  RequestHistoryService,
  SongRequest,
  RequestHistoryFilters,
  RequestAnalytics,
} from '../services/RequestHistoryService';

export interface UseRequestHistoryConfig {
  venueId: string;
  client: Client;
  databaseId?: string;
  autoLoad?: boolean;
  filters?: RequestHistoryFilters;
}

export interface UseRequestHistoryReturn {
  // Data
  requests: SongRequest[];
  analytics: RequestAnalytics | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  logRequest: (request: Omit<SongRequest, 'requestId'>) => Promise<SongRequest>;
  updateStatus: (requestId: string, status: SongRequest['status'], additionalData?: any) => Promise<void>;
  loadHistory: (filters?: RequestHistoryFilters) => Promise<void>;
  loadAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
  cleanupOld: (daysToKeep?: number) => Promise<number>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing request history and analytics
 */
export function useRequestHistory(
  config: UseRequestHistoryConfig
): UseRequestHistoryReturn {
  const { venueId, client, databaseId = 'main-db', autoLoad = true, filters } = config;

  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [analytics, setAnalytics] = useState<RequestAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => new RequestHistoryService(client, databaseId));

  // Load history on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && venueId) {
      loadHistory(filters);
    }
  }, [venueId, autoLoad]);

  /**
   * Log a new song request
   */
  const logRequest = useCallback(
    async (request: Omit<SongRequest, 'requestId'>): Promise<SongRequest> => {
      try {
        setError(null);
        const newRequest = await service.logRequest(request);
        
        // Add to local state
        setRequests(prev => [newRequest, ...prev]);
        
        return newRequest;
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Update request status
   */
  const updateStatus = useCallback(
    async (
      requestId: string,
      status: SongRequest['status'],
      additionalData?: {
        completedAt?: string;
        cancelledAt?: string;
        cancelReason?: string;
      }
    ): Promise<void> => {
      try {
        setError(null);
        const updated = await service.updateRequestStatus(requestId, status, additionalData);
        
        // Update local state
        setRequests(prev =>
          prev.map(r => (r.requestId === requestId ? updated : r))
        );
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        throw err;
      }
    },
    [service]
  );

  /**
   * Load request history with filters
   */
  const loadHistory = useCallback(
    async (filterOverrides?: RequestHistoryFilters): Promise<void> => {
      if (!venueId) return;

      try {
        setLoading(true);
        setError(null);

        const finalFilters = filterOverrides || filters;
        const history = await service.getRequestHistory(venueId, finalFilters);
        
        setRequests(history);
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        console.error('[useRequestHistory] Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    },
    [venueId, service, filters]
  );

  /**
   * Load analytics for date range
   */
  const loadAnalytics = useCallback(
    async (startDate?: string, endDate?: string): Promise<void> => {
      if (!venueId) return;

      try {
        setLoading(true);
        setError(null);

        const analyticsData = await service.getRequestAnalytics(
          venueId,
          startDate,
          endDate
        );
        
        setAnalytics(analyticsData);
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        console.error('[useRequestHistory] Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    },
    [venueId, service]
  );

  /**
   * Cleanup old requests
   */
  const cleanupOld = useCallback(
    async (daysToKeep: number = 90): Promise<number> => {
      if (!venueId) return 0;

      try {
        setLoading(true);
        setError(null);

        const deletedCount = await service.cleanupOldRequests(venueId, daysToKeep);
        
        // Refresh history after cleanup
        await loadHistory();
        
        return deletedCount;
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        console.error('[useRequestHistory] Failed to cleanup:', err);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [venueId, service, loadHistory]
  );

  /**
   * Refresh both history and analytics
   */
  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([
      loadHistory(),
      loadAnalytics(),
    ]);
  }, [loadHistory, loadAnalytics]);

  return {
    requests,
    analytics,
    loading,
    error,
    logRequest,
    updateStatus,
    loadHistory,
    loadAnalytics,
    cleanupOld,
    refresh,
  };
}
