// Linear / Raycast Inspired Craft Sidebar
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../store/useUIStore';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    id: 'nav-dashboard',
    path: '/',
    label: 'Overview',
    badge: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'nav-events',
    path: '/events',
    label: 'Events Directory',
    badge: '12',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'nav-registrations',
    path: '/registrations',
    label: 'Registrations & Passes',
    badge: 'Live',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <motion.aside
      className={`craft-sidebar ${sidebarCollapsed ? 'craft-sidebar-collapsed' : ''}`}
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
    >
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-badge-icon" title="CampusCore Symposium Engine">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#6366F1" fillOpacity="0.2"/>
            <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 12L12 16L20 12" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16L12 20L20 16" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              className="brand-text"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="brand-name-row">
                <span className="brand-name">CampusCore</span>
                <span className="brand-tag font-mono">v2.4</span>
              </div>
              <span className="brand-sub">Technical Fest 2026</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="nav-section-label">
          {!sidebarCollapsed && <span>MAIN</span>}
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.id}
              to={item.path}
              id={item.id}
              className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    className="nav-label"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.12 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {!sidebarCollapsed && item.badge && (
                <span className={`nav-badge font-mono ${item.badge === 'Live' ? 'nav-badge-live' : ''}`}>
                  {item.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  className="nav-active-pip"
                  layoutId="sidebar-active-pip"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Shortcuts & Collapse Footer */}
      <div className="sidebar-footer">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              className="sidebar-shortcuts-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="shortcut-row">
                <span className="shortcut-desc">Search</span>
                <span className="kbd-badge font-mono">/</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">New Event</span>
                <span className="kbd-badge font-mono">N</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          id="sidebar-toggle-btn"
          className="collapse-btn"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
          >
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {!sidebarCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
