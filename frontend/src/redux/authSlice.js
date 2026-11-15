// src/redux/authSlice.js - Redux Toolkit slice for Authentication
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const AUTH_API = '/api/auth';

// Restore active session using current-user endpoint
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${AUTH_API}/me`, {
      method: 'GET',
      credentials: 'include', // Send HTTP-only cookie
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error || 'Session not found');
    }

    const data = await response.json();
    return data.user;
  } catch (err) {
    return rejectWithValue(err.message || 'Network error while checking auth');
  }
});

// Login existing user
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to log in');
      }

      return data.user;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error during login');
    }
  }
);

// Register new user
export const signup = createAsyncThunk(
  'auth/signup',
  async ({ name, email, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${AUTH_API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.errors ? data.errors.join(' ') : data.error || 'Registration failed';
        return rejectWithValue(errorMsg);
      }

      return data.user;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error during signup');
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${AUTH_API}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      return rejectWithValue(data.error || 'Logout failed');
    }

    return true;
  } catch (err) {
    return rejectWithValue(err.message || 'Network error during logout');
  }
});

const initialState = {
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true, // true on first load until checkAuth resolves
  authLoading: false,
  authError: null,
  authSuccessMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.authError = null;
    },
    clearAuthSuccess: (state) => {
      state.authSuccessMessage = null;
    },
  },
  extraReducers: (builder) => {
    // checkAuth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.authError = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // login
    builder
      .addCase(login.pending, (state) => {
        state.authLoading = true;
        state.authError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.authLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.authError = null;
        state.authSuccessMessage = `Welcome back, ${action.payload.name}!`;
      })
      .addCase(login.rejected, (state, action) => {
        state.authLoading = false;
        state.authError = action.payload;
      });

    // signup
    builder
      .addCase(signup.pending, (state) => {
        state.authLoading = true;
        state.authError = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.authLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.authError = null;
        state.authSuccessMessage = `Welcome to Hotel Explorer, ${action.payload.name}!`;
      })
      .addCase(signup.rejected, (state, action) => {
        state.authLoading = false;
        state.authError = action.payload;
      });

    // logout
    builder
      .addCase(logout.pending, (state) => {
        state.authLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.authLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.authError = null;
        state.authSuccessMessage = 'Logged out successfully.';
      })
      .addCase(logout.rejected, (state) => {
        state.authLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearAuthError, clearAuthSuccess } = authSlice.actions;
export default authSlice.reducer;
