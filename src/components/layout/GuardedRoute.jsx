// Router guards for authentication & role permissions
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

// Guard for routes requiring a logged-in user of a specific role
export const GuardedRoute = ({ children, allowedRole }) => {
  const { user } = useAuthStore();

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If user's role is not permitted:
    // Admin trying to access participant page -> redirect to dashboard (/)
    // Participant trying to access admin page -> redirect to portal (/portal)
    return user.role === 'admin' ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/portal" replace />
    );
  }

  return children;
};

// Guard to prevent logged-in users from accessing the login page again
export const AnonymousOnlyRoute = ({ children }) => {
  const { user } = useAuthStore();

  if (user) {
    // Redirect authenticated users to their respective homes
    return user.role === 'admin' ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/portal" replace />
    );
  }

  return children;
};
