import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, Menu, ShoppingBag, Users, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { authAPI } from '../services/api';
import styles from './AdminLayout.module.css';
import { Suspense } from 'react';
import { PageTransition } from '../lib/motion';
import { m, useReducedMotion } from 'framer-motion';
import { motionTokens } from '../lib/motion';

const navigation = [
  { key: 'overview', label: 'Overview', to: '/admin/dashboard', Icon: LayoutDashboard },
  { key: 'courses', label: 'Courses', to: '/admin/dashboard/courses', Icon: BookOpen },
  { key: 'orders', label: 'Orders', to: '/admin/dashboard/orders', Icon: ShoppingBag },
  { key: 'students', label: 'Students', to: '/admin/dashboard/students', Icon: Users },
];

const getTitle = (pathname) => {
  if (pathname.includes('/dashboard/courses')) return 'Courses';
  if (pathname.includes('/dashboard/orders')) return 'Orders';
  if (pathname.includes('/dashboard/students')) return 'Students';
  if (pathname.includes('/create-course')) return 'Create course';
  if (pathname.includes('/edit-course')) return 'Edit course';
  return 'Overview';
};

export default function AdminLayout() {
  const auth = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const reduced = useReducedMotion();
  const title = getTitle(location.pathname);
  const isOverview = location.pathname === '/admin/dashboard';
  const range = searchParams.get('range') || '30d';

  useEffect(() => { setIsOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { /* Clear local UI state even if the API is unreachable. */ }
    dispatch(logout());
  };

  return <div className={styles.shell}>
    <button type="button" className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`} aria-label="Close admin navigation" onClick={() => setIsOpen(false)} />
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Admin sidebar">
      <div className={styles.brandRow}><Link to="/" className={styles.brand}>CourseHub<span>Admin</span></Link><button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close admin navigation"><X size={18} /></button></div>
      <p className={styles.navCaption}>Workspace</p>
      <nav className={styles.nav} aria-label="Admin navigation">
        {navigation.map(({ key, label, to, Icon }) => <NavLink key={key} to={to} end={key === 'overview'} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>{({ isActive }) => <><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{isActive && <m.span layoutId="admin-nav-active" className={styles.navIndicator} transition={reduced ? { duration: 0.01 } : motionTokens.springs.snappy} />}</>}</NavLink>)}
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}><div className={styles.avatar}>{(auth.user?.name || 'A').slice(0, 1).toUpperCase()}</div><div className={styles.userText}><span className={styles.userName}>{auth.user?.name || 'Administrator'}</span><span className={styles.userEmail}>{auth.user?.email || ''}</span></div><button type="button" className={styles.logoutButton} onClick={handleLogout} aria-label="Log out" title="Log out"><LogOut size={16} /></button></div>
        <Link to="/" className={styles.backLink}>Back to site</Link>
      </div>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}><button type="button" className={styles.menuButton} onClick={() => setIsOpen(true)} aria-label="Open admin navigation"><Menu size={20} /></button><div className={styles.breadcrumb}><span>Admin</span><span aria-hidden="true">/</span><strong>{title}</strong></div></div>
        <div className={styles.topbarRight}>{isOverview && <label className={styles.periodSelect}><select aria-label="Dashboard period" value={range} onChange={(event) => setSearchParams({ range: event.target.value })}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="12m">Last 12 months</option></select><ChevronDown size={14} /></label>}<div className={styles.topAvatar}>{(auth.user?.name || 'A').slice(0, 1).toUpperCase()}</div></div>
      </header>
      <main className={styles.page}><PageTransition><Suspense fallback={<div className={styles.loading} role="status">Loading workspace…</div>}><Outlet /></Suspense></PageTransition></main>
    </div>
  </div>;
}
