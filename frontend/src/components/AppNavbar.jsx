import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, LayoutDashboard, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const AppNavbar = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="text-xl font-extrabold text-primary">CourseHub</Link>

        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/" className="inline-flex items-center gap-1 text-slate-700 hover:text-primary"><Home className="w-4 h-4" /> Home</Link>
          <Link to="/courses" className="inline-flex items-center gap-1 text-slate-700 hover:text-primary"><BookOpen className="w-4 h-4" /> Courses</Link>
          {auth.isAuthenticated && (
            <Link to={auth.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="inline-flex items-center gap-1 text-slate-700 hover:text-primary"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {auth.isAuthenticated ? (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{auth.user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{auth.user?.email || ''}</p>
              </div>
              <button onClick={handleLogout} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="px-3 py-2 rounded-lg bg-primary text-white text-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;