import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import RegistrationInspectModal from './RegistrationInspectModal';
import { formatTimeAgo, formatDate } from '../../utils/dateUtils';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import './ParticipantTable.css';

const ParticipantTable = ({ participants, eventId, showEvent = false, onUpdateAttendee }) => {
  const [inspectAttendee, setInspectAttendee] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [promotingId, setPromotingId] = useState(null);

  const { removeParticipant, manualPromoteWaitlisted } = useEventStore();
  const { addToast } = useUIStore();

  const handleManualPromote = async (attendee) => {
    setPromotingId(attendee.id);
    const ok = await manualPromoteWaitlisted(eventId || attendee.eventId, attendee.id);
    if (ok) {
      addToast({
        type: 'success',
        title: 'Waitlist Delegate Promoted! 🎉',
        message: `${attendee.name} has been upgraded to Confirmed. Pass email dispatched!`,
      });
      onUpdateAttendee?.({ ...attendee, status: 'confirmed' });
    } else {
      addToast({
        type: 'error',
        title: 'Promotion Failed',
        message: 'Could not promote delegate to confirmed seat.',
      });
    }
    setPromotingId(null);
  };

  const handleCancelPass = async (attendee) => {
    setIsRemoving(true);
    await new Promise((r) => setTimeout(r, 350));
    
    await removeParticipant(eventId || attendee.eventId, attendee.id);
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="attendee-full-name">{attendee.name}</span>
                          {(attendee.teamName || (Array.isArray(attendee.teamMembers) && attendee.teamMembers.length > 0)) && (
                            <span className="font-mono" style={{ fontSize: '0.625rem', color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              👥 {attendee.teamName || 'Team'}
                            </span>
                          )}
                        </div>
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
                    {(() => {
                      const members = Array.isArray(attendee.teamMembers) ? attendee.teamMembers : [];
                      const isGrp = attendee.registrationType === 'group' || members.length > 0;
                      const checkedCount = members.filter((m) => m.checkedIn).length;
                      const isFullyPresent = isGrp ? (members.length > 0 && checkedCount === members.length) : attendee.checkInStatus === 'Checked In';
                      const isPartiallyPresent = isGrp && checkedCount > 0 && checkedCount < members.length;

                      if (isFullyPresent) {
                        return (
                          <span className="checkin-status font-mono checkin-yes">
                            ✓ {isGrp ? `Team Present (${members.length}/${members.length})` : 'Checked In'}
                          </span>
                        );
                      }
                      if (isPartiallyPresent) {
                        return (
                          <span className="checkin-status font-mono" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            🟡 Partial ({checkedCount}/{members.length})
                          </span>
                        );
                      }
                      return (
                        <span className="checkin-status font-mono checkin-no">
                          ○ {isGrp ? `Absent (0/${members.length})` : 'Not Checked'}
                        </span>
                      );
                    })()}
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
                      {attendee.status === 'waitlisted' && (
                        <Button
                          variant="primary"
                          size="xs"
                          loading={promotingId === attendee.id}
                          onClick={() => handleManualPromote(attendee)}
                          style={{ background: '#10B981', borderColor: '#059669', color: '#000000', fontWeight: 700 }}
                          id={`promote-pass-${attendee.id}`}
                        >
                          ⚡ Promote
                        </Button>
                      )}

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
                        {attendee.status === 'waitlisted' ? 'Remove' : 'Cancel'}
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* High-Craft Registration Inspection & Verification Modal */}
      <RegistrationInspectModal
        open={!!inspectAttendee}
        attendee={inspectAttendee}
        onClose={() => setInspectAttendee(null)}
        onUpdate={(updated) => {
          setInspectAttendee(updated);
          onUpdateAttendee?.(updated);
        }}
      />

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
