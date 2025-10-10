import { useParams } from 'react-router-dom';

export function AdminView() {
  const { venueId } = useParams<{ venueId: string }>();
  
  // Placeholder for now - full AdminDashboard implementation requires:
  // - AppWrite context and hooks
  // - Real-time subscriptions
  // - Queue management logic
  
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
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-gray-400">No track playing</p>
            <div className="mt-4">
              <div className="text-3xl font-mono text-gray-500">0:00</div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
          </div>
        </div>

        {/* Priority Queue */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Priority Queue (0)</h2>
          <div className="text-center py-4">
            <p className="text-gray-400">No priority tracks</p>
          </div>
        </div>

        {/* Main Queue */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Main Queue (0)</h2>
          <div className="text-center py-4">
            <p className="text-gray-400">Queue is empty</p>
          </div>
        </div>

        {/* Implementation Note */}
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            <strong>⚠️ Full Implementation Available:</strong> Complete admin dashboard code exists in{' '}
            <code className="bg-black/30 px-2 py-1 rounded">apps/admin/src/components/AdminDashboard.tsx</code>
          </p>
          <p className="text-yellow-200/80 text-xs mt-2">
            Includes: Real-time queue monitoring, now playing with countdown, priority queue with ⭐, skip controls, AppWrite subscriptions
          </p>
        </div>
      </div>
    </div>
  );
}
