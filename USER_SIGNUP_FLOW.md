# User Signup Flow - Evolve Clinical Study Platform

## 🔄 Complete User Journey

### 1. **Initial Access** 
**Route**: `/` (Root)
- User visits the application
- App checks authentication status via `checkAuthStatus()` thunk
- If not authenticated → Redirect to Authentication Page
- If authenticated → Check onboarding status

### 2. **Authentication** 
**Route**: `/` → Authentication Page
- User sees login/signup form
- **Two options available**:
  - **Email/Password**: Traditional form signup
  - **Google OAuth**: One-click signup

#### **Email/Password Signup**:
```javascript
// User fills form and submits
const onSubmit = async (data: AuthFormData) => {
  // Calls Firebase createUserWithEmailAndPassword
  user = await signUpWithEmail(data.email, data.password);
  // Updates Redux store
  dispatch(setUser({ uid: user.uid, email: user.email }));
  // Redirects to onboarding
  navigate('/onboarding');
}
```

#### **Google OAuth Signup**:
```javascript
// User clicks "Sign in with Google"
const handleGoogleSignIn = async () => {
  // Calls Firebase signInWithPopup with Google provider
  const user = await signInWithGoogle();
  // Updates Redux store
  dispatch(setUser({ uid: user.uid, email: user.email }));
  // Redirects to onboarding
  navigate('/onboarding');
}
```

### 3. **Onboarding Process**
**Route**: `/onboarding` → Onboarding Page

#### **Step 3.1: Route Protection**
- `ProtectedRoute` checks if user is authenticated
- If already completed onboarding → Redirect to dashboard
- If not completed → Show onboarding questionnaire

#### **Step 3.2: Onboarding Questionnaire**
**Component**: `OnboardingQuestionnaire`

**Data Collected**:
1. **Demographics**:
   - Age (text input)
   - Gender (dropdown: Male, Female, Other, Prefer not to say)

2. **Professional Information**:
   - Specialty (dropdown: 17 medical specialties)
   - Years of Experience (radio: <1, 1-5, 6-10, >10 years)

3. **AI Exposure Assessment**:
   - Prior AI Exposure (radio: None, Minimal, Moderate, High)
   - Tech Comfort Level (radio: 1-5 Likert scale)

4. **Knowledge Assessment**:
   - 5 Pre-test Knowledge Questions (radio buttons)
   - Questions about AI in medicine

#### **Step 3.3: Data Processing**
```javascript
const onSubmit = async (data: OnboardingFormData) => {
  // Random group assignment (50/50 split)
  const assignedGroup = Math.random() < 0.5 ? 'Group A' : 'Group B';
  
  // Prepare user data for Airtable
  const userData = {
    UserID: user.uid,                    // Firebase UID
    Email: user.email,                   // User email
    AssignedGroup: assignedGroup,        // Random assignment
    OnboardingCompleted: true,           // Mark as completed
    IsAdmin: false,                      // Regular user
    OnboardingData: JSON.stringify(data) // Store questionnaire responses
  };
  
  // Create user record in Airtable
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
}
```

### 4. **Airtable Integration**
**Service**: `airtableService.ts`

#### **User Creation in Airtable**:
```javascript
export const createUser = async (userData) => {
  const record = await base('Users').create({
    ...userData,
    LastLogin: new Date().toISOString()  // Track login time
  });
  
  return {
    id: record.id,
    fields: record.fields,
    createdTime: record.createdTime
  };
}
```

**Airtable Record Created**:
- **Table**: `Users`
- **Fields**: UserID, Email, AssignedGroup, OnboardingCompleted, IsAdmin, LastLogin, OnboardingData
- **Links**: Auto-generated record ID for future relationships

### 5. **Dashboard Access**
**Route**: `/dashboard` → Dashboard Page

#### **Step 5.1: Route Protection**
- `ProtectedRoute` checks authentication
- `ProtectedRoute` checks onboarding completion
- If not completed → Redirect to onboarding

#### **Step 5.2: Group-Based Dashboard**
**Component**: `DashboardPage`

**Group Assignment Logic**:
```javascript
// Based on AssignedGroup from Airtable
if (user.airtableRecord?.fields.AssignedGroup === 'Group A') {
  return <GroupADashboard />;  // Traditional dashboard
} else {
  return <GroupBDashboard />;  // Daily progression dashboard
}
```

**Group A Dashboard**:
- Shows all available content immediately
- Traditional video player interface
- Progress tracking per video

**Group B Dashboard**:
- Shows content based on day progression
- Daily unlock system
- Study timeline component

### 6. **State Management**
**Store**: Redux with `userSlice`

#### **User State Structure**:
```javascript
interface UserState {
  user: {
    uid: string | null;           // Firebase UID
    email: string | null;         // User email
    airtableRecord: User | null;  // Airtable user data
    isAdmin: boolean;             // Admin flag
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  error: string | null;
}
```

#### **Key Actions**:
- `setUser()` - Set Firebase user data
- `setAirtableData()` - Set Airtable user record
- `checkAuthStatus()` - Check authentication on app load
- `clearUser()` - Clear user data on logout

## 🔐 Authentication Flow

### **Firebase Authentication**
- **Provider**: Firebase Auth
- **Methods**: Email/Password, Google OAuth
- **Persistence**: Automatic session persistence
- **Security**: Firebase handles all security

### **Airtable Integration**
- **API**: Airtable REST API
- **Authentication**: Personal Access Token
- **Data**: User profile and study data
- **Relationships**: Links to other tables

## 📊 Data Flow

```
1. User Input → Firebase Auth → Redux Store
2. Redux Store → Onboarding Form → User Data
3. User Data → Airtable API → Database Record
4. Database Record → Redux Store → Dashboard
5. Dashboard → Group Assignment → Content Display
```

## 🚦 Route Protection

### **Public Routes**:
- `/` - Authentication page (if not logged in)

### **Protected Routes** (Require Authentication):
- `/onboarding` - Onboarding questionnaire
- `/dashboard` - Main dashboard
- `/complete` - Study completion page

### **Conditional Redirects**:
- Authenticated + No Onboarding → `/onboarding`
- Authenticated + Onboarding Complete → `/dashboard`
- Not Authenticated → Authentication page

## ⚡ Key Features

### **Random Group Assignment**
- 50/50 split between Group A and Group B
- Determines study experience
- Stored in Airtable for consistency

### **Comprehensive Onboarding**
- Demographics collection
- Professional background
- AI exposure assessment
- Knowledge pre-test
- All data stored as JSON in Airtable

### **Persistent State**
- Firebase handles authentication persistence
- Redux manages application state
- Airtable stores user data and progress

### **Error Handling**
- Firebase authentication errors
- Airtable API errors
- Form validation errors
- User-friendly error messages

## 🔄 Return User Flow

### **Existing User Login**:
1. User visits app → Authentication check
2. Firebase session exists → Fetch Airtable data
3. Airtable data found → Set user state
4. Check onboarding status → Redirect appropriately

### **Session Persistence**:
- Firebase automatically restores sessions
- Redux state is rehydrated on app load
- Airtable data is fetched and stored

## 📝 Data Storage

### **Firebase**:
- User authentication
- Session management
- Security

### **Airtable**:
- User profile data
- Onboarding responses
- Study progress
- Content and questions
- User responses

### **Redux Store**:
- Application state
- User data
- UI state
- Error handling

This flow ensures a smooth, secure, and comprehensive user onboarding experience for the clinical study platform! 🎉
