import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  // Check if user is admin
  if (!isAuthenticated || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/admin/users')) return 'Users Table';
    if (pathname.includes('/admin/content/new')) return 'Add New Content';
    if (pathname.includes('/admin/content')) return 'Content Library';
    if (pathname.includes('/admin/dashboard')) return 'Dashboard';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{getPageTitle(location.pathname)}</h1>
                <p className="text-muted-foreground">Manage your study platform</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
              </div>
            </div>
          </header>
          
          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
