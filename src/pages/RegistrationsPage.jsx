// RegistrationsPage — cross-event participant management
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { formatTimeAgo, formatDate } from '../utils/dateUtils';
import { getCategoryById } from '../data/mockData';
import useUIStore from '../store/useUIStore';
import './RegistrationsPage.css';

const PER_PAGE = 15;

const RegistrationsPage = () => {
  const store = useEventStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(null);

  // All participants across all events (flat)
  const allParticipants = useMemo(() => {
    return store.events.flatMap(evt =>
      evt.participants.map(p => ({
        ...p,
        eventName: evt.name,
        eventId: evt.id,
        eventCategory: evt.category,
        eventDate: evt.date,
        eventStatus: evt.status,
      }))
    );
  }, [store.events]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allParticipants.filter(p => {
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.eventName.toLowerCase().includes(q);
      const matchEvent  = !filterEvent  || p.eventId === filterEvent;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchEvent && matchStatus;
    });
  }, [allParticipants, search, filterEvent, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleRemove = async (p) => {
    setRemoving(p.id);
    await new Promise(r => setTimeout(r, 600));
    store.removeParticipant(p.eventId, p.id);
    addToast({
      type: 'success',
      title: 'Registration Cancelled',
      message: `${p.name}'s registration for "${p.eventName}" has been removed.`,
    });
    setRemoving(null);
    setConfirmRemove(null);
    setSelected(null);
  };

  // Summary stats
  const confirmed = allParticipants.filter(p => p.status === 'confirmed').length;
  const pending   = allParticipants.filter(p => p.status === 'pending').length;
  const cancelled = allParticipants.filter(p => p.status === 'cancelled').length;

  return (
    <div className="regs-page">
      {/* Summary bar */}
      <div className="regs-summary">
        {[
          { label: 'Total',     value: allParticipants.length, color: '#00D4FF' },
          { label: 'Confirmed', value: confirmed,               color: '#00E676' },
          { label: 'Pending',   value: pending,                 color: '#FFB300' },
          { label: 'Cancelled', value: cancelled,               color: '#FF4757' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="regs-summary-item"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <span
              className="regs-summary-value font-mono"
              style={{ color: s.color }}
            >
              {s.value.toLocaleString()}
            </span>
            <span className="regs-summary-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="regs-filters">
        <SearchBar
          id="regs-search"
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search name, email, ID, event..."
          className="regs-search"
        />

        <select
          id="regs-filter-event"
          className="regs-select"
          value={filterEvent}
          onChange={e => { setFilterEvent(e.target.value); setPage(1); }}
        >
          <option value="">All Events</option>
          {store.events.map(evt => (
            <option key={evt.id} value={evt.id}>{evt.name}</option>
          ))}
        </select>

        <select
          id="regs-filter-status"
          className="regs-select"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Result count */}
      {(search || filterEvent || filterStatus) && (
        <div className="regs-results-info">
          <span>
            Showing <strong className="text-cyan">{filtered.length}</strong> of {allParticipants.length} registrations
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => { setSearch(''); setFilterEvent(''); setFilterStatus(''); setPage(1); }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Table */}
      {pageData.length === 0 ? (
        <EmptyState preset="noParticipants" />
      ) : (
        <>
          <div className="regs-table-wrapper">
            <table className="regs-table" role="table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Student ID</th>
                  <th>Event</th>
                  <th>Department</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((p, i) => {
                  const cat = getCategoryById(p.eventCategory);
                  return (
                    <motion.tr
                      key={p.id}
                      className="regs-row"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    >
                      <td>
                        <button
                          className="regs-name-cell"
                          onClick={() => setSelected(p)}
                          type="button"
                        >
                          <Avatar name={p.name} initials={p.initials} size="sm" />
                          <div>
                            <p className="rn-name">{p.name}</p>
                            <p className="rn-email">{p.email}</p>
                          </div>
                        </button>
                      </td>
                      <td>
                        <span className="font-mono rn-id">{p.studentId}</span>
                      </td>
                      <td>
                        <div className="rn-event">
                          <span
                            className="rn-cat-icon"
                            title={cat.label}
                          >
                            {cat.icon}
                          </span>
                          <span className="rn-event-name">{p.eventName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rn-dept">{p.department}</span>
                      </td>
                      <td>
                        <span className="rn-time font-mono">{formatTimeAgo(p.registeredAt)}</span>
                      </td>
                      <td>
                        <Badge status={p.status} dot size="xs">
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <div className="rn-actions">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelected(p)}
                            id={`regs-view-${p.id}`}
                          >
                            View
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => setConfirmRemove(p)}
                            loading={removing === p.id}
                            id={`regs-remove-${p.id}`}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="regs-pagination">
            <p className="regs-pag-info font-mono">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        </>
      )}

      {/* Participant detail */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Registration Details" size="sm">
        {selected && (
          <div className="reg-detail">
            <div className="rd-header">
              <Avatar name={selected.name} initials={selected.initials} size="xl" />
              <div>
                <h3 className="rd-name">{selected.name}</h3>
                <p className="rd-email">{selected.email}</p>
              </div>
            </div>
            <div className="rd-fields">
              {[
                { label: 'Student ID',  value: selected.studentId },
                { label: 'Department',  value: selected.department },
                { label: 'Year',        value: selected.year },
                { label: 'Phone',       value: selected.phone },
                { label: 'Event',       value: selected.eventName },
                { label: 'Event Date',  value: formatDate(selected.eventDate) },
                { label: 'Registered',  value: formatTimeAgo(selected.registeredAt) },
              ].map(f => (
                <div key={f.label} className="rd-field">
                  <span className="rd-label">{f.label}</span>
                  <span className="rd-value">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="rd-status-row">
              <span className="rd-label">Status</span>
              <Badge status={selected.status} dot size="sm">
                {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
              </Badge>
            </div>
            <Button
              variant="danger"
              fullWidth
              onClick={() => { setSelected(null); setConfirmRemove(selected); }}
              id={`detail-remove-${selected?.id}`}
            >
              Cancel Registration
            </Button>
          </div>
        )}
      </Modal>

      {/* Confirm remove */}
      <Modal open={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Confirm Removal" size="sm">
        {confirmRemove && (
          <div className="confirm-remove-r">
            <div className="cr-icon">⚠️</div>
            <p className="cr-text">
              Remove <strong>{confirmRemove.name}</strong>'s registration for{' '}
              <strong>"{confirmRemove.eventName}"</strong>?
              This cannot be undone.
            </p>
            <div className="cr-actions">
              <Button variant="ghost" onClick={() => setConfirmRemove(null)} id="cr-cancel">
                Keep
              </Button>
              <Button
                variant="danger"
                onClick={() => handleRemove(confirmRemove)}
                loading={!!removing}
                id="cr-confirm"
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationsPage;
