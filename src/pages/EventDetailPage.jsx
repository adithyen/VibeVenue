// Event Specification & Detailed Telemetry Page (Craft v2.0)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import useEventStore from '../store/useEventStore';
import { getCategoryById } from '../data/mockData';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import EventForm from '../components/forms/EventForm';
import ParticipantTable from '../components/participants/ParticipantTable';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, getDaysUntil } from '../utils/dateUtils';
import './EventDetailPage.css';

const TABS = [
  { id: 'overview',     label: 'Overview & Telemetry' },
  { id: 'schedule',     label: 'Session Timeline' },
  { id: 'participants', label: 'Enrolled Attendees' },
];

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useEventStore();

  const event = store.getEventById(id);
  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Fetch real participants from Supabase
  useEffect(() => {
    if (!id) return;
    setParticipantsLoading(true);
    store.fetchEventParticipants(id).then(data => {
      setParticipants(data);
      setParticipantsLoading(false);
    });
  }, [id]);

  if (!event) {
    return (
      <div className="event-not-found-wrapper">
        <EmptyState
          preset="noEvents"
          title="Event Record Not Found"
          description="The event specification you requested does not exist or has been removed from the registry."
          action={
            <Button variant="primary" onClick={() => navigate('/events')}>
              Back to Events Directory
            </Button>
          }
        />
      </div>
    );
  }

  const cat = getCategoryById(event.category);
  const daysUntil = getDaysUntil(event.date);
  const occupancyPct = Math.round(
    (event.registrationCount / event.maxParticipants) * 100
  );

  // Telemetry breakdown data for charts — from real fetched participants
  const confirmedCount = participants.filter(p => p.status === 'confirmed').length;
  const pendingCount   = participants.filter(p => p.status === 'pending').length;
  const availableSeats = Math.max(0, event.maxParticipants - event.registrationCount);

  const chartData = [
    { name: 'Confirmed Attendees', value: confirmedCount, color: '#10B981' },
    { name: 'Pending Approvals',  value: pendingCount,   color: '#F59E0B' },
    { name: 'Available Slots',    value: availableSeats, color: '#26282E' },
  ];

  return (
    <div className="event-detail-view">
      {/* Back Button */}
      <button
        className="craft-back-link font-mono"
        onClick={() => navigate('/events')}
        type="button"
      >
        ← Back to Events Directory
      </button>

      {/* Hero Specification Header */}
      <div className="craft-card detail-hero-card">
        {event.bannerUrl && (
          <div className="detail-hero-banner" style={{ backgroundImage: `url(${event.bannerUrl})` }}>
            <div className="detail-hero-banner-overlay" />
            {event.logoUrl && (
              <img src={event.logoUrl} alt={event.name} className="detail-hero-logo" />
            )}
          </div>
        )}

        <div className="detail-hero-inner">
          <div className="detail-hero-top">
            <div className="detail-hero-badges">
              {!event.bannerUrl && event.logoUrl && (
                <img src={event.logoUrl} alt={event.name} className="detail-hero-logo-inline" />
              )}
              <Badge category={event.category} size="sm" icon={cat.icon}>
                {cat.label}
              </Badge>
              <Badge status={event.status} dot size="sm">
                {event.status.toUpperCase()}
              </Badge>
              {event.status === 'upcoming' && daysUntil !== null && (
                <span className="days-chip font-mono">
                  {daysUntil > 0 ? `T-${daysUntil} Days` : daysUntil === 0 ? 'Today' : 'Past'}
                </span>
              )}
            </div>

          <Button
            id="detail-edit-btn"
            variant="secondary"
            size="sm"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            }
            onClick={() => setEditOpen(true)}
          >
            Edit Specification
          </Button>
        </div>

        <h1 className="detail-hero-title">{event.name}</h1>
        <p className="detail-hero-desc">{event.description}</p>

        {/* Quick Logistics Strip */}
        <div className="detail-hero-logistics">
          <div className="detail-log-chip">
            <span className="log-chip-icon">📅</span>
            <span className="font-mono">
              {formatDate(event.date)} · {event.time}
              {event.endTime ? ` – ${event.endTime}` : ''}
            </span>
          </div>

          <div className="detail-log-chip">
            <span className="log-chip-icon">📍</span>
            <span>{event.venue}</span>
          </div>

          <div className="detail-log-chip">
            <span className="log-chip-icon">🎟️</span>
            <span className="font-mono">{event.fee || 'Free'}</span>
          </div>

          <div className="detail-log-chip">
            <span className="log-chip-icon">👥</span>
            <span className="font-mono">
              {event.registrationCount} / {event.maxParticipants} Registered ({occupancyPct}%)
            </span>
          </div>
        </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="segmented-control detail-tabs-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`segmented-option ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
          >
            <span>{t.label}</span>
            {t.id === 'participants' && (
              <span className="tab-pill-count font-mono">
                {event.registrationCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {activeTab === 'overview' && (
          <div className="detail-overview-grid">
            {/* Left: Capacity Telemetry */}
            <div className="craft-card capacity-card">
              <h3 className="card-section-title">Capacity & Occupancy Matrix</h3>
              
              <div className="capacity-telemetry-layout">
                <div className="capacity-donut-wrapper">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx={70}
                        cy={70}
                        innerRadius={46}
                        outerRadius={64}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#14161C',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center-readout">
                    <span className="donut-pct font-mono">{occupancyPct}%</span>
                    <span className="donut-label">Occupancy</span>
                  </div>
                </div>

                <div className="capacity-breakdown">
                  <div className="breakdown-item">
                    <div className="breakdown-name-row">
                      <span className="breakdown-pip" style={{ backgroundColor: '#10B981' }} />
                      <span className="breakdown-label">Confirmed Attendees</span>
                    </div>
                    <span className="breakdown-val font-mono">{confirmedCount}</span>
                  </div>

                  <div className="breakdown-item">
                    <div className="breakdown-name-row">
                      <span className="breakdown-pip" style={{ backgroundColor: '#F59E0B' }} />
                      <span className="breakdown-label">Pending Approvals</span>
                    </div>
                    <span className="breakdown-val font-mono">{pendingCount}</span>
                  </div>

                  <div className="breakdown-item">
                    <div className="breakdown-name-row">
                      <span className="breakdown-pip" style={{ backgroundColor: '#4B5563' }} />
                      <span className="breakdown-label">Available Slots</span>
                    </div>
                    <span className="breakdown-val font-mono">{availableSeats}</span>
                  </div>

                  <div className="capacity-bar-container">
                    <ProgressBar
                      current={event.registrationCount}
                      total={event.maxParticipants}
                      height={6}
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* Tags Strip */}
            {event.tags?.length > 0 && (
              <div className="craft-card tags-card">
                <h3 className="card-section-title">Subject Tags & Topics</h3>
                <div className="tags-flex">
                  {event.tags.map((t) => (
                    <span key={t} className="craft-subject-tag font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="craft-card schedule-card">
            <div className="schedule-header">
              <h3 className="card-section-title">Program Session Timeline</h3>
              <span className="schedule-time-badge font-mono">
                {formatDate(event.date)}
              </span>
            </div>

            {event.schedule && event.schedule.length > 0 ? (
              <div className="session-timeline">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="timeline-session-item">
                    <div className="timeline-time-col font-mono">
                      {item.time}
                    </div>

                    <div className="timeline-line-col">
                      <div className="timeline-node" />
                      {idx < event.schedule.length - 1 && (
                        <div className="timeline-connector" />
                      )}
                    </div>

                    <div className="timeline-content-col">
                      <h4 className="session-title">{item.title}</h4>
                      {item.speaker && (
                        <p className="session-speaker">
                          Presenter / Lead: <strong>{item.speaker}</strong>
                        </p>
                      )}
                      <div className="session-meta-row">
                        {item.room && (
                          <span className="session-pill font-mono">📍 {item.room}</span>
                        )}
                        {item.duration && (
                          <span className="session-pill font-mono">⏱ {item.duration}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                preset="noEvents"
                title="Detailed Schedule Pending"
                description="The session timetable for this event will be finalized by the organizing committee."
                compact
              />
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="craft-card participants-tab-card">
            <div className="tab-card-header">
              <div className="tab-title-group">
                <h3 className="card-section-title">Registered Student Manifest</h3>
                <p className="card-section-sub">
                  Inspect enrolled attendees, confirm check-in status, or cancel passes
                </p>
              </div>
            </div>

            <ParticipantTable
              participants={participants}
              eventId={event.id}
              isLoading={participantsLoading}
            />
          </div>
        )}
      </motion.div>

      {/* Edit Form Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Event Specification"
        subtitle={`Updating specification parameters for "${event.name}"`}
        size="lg"
      >
        <EventForm event={event} onClose={() => setEditOpen(false)} />
      </Modal>
    </div>
  );
};

export default EventDetailPage;
