import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Home, BookOpen, Menu, X, LogOut, LayoutDashboard, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { authAPI } from '../services/api';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { motionTokens } from '../lib/motion';

const AppNavbar = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const reducedMotion = useReducedMotion();
  const userMenuRef = useRef(null);
  const homeLinks = [{ to: '/', label: 'Home', icon: Home }, { to: '/courses', label: 'Courses', icon: BookOpen }];
  const learningPath = auth.user?.role === 'admin' ? '/admin/dashboard' : '/my-learning';
  const learningLabel = auth.user?.role === 'admin' ? 'Dashboard' : 'My learning';

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const updateScroll = () => setIsScrolled(window.scrollY > 8);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') { setMobileOpen(false); setUserMenuOpen(false); } };
    const closeOnOutsideClick = (event) => { if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => { window.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOnOutsideClick); };
  }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { /* Local sign-out still clears the current session. */ }
    dispatch(logout());
    setMobileOpen(false);
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className={`public-navbar${isScrolled ? ' public-navbar--scrolled' : ''}`} aria-label="Main navigation">
      <div className="public-navbar__inner public-container">
        <Link to="/" className="public-navbar__brand" onClick={() => setMobileOpen(false)}>CourseHub</Link>
        <div className="public-navbar__links">{homeLinks.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={location.pathname === to ? 'page' : undefined}><Icon size={17} aria-hidden="true" />{label}{location.pathname === to && <m.span className="public-navbar__active-indicator" layoutId="public-nav-active" transition={reducedMotion ? { duration: 0.01 } : motionTokens.springs.snappy} />}</Link>)}</div>
        <div className="public-navbar__account">
          {auth.isLoading ? <span className="public-navbar__auth-skeleton" aria-hidden="true" /> : auth.isAuthenticated ? <div className="public-user-menu" ref={userMenuRef}>
            <button type="button" className="public-user-menu__trigger" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen((open) => !open)}>{auth.user?.name || 'Account'}<ChevronDown size={15} /></button>
            <AnimatePresence>{userMenuOpen && <m.div className="public-user-menu__panel" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }} transition={{ duration: reducedMotion ? 0.01 : motionTokens.durations.fast, ease: motionTokens.easings.standard }}><p>{auth.user?.email}</p><Link to={learningPath}><LayoutDashboard size={16} />{learningLabel}</Link>{auth.user?.role === 'student' && <Link to="/dashboard/orders"><GraduationCap size={16} />Orders & receipts</Link>}<button type="button" onClick={handleLogout}><LogOut size={16} />Log out</button></m.div>}</AnimatePresence>
          </div> : <Link to="/login" className="public-navbar__signin">Sign in</Link>}
          <button type="button" className="public-navbar__toggle" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen}><AnimatePresence mode="wait" initial={false}><m.span key={mobileOpen ? 'close' : 'open'} className="public-navbar__toggle-icon" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 45, scale: 0.8 }} transition={{ duration: reducedMotion ? 0.01 : motionTokens.durations.fast }}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</m.span></AnimatePresence></button>
        </div>
      </div>
      <AnimatePresence>{mobileOpen && <m.div className="public-navbar__mobile-panel" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.96, y: -6 }} animate={{ opacity: 1, scaleY: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.98, y: -4 }} transition={{ duration: reducedMotion ? 0.01 : motionTokens.durations.base, ease: motionTokens.easings.standard }}><div className="public-container">{homeLinks.map(({ to, label, icon: Icon }, index) => <m.div key={to} initial={reducedMotion ? false : { opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : index * motionTokens.stagger }}><Link to={to}><Icon size={17} />{label}</Link></m.div>)}{auth.isLoading ? <span className="public-navbar__mobile-auth-skeleton" aria-hidden="true" /> : auth.isAuthenticated ? <><div className="public-navbar__mobile-user"><strong>{auth.user?.name}</strong><span>{auth.user?.email}</span></div><Link to={learningPath}><LayoutDashboard size={17} />{learningLabel}</Link>{auth.user?.role === 'student' && <Link to="/dashboard/orders"><GraduationCap size={17} />Orders & receipts</Link>}<button type="button" onClick={handleLogout}><LogOut size={17} />Log out</button></> : <Link to="/login">Sign in</Link>}</div></m.div>}</AnimatePresence>
    </nav>
  );
};

export default AppNavbar;
