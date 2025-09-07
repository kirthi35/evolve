import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { createUser } from '../services/airtableService';
import { setAirtableData } from '../store/userSlice';
import type { OnboardingFormData } from '../types/airtable';
import AppLayout from '../components/AppLayout';
import OnboardingQuestionnaire from '../components/dashboard/OnboardingQuestionnaire';

const OnboardingPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user.uid || !user.email) {
      console.error('User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Randomly assign user to Group A or Group B
      const assignedGroup: 'Group A' | 'Group B' = Math.random() < 0.5 ? 'Group A' : 'Group B';
      
      // Create user in Airtable with onboarding data
      const userData = {
        UserID: user.uid,
        Email: user.email,
        AssignedGroup: assignedGroup,
        OnboardingCompleted: true,
        IsAdmin: false,
        // Store onboarding responses (optional field)
        OnboardingData: JSON.stringify(data)
      };

      const createdUser = await createUser(userData);
      
      // Update Redux store with Airtable data
      dispatch(setAirtableData({
        airtableRecord: {
          id: createdUser.id,
          fields: userData
        },
        isAdmin: false
      }));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Onboarding', href: '/onboarding' }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <OnboardingQuestionnaire 
        onSubmit={onSubmit}
        isLoading={isSubmitting}
      />
    </AppLayout>
  );
};

export default OnboardingPage;
