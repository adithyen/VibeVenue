// EventDetailPage — rich event details with organizer, schedule, stats, participants
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import { getCategoryById } from '../data/mockData';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import EventForm from '../components/forms/EventForm';
import ParticipantTable from '../components/participants/ParticipantTable';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, formatTimeAgo, getDaysUntil } from '../utils/dateUtils';
import './EventDetailPage.css';

const TABS = ['Overview', 'Schedule', 'Participants'];

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useEventStore();
  const { addToast } = useUIStore();

  const event = store.getEventById(id);
  const [tab, setTab] = useState('Overview');
  const [editOpen, setEditOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatus, setParticipantStatus] = useState('');

  if (!event) {
    return (
      <div className="event-not-found">
        <EmptyState
          icon="🔍"
          title="Event Not Found"
          description="The event you're looking for doesn't exist or has been removed."
          action={
            <Button variant="primary" onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          }
        />
      </div>
    );
  }

  const cat = getCategoryById(event.category);
  const organizer = store.getOrganizerById(event.organizerId);
  const daysUntil = getDaysUntil(event.date);
  const pct = Math.round((event.registrationCount / event.maxParticipants) * 100);

  // Participant filter
  const filteredParticipants = event.participants.filter(p => {
    const q = participantSearch.toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.studentId.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q);
    const matchStatus = !participantStatus || p.status === participantStatus;
    return matchSearch && matchStatus;
  });

  // Pie chart data
  const pieData = [
    { name: 'Registered', value: event.registrationCount, color: '#00D4FF' },
    { name: 'Available', value: Math.max(0, event.maxParticipants - event.registrationCount), color: '#1A2436' },
  ];

  const statusBreakdown = [
    { label: 'Confirmed', count: event.participants.filter(p => p.status === 'confirmed').length, color: '#00E676' },
    { label: 'Pending',   count: event.participants.filter(p => p.status === 'pending').length,   color: '#FFB300' },
    { label: 'Cancelled', count: event.participants.filter(p => p.status === 'cancelled').length, color: '#FF4757' },
  ];

  return (
    <div className="event-detail-page">
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate('/events')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Events
      </button>

      {/* Hero */}
      <motion.div
        className="event-hero"
        style={{ '--cat-color': cat.color }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="event-hero-bg" style={{ background: `radial-gradient(ellipse at top right, ${cat.color}18, transparent 60%)` }} />

        <div className="event-hero-content">
          <div className="event-hero-meta">
            <div
              className="event-cat-icon-lg"
              style={{ background: `${cat.color}18`, color: cat.color }}
            >
              {cat.icon}
            </div>
            <div className="hero-badges">
              <Badge category={event.category} size="md">{cat.label}</Badge>
              <Badge status={event.status} dot size="md">
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
              {event.status === 'upcoming' && daysUntil !== null && (
                <Badge variant="amber" size="md">
                  {daysUntil > 0 ? `in ${daysUntil} days` : daysUntil === 0 ? 'Today!' : 'Past'}
                </Badge>
              )}
            </div>
          </div>

          <h1 className="event-hero-title">{event.name}</h1>
          <p className="event-hero-desc">{event.description}</p>

          <div className="event-hero-chips">
            <div className="hero-chip">
              <span>📅</span>
              <span>{formatDate(event.date)} · {event.time}
                {event.endTime ? ` – ${event.endTime}` : ''}</span>
            </div>
            <div className="hero-chip">
              <span>📍</span>
              <span>{event.venue}</span>
            </div>
            <div className="hero-chip">
              <span>👥</span>
              <span>{event.registrationCount} / {event.maxParticipants} registered</span>
            </div>
          </div>

          <div className="event-hero-actions">
            <Button
              variant="primary"
              onClick={() => setEditOpen(true)}
              id={`edit-event-${event.id}`}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            >
              Edit Event
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <div className="detail-tabs">
        {TABS.map(t => (
          <button
            key={t}
            id={`tab-${t.toLowerCase()}`}
            className={`detail-tab ${tab === t ? 'detail-tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'Participants' && (
              <span className="tab-count">{event.registrationCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 'Overview' && (
          <div className="detail-overview">
            {/* Registration stats */}
            <div className="detail-grid-2">
              <div className="detail-card">
                <h3 className="detail-card-title">Registration Stats</h3>
                <div className="reg-stats-layout">
                  <div className="reg-pie-chart">
                    <PieChart width={160} height={160}>
                      <Pie
                        data={pieData}
                        cx={75}
                        cy={75}
                        innerRadius={48}
                        outerRadius={68}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#0E1520', border: '1px solid rgba(0,212,255,0.1)',
                          borderRadius: 8, fontSize: 12
                        }}
                      />
                    </PieChart>
                    <div className="pie-center">
                      <span className="pie-pct" style={{ color: cat.color }}>{pct}%</span>
                      <span className="pie-label">Full</span>
                    </div>
                  </div>
                  <div className="reg-stats-right">
                    {statusBreakdown.map(s => (
                      <div key={s.label} className="stat-row">
                        <div className="stat-row-label">
                          <span className="stat-dot" style={{ background: s.color }} />
                          {s.label}
                        </div>
                        <span className="stat-row-count font-mono" style={{ color: s.color }}>
                          {s.count}
                        </span>
                      </div>
                    ))}
                    <div className="divider" />
                    <ProgressBar
                      current={event.registrationCount}
                      total={event.maxParticipants}
                      height={8}
                    />
                  </div>
                </div>
              </div>

              {/* Organizer info */}
              {organizer && (
                <div className="detail-card">
                  <h3 className="detail-card-title">Organizer</h3>
                  <div className="organizer-card">
                    <div className="organizer-header">
                      <Avatar name={organizer.name} initials={organizer.initials} size="lg" />
                      <div>
                        <p className="organizer-name">{organizer.name}</p>
                        <p className="organizer-role">{organizer.role}</p>
                        <p className="organizer-dept">{organizer.department}</p>
                      </div>
                    </div>
                    <div className="organizer-contacts">
                      <a
                        href={`mailto:${organizer.email}`}
                        className="organizer-contact"
                        id={`email-organizer-${organizer.id}`}
                      >
                        <span>✉️</span> {organizer.email}
                      </a>
                      <div className="organizer-contact">
                        <span>📞</span> {organizer.phone}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="detail-card">
                <h3 className="detail-card-title">Tags</h3>
                <div className="event-tags">
                  {event.tags.map(tag => (
                    <span key={tag} className="event-tag">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Schedule' && (
          <div className="detail-card">
            <h3 className="detail-card-title">Event Schedule</h3>
            {event.schedule && event.schedule.length > 0 ? (
              <div className="schedule-timeline">
                {event.schedule.map((item, i) => (
                  <motion.div
                    key={i}
                    className="schedule-item"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="schedule-time">
                      <span className="font-mono">{item.time}</span>
                    </div>
                    <div className="schedule-dot-line">
                      <div
                        className="schedule-dot"
                        style={{ background: cat.color, boxShadow: `0 0 8px ${cat.color}66` }}
                      />
                      {i < event.schedule.length - 1 && <div className="schedule-line" />}
                    </div>
                    <div className="schedule-content">
                      <p className="schedule-title">{item.title}</p>
                      {item.speaker && <p className="schedule-speaker">🎤 {item.speaker}</p>}
                      <div className="schedule-meta">
                        {item.room && <span>📍 {item.room}</span>}
                        {item.duration && <span>⏱ {item.duration}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📅"
                title="Schedule Coming Soon"
                description="The detailed schedule for this event will be published soon."
                compact
              />
            )}
          </div>
        )}

        {tab === 'Participants' && (
          <div className="detail-card">
            <div className="participants-header">
              <h3 className="detail-card-title">
                Participants
                <span className="detail-count">{filteredParticipants.length}</span>
              </h3>
              <div className="participants-controls">
                <SearchBar
                  id="participants-search"
                  value={participantSearch}
                  onChange={setParticipantSearch}
                  placeholder="Search participants..."
                />
                <select
                  id="participants-filter-status"
                  className="pf-status-select"
                  value={participantStatus}
                  onChange={e => setParticipantStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <ParticipantTable
              participants={filteredParticipants}
              eventId={event.id}
            />
          </div>
        )}
      </motion.div>

      {/* Edit Event Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Event"
        size="lg"
      >
        <EventForm event={event} onClose={() => setEditOpen(false)} />
      </Modal>
    </div>
  );
};

export default EventDetailPage;
