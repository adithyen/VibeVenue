// App.jsx — root with router + layout
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import RegistrationsPage from './pages/RegistrationsPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/"                index element={<DashboardPage />} />
        <Route path="/events"          element={<EventsPage />} />
        <Route path="/events/:id"      element={<EventDetailPage />} />
        <Route path="/registrations"   element={<RegistrationsPage />} />
        <Route path="*"                element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
