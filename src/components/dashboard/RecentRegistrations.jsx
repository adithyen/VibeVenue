// Live Attendee Activity Feed
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getCategoryById } from '../../data/mockData';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import './RecentRegistrations.css';

const RecentRegistrations = ({ registrations }) => {
  const navigate = useNavigate();

  return (
    <div className="craft-card activity-card">
      <div className="activity-header">
        <div className="activity-title-group">
          <h3 className="activity-title">Live Attendee Feed</h3>
          <p className="activity-sub">Latest student enrollments</p>
        </div>
        <button
          className="activity-view-all font-mono"
          onClick={() => navigate('/registrations')}
          type="button"
        >
          View All →
        </button>
      </div>

      <div className="activity-list">
        {registrations.map((reg, idx) => {
          const cat = getCategoryById(reg.eventCategory);
          return (
            <motion.div
              key={reg.id}
              className="activity-item"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
            >
              <Avatar name={reg.name} initials={reg.initials} size="sm" />
              
              <div className="activity-info">
                <div className="activity-name-row">
                  <span className="activity-name">{reg.name}</span>
                  <span className="activity-roll font-mono">{reg.studentId}</span>
                </div>
                <span className="activity-event-name" title={reg.eventName}>
                  {reg.eventName}
                </span>
              </div>

              <div className="activity-meta">
                <Badge status={reg.status} dot size="xs">
                  {reg.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </Badge>
                <span className="activity-time font-mono">
                  {formatTimeAgo(reg.registeredAt)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentRegistrations;
