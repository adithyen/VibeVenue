// Avatar component
import React from 'react';
import './Avatar.css';

const COLORS = [
  '#00D4FF', '#00E676', '#A855F7', '#FF4757',
  '#FFB300', '#F72585', '#FF6B2B', '#4ECDC4',
];

const getColor = (str) => {
  if (!str) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

const Avatar = ({ name, initials, size = 'md', src, className = '' }) => {
  const color = getColor(name || initials);
  const display = initials || (name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?');

  const sizeMap = { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 };
  const px = sizeMap[size] || 44;

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{
        width: px,
        height: px,
        background: src ? undefined : `${color}22`,
        border: `2px solid ${color}44`,
        fontSize: px * 0.36,
        color,
      }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="avatar-img" />
      ) : (
        <span className="avatar-initials">{display}</span>
      )}
    </div>
  );
};

export default Avatar;
