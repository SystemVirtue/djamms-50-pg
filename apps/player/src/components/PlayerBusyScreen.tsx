import { useState } from 'react';

interface PlayerBusyScreenProps {
  venueId: string;
  error?: string;
  currentMaster?: { deviceId: string; lastHeartbeat: number };
  onRetry: () => void;
  onOpenViewer: () => void;
  onOpenAdmin: () => void;
}

export const PlayerBusyScreen: React.FC<PlayerBusyScreenProps> = ({
  venueId,
  error,
  currentMaster,
  onRetry,
  onOpenViewer,
  onOpenAdmin,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const getMessage = () => {
    if (error === 'MASTER_ACTIVE') return 'The media player is currently active on another device.';
    if (error === 'NETWORK_ERROR') return 'Network connection failed. Please check your connection and try again.';
    if (error) return `Connection error: ${error}`;
    return 'The media player is currently active on another device.';
  };

  const getLastSeen = () => {
    if (!currentMaster?.lastHeartbeat) return null;
    const lastSeen = new Date(currentMaster.lastHeartbeat);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
    return diffMinutes < 2 ? 'Active now' : `Last seen ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Media Player Busy</h1>
          <p className="text-gray-300 mb-4">{getMessage()}</p>
          {currentMaster && (
            <div className="text-sm text-gray-400 mb-4">{getLastSeen()}</div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isRetrying ? 'Connecting...' : '🔄 Retry Connection'}
          </button>

          <button
            onClick={onOpenViewer}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            👁️ Open Viewer Mode
          </button>

          <button
            onClick={onOpenAdmin}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            ⚙️ Open Admin Console
          </button>
        </div>

        <div className="text-sm text-gray-400">
          <p>
            Venue: <strong>{venueId}</strong>
          </p>
          <p className="mt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenAdmin();
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Manage authorized devices in Admin Console
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
