// Student Participant Dashboard Portal (v4.0)
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import RegistrationModal from '../components/participants/RegistrationModal';
import { formatDate } from '../utils/dateUtils';
import './ParticipantPortal.css';

const ParticipantPortal = () => {
  const navigate = useNavigate();
  const { user, logout, getParticipantPasses } = useAuthStore();
  const { events, removeParticipant, updateEvent } = useEventStore();
  const { addToast } = useUIStore();

  const [inspectPass, setInspectPass] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [passes, setPasses] = useState([]);
  const [passesLoading, setPassesLoading] = useState(true);

  // Fetch passes from Supabase (shows registrations created in any session/account)
  useEffect(() => {
    setPassesLoading(true);
    getParticipantPasses().then(data => {
      setPasses(data);
      setPassesLoading(false);
    });
  }, [user?.id]);

  // Compute upcoming events available for registration
  // An event is available if user has no pass for it yet
  const registeredEventIds = new Set(passes.map(p => p.eventId));
  const availableEvents = useMemo(() => {
    return events
      .filter(evt => evt.status === 'upcoming')
      .filter(evt => !registeredEventIds.has(evt.id))
      .slice(0, 3);
  }, [events, passes]);

  // Handle new self-registration — opens Registration Modal
  const handleSelfRegister = (event) => {
    if (event.registrationCount >= event.maxParticipants && !event.isOnline) {
      addToast({
        type: 'error',
        title: 'Event Full',
        message: `"${event.name}" has no more seats available.`,
      });
      return;
    }
    setRegisteringEvent(event);
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
              <h3 className="portal-section-title">Recommended Upcoming Tracks</h3>
              <span className="section-pill font-mono">Registration Open</span>
            </div>

            <div className="recommended-grid">
              {availableEvents.map((event) => (
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
                          <Badge category={event.category} size="xs">
                            {event.category.toUpperCase()}
                          </Badge>
                        </div>
                        {event.tagline && <p className="rec-card-tagline">{event.tagline}</p>}
                      </div>
                    </div>
                    <p className="rec-desc">{event.shortDescription || event.description}</p>
                    <div className="rec-logistics font-mono">
                      <span>📅 {formatDate(event.date)}</span>
                      <span>📍 {event.venue}</span>
                    </div>
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
                          variant="primary"
                          size="xs"
                          onClick={() => handleSelfRegister(event)}
                        >
                          Register Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

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
              <p className="profile-student-dept">{user.department}</p>
            </div>
            <div className="profile-metadata-rows font-mono">
              <div className="meta-row">
                <span className="meta-lbl">Student ID</span>
                <span className="meta-val">{user.studentId}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Year Group</span>
                <span className="meta-val">{user.year}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Primary Email</span>
                <span className="meta-val">{user.email}</span>
              </div>
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
            </div>

            <div className="barcode-mock-container">
              <div className="barcode-lines" />
              <span className="barcode-code font-mono">{inspectPass.ticketId}-CAMPUS-2026</span>
            </div>

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

      {/* Registration Modal for participants */}
      {registeringEvent && (
        <RegistrationModal
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
        />
      )}
    </div>
  );
};


export default ParticipantPortal;
