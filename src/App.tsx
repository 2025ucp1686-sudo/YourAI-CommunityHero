import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';

// Pages
import LandingPage from '@/pages/Landing/LandingPage';
import LoginPage from '@/pages/Auth/LoginPage';
import SignupPage from '@/pages/Auth/SignupPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import ReportIssuePage from '@/pages/ReportIssue/ReportIssuePage';
import CommunityPage from '@/pages/Community/CommunityPage';
import TrackingPage from '@/pages/Tracking/TrackingPage';
import GeoMapPage from '@/pages/GeoMap/GeoMapPage';
import AuthorityPage from '@/pages/Authority/AuthorityPage';
import ImpactPage from '@/pages/Impact/ImpactPage';
import InsightsPage from '@/pages/Insights/InsightsPage';
import LeaderboardPage from '@/pages/Leaderboard/LeaderboardPage';
import NotificationsPage from '@/pages/Notifications/NotificationsPage';

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-10 h-10 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access even without auth for demo mode
  // In production, uncomment the next line:
  // if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// ─── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <div className="relative">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected (demo-accessible) */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportIssuePage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/tracking/:id" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
        <Route path="/tracking" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><GeoMapPage /></ProtectedRoute>} />
        <Route path="/authority" element={<ProtectedRoute><AuthorityPage /></ProtectedRoute>} />
        <Route path="/impact" element={<ProtectedRoute><ImpactPage /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(6, 13, 26, 0.95)',
              color: '#fff',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,212,255,0.05)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}
