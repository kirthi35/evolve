import React from 'react';
import { useAppSelector } from '../hooks/redux';
import GroupADashboard from '../components/dashboard/GroupADashboard';
import GroupBDashboard from '../components/dashboard/GroupBDashboard';
import AppLayout from '../components/AppLayout';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  // Check if user is authenticated and has completed onboarding
  if (!isAuthenticated || !user.airtableRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please complete onboarding first.</p>
        </div>
      </div>
    );
  }

  // Check if onboarding is completed
  if (!user.airtableRecord.fields.OnboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Onboarding Required</h2>
          <p className="mt-2 text-gray-600">Please complete the onboarding process first.</p>
        </div>
      </div>
    );
  }

  // Render the appropriate dashboard based on assigned group
  const assignedGroup = user.airtableRecord.fields.AssignedGroup;
  
  const breadcrumbs = [
    { label: 'Study Dashboard', href: '/dashboard' },
    { label: assignedGroup === 'Group A' ? 'Group A Content' : 'Group B Content' }
  ];
  
  if (assignedGroup === 'Group A') {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <GroupADashboard />
      </AppLayout>
    );
  } else if (assignedGroup === 'Group B') {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <GroupBDashboard />
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: 'Error' }]}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Invalid Group Assignment</h2>
          <p className="mt-2 text-muted-foreground">Please contact support for assistance.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
