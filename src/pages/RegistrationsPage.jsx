// Registrations & Pass Operations (Craft Standard v2.0)
import React, { useState, useMemo } from 'react';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import ParticipantTable from '../components/participants/ParticipantTable';
import SearchBar from '../components/ui/SearchBar';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import './RegistrationsPage.css';

const PER_PAGE = 15;

const RegistrationsPage = () => {
  const store = useEventStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Flatten attendees across all events
  const allAttendees = useMemo(() => {
    return store.events.flatMap((evt) =>
      evt.participants.map((p) => ({
        ...p,
        eventName: evt.name,
        eventId: evt.id,
        eventCategory: evt.category,
        eventDate: evt.date,
        eventStatus: evt.status,
      }))
    );
  }, [store.events]);

  // Multi-facet filtering
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allAttendees.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        p.ticketId?.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.eventName.toLowerCase().includes(q);

      const matchEvent = !filterEvent || p.eventId === filterEvent;
      const matchStatus = !filterStatus || p.status === filterStatus;

      return matchSearch && matchEvent && matchStatus;
    });
  }, [allAttendees, search, filterEvent, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageAttendees = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Metrics
  const totalCount = allAttendees.length;
  const confirmedCount = allAttendees.filter((p) => p.status === 'confirmed').length;
  const pendingCount = allAttendees.filter((p) => p.status === 'pending').length;
  const cancelledCount = allAttendees.filter((p) => p.status === 'cancelled').length;

  // Real CSV Export Feature
  const handleExportCSV = () => {
    const headers = [
      'Ticket ID',
      'Student Name',
      'Roll Number',
      'Email',
      'Department',
      'Year',
      'Event Name',
      'Registration Status',
      'Check-in Status',
      'Registered At',
    ];

    const rows = filtered.map((p) => [
      p.ticketId || '',
      `"${p.name}"`,
      p.studentId,
      p.email,
      `"${p.department}"`,
      `"${p.year}"`,
      `"${p.eventName}"`,
      p.status,
      p.checkInStatus || 'Not Checked In',
      p.registeredAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campuscore_attendees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Manifest Exported',
      message: `Downloaded attendee records (${filtered.length} entries).`,
    });
  };

  return (
    <div className="registrations-view">
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2 className="page-title">Registrations</h2>
          <p className="page-subtitle">
            View, search and export all event registrations
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          }
        >
          Export CSV ({filtered.length})
        </Button>
      </div>

      {/* Summary Strip */}
      <div className="attendee-summary-strip">
        <div className="summary-pill-item">
          <span className="summary-pill-lbl">Total</span>
          <span className="summary-pill-val font-mono">{totalCount.toLocaleString()}</span>
        </div>
        <div className="summary-pill-item">
          <span className="summary-pill-lbl">Registered</span>
          <span className="summary-pill-val font-mono text-emerald">{confirmedCount.toLocaleString()}</span>
        </div>
        <div className="summary-pill-item">
          <span className="summary-pill-lbl">Cancelled</span>
          <span className="summary-pill-val font-mono text-rose">{cancelledCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="registrations-filter-row">
        <SearchBar
          id="registrations-search-input"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Filter by attendee name, roll number, ticket ID, or event..."
          className="regs-search-field"
        />

        <select
          id="registrations-event-select"
          className="craft-select"
          value={filterEvent}
          onChange={(e) => {
            setFilterEvent(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Events ({store.events.length})</option>
          {store.events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.name}
            </option>
          ))}
        </select>

        <select
          id="registrations-status-select"
          className="craft-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Registered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Filter Active Notice */}
      {(search || filterEvent || filterStatus) && (
        <div className="registrations-active-filter-strip">
          <span>
            Filtering: <strong className="font-mono text-primary">{filtered.length}</strong> of{' '}
            {totalCount} passes
          </span>
          <button
            className="filter-clear-btn font-mono"
            onClick={() => {
              setSearch('');
              setFilterEvent('');
              setFilterStatus('');
              setPage(1);
            }}
            type="button"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Attendee Table */}
      {pageAttendees.length === 0 ? (
        <EmptyState preset="noParticipants" />
      ) : (
        <>
          <ParticipantTable
            participants={pageAttendees}
            showEvent={true}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="registrations-pagination-bar">
              <span className="pagination-info font-mono">
                Showing {(page - 1) * PER_PAGE + 1}–
                {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} passes
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
        </>
      )}
    </div>
  );
};

export default RegistrationsPage;
