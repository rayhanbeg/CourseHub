import { createSlice } from '@reduxjs/toolkit';

const AUTH_CACHE_KEY = 'coursehub_user';

const readCachedUser = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(AUTH_CACHE_KEY) || 'null');
    if (!cached || !cached.id || !cached.name || !['student', 'admin'].includes(cached.role)) return null;
    return { id: cached.id, name: cached.name, role: cached.role };
  } catch {
    return null;
  }
};

const cacheUser = (user) => {
  try {
    if (!user) localStorage.removeItem(AUTH_CACHE_KEY);
    else localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
      id: String(user.id || user._id || ''),
      name: user.name || '',
      role: user.role || '',
    }));
  } catch { /* Auth remains usable when browser storage is unavailable. */ }
};

const cachedUser = readCachedUser();

const initialState = {
  user: cachedUser,
  token: null,
  refreshToken: null,
  isLoading: Boolean(cachedUser),
  error: null,
  isAuthenticated: Boolean(cachedUser),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      cacheUser(action.payload.user);
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.user = action.payload.user;
      cacheUser(action.payload.user);
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      cacheUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      cacheUser(action.payload);
      state.isAuthenticated = Boolean(action.payload);
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  registerSuccess,
  logout,
  setError,
  setUser,
} = authSlice.actions;

export default authSlice.reducer;
