// Layout — main app shell with sidebar + topbar + mobile nav
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from '../ui/Toast';
import EventForm from '../forms/EventForm';
import Modal from '../ui/Modal';
import useUIStore from '../../store/useUIStore';
import './Layout.css';

const MOBILE_NAV = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    path: '/events',
    label: 'Events',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M3 9h18M8 2v3M16 2v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/registrations',
    label: 'Registrations',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const Layout = ({ children }) => {
  const { sidebarCollapsed } = useUIStore();
  const [formOpen, setFormOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      <div className="bg-orbs" />

      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Top Bar */}
      <TopBar onAddEvent={() => setFormOpen(true)} />

      {/* Main content */}
      <main
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="page-wrapper">{children}</div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {MOBILE_NAV.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? 'bottom-nav-active' : ''}`}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
        <button
          className="bottom-nav-item"
          onClick={() => setFormOpen(true)}
          id="mobile-add-event"
          aria-label="Add event"
        >
          <span className="bottom-nav-add">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="bottom-nav-label">Add Event</span>
        </button>
      </nav>

      {/* Add Event Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add New Event"
        size="lg"
      >
        <EventForm onClose={() => setFormOpen(false)} />
      </Modal>

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
};

export default Layout;
