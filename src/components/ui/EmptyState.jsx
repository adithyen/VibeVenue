// Clean Empty State Component
import React from 'react';
import { motion } from 'framer-motion';
import './EmptyState.css';

const PRESETS = {
  noEvents: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'No events found',
    description: 'There are no events matching your active filters or search query.',
  },
  noParticipants: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'No registrations yet',
    description: 'Student registrations will appear here once attendees enroll.',
  },
  noResults: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'No matching records',
    description: 'Try adjusting your search terms or clearing current filter tags.',
  },
};

const EmptyState = ({
  preset,
  icon,
  title,
  description,
  action,
  className = '',
  compact = false,
}) => {
  const presetConfig = PRESETS[preset] || {};
  const displayIcon = icon || presetConfig.icon;
  const displayTitle = title || presetConfig.title || 'No data found';
  const displayDescription = description || presetConfig.description;

  return (
    <motion.div
      className={`craft-empty ${compact ? 'craft-empty-compact' : ''} ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {displayIcon && <div className="craft-empty-icon">{displayIcon}</div>}
      <h4 className="craft-empty-title">{displayTitle}</h4>
      {displayDescription && (
        <p className="craft-empty-desc">{displayDescription}</p>
      )}
      {action && <div className="craft-empty-action">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
