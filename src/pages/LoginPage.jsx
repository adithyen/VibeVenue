// LoginPage — Supabase Auth (email/password + Google OAuth + Sign Up)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useUIStore from '../store/useUIStore';
import Button from '../components/ui/Button';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login, signUp, loginWithGoogle, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUIStore();

  const [mode, setMode]       = useState('login');  // 'login' | 'signup'
  const [role, setRole]       = useState('admin');  // 'admin' | 'participant'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [formError, setFormError] = useState('');

  // Auto-redirect if session is active (e.g. from Google OAuth redirect)
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/' : '/portal', { replace: true });
    }
  }, [user, navigate]);

  // Check for URL OAuth errors (e.g. Supabase code exchange failure)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const errorDesc = params.get('error_description') || hashParams.get('error_description');
    if (errorDesc) {
      const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
      setFormError(`Google Sign-In: ${decoded}`);
      addToast({
        type: 'warning',
        title: 'Google Sign-In Failed',
        message: decoded.includes('exchange')
          ? 'Google Client Secret in Supabase is invalid. Please update it in Supabase Providers.'
          : decoded,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addToast]);

  const switchMode = (m) => { setMode(m); setFormError(''); clearError(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setFormError('Please enter your name.');
      return;
    }

    if (mode === 'login') {
      const success = await login(email, password);
      if (success) {
        addToast({ type: 'success', title: 'Welcome back!', message: 'Redirecting...' });
        const { user } = useAuthStore.getState();
        navigate(user?.role === 'admin' ? '/' : '/portal');
      }
    } else {
      const result = await signUp(email, password, role, { name });
      if (result === true) {
        addToast({ type: 'success', title: 'Account Created!', message: 'Welcome to VibeVenue 🎉' });
        const { user } = useAuthStore.getState();
        navigate(user?.role === 'admin' ? '/' : '/portal');
      } else if (result === 'confirm-email') {
        addToast({ type: 'info', title: 'Check your email', message: 'We sent you a confirmation link.' });
      }
    }
  };

  const handleGoogle = async () => {
    await loginWithGoogle(role);
    // OAuth redirects — page will reload with session
  };

  return (
    <div className="login-view">
      <div className="bg-orbs" />

      <motion.div
        className="login-card-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      >
        {/* Brand */}
        <div className="login-brand-header">
          <div className="login-brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#6366F1" fillOpacity="0.2"/>
              <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 12L12 16L20 12" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16L12 20L20 16" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-title font-display">VibeVenue</h1>
          <p className="login-subtitle">Event Management Platform</p>
        </div>

        {/* Mode tabs */}
        <div className="segmented-control role-switcher" style={{ marginBottom: '1.25rem' }}>
          <button className={`segmented-option ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')} type="button">Sign In</button>
          <button className={`segmented-option ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')} type="button">Create Account</button>
        </div>

        {/* Role selector — only shown when creating a new account */}
        <AnimatePresence mode="wait">
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '1rem' }}
            >
              <div className="segmented-control role-switcher">
                <button className={`segmented-option ${role === 'participant' ? 'active' : ''}`} onClick={() => setRole('participant')} type="button">Student Participant</button>
                <button className={`segmented-option ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')} type="button">Event Organizer</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                key="name-field"
                className="form-field-group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <label htmlFor="login-name" className="craft-label">Full Name</label>
                <input
                  id="login-name"
                  type="text"
                  className="craft-input"
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-field-group">
            <label htmlFor="login-email" className="craft-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="craft-input font-mono"
              placeholder="you@campus.edu"
              value={email}
              onChange={e => { setEmail(e.target.value); setFormError(''); }}
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="login-password" className="craft-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="craft-input font-mono"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setFormError(''); }}
            />
          </div>

          {(formError || error) && (
            <div className="login-error-box font-mono">
              <span>⚠️</span>
              <p>{formError || error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={isLoading} id="local-login-btn">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Separator */}
        <div className="login-separator">
          <span className="separator-line" />
          <span className="separator-txt font-mono">OR CONTINUE WITH</span>
          <span className="separator-line" />
        </div>

        {/* Google OAuth */}
        <div className="google-btn-wrapper">
          <button
            type="button"
            className="google-oauth-btn"
            onClick={handleGoogle}
            disabled={isLoading}
            id="google-oauth-btn"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
