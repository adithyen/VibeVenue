// ProgressBar — animated capacity indicator
import React from 'react';
import './ProgressBar.css';

const getColor = (pct) => {
  if (pct >= 95) return '#FF4757';
  if (pct >= 80) return '#FFB300';
  if (pct >= 60) return '#00D4FF';
  return '#00E676';
};

const ProgressBar = ({ current, total, showLabel = true, height = 6, className = '' }) => {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const color = getColor(pct);

  return (
    <div className={`progress-wrapper ${className}`}>
      {showLabel && (
        <div className="progress-label">
          <span className="progress-count" style={{ color }}>
            {current.toLocaleString()} / {total.toLocaleString()}
          </span>
          <span className="progress-pct" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div
        className="progress-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Registration capacity"
      >
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 10px ${color}55`,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
