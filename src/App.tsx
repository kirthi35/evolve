import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { checkAuthStatus, fetchAirtableUserData } from './store/userSlice';

// Pages
import AuthenticationPage from './pages/AuthenticationPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CompletionPage from './pages/CompletionPage';
import AppLayout from './components/AppLayout';
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

  console.log('ProtectedRoute user:', user);
  console.log('ProtectedRoute isAuthenticated:', isAuthenticated);

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
  const { user, isAuthenticated, status, airtableStatus } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [forceShowApp, setForceShowApp] = useState(false);

  useEffect(() => {
    console.log('🎬 APP: useEffect triggered, dispatching checkAuthStatus...');
    
    // Step 1: Check Firebase authentication
    dispatch(checkAuthStatus())
      .then((authResult) => {
        console.log('🎯 APP: checkAuthStatus completed with result:', authResult);
        
        // Step 2: If authenticated, fetch Airtable data
        const authPayload = authResult.payload as { uid: string; email: string } | null;
        if (authPayload && authPayload.uid) {
          console.log('🔄 APP: User authenticated, now fetching Airtable data...');
          return dispatch(fetchAirtableUserData(authPayload.uid));
        } else {
          console.log('❌ APP: User not authenticated, skipping Airtable fetch');
          return Promise.resolve(null);
        }
      })
      .then((airtableResult) => {
        if (airtableResult) {
          console.log('🎯 APP: fetchAirtableUserData completed with result:', airtableResult);
        }
      })
      .catch((error) => {
        console.error('💥 APP: Auth or Airtable fetch failed with error:', error);
      })
      .finally(() => {
        console.log('🏁 APP: Setting isLoading to false');
        setIsLoading(false);
      });
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ APP: Loading timeout reached, forcing app to show');
      setForceShowApp(true);
    }, 15000); // 15 second timeout (increased for two API calls)
    
    return () => clearTimeout(timeout);
  }, [dispatch]);

  // Debug logging for loading state
  console.log('🖥️  APP: Current state snapshot:', { 
    isLoading, 
    status, 
    airtableStatus,
    isAuthenticated, 
    hasAirtableRecord: !!user.airtableRecord,
    userEmail: user.email,
    onboardingCompleted: user.airtableRecord?.fields.OnboardingCompleted
  });

  // Show loading while authentication is being checked or while user data is being loaded
  const condition1 = isLoading;
  const condition2 = status === 'loading';
  const condition3 = isAuthenticated && airtableStatus === 'loading';
  const condition4 = isAuthenticated && !user.airtableRecord && airtableStatus !== 'succeeded' && airtableStatus !== 'failed';
  
  console.log('🖥️  APP: Loading conditions check:');
  console.log('🖥️  APP: - isLoading (local state):', condition1);
  console.log('🖥️  APP: - status === loading:', condition2);
  console.log('🖥️  APP: - authenticated + airtable loading:', condition3);
  console.log('🖥️  APP: - authenticated + no record + airtable not done:', condition4);
  
  console.log('🖥️  APP: forceShowApp:', forceShowApp);
  
  const shouldLoad = condition1 || condition2 || condition3 || condition4;
  const isAppLoading = !forceShowApp && shouldLoad;
  
  console.log('🖥️  APP: Should load (without force override):', shouldLoad);
  console.log('🖥️  APP: Final loading decision:', isAppLoading);

  if (isAppLoading) {
    console.log('🔄 APP: Showing loading screen');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
          {/* Debug info */}
          <p className="mt-2 text-xs text-gray-500">
            Auth: {status} | Airtable: {airtableStatus} | Authenticated: {isAuthenticated ? 'Yes' : 'No'} | Record: {user.airtableRecord ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  console.log('🚀 APP: Loading complete, rendering main app');
  console.log('🚀 APP: Will route based on:', {
    isAuthenticated,
    hasAirtableRecord: !!user.airtableRecord,
    onboardingCompleted: user.airtableRecord?.fields.OnboardingCompleted,
    isAdmin: user.isAdmin
  });

  return (
    <Router>
      <div className="App min-h-screen">
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
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AppLayout breadcrumbs={[{ label: 'Admin Dashboard' }]}>
                  <AdminDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/content" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AppLayout breadcrumbs={[{ label: 'Admin' }, { label: 'Content Library' }]}>
                  <AdminContentPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/content/new" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AppLayout breadcrumbs={[{ label: 'Admin' }, { label: 'Content Library' }, { label: 'Add New Content' }]}>
                  <AdminAddContentPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AppLayout breadcrumbs={[{ label: 'Admin' }, { label: 'User Management' }]}>
                  <AdminUserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/upload" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AppLayout breadcrumbs={[{ label: 'Admin' }, { label: 'Upload Content' }]}>
                  <AdminUploadPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/dashboard" replace />} 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;