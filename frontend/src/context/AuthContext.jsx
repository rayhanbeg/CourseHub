import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logout, setLoading } from '../store/authSlice';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      if (auth.token && !auth.user) {
        dispatch(setLoading(true));
        try {
          const { data } = await authAPI.getCurrentUser();
          dispatch(setUser(data.user));
        } catch (error) {
          dispatch(logout());
        } finally {
          dispatch(setLoading(false));
        }
      }
    };

    checkAuth();
  }, [auth.token, auth.user, dispatch]);

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
