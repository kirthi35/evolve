import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/airtable';
import { fetchUserByFirebaseUID } from '../services/airtableService';
import { onAuthChange } from '../services/firebaseService';

// User state interface
interface UserState {
  user: {
    uid: string | null;
    email: string | null;
    airtableRecord: User | null;
    isAdmin: boolean;
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
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
  isAuthenticated: false,
  error: null,
};

// Async thunk to check authentication status
export const checkAuthStatus = createAsyncThunk(
  'user/checkAuthStatus',
  async (_, { dispatch }) => {
    return new Promise<{ uid: string; email: string } | null>((resolve, reject) => {
      const unsubscribe = onAuthChange(async (user) => {
        unsubscribe();
        if (user) {
          try {
            // Fetch user data from Airtable
            const airtableUser = await fetchUserByFirebaseUID(user.uid);
            if (airtableUser) {
              dispatch(setAirtableData({
                airtableRecord: airtableUser,
                isAdmin: airtableUser.fields.IsAdmin
              }));
            }
            resolve({
              uid: user.uid,
              email: user.email || ''
            });
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null);
        }
      });
    });
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
      state.user.airtableRecord = action.payload.airtableRecord;
      state.user.isAdmin = action.payload.isAdmin;
    },
    clearUser: (state) => {
      state.user = {
        uid: null,
        email: null,
        airtableRecord: null,
        isAdmin: false,
      };
      state.status = 'idle';
      state.isAuthenticated = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.user.uid = action.payload.uid;
          state.user.email = action.payload.email;
          state.isAuthenticated = true;
        } else {
          state.user = {
            uid: null,
            email: null,
            airtableRecord: null,
            isAdmin: false,
          };
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Authentication check failed';
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, setAirtableData, clearUser, setError } = userSlice.actions;
export default userSlice.reducer;
