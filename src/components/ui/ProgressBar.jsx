// Refined Capacity Meter & Progress Bar
import React from 'react';
import './ProgressBar.css';

const getColor = (pct) => {
  if (pct >= 98) return 'var(--accent-rose)';
  if (pct >= 80) return 'var(--accent-amber)';
  if (pct >= 50) return 'var(--accent-iris)';
  return 'var(--accent-emerald)';
};

const ProgressBar = ({
  current,
  total,
  showLabel = true,
  height = 5,
  className = '',
}) => {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const barColor = getColor(pct);

  return (
    <div className={`craft-progress ${className}`}>
      {showLabel && (
        <div className="craft-progress-meta">
          <span className="craft-progress-count font-mono">
            <strong>{current.toLocaleString()}</strong> / {total.toLocaleString()}
          </span>
          <span className="craft-progress-pct font-mono" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>
      )}
      <div
        className="craft-progress-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Registration capacity"
      >
        <div
          className="craft-progress-fill"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
