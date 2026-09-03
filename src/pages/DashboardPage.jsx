// Dashboard Overview Page (VibeVenue — Supabase powered)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEventStore from '../store/useEventStore';
import StatCard from '../components/dashboard/StatCard';
import RegistrationChart from '../components/dashboard/RegistrationChart';
import RecentRegistrations from '../components/dashboard/RecentRegistrations';
import EventCard from '../components/events/EventCard';
import Button from '../components/ui/Button';
import './DashboardPage.css';

// Generate a lightweight 30-day registration trend from real data
const buildTrend = (regs) => {
  const map = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    map[label] = { date: label, registrations: 0, checkins: 0 };
  }
  (regs || []).forEach(r => {
    const label = new Date(r.registered_at || r.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (map[label]) {
      map[label].registrations += 1;
      if (r.check_in_status === 'Checked In' || r.checkInStatus === 'Checked In') {
        map[label].checkins += 1;
      }
    }
  });
  return Object.values(map);
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const store = useEventStore();
  const stats = store.getDashboardStats();

  const [recentRegs, setRecentRegs]   = useState([]);
  const [trend, setTrend]             = useState([]);

  useEffect(() => {
    store.getRecentRegistrations(100).then(data => {
      setRecentRegs((data || []).slice(0, 7));
      setTrend(buildTrend(data || []));
    });
  }, [store.events]); // re-run when realtime pushes new events

  const upcomingEvents = store.events
    .filter(e => e.status === 'upcoming' || e.status === 'ongoing')
    .sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate))
    .slice(0, 3);

  return (
    <div className="dashboard-view">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">
            Live overview — events, registrations and activity
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
            Export Registrations
          </Button>

          <Button variant="primary" size="sm" onClick={() => navigate('/events')}>
            All Events →
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <section className="grid-metrics" aria-label="Key Metrics">
        <StatCard id="stat-total-events" title="Total Events" value={stats.totalEvents} subvalue="across all categories" badgeText="View All" badgeType="neutral"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          delay={0} onClick={() => navigate('/events?view=all')} />

        <StatCard id="stat-upcoming-events" title="Upcoming Events" value={stats.upcomingEvents} subvalue="scheduled ahead" badgeText="Earliest First" badgeType="iris"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
          delay={0.05} onClick={() => navigate('/events?status=upcoming')} />

        <StatCard id="stat-total-registrations" title="Total Registrations" value={stats.totalRegistrations} subvalue={`${stats.avgOccupancy}% upcoming occupancy`} badgeText="Upcoming" badgeType="positive" indicatorPct={stats.avgOccupancy} indicatorColor="var(--accent-emerald)"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>}
          delay={0.1} onClick={() => navigate('/registrations')} />

        <StatCard id="stat-available-seats" title="Available Seats" value={stats.availableSeats} subvalue="in upcoming events" badgeText="Upcoming" badgeType="warning" indicatorPct={100 - stats.avgOccupancy} indicatorColor="var(--accent-amber)"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          delay={0.15} onClick={() => navigate('/events?status=upcoming')} />
      </section>

      {/* Middle Grid: Trend Chart & Registrations Feed */}
      <section className="grid-two-column" aria-label="Activity">
        <RegistrationChart data={trend} />
        <RecentRegistrations registrations={recentRegs} />
      </section>

      {/* Upcoming Events Preview */}
      <section className="dashboard-upcoming-section" aria-label="Upcoming Events">
        <div className="section-title-row">
          <div className="title-with-pill">
            <h3 className="section-heading">Upcoming Events</h3>
            <span className="section-pill font-mono">Next 30 days</span>
          </div>
          <button className="section-link font-mono" onClick={() => navigate('/events?status=upcoming')} type="button">
            See all ({store.events.filter(e => e.status === 'upcoming').length}) →
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
