// RegistrationInspectModal — High-Craft Verification, Approval & Attendance Management (2026 Edition)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import { formatTimeAgo, formatDate } from '../../utils/dateUtils';
import './RegistrationInspectModal.css';

const RegistrationInspectModal = ({ attendee, open, onClose, onUpdate }) => {
  const { updateParticipantStatus, updateCheckInStatus, updateAddonFulfillment, removeParticipant } = useEventStore();
  const { addToast } = useUIStore();

  const [currentAttendee, setCurrentAttendee] = useState(attendee);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [zoomImage, setZoomImage] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  React.useEffect(() => {
    setCurrentAttendee(attendee);
    setConfirmRevoke(false);
  }, [attendee, open]);

  if (!open || !currentAttendee) return null;

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast({ type: 'info', title: 'Copied', message: text });
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // 1. Attendance Check-In Toggle
  const handleToggleCheckIn = async () => {
    setIsUpdating(true);
    const newCheckIn = currentAttendee.checkInStatus !== 'Checked In';
    const ok = await updateCheckInStatus(currentAttendee.id, newCheckIn);
    if (ok) {
      const updated = {
        ...currentAttendee,
        checkInStatus: newCheckIn ? 'Checked In' : 'Not Checked In',
        checkedInAt: newCheckIn ? new Date().toISOString() : null,
      };
      setCurrentAttendee(updated);
      onUpdate?.(updated);
      addToast({
        type: newCheckIn ? 'success' : 'info',
        title: newCheckIn ? 'Attendee Checked In' : 'Check-In Reset',
        message: `${currentAttendee.name} marked as ${newCheckIn ? 'Checked In' : 'Not Checked In'}.`,
      });
    }
    setIsUpdating(false);
  };

  // 2. Status Updates (Approve, Needs Info, Decline)
  const handleSetStatus = async (status) => {
    setIsUpdating(true);
    const ok = await updateParticipantStatus(currentAttendee.id, status);
    if (ok) {
      const updated = { ...currentAttendee, status };
      setCurrentAttendee(updated);
      onUpdate?.(updated);
      addToast({
        type: status === 'confirmed' ? 'success' : status === 'rejected' ? 'error' : 'warning',
        title: `Status: ${status.toUpperCase()}`,
        message: `Registration marked as ${status}.`,
      });
    }
    setIsUpdating(false);
  };

  // 3. Add-on Fulfillment Checkbox Toggle
  const handleToggleAddon = async (addonLabel) => {
    const currentProvided = currentAttendee.addonsProvided || {};
    const nextVal = !currentProvided[addonLabel];
    const updatedProvided = { ...currentProvided, [addonLabel]: nextVal };

    const ok = await updateAddonFulfillment(currentAttendee.id, addonLabel, nextVal);
    if (ok) {
      const updated = { ...currentAttendee, addonsProvided: updatedProvided };
      setCurrentAttendee(updated);
      onUpdate?.(updated);
      addToast({
        type: 'info',
        title: 'Add-on Updated',
        message: `${addonLabel}: ${nextVal ? 'Provided' : 'Pending'}`,
      });
    }
  };

  // 4. Revoke Pass
  const handleRevoke = async () => {
    setIsUpdating(true);
    const ok = await removeParticipant(currentAttendee.eventId, currentAttendee.id);
    if (ok) {
      addToast({
        type: 'success',
        title: 'Pass Revoked',
        message: `Registration for ${currentAttendee.name} was removed.`,
      });
      onClose();
    }
    setIsUpdating(false);
  };

  const isCheckedIn = currentAttendee.checkInStatus === 'Checked In';
  const selectedAddOns = currentAttendee.selectedAddOns || [];
  const addonsProvided = currentAttendee.addonsProvided || {};

  return (
    <AnimatePresence>
      <motion.div
        className="inspect-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="inspect-modal-card craft-card"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Strip */}
          <div className="inspect-header">
            <div className="inspect-header-left">
              <div className="inspect-badge-row">
                <span className="inspect-ticket-badge font-mono">{currentAttendee.ticketId || 'PASS'}</span>
                <span className="inspect-event-category font-mono">
                  {currentAttendee.eventCategory?.toUpperCase() || 'EVENT'}
                </span>
                <Badge status={currentAttendee.status} dot size="xs">
                  {currentAttendee.status.toUpperCase()}
                </Badge>
              </div>
              <h2 className="inspect-event-name">{currentAttendee.eventName || 'Symposium Track'}</h2>
            </div>
            <button className="inspect-close-btn" onClick={onClose} aria-label="Close modal" type="button">
              ✕
            </button>
          </div>

          <div className="inspect-body-scroll">
            {/* Delegate Profile Card */}
            <div className="inspect-section-card">
              <div className="inspect-user-hero">
                <Avatar name={currentAttendee.name} initials={currentAttendee.initials} size="xl" />
                <div className="inspect-user-details">
                  <div className="inspect-user-name-line">
                    <h3 className="inspect-user-name">{currentAttendee.name}</h3>
                    {currentAttendee.college && (
                      <span className="inspect-college-tag font-mono">{currentAttendee.college}</span>
                    )}
                  </div>
                  <p className="inspect-user-email font-mono">{currentAttendee.email}</p>
                </div>
              </div>

              <div className="inspect-meta-grid font-mono">
                <div className="inspect-meta-cell">
                  <span className="cell-label">STUDENT ID / ROLL NO</span>
                  <div className="cell-value-copy">
                    <span className="cell-value">{currentAttendee.studentId || currentAttendee.rollNumber || '—'}</span>
                    {currentAttendee.studentId && (
                      <button
                        type="button"
                        className="cell-copy-btn"
                        onClick={() => copyText(currentAttendee.studentId, 'roll')}
                      >
                        {copiedKey === 'roll' ? '✓' : '📋'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="inspect-meta-cell">
                  <span className="cell-label">CONTACT PHONE</span>
                  <div className="cell-value-copy">
                    <a href={`tel:${currentAttendee.phone}`} className="cell-link font-mono">
                      {currentAttendee.phone || '—'}
                    </a>
                    {currentAttendee.phone && (
                      <button
                        type="button"
                        className="cell-copy-btn"
                        onClick={() => copyText(currentAttendee.phone, 'phone')}
                      >
                        {copiedKey === 'phone' ? '✓' : '📋'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="inspect-meta-cell">
                  <span className="cell-label">ACADEMIC YEAR</span>
                  <span className="cell-value">{currentAttendee.year || '—'}</span>
                </div>

                <div className="inspect-meta-cell">
                  <span className="cell-label">DEPARTMENT</span>
                  <span className="cell-value">{currentAttendee.department || '—'}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Category & Verification Proof Section */}
            <div className="inspect-section-card">
              <h4 className="inspect-section-title">Category & Verification Proof</h4>
              <div className="inspect-tier-box">
                <div className="tier-badge-row">
                  <span className="tier-label-txt">🏷️ {currentAttendee.pricingTier || 'Individual Delegate'}</span>
                  {currentAttendee.totalPaid > 0 ? (
                    <span className="tier-amount-pill font-mono">Amount Paid: ₹{currentAttendee.totalPaid}</span>
                  ) : (
                    <span className="tier-amount-pill free font-mono">Free Pass</span>
                  )}
                </div>

                {/* Proof string if member discount applied */}
                {currentAttendee.membershipProof ? (
                  <div className="proof-verification-alert">
                    <div className="proof-alert-header">
                      <span className="proof-lock-icon">🔒</span>
                      <div>
                        <span className="proof-title">Membership / Eligibility Proof ID:</span>
                        <span className="proof-value font-mono">{currentAttendee.membershipProof}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="proof-copy-btn font-mono"
                      onClick={() => copyText(currentAttendee.membershipProof, 'proof')}
                    >
                      {copiedKey === 'proof' ? '✓ Copied' : '📋 Copy ID'}
                    </button>
                  </div>
                ) : (
                  <p className="no-proof-note font-mono">No special ID verification requested for this tier.</p>
                )}
              </div>

              {/* Team members if group registration */}
              {currentAttendee.teamName && (
                <div className="inspect-team-block">
                  <span className="team-title font-mono">👥 TEAM: {currentAttendee.teamName}</span>
                  {currentAttendee.teamMembers?.length > 0 && (
                    <div className="team-members-list font-mono">
                      {currentAttendee.teamMembers.map((m, idx) => {
                        const mName = typeof m === 'object' ? m.name : '';
                        const mEmail = typeof m === 'object' ? m.email : m;
                        return (
                          <div key={idx} className="team-member-pill">
                            <span>#{idx + 1} {mName || 'Member'}</span>
                            {mEmail && <span className="member-email">({mEmail})</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Verification Section */}
            {(currentAttendee.txnId || currentAttendee.screenshotUrl) && (
              <div className="inspect-section-card">
                <h4 className="inspect-section-title">Payment Verification Record</h4>
                <div className="payment-verify-grid">
                  {currentAttendee.txnId && (
                    <div className="payment-info-box font-mono">
                      <span className="payment-lbl">TRANSACTION ID / UTR</span>
                      <div className="payment-val-row">
                        <span className="payment-val">{currentAttendee.txnId}</span>
                        <button
                          type="button"
                          className="payment-copy-btn"
                          onClick={() => copyText(currentAttendee.txnId, 'txn')}
                        >
                          {copiedKey === 'txn' ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {currentAttendee.screenshotUrl && (
                    <div className="payment-screenshot-box">
                      <span className="payment-lbl font-mono">PAYMENT RECEIPT SCREENSHOT</span>
                      <div className="screenshot-thumb-container" onClick={() => setZoomImage(true)}>
                        <img src={currentAttendee.screenshotUrl} alt="Receipt" className="screenshot-thumb" />
                        <div className="zoom-hint-overlay">🔍 Click to Zoom</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add-ons & Distribution Checklist */}
            {selectedAddOns.length > 0 && (
              <div className="inspect-section-card">
                <div className="inspect-section-header-row">
                  <h4 className="inspect-section-title">Selected Add-ons & Distribution</h4>
                  <span className="addons-count-pill font-mono">{selectedAddOns.length} Selected</span>
                </div>
                <div className="addons-checklist">
                  {selectedAddOns.map((addon) => {
                    const isProvided = !!addonsProvided[addon];
                    return (
                      <label key={addon} className={`addon-check-item ${isProvided ? 'provided' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isProvided}
                          onChange={() => handleToggleAddon(addon)}
                        />
                        <span className="addon-check-label">{addon}</span>
                        <span className={`addon-status-pill font-mono ${isProvided ? 'status-yes' : 'status-no'}`}>
                          {isProvided ? '✓ Provided' : '○ Pending'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verification Actions Control Bar */}
            <div className="inspect-section-card inspect-actions-card">
              <h4 className="inspect-section-title">Desk Verification & Gate Actions</h4>

              <div className="inspect-gate-row">
                <div className="gate-status-col">
                  <span className="gate-lbl font-mono">GATE ATTENDANCE</span>
                  <span className={`gate-status-badge font-mono ${isCheckedIn ? 'checked' : 'pending'}`}>
                    {isCheckedIn ? `✓ Checked In (${formatTimeAgo(currentAttendee.checkedInAt || currentAttendee.registeredAt)})` : '○ Not Checked In'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant={isCheckedIn ? 'secondary' : 'primary'}
                  size="sm"
                  loading={isUpdating}
                  onClick={handleToggleCheckIn}
                >
                  {isCheckedIn ? '↺ Reset Check-In' : '✓ Mark Checked In'}
                </Button>
              </div>

              {/* Status Decision Buttons */}
              <div className="inspect-decision-row">
                <span className="decision-label font-mono">REGISTRATION DECISION:</span>
                <div className="decision-buttons-flex">
                  <Button
                    type="button"
                    variant={currentAttendee.status === 'confirmed' ? 'primary' : 'secondary'}
                    size="sm"
                    loading={isUpdating}
                    onClick={() => handleSetStatus('confirmed')}
                  >
                    ✓ Approve / Confirm
                  </Button>

                  <Button
                    type="button"
                    variant={currentAttendee.status === 'needs_info' ? 'primary' : 'secondary'}
                    size="sm"
                    loading={isUpdating}
                    onClick={() => handleSetStatus('needs_info')}
                  >
                    ⚠️ Request More Info
                  </Button>

                  <Button
                    type="button"
                    variant={currentAttendee.status === 'rejected' ? 'danger' : 'secondary'}
                    size="sm"
                    loading={isUpdating}
                    onClick={() => handleSetStatus('rejected')}
                  >
                    ✕ Decline / Reject
                  </Button>
                </div>
              </div>

              {/* Revoke / Delete Pass Action */}
              <div className="inspect-danger-zone">
                {!confirmRevoke ? (
                  <button
                    type="button"
                    className="revoke-trigger-btn font-mono"
                    onClick={() => setConfirmRevoke(true)}
                  >
                    🗑️ Revoke & Delete Registration
                  </button>
                ) : (
                  <div className="confirm-revoke-box">
                    <span className="confirm-revoke-txt">Are you sure? This deletes the pass and restores capacity.</span>
                    <div className="confirm-revoke-actions">
                      <Button type="button" variant="danger" size="xs" loading={isUpdating} onClick={handleRevoke}>
                        Yes, Revoke Pass
                      </Button>
                      <Button type="button" variant="ghost" size="xs" onClick={() => setConfirmRevoke(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* High-Res Receipt Screenshot Zoom Modal */}
      {zoomImage && (
        <div className="zoom-modal-overlay" onClick={() => setZoomImage(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-modal-header">
              <span className="font-mono">Payment Proof Receipt</span>
              <button className="zoom-close-btn" onClick={() => setZoomImage(false)}>✕</button>
            </div>
            <img src={currentAttendee.screenshotUrl} alt="Payment Receipt Zoom" className="zoom-image-full" />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationInspectModal;
