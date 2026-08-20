// App.jsx — root with routing guards and layout portals
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import RegistrationsPage from './pages/RegistrationsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import ParticipantPortal from './pages/ParticipantPortal';
import { GuardedRoute, AnonymousOnlyRoute } from './components/layout/GuardedRoute';

const App = () => {
  return (
    <Routes>
      {/* Anonymous Guest Route */}
      <Route
        path="/login"
        element={
          <AnonymousOnlyRoute>
            <LoginPage />
          </AnonymousOnlyRoute>
        }
      />

      {/* Admin Operations Control Console */}
      <Route
        path="/"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <DashboardPage />
            </Layout>
          </GuardedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <EventsPage />
            </Layout>
          </GuardedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <EventDetailPage />
            </Layout>
          </GuardedRoute>
        }
      />
      <Route
        path="/registrations"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <RegistrationsPage />
            </Layout>
          </GuardedRoute>
        }
      />

      {/* Participant Personal Dashboard */}
      <Route
        path="/portal"
        element={
          <GuardedRoute allowedRole="participant">
            <Layout>
              <ParticipantPortal />
            </Layout>
          </GuardedRoute>
        }
      />

      {/* Fallback Catch-all Route */}
      <Route
        path="*"
        element={
          <Layout>
            <NotFoundPage />
          </Layout>
        }
      />
    </Routes>
  );
};

export default App;
