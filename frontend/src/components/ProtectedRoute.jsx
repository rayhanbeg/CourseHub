import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole = null, loadingFallback = null }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading || (auth.isAuthenticated && !auth.user)) {
    if (loadingFallback) return loadingFallback;
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  if (requiredRole && auth.user?.role?.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
