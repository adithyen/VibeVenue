// Precision TopBar with Breadcrumbs and Quick Triggers
import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import './TopBar.css';

const BREADCRUMB_MAP = {
  '/':              { section: 'Symposium Operations', current: 'Overview' },
  '/events':        { section: 'Operations',          current: 'Events Directory' },
  '/registrations': { section: 'Attendee Management', current: 'Registrations & Passes' },
};

const TopBar = ({ onAddEvent }) => {
  const { sidebarCollapsed } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isDetail = location.pathname.startsWith('/events/') && location.pathname !== '/events';
  const breadcrumb = isDetail
    ? { section: 'Events Directory', current: 'Event Specification' }
    : BREADCRUMB_MAP[location.pathname] || { section: 'Operations', current: 'Dashboard' };

  // Hotkey 'N' for New Event modal if not focused in an input
  useEffect(() => {
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
  }, [onAddEvent]);

  return (
    <header className={`craft-topbar ${sidebarCollapsed ? 'craft-topbar-collapsed' : ''}`}>
      {/* Left: Breadcrumbs */}
      <div className="topbar-breadcrumbs">
        <span className="breadcrumb-section">{breadcrumb.section}</span>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-current">{breadcrumb.current}</span>
      </div>

      {/* Right: Quick Telemetry & Actions */}
      <div className="topbar-actions">
        {/* Live Pulse Indicator */}
        <div className="telemetry-pill" title="Real-time event sync active">
          <span className="telemetry-dot" />
          <span className="telemetry-label font-mono">LIVE SYMPOSIUM</span>
        </div>

        {/* New Event CTA */}
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

        {/* Convener Profile */}
        <div className="convener-pill" title="Dr. Priya Sharma (CSE Dept Convener)">
          <Avatar name="Dr. Priya Sharma" size="sm" />
          <div className="convener-info">
            <span className="convener-name">Dr. Priya Sharma</span>
            <span className="convener-role">Faculty Convener</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
