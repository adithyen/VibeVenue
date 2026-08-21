// Live Attendee Activity Feed — Clickable rows with detail modal (v4.0)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getCategoryById } from '../../data/mockData';
import Avatar from '../ui/Avatar';
import './RecentRegistrations.css';

const RegistrationDetailModal = ({ reg, onClose }) => {
  if (!reg) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="reg-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="reg-modal-panel"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reg-modal-header">
            <h3 className="reg-modal-title">Registration Details</h3>
            <button className="reg-modal-close" onClick={onClose} type="button" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="reg-modal-body">
            <div className="reg-modal-avatar-row">
              <Avatar name={reg.name} initials={reg.initials} size="lg" />
              <div>
                <p className="reg-modal-name">{reg.name}</p>
                <p className="reg-modal-email font-mono">{reg.email || `${reg.studentId}@campus.edu`}</p>
              </div>
            </div>

            <div className="reg-modal-divider" />

            <div className="reg-modal-fields">
              <div className="reg-modal-field">
                <span className="reg-modal-field-label">Student ID</span>
                <span className="reg-modal-field-value font-mono">{reg.studentId}</span>
              </div>
              <div className="reg-modal-field">
                <span className="reg-modal-field-label">Event</span>
                <span className="reg-modal-field-value">{reg.eventName}</span>
              </div>
              <div className="reg-modal-field">
                <span className="reg-modal-field-label">Category</span>
                <span className="reg-modal-field-value">{getCategoryById(reg.eventCategory)?.label || reg.eventCategory}</span>
              </div>
              <div className="reg-modal-field">
                <span className="reg-modal-field-label">Registered</span>
                <span className="reg-modal-field-value font-mono">{new Date(reg.registeredAt).toLocaleString()}</span>
              </div>
              <div className="reg-modal-field">
                <span className="reg-modal-field-label">Status</span>
                <span className="reg-modal-status reg-status-complete">Completed</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const RecentRegistrations = ({ registrations }) => {
  const navigate = useNavigate();
  const [selectedReg, setSelectedReg] = useState(null);

  return (
    <>
      <div className="craft-card activity-card">
        <div className="activity-header">
          <div className="activity-title-group">
            <h3 className="activity-title">Recent Registrations</h3>
            <p className="activity-sub">Click a student to view details</p>
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
          {registrations.map((reg, idx) => (
            <motion.button
              key={reg.id}
              type="button"
              className="activity-item activity-item-btn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              whileHover={{ x: 2 }}
              onClick={() => setSelectedReg(reg)}
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
                <span className="activity-time font-mono">
                  {formatTimeAgo(reg.registeredAt)}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="activity-chevron">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {selectedReg && (
        <RegistrationDetailModal
          reg={selectedReg}
          onClose={() => setSelectedReg(null)}
        />
      )}
    </>
  );
};

export default RecentRegistrations;
