import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const auth = useAuth();

  console.log(' ProtectedRoute check - isAuthenticated:', auth.isAuthenticated, 'user:', auth.user, 'requiredRole:', requiredRole);

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    console.log(' Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && auth.user?.role?.toLowerCase() !== requiredRole.toLowerCase()) {
    console.log(' Role mismatch - user role:', auth.user?.role, 'required:', requiredRole, 'redirecting to home');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
