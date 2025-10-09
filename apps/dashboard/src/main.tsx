import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppwriteProvider, useAppwrite } from '@appwrite/AppwriteContext';
import './index.css';

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
  const userId = window.location.pathname.split('/')[1];

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Welcome, {session.user.email}</h1>
        <p className="text-gray-400 mb-4">User ID: {userId}</p>
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
          <p className="text-gray-400">Dashboard implementation coming soon...</p>
        </div>
      </div>
    </div>
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
