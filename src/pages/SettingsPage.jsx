// VibeVenue — Settings Page with Theme Control
import React from 'react';
import { motion } from 'framer-motion';
import useUIStore from '../store/useUIStore';
import './SettingsPage.css';

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light',
    desc: 'Clean & bright. Great for daylight use.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    desc: 'Easy on the eyes at night.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="settings-view">
      <div className="page-header">
        <div className="page-title-group">
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your VibeVenue preferences</p>
        </div>
      </div>

      <div className="settings-sections">
        {/* Appearance */}
        <motion.section
          className="settings-section craft-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <div>
              <h3 className="settings-section-title">Appearance</h3>
              <p className="settings-section-sub">Choose how VibeVenue looks for you</p>
            </div>
          </div>

          <div className="theme-picker-grid">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  id={`theme-option-${opt.id}`}
                  type="button"
                  className={`theme-option ${isSelected ? 'theme-option-selected' : ''}`}
                  onClick={() => setTheme(opt.id)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className={`theme-preview theme-preview-${opt.id}`}>
                    <div className="theme-preview-bar" />
                    <div className="theme-preview-content">
                      <div className="theme-preview-line long" />
                      <div className="theme-preview-line short" />
                    </div>
                  </div>
                  <div className="theme-option-info">
                    <div className="theme-option-icon">{opt.icon}</div>
                    <div>
                      <span className="theme-option-label">{opt.label}</span>
                      <span className="theme-option-desc">{opt.desc}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      className="theme-option-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* About */}
        <motion.section
          className="settings-section craft-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 className="settings-section-title">About</h3>
              <p className="settings-section-sub">Platform information</p>
            </div>
          </div>
          <div className="settings-about-row">
            <span className="settings-about-label">App Name</span>
            <span className="settings-about-value font-mono">VibeVenue</span>
          </div>
          <div className="settings-about-row">
            <span className="settings-about-label">Version</span>
            <span className="settings-about-value font-mono">v4.0.0</span>
          </div>
          <div className="settings-about-row">
            <span className="settings-about-label">Purpose</span>
            <span className="settings-about-value">College Technical Event Management</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SettingsPage;
