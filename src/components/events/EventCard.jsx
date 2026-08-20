// High-Craft Event Card Component
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategoryById } from '../../data/mockData';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { formatDate } from '../../utils/dateUtils';
import './EventCard.css';

const EventCard = ({ event, delay = 0 }) => {
  const navigate = useNavigate();
  const cat = getCategoryById(event.category);
  const occupancyPct = Math.round(
    (event.registrationCount / event.maxParticipants) * 100
  );

  return (
    <motion.article
      className="craft-card craft-card-interactive craft-event-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(delay, 0.3),
        type: 'spring',
        stiffness: 380,
        damping: 28,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/events/${event.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/events/${event.id}`);
        }
      }}
      aria-label={`View details for ${event.name}`}
    >
      {/* Top Meta: Domain Tag & Status */}
      <div className="event-card-top">
        <Badge category={event.category} size="xs" icon={cat.icon}>
          {cat.label}
        </Badge>
        
        <div className="event-card-status-box">
          <Badge status={event.status} dot size="xs">
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Main Info */}
      <div className="event-card-main">
        <h3 className="event-card-title">{event.name}</h3>
        <p className="event-card-desc">
          {event.shortDescription || event.description}
        </p>
      </div>

      {/* Logistics Pills */}
      <div className="event-logistics">
        <div className="logistic-item" title="Event Schedule">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{formatDate(event.date)} · {event.time}</span>
        </div>

        <div className="logistic-item" title="Venue Location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="logistic-venue">{event.venue}</span>
        </div>
      </div>

      {/* Capacity Meter */}
      <div className="event-card-capacity">
        <ProgressBar
          current={event.registrationCount}
          total={event.maxParticipants}
          height={4}
        />
      </div>

      {/* Card Footer Action */}
      <div className="event-card-footer">
        <span className="event-fee font-mono">
          {event.fee || 'Free Entry'}
        </span>
        <span className="event-arrow font-mono">
          Inspect Specs →
        </span>
      </div>
    </motion.article>
  );
};

export default EventCard;
