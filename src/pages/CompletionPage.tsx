import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux';
import { signOutUser } from '../services/firebaseService';
import { clearUser } from '../store/userSlice';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

const CompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await signOutUser();
      dispatch(clearUser());
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold">
            Thank You for Participating!
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            You have successfully completed the study. Your responses have been recorded and will be used for research purposes.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 px-6">
            <div className="text-center space-y-4">
              <p className="text-foreground">
                We appreciate your time and valuable feedback. Your participation helps us improve our understanding of user behavior and preferences.
              </p>
              
              <div className="pt-4">
                <Button
                  onClick={handleLogout}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            If you have any questions about this study, please contact the research team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;
