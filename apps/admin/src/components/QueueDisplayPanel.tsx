/**
 * Queue Display Panel
 * 
 * Displays the current queue state with:
 * - Now Playing section (green highlight)
 * - Priority Queue section (blue highlight - paid requests)
 * - Main Playlist Queue section (gray - default songs)
 * 
 * Adapted from prod-jukebox AdminConsole.tsx queue display (lines 1268-1370)
 * with modern React patterns and DJAMMS integration
 */

import * as React from 'react';
import { Play, Users, List, Clock, DollarSign, Music } from 'lucide-react';
import { useQueueManagement } from '@djamms/shared';
import type { Track } from '@djamms/shared';
import { Client } from 'appwrite';

interface QueueDisplayPanelProps {
  venueId: string;
  client: Client;
  currentlyPlaying?: Track | null;
  className?: string;
}

/**
 * Helper to clean title text by removing content in brackets/parens
 */
const cleanTitle = (title: string): string => {
  return title
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();
};

/**
 * Format duration from seconds to MM:SS
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const QueueDisplayPanel: React.FC<QueueDisplayPanelProps> = ({
  venueId,
  client,
  currentlyPlaying,
  className = '',
}) => {
  const {
    priorityQueue,
    mainQueue,
    isLoading,
    error,
  } = useQueueManagement({
    venueId,
    client,
    enableRealtime: true,
  });

  // Calculate total queue length
  const totalQueueLength = priorityQueue.length + mainQueue.length;

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-700 text-sm">
          Failed to load queue: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Queue Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Queue Management
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Music className="w-4 h-4" />
          <span>
            {totalQueueLength} {totalQueueLength === 1 ? 'song' : 'songs'} in queue
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-slate-600">Loading queue...</p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {/* Now Playing Section */}
          {currentlyPlaying && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                      Now Playing
                    </span>
                  </div>
                  <div className="font-semibold text-base text-green-900">
                    {cleanTitle(currentlyPlaying.title)}
                  </div>
                  <div className="text-sm text-green-700 flex items-center gap-2">
                    <span>{currentlyPlaying.artist}</span>
                    {currentlyPlaying.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(currentlyPlaying.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority Queue Section (Paid Requests) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Priority Queue (Paid Requests)
              </h3>
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {priorityQueue.length}
              </span>
            </div>

            {priorityQueue.length > 0 ? (
              <div className="space-y-2">
                {priorityQueue.map((track, index) => (
                  <div
                    key={track.videoId || `priority-${index}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-sm font-mono text-blue-600 font-semibold w-8 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-blue-900 truncate">
                        {cleanTitle(track.title)}
                      </div>
                      <div className="text-xs text-blue-700 flex items-center gap-2">
                        <span className="truncate">{track.artist}</span>
                        {track.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(track.duration)}</span>
                          </>
                        )}
                        {track.isPaid && track.paidAmount && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {track.paidAmount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {track.requestedAt && (
                      <div className="text-xs text-blue-500 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(track.requestedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-lg">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No paid requests in queue</p>
                <p className="text-xs text-slate-500 mt-1">
                  User requests will appear here
                </p>
              </div>
            )}
          </div>

          {/* Main Playlist Queue Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <List className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">
                Main Playlist Queue
              </h3>
              <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {mainQueue.length}
              </span>
            </div>

            {mainQueue.length > 0 ? (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {mainQueue.map((track, index) => (
                  <div
                    key={track.videoId || `main-${index}`}
                    className="flex items-center gap-3 p-2 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-mono text-slate-500 w-8 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {cleanTitle(track.title)}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="truncate">{track.artist}</span>
                        {track.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(track.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-lg">
                <List className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Main queue is empty</p>
                <p className="text-xs text-slate-500 mt-1">
                  Songs from playlists will appear here
                </p>
              </div>
            )}
          </div>

          {/* Empty State */}
          {!currentlyPlaying && priorityQueue.length === 0 && mainQueue.length === 0 && (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
              <Music className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-900 mb-1">
                Queue is empty
              </p>
              <p className="text-sm text-slate-600">
                Add songs from the playlist or wait for user requests
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
