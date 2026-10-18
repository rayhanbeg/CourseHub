import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthLayout, { AuthError, AuthField, AuthSubmit } from '../components/AuthLayout';

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const emailError = touched && !validEmail(email) ? 'Enter a valid email address.' : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    setError('');
    if (!validEmail(email)) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'We couldn’t send a reset email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout quote="A wrong turn doesn’t erase how far you’ve already come." note="A note on returning">
    <div className="auth-heading"><p className="eyebrow">Account recovery</p><h1>Let’s get you<br />back in.</h1><p>Enter the email address linked to your account.</p></div>
    {sent ? <div className="auth-success" role="status"><span><Mail size={19} /></span><h2>Check your inbox.</h2><p>If an account exists for <strong>{email}</strong>, we’ll send a link to reset its password. The link expires in 30 minutes.</p><Link to="/login" className="auth-inline-link">Return to sign in</Link></div> : <>
      <AuthError>{error}</AuthError>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="recovery-email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} onBlur={() => setTouched(true)} error={emailError} />
        <AuthSubmit loading={loading} loadingLabel="Sending link…">Send reset link</AuthSubmit>
      </form>
      <p className="auth-form-footnote"><Link className="auth-inline-link" to="/login">Back to sign in</Link></p>
    </>}
  </AuthLayout>;
};

export default ForgotPassword;
