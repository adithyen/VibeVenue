// Clean Tactile Avatar
import React from 'react';
import './Avatar.css';

const TONES = [
  { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.3)' },
  { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
  { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' },
  { bg: 'rgba(244, 63, 94, 0.15)', text: '#FB7185', border: 'rgba(244, 63, 94, 0.3)' },
  { bg: 'rgba(6, 182, 212, 0.15)', text: '#38BDF8', border: 'rgba(6, 182, 212, 0.3)' },
  { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' },
];

const getTone = (str) => {
  if (!str) return TONES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TONES[Math.abs(hash) % TONES.length];
};

const Avatar = ({ name, initials, size = 'md', src, className = '' }) => {
  const tone = getTone(name || initials);
  const display =
    initials ||
    (name
      ? name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?');

  return (
    <div
      className={`craft-avatar craft-avatar-${size} ${className}`}
      style={
        src
          ? undefined
          : {
              backgroundColor: tone.bg,
              color: tone.text,
              borderColor: tone.border,
            }
      }
      title={name}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="craft-avatar-img" />
      ) : (
        <span className="craft-avatar-initials font-mono">{display}</span>
      )}
    </div>
  );
};

export default Avatar;
