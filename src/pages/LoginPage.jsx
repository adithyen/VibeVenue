// Premium Login Page (Obsidian & Zinc Craft Aesthetics)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useUIStore from '../store/useUIStore';
import Button from '../components/ui/Button';
import './LoginPage.css';

// Real Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '628041736031-8pb4a2hkmm10n18t8fsvqquoj31euhlq.apps.googleusercontent.com';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading, error } = useAuthStore();
  const { addToast } = useUIStore();

  const [role, setRole] = useState('participant'); // 'participant' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const googleBtnRef = useRef(null);

  // Dynamic injection & rendering of official Google Identity Services SDK
  useEffect(() => {
    const renderGoogleBtn = () => {
      const btnContainer = document.getElementById('google-signin-btn');
      if (window.google && btnContainer) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: 380,
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
        });
      }
    };

    if (window.google) {
      renderGoogleBtn();
    } else {
      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleBtn;
        document.body.appendChild(script);
      }
    }
  }, [role]);

  const handleGoogleResponse = async (response) => {
    if (response.credential) {
      const success = await loginWithGoogle(response.credential, role);
      if (success) {
        addToast({
          type: 'success',
          title: 'Google Sign-In Success',
          message: `Logged in successfully as ${role === 'admin' ? 'Administrator' : 'Student Delegate'}.`,
        });
        navigate(role === 'admin' ? '/' : '/portal');
      }
    }
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password.');
      return;
    }

    const success = await login(email, password, role);
    if (success) {
      addToast({
        type: 'success',
        title: 'Login Success',
        message: `Welcome back! Redirecting to dashboard...`,
      });
      navigate(role === 'admin' ? '/' : '/portal');
    }
  };

  // Pre-fill helper for quick review and testing
  const handleQuickLogin = (type) => {
    if (type === 'admin') {
      setEmail('admin@campus.edu');
      setPassword('admin123');
      setRole('admin');
    } else {
      setEmail('student@campus.edu');
      setPassword('student123');
      setRole('participant');
    }
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
        {/* Brand Mark Header */}
        <div className="login-brand-header">
          <div className="login-brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#6366F1" fillOpacity="0.2"/>
              <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 12L12 16L20 12" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16L12 20L20 16" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-title font-display">CampusCore Gateway</h1>
          <p className="login-subtitle">Symposium & Technical Event Operations</p>
        </div>

        {/* Role Tab Switcher */}
        <div className="segmented-control role-switcher">
          <button
            className={`segmented-option ${role === 'participant' ? 'active' : ''}`}
            onClick={() => {
              setRole('participant');
              setFormError('');
            }}
            type="button"
          >
            Student Participant
          </button>
          <button
            className={`segmented-option ${role === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setRole('admin');
              setFormError('');
            }}
            type="button"
          >
            Faculty Admin
          </button>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleLocalSubmit}>
          <div className="form-field-group">
            <label htmlFor="login-email" className="craft-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="craft-input font-mono"
              placeholder={role === 'admin' ? 'admin@campus.edu' : 'student@campus.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Validation & Store errors */}
          {(formError || error) && (
            <div className="login-error-box font-mono">
              <span>⚠️</span>
              <p>{formError || error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            id="local-login-btn"
          >
            Sign In with Credentials
          </Button>
        </form>

        {/* Separator */}
        <div className="login-separator">
          <span className="separator-line" />
          <span className="separator-txt font-mono">OR CONTINUE WITH</span>
          <span className="separator-line" />
        </div>

        {/* Google Sign-In Target */}
        <div className="google-btn-wrapper">
          <div id="google-signin-btn" ref={googleBtnRef} />
        </div>

        {/* Demo Fast Login Guides */}
        <div className="demo-guide-box">
          <p className="demo-guide-title font-mono">DEMO CREDENTIALS</p>
          <div className="demo-actions">
            <button
              className="demo-btn font-mono"
              onClick={() => handleQuickLogin('student')}
              type="button"
              id="demo-student-login"
            >
              AS STUDENT
            </button>
            <button
              className="demo-btn font-mono"
              onClick={() => handleQuickLogin('admin')}
              type="button"
              id="demo-admin-login"
            >
              AS ADMIN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
