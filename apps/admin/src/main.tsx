import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { AdminView } from './components/AdminView';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/admin/:venueId" element={<ProtectedRoute><AdminView /></ProtectedRoute>} />
          <Route path="/" element={<RedirectToAuth />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
  );
}

function RedirectToAuth() {
  React.useEffect(() => {
    window.location.href = import.meta.env.PROD 
      ? 'https://auth.djamms.app' 
      : 'http://localhost:3002';
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-xl">Redirecting to login...</div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAppwrite();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    window.location.href = import.meta.env.PROD 
      ? 'https://auth.djamms.app' 
      : 'http://localhost:3002';
    return null;
  }

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
