import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import '../pages/authPages.css';
import { AnimatePresence, m, motionTokens, Pressable, useReducedMotion } from '../lib/motion';

const AuthLayout = ({ children, quote = 'A little curiosity, practiced often, can take you somewhere new.', note = 'A note on learning' }) => (
  <div className="auth-experience">
    <main className="auth-layout">
      <section className="auth-form-side">
        <Link to="/" className="auth-brand"><span><BookOpen size={18} /></span>CourseHub</Link>
        <div className="auth-form-content">{children}</div>
        <Link to="/courses" className="auth-back-link">Browse the course collection <ArrowUpRight size={15} /></Link>
      </section>
      <aside className="auth-quote-panel" aria-label="CourseHub learning note">
        <div className="auth-quote-panel__top"><span>COURSEHUB</span><span>LEARNING NOTES · 01</span></div>
        <div className="auth-quote-panel__middle"><div className="auth-quote-mark" aria-hidden="true">“</div><blockquote>{quote}</blockquote><p>{note}</p></div>
        <div className="auth-quote-panel__art" aria-hidden="true"><span /><span /><span /><span /><span /></div>
        <Link to="/courses" className="auth-panel-link">Find your next course <ArrowUpRight size={15} /></Link>
      </aside>
    </main>
  </div>
);

export const AuthField = ({ id, label, icon: Icon, error, trailing, className = '', ...inputProps }) => {
  const reduced = useReducedMotion();
  return <div className={`auth-field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <div className={`auth-input-wrap ${error ? 'has-error' : ''}`}>
      {Icon && <Icon className="auth-field-icon" size={18} aria-hidden="true" />}
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
      {trailing}
    </div>
    <AnimatePresence initial={false}>{error && <m.p className="auth-field-error" id={`${id}-error`} initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -3 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.fast }}>{error}</m.p>}</AnimatePresence>
  </div>;
};

export const PasswordToggle = ({ shown, onToggle, id }) => (
  <button className="password-toggle" type="button" aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} aria-controls={id} onClick={onToggle}>{shown ? 'Hide' : 'Show'}</button>
);

export const AuthError = ({ children }) => {
  const reduced = useReducedMotion();
  return <AnimatePresence initial={false}>{children ? <m.div className="auth-form-error" role="alert" initial={reduced ? { opacity: 0 } : { opacity: 0, y: -5 }} animate={reduced ? { opacity: 1 } : { opacity: 1, x: [0, -3, 3, -2, 0], y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}>{children}</m.div> : null}</AnimatePresence>;
};

export const AuthSubmit = ({ loading, children, loadingLabel }) => (
  <Pressable className="auth-submit" type="submit" disabled={loading}>{loading ? <><span className="auth-spinner" aria-hidden="true" />{loadingLabel}</> : children}</Pressable>
);

export default AuthLayout;
