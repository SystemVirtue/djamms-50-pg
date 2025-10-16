/**
 * System Settings Tab
 * 
 * Combines various admin settings panels:
 * - Playlist Manager
 * - Venue settings
 * - API key management (future)
 */

import { useAppwrite } from '@appwrite/AppwriteContext';
import { PlaylistManager } from './PlaylistManager';
import { Settings } from 'lucide-react';

interface SystemSettingsProps {
  venueId: string;
  databaseId: string;
}

export function SystemSettings({ venueId }: SystemSettingsProps) {
  const { session } = useAppwrite();

  if (!session) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Please log in to access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
      </div>

      {/* Playlist Manager Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <PlaylistManager
          venueId={venueId}
          ownerId={session.user.userId}
        />
      </div>

      {/* Future: API Key Management */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">API Configuration</h2>
        <p className="text-gray-400 text-sm">
          API key management coming soon...
        </p>
      </div>

      {/* Future: Venue Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Venue Settings</h2>
        <p className="text-gray-400 text-sm">
          Venue configuration options coming soon...
        </p>
      </div>
    </div>
  );
}
