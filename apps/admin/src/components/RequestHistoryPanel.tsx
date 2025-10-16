/**
 * Request History Panel
 * 
 * Displays song request history for a venue with:
 * - Recent requests list
 * - Status filtering
 * - Date range filtering
 * - Request details
 */

import { useState } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { useRequestHistory } from '@shared/hooks';
import { History, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { Button } from '@shared/components';
import type { SongRequest, RequestHistoryFilters } from '@shared/services';

interface RequestHistoryPanelProps {
  venueId: string;
  databaseId?: string;
  className?: string;
}

export function RequestHistoryPanel({
  venueId,
  databaseId = 'main-db',
  className = '',
}: RequestHistoryPanelProps) {
  const { client } = useAppwrite();
  const [statusFilter, setStatusFilter] = useState<RequestHistoryFilters['status']>(undefined);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const {
    requests,
    loading,
    error,
    loadHistory,
  } = useRequestHistory({
    venueId,
    client,
    databaseId,
    autoLoad: true,
    filters: { limit: 50 },
  });

  // Apply filters
  const handleFilterChange = () => {
    const filters: RequestHistoryFilters = { limit: 50 };
    
    if (statusFilter) {
      filters.status = statusFilter;
    }
    if (dateRange.start) {
      filters.startDate = new Date(dateRange.start).toISOString();
    }
    if (dateRange.end) {
      filters.endDate = new Date(dateRange.end).toISOString();
    }

    loadHistory(filters);
  };

  const getStatusIcon = (status: SongRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'playing':
        return <Play className="w-5 h-5 text-orange-500 animate-pulse" />;
      case 'queued':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SongRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-500/30';
      case 'playing':
        return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      case 'queued':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Request History</h2>
        </div>
        <Button
          onClick={handleFilterChange}
          variant="outline"
          size="sm"
        >
          Apply Filters
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Status
            </label>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value as any || undefined)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All</option>
              <option value="queued">Queued</option>
              <option value="playing">Playing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error loading request history: {error}</p>
        </div>
      )}

      {/* Request List */}
      {!loading && !error && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No requests found</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.requestId}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Song Info */}
                  <div className="flex gap-4 flex-1 min-w-0">
                    {/* Thumbnail */}
                    {request.song.thumbnail && (
                      <img
                        src={request.song.thumbnail}
                        alt={request.song.title}
                        className="w-20 h-20 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {request.song.title}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {request.song.artist}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatDate(request.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                {request.cancelReason && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm text-red-400">
                      Cancel reason: {request.cancelReason}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && requests.length > 0 && (
        <div className="text-center text-sm text-gray-400">
          Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
