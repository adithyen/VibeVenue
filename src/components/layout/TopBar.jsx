// Precision TopBar with dynamic user profiling and dropdown menus
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import './TopBar.css';


const BREADCRUMB_MAP = {
  '/':              { section: 'Symposium Operations', current: 'Overview' },
  '/events':        { section: 'Operations',          current: 'Events Directory' },
  '/registrations': { section: 'Attendee Management', current: 'Registrations & Passes' },
  '/portal':        { section: 'CampusCore Portal',    current: 'Student Dashboard' },
};

const TopBar = ({ onAddEvent }) => {
  const { sidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDetail = location.pathname.startsWith('/events/') && location.pathname !== '/events';
  const breadcrumb = isDetail
    ? { section: 'Events Directory', current: 'Event Specification' }
    : BREADCRUMB_MAP[location.pathname] || { section: 'Operations', current: 'Dashboard' };

  const isParticipant = user?.role === 'participant';

  // Hotkey 'N' for New Event modal if not focused in an input
  useEffect(() => {
    if (isParticipant) return;
    const handleKeyDown = (e) => {
      if (
        e.key.toLowerCase() === 'n' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        e.preventDefault();
        onAddEvent?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddEvent, isParticipant]);

  // Click outside listener to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  // If no user is logged in (e.g. during transitions), render fallback empty topbar
  if (!user) {
    return (
      <header className="craft-topbar topbar-participant">
        <div className="topbar-breadcrumbs">
          <span className="breadcrumb-current">CampusCore</span>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`craft-topbar ${
        isParticipant ? 'topbar-participant' : sidebarCollapsed ? 'craft-topbar-collapsed' : ''
      }`}
    >
      {/* Left: Breadcrumbs */}
      <div className="topbar-breadcrumbs">
        <span className="breadcrumb-section">{breadcrumb.section}</span>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-current">{breadcrumb.current}</span>
      </div>

      {/* Right: Actions */}
      <div className="topbar-actions">
        {/* Live Pulse Indicator */}
        <div className="telemetry-pill" title="Real-time operations synced">
          <span className="telemetry-dot" />
          <span className="telemetry-label font-mono">LIVE SYMPOSIUM</span>
        </div>

        {/* New Event CTA (Admins only) */}
        {!isParticipant && (
          <Button
            id="topbar-add-event-btn"
            variant="primary"
            size="sm"
            kbd="N"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            }
            onClick={onAddEvent}
          >
            New Event
          </Button>
        )}

        {/* Profile Pill Trigger */}
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <button
            className="convener-pill-interactive"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="Toggle profile menu"
            aria-expanded={dropdownOpen}
            type="button"
            id="profile-dropdown-trigger"
          >
            <Avatar name={user.name} initials={user.initials} src={user.avatar} size="sm" />
            <div className="convener-info">
              <span className="convener-name">{user.name}</span>
              <span className="convener-role">
                {user.role === 'admin' ? 'Faculty Convener' : 'Student Delegate'}
              </span>
            </div>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`dropdown-chevron ${dropdownOpen ? 'chevron-rotated' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Profile Menu Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="profile-dropdown-panel"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className="dropdown-user-details">
                  <p className="dropdown-username">{user.name}</p>
                  <p className="dropdown-email font-mono">{user.email}</p>
                </div>
                
                <div className="dropdown-divider" />
                
                <button
                  className="dropdown-action-item font-mono text-rose"
                  onClick={handleLogoutClick}
                  type="button"
                  id="dropdown-logout-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
