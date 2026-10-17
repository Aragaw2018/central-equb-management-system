import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axiosInstance from './api/axiosInstance';

// ─── PUBLIC PAGES ───────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MaintenancePage from './pages/MaintenancePage';

// ─── MEMBER PAGES ────────────────────────────────────────────────────────────
import MemberDashboard from './pages/member/MemberDashboard';
import MemberReports from './pages/member/Reports';
import MemberProfile from './pages/member/Profile';

// ─── ORGANIZER PAGES ─────────────────────────────────────────────────────────
import OrganizerDashboard from './pages/OrganizerDashboard';
import MyGroups from './pages/MyGroups';
import OrganizerPayouts from './pages/OrganizerPayouts';
import OrganizerReports from './pages/OrganizerReports';

// ─── COMMON PAGES ────────────────────────────────────────────────────────────
import LiveDraw from './pages/LiveDraw';
import PaymentCallback from './pages/PaymentCallback';

// ─── ADMIN PAGES ─────────────────────────────────────────────────────────────
import AdminDashboard from './pages/AdminDashboard';
import AdminManagePlans from './pages/AdminManagePlans';
import AdminSystemUsers from './pages/AdminSystemUsers';
import AdminGlobalSettings from './pages/AdminGlobalSettings';
import AdminKYC from './pages/AdminKYC';

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — supports single role OR array of allowed roles
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole) {
    const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowed.includes(user.role)) return <Navigate to="/login" replace />;
  }

  return children;
};

// ─────────────────────────────────────────────────────────────────────────────
// MaintenanceGuard — client-side companion to the backend kill-switch.
// Polls GET /admin/settings once on mount; redirects non-admins to /maintenance
// if maintenance_mode === 'true'.  The 503 response interceptor in axiosInstance
// also handles mid-session triggers automatically.
// ─────────────────────────────────────────────────────────────────────────────
function MaintenanceGuard({ children }) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();

  useEffect(() => {
    // Admins are never blocked — skip the check entirely
    if (user?.role === 'ADMIN') { setReady(true); return; }

    axiosInstance.get('/admin/settings')
      .then(res => {
        if (res.data?.maintenance_mode === 'true') setBlocked(true);
      })
      .catch(err => {
        // 503 is already handled by the axiosInstance interceptor
        // (which does window.location.href = '/maintenance')
        // For any other error, fail-open so the app still loads.
      })
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null; // prevent flash
  if (blocked) return <MaintenancePage />;
  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public routes (always accessible) ─────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* ── Payment callback (Chapa redirect) ─────────────────── */}
        <Route path="/payment-callback" element={<PaymentCallback />} />

        {/* ── Member routes ──────────────────────────────────────── */}
        <Route path="/member-dashboard" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole={['MEMBER', 'ORGANIZER']}>
              <MemberDashboard />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/payment-history" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole={['MEMBER', 'ORGANIZER']}>
              <MemberReports />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/profile" element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <MemberProfile />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/member/draw/:groupId" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole={['MEMBER', 'ORGANIZER']}>
              <LiveDraw />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        {/* ── Organizer routes ───────────────────────────────────── */}
        <Route path="/organizer-dashboard" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole="ORGANIZER">
              <OrganizerDashboard />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/organizer/groups" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole="ORGANIZER">
              <MyGroups />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/organizer/draw/:groupId" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole="ORGANIZER">
              <LiveDraw />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/organizer/payouts" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole="ORGANIZER">
              <OrganizerPayouts />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/organizer/reports" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole="ORGANIZER">
              <OrganizerReports />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        <Route path="/organizer/approvals" element={
          <MaintenanceGuard>
            <ProtectedRoute allowedRole="ORGANIZER">
              <OrganizerDashboard />
            </ProtectedRoute>
          </MaintenanceGuard>
        } />

        {/* ── Admin routes (MaintenanceGuard not needed — always pass) */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/plans" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminManagePlans />
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminSystemUsers />
          </ProtectedRoute>
        } />

        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminGlobalSettings />
          </ProtectedRoute>
        } />

        <Route path="/admin/kyc" element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminKYC />
          </ProtectedRoute>
        } />

        {/* ── 404 fallback ───────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
