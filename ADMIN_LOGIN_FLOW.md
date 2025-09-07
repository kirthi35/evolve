# Admin Login Flow - Evolve Clinical Study Platform

## 🔐 Admin Authentication Process

### **1. Admin Status Determination**
**Source**: Airtable `Users` table - `IsAdmin` field
- **Field Type**: Checkbox (Boolean)
- **Default Value**: `false` for regular users
- **Admin Value**: `true` for admin users
- **Set Manually**: Admin status must be set manually in Airtable

### **2. Admin Login Flow**

#### **Step 1: Authentication**
**Same as regular users** - Admin uses standard authentication:
- **Email/Password**: `signUpWithEmail()` or `signInWithEmail()`
- **Google OAuth**: `signInWithGoogle()`

#### **Step 2: User Data Fetching**
```javascript
// In checkAuthStatus() thunk
const airtableUser = await fetchUserByFirebaseUID(user.uid);
if (airtableUser) {
  dispatch(setAirtableData({
    airtableRecord: airtableUser,
    isAdmin: airtableUser.fields.IsAdmin  // ← Admin status from Airtable
  }));
}
```

#### **Step 3: Route Determination**
**App.tsx routing logic**:
```javascript
// Root route logic
isAuthenticated ? (
  user.airtableRecord?.fields.OnboardingCompleted ? (
    user.isAdmin ? 
      <Navigate to="/admin/dashboard" replace /> :  // ← Admin redirect
      <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/onboarding" replace />
  )
) : (
  <AuthenticationPage />
)
```

### **3. Admin Dashboard Access**

#### **Route Protection**
```javascript
// Admin routes require authentication + admin status
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      <AdminLayout />
    </ProtectedRoute>
  }
/>
```

#### **Admin Layout Protection**
```javascript
// Double-check admin status in AdminLayout
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
```

## 🎯 Admin Dashboard Features

### **1. Admin Dashboard Page** (`/admin/dashboard`)
**Component**: `AdminDashboardPage`

#### **Statistics Overview**:
- **Total Users**: Count of all registered users
- **Completed Onboarding**: Users who finished onboarding
- **Group A Users**: Count of Group A participants
- **Group B Users**: Count of Group B participants

#### **Recent Users Table**:
- **Email**: User email address
- **Group**: Assigned study group (A/B)
- **Status**: Onboarding completion status
- **Created**: Account creation date

### **2. User Management Page** (`/admin/users`)
**Component**: `AdminUserManagementPage`

#### **Advanced User Management**:
- **Search**: Filter users by email address
- **Group Filter**: Filter by Group A or Group B
- **Status Filter**: Filter by onboarding completion status
- **Detailed User Table**:
  - Email address
  - Firebase UID (truncated)
  - Assigned group
  - Onboarding status
  - Admin status
  - Creation date

#### **User Data Display**:
```javascript
// User table columns
- Email: user.fields.Email
- Firebase UID: user.fields.UserID.substring(0, 8)...
- Assigned Group: user.fields.AssignedGroup
- Onboarding Status: user.fields.OnboardingCompleted
- Admin: user.fields.IsAdmin
- Created Date: user.fields.CreatedAt
```

### **3. Content Upload Page** (`/admin/upload`)
**Component**: `AdminUploadPage`

#### **Content Management Features**:
- **Video Upload**: YouTube video link input
- **Group Assignment**: Assign content to Group A or Group B
- **Question Creation**: Dynamic question builder
- **Answer Options**: Multiple choice options with correct answer selection

#### **Question Builder**:
```javascript
interface Question {
  text: string;           // Question text
  options: string[];      // Answer options
  correctAnswer: number;  // Index of correct answer
}
```

## 🔄 Admin State Management

### **Redux State Structure**:
```javascript
interface UserState {
  user: {
    uid: string | null;           // Firebase UID
    email: string | null;         // User email
    airtableRecord: User | null;  // Airtable user data
    isAdmin: boolean;             // Admin status flag
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  error: string | null;
}
```

### **Admin Status Flow**:
1. **Firebase Authentication** → User authenticated
2. **Airtable Lookup** → Fetch user record by Firebase UID
3. **Admin Check** → `airtableUser.fields.IsAdmin`
4. **Redux Update** → `setAirtableData({ isAdmin: true/false })`
5. **Route Decision** → Admin dashboard vs regular dashboard

## 🛡️ Security & Access Control

### **Multi-Layer Protection**:

#### **1. Route Level Protection**:
```javascript
<ProtectedRoute requireAuth={true} requireAdmin={true}>
  <AdminLayout />
</ProtectedRoute>
```

#### **2. Component Level Protection**:
```javascript
// AdminLayout component checks
if (!isAuthenticated || !user.isAdmin) {
  return <AccessDenied />;
}
```

#### **3. Data Level Protection**:
- Admin status stored in Airtable (server-side)
- Cannot be modified by client-side code
- Requires Airtable access to change

### **Admin Status Management**:
- **Set in Airtable**: Manual process in Airtable interface
- **Field**: `Users.IsAdmin` (checkbox)
- **Persistence**: Survives app restarts and re-authentication
- **Security**: Cannot be bypassed by client manipulation

## 📊 Admin Capabilities

### **User Management**:
- ✅ View all registered users
- ✅ Filter and search users
- ✅ See user onboarding status
- ✅ View group assignments
- ✅ Monitor user creation dates
- ❌ **Cannot modify user data** (read-only)

### **Content Management**:
- ✅ Upload new video content
- ✅ Assign content to study groups
- ✅ Create assessment questions
- ✅ Set correct answers
- ✅ Manage content organization

### **Analytics & Monitoring**:
- ✅ View user statistics
- ✅ Monitor onboarding completion rates
- ✅ Track group distribution
- ✅ See recent user activity

## 🔄 Admin vs Regular User Flow

### **Regular User Flow**:
```
Authentication → Onboarding → Dashboard (Group A/B)
```

### **Admin User Flow**:
```
Authentication → Admin Dashboard → User Management + Content Upload
```

### **Key Differences**:
- **No Onboarding**: Admins skip the questionnaire
- **Admin Dashboard**: Different interface with management tools
- **Full Access**: Can see all users and manage content
- **No Group Assignment**: Admins are not part of the study groups

## 🚀 Admin Setup Process

### **To Create an Admin User**:

1. **Create User Account**:
   - User signs up normally (email/password or Google)
   - Goes through onboarding process
   - Gets assigned to Group A or Group B

2. **Promote to Admin**:
   - Go to Airtable `Users` table
   - Find the user record
   - Set `IsAdmin` field to `true`
   - Save the record

3. **Admin Access**:
   - User logs out and logs back in
   - System detects `IsAdmin: true`
   - Redirects to admin dashboard
   - Full admin capabilities unlocked

## 📝 Admin Routes

### **Available Admin Routes**:
- `/admin` - Admin layout wrapper
- `/admin/dashboard` - Statistics and overview
- `/admin/users` - User management
- `/admin/upload` - Content upload

### **Route Protection**:
```javascript
// All admin routes require:
requireAuth={true}    // Must be authenticated
requireAdmin={true}   // Must have admin status
```

## ⚡ Key Features

### **Real-time Data**:
- User statistics update automatically
- Recent users table shows latest registrations
- Filtering and search work in real-time

### **Responsive Design**:
- Mobile-friendly admin interface
- Responsive tables and forms
- shadcn UI components for consistency

### **Error Handling**:
- Graceful loading states
- Error messages for failed operations
- Access denied for unauthorized users

This admin system provides comprehensive management capabilities while maintaining security through multiple layers of protection! 🎉
