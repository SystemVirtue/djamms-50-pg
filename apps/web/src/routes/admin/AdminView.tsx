import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Simplified types for web app
interface Track {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  isRequest?: boolean;
}

interface Queue {
  venueId: string;
  nowPlaying?: {
    videoId: string;
    title: string;
    artist: string;
    duration: number;
    startTime: number;
    remaining: number;
  };
  mainQueue: Track[];
  priorityQueue: Track[];
  createdAt: string;
  updatedAt: string;
}

export function AdminView() {
  const { venueId } = useParams<{ venueId: string }>();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!venueId) return;
    
    // Load queue from localStorage (simplified for web app)
    loadQueue();
  }, [venueId]);

  useEffect(() => {
    if (!queue?.nowPlaying) return;

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [queue?.nowPlaying]);

  const loadQueue = () => {
    try {
      const localQueue = localStorage.getItem(`djammsQueue_${venueId}`);
      if (localQueue) {
        const parsed = JSON.parse(localQueue);
        setQueue(parsed);
        setCountdown(parsed.nowPlaying?.remaining || 0);
      } else {
        // Initialize empty queue
        setQueue({
          venueId: venueId!,
          mainQueue: [],
          priorityQueue: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!queue) return;
    
    // Skip to next track (simplified)
    const nextTrack = queue.priorityQueue[0] || queue.mainQueue[0];
    if (nextTrack) {
      const updatedQueue = {
        ...queue,
        nowPlaying: {
          ...nextTrack,
          startTime: Date.now(),
          remaining: nextTrack.duration
        },
        priorityQueue: queue.priorityQueue[0] ? queue.priorityQueue.slice(1) : queue.priorityQueue,
        mainQueue: !queue.priorityQueue[0] ? queue.mainQueue.slice(1) : queue.mainQueue,
        updatedAt: new Date().toISOString()
      };
      
      setQueue(updatedQueue);
      setCountdown(nextTrack.duration);
      localStorage.setItem(`djammsQueue_${venueId}`, JSON.stringify(updatedQueue));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <h1 className="text-3xl font-bold mb-2">🎛️ Admin Dashboard</h1>
          <p className="text-gray-400">Venue: {venueId}</p>
        </header>

        {/* Now Playing Section */}
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
                  ⏭️ Skip Track
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-gray-400">No track playing</p>
              <div className="mt-4">
                <div className="text-3xl font-mono text-gray-500">0:00</div>
                <div className="text-sm text-gray-400">Remaining</div>
              </div>
            </div>
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
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Main Queue ({queue?.mainQueue.length || 0})
          </h2>
          {queue && queue.mainQueue.length > 0 ? (
            <ul className="space-y-2">
              {queue.mainQueue.slice(0, 10).map((track, idx) => (
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
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400">Queue is empty</p>
            </div>
          )}
        </div>

        {/* Queue Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{queue?.mainQueue.length || 0}</div>
            <div className="text-sm text-gray-400">Main Queue</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{queue?.priorityQueue.length || 0}</div>
            <div className="text-sm text-gray-400">Priority Queue</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {((queue?.mainQueue.length || 0) + (queue?.priorityQueue.length || 0))}
            </div>
            <div className="text-sm text-gray-400">Total Tracks</div>
          </div>
        </div>

        {/* Implementation Note */}
        <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>✅ Simplified Implementation</strong>
          </p>
          <p className="text-blue-200/80 text-xs mt-2">
            This is a simplified version using localStorage. Full implementation with real-time AppWrite
            subscriptions, database sync, and advanced queue management is available in{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded">apps/admin/</code>
          </p>
        </div>
      </div>
    </div>
  );
}
