// Tactile Attendee Manifest Data Table
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { formatTimeAgo, formatDate } from '../../utils/dateUtils';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import './ParticipantTable.css';

const ParticipantTable = ({ participants, eventId, showEvent = false }) => {
  const [inspectAttendee, setInspectAttendee] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { removeParticipant } = useEventStore();
  const { addToast } = useUIStore();

  const handleCancelPass = async (attendee) => {
    setIsRemoving(true);
    // Simulate brief network delay
    await new Promise((r) => setTimeout(r, 450));
    
    removeParticipant(eventId || attendee.eventId, attendee.id);
    addToast({
      type: 'success',
      title: 'Registration Cancelled',
      message: `Pass for ${attendee.name} (${attendee.studentId}) was revoked.`,
    });

    setIsRemoving(false);
    setConfirmRemove(null);
    setInspectAttendee(null);
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="empty-table-state">
        <span className="empty-table-icon">👥</span>
        <p className="empty-table-text">No registered attendees match the current criteria.</p>
      </div>
    );
  }

  return (
    <div className="attendee-table-container">
      <div className="attendee-table-scroll">
        <table className="craft-data-table" role="table">
          <thead>
            <tr>
              <th scope="col">Attendee & Roll No</th>
              <th scope="col">Ticket ID</th>
              <th scope="col">Engineering Dept</th>
              {showEvent && <th scope="col">Event Program</th>}
              <th scope="col">Registered</th>
              <th scope="col">Check-in Status</th>
              <th scope="col">Status</th>
              <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {participants.map((attendee) => (
                <motion.tr
                  key={attendee.id}
                  className="craft-table-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.15 }}
                  layout
                >
                  {/* Attendee */}
                  <td>
                    <button
                      className="attendee-name-btn"
                      onClick={() => setInspectAttendee(attendee)}
                      type="button"
                    >
                      <Avatar name={attendee.name} initials={attendee.initials} size="sm" />
                      <div className="attendee-text-col">
                        <span className="attendee-full-name">{attendee.name}</span>
                        <span className="attendee-roll font-mono">{attendee.studentId}</span>
                      </div>
                    </button>
                  </td>

                  {/* Ticket ID */}
                  <td>
                    <span className="ticket-id-pill font-mono">{attendee.ticketId}</span>
                  </td>

                  {/* Department */}
                  <td>
                    <span className="attendee-dept-txt">{attendee.department}</span>
                  </td>

                  {/* Event Program if in multi-event list */}
                  {showEvent && (
                    <td>
                      <span className="attendee-event-txt">{attendee.eventName}</span>
                    </td>
                  )}

                  {/* Registered Timestamp */}
                  <td>
                    <span className="attendee-time-txt font-mono">
                      {formatTimeAgo(attendee.registeredAt)}
                    </span>
                  </td>

                  {/* Check-in */}
                  <td>
                    <span className={`checkin-status font-mono ${attendee.checkInStatus === 'Checked In' ? 'checkin-yes' : 'checkin-no'}`}>
                      {attendee.checkInStatus || 'Not Checked'}
                    </span>
                  </td>

                  {/* Registration Status */}
                  <td>
                    <Badge status={attendee.status} dot size="xs">
                      {attendee.status.toUpperCase()}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-flex">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setInspectAttendee(attendee)}
                        id={`inspect-pass-${attendee.id}`}
                      >
                        Inspect
                      </Button>

                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => setConfirmRemove(attendee)}
                        id={`cancel-pass-${attendee.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Attendee Ticket Pass Inspection Modal */}
      <Modal
        open={!!inspectAttendee}
        onClose={() => setInspectAttendee(null)}
        title="Student Registration Pass"
        subtitle="Official symposium entry credential & verification pass"
        size="md"
      >
        {inspectAttendee && (
          <div className="ticket-pass-card">
            {/* Ticket Header Strip */}
            <div className="pass-header">
              <div className="pass-brand-row">
                <span className="pass-fest font-mono">VIBEVENUE '26</span>
                <span className="pass-id-badge font-mono">{inspectAttendee.ticketId}</span>
              </div>
              <h3 className="pass-event-title">{inspectAttendee.eventName || 'Symposium Track'}</h3>
            </div>

            {/* Pass Body */}
            <div className="pass-body">
              <div className="pass-student-info">
                <Avatar name={inspectAttendee.name} initials={inspectAttendee.initials} size="lg" />
                <div className="pass-name-col">
                  <h4 className="pass-student-name">{inspectAttendee.name}</h4>
                  <p className="pass-email font-mono">{inspectAttendee.email}</p>
                </div>
              </div>

              <div className="pass-grid">
                <div className="pass-grid-item">
                  <span className="pass-lbl">Student Roll ID</span>
                  <span className="pass-val font-mono">{inspectAttendee.studentId}</span>
                </div>
                <div className="pass-grid-item">
                  <span className="pass-lbl">Engineering Dept</span>
                  <span className="pass-val">{inspectAttendee.department}</span>
                </div>
                <div className="pass-grid-item">
                  <span className="pass-lbl">Academic Year</span>
                  <span className="pass-val">{inspectAttendee.year}</span>
                </div>
                <div className="pass-grid-item">
                  <span className="pass-lbl">Contact Phone</span>
                  <span className="pass-val font-mono">{inspectAttendee.phone}</span>
                </div>
                <div className="pass-grid-item">
                  <span className="pass-lbl">Pass Status</span>
                  <Badge status={inspectAttendee.status} dot size="sm">
                    {inspectAttendee.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="pass-grid-item">
                  <span className="pass-lbl">Gate Check-in</span>
                  <span className="pass-val font-mono">{inspectAttendee.checkInStatus || 'Not Checked'}</span>
                </div>
                {inspectAttendee.teamName && (
                  <div className="pass-grid-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="pass-lbl">Team Name</span>
                    <span className="pass-val">👥 {inspectAttendee.teamName}</span>
                  </div>
                )}
                {inspectAttendee.teamMembers && inspectAttendee.teamMembers.length > 0 && (
                  <div className="pass-grid-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="pass-lbl">Team Members ({inspectAttendee.teamMembers.length})</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {inspectAttendee.teamMembers.map((m, idx) => {
                        const name = typeof m === 'object' ? m.name : '';
                        const email = typeof m === 'object' ? m.email : m;
                        return (
                          <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            • {name ? <strong>{name}</strong> : null} {email ? <span className="font-mono">({email})</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Barcode Mock */}
              <div className="pass-barcode-box">
                <div className="barcode-lines" />
                <span className="barcode-code font-mono">{inspectAttendee.ticketId}-SYMP-2026</span>
              </div>
            </div>

            {/* Pass Actions */}
            <div className="pass-actions">
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => {
                  setInspectAttendee(null);
                  setConfirmRemove(inspectAttendee);
                }}
              >
                Revoke / Cancel Registration
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revocation Confirmation Dialog */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Revoke Registration Pass?"
        subtitle="This action will release the seat back into the available pool"
        size="sm"
      >
        {confirmRemove && (
          <div className="revoke-confirm-body">
            <p className="revoke-warn-txt">
              Are you sure you want to cancel the registration for{' '}
              <strong>{confirmRemove.name}</strong> ({confirmRemove.studentId})?
            </p>

            <div className="revoke-actions">
              <Button
                variant="secondary"
                onClick={() => setConfirmRemove(null)}
              >
                Keep Pass
              </Button>
              <Button
                variant="danger"
                loading={isRemoving}
                onClick={() => handleCancelPass(confirmRemove)}
              >
                Confirm Revocation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParticipantTable;
