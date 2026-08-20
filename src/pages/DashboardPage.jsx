// DashboardPage — main overview with stats, chart, and recent registrations
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import StatCard from '../components/dashboard/StatCard';
import RegistrationChart from '../components/dashboard/RegistrationChart';
import RecentRegistrations from '../components/dashboard/RecentRegistrations';
import EventCard from '../components/events/EventCard';
import './DashboardPage.css';

const STAT_CONFIG = [
  {
    key: 'totalEvents',
    title: 'Total Events',
    color: '#00D4FF',
    delay: 0,
    icon: '🗓️',
    trend: 12,
    trendLabel: 'vs last month',
  },
  {
    key: 'upcomingEvents',
    title: 'Upcoming Events',
    color: '#A855F7',
    delay: 0.08,
    icon: '🚀',
    trend: 8,
    trendLabel: 'scheduled',
  },
  {
    key: 'totalRegistrations',
    title: 'Total Registrations',
    color: '#00E676',
    delay: 0.16,
    icon: '👥',
    trend: 24,
    trendLabel: 'this week',
  },
  {
    key: 'availableSeats',
    title: 'Available Seats',
    color: '#FFB300',
    delay: 0.24,
    icon: '💺',
    trend: -5,
    trendLabel: 'filling fast',
  },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const store = useEventStore();
  const stats = store.getDashboardStats();
  const recentRegs = store.getRecentRegistrations(8);
  const trend = store.registrationTrend;
  const upcomingEvents = store.events
    .filter(e => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <div className="dashboard-page">
      {/* Stats Grid */}
      <section aria-label="Summary statistics">
        <div className="grid-4">
          {STAT_CONFIG.map((cfg) => (
            <StatCard
              key={cfg.key}
              id={`stat-${cfg.key}`}
              title={cfg.title}
              value={stats[cfg.key]}
              icon={cfg.icon}
              color={cfg.color}
              delay={cfg.delay}
              trend={cfg.trend}
              trendLabel={cfg.trendLabel}
            />
          ))}
        </div>
      </section>

      {/* Chart + Recent Registrations */}
      <section className="dashboard-middle" aria-label="Charts and activity">
        <RegistrationChart data={trend} />
        <RecentRegistrations registrations={recentRegs} />
      </section>

      {/* Upcoming Events Quick View */}
      <section aria-label="Upcoming events">
        <div className="section-header">
          <div>
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">Next events you need to prepare for</p>
          </div>
          <button
            className="dash-view-all"
            onClick={() => navigate('/events')}
            id="dash-view-all-events"
          >
            View All →
          </button>
        </div>
        <div className="grid-3">
          {upcomingEvents.map((evt, i) => (
            <EventCard key={evt.id} event={evt} delay={i} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
