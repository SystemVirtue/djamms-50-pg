import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { AdminDashboard } from './components/AdminDashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/admin/:venueId" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
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
    window.location.href = '/auth/login';
    return null;
  }

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
