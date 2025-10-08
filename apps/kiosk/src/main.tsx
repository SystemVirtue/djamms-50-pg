import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppwriteProvider } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { KioskView } from './components/KioskView';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/kiosk/:venueId" element={<KioskView />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">DJAMMS Kiosk</h1>
        <p className="text-gray-400">Enter a venue ID in the URL: /kiosk/[venueId]</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
