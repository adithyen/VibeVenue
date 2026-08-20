// Dashboard Overview Page (Craft Standard v2.0)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useEventStore from '../store/useEventStore';
import StatCard from '../components/dashboard/StatCard';
import RegistrationChart from '../components/dashboard/RegistrationChart';
import RecentRegistrations from '../components/dashboard/RecentRegistrations';
import EventCard from '../components/events/EventCard';
import Button from '../components/ui/Button';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const store = useEventStore();
  const stats = store.getDashboardStats();
  const recentRegs = store.getRecentRegistrations(7);
  const trend = store.registrationTrend;

  const upcomingEvents = store.events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <div className="dashboard-view">
      {/* Top Banner Context */}
      <div className="page-header">
        <div className="page-title-group">
          <h2 className="page-title">Operations Control Center</h2>
          <p className="page-subtitle">
            Live telemetry, attendee registration velocity, and capacity monitoring
          </p>
        </div>

        <div className="dashboard-header-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/registrations')}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            }
          >
            Export Attendee Manifest
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/events')}
          >
            Browse All Events →
          </Button>
        </div>
      </div>

      {/* 4 Executive Metrics */}
      <section className="grid-metrics" aria-label="Executive Metrics">
        <StatCard
          id="stat-total-events"
          title="Total Events Scheduled"
          value={stats.totalEvents}
          subvalue="8 engineering domains"
          badgeText="All Approved"
          badgeType="neutral"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
          delay={0}
        />

        <StatCard
          id="stat-upcoming-events"
          title="Active Upcoming Events"
          value={stats.upcomingEvents}
          subvalue="2 completed sessions"
          badgeText="Phase 1 Ready"
          badgeType="iris"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          }
          delay={0.05}
        />

        <StatCard
          id="stat-total-registrations"
          title="Total Registered Attendees"
          value={stats.totalRegistrations}
          subvalue={`${stats.avgOccupancy}% occupancy`}
          badgeText="+18.4% this week"
          badgeType="positive"
          indicatorPct={stats.avgOccupancy}
          indicatorColor="var(--accent-emerald)"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
          }
          delay={0.1}
        />

        <StatCard
          id="stat-available-seats"
          title="Remaining Seat Capacity"
          value={stats.availableSeats}
          subvalue="across all venues"
          badgeText="High Demand"
          badgeType="warning"
          indicatorPct={100 - stats.avgOccupancy}
          indicatorColor="var(--accent-amber)"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
          delay={0.15}
        />
      </section>

      {/* Middle Grid: Telemetry Chart & Live Feed */}
      <section className="grid-two-column" aria-label="Telemetry & Activity">
        <RegistrationChart data={trend} />
        <RecentRegistrations registrations={recentRegs} />
      </section>

      {/* Upcoming Imminent Events */}
      <section className="dashboard-upcoming-section" aria-label="Upcoming Events">
        <div className="section-title-row">
          <div className="title-with-pill">
            <h3 className="section-heading">Imminent Major Events</h3>
            <span className="section-pill font-mono">Next 30 Days</span>
          </div>
          <button
            className="section-link font-mono"
            onClick={() => navigate('/events')}
            type="button"
          >
            Explore Directory ({store.events.length}) →
          </button>
        </div>

        <div className="grid-events-3">
          {upcomingEvents.map((evt, idx) => (
            <EventCard key={evt.id} event={evt} delay={idx * 0.05} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
