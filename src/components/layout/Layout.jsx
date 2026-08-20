// Main App Layout Shell with Role-based Context rendering
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from '../ui/Toast';
import Modal from '../ui/Modal';
import EventForm from '../forms/EventForm';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import './Layout.css';

const MOBILE_NAV = [
  {
    path: '/',
    label: 'Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    path: '/events',
    label: 'Events',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    path: '/registrations',
    label: 'Registrations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const Layout = ({ children }) => {
  const { sidebarCollapsed } = useUIStore();
  const { user } = useAuthStore();
  const [formOpen, setFormOpen] = useState(false);
  const location = useLocation();

  const isParticipant = user?.role === 'participant';

  return (
    <div className="app-layout">
      {/* Desktop Sidebar (Only render for non-participants / Admin roles) */}
      {!isParticipant && <Sidebar />}

      {/* Top Header */}
      <TopBar onAddEvent={() => setFormOpen(true)} />

      {/* Main Page Area */}
      <main
        className={`main-content ${
          isParticipant ? 'participant-layout' : sidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="page-container">{children}</div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation (Only render for non-participants / Admin roles) */}
      {!isParticipant && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          {MOBILE_NAV.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`mobile-nav-btn ${isActive ? 'mobile-nav-btn-active' : ''}`}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </NavLink>
            );
          })}

          <button
            className="mobile-nav-btn mobile-nav-add"
            onClick={() => setFormOpen(true)}
            aria-label="Create Event"
            type="button"
          >
            <span className="mobile-add-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            <span className="mobile-nav-label">New Event</span>
          </button>
        </nav>
      )}

      {/* Global Add Event Dialog */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Schedule New Event"
        subtitle="Configure event metadata, capacity limits, and session schedules"
        size="lg"
      >
        <EventForm onClose={() => setFormOpen(false)} />
      </Modal>

      {/* Toast Notification Container */}
      <Toast />
    </div>
  );
};

export default Layout;
