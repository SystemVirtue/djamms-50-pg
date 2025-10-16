import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { PlayerView } from './components/PlayerView';
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
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
        <p className="text-gray-400 mb-4">This page does not exist.</p>
        <p className="text-gray-400">Looking for a venue player? Try /player/venue-001</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
