import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { PlayerView } from './components/PlayerView';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/player/:venueId" element={<ProtectedPlayerRoute />} />
          <Route path="/" element={<RedirectToLanding />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
  );
}

function ProtectedPlayerRoute() {
  const { session, isLoading } = useAppwrite();
  const venueId = window.location.pathname.split('/')[2];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    window.location.href = import.meta.env.PROD 
      ? 'https://djamms.app' 
      : 'http://localhost:3000';
    return null;
  }

  return <PlayerView venueId={venueId} />;
}

function RedirectToLanding() {
  React.useEffect(() => {
    window.location.href = import.meta.env.PROD 
      ? 'https://djamms.app' 
      : 'http://localhost:3000';
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-xl">Redirecting to landing page...</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
