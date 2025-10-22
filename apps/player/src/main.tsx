import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { PlayerView } from './components/PlayerView';
import { Login } from './components/auth/Login';
import { AuthCallback } from './components/auth/AuthCallback';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppwriteProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/player/:venueId" element={<ProtectedPlayerRoute />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppwriteProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ProtectedPlayerRoute() {
  const { isLoading } = useAppwrite();
  const venueId = window.location.pathname.split('/')[2];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Player works without authentication for public viewing
  // Session is optional and only used for admin features
  return <PlayerView venueId={venueId} />;
}

function NotFound() {
  // Simple landing page at root
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">🎵 DJAMMS</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="/auth/login" className="text-gray-300 hover:text-white transition">
                Login
              </a>
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
            href="/player/venue-001"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition"
          >
            Try Demo Player
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">Master Player System</h3>
            <p className="text-gray-400">
              Single active player per venue with automatic failover
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
