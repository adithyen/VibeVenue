// RecentRegistrations — live feed table of recent registrations
import React from 'react';
import { motion } from 'framer-motion';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getCategoryById } from '../../data/mockData';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import './RecentRegistrations.css';

const RecentRegistrations = ({ registrations }) => {
  return (
    <div className="recent-regs">
      <div className="recent-regs-header">
        <h3 className="recent-regs-title">Recent Registrations</h3>
        <Badge dot variant="emerald" size="xs">Live</Badge>
      </div>

      <div className="recent-regs-list">
        {registrations.map((reg, i) => {
          const cat = getCategoryById(reg.eventCategory);
          return (
            <motion.div
              key={reg.id}
              className="recent-reg-item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Avatar name={reg.name} initials={reg.initials} size="sm" />
              <div className="recent-reg-info">
                <p className="recent-reg-name">{reg.name}</p>
                <p className="recent-reg-event" title={reg.eventName}>
                  {reg.eventName}
                </p>
              </div>
              <div className="recent-reg-meta">
                <span
                  className="recent-reg-cat"
                  style={{ color: cat.color, background: `${cat.color}18` }}
                >
                  {cat.icon} {cat.label}
                </span>
                <span className="recent-reg-time">{formatTimeAgo(reg.registeredAt)}</span>
              </div>
              <Badge status={reg.status} size="xs" dot />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentRegistrations;
