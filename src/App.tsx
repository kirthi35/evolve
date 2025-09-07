import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { checkAuthStatus } from './store/userSlice';

// Pages
import AuthenticationPage from './pages/AuthenticationPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CompletionPage from './pages/CompletionPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminUploadPage from './pages/AdminUploadPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminAddContentPage from './pages/AdminAddContentPage';
import ShortsPage from './pages/ShortsPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  requireAdmin = false
}) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireOnboarding && isAuthenticated && user.airtableRecord && !user.airtableRecord.fields.OnboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuthStatus()).finally(() => setIsLoading(false));
  }, [dispatch]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                user.airtableRecord?.fields.OnboardingCompleted ? (
                  user.isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/onboarding" replace />
                )
              ) : (
                <AuthenticationPage />
              )
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute requireAuth={true}>
                {user.airtableRecord?.fields.OnboardingCompleted ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <OnboardingPage />
                )}
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/complete" 
            element={
              <ProtectedRoute requireAuth={true}>
                <CompletionPage />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/shorts"
            element={
              <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                <ShortsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="content/new" element={<AdminAddContentPage />} />
            <Route path="users" element={<AdminUserManagementPage />} />
            <Route path="upload" element={<AdminUploadPage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;