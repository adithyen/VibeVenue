// EmptyState — zero results / error screens
import React from 'react';
import { motion } from 'framer-motion';
import './EmptyState.css';

const PRESETS = {
  noEvents: {
    icon: '🗓️',
    title: 'No Events Found',
    description: 'Try adjusting your filters or search term.',
  },
  noParticipants: {
    icon: '👥',
    title: 'No Participants Yet',
    description: 'Registrations will appear here once people sign up.',
  },
  noResults: {
    icon: '🔍',
    title: 'No Results',
    description: 'We couldn\'t find what you\'re looking for.',
  },
  error: {
    icon: '⚠️',
    title: 'Something Went Wrong',
    description: 'An error occurred. Please try again.',
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
  const preset_ = PRESETS[preset] || {};
  const _icon = icon || preset_.icon || '📭';
  const _title = title || preset_.title || 'Nothing here';
  const _description = description || preset_.description;

  return (
    <motion.div
      className={`empty-state ${compact ? 'empty-compact' : ''} ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="empty-icon">{_icon}</div>
      <h3 className="empty-title">{_title}</h3>
      {_description && <p className="empty-description">{_description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
