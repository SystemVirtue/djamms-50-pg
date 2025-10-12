import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import { 
  Home, Settings, ListMusic, Library, Play,
  Circle, Wifi, WifiOff, AlertTriangle, LogOut, 
  X, Clock, CheckCircle, Users, ChevronRight, ExternalLink
} from 'lucide-react';
import './index.css';

// Tab Components
const QueueManagerTab = () => (
  <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Queue Manager</h2>
      <div className="glass-morphism rounded-xl p-6">
        <p className="text-gray-300 mb-4">Manage the current song queue and playback order.</p>
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-2">Current Queue</h3>
            <p className="text-gray-400 text-sm">No songs in queue</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-2">Recently Played</h3>
            <p className="text-gray-400 text-sm">No recent tracks</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PlaylistLibraryTab = () => (
  <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Playlist Library</h2>
      <div className="glass-morphism rounded-xl p-6">
        <p className="text-gray-300 mb-4">Browse and manage your music playlists.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-music-purple to-purple-700 rounded-lg">
            <Library className="w-8 h-8 mb-2" />
            <h3 className="text-white font-semibold mb-1">My Playlists</h3>
            <p className="text-white/80 text-sm">0 playlists</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-music-pink to-pink-700 rounded-lg">
            <Play className="w-8 h-8 mb-2" />
            <h3 className="text-white font-semibold mb-1">Shared</h3>
            <p className="text-white/80 text-sm">0 playlists</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg">
            <ListMusic className="w-8 h-8 mb-2" />
            <h3 className="text-white font-semibold mb-1">Favorites</h3>
            <p className="text-white/80 text-sm">0 songs</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminConsoleTab = () => (
  <div className="h-full p-6 overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Admin Console</h2>
      <div className="glass-morphism rounded-xl p-6">
        <p className="text-gray-300 mb-4">System settings and administrative controls.</p>
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-2">System Status</h3>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-gray-300">All systems operational</span>
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-2">Player Settings</h3>
            <p className="text-gray-400 text-sm">Configure player behavior and preferences</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-2">User Management</h3>
            <p className="text-gray-400 text-sm">Manage user accounts and permissions</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

type TabId = 'dashboard' | 'queuemanager' | 'playlistlibrary' | 'adminconsole';

interface Tab {
  id: TabId;
  title: string;
  icon: typeof Home;
  component?: React.ComponentType;
  gradient?: string;
}

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: typeof Home;
  gradient: string;
  action: () => void;
  path?: string;
}

function DashboardView({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [openWindows, setOpenWindows] = useState<any[]>([]);
  const [playerStatus] = useState<{
    status: 'playing' | 'paused' | 'idle' | 'stopped';
    connectionStatus: 'connected' | 'disconnected';
  }>({
    status: 'idle',
    connectionStatus: 'disconnected'
  });

  // Tab configuration
  const tabs: Tab[] = [
    { 
      id: 'dashboard', 
      title: 'Dashboard', 
      icon: Home 
    },
    { 
      id: 'queuemanager', 
      title: 'Queue Manager', 
      icon: ListMusic,
      component: QueueManagerTab,
      gradient: 'from-music-purple to-purple-700'
    },
    { 
      id: 'playlistlibrary', 
      title: 'Playlist Library', 
      icon: Library,
      component: PlaylistLibraryTab,
      gradient: 'from-music-pink to-pink-700'
    },
    { 
      id: 'adminconsole', 
      title: 'Admin Console', 
      icon: Settings,
      component: AdminConsoleTab,
      gradient: 'from-blue-500 to-blue-700'
    }
  ];

  // Dashboard cards configuration
  const dashboardCards: DashboardCard[] = [
    {
      id: 'videoplayer',
      title: 'Start Video Player',
      description: 'Open fullscreen YouTube video player window',
      icon: Play,
      gradient: 'from-youtube-red to-red-700',
      path: '/player',
      action: () => {
        window.open('/player', '_blank', 'width=1280,height=720');
      }
    },
    {
      id: 'queuemanager',
      title: 'Queue Manager',
      description: 'Manage the current song queue and playback order',
      icon: ListMusic,
      gradient: 'from-music-purple to-purple-700',
      action: () => setActiveTab('queuemanager')
    },
    {
      id: 'playlistlibrary',
      title: 'Playlist Library',
      description: 'Browse and manage your music playlists',
      icon: Library,
      gradient: 'from-music-pink to-pink-700',
      action: () => setActiveTab('playlistlibrary')
    },
    {
      id: 'adminconsole',
      title: 'Admin Console',
      description: 'System settings and administrative controls',
      icon: Settings,
      gradient: 'from-blue-500 to-blue-700',
      action: () => setActiveTab('adminconsole')
    }
  ];

  // Get status display based on player state
  const getStatusDisplay = () => {
    const { status, connectionStatus } = playerStatus;
    
    switch (status) {
      case 'playing':
        return { 
          icon: Circle, 
          text: 'CONNECTED, PLAYING', 
          className: 'text-green-500' 
        };
      case 'paused':
        return { 
          icon: Circle, 
          text: 'CONNECTED, PAUSED', 
          className: 'text-yellow-500' 
        };
      case 'idle':
        return { 
          icon: WifiOff, 
          text: 'READY', 
          className: 'text-gray-400' 
        };
      case 'stopped':
        return { 
          icon: AlertTriangle, 
          text: 'STOPPED', 
          className: 'text-orange-500' 
        };
      default:
        return { 
          icon: Wifi, 
          text: connectionStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED', 
          className: connectionStatus === 'connected' ? 'text-blue-500' : 'text-red-500' 
        };
    }
  };

  // Update open windows periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would check actual window instances
      setOpenWindows([]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Handle logout
  const handleLogout = () => {
    window.location.href = import.meta.env.PROD 
      ? 'https://auth.djamms.app/logout' 
      : 'http://localhost:3002/logout';
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-music-purple to-music-pink flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">DJAMMS</h1>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>

            {/* Status and User */}
            <div className="flex items-center gap-4">
              {/* Player Status */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
                <StatusIcon className={`w-4 h-4 ${statusDisplay.className}`} />
                <span className="text-sm font-medium">{statusDisplay.text}</span>
              </div>

              {/* User Menu */}
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 hidden sm:inline">
                    {user.email || user.name || 'User'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {(user.email || user.name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation (shown when not on dashboard) */}
      {activeTab !== 'dashboard' && (
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              {/* Current Tab Title */}
              <div className="flex items-center gap-3">
                {currentTab && (
                  <>
                    <currentTab.icon className="w-5 h-5 text-white" />
                    <span className="font-semibold">{currentTab.title}</span>
                  </>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close Tab"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' ? (
          <>
            {/* Dashboard Content */}
            <div className="h-full p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Your Digital Jukebox
                  </h2>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                    Choose an interface to start managing your music experience. Use tabs for integrated workflow or open separate windows for multi-screen setups.
                  </p>
                </div>

                {/* User Status Banner */}
                {user ? (
                  <div className="mb-8 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="text-green-400 font-semibold">Full Access Approved</h3>
                      <p className="text-green-300 text-sm">Your account has full DJAMMS access. All features are available.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-3">
                    <Clock className="w-6 h-6 text-yellow-400 animate-spin" />
                    <div>
                      <h3 className="text-yellow-400 font-semibold">Loading User Data</h3>
                      <p className="text-yellow-300 text-sm">Loading your user profile and permissions...</p>
                    </div>
                  </div>
                )}

                {/* Dashboard Cards Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {dashboardCards.map((card) => {
                    const CardIcon = card.icon;
                    const isWindowOpen = card.path && openWindows.some(w => w.endpoint === card.path);
                    const isAuthenticated = !!user;

                    return (
                      <div key={card.id} className="group relative overflow-hidden">
                        <button
                          onClick={isAuthenticated ? card.action : undefined}
                          disabled={!isAuthenticated}
                          className={`w-full p-8 bg-gradient-to-br ${card.gradient} rounded-2xl text-white text-left transform transition-all duration-300 ${
                            isAuthenticated 
                              ? 'hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/20 cursor-pointer' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {/* Background Pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <div 
                              className="absolute inset-0 bg-white" 
                              style={{ 
                                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px)', 
                                backgroundSize: '20px 20px' 
                              }}
                            />
                          </div>

                          {/* Disabled Overlay */}
                          {!isAuthenticated && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2 text-center">
                                <Users className="w-8 h-8 text-white/60" />
                                <span className="text-white/80 text-sm font-medium">Authentication Required</span>
                              </div>
                            </div>
                          )}

                          {/* Card Content */}
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-3 bg-white/20 rounded-xl w-fit">
                                <CardIcon className="w-8 h-8" />
                              </div>

                              {/* Status Indicator */}
                              {card.id === 'videoplayer' ? (
                                isWindowOpen && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 text-xs font-medium">OPEN</span>
                                  </div>
                                )
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                                  <span className="text-blue-400 text-xs font-medium">TAB</span>
                                </div>
                              )}
                            </div>

                            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                            <p className="text-white/80 text-sm leading-relaxed">{card.description}</p>

                            {/* Action Hint */}
                            <div className="mt-4 text-xs text-white/60">
                              {isAuthenticated ? (
                                card.id === 'videoplayer' ? (
                                  isWindowOpen ? 'Click to focus existing window' : 'Click to open new window'
                                ) : (
                                  'Click to open as tab'
                                )
                              ) : (
                                'Sign in to access this feature'
                              )}
                            </div>

                            {/* Hover Arrow */}
                            {isAuthenticated && (
                              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                {card.id === 'videoplayer' ? (
                                  <ExternalLink className="w-6 h-6" />
                                ) : (
                                  <ChevronRight className="w-6 h-6" />
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="glass-morphism rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setActiveTab('playlistlibrary')}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors"
                    >
                      <h4 className="text-white font-medium mb-1">Create New Playlist</h4>
                      <p className="text-gray-400 text-sm">Start building your music collection</p>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('playlistlibrary')}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors"
                    >
                      <h4 className="text-white font-medium mb-1">Import Playlist</h4>
                      <p className="text-gray-400 text-sm">Import from YouTube or other sources</p>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('adminconsole')}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors"
                    >
                      <h4 className="text-white font-medium mb-1">Backup Settings</h4>
                      <p className="text-gray-400 text-sm">Save your configuration</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer (only shown on dashboard) */}
            <footer className="p-4 border-t border-white/10 text-center">
              <p className="text-gray-500 text-sm">
                DJAMMS v2.0 • Integrated Tabbed Interface
              </p>
            </footer>
          </>
        ) : (
          /* Tab Content */
          <div className="h-full">
            {currentTab?.component && <currentTab.component />}
          </div>
        )}
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Routes>
          <Route path="/:userId" element={<ProtectedDashboard />} />
          <Route path="/" element={<RedirectToAuth />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
  );
}

function ProtectedDashboard() {
  const { session, isLoading } = useAppwrite();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <div className="text-xl">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    // Show authentication required message
    // The user should have been authenticated before reaching this app
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center" data-testid="auth-required">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-300 mb-6">
            You need to be logged in to access the dashboard.
          </p>
          <a 
            href={import.meta.env.PROD ? 'https://auth.djamms.app' : 'http://localhost:3002'}
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <DashboardView user={session.user} />;
}

function RedirectToAuth() {
  const authUrl = import.meta.env.PROD 
    ? 'https://auth.djamms.app' 
    : 'http://localhost:3002';
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <p className="text-gray-300 mb-6">
          Access the dashboard by logging in first.
        </p>
        <a 
          href={authUrl}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
