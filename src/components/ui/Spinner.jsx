// Spinner — loading indicator
import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'md', color, className = '', label = 'Loading...' }) => {
  const sizeMap = { xs: 16, sm: 24, md: 36, lg: 52, xl: 72 };
  const px = sizeMap[size] || 36;

  return (
    <div className={`spinner-wrapper ${className}`} role="status" aria-label={label}>
      <div
        className="spinner"
        style={{
          width: px,
          height: px,
          borderColor: color ? `${color}33` : 'rgba(0,212,255,0.2)',
          borderTopColor: color || '#00D4FF',
        }}
      />
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="spinner-fullpage">
    <Spinner size="lg" />
    <p className="spinner-text">Loading...</p>
  </div>
);

export default Spinner;
