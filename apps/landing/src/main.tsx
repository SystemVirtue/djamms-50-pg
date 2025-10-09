import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  // Use production auth URL or fallback to localhost for development
  const authUrl = import.meta.env.PROD 
    ? 'https://auth.djamms.app' 
    : 'http://localhost:3002';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">DJAMMS</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href={authUrl} className="hover:text-blue-400 transition">Login</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">YouTube-Based Music Player</h2>
          <p className="text-xl text-gray-400 mb-8">
            Professional music queue management for bars and venues
          </p>
          <a
            href={authUrl}
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition"
          >
            Log in to DJAMMS
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">Master Player System</h3>
            <p className="text-gray-400">
              Single active player per venue with automatic failover and heartbeat monitoring
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Sync</h3>
            <p className="text-gray-400">
              Live queue updates across all devices using AppWrite Realtime API
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Paid Requests</h3>
            <p className="text-gray-400">
              Priority queue for paid song requests with Stripe integration
            </p>
          </div>
        </div>

        <div className="text-center text-gray-400">
          <p>Built with React, TypeScript, Vite, and AppWrite</p>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
