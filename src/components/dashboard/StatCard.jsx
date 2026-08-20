// High-Craft Metric Card (Linear / Vercel style)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './StatCard.css';

const useCountUp = (target, duration = 900) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number') return;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const StatCard = ({
  title,
  value,
  subvalue,
  icon,
  badgeText,
  badgeType = 'neutral',
  indicatorPct,
  indicatorColor = 'var(--accent-iris)',
  delay = 0,
  id,
}) => {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);
  const displayValue =
    typeof value === 'number' ? animatedValue.toLocaleString() : value;

  return (
    <motion.div
      id={id}
      className="craft-metric-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 350,
        damping: 30,
      }}
    >
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {icon && <div className="metric-icon-box">{icon}</div>}
      </div>

      <div className="metric-body">
        <div className="metric-value font-mono">{displayValue}</div>
        {subvalue && <span className="metric-subvalue font-mono">{subvalue}</span>}
      </div>

      <div className="metric-footer">
        {badgeText && (
          <span className={`metric-badge metric-badge-${badgeType} font-mono`}>
            {badgeText}
          </span>
        )}

        {indicatorPct !== undefined && (
          <div className="metric-mini-bar" title={`Occupancy: ${indicatorPct}%`}>
            <div
              className="metric-mini-fill"
              style={{
                width: `${Math.min(100, indicatorPct)}%`,
                backgroundColor: indicatorColor,
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
