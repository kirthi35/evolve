import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/airtable';
import { fetchUserByFirebaseUID } from '../services/airtableService';
import { onAuthChange, auth } from '../services/firebaseService';

// User state interface
interface UserState {
  user: {
    uid: string | null;
    email: string | null;
    airtableRecord: User | null;
    isAdmin: boolean;
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  airtableStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  user: {
    uid: null,
    email: null,
    airtableRecord: null,
    isAdmin: false,
  },
  status: 'idle',
  airtableStatus: 'idle',
  isAuthenticated: false,
  error: null,
};

// Simplified auth check - only handles Firebase authentication
export const checkAuthStatus = createAsyncThunk(
  'user/checkAuthStatus',
  async () => {
    console.log('🚀 AUTH_THUNK: checkAuthStatus started');
    
    // Check current auth state immediately
    console.log('🔍 AUTH_THUNK: Checking current Firebase auth state...');
    const currentUser = auth.currentUser;
    console.log('🔍 AUTH_THUNK: Current user:', currentUser ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');
    
    if (currentUser) {
      console.log('🔍 AUTH_THUNK: Found existing authenticated user:', { uid: currentUser.uid, email: currentUser.email });
      return {
        uid: currentUser.uid,
        email: currentUser.email || ''
      };
    }
    
    // If no current user, set up listener for auth changes
    return new Promise<{ uid: string; email: string } | null>((resolve) => {
      console.log('🔗 AUTH_THUNK: No current user, setting up onAuthChange listener...');
      
      const timeoutId = setTimeout(() => {
        console.log('⏰ AUTH_THUNK: onAuthChange listener timeout - no callback received in 5 seconds');
        resolve(null);
      }, 5000);
      
      const unsubscribe = onAuthChange((user) => {
        console.log('🔔 AUTH_THUNK: onAuthChange callback triggered with user:', user ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');
        clearTimeout(timeoutId);
        unsubscribe();
        
        if (user) {
          console.log('🔥 AUTH_THUNK: Firebase user authenticated:', { uid: user.uid, email: user.email });
          resolve({
            uid: user.uid,
            email: user.email || ''
          });
        } else {
          console.log('❌ AUTH_THUNK: No Firebase user authenticated');
          resolve(null);
        }
      });
    });
  }
);

// Separate thunk to fetch Airtable user data
export const fetchAirtableUserData = createAsyncThunk(
  'user/fetchAirtableUserData',
  async (uid: string) => {
    console.log('🚀 AIRTABLE_THUNK: fetchAirtableUserData started for UID:', uid);
    
    try {
      console.log('📡 AIRTABLE_THUNK: STARTING Airtable API call for UID:', uid);
      console.log('📡 AIRTABLE_THUNK: API call timestamp:', new Date().toISOString());
      
      const airtableUser = await Promise.race([
        fetchUserByFirebaseUID(uid),
        new Promise<User | null>((_, reject) => 
          setTimeout(() => reject(new Error('Airtable fetch timeout')), 8000)
        )
      ]) as User | null;
      
      console.log('✅ AIRTABLE_THUNK: COMPLETED Airtable API call at:', new Date().toISOString());
      console.log('📦 AIRTABLE_THUNK: Airtable API response:', airtableUser);
      console.log('📦 AIRTABLE_THUNK: Response type:', typeof airtableUser);
      console.log('📦 AIRTABLE_THUNK: Has fields?', airtableUser?.fields ? 'YES' : 'NO');
      
      if (airtableUser && airtableUser.fields) {
        console.log('✅ AIRTABLE_THUNK: Valid Airtable user found');
        console.log('👤 AIRTABLE_THUNK: User details:', {
          id: airtableUser.id,
          email: airtableUser.fields.Email,
          group: airtableUser.fields.AssignedGroup,
          isAdmin: airtableUser.fields.IsAdmin,
          onboardingCompleted: airtableUser.fields.OnboardingCompleted
        });
        
        return {
          airtableRecord: airtableUser,
          isAdmin: airtableUser.fields.IsAdmin
        };
      } else {
        console.log('❌ AIRTABLE_THUNK: No Airtable user found for Firebase UID:', uid);
        return null;
      }
    } catch (error) {
      console.error('💥 AIRTABLE_THUNK: ERROR in Airtable fetch:', error);
      console.error('💥 AIRTABLE_THUNK: Error type:', typeof error);
      console.error('💥 AIRTABLE_THUNK: Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ uid: string; email: string }>) => {
      state.user.uid = action.payload.uid;
      state.user.email = action.payload.email;
      state.isAuthenticated = true;
      state.error = null;
    },
    setAirtableData: (state, action: PayloadAction<{ airtableRecord: User; isAdmin: boolean }>) => {
      console.log('✅ MANUAL_REDUCER: setAirtableData - Manually setting user data');
      state.user.airtableRecord = action.payload.airtableRecord;
      state.user.isAdmin = action.payload.isAdmin;
      state.airtableStatus = 'succeeded';
      console.log('✅ MANUAL_REDUCER: airtableStatus set to succeeded');
    },
    clearUser: (state) => {
      console.log('🧹 REDUCER: clearUser - Resetting all user state to initial values');
      state.user = {
        uid: null,
        email: null,
        airtableRecord: null,
        isAdmin: false,
      };
      state.status = 'idle';
      state.airtableStatus = 'idle';
      state.isAuthenticated = false;
      state.error = null;
      console.log('🧹 REDUCER: User state cleared successfully');
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
  extraReducers: (builder) => {
    builder
      // Auth status thunk
      .addCase(checkAuthStatus.pending, (state) => {
        console.log('⏳ AUTH_REDUCER: checkAuthStatus.pending - Setting auth status to loading');
        state.status = 'loading';
        state.error = null;
        console.log('⏳ AUTH_REDUCER: auth status is now:', state.status);
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        console.log('✅ AUTH_REDUCER: checkAuthStatus.fulfilled - Auth completed');
        console.log('✅ AUTH_REDUCER: Payload:', action.payload);
        state.status = 'succeeded';
        if (action.payload) {
          console.log('✅ AUTH_REDUCER: Setting user as authenticated');
          state.user.uid = action.payload.uid;
          state.user.email = action.payload.email;
          state.isAuthenticated = true;
        } else {
          console.log('❌ AUTH_REDUCER: No user payload, clearing user');
          state.user = {
            uid: null,
            email: null,
            airtableRecord: null,
            isAdmin: false,
          };
          state.isAuthenticated = false;
        }
        console.log('✅ AUTH_REDUCER: Final auth state - status:', state.status, 'isAuthenticated:', state.isAuthenticated);
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        console.log('❌ AUTH_REDUCER: checkAuthStatus.rejected - Auth failed');
        console.log('❌ AUTH_REDUCER: Error:', action.error.message);
        state.status = 'failed';
        state.error = action.error.message || 'Authentication check failed';
        state.isAuthenticated = false;
        console.log('❌ AUTH_REDUCER: Final auth state - status:', state.status);
      })
      // Airtable data thunk
      .addCase(fetchAirtableUserData.pending, (state) => {
        console.log('⏳ AIRTABLE_REDUCER: fetchAirtableUserData.pending - Setting airtable status to loading');
        state.airtableStatus = 'loading';
        console.log('⏳ AIRTABLE_REDUCER: airtableStatus is now:', state.airtableStatus);
      })
      .addCase(fetchAirtableUserData.fulfilled, (state, action) => {
        console.log('✅ AIRTABLE_REDUCER: fetchAirtableUserData.fulfilled - Airtable completed');
        console.log('✅ AIRTABLE_REDUCER: Payload:', action.payload);
        state.airtableStatus = 'succeeded';
        if (action.payload) {
          console.log('✅ AIRTABLE_REDUCER: Setting Airtable user data');
          state.user.airtableRecord = action.payload.airtableRecord;
          state.user.isAdmin = action.payload.isAdmin;
        } else {
          console.log('❌ AIRTABLE_REDUCER: No Airtable user found');
        }
        console.log('✅ AIRTABLE_REDUCER: Final airtable state - status:', state.airtableStatus, 'hasRecord:', !!state.user.airtableRecord);
      })
      .addCase(fetchAirtableUserData.rejected, (state, action) => {
        console.log('❌ AIRTABLE_REDUCER: fetchAirtableUserData.rejected - Airtable failed');
        console.log('❌ AIRTABLE_REDUCER: Error:', action.error.message);
        state.airtableStatus = 'failed';
        state.error = action.error.message || 'Airtable fetch failed';
        console.log('❌ AIRTABLE_REDUCER: Final airtable state - status:', state.airtableStatus);
      });
  },
});

export const { 
  setUser, 
  setAirtableData,
  clearUser, 
  setError 
} = userSlice.actions;
export default userSlice.reducer;
