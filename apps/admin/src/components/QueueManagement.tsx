/**
 * Queue Management Tab
 * 
 * Integrates QueueDisplayPanel and AdminQueueControls
 * into the admin interface with proper layout
 */

import { useAppwrite } from '@appwrite/AppwriteContext';
import { QueueDisplayPanel } from './QueueDisplayPanel';
import { AdminQueueControls } from './AdminQueueControls';

interface QueueManagementProps {
  venueId: string;
  databaseId: string;
}

export function QueueManagement({ venueId }: QueueManagementProps) {
  const { client } = useAppwrite();

  if (!client) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Initializing AppWrite client...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Queue Display */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <QueueDisplayPanel
          venueId={venueId}
          client={client}
          className="h-full"
        />
      </div>

      {/* Right Column - Queue Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <AdminQueueControls
          venueId={venueId}
          client={client}
          className="h-full"
        />
      </div>
    </div>
  );
}
