import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout, { AuthError, AuthField, AuthSubmit, PasswordToggle } from '../components/AuthLayout';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const passwordError = touched.password && password.length < 6 ? 'Use at least 6 characters.' : '';
  const confirmationError = touched.confirmation && confirmation !== password ? 'Your passwords don’t match.' : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ password: true, confirmation: true });
    setError('');
    if (!email || !token) { setError('This reset link is incomplete. Request a new one.'); return; }
    if (password.length < 6 || password !== confirmation) return;
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ email, token, password });
      setSuccess(true);
      setError(data.message || 'Password updated. You can now sign in.');
    } catch (err) {
      setError(err.response?.data?.message || 'We couldn’t reset your password. Request a new link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout quote="You can begin again without beginning from scratch." note="A note on progress">
    <div className="auth-heading"><p className="eyebrow">Choose a new password</p><h1>A fresh start<br />for your account.</h1><p>Use at least six characters for your new password.</p></div>
    {success ? <div className="auth-success" role="status"><h2>Password updated.</h2><p>{error}</p><Link to="/login" className="auth-button-link">Continue to sign in</Link></div> : <>
      <AuthError>{error}</AuthError>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="reset-password" label="New password" icon={Lock} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} onBlur={() => setTouched((prev) => ({ ...prev, password: true }))} error={passwordError} trailing={<PasswordToggle id="reset-password" shown={showPassword} onToggle={() => setShowPassword((shown) => !shown)} />} />
        <AuthField id="reset-confirm-password" label="Confirm new password" icon={Lock} type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter it once more" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} onBlur={() => setTouched((prev) => ({ ...prev, confirmation: true }))} error={confirmationError} trailing={<PasswordToggle id="reset-confirm-password" shown={showConfirmation} onToggle={() => setShowConfirmation((shown) => !shown)} />} />
        <AuthSubmit loading={loading} loadingLabel="Updating password…">Update password</AuthSubmit>
      </form>
      <p className="auth-form-footnote">Need a new link? <Link className="auth-inline-link" to="/forgot-password">Request another</Link></p>
    </>}
  </AuthLayout>;
};

export default ResetPassword;
