import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Lock, Mail, User } from 'lucide-react';
import { registerSuccess, setError as setAuthError } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthLayout, { AuthError, AuthField, AuthSubmit, PasswordToggle } from '../components/AuthLayout';

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fieldErrors = {
    name: touched.name && (!name.trim() ? 'Enter your name.' : name.trim().length > 50 ? 'Your name must be 50 characters or fewer.' : ''),
    email: touched.email && (!email.trim() ? 'Enter your email address.' : !validEmail(email) ? 'Enter a valid email address.' : ''),
    password: touched.password && password.length < 6 ? 'Use at least 6 characters.' : '',
    confirmation: touched.confirmation && confirmPassword !== password ? 'Your passwords don’t match.' : '',
  };
  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const allTouched = { name: true, email: true, password: true, confirmation: true };
    setTouched(allTouched);
    setError('');
    if (!name.trim() || name.trim().length > 50 || !validEmail(email) || password.length < 6 || password !== confirmPassword) return;

    setLoading(true);
    try {
      const { data } = await authAPI.register({ name: name.trim(), email: email.trim(), password });
      dispatch(registerSuccess(data));
      const requestedPath = location.state?.from;
      const destination = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'We couldn’t create your account. Please try again.';
      setError(message);
      dispatch(setAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout quote="Every new skill begins with one small, deliberate step." note="A note on beginning">
    <div className="auth-heading"><p className="eyebrow">Make a little room to grow</p><h1>Start with<br /><em>a question.</em></h1><p>Create your account and find a course to begin.</p></div>
    <AuthError>{error}</AuthError>
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <AuthField id="register-name" label="Full name" icon={User} type="text" autoComplete="name" placeholder="Your name" value={name} maxLength={50} onChange={(event) => { setName(event.target.value); setError(''); }} onBlur={() => touch('name')} error={fieldErrors.name} />
      <AuthField id="register-email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} onBlur={() => touch('email')} error={fieldErrors.email} />
      <AuthField id="register-password" label="Password" icon={Lock} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} onBlur={() => touch('password')} error={fieldErrors.password} trailing={<PasswordToggle id="register-password" shown={showPassword} onToggle={() => setShowPassword((shown) => !shown)} />} />
      <AuthField id="register-confirm-password" label="Confirm password" icon={Lock} type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} onBlur={() => touch('confirmation')} error={fieldErrors.confirmation} trailing={<PasswordToggle id="register-confirm-password" shown={showConfirmation} onToggle={() => setShowConfirmation((shown) => !shown)} />} />
      <AuthSubmit loading={loading} loadingLabel="Creating your account…">Create account</AuthSubmit>
    </form>
    <p className="auth-form-footnote">Already have an account? <Link className="auth-inline-link" to="/login">Sign in</Link></p>
  </AuthLayout>;
};

export default Register;
