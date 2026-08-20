// ParticipantTable — sortable, searchable participant table with remove action
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { formatTimeAgo } from '../../utils/dateUtils';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import './ParticipantTable.css';

const ParticipantTable = ({ participants, eventId, showEvent = false }) => {
  const [selected, setSelected] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(null);
  const { removeParticipant } = useEventStore();
  const { addToast } = useUIStore();

  const handleRemove = async (participant) => {
    setRemoving(participant.id);
    await new Promise(r => setTimeout(r, 600));
    removeParticipant(eventId || participant.eventId, participant.id);
    addToast({
      type: 'success',
      title: 'Registration Cancelled',
      message: `${participant.name}'s registration has been removed.`,
    });
    setRemoving(null);
    setConfirmRemove(null);
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="no-participants">
        <span>👥</span>
        <p>No participants found</p>
      </div>
    );
  }

  return (
    <div className="participant-table-wrapper">
      <div className="participant-table-scroll">
        <table className="participant-table" role="table">
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col">Student ID</th>
              <th scope="col">Department</th>
              {showEvent && <th scope="col">Event</th>}
              <th scope="col">Registered</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {participants.map((p, i) => (
                <motion.tr
                  key={p.id}
                  className="participant-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  layout
                >
                  <td>
                    <button
                      className="participant-cell-name"
                      onClick={() => setSelected(p)}
                      type="button"
                    >
                      <Avatar name={p.name} initials={p.initials} size="sm" />
                      <div>
                        <p className="p-name">{p.name}</p>
                        <p className="p-email">{p.email}</p>
                      </div>
                    </button>
                  </td>
                  <td>
                    <span className="font-mono text-sm p-id">{p.studentId}</span>
                  </td>
                  <td>
                    <span className="p-dept">{p.department}</span>
                  </td>
                  {showEvent && (
                    <td>
                      <span className="p-event">{p.eventName || '—'}</span>
                    </td>
                  )}
                  <td>
                    <span className="p-time">{formatTimeAgo(p.registeredAt)}</span>
                  </td>
                  <td>
                    <Badge status={p.status} dot size="xs">
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <div className="p-actions">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelected(p)}
                        id={`view-p-${p.id}`}
                        title="View details"
                      >
                        View
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => setConfirmRemove(p)}
                        loading={removing === p.id}
                        id={`remove-p-${p.id}`}
                        title="Cancel registration"
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Participant Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Participant Details"
        size="sm"
      >
        {selected && (
          <div className="participant-detail">
            <div className="pd-header">
              <Avatar name={selected.name} initials={selected.initials} size="xl" />
              <div>
                <h3 className="pd-name">{selected.name}</h3>
                <p className="pd-email">{selected.email}</p>
                <Badge status={selected.status} dot size="sm" className="pd-status">
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="pd-fields">
              {[
                { label: 'Student ID', value: selected.studentId },
                { label: 'Department', value: selected.department },
                { label: 'Year', value: selected.year },
                { label: 'Phone', value: selected.phone },
                { label: 'Registered', value: formatTimeAgo(selected.registeredAt) },
              ].map(f => (
                <div key={f.label} className="pd-field">
                  <span className="pd-field-label">{f.label}</span>
                  <span className="pd-field-value">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="pd-actions">
              <Button
                variant="danger"
                onClick={() => { setSelected(null); setConfirmRemove(selected); }}
                fullWidth
                id={`pd-remove-${selected.id}`}
              >
                Cancel Registration
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Remove Modal */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Confirm Removal"
        size="sm"
      >
        {confirmRemove && (
          <div className="confirm-remove">
            <div className="confirm-icon">⚠️</div>
            <p className="confirm-text">
              Are you sure you want to cancel <strong>{confirmRemove.name}</strong>'s registration?
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <Button
                variant="ghost"
                onClick={() => setConfirmRemove(null)}
                id="confirm-cancel"
              >
                Keep Registration
              </Button>
              <Button
                variant="danger"
                onClick={() => handleRemove(confirmRemove)}
                loading={!!removing}
                id="confirm-remove"
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParticipantTable;
