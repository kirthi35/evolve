import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { upsertUser } from '../services/airtableService';
import { setAirtableData } from '../store/userSlice';
import type { OnboardingFormData } from '../types/airtable';
import AppLayout from '../components/AppLayout';
import OnboardingQuestionnaire from '../components/dashboard/OnboardingQuestionnaire';
import type { QuestionWithAnswerOptions } from '../components/dashboard/Questionnaire';
import { Skeleton } from '../components/ui/skeleton';

const OnboardingPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knowledgeQuestions, setKnowledgeQuestions] = useState<QuestionWithAnswerOptions[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);

  // Load knowledge questions for onboarding
  useEffect(() => {
    const loadKnowledgeQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        // For now, we'll use empty array since we don't have a specific content ID for onboarding questions
        // In a real implementation, you might have a specific content or question set for onboarding
        setKnowledgeQuestions([]);
      } catch (error) {
        console.error('Error loading knowledge questions:', error);
        setKnowledgeQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadKnowledgeQuestions();
  }, []);

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

      const upsertedUser = await upsertUser(userData);
      console.log('User upserted successfully:', upsertedUser);
      
      // Update Redux store with actual Airtable data
      dispatch(setAirtableData({
        airtableRecord: {
          id: upsertedUser.id,
          fields: upsertedUser.fields as any, // Type assertion needed due to Airtable's generic Record type
          createdTime: upsertedUser.createdTime
        },
        isAdmin: false
      }));

      console.log('Redux store updated, navigating to dashboard...');
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

  if (isLoadingQuestions) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="w-full h-96" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <OnboardingQuestionnaire 
        onSubmit={onSubmit}
        isLoading={isSubmitting}
        knowledgeQuestions={knowledgeQuestions}
      />
    </AppLayout>
  );
};

export default OnboardingPage;
