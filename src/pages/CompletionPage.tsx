import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux';
import { signOutUser } from '../services/firebaseService';
import { clearUser } from '../store/userSlice';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Thank You for Participating!
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            You have successfully completed the study. Your responses have been recorded and will be used for research purposes.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              We appreciate your time and valuable feedback. Your participation helps us improve our understanding of user behavior and preferences.
            </p>
            
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            If you have any questions about this study, please contact the research team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;
