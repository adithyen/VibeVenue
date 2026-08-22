// RegistrationDetailPage — Full-Screen Attendee Verification & Desk Management (2026 Impeccable Edition)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatTimeAgo, formatDate, formatDateTime, formatEventSchedule } from '../utils/dateUtils';
import './RegistrationDetailPage.css';

const RegistrationDetailPage = ({ attendeeId: propId, isOverlay = false, onClose }) => {
  const params = useParams();
  const navigate = useNavigate();
  const id = propId || params.id;

  const {
    getRecentRegistrations,
    updateParticipantStatus,
    updateCheckInStatus,
    updateAddonFulfillment,
    removeParticipant,
  } = useEventStore();
  const { addToast } = useUIStore();

  const [attendee, setAttendee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [zoomImage, setZoomImage] = useState(false);

  // Notes & Action Dialogs
  const [activeAction, setActiveAction] = useState(null); // 'needs_info' | 'rejected' | 'delete' | null
  const [actionReason, setActionReason] = useState('');

  // Fetch attendee data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getRecentRegistrations(1000).then((all) => {
      if (!isMounted) return;
      const found = all.find((a) => a.id === id || a.ticketId === id);
      setAttendee(found || null);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [id, getRecentRegistrations]);

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast({ type: 'info', title: 'Copied to clipboard', message: text });
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/registrations');
    }
  };

  // 1. Toggle Check-In Attendance
  const handleToggleCheckIn = async () => {
    if (!attendee) return;
    setIsUpdating(true);
    const newCheckIn = attendee.checkInStatus !== 'Checked In';
    const ok = await updateCheckInStatus(attendee.id, newCheckIn);
    if (ok) {
      const updated = {
        ...attendee,
        checkInStatus: newCheckIn ? 'Checked In' : 'Not Checked In',
        checkedInAt: newCheckIn ? new Date().toISOString() : null,
      };
      setAttendee(updated);
      addToast({
        type: newCheckIn ? 'success' : 'info',
        title: newCheckIn ? 'Attendee Checked In' : 'Check-In Reset',
        message: `${attendee.name} marked as ${newCheckIn ? 'Checked In' : 'Not Checked In'}.`,
      });
    }
    setIsUpdating(false);
  };

  // 2. Submit Decision Status with Reason
  const handleSubmitDecision = async () => {
    if (!attendee || !activeAction) return;
    setIsUpdating(true);

    if (activeAction === 'delete') {
      const ok = await removeParticipant(attendee.eventId, attendee.id);
      if (ok) {
        addToast({
          type: 'success',
          title: 'Registration Deleted',
          message: `Record for ${attendee.name} was permanently removed.`,
        });
        handleBack();
      }
      setIsUpdating(false);
      return;
    }

    const status = activeAction; // 'needs_info' | 'rejected'
    const ok = await updateParticipantStatus(attendee.id, status, actionReason.trim());
    if (ok) {
      const updated = {
        ...attendee,
        status,
        statusReason: actionReason.trim() || attendee.statusReason,
      };
      setAttendee(updated);
      setActiveAction(null);
      setActionReason('');
      addToast({
        type: status === 'rejected' ? 'error' : 'warning',
        title: `Status: ${status.toUpperCase()}`,
        message: actionReason.trim()
          ? `Status updated: "${actionReason.trim()}"`
          : `Registration marked as ${status}.`,
      });
    }
    setIsUpdating(false);
  };

  // 3. Quick Approve
  const handleApprove = async () => {
    if (!attendee) return;
    setIsUpdating(true);
    const ok = await updateParticipantStatus(attendee.id, 'confirmed');
    if (ok) {
      const updated = { ...attendee, status: 'confirmed', statusReason: null };
      setAttendee(updated);
      setActiveAction(null);
      addToast({
        type: 'success',
        title: 'Registration Approved ✓',
        message: `Pass for ${attendee.name} is now active and confirmed.`,
      });
    }
    setIsUpdating(false);
  };

  // 4. Toggle Add-on fulfillment
  const handleToggleAddon = async (addonLabel) => {
    if (!attendee) return;
    const currentProvided = attendee.addonsProvided || {};
    const nextVal = !currentProvided[addonLabel];
    const updatedProvided = { ...currentProvided, [addonLabel]: nextVal };

    const ok = await updateAddonFulfillment(attendee.id, addonLabel, nextVal);
    if (ok) {
      setAttendee({ ...attendee, addonsProvided: updatedProvided });
      addToast({
        type: 'info',
        title: 'Add-on Updated',
        message: `${addonLabel}: ${nextVal ? 'Provided' : 'Pending'}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="full-inspect-page">
        <div className="full-inspect-loading craft-card">
          <div className="spinner" />
          <p className="font-mono">Loading attendee verification dossier...</p>
        </div>
      </div>
    );
  }

  if (!attendee) {
    return (
      <div className="full-inspect-page">
        <div className="full-inspect-loading craft-card">
          <h2>Attendee Record Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            The registration pass you are searching for does not exist or has been deleted.
          </p>
          <Button variant="primary" onClick={handleBack}>
            Back to Registrations
          </Button>
        </div>
      </div>
    );
  }

  const isCheckedIn = attendee.checkInStatus === 'Checked In';
  const selectedAddOns = attendee.selectedAddOns || [];
  const addonsProvided = attendee.addonsProvided || {};

  return (
    <div className={`full-inspect-page ${isOverlay ? 'is-overlay' : ''}`}>
      {/* Top Header & Breadcrumbs Bar */}
      <div className="full-inspect-topbar">
        <button className="full-inspect-back-btn" onClick={handleBack} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Registrations
        </button>

        <div className="full-inspect-topbar-badges">
          <span className="dossier-ticket-pill font-mono">{attendee.ticketId}</span>
          <Badge status={attendee.status} dot size="sm">
            {attendee.status.toUpperCase()}
          </Badge>
          <span className={`dossier-checkin-pill font-mono ${isCheckedIn ? 'checked' : 'not-checked'}`}>
            {isCheckedIn ? '✓ CHECKED IN' : '○ NOT CHECKED'}
          </span>
        </div>
      </div>

      {/* Main Dossier 2-Column Layout */}
      <div className="full-inspect-grid">
        {/* Left Column: Delegate Information, Category & Payment Dossier */}
        <div className="full-inspect-col-main">
          {/* Delegate Hero Card */}
          <div className="dossier-card craft-card">
            <div className="dossier-user-header">
              <Avatar name={attendee.name} initials={attendee.initials} size="xl" />
              <div className="dossier-user-meta">
                <div className="dossier-name-row">
                  <h1 className="dossier-user-name">{attendee.name}</h1>
                  {attendee.college && (
                    <span className="dossier-college-pill font-mono">🏫 {attendee.college}</span>
                  )}
                </div>
                <p className="dossier-user-email font-mono">✉️ {attendee.email}</p>
                <div className="dossier-event-target font-mono">
                  <span>Registered for:</span>
                  <strong className="text-primary">{attendee.eventName || 'Event Program'}</strong>
                </div>
              </div>
            </div>

            {/* 4-Cell Academic & Contact Grid */}
            <div className="dossier-academic-grid font-mono">
              <div className="academic-cell">
                <span className="cell-label">ROLL NO / STUDENT ID</span>
                <div className="cell-val-copy-row">
                  <span className="cell-val">{attendee.studentId || attendee.rollNumber || '—'}</span>
                  {attendee.studentId && (
                    <button type="button" className="copy-icon-btn" onClick={() => copyText(attendee.studentId, 'roll')}>
                      {copiedKey === 'roll' ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="academic-cell">
                <span className="cell-label">PHONE NUMBER</span>
                <div className="cell-val-copy-row">
                  <a href={`tel:${attendee.phone}`} className="cell-phone-link">
                    📞 {attendee.phone || '—'}
                  </a>
                  {attendee.phone && (
                    <button type="button" className="copy-icon-btn" onClick={() => copyText(attendee.phone, 'phone')}>
                      {copiedKey === 'phone' ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="academic-cell">
                <span className="cell-label">ACADEMIC YEAR</span>
                <span className="cell-val">{attendee.year || '—'}</span>
              </div>

              <div className="academic-cell">
                <span className="cell-label">DEPARTMENT / BRANCH</span>
                <span className="cell-val">{attendee.department || '—'}</span>
              </div>
            </div>

            {/* Team Details if group registration */}
            {attendee.teamName && (
              <div className="dossier-team-box">
                <span className="team-badge font-mono">👥 TEAM: {attendee.teamName}</span>
                {attendee.teamMembers?.length > 0 && (
                  <div className="team-members-grid font-mono">
                    {attendee.teamMembers.map((m, idx) => {
                      const mName = typeof m === 'object' ? m.name : '';
                      const mEmail = typeof m === 'object' ? m.email : m;
                      return (
                        <div key={idx} className="team-member-chip">
                          <span className="m-num">#{idx + 1}</span>
                          <span className="m-name">{mName || 'Member'}</span>
                          {mEmail && <span className="m-email font-mono">({mEmail})</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category & Verification Proof Card */}
          <div className="dossier-card craft-card">
            <h3 className="dossier-section-heading">Category & Dynamic Pricing Verification</h3>

            <div className="dossier-tier-row">
              <div className="dossier-tier-left">
                <span className="tier-icon">🏷️</span>
                <div>
                  <span className="tier-name-label">{attendee.pricingTier || 'Individual Delegate'}</span>
                  <span className="tier-type-sub font-mono">
                    {attendee.registrationType === 'group' ? 'Team Pass' : 'Individual Pass'}
                  </span>
                </div>
              </div>
              <div className="dossier-paid-amount font-mono">
                <span className="paid-lbl">TOTAL PAID</span>
                <span className="paid-val">₹{attendee.totalPaid || 0}</span>
              </div>
            </div>

            {/* Membership / Eligibility Proof Alert */}
            {attendee.membershipProof ? (
              <div className="dossier-proof-highlight">
                <div className="proof-icon-box">🔒</div>
                <div className="proof-content">
                  <span className="proof-title">Membership / Verification Proof ID</span>
                  <span className="proof-id-str font-mono">{attendee.membershipProof}</span>
                </div>
                <button
                  type="button"
                  className="proof-copy-action-btn font-mono"
                  onClick={() => copyText(attendee.membershipProof, 'proof')}
                >
                  {copiedKey === 'proof' ? '✓ Copied' : '📋 Copy Proof ID'}
                </button>
              </div>
            ) : (
              <div className="no-proof-box font-mono">
                <span>✓ Standard Category — No special membership verification ID required</span>
              </div>
            )}
          </div>

          {/* Payment Verification Card */}
          <div className="dossier-card craft-card">
            <h3 className="dossier-section-heading">Payment Verification & Proof</h3>

            <div className="dossier-payment-grid">
              <div className="dossier-txn-box font-mono">
                <span className="dossier-field-lbl">TRANSACTION ID / UTR</span>
                <div className="txn-row">
                  <span className="txn-str">{attendee.txnId || 'Not provided'}</span>
                  {attendee.txnId && (
                    <button
                      type="button"
                      className="copy-icon-btn"
                      onClick={() => copyText(attendee.txnId, 'txn')}
                    >
                      {copiedKey === 'txn' ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>PAYMENT STATUS</span>
                  <span style={{ color: 'var(--accent-emerald, #059669)', fontWeight: 700 }}>
                    {attendee.totalPaid > 0 ? `₹${attendee.totalPaid} Paid` : 'Free Pass'}
                  </span>
                </div>
              </div>

              {attendee.screenshotUrl ? (
                <div className="dossier-screenshot-box">
                  <span className="dossier-field-lbl font-mono">PAYMENT RECEIPT SCREENSHOT</span>
                  <div className="receipt-preview-container" onClick={() => setZoomImage(true)}>
                    <img src={attendee.screenshotUrl} alt="Receipt" className="receipt-preview-img" />
                    <div className="receipt-zoom-hint font-mono">🔍 Click to Expand High-Res</div>
                  </div>
                </div>
              ) : (
                <div className="dossier-txn-box font-mono" style={{ justifyContent: 'center', background: 'var(--surface-inset)', borderStyle: 'dashed' }}>
                  <span className="dossier-field-lbl">PAYMENT RECEIPT ATTACHMENT</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    ℹ️ No receipt image attached by attendee. Verified via UTR / Transaction ID.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Add-ons Checklist */}
          {selectedAddOns.length > 0 && (
            <div className="dossier-card craft-card">
              <div className="addons-header-row">
                <h3 className="dossier-section-heading">Selected Add-ons & Distribution Checklist</h3>
                <span className="addons-pill font-mono">{selectedAddOns.length} Items</span>
              </div>

              <div className="dossier-addons-list">
                {selectedAddOns.map((addon) => {
                  const isProvided = !!addonsProvided[addon];
                  return (
                    <label key={addon} className={`dossier-addon-item ${isProvided ? 'provided' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isProvided}
                        onChange={() => handleToggleAddon(addon)}
                      />
                      <span className="addon-item-name">{addon}</span>
                      <span className={`addon-status-pill font-mono ${isProvided ? 'status-yes' : 'status-no'}`}>
                        {isProvided ? '✓ Provided at Desk' : '○ Pending Distribution'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Desk Operations, Decision Hub & Audit Trail */}
        <div className="full-inspect-col-side">
          {/* Gate Attendance Control */}
          <div className="dossier-card craft-card side-highlight-card">
            <h3 className="dossier-section-heading">Gate Check-In & Venue Access</h3>

            <div className="gate-checkin-block">
              <div className="gate-status-line">
                <span className="gate-lbl font-mono">CURRENT STATUS</span>
                <span className={`gate-badge font-mono ${isCheckedIn ? 'checked' : 'not-checked'}`}>
                  {isCheckedIn
                    ? `✓ Checked In (${formatTimeAgo(attendee.checkedInAt || attendee.registeredAt)})`
                    : '○ Not Checked In'}
                </span>
              </div>

              <Button
                type="button"
                variant={isCheckedIn ? 'secondary' : 'primary'}
                size="md"
                fullWidth
                loading={isUpdating}
                onClick={handleToggleCheckIn}
                className="gate-action-btn"
              >
                {isCheckedIn ? '↺ Reset Gate Check-In' : '✓ Mark Attendee Checked In'}
              </Button>
            </div>
          </div>

          {/* Registration Status & Decision Hub */}
          <div className="dossier-card craft-card">
            <h3 className="dossier-section-heading">Registration Decision Hub</h3>

            {/* Current status display */}
            <div className="current-status-banner">
              <span className="status-lbl font-mono">CURRENT STATUS:</span>
              <Badge status={attendee.status} dot size="sm">
                {attendee.status.toUpperCase()}
              </Badge>
            </div>

            {/* If there's an existing admin reason/note */}
            {attendee.statusReason && (
              <div className="admin-remark-box font-mono">
                <span className="remark-title">📝 Organizers Note / Feedback:</span>
                <p className="remark-text">"{attendee.statusReason}"</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="decision-actions-grid">
              <Button
                type="button"
                variant={attendee.status === 'confirmed' ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                loading={isUpdating}
                onClick={handleApprove}
              >
                ✓ Approve & Confirm
              </Button>

              <Button
                type="button"
                variant={activeAction === 'needs_info' ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                onClick={() => {
                  setActiveAction(activeAction === 'needs_info' ? null : 'needs_info');
                  setActionReason('');
                }}
              >
                ⚠️ Request More Info
              </Button>

              <Button
                type="button"
                variant={activeAction === 'rejected' ? 'danger' : 'secondary'}
                size="sm"
                fullWidth
                onClick={() => {
                  setActiveAction(activeAction === 'rejected' ? null : 'rejected');
                  setActionReason('');
                }}
              >
                ✕ Decline / Reject
              </Button>
            </div>

            {/* Inline Reason / Description Input Box */}
            <AnimatePresence>
              {(activeAction === 'needs_info' || activeAction === 'rejected') && (
                <motion.div
                  className="decision-reason-box"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <label className="reason-label font-mono">
                    {activeAction === 'needs_info'
                      ? '⚠️ What information or proof is missing / incorrect?'
                      : '✕ Reason for declining registration:'}
                  </label>
                  <textarea
                    className="craft-input reason-textarea"
                    rows={3}
                    placeholder={
                      activeAction === 'needs_info'
                        ? 'e.g. CSI Membership ID card photo is illegible. Please re-upload or share student ID.'
                        : 'e.g. Invalid UTR or payment screenshot not verified.'
                    }
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />

                  <div className="reason-actions-row">
                    <Button
                      type="button"
                      variant={activeAction === 'rejected' ? 'danger' : 'primary'}
                      size="sm"
                      loading={isUpdating}
                      onClick={handleSubmitDecision}
                    >
                      {activeAction === 'needs_info' ? 'Send Request Note ⚠️' : 'Confirm Decline ✕'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveAction(null);
                        setActionReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Danger Zone: Delete Record */}
            <div className="dossier-danger-zone">
              {activeAction !== 'delete' ? (
                <button
                  type="button"
                  className="delete-record-btn font-mono"
                  onClick={() => setActiveAction('delete')}
                >
                  🗑️ Delete Registration Record
                </button>
              ) : (
                <div className="confirm-delete-box">
                  <p className="delete-warn-txt font-mono">
                    Are you sure? This permanently deletes the pass and frees capacity.
                  </p>
                  <div className="delete-btns-row">
                    <Button type="button" variant="danger" size="xs" loading={isUpdating} onClick={handleSubmitDecision}>
                      Yes, Delete
                    </Button>
                    <Button type="button" variant="ghost" size="xs" onClick={() => setActiveAction(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Audit Timeline */}
          <div className="dossier-card craft-card font-mono">
            <h3 className="dossier-section-heading">Pass Audit Metadata</h3>
            <div className="audit-meta-list">
              <div className="audit-row">
                <span className="audit-lbl">REGISTERED AT:</span>
                <span className="audit-val">{formatDateTime(attendee.registeredAt)}</span>
              </div>
              <div className="audit-row">
                <span className="audit-lbl">GATE CHECK-IN:</span>
                <span className="audit-val">
                  {attendee.checkedInAt ? formatDateTime(attendee.checkedInAt) : 'Not Checked'}
                </span>
              </div>
              <div className="audit-row">
                <span className="audit-lbl">PASS TYPE:</span>
                <span className="audit-val">{attendee.pricingTier || 'Standard Individual'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Res Receipt Screenshot Zoom Modal */}
      {zoomImage && (
        <div className="zoom-modal-overlay" onClick={() => setZoomImage(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-modal-header">
              <span className="font-mono">Payment Proof Receipt — {attendee.name}</span>
              <button className="zoom-close-btn" onClick={() => setZoomImage(false)}>✕</button>
            </div>
            <img src={attendee.screenshotUrl} alt="Payment Receipt Zoom" className="zoom-image-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationDetailPage;
