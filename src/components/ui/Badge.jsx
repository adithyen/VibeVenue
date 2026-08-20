// Badge component — glowing status/category badges
import React from 'react';
import './Badge.css';

const VARIANT_MAP = {
  cyan:    { bg: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: 'rgba(0,212,255,0.3)' },
  emerald: { bg: 'rgba(0,230,118,0.12)', color: '#00E676', border: 'rgba(0,230,118,0.3)' },
  amber:   { bg: 'rgba(255,179,0,0.12)',  color: '#FFB300', border: 'rgba(255,179,0,0.3)' },
  crimson: { bg: 'rgba(255,71,87,0.12)',  color: '#FF4757', border: 'rgba(255,71,87,0.3)' },
  purple:  { bg: 'rgba(168,85,247,0.12)', color: '#A855F7', border: 'rgba(168,85,247,0.3)' },
  pink:    { bg: 'rgba(247,37,133,0.12)', color: '#F72585', border: 'rgba(247,37,133,0.3)' },
  orange:  { bg: 'rgba(255,107,43,0.12)', color: '#FF6B2B', border: 'rgba(255,107,43,0.3)' },
  teal:    { bg: 'rgba(78,205,196,0.12)', color: '#4ECDC4', border: 'rgba(78,205,196,0.3)' },
  muted:   { bg: 'rgba(136,153,187,0.12)', color: '#8899BB', border: 'rgba(136,153,187,0.2)' },
};

const STATUS_VARIANT = {
  upcoming:  'cyan',
  ongoing:   'emerald',
  completed: 'muted',
  cancelled: 'crimson',
  confirmed: 'emerald',
  pending:   'amber',
};

const CATEGORY_VARIANT = {
  'ai-ml':         'purple',
  'web-dev':       'cyan',
  'cybersecurity': 'crimson',
  'robotics':      'amber',
  'design':        'pink',
  'hackathon':     'emerald',
  'workshop':      'orange',
  'cultural':      'teal',
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
    'muted';

  const style = VARIANT_MAP[resolvedVariant] || VARIANT_MAP.muted;

  return (
    <span
      className={`badge badge-${size} ${className}`}
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {dot && (
        <span
          className="badge-dot"
          style={{ background: style.color, boxShadow: `0 0 6px ${style.color}` }}
        />
      )}
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
