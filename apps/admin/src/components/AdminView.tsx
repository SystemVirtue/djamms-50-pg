import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlayerControls } from './PlayerControls';
import { SystemSettings } from './SystemSettings';
import { QueueManagement } from './QueueManagement';
import { RequestHistoryPanel } from './RequestHistoryPanel';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Monitor, Settings, List, History, BarChart3 } from 'lucide-react';

type Tab = 'controls' | 'queue' | 'settings' | 'history' | 'analytics';

export function AdminView() {
  const { venueId } = useParams<{ venueId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('controls');

  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68e57de9003234a84cae';

  if (!venueId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Venue</h1>
          <p className="text-gray-400">No venue ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DJAMMS Admin</h1>
              <p className="text-sm text-gray-400">Venue: {venueId}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'controls'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Monitor size={20} />
              Player Controls
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'queue'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <List size={20} />
              Queue Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'settings'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Settings size={20} />
              System Settings
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'history'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <History size={20} />
              Request History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={20} />
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'controls' && (
          <PlayerControls venueId={venueId} databaseId={databaseId} />
        )}
        {activeTab === 'queue' && (
          <QueueManagement venueId={venueId} databaseId={databaseId} />
        )}
        {activeTab === 'settings' && (
          <SystemSettings venueId={venueId} databaseId={databaseId} />
        )}
        {activeTab === 'history' && (
          <RequestHistoryPanel venueId={venueId} databaseId={databaseId} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard venueId={venueId} databaseId={databaseId} />
        )}
      </main>
    </div>
  );
}
