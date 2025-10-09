import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppwriteProvider } from '@appwrite/AppwriteContext';
import { Toaster } from 'sonner';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppwriteProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<AuthCallback />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </AppwriteProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
