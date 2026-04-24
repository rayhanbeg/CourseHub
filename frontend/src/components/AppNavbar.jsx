import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, LayoutDashboard, BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const AppNavbar = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setMobileOpen(false);
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/courses', label: 'Courses', icon: BookOpen },
  ];

  if (auth.isAuthenticated) {
    navItems.push({
      to: auth.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="text-lg sm:text-xl font-bold tracking-tight text-primary" onClick={() => setMobileOpen(false)}>CourseHub</Link>

        <div className="hidden md:flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="inline-flex items-center gap-1 text-slate-700 hover:text-primary">
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
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
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 text-slate-700"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AppNavbar;