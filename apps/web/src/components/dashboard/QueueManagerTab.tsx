import { ListMusic } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Client, Databases, Query } from 'appwrite';

interface QueueTrack {
  videoId: string;
  title: string;
  artist: string;
  isPaid?: boolean;
}

interface QueueManagerTabProps {
  venueId: string;
}

export function QueueManagerTab({ venueId }: QueueManagerTabProps) {
  const [mainQueue, setMainQueue] = useState<QueueTrack[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<QueueTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    // Set up real-time subscription
    const interval = setInterval(loadQueue, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [venueId]);

  const loadQueue = async () => {
    try {
      // Try loading from AppWrite first
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
      
      const databases = new Databases(client);
      
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'queues',
        [Query.equal('venueId', venueId), Query.limit(50)]
      );

      if (response.documents.length > 0) {
        const queueDoc = response.documents[0];
        setMainQueue(queueDoc.mainQueue || []);
        setPriorityQueue(queueDoc.priorityQueue || []);
      }
    } catch (error) {
      console.error('Failed to load queue from AppWrite:', error);
      // Fallback to localStorage
      const localQueue = localStorage.getItem(`djammsQueue_${venueId}`);
      if (localQueue) {
        try {
          const parsed = JSON.parse(localQueue);
          setMainQueue(parsed.mainQueue || []);
          setPriorityQueue(parsed.priorityQueue || []);
        } catch (e) {
          console.error('Failed to parse local queue:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const removeTrack = (queue: 'main' | 'priority', index: number) => {
    if (queue === 'main') {
      const newQueue = mainQueue.filter((_, i) => i !== index);
      setMainQueue(newQueue);
      saveQueue(newQueue, priorityQueue);
    } else {
      const newQueue = priorityQueue.filter((_, i) => i !== index);
      setPriorityQueue(newQueue);
      saveQueue(mainQueue, newQueue);
    }
  };

  const saveQueue = async (main: QueueTrack[], priority: QueueTrack[]) => {
    // Save to localStorage
    localStorage.setItem(`djammsQueue_${venueId}`, JSON.stringify({
      venueId,
      mainQueue: main,
      priorityQueue: priority,
      lastUpdated: new Date().toISOString()
    }));

    // TODO: Save to AppWrite
  };

  if (loading) {
    return (
      <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white py-12">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ListMusic className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-white">Queue Manager</h2>
        </div>

        {/* Priority Queue */}
        {priorityQueue.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-yellow-400">⭐</span>
              Priority Queue (Paid Requests)
            </h3>
            <div className="glass-morphism rounded-xl p-6 space-y-3">
              {priorityQueue.map((track, index) => (
                <div
                  key={`priority-${index}`}
                  className="flex items-center gap-4 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{track.title}</div>
                    <div className="text-gray-300 text-sm truncate">{track.artist}</div>
                  </div>
                  <button
                    onClick={() => removeTrack('priority', index)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Queue */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Main Queue</h3>
          <div className="glass-morphism rounded-xl p-6">
            {mainQueue.length > 0 ? (
              <div className="space-y-3">
                {mainQueue.map((track, index) => (
                  <div
                    key={`main-${index}`}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center text-blue-300 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{track.title}</div>
                      <div className="text-gray-300 text-sm truncate">{track.artist}</div>
                    </div>
                    <button
                      onClick={() => removeTrack('main', index)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListMusic className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Queue is empty</p>
                <p className="text-gray-500 text-sm mt-2">Tracks will appear here as they are added</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
