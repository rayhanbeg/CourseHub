import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logout } from '../store/authSlice';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    // The minimal cached profile is written at login. Guests without it can
    // render immediately; cached sessions stay in a loading state until /me settles.
    if (!auth.isLoading || !auth.user) return undefined;
    let mounted = true;
    authAPI.getCurrentUser()
      .then(({ data }) => { if (mounted) dispatch(setUser(data.user)); })
      .catch(() => { if (mounted) dispatch(logout()); });
    return () => { mounted = false; };
  }, [dispatch]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
