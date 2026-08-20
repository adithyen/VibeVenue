// EventsPage — full event listing with search, filter, sort, pagination
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EventForm from '../components/forms/EventForm';
import './EventsPage.css';

const EVENTS_PER_PAGE = 9;

const EventsPage = () => {
  const store = useEventStore();

  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort]         = useState('date-asc');
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // Debounced search reset page
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

  // Filtered + sorted events
  const filteredEvents = useMemo(
    () => store.getFilteredEvents({ search, category, sort, status }),
    [search, category, sort, status, store.events]
  );

  // Paginated slice
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const pageEvents = filteredEvents.slice(
    (page - 1) * EVENTS_PER_PAGE,
    page * EVENTS_PER_PAGE
  );

  return (
    <div className="events-page">
      <div className="section-header">
        <div>
          <h2 className="section-title">All Events</h2>
          <p className="section-subtitle">
            {store.events.length} events · {store.events.filter(e => e.status === 'upcoming').length} upcoming
          </p>
        </div>
        <Button
          id="events-add-btn"
          variant="primary"
          size="sm"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          }
          onClick={() => setFormOpen(true)}
        >
          Add Event
        </Button>
      </div>

      <EventFilters
        search={search}
        onSearchChange={handleSearch}
        category={category}
        onCategoryChange={handleCategory}
        sort={sort}
        onSortChange={handleSort}
        status={status}
        onStatusChange={handleStatus}
        totalCount={store.events.length}
        filteredCount={filteredEvents.length}
      />

      {/* Grid */}
      {pageEvents.length === 0 ? (
        <EmptyState
          preset="noEvents"
          action={
            (search || category || status) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch(''); setCategory(''); setStatus(''); setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="events-grid">
            {pageEvents.map((evt, i) => (
              <EventCard key={evt.id} event={evt} delay={i} />
            ))}
          </div>

          {/* Pagination */}
          <div className="events-pagination">
            <p className="events-pag-info">
              Showing {(page - 1) * EVENTS_PER_PAGE + 1}–{Math.min(page * EVENTS_PER_PAGE, filteredEvents.length)} of {filteredEvents.length}
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        </>
      )}

      {/* Add Event Form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add New Event" size="lg">
        <EventForm onClose={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
};

export default EventsPage;
