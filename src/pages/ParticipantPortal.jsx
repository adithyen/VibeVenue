import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import EditProfileModal from '../components/profile/EditProfileModal';
import PassBarcodeQR from '../components/common/PassBarcodeQR';
import { formatDate, formatEventSchedule, getEventFeeDisplay, getComputedEventStatus, getRegistrationStatusInfo } from '../utils/dateUtils';
import './ParticipantPortal.css';

const ParticipantPortal = () => {
  const navigate = useNavigate();
  const { user, logout, getParticipantPasses } = useAuthStore();
  const { events, removeParticipant, updateEvent } = useEventStore();
  const { addToast } = useUIStore();

  const [inspectPass, setInspectPass] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [passes, setPasses] = useState([]);
  const [passesLoading, setPassesLoading] = useState(true);

  // Fetch passes from Supabase
  const refreshPasses = useCallback(async () => {
    setPassesLoading(true);
    const data = await getParticipantPasses();
    setPasses(data || []);
    setPassesLoading(false);
  }, [getParticipantPasses]);

  useEffect(() => {
    refreshPasses();
  }, [user?.id, refreshPasses]);

  // Realtime subscription — any pass change refreshes dashboard instantly
  useEffect(() => {
    const channel = supabase
      .channel('participant-passes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        refreshPasses();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshPasses]);

  // Compute upcoming & ongoing events available for registration
  // Filter out registered events AND filter by target academic year if restricted
  const registeredEventIds = new Set(passes.map(p => p.eventId));
  const studentYear = user?.year || '';

  const availableEvents = useMemo(() => {
    return events
      .filter(evt => {
        const computedStatus = getComputedEventStatus(evt);
        return computedStatus !== 'completed' && computedStatus !== 'cancelled';
      })
      .filter(evt => !registeredEventIds.has(evt.id))
      .filter(evt => {
        const openTo = Array.isArray(evt.openTo) ? evt.openTo : ['All'];
        if (openTo.includes('All') || openTo.length === 0) return true;
        if (!studentYear) return true;
        return openTo.includes(studentYear);
      });
  }, [events, passes, studentYear]);

  // Handle new self-registration — navigates to full-page registration view
  const handleSelfRegister = (event) => {
    const regInfo = getRegistrationStatusInfo(event);
    if (!regInfo.isOpen) {
      addToast({
        type: 'error',
        title: regInfo.isFull ? 'Event Full' : 'Registration Closed',
        message: regInfo.isFull ? `"${event.name}" has reached capacity.` : `Registration deadline for "${event.name}" has passed.`,
      });
      return;
    }
    navigate(`/portal/register/${event.id}`);
  };


  // Revoke self registration pass
  const handleRevokePass = async (pass) => {
    setIsRevoking(true);
    const ok = await removeParticipant(pass.eventId, pass.id);
    if (ok) {
      setPasses(prev => prev.filter(p => p.id !== pass.id));
      addToast({
        type: 'success',
        title: 'Pass Revoked',
        message: `Your registration for "${pass.eventName}" has been cancelled.`,
      });
    } else {
      addToast({ type: 'error', title: 'Error', message: 'Could not cancel registration.' });
    }
    setIsRevoking(false);
    setConfirmCancel(null);
    setInspectPass(null);
  };

  return (
    <div className="portal-view">
      {/* Banner */}
      <div className="portal-banner">
        <div className="portal-banner-content">
          <div className="portal-welcome-row">
            <Avatar name={user.name} initials={user.initials} size="lg" />
            <div>
              <h1 className="portal-greeting font-display">Welcome back, {user.name.split(' ')[0]}!</h1>
              <p className="portal-banner-sub">
                Manage your credentials, explore technical tracks, and present your entry passes.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            }
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="portal-grid">
        {/* Left: Active Passes & Tickets */}
        <div className="portal-main-section">
          <div className="section-title-row">
            <h3 className="portal-section-title">My Digital Passes ({passes.length})</h3>
            <span className="section-pill font-mono">Operations Live</span>
          </div>

          <div className="passes-grid">
            {passes.map((pass) => (
              <div key={pass.id} className="craft-card pass-ticket-item">
                <div className="ticket-top">
                  <Badge category={pass.eventCategory} size="xs">
                    {pass.eventCategory.toUpperCase()}
                  </Badge>
                  <span className="ticket-id font-mono">{pass.ticketId}</span>
                </div>
                <h4 className="ticket-title">{pass.eventName}</h4>
                <div className="ticket-logistics font-mono">
                  <p>📍 {pass.eventVenue}</p>
                  <p>📅 {formatDate(pass.eventDate)} · {pass.eventTime}</p>
                </div>
                <div className="ticket-footer">
                  <Badge status={pass.status} dot size="xs">
                    {pass.status.toUpperCase()}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setInspectPass(pass)}
                  >
                    View Pass
                  </Button>
                </div>
              </div>
            ))}

            {passes.length === 0 && (
              <div className="no-passes-placeholder">
                <span>🎫</span>
                <p>No active event passes registered. Scroll below to browse open tracks!</p>
              </div>
            )}
          </div>

          {/* Browse Available Registration Tracks */}
          <div className="portal-browse-section">
            <div className="section-title-row">
              <h3 className="portal-section-title">
                {availableEvents.some(e => getComputedEventStatus(e) === 'ongoing') ? 'Live & Upcoming Tracks' : 'Available Tracks'}
              </h3>
              <span className={`section-pill font-mono ${availableEvents.some(e => getComputedEventStatus(e) === 'ongoing') ? 'pill-live' : ''}`}>
                {availableEvents.length === 0
                  ? 'No Tracks Available'
                  : availableEvents.every(e => getRegistrationStatusInfo(e).isClosed)
                    ? 'Registrations Closed'
                    : availableEvents.some(e => getRegistrationStatusInfo(e).isSpot)
                      ? '⚡ Spot Registration Active'
                      : availableEvents.some(e => getComputedEventStatus(e) === 'ongoing')
                        ? '🔴 Live Events Active'
                        : 'Registration Open'}
              </span>
            </div>

            <div className="recommended-grid">
              {availableEvents.map((event) => {
                const computedStatus = getComputedEventStatus(event);
                const regInfo = getRegistrationStatusInfo(event);

                return (
                  <div key={event.id} className="craft-card rec-event-card">
                    {event.bannerUrl && (
                      <div className="rec-card-banner" style={{ backgroundImage: `url(${event.bannerUrl})` }}>
                        <div className="rec-card-banner-overlay" />
                      </div>
                    )}
                    <div className="rec-card-body">
                      <div className="rec-card-header-row">
                        {event.logoUrl && (
                          <img
                            src={event.logoUrl}
                            alt={event.name}
                            className={`rec-card-logo ${event.bannerUrl ? 'rec-card-logo-overlap' : ''}`}
                          />
                        )}
                        <div className="rec-card-header-info">
                          <div className="rec-card-title-line">
                            <h4 className="rec-title">{event.name}</h4>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <Badge category={event.category} size="xs">
                                {event.category.toUpperCase()}
                              </Badge>
                              {computedStatus === 'ongoing' && (
                                <span className="font-mono" style={{ fontSize: '0.625rem', color: '#E11D48', background: 'rgba(225, 29, 72, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  🔴 LIVE NOW
                                </span>
                              )}
                              {regInfo.isSpot && (
                                <span className="font-mono" style={{ fontSize: '0.625rem', color: '#D97706', background: 'rgba(217, 119, 6, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  ⚡ SPOT PASS
                                </span>
                              )}
                            </div>
                          </div>
                          {event.tagline && <p className="rec-card-tagline">{event.tagline}</p>}
                        </div>
                      </div>
                      <p className="rec-desc">
                        {event.shortDescription || (event.description ? event.description.replace(/[#*`_]/g, '').slice(0, 180) + '...' : '')}
                      </p>
                      <div className="rec-logistics font-mono">
                        <span>📅 {formatEventSchedule(event.date || event.startDate, event.time || event.startTime, event.endTime)}</span>
                        <span>📍 {event.venue}</span>
                        <span className="rec-fee-tag">🎟️ {getEventFeeDisplay(event)}</span>
                      </div>

                      {/* Pre-event Resource Links */}
                      {event.preLinks && event.preLinks.filter(l => l.url).length > 0 && (
                        <div className="rec-links-container">
                          {event.preLinks.filter(l => l.url).map((l, i) => (
                            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="rec-link-pill">
                              🔗 {l.label || 'Event Resource'}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Contact Coordinators */}
                      {event.contacts && event.contacts.filter(c => c.name).length > 0 && (
                        <div className="rec-contacts-strip">
                          <span className="rec-contacts-title font-mono">Coordinators:</span>
                          <div className="rec-contacts-list">
                            {event.contacts.filter(c => c.name).map((c, i) => (
                              <span key={i} className="rec-contact-tag font-mono">
                                👤 {c.name} {c.role ? `(${c.role})` : ''} {c.phone ? `• 📞 ${c.phone}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="rec-footer">
                        <ProgressBar
                          current={event.registrationCount}
                          total={event.maxParticipants}
                          showLabel={false}
                          height={4}
                        />
                        <div className="rec-btn-row">
                          <span className="rec-capacity-label font-mono">
                            {event.registrationCount}/{event.maxParticipants} slots filled
                          </span>
                          <Button
                            variant={regInfo.isOpen ? (regInfo.isSpot ? 'primary' : 'primary') : 'secondary'}
                            size="xs"
                            disabled={!regInfo.isOpen}
                            onClick={() => handleSelfRegister(event)}
                          >
                            {regInfo.actionLabel}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableEvents.length === 0 && (
                <p className="no-more-tracks font-mono">You are registered for all available upcoming tracks.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Attendee Profile Sidebar */}
        <div className="portal-sidebar-section">
          <div className="craft-card profile-details-card">
            <h3 className="card-section-title">Academic Profile</h3>
            <div className="profile-hero">
              <Avatar name={user.name} initials={user.initials} size="xl" />
              <h4 className="profile-student-name">{user.name}</h4>
              <p className="profile-student-dept">{user.department || user.college || 'Student Delegate'}</p>
            </div>
            <div className="profile-meta-rows font-mono">
              <div className="meta-row">
                <span className="meta-lbl">Student ID</span>
                <span className="meta-val">{user.studentId || user.rollNumber || '—'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Year Group</span>
                <span className="meta-val">{user.year || '—'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">College</span>
                <span className="meta-val">{user.college || '—'}</span>
              </div>
              {user.phone && (
                <div className="meta-row">
                  <span className="meta-lbl">Phone</span>
                  <span className="meta-val">{user.phone}</span>
                </div>
              )}
              <div className="meta-row">
                <span className="meta-lbl">Primary Email</span>
                <span className="meta-val">{user.email}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                }
                onClick={() => setEditProfileOpen(true)}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Ticket Pass Modal */}
      <Modal
        open={!!inspectPass}
        onClose={() => setInspectPass(null)}
        title="Event Gate Pass"
        subtitle="Present this QR credential at the venue registration desk"
        size="sm"
      >
        {inspectPass && (
          <div className="portal-ticket-inspect">
            <div className="ticket-brand font-mono">VIBEVENUE '26</div>
            <h3 className="ticket-inspect-title">{inspectPass.eventName}</h3>
            
            <div className="ticket-inspect-grid font-mono">
              <div className="tig-item">
                <span className="tig-lbl">Delegate Name</span>
                <span className="tig-val">{inspectPass.name}</span>
              </div>
              <div className="tig-item">
                <span className="tig-lbl">Ticket Pass ID</span>
                <span className="tig-val">{inspectPass.ticketId}</span>
              </div>
              <div className="tig-item">
                <span className="tig-lbl">Venue Location</span>
                <span className="tig-val">{inspectPass.eventVenue}</span>
              </div>
              <div className="tig-item">
                <span className="tig-lbl">Gate Check-in</span>
                <span className={`tig-val ${inspectPass.checkInStatus === 'Checked In' ? 'text-emerald' : 'text-amber'}`}>
                  {inspectPass.checkInStatus || 'Not Checked'}
                </span>
              </div>
              {inspectPass.pricingTier && (
                <div className="tig-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="tig-lbl">Category Tier</span>
                  <span className="tig-val">🏷️ {inspectPass.pricingTier}</span>
                </div>
              )}
              {inspectPass.membershipProof && (
                <div className="tig-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="tig-lbl">Membership Proof</span>
                  <span className="tig-val" style={{ color: '#F59E0B' }}>🔒 {inspectPass.membershipProof}</span>
                </div>
              )}

              {inspectPass.statusReason && (
                <div className="tig-item" style={{ gridColumn: '1 / -1', background: 'rgba(217, 119, 6, 0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                  <span className="tig-lbl" style={{ color: '#D97706', fontWeight: 700 }}>⚠️ Organizer Feedback / Request:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{inspectPass.statusReason}</p>
                </div>
              )}
            </div>

            <PassBarcodeQR value={inspectPass.ticketId} />

            <div className="ticket-inspect-actions">
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => {
                  setInspectPass(null);
                  setConfirmCancel(inspectPass);
                }}
              >
                Cancel Registration
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Pass Modal */}
      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Revoke Gate Pass?"
        subtitle="This action will cancel your seat registration permanently"
        size="sm"
      >
        {confirmCancel && (
          <div className="revoke-confirm-body">
            <p className="revoke-warn-txt">
              Are you sure you want to cancel your registration for{' '}
              <strong>"{confirmCancel.eventName}"</strong>?
              Your entry pass will be deactivated immediately.
            </p>
            <div className="revoke-actions">
              <Button
                variant="secondary"
                onClick={() => setConfirmCancel(null)}
              >
                Keep Pass
              </Button>
              <Button
                variant="danger"
                loading={isRevoking}
                onClick={() => handleRevokePass(confirmCancel)}
              >
                Confirm Deactivation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </div>
  );
};

export default ParticipantPortal;
