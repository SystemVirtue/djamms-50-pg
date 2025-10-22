/**
 * Analytics Dashboard
 * 
 * Displays request analytics for a venue:
 * - Total requests
 * - Completion rate
 * - Revenue estimates
 * - Popular songs
 * - Top requesters
 */

import { useState, useEffect } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { useRequestHistory } from '@shared/hooks';
import { BarChart3, TrendingUp, DollarSign, Music, Users, Calendar } from 'lucide-react';
import { Button } from '@shared/components';

interface AnalyticsDashboardProps {
  venueId: string;
  databaseId?: string;
  className?: string;
}

export function AnalyticsDashboard({
  venueId,
  databaseId = '68e57de9003234a84cae',
  className = '',
}: AnalyticsDashboardProps) {
  const { client } = useAppwrite();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // Today
  });

  const {
    analytics,
    loading,
    error,
    loadAnalytics,
  } = useRequestHistory({
    venueId,
    client,
    databaseId,
    autoLoad: false,
  });

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const startISO = new Date(dateRange.start).toISOString();
      const endISO = new Date(dateRange.end).toISOString();
      loadAnalytics(startISO, endISO);
    }
  }, [venueId]);

  const handleLoadAnalytics = () => {
    const startISO = new Date(dateRange.start).toISOString();
    const endISO = new Date(dateRange.end).toISOString();
    loadAnalytics(startISO, endISO);
  };

  const completionRate = analytics
    ? ((analytics.completedRequests / analytics.totalRequests) * 100).toFixed(1)
    : '0';

  const cancellationRate = analytics
    ? ((analytics.cancelledRequests / analytics.totalRequests) * 100).toFixed(1)
    : '0';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <Button onClick={handleLoadAnalytics} variant="default">
            Load Analytics
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error loading analytics: {error}</p>
        </div>
      )}

      {/* Analytics Data */}
      {!loading && !error && analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Requests */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Requests</span>
                <Music className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white">
                {analytics.totalRequests}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {analytics.averagePerDay.toFixed(1)} per day
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Completion Rate</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-white">
                {completionRate}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {analytics.completedRequests} completed
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Est. Revenue</span>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-white">
                ${analytics.totalRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                From completed requests
              </div>
            </div>

            {/* Cancellation Rate */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Cancellation Rate</span>
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-white">
                {cancellationRate}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {analytics.cancelledRequests} cancelled
              </div>
            </div>
          </div>

          {/* Popular Songs */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-orange-500" />
              Most Requested Songs
            </h3>
            {analytics.popularSongs.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.popularSongs.map((song, index) => (
                  <div
                    key={song.videoId}
                    className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-orange-500 font-bold text-lg">
                        {song.requestCount}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">requests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Requester */}
          {analytics.topRequester && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Top Requester
              </h3>
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">
                    User ID: {analytics.topRequester.requesterId.substring(0, 16)}...
                  </p>
                  <p className="text-gray-400 text-sm">Most active user</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-500">
                    {analytics.topRequester.count}
                  </p>
                  <p className="text-gray-400 text-sm">requests</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Data */}
      {!loading && !error && !analytics && (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">Select a date range and click "Load Analytics"</p>
        </div>
      )}
    </div>
  );
}
