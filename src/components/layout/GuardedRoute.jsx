// GuardedRoute — auth guards with Supabase session awareness
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

// Minimal full-screen spinner shown while Supabase resolves the session
const SessionLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-base, #0a0a0f)',
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: '3px solid rgba(99,102,241,0.2)',
      borderTopColor: '#6366F1',
      animation: 'spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Guard for routes requiring a logged-in user of a specific role
export const GuardedRoute = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuthStore();

  // While Supabase is resolving the persisted session, show spinner
  // (avoids flash-redirect to /login on hard refresh)
  if (isLoading) return <SessionLoader />;

  if (!user) return <Navigate to="/login" replace />;

  // 'any' allows any authenticated role (admin or participant)
  if (allowedRole && allowedRole !== 'any' && user.role !== allowedRole) {
    return user.role === 'admin'
      ? <Navigate to="/" replace />
      : <Navigate to="/portal" replace />;
  }

  return children;
};

// Guard to prevent logged-in users from accessing the login page again
export const AnonymousOnlyRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <SessionLoader />;

  if (user) {
    return user.role === 'admin'
      ? <Navigate to="/" replace />
      : <Navigate to="/portal" replace />;
  }

  return children;
};
