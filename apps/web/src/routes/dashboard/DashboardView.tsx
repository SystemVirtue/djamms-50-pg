import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  ListMusic,
  Settings,
  LogOut,
  Home,
  X,
  CheckCircle,
  Users,
  Clock,
  Wifi,
  WifiOff,
  Monitor,
  Music
} from 'lucide-react';

// Types
interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  gradient: string;
  endpoint?: string;
}

type TabId = 'dashboard' | 'queue' | 'playlists' | 'admin' | 'activity';

interface UserData {
  userId: string;
  username: string;
  role: 'admin' | 'staff' | 'user';
  avatarUrl?: string;
}

export function DashboardView() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [connectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [user, setUser] = useState<UserData | null>(null);

  // Load user data from localStorage or AppWrite
  useEffect(() => {
    const loadUserData = () => {
      // Try to load from localStorage first
      const storedUser = localStorage.getItem('djamms_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser({
            userId: userId || userData.userId || 'unknown',
            username: userData.username || userData.name || 'User',
            role: userData.role || 'user',
            avatarUrl: userData.avatarUrl
          });
        } catch (e) {
          console.error('Error parsing user data:', e);
          setUser({
            userId: userId || 'unknown',
            username: 'User',
            role: 'user'
          });
        }
      } else {
        // Fallback to basic user data
        setUser({
          userId: userId || 'unknown',
          username: 'User',
          role: 'user'
        });
      }
    };

    loadUserData();
  }, [userId]);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('djamms_user');
    localStorage.removeItem('djamms_session');
    navigate('/auth');
  }, [navigate]);

  // Dashboard cards configuration
  const dashboardCards: DashboardCard[] = [
    {
      id: 'player',
      title: 'Video Player',
      description: 'Watch and control YouTube playback',
      icon: '▶️',
      path: '/player/venue-001',
      gradient: 'from-red-600 to-red-800',
      endpoint: 'player'
    },
    {
      id: 'admin',
      title: 'Admin Console',
      description: 'Manage queue and skip tracks',
      icon: '⚙️',
      path: '/admin/venue-001',
      gradient: 'from-gray-600 to-gray-800',
      endpoint: 'admin'
    },
    {
      id: 'kiosk',
      title: 'Jukebox Kiosk',
      description: 'Public song request interface',
      icon: '🖥️',
      path: '/kiosk/venue-001',
      gradient: 'from-green-600 to-green-800',
      endpoint: 'kiosk'
    },
    {
      id: 'queue',
      title: 'Queue Manager',
      description: 'View and manage current queue',
      icon: '📝',
      path: '#',
      gradient: 'from-purple-600 to-purple-800'
    },
    {
      id: 'playlists',
      title: 'Playlist Library',
      description: 'Create and organize playlists',
      icon: '📚',
      path: '#',
      gradient: 'from-pink-600 to-pink-800'
    },
    {
      id: 'activity',
      title: 'Activity Logs',
      description: 'System monitoring and logs',
      icon: '📊',
      path: '#',
      gradient: 'from-yellow-600 to-yellow-800'
    }
  ];

  // Handle card click
  const handleCardClick = useCallback((card: DashboardCard) => {
    if (card.endpoint) {
      // Navigate to full endpoint (player, admin, kiosk)
      navigate(card.path);
    } else {
      // Open as tab in dashboard
      setActiveTab(card.id as TabId);
    }
  }, [navigate]);

  // Get status display
  const getStatusDisplay = () => {
    return connectionStatus === 'connected'
      ? { icon: Wifi, text: 'CONNECTED', class: 'bg-green-500/20 border-green-500/30 text-green-400' }
      : { icon: WifiOff, text: 'DISCONNECTED', class: 'bg-red-500/20 border-red-500/30 text-red-400' };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DJAMMS Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Welcome back, {user?.username || 'User'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusDisplay.class}`}>
            <statusDisplay.icon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">{statusDisplay.text}</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=7C3AED&color=fff`}
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
            />
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation (when not on dashboard) */}
      {activeTab !== 'dashboard' && (
        <div className="flex items-center justify-between px-6 py-3 bg-black/20 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'queue'
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">Queue Manager</span>
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'playlists'
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Playlists</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'admin'
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Back to Dashboard"
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
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' ? (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Your Digital Jukebox
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Choose an interface to start managing your music experience
                </p>
              </div>

              {/* User Status Banner */}
              {user && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${
                  user.role === 'admin'
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-blue-500/20 border border-blue-500/30'
                }`}>
                  {user.role === 'admin' ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <h3 className="text-green-400 font-semibold">Full Access Approved</h3>
                        <p className="text-green-300 text-sm">
                          Your account has full DJAMMS access. All features are available.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Users className="w-6 h-6 text-blue-400" />
                      <div>
                        <h3 className="text-blue-400 font-semibold">Standard User Access</h3>
                        <p className="text-blue-300 text-sm">
                          You have standard user access to DJAMMS features.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Dashboard Cards */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {dashboardCards.map((card) => (
                  <div key={card.id} className="group relative overflow-hidden">
                    <button
                      onClick={() => handleCardClick(card)}
                      className={`w-full p-8 bg-gradient-to-br ${card.gradient} rounded-2xl text-white text-left transform transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/20 cursor-pointer`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div
                          className="absolute inset-0 bg-white"
                          style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px)',
                            backgroundSize: '20px 20px'
                          }}
                        ></div>
                      </div>

                      {/* Card Content */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-4xl">{card.icon}</div>

                          {/* Badge */}
                          {card.endpoint ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 border border-white/30 rounded-full">
                              <Monitor className="w-3 h-3" />
                              <span className="text-xs font-medium">FULL APP</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                              <span className="text-xs font-medium">TAB</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                        <p className="text-white/80 text-sm leading-relaxed">{card.description}</p>

                        {/* Action hint */}
                        <div className="mt-4 text-xs text-white/60">
                          {card.endpoint ? 'Click to open full interface' : 'Click to open as tab'}
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('playlists')}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors"
                  >
                    <h4 className="text-white font-medium mb-1">Create New Playlist</h4>
                    <p className="text-gray-400 text-sm">Start building your music collection</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('playlists')}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors"
                  >
                    <h4 className="text-white font-medium mb-1">Import Playlist</h4>
                    <p className="text-gray-400 text-sm">Import from YouTube or other sources</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('admin')}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors"
                  >
                    <h4 className="text-white font-medium mb-1">Backup Settings</h4>
                    <p className="text-gray-400 text-sm">Save your configuration</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Tab Content
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              {activeTab === 'queue' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <ListMusic className="w-8 h-8 text-purple-400" />
                    <h2 className="text-3xl font-bold text-white">Queue Manager</h2>
                  </div>
                  <p className="text-gray-300 mb-4">
                    View and manage your current playback queue. This feature will allow you to:
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    <li>View upcoming tracks</li>
                    <li>Reorder queue items</li>
                    <li>Remove tracks from queue</li>
                    <li>Add tracks from your library</li>
                  </ul>
                  <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <Clock className="w-4 h-4 inline mr-2" />
                      <strong>Coming Soon:</strong> Full queue management interface with drag-and-drop support
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'playlists' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <Music className="w-8 h-8 text-pink-400" />
                    <h2 className="text-3xl font-bold text-white">Playlist Library</h2>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Create, edit, and organize your playlists. This feature will include:
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    <li>Create custom playlists</li>
                    <li>Import from YouTube</li>
                    <li>Share playlists with other venues</li>
                    <li>Playlist statistics and analytics</li>
                  </ul>
                  <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <Clock className="w-4 h-4 inline mr-2" />
                      <strong>Coming Soon:</strong> Advanced playlist management with YouTube integration
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-8 h-8 text-gray-400" />
                    <h2 className="text-3xl font-bold text-white">Admin Console</h2>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Configure player settings and preferences. Available settings:
                  </p>
                  <ul className="list-disc list-inside text-gray-400 space-y-2">
                    <li>Player configuration</li>
                    <li>Venue settings</li>
                    <li>User permissions</li>
                    <li>System preferences</li>
                  </ul>
                  <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <Clock className="w-4 h-4 inline mr-2" />
                      <strong>Coming Soon:</strong> Comprehensive admin controls and settings
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <h2 className="text-3xl font-bold text-white mb-6">Activity Logs</h2>
                  <p className="text-gray-300 mb-4">
                    Monitor system activity and track usage patterns.
                  </p>
                  <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <Clock className="w-4 h-4 inline mr-2" />
                      <strong>Coming Soon:</strong> Real-time activity monitoring and analytics
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer (only on dashboard) */}
      {activeTab === 'dashboard' && (
        <footer className="p-4 border-t border-white/10 text-center bg-black/20">
          <p className="text-gray-500 text-sm">DJAMMS v2.0 • Integrated Dashboard Interface</p>
        </footer>
      )}
    </div>
  );
}
