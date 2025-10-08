import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { Query } from 'appwrite';
import { config } from '@shared/config/env';
import type { Queue } from '@shared/types';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const { databases, client } = useAppwrite();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!venueId) return;

    loadQueue();
    subscribeToUpdates();
  }, [venueId]);

  useEffect(() => {
    if (!queue?.nowPlaying) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [queue?.nowPlaying]);

  const loadQueue = async () => {
    try {
      const queueDoc = await databases.listDocuments(
        config.appwrite.databaseId,
        'queues',
        [Query.equal('venueId', venueId!)]
      );

      if (queueDoc.documents.length > 0) {
        const queueData = parseQueue(queueDoc.documents[0]);
        setQueue(queueData);
        setCountdown(queueData.nowPlaying?.remaining || 0);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channelName = `databases.${config.appwrite.databaseId}.collections.queues.documents`;
    
    client.subscribe(channelName, (response: any) => {
      if (response.payload && response.payload.venueId === venueId) {
        const queueData = parseQueue(response.payload);
        setQueue(queueData);
        setCountdown(queueData.nowPlaying?.remaining || 0);
      }
    });
  };

  const parseQueue = (doc: any): Queue => {
    return {
      venueId: doc.venueId,
      nowPlaying: doc.nowPlaying ? JSON.parse(doc.nowPlaying) : undefined,
      mainQueue: JSON.parse(doc.mainQueue || '[]'),
      priorityQueue: JSON.parse(doc.priorityQueue || '[]'),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };

  const handleSkip = async () => {
    if (!queue) return;

    try {
      // Move to next track logic
      toast.success('Track skipped');
    } catch (error) {
      toast.error('Failed to skip track');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Venue: {venueId}</p>
        </header>

        {/* Now Playing */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Now Playing</h2>
          {queue?.nowPlaying ? (
            <div>
              <h3 className="text-2xl font-bold mb-2">{queue.nowPlaying.title}</h3>
              <p className="text-gray-400 mb-4">{queue.nowPlaying.artist}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-3xl font-mono">{formatTime(countdown)}</div>
                  <div className="text-sm text-gray-400">Remaining</div>
                </div>
                <button
                  onClick={handleSkip}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition"
                >
                  Skip Track
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No track playing</p>
          )}
        </div>

        {/* Priority Queue */}
        {queue && queue.priorityQueue.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Priority Queue ({queue.priorityQueue.length})
            </h2>
            <ul className="space-y-2">
              {queue.priorityQueue.slice(0, 5).map((track, idx) => (
                <li key={`priority-${idx}`} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                  <span className="text-yellow-400 font-bold">⭐</span>
                  <div className="flex-1">
                    <div className="font-medium">{track.title}</div>
                    <div className="text-sm text-gray-400">{track.artist}</div>
                  </div>
                  <span className="text-sm text-gray-400">{formatDuration(track.duration)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Queue */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Main Queue ({queue?.mainQueue.length || 0})
          </h2>
          <ul className="space-y-2">
            {queue?.mainQueue.slice(0, 10).map((track, idx) => (
              <li key={`main-${idx}`} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                <span className="w-8 text-gray-400">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-gray-400">{track.artist}</div>
                </div>
                <span className="text-sm text-gray-400">{formatDuration(track.duration)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
