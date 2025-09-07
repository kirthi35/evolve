import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import AppLayout from '../AppLayout';

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

<<<<<<< HEAD
  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/admin/users')) return 'User Management';
    if (pathname.includes('/admin/upload')) return 'Upload Content';
    if (pathname.includes('/admin/dashboard')) return 'Dashboard';
    return 'Admin';
  }

  const breadcrumbs = [
    { label: 'Admin Panel', href: '/admin' },
    { label: getPageTitle(location.pathname) }
=======
  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', current: location.pathname === '/admin/dashboard' },
    { name: 'User Management', href: '/admin/users', current: location.pathname === '/admin/users' },
  ];

  const breadcrumbs = [
    { label: 'Admin Panel', href: '/admin' },
    { label: location.pathname === '/admin/dashboard' ? 'Dashboard' : 'User Management' }
>>>>>>> 53706fadde3a9fb649ca1ac5ba4b54556349b7b4
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your study platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
          </div>
        </div>
        <Outlet />
      </div>
    </AppLayout>
  );
};

export default AdminLayout;
