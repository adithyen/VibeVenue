// TopBar — fixed header with search, title, and actions
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUIStore from '../../store/useUIStore';
import Button from '../ui/Button';
import './TopBar.css';

const PAGE_META = {
  '/':              { title: 'Dashboard',        subtitle: 'Welcome back, Admin 👋' },
  '/events':        { title: 'Events',           subtitle: 'Browse and manage all events' },
  '/registrations': { title: 'Registrations',    subtitle: 'View and manage participant registrations' },
};

const getPageMeta = (pathname) => {
  if (pathname.startsWith('/events/')) return { title: 'Event Details', subtitle: 'Detailed event information' };
  return PAGE_META[pathname] || { title: 'EventFlow', subtitle: '' };
};

const TopBar = ({ onAddEvent }) => {
  const { sidebarCollapsed } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getPageMeta(location.pathname);

  return (
    <header
      className={`topbar ${sidebarCollapsed ? 'topbar-collapsed' : ''}`}
    >
      <div className="topbar-left">
        <div>
          <h1 className="topbar-title">{meta.title}</h1>
          <p className="topbar-subtitle">{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Add Event */}
        <Button
          id="topbar-add-event"
          variant="primary"
          size="sm"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          }
          onClick={() => onAddEvent?.()}
        >
          Add Event
        </Button>

        {/* Notifications bell */}
        <button className="topbar-icon-btn" aria-label="Notifications" id="topbar-notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span className="topbar-notif-dot" />
        </button>

        {/* Profile avatar */}
        <button className="topbar-avatar" id="topbar-profile" aria-label="Profile menu">
          <span className="topbar-avatar-initials">AD</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
