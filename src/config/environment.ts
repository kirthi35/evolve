// Environment configuration
// Copy this to .env.local and fill in your actual values

export const environment = {
  // Firebase Configuration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  },
  
  // Airtable Configuration
  airtable: {
    personalAccessToken: import.meta.env.VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN || '',
    baseId: import.meta.env.VITE_AIRTABLE_BASE_ID || '',
  },
};

// Validation function to check if all required environment variables are set
export const validateEnvironment = (): boolean => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'VITE_AIRTABLE_BASE_ID',
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }
  
  return true;
};
