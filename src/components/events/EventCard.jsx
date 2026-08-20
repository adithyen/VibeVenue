// EventCard — individual event listing card
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getCategoryById } from '../../data/mockData';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { formatDate } from '../../utils/dateUtils';
import './EventCard.css';

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 9h18M8 2v3M16 2v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const EventCard = ({ event, delay = 0 }) => {
  const navigate = useNavigate();
  const cat = getCategoryById(event.category);
  const pct = Math.round((event.registrationCount / event.maxParticipants) * 100);

  return (
    <motion.article
      className="event-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay * 0.05, 0.4), type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/events/${event.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/events/${event.id}`); }}
      aria-label={`View details for ${event.name}`}
    >
      {/* Category stripe */}
      <div
        className="event-card-stripe"
        style={{ background: `linear-gradient(90deg, ${cat.color}44, transparent)` }}
      />

      {/* Header */}
      <div className="event-card-header">
        <div
          className="event-card-cat-icon"
          style={{ background: `${cat.color}18`, color: cat.color }}
        >
          {cat.icon}
        </div>
        <div className="event-card-badges">
          <Badge category={event.category} size="xs">{cat.label}</Badge>
          <Badge status={event.status} dot size="xs">
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <h3 className="event-card-title">{event.name}</h3>
      {event.shortDescription && (
        <p className="event-card-desc">{event.shortDescription}</p>
      )}

      {/* Meta info */}
      <div className="event-card-meta">
        <div className="event-meta-item">
          <CalendarIcon />
          <span>{formatDate(event.date)} · {event.time}</span>
        </div>
        <div className="event-meta-item">
          <LocationIcon />
          <span>{event.venue}</span>
        </div>
        <div className="event-meta-item">
          <UsersIcon />
          <span>{event.registrationCount} registered</span>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="event-card-capacity">
        <ProgressBar
          current={event.registrationCount}
          total={event.maxParticipants}
          height={5}
        />
      </div>
    </motion.article>
  );
};

export default EventCard;
