// Events Directory Page (v4.0)
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import EventForm from '../components/forms/EventForm';
import { formatDate } from '../utils/dateUtils';
import { getCategoryById } from '../data/mockData';
import './EventsPage.css';

const EVENTS_PER_PAGE = 9;

const EventsPage = () => {
  const navigate = useNavigate();
  const store = useEventStore();
  const [searchParams] = useSearchParams();

  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort]         = useState('date-asc');
  const [status, setStatus]     = useState(() => searchParams.get('status') || '');
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') === 'seats' ? 'seats' : 'grid');
  const [page, setPage]         = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // On mount, open the modal for new event if triggered
  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, []);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleCategory = useCallback((val) => {
    setCategory(val);
    setPage(1);
  }, []);

  const handleStatus = useCallback((val) => {
    setStatus(val);
    setPage(1);
  }, []);

  const handleSort = useCallback((val) => {
    setSort(val);
    setPage(1);
  }, []);

  // Filtered & Sorted events
  const filteredEvents = useMemo(
    () => store.getFilteredEvents({ search, category, sort, status }),
    [search, category, sort, status, store.events]
  );

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const pageEvents = filteredEvents.slice(
    (page - 1) * EVENTS_PER_PAGE,
    page * EVENTS_PER_PAGE
  );

  return (
    <div className="events-directory-view">
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2 className="page-title">Events Specification & Schedule</h2>
          <p className="page-subtitle">
            {store.events.length} symposium events configured ·{' '}
            {store.events.filter((e) => e.status === 'upcoming').length} active upcoming sessions
          </p>
        </div>

        <Button
          id="events-page-add-btn"
          variant="primary"
          size="sm"
          kbd="N"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          }
          onClick={() => setFormOpen(true)}
        >
          New Event
        </Button>
      </div>

      {/* Multi-Faceted Filters & View Switcher */}
      <EventFilters
        search={search}
        onSearchChange={handleSearch}
        category={category}
        onCategoryChange={handleCategory}
        sort={sort}
        onSortChange={handleSort}
        status={status}
        onStatusChange={handleStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={store.events.length}
        filteredCount={filteredEvents.length}
      />

      {/* Main Content Area: Grid or Table */}
      {pageEvents.length === 0 ? (
        <EmptyState
          preset="noEvents"
          action={
            (search || category || status) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setStatus('');
                  setPage(1);
                }}
              >
                Reset All Filters
              </Button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid-events-3">
          {pageEvents.map((evt, idx) => (
            <EventCard key={evt.id} event={evt} delay={idx * 0.04} />
          ))}
        </div>
      ) : (
        <div className="craft-card table-card-wrapper">
          <table className="craft-data-table" role="table">
            <thead>
              <tr>
                <th scope="col">Event Specification</th>
                <th scope="col">Domain</th>
                <th scope="col">Date & Time</th>
                <th scope="col">Venue / Hall</th>
                <th scope="col">Capacity Occupancy</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageEvents.map((evt) => {
                const cat = getCategoryById(evt.category);
                return (
                  <tr
                    key={evt.id}
                    className="craft-table-row"
                    onClick={() => navigate(`/events/${evt.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/events/${evt.id}`);
                    }}
                  >
                    <td>
                      <div className="table-event-cell">
                        <span className="table-event-title">{evt.name}</span>
                        <span className="table-event-sub font-mono">{evt.id}</span>
                      </div>
                    </td>
                    <td>
                      <Badge category={evt.category} size="xs" icon={cat.icon}>
                        {cat.label}
                      </Badge>
                    </td>
                    <td>
                      <div className="table-time-cell">
                        <span className="table-date">{formatDate(evt.date)}</span>
                        <span className="table-time font-mono">{evt.time}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-venue-text">{evt.venue}</span>
                    </td>
                    <td>
                      <div className="table-capacity-cell">
                        <ProgressBar
                          current={evt.registrationCount}
                          total={evt.maxParticipants}
                          height={4}
                        />
                      </div>
                    </td>
                    <td>
                      <Badge status={evt.status} dot size="xs">
                        {evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="table-action-btn font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${evt.id}`);
                        }}
                        type="button"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="events-pagination-bar">
          <span className="pagination-info font-mono">
            Showing {(page - 1) * EVENTS_PER_PAGE + 1}–
            {Math.min(page * EVENTS_PER_PAGE, filteredEvents.length)} of{' '}
            {filteredEvents.length} events
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Add Event Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Schedule New Event"
        subtitle="Configure event metadata, capacity limits, and session schedules"
        size="lg"
      >
        <EventForm onClose={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
};

export default EventsPage;
