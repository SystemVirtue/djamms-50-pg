/**
 * Admin Queue Controls
 * 
 * Control panel for managing the jukebox queue:
 * - Skip current track
 * - Clear queue sections
 * - Real-time queue statistics
 * 
 * Adapted from prod-jukebox AdminConsole.tsx with DJAMMS hooks
 */

import * as React from 'react';
import { useState } from 'react';
import {
  SkipForward,
  Trash2,
  AlertCircle,
  CheckCircle,
  Music2,
} from 'lucide-react';
import { useQueueManagement } from '@djamms/shared';
import { Client } from 'appwrite';

interface AdminQueueControlsProps {
  venueId: string;
  client: Client;
  className?: string;
}

export const AdminQueueControls: React.FC<AdminQueueControlsProps> = ({
  venueId,
  client,
  className = '',
}) => {
  const [isClearingPriority, setIsClearingPriority] = useState(false);
  const [isClearingMain, setIsClearingMain] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const {
    currentTrack,
    skipTrack,
    clearQueue,
    isLoading,
    error,
    queueStats,
  } = useQueueManagement({
    venueId,
    client,
    enableRealtime: true,
  });

  /**
   * Handle skip current track
   */
  const handleSkip = async () => {
    if (!currentTrack) return;
    
    try {
      await skipTrack();
    } catch (error) {
      console.error('Failed to skip track:', error);
    }
  };

  /**
   * Handle clear priority queue
   */
  const handleClearPriority = async () => {
    if (!confirm('Clear all paid requests from the priority queue?')) {
      return;
    }

    setIsClearingPriority(true);
    try {
      await clearQueue('priorityQueue');
    } catch (error) {
      console.error('Failed to clear priority queue:', error);
    } finally {
      setIsClearingPriority(false);
    }
  };

  /**
   * Handle clear main queue
   */
  const handleClearMain = async () => {
    if (!confirm('Clear all songs from the main playlist queue?')) {
      return;
    }

    setIsClearingMain(true);
    try {
      await clearQueue('mainQueue');
    } catch (error) {
      console.error('Failed to clear main queue:', error);
    } finally {
      setIsClearingMain(false);
    }
  };

  /**
   * Handle clear entire queue
   */
  const handleClearAll = async () => {
    if (!confirm('Clear the ENTIRE queue? This includes all paid requests and playlist songs. This cannot be undone.')) {
      return;
    }

    setIsClearingAll(true);
    try {
      await clearQueue('both');
    } catch (error) {
      console.error('Failed to clear entire queue:', error);
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Queue Statistics */}
      <div className="bg-slate-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music2 className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Queue Statistics</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-600">Priority Queue</p>
            <p className="text-2xl font-bold text-blue-600">
              {queueStats.priorityCount}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Main Queue</p>
            <p className="text-2xl font-bold text-slate-700">
              {queueStats.mainCount}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-600">Total Songs</p>
            <p className="text-2xl font-bold text-slate-900">
              {queueStats.totalCount}
            </p>
          </div>
          {queueStats.estimatedWaitTime > 0 && (
            <div className="col-span-2">
              <p className="text-slate-600">Estimated Wait</p>
              <p className="text-lg font-semibold text-slate-700">
                ~{Math.ceil(queueStats.estimatedWaitTime / 60)} minutes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-xs text-red-700">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        </div>
      )}

      {/* Track Controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Track Controls
        </h3>

        <button
          onClick={handleSkip}
          disabled={!currentTrack || isLoading}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            font-medium text-white bg-blue-600 hover:bg-blue-700
            active:bg-blue-800 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <SkipForward className="w-5 h-5" />
          <span>Skip Current Track</span>
        </button>

        {!currentTrack && (
          <p className="text-xs text-slate-500 text-center">
            No track currently playing
          </p>
        )}
      </div>

      {/* Queue Management Controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Queue Management
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {/* Clear Priority Queue */}
          <button
            onClick={handleClearPriority}
            disabled={isClearingPriority || isLoading || queueStats.priorityCount === 0}
            className="
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              font-medium text-white bg-orange-600 hover:bg-orange-700
              active:bg-orange-800 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            "
          >
            {isClearingPriority ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            <span>Clear Priority Queue ({queueStats.priorityCount})</span>
          </button>

          {/* Clear Main Queue */}
          <button
            onClick={handleClearMain}
            disabled={isClearingMain || isLoading || queueStats.mainCount === 0}
            className="
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              font-medium text-white bg-orange-600 hover:bg-orange-700
              active:bg-orange-800 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            "
          >
            {isClearingMain ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            <span>Clear Main Queue ({queueStats.mainCount})</span>
          </button>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            disabled={isClearingAll || isLoading || queueStats.totalCount === 0}
            className="
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              font-medium text-white bg-red-600 hover:bg-red-700
              active:bg-red-800 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            "
          >
            {isClearingAll ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            <span>Clear ENTIRE Queue</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Queue controls affect all connected players
        </p>
      </div>

      {/* Success Indicator */}
      {!isLoading && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Queue controls ready
          </p>
        </div>
      )}
    </div>
  );
};
