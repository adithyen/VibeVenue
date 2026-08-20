// StatCard — animated metric card with neon glow
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './StatCard.css';

const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
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

const StatCard = ({ title, value, icon, trend, trendLabel, color = '#00D4FF', delay = 0, id }) => {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);
  const displayValue = typeof value === 'number' ? animatedValue.toLocaleString() : value;

  return (
    <motion.div
      id={id}
      className="stat-card"
      style={{ '--accent': color, '--accent-dim': `${color}18` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div className="stat-card-header">
        <p className="stat-card-title">{title}</p>
        <div className="stat-card-icon" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>

      <p className="stat-card-value font-mono" style={{ color }}>
        {displayValue}
      </p>

      {trend !== undefined && (
        <div className={`stat-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
          <span className="trend-arrow">{trend >= 0 ? '↑' : '↓'}</span>
          <span className="trend-value">{Math.abs(trend)}%</span>
          {trendLabel && <span className="trend-label">{trendLabel}</span>}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
