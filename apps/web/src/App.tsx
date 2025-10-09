import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './routes/landing/LandingPage';
import { AuthLogin } from './routes/auth/Login';
import { AuthCallback } from './routes/auth/Callback';
import { PlayerView } from './routes/player/PlayerView';
import { AdminView } from './routes/admin/AdminView';
import { DashboardView } from './routes/dashboard/DashboardView';
import { KioskView } from './routes/kiosk/KioskView';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes - For now, no auth guard */}
        <Route path="/dashboard/:userId" element={<DashboardView />} />
        <Route path="/player/:venueId" element={<PlayerView />} />
        <Route path="/admin/:venueId" element={<AdminView />} />
        <Route path="/kiosk/:venueId" element={<KioskView />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
