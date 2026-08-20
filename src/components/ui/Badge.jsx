// Micro-Badge Component (Craft & Taste Standards)
import React from 'react';
import './Badge.css';

const VARIANT_MAP = {
  iris:    { bg: 'rgba(99, 102, 241, 0.10)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.22)', dot: '#6366F1' },
  emerald: { bg: 'rgba(16, 185, 129, 0.10)', color: '#34D399', border: 'rgba(16, 185, 129, 0.22)', dot: '#10B981' },
  amber:   { bg: 'rgba(245, 158, 11, 0.10)',  color: '#FBBF24', border: 'rgba(245, 158, 11, 0.22)',  dot: '#F59E0B' },
  rose:    { bg: 'rgba(244, 63, 94, 0.10)',  color: '#FB7185', border: 'rgba(244, 63, 94, 0.22)',  dot: '#F43F5E' },
  cyan:    { bg: 'rgba(6, 182, 212, 0.10)',   color: '#38BDF8', border: 'rgba(6, 182, 212, 0.22)',   dot: '#06B6D4' },
  violet:  { bg: 'rgba(139, 92, 246, 0.10)', color: '#A78BFA', border: 'rgba(139, 92, 246, 0.22)', dot: '#8B5CF6' },
  zinc:    { bg: 'rgba(255, 255, 255, 0.05)',color: '#D1D5DB', border: 'rgba(255, 255, 255, 0.10)',dot: '#9CA3AF' },
};

const STATUS_VARIANT = {
  upcoming:  'iris',
  ongoing:   'emerald',
  completed: 'zinc',
  cancelled: 'rose',
  confirmed: 'emerald',
  pending:   'amber',
  waitlist:  'cyan',
};

const CATEGORY_VARIANT = {
  'ai-ml':         'violet',
  'web-dev':       'iris',
  'cybersecurity': 'rose',
  'robotics':      'amber',
  'design':        'cyan',
  'hackathon':     'emerald',
  'workshop':      'amber',
  'cultural':      'iris',
};

const Badge = ({
  children,
  variant,
  status,
  category,
  dot = false,
  size = 'sm',
  icon,
  className = '',
}) => {
  const resolvedVariant =
    variant ||
    (status ? STATUS_VARIANT[status] : null) ||
    (category ? CATEGORY_VARIANT[category] : null) ||
    'zinc';

  const style = VARIANT_MAP[resolvedVariant] || VARIANT_MAP.zinc;

  return (
    <span
      className={`craft-badge craft-badge-${size} ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.color,
        borderColor: style.border,
      }}
    >
      {dot && (
        <span
          className="craft-badge-dot"
          style={{ backgroundColor: style.dot }}
          aria-hidden="true"
        />
      )}
      {icon && <span className="craft-badge-icon">{icon}</span>}
      <span className="craft-badge-text">{children}</span>
    </span>
  );
};

export default Badge;
