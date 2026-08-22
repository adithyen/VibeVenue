import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCategoryById } from '../../data/mockData';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { formatDate, formatEventSchedule, getEventFeeDisplay, getComputedEventStatus, getRegistrationStatusInfo } from '../../utils/dateUtils';
import './EventCard.css';

const EventCard = ({ event, delay = 0 }) => {
  const navigate = useNavigate();
  const cat = getCategoryById(event.category);
  const occupancyPct = Math.round(
    (event.registrationCount / event.maxParticipants) * 100
  );
  const isPaid = event.fee && event.fee !== 'Free' && event.fee !== '';
  const isOnline = event.isOnline;
  const computedStatus = getComputedEventStatus(event);
  const regInfo = getRegistrationStatusInfo(event);

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
      {/* Optional Banner */}
      {event.bannerUrl && (
        <div className="event-card-banner" style={{ backgroundImage: `url(${event.bannerUrl})` }}>
          <div className="event-card-banner-overlay" />
        </div>
      )}

      {/* Main Info: Logo on Left, Badges & Title on Right */}
      <div className={`event-card-main-row ${event.bannerUrl ? 'has-banner' : 'no-banner'}`}>
        {event.logoUrl && (
          <img
            src={event.logoUrl}
            alt=""
            className={`event-card-logo ${event.bannerUrl ? 'event-card-logo-overlap' : ''}`}
          />
        )}
        <div className="event-card-main">
          <div className="event-card-meta-line">
            <Badge category={event.category} size="xs" icon={cat?.icon}>
              {cat?.label || event.category}
            </Badge>

            <Badge status={computedStatus} dot size="xs">
              {computedStatus === 'upcoming' ? 'Upcoming'
                : computedStatus === 'ongoing' ? '🔴 Live Now'
                : computedStatus === 'completed' ? 'Completed'
                : 'Cancelled'}
            </Badge>

            {regInfo.isSpot && (
              <span className="font-mono" style={{ fontSize: '0.625rem', color: '#D97706', background: 'rgba(217, 119, 6, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                ⚡ Spot Open
              </span>
            )}
          </div>

          <h3 className="event-card-title">{event.name}</h3>
          {event.tagline && (
            <p className="event-card-tagline">{event.tagline}</p>
          )}
          <p className="event-card-desc">
            {event.shortDescription || event.description}
          </p>
        </div>
      </div>

      {/* Info Badges Row */}
      <div className="event-card-badges">
        {/* Online / Offline */}
        <span className={`event-info-badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
          {isOnline ? '🌐 Online' : '📍 In-Person'}
        </span>

        {/* Paid / Free */}
        <span className={`event-info-badge ${isPaid ? 'badge-paid' : 'badge-free'}`}>
          {isPaid ? `₹ Paid` : '✓ Free'}
        </span>

        {/* Registration type */}
        {event.registrationType && (
          <span className="event-info-badge badge-regtype">
            {event.registrationType === 'individual' ? '👤 Individual'
              : event.registrationType === 'group' ? '👥 Group'
              : '👤👥 Open'}
          </span>
        )}

        {/* Amenities */}
        {event.amenities?.refreshments && (
          <span className="event-info-badge badge-amenity">🍵 Refreshments</span>
        )}
        {event.amenities?.accommodation && (
          <span className="event-info-badge badge-amenity">🏠 Stay</span>
        )}
        {event.amenities?.certificate && (
          <span className="event-info-badge badge-amenity">📜 Certificate</span>
        )}
      </div>

      {/* Logistics Pills */}
      <div className="event-logistics">
        <div className="logistic-item" title="Date & Time">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{formatEventSchedule(event.date || event.startDate, event.time || event.startTime, event.endTime)}</span>
        </div>

        <div className="logistic-item" title={isOnline ? 'Online Event' : 'Venue'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="logistic-venue">{event.venue || (isOnline ? 'Online' : '—')}</span>
        </div>
      </div>

      {/* Capacity Meter */}
      {!isOnline && event.maxParticipants && (
        <div className="event-card-capacity">
          <ProgressBar
            current={event.registrationCount}
            total={event.maxParticipants}
            height={4}
          />
        </div>
      )}

      {/* Card Footer */}
      <div className="event-card-footer">
        <span className="event-fee font-mono">
          {getEventFeeDisplay(event)}
        </span>
        <span className="event-arrow font-mono">View Details →</span>
      </div>
    </motion.article>
  );
};

export default EventCard;
