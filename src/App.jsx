// App.jsx — root with routing guards and layout portals
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import RegistrationsPage from './pages/RegistrationsPage';
import RegistrationDetailPage from './pages/RegistrationDetailPage';
import CheckInScannerPage from './pages/CheckInScannerPage';
import AttendancePage from './pages/AttendancePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import ParticipantPortal from './pages/ParticipantPortal';
import EventRegistrationPage from './pages/EventRegistrationPage';
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
      <Route
        path="/registrations/:id"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <RegistrationDetailPage />
            </Layout>
          </GuardedRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <CheckInScannerPage />
            </Layout>
          </GuardedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <GuardedRoute allowedRole="admin">
            <Layout>
              <AttendancePage />
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

      {/* Full-Page Event Registration Flow */}
      <Route
        path="/portal/register/:id"
        element={
          <GuardedRoute allowedRole="participant">
            <Layout>
              <EventRegistrationPage />
            </Layout>
          </GuardedRoute>
        }
      />

      {/* Settings (all authenticated users) */}
      <Route
        path="/settings"
        element={
          <GuardedRoute allowedRole="any">
            <Layout>
              <SettingsPage />
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
