import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Lock, Mail } from 'lucide-react';
import { loginSuccess, setError as setAuthError } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthLayout, { AuthError, AuthField, AuthSubmit, PasswordToggle } from '../components/AuthLayout';

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordShown, setPasswordShown] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailError = touched.email && (!email.trim() ? 'Enter your email address.' : !validEmail(email) ? 'Enter a valid email address.' : '');
  const passwordError = touched.password && !password ? 'Enter your password.' : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setError('');
    if (!email.trim() || !validEmail(email)) return;
    if (!password) return;

    setLoading(true);
    try {
      const { data } = await authAPI.login({ email: email.trim(), password });
      dispatch(loginSuccess(data));
      const requestedPath = location.state?.from;
      const destination = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'We couldn’t sign you in. Check your details and try again.';
      setError(message);
      dispatch(setAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout quote="A little curiosity, practiced often, can take you somewhere new." note="A note on learning">
    <div className="auth-heading"><p className="eyebrow">Welcome back</p><h1>Pick up where<br /><em>you left off.</em></h1><p>Sign in to continue learning.</p></div>
    <AuthError>{error}</AuthError>
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <AuthField id="login-email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} onBlur={() => setTouched((prev) => ({ ...prev, email: true }))} error={emailError} />
      <AuthField id="login-password" label="Password" icon={Lock} type={passwordShown ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} onBlur={() => setTouched((prev) => ({ ...prev, password: true }))} error={passwordError} trailing={<PasswordToggle id="login-password" shown={passwordShown} onToggle={() => setPasswordShown((shown) => !shown)} />} />
      <div className="auth-forgot-row"><Link className="auth-inline-link" to="/forgot-password">Forgot password?</Link></div>
      <AuthSubmit loading={loading} loadingLabel="Signing in…">Sign in</AuthSubmit>
    </form>
    <p className="auth-form-footnote">New to CourseHub? <Link className="auth-inline-link" to="/register" state={location.state}>Create an account</Link></p>
  </AuthLayout>;
};

export default Login;
