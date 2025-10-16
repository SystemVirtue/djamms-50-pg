import { Activity, Clock, User, Music } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Client, Databases, Query } from 'appwrite';

interface ActivityLog {
  $id: string;
  type: 'track_played' | 'track_skipped' | 'request_received' | 'queue_updated';
  message: string;
  user?: string;
  timestamp: string;
  metadata?: {
    trackTitle?: string;
    trackArtist?: string;
    videoId?: string;
  };
}

interface ActivityLogsTabProps {
  venueId: string;
}

export function ActivityLogsTab({ venueId }: ActivityLogsTabProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tracks' | 'requests' | 'queue'>('all');

  useEffect(() => {
    loadLogs();
    // Auto-refresh logs every 10 seconds
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, [venueId]);

  const loadLogs = async () => {
    try {
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
      
      const databases = new Databases(client);
      
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'activityLogs',
        [
          Query.equal('venueId', venueId),
          Query.orderDesc('timestamp'),
          Query.limit(100)
        ]
      );

      setLogs(response.documents as unknown as ActivityLog[]);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      // Generate some demo logs
      const demoLogs: ActivityLog[] = [
        {
          $id: '1',
          type: 'track_played',
          message: 'Started playing track',
          timestamp: new Date().toISOString(),
          metadata: {
            trackTitle: 'Example Song',
            trackArtist: 'Example Artist'
          }
        }
      ];
      setLogs(demoLogs);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'tracks') return log.type === 'track_played' || log.type === 'track_skipped';
    if (filter === 'requests') return log.type === 'request_received';
    if (filter === 'queue') return log.type === 'queue_updated';
    return true;
  });

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'track_played':
        return <Music className="w-5 h-5 text-green-400" />;
      case 'track_skipped':
        return <Music className="w-5 h-5 text-yellow-400" />;
      case 'request_received':
        return <User className="w-5 h-5 text-blue-400" />;
      case 'queue_updated':
        return <Activity className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLogColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'track_played':
        return 'border-l-green-400';
      case 'track_skipped':
        return 'border-l-yellow-400';
      case 'request_received':
        return 'border-l-blue-400';
      case 'queue_updated':
        return 'border-l-purple-400';
      default:
        return 'border-l-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white py-12">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading activity logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-bold text-white">Activity Logs</h2>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300 text-sm">Auto-refreshing every 10s</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('tracks')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'tracks'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Tracks
          </button>
          <button
            onClick={() => setFilter('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'requests'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setFilter('queue')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'queue'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Queue Updates
          </button>
        </div>

        {/* Activity Feed */}
        <div className="glass-morphism rounded-xl p-6">
          {filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.$id}
                  className={`flex items-start gap-4 p-4 bg-white/5 border-l-4 ${getLogColor(log.type)} rounded-r-lg hover:bg-white/10 transition`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-medium">{log.message}</p>
                        {log.metadata?.trackTitle && (
                          <p className="text-gray-300 text-sm mt-1">
                            {log.metadata.trackTitle} - {log.metadata.trackArtist}
                          </p>
                        )}
                        {log.user && (
                          <p className="text-gray-400 text-xs mt-1">by {log.user}</p>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs flex-shrink-0">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No activity yet</h3>
              <p className="text-gray-400">Activity logs will appear here as events occur</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
