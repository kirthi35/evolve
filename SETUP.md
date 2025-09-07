# User Study Application Setup Guide

This is a complete React web application for a user study built with TypeScript, Redux Toolkit, Firebase Authentication, and Airtable integration.

## Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm
- Firebase project
- Airtable account and base

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Airtable Configuration
VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_personal_access_token_here
VITE_AIRTABLE_BASE_ID=your_airtable_base_id_here
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication and configure:
   - Email/Password authentication
   - Google authentication
3. Get your Firebase configuration from Project Settings > General > Your apps
4. Add the configuration values to your `.env.local` file

## Airtable Setup

1. Create an Airtable base with the following tables:

### Users Table
- UserID (Single line text) - Firebase UID
- Email (Email)
- AssignedGroup (Single select: Group A, Group B)
- OnboardingCompleted (Checkbox)
- IsAdmin (Checkbox)
- CreatedAt (Date)

### Content Table
- Title (Single line text)
- YouTubeVideoID (Single line text)
- Group (Single select: Group A, Group B)
- Order (Number)
- Questions (Link to another record - Questions table)

### Questions Table
- QuestionText (Long text)
- Options (Long text - JSON array of options)
- Type (Single select: single, multiple)
- Video (Link to another record - Content table)
- OnboardingQuestion (Checkbox)
- Order (Number)

### UserResponses Table
- UserID (Single line text) - Firebase UID
- QuestionID (Link to another record - Questions table)
- Answer (Single line text)
- VideoID (Link to another record - Content table)
- SubmittedAt (Date)

### UserProgress Table
- UserID (Single line text) - Firebase UID
- VideoID (Link to another record - Content table)
- WatchProgress (Number)
- Completed (Checkbox)
- CompletedAt (Date)
- DayNumber (Number)

2. Get your Airtable Personal Access Token from https://airtable.com/create/tokens
3. Get your Base ID from your base URL
4. Add these values to your `.env.local` file

## Running the Application

1. Start the development server:
```bash
pnpm dev
```

2. Open your browser and navigate to `http://localhost:5173`

## Application Features

### User Flow
1. **Authentication**: Users can sign in with Google or email/password
2. **Onboarding**: New users complete a questionnaire and are randomly assigned to Group A or Group B
3. **Group A Dashboard**: Users can watch videos at their own pace with full controls
4. **Group B Dashboard**: Users watch one video per day with autoplay and no controls
5. **Completion**: Users are redirected to a completion page after finishing all content

### Admin Features
- View user statistics and progress
- Manage and filter users
- Monitor study participation

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard components
│   ├── admin/         # Admin panel components
│   └── ui/            # Reusable UI components
├── pages/             # Page components
├── services/          # API services (Firebase, Airtable)
├── store/             # Redux store and slices
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Technologies

- **React 19** with TypeScript
- **Vite** for build tooling
- **Redux Toolkit** for state management
- **React Router** for navigation
- **React Hook Form** for form management
- **Firebase v9+** for authentication
- **Airtable** for data storage
- **Tailwind CSS** for styling
- **YouTube Iframe Player API** for video playback

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser. The application will validate that all required variables are present on startup.

## Deployment

1. Build the application:
```bash
pnpm build
```

2. Deploy the `dist` folder to your preferred hosting service (Vercel, Netlify, etc.)

3. Make sure to set the environment variables in your hosting platform's environment configuration.

## Troubleshooting

- Ensure all environment variables are correctly set
- Check that Firebase authentication is properly configured
- Verify Airtable API permissions and base structure
- Check browser console for any JavaScript errors
