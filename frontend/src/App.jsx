import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ─── PUBLIC PAGES ───
import LandingPage from './pages/LandingPage'; // አዲስ የተጨመረ
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// ─── MEMBER PAGES (Folder: src/pages/member/) ───
import MemberDashboard from './pages/member/MemberDashboard';
import MemberReports from './pages/member/Reports';
import MemberProfile from './pages/member/Profile';


// ─── ORGANIZER PAGES ───
import OrganizerDashboard from './pages/OrganizerDashboard';
import MyGroups from './pages/MyGroups';
import OrganizerPayouts from './pages/OrganizerPayouts';
import OrganizerReports from './pages/OrganizerReports';

// ─── COMMON PAGES ───
import LiveDraw from './pages/LiveDraw';

// ─── ADMIN PAGES ───
import AdminDashboard from './pages/AdminDashboard';
import AdminManagePlans from './pages/AdminManagePlans';
import AdminSystemUsers from './pages/AdminSystemUsers';
import AdminGlobalSettings from './pages/AdminGlobalSettings';
import AdminKYC from './pages/AdminKYC';


// Protected Route Component (የደህንነት ጠባቂ)
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" />; 
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" />; 
  }

  return children;
};

function App() {
  return (
  
    <Router>
      <Routes>
        {/* ─── PUBLIC ROUTES ─── */}
        <Route path="/" element={<LandingPage />} /> {/* አሁን መነሻ ገጹ Landing Page ነው */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ─── MEMBER PROTECTED ROUTES ─── */}
        <Route path="/member-dashboard" element={
          <ProtectedRoute allowedRole="MEMBER">
            <MemberDashboard />
          </ProtectedRoute>
        } />

        <Route path="/payment-history" element={
          <ProtectedRoute allowedRole="MEMBER">
            <MemberReports /> 
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <MemberProfile /> 
          </ProtectedRoute>
        } />

        <Route path="/member/draw/:groupId" element={
          <ProtectedRoute allowedRole="MEMBER">
            <LiveDraw />
          </ProtectedRoute>
        } />

        {/* ─── ORGANIZER PROTECTED ROUTES ─── */}
        <Route path="/organizer-dashboard" element={
          <ProtectedRoute allowedRole="ORGANIZER">
            <OrganizerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/organizer/groups" element={
          <ProtectedRoute allowedRole="ORGANIZER">
            <MyGroups />
          </ProtectedRoute>
        } />

        <Route path="/organizer/draw/:groupId" element={
          <ProtectedRoute allowedRole="ORGANIZER">
            <LiveDraw />
          </ProtectedRoute>
        } />

        <Route path="/organizer/payouts" element={
          <ProtectedRoute allowedRole="ORGANIZER">
            <OrganizerPayouts />
          </ProtectedRoute>
        } />

        <Route path="/organizer/reports" element={
          <ProtectedRoute allowedRole="ORGANIZER">
            <OrganizerReports />
          </ProtectedRoute>
        } />

        {/* Placeholder for Approvals - currently leads to Dashboard */}
        <Route path="/organizer/approvals" element={
          <ProtectedRoute allowedRole="ORGANIZER">
            <OrganizerDashboard />
          </ProtectedRoute>
        } />

        {/* ─── ADMIN PROTECTED ROUTES ─── */}
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

        {/* 404 Fallback - Redirect unknown links to landing page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router >
  
  );
}

export default App;