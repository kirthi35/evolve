import React from 'react';
import { useAppSelector } from '../hooks/redux';
import GroupADashboard from '../components/dashboard/GroupADashboard';
import GroupBDashboard from '../components/dashboard/GroupBDashboard';
import AppLayout from '../components/AppLayout';
import { Card, CardContent } from '../components/ui/card';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  // Check if user is authenticated and has completed onboarding
  if (!isAuthenticated || !user.airtableRecord) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Access Denied' }]}>
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="mt-2 text-muted-foreground">Please complete onboarding first.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Check if onboarding is completed
  if (!user.airtableRecord.fields.OnboardingCompleted) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Onboarding Required' }]}>
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold">Onboarding Required</h2>
              <p className="mt-2 text-muted-foreground">Please complete the onboarding process first.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Render the appropriate dashboard based on assigned group
  const assignedGroup = user.airtableRecord.fields.AssignedGroup;
  
  // Debug logging
  console.log('Dashboard Page - User Info:', {
    email: user.email,
    assignedGroup: assignedGroup,
    airtableRecordId: user.airtableRecord.id,
    onboardingCompleted: user.airtableRecord.fields.OnboardingCompleted
  });
  
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
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold">Invalid Group Assignment</h2>
            <p className="mt-2 text-muted-foreground">Please contact support for assistance.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
