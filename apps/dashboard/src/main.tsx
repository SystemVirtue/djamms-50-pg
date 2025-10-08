import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppwriteProvider } from '@appwrite/AppwriteContext';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Routes>
          <Route path="/dashboard/:venueId" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">User Dashboard</h1>
        <p className="text-gray-400">Dashboard implementation coming soon...</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
