import React from 'react';
import './VibeVenueLogo.css';

/**
 * VibeVenue Unified Brand Mark & Iconography
 * 
 * Design Concept:
 * - "Vibe": Acoustic frequency waves + energetic neon pulse (Cyan & Violet)
 * - "Venue": Architectural convergence & portal gateway (Double-V Isometric Wings)
 * - Central Core: Glowing frequency diamond beacon representing live stage energy
 */
export const VibeVenueMark = ({ size = 28, className = '', idPrefix = 'vv' }) => {
  const gradPrimaryId = `${idPrefix}-primary-grad`;
  const gradAccentId = `${idPrefix}-accent-grad`;
  const gradBgId = `${idPrefix}-bg-grad`;
  const gradBorderId = `${idPrefix}-border-grad`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`vibevenue-mark-svg ${className}`}
      aria-label="VibeVenue Brand Icon"
    >
      <defs>
        {/* Obsidian Glass Background Gradient */}
        <linearGradient id={gradBgId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#141B2D" />
          <stop offset="60%" stopColor="#0B0F19" />
          <stop offset="100%" stopColor="#060913" />
        </linearGradient>

        {/* Outer Hairline Border Gradient */}
        <linearGradient id={gradBorderId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
        </linearGradient>

        {/* Left Wing (Vibe Pulse: Indigo to Violet) */}
        <linearGradient id={gradPrimaryId} x1="11" y1="14" x2="27" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="40%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Right Wing (Venue Portal: Cyber Cyan to Sky) */}
        <linearGradient id={gradAccentId} x1="37" y1="14" x2="21" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      {/* Squircle Badge Container */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="13"
        fill={`url(#${gradBgId})`}
        stroke={`url(#${gradBorderId})`}
        strokeWidth="1.5"
      />

      {/* Acoustic Frequency Arc (Vibe Soundwave) */}
      <path
        d="M17 11.5C19.1 9.8 21.4 9 24 9C26.6 9 28.9 9.8 31 11.5"
        stroke="#818CF8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      {/* Energy Beacon Core */}
      <circle cx="24" cy="12" r="2" fill="#38BDF8" />

      {/* Left Converging V-Wing (Vibe Wave) */}
      <path
        d="M11 15L24 38L27.5 31L18 15H11Z"
        fill={`url(#${gradPrimaryId})`}
      />

      {/* Right Converging V-Wing (Venue Portal) */}
      <path
        d="M37 15L24 38L20.5 31L30 15H37Z"
        fill={`url(#${gradAccentId})`}
      />

      {/* Center Stage Frequency Spark (Heartbeat Convergence) */}
      <path
        d="M24 19L20 27.5H28L24 19Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
    </svg>
  );
};

export const VibeVenueLogo = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'hero'
  showTagline = true,
  taglineText = 'Event Management Platform',
  className = '',
  markOnly = false,
}) => {
  const sizeConfig = {
    sm: { markSize: 22, titleClass: 'vv-text-sm' },
    md: { markSize: 30, titleClass: 'vv-text-md' },
    lg: { markSize: 38, titleClass: 'vv-text-lg' },
    hero: { markSize: 52, titleClass: 'vv-text-hero' },
  }[size] || { markSize: 30, titleClass: 'vv-text-md' };

  if (markOnly) {
    return <VibeVenueMark size={sizeConfig.markSize} className={className} />;
  }

  return (
    <div className={`vibevenue-brand-lockup ${size} ${className}`}>
      <div className="vibevenue-mark-wrapper">
        <VibeVenueMark size={sizeConfig.markSize} idPrefix={`vv-${size}`} />
      </div>
      <div className="vibevenue-brand-labels">
        <div className={`vibevenue-brand-name font-display ${sizeConfig.titleClass}`}>
          <span className="brand-vibe">Vibe</span>
          <span className="brand-venue">Venue</span>
        </div>
        {showTagline && (
          <span className="vibevenue-brand-sub font-mono">
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};

export default VibeVenueLogo;
