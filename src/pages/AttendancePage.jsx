// AttendancePage — Dedicated Delegate Attendance & Turnout Hub (2026 Impeccable Edition)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import { formatTimeAgo, formatDateTime, formatEventSchedule } from '../utils/dateUtils';
import { playSuccessChime } from '../utils/audioUtils';
import './AttendancePage.css';

const AttendancePage = () => {
  const navigate = useNavigate();
  const {
    events,
    getRecentRegistrations,
    updateCheckInStatus,
    updateAddonFulfillment,
    registerParticipant,
  } = useEventStore();
  const { addToast } = useUIStore();

  const [selectedEventId, setSelectedEventId] = useState('all');
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'present' | 'absent' | 'spot'
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  // Spot walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    department: 'CSE',
    year: '3rd Year',
    college: 'SCTCE',
    pricingTier: 'Spot Individual Pass',
    totalPaid: '100',
    autoCheckIn: true,
  });
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // 1. Fetch registrations
  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    const data = await getRecentRegistrations(2000);
    setAttendees(data || []);
    setLoading(false);
  }, [getRecentRegistrations]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const activeEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // 2. Filter attendees by Event and Search Query
  const eventAttendees = useMemo(() => {
    if (selectedEventId === 'all') return attendees;
    return attendees.filter((a) => a.eventId === selectedEventId);
  }, [attendees, selectedEventId]);

  // 3. Tab breakdown
  const presentAttendees = useMemo(() => {
    return eventAttendees.filter((a) => a.checkInStatus === 'Checked In');
  }, [eventAttendees]);

  const absentAttendees = useMemo(() => {
    return eventAttendees.filter((a) => a.checkInStatus !== 'Checked In');
  }, [eventAttendees]);

  const spotAttendees = useMemo(() => {
    return eventAttendees.filter((a) => a.pricingTier?.toLowerCase().includes('spot') || a.ticketId?.startsWith('SPT-'));
  }, [eventAttendees]);

  // Current view list
  const currentTabList = useMemo(() => {
    let list = eventAttendees;
    if (activeTab === 'present') list = presentAttendees;
    if (activeTab === 'absent') list = absentAttendees;
    if (activeTab === 'spot') list = spotAttendees;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.studentId?.toLowerCase().includes(q) ||
        a.ticketId?.toLowerCase().includes(q) ||
        a.department?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
    );
  }, [activeTab, eventAttendees, presentAttendees, absentAttendees, spotAttendees, searchQuery]);

  // Turnout stats
  const totalCount = eventAttendees.length;
  const presentCount = presentAttendees.length;
  const absentCount = absentAttendees.length;
  const spotCount = spotAttendees.length;
  const turnoutPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // 4. Manual Check-in toggle
  const handleToggleCheckIn = async (attendee) => {
    setIsUpdatingId(attendee.id);
    const newStatus = attendee.checkInStatus !== 'Checked In';
    const ok = await updateCheckInStatus(attendee.id, newStatus);
    if (ok) {
      if (newStatus) playSuccessChime();
      const updated = {
        ...attendee,
        checkInStatus: newStatus ? 'Checked In' : 'Not Checked In',
        checkedInAt: newStatus ? new Date().toISOString() : null,
      };
      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? updated : a)));
      addToast({
        type: newStatus ? 'success' : 'info',
        title: newStatus ? 'Attendee Marked Present ✓' : 'Attendance Reset',
        message: `${attendee.name} marked as ${newStatus ? 'Checked In' : 'Not Checked In'}.`,
      });
    }
    setIsUpdatingId(null);
  };

  // 5. Toggle Add-on
  const handleToggleAddon = async (attendee, addonLabel) => {
    const currentProvided = attendee.addonsProvided || {};
    const nextVal = !currentProvided[addonLabel];
    const updatedProvided = { ...currentProvided, [addonLabel]: nextVal };

    const ok = await updateAddonFulfillment(attendee.id, addonLabel, nextVal);
    if (ok) {
      const updated = { ...attendee, addonsProvided: updatedProvided };
      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? updated : a)));
      addToast({
        type: 'info',
        title: 'Add-on Updated',
        message: `${addonLabel}: ${nextVal ? 'Provided' : 'Pending'}`,
      });
    }
  };

  // 6. Submit Walk-In / Spot Registration
  const handleSubmitWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInForm.name.trim()) {
      addToast({ type: 'error', title: 'Name Required', message: 'Please enter attendee name.' });
      return;
    }
    const targetEventId = selectedEventId !== 'all' ? selectedEventId : (events[0]?.id || 'evt-general');

    setIsSubmittingWalkIn(true);
    const tempTicket = `SPT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const newReg = await registerParticipant(targetEventId, {
        fullName: walkInForm.name.trim(),
        rollNumber: walkInForm.rollNumber.trim() || 'SPOT-PASS',
        email: walkInForm.email.trim() || `spot.${tempTicket.toLowerCase()}@venue.local`,
        phone: walkInForm.phone.trim() || '—',
        department: walkInForm.department,
        year: walkInForm.year,
        college: walkInForm.college,
        pricingTier: walkInForm.pricingTier || 'Spot Pass',
        totalPaid: parseFloat(walkInForm.totalPaid) || 0,
        ticketId: tempTicket,
      });

      if (newReg && walkInForm.autoCheckIn) {
        await updateCheckInStatus(newReg.id, true);
        playSuccessChime();
      }

      await fetchAttendees();
      setShowWalkInModal(false);
      setWalkInForm({
        name: '',
        rollNumber: '',
        email: '',
        phone: '',
        department: 'CSE',
        year: '3rd Year',
        college: 'SCTCE',
        pricingTier: 'Spot Individual Pass',
        totalPaid: '100',
        autoCheckIn: true,
      });

      addToast({
        type: 'success',
        title: 'Spot Pass Issued! ⚡',
        message: `${walkInForm.name} registered and marked present (Pass: ${tempTicket}).`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to issue spot pass', message: err?.message });
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // 7. Export Attendance CSV
  const handleExportCSV = () => {
    if (currentTabList.length === 0) {
      addToast({ type: 'warning', title: 'Nothing to Export', message: 'No attendee records in this view.' });
      return;
    }

    const headers = ['Ticket ID', 'Name', 'Roll No', 'Department', 'Year', 'College', 'Email', 'Phone', 'Category Tier', 'Paid Amount', 'Status', 'Gate Check-In', 'Checked-In Timestamp'];
    const rows = currentTabList.map((a) => [
      `"${a.ticketId || ''}"`,
      `"${a.name || ''}"`,
      `"${a.studentId || a.rollNumber || ''}"`,
      `"${a.department || ''}"`,
      `"${a.year || ''}"`,
      `"${a.college || ''}"`,
      `"${a.email || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.pricingTier || ''}"`,
      `"${a.totalPaid || 0}"`,
      `"${a.status || ''}"`,
      `"${a.checkInStatus || 'Not Checked'}"`,
      `"${a.checkedInAt ? formatDateTime(a.checkedInAt) : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const eventSlug = activeEvent ? activeEvent.name.toLowerCase().replace(/\s+/g, '-') : 'all-events';
    link.setAttribute('download', `attendance-${eventSlug}-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ type: 'info', title: 'Exported Attendance CSV', message: `${currentTabList.length} records downloaded.` });
  };

  return (
    <div className="attendance-page">
      {/* Top Header & Event Switcher */}
      <div className="attendance-topbar">
        <div>
          <div className="attendance-title-row">
            <h1 className="attendance-page-title">📋 Attendance & Delegate Hub</h1>
            <span className="attendance-pill font-mono">{presentCount} Present</span>
          </div>
          <p className="attendance-page-sub">
            Track delegate arrivals, view absent registrants, and issue on-desk spot passes.
          </p>
        </div>

        <div className="attendance-topbar-actions">
          {/* Quick Scanner Launch */}
          <Button
            variant="secondary"
            size="md"
            icon={<span>⚡</span>}
            onClick={() => navigate('/scanner')}
          >
            Launch Scanner
          </Button>

          {/* Quick Walk-In Spot Pass */}
          <Button
            variant="primary"
            size="md"
            icon={<span>+</span>}
            onClick={() => setShowWalkInModal(true)}
          >
            Issue Spot Pass
          </Button>

          {/* Export CSV */}
          <Button
            variant="secondary"
            size="md"
            icon={<span>📥</span>}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Event Selector Strip */}
      <div className="attendance-event-strip craft-card font-mono">
        <span className="strip-label">EVENT TRACK:</span>
        <div className="event-pills-row">
          <button
            type="button"
            className={`event-pill-btn ${selectedEventId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedEventId('all')}
          >
            ⚡ All Events ({attendees.length})
          </button>
          {events.map((evt) => (
            <button
              key={evt.id}
              type="button"
              className={`event-pill-btn ${selectedEventId === evt.id ? 'active' : ''}`}
              onClick={() => setSelectedEventId(evt.id)}
            >
              {evt.name} ({evt.registrationCount || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Key Turnout Statistics Cards */}
      <div className="attendance-stats-grid">
        <div className="craft-card att-stat-card">
          <span className="att-stat-label font-mono">TOTAL REGISTERED</span>
          <span className="att-stat-val text-iris font-mono">{totalCount}</span>
          <span className="att-stat-sub">Registered delegates</span>
        </div>

        <div className="craft-card att-stat-card">
          <span className="att-stat-label font-mono">ATTENDED & PRESENT</span>
          <span className="att-stat-val text-emerald font-mono">{presentCount}</span>
          <div className="att-progress-box">
            <ProgressBar current={presentCount} total={totalCount || 1} height={6} showLabel={false} />
            <span className="att-progress-txt font-mono">{turnoutPercent}% Turnout Rate</span>
          </div>
        </div>

        <div className="craft-card att-stat-card">
          <span className="att-stat-label font-mono">ABSENT / NOT ARRIVED</span>
          <span className="att-stat-val text-rose font-mono">{absentCount}</span>
          <span className="att-stat-sub font-mono">{100 - turnoutPercent}% Pending arrival</span>
        </div>

        <div className="craft-card att-stat-card">
          <span className="att-stat-label font-mono">SPOT PASSES ISSUED</span>
          <span className="att-stat-val text-amber font-mono">{spotCount}</span>
          <span className="att-stat-sub font-mono">On-desk walk-ins</span>
        </div>
      </div>

      {/* View Tabs & Search Bar */}
      <div className="attendance-tabs-card craft-card">
        <div className="attendance-tabs-header">
          {/* Tabs */}
          <div className="attendance-tabs-row">
            <button
              type="button"
              className={`att-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Delegates ({totalCount})
            </button>
            <button
              type="button"
              className={`att-tab-btn ${activeTab === 'present' ? 'active' : ''}`}
              onClick={() => setActiveTab('present')}
            >
              ✓ Present & Checked In ({presentCount})
            </button>
            <button
              type="button"
              className={`att-tab-btn ${activeTab === 'absent' ? 'active' : ''}`}
              onClick={() => setActiveTab('absent')}
            >
              ⏳ Absent / Not Arrived ({absentCount})
            </button>
            <button
              type="button"
              className={`att-tab-btn ${activeTab === 'spot' ? 'active' : ''}`}
              onClick={() => setActiveTab('spot')}
            >
              ⚡ Spot Passes ({spotCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="att-search-box">
            <input
              type="text"
              className="craft-input font-mono att-search-input"
              placeholder="Search name, roll no, ticket ID, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Attendance Roster Table */}
        <div className="att-table-container">
          <table className="att-table">
            <thead>
              <tr className="font-mono">
                <th>DELEGATE & ROLL NO</th>
                <th>EVENT & CATEGORY</th>
                <th>ACADEMIC DETAILS</th>
                <th>ATTENDANCE STATUS</th>
                <th>ADD-ONS AT DESK</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentTabList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p className="font-mono">No attendees match the current view and search filter.</p>
                  </td>
                </tr>
              ) : (
                currentTabList.map((a) => {
                  const isPresent = a.checkInStatus === 'Checked In';
                  const addons = a.selectedAddOns || [];
                  const addonsProvided = a.addonsProvided || {};

                  return (
                    <tr key={a.id} className={`att-row ${isPresent ? 'row-present' : 'row-absent'}`}>
                      {/* Delegate */}
                      <td>
                        <div className="att-user-col">
                          <Avatar name={a.name} initials={a.initials} size="sm" />
                          <div>
                            <span className="att-name">{a.name}</span>
                            <div className="att-sub font-mono">
                              <span className="att-ticket">{a.ticketId}</span>
                              {a.studentId && <span>• {a.studentId}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Event & Category */}
                      <td>
                        <div className="att-event-col font-mono">
                          <span className="att-event-name">{a.eventName || 'Event Program'}</span>
                          <span className="att-tier-pill">🏷️ {a.pricingTier || 'Individual'}</span>
                        </div>
                      </td>

                      {/* Academic */}
                      <td>
                        <div className="att-academic-col font-mono">
                          <span>{a.department || '—'} • {a.year || '—'}</span>
                          <span className="text-muted">{a.college || '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <div className="att-status-col font-mono">
                          <span className={`att-status-badge ${isPresent ? 'badge-present' : 'badge-absent'}`}>
                            {isPresent ? '✓ PRESENT' : '○ ABSENT'}
                          </span>
                          {isPresent && a.checkedInAt && (
                            <span className="att-checkin-time">{formatTimeAgo(a.checkedInAt)}</span>
                          )}
                        </div>
                      </td>

                      {/* Add-ons Checklist */}
                      <td>
                        {addons.length === 0 ? (
                          <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                        ) : (
                          <div className="att-addons-row">
                            {addons.map((addon) => {
                              const isGiven = !!addonsProvided[addon];
                              return (
                                <button
                                  key={addon}
                                  type="button"
                                  className={`att-addon-toggle font-mono ${isGiven ? 'given' : 'pending'}`}
                                  onClick={() => handleToggleAddon(a, addon)}
                                  title={isGiven ? 'Provided at desk (click to reset)' : 'Pending (click to mark provided)'}
                                >
                                  {isGiven ? `✓ ${addon}` : `○ ${addon}`}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="att-actions-row">
                          <Button
                            type="button"
                            variant={isPresent ? 'secondary' : 'primary'}
                            size="xs"
                            loading={isUpdatingId === a.id}
                            onClick={() => handleToggleCheckIn(a)}
                          >
                            {isPresent ? '↺ Reset' : '✓ Check In'}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate(`/registrations/${a.id}`)}
                          >
                            Inspect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Walk-In Spot Pass Modal */}
      <Modal
        open={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        title="⚡ Issue On-Desk Spot Pass"
        subtitle="Quickly register a walk-in delegate at the gate desk and mark them present"
        size="md"
      >
        <form onSubmit={handleSubmitWalkIn} className="walkin-form">
          <div className="form-row-2">
            <div className="form-field-group">
              <label className="craft-label">Delegate Full Name <span className="req-star">*</span></label>
              <input
                type="text"
                className="craft-input"
                placeholder="e.g. John Doe"
                required
                value={walkInForm.name}
                onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-field-group">
              <label className="craft-label">Roll Number / Student ID</label>
              <input
                type="text"
                className="craft-input font-mono"
                placeholder="e.g. SCT24AM009"
                value={walkInForm.rollNumber}
                onChange={(e) => setWalkInForm({ ...walkInForm, rollNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label className="craft-label">Email Address</label>
              <input
                type="email"
                className="craft-input font-mono"
                placeholder="student@college.edu"
                value={walkInForm.email}
                onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
              />
            </div>
            <div className="form-field-group">
              <label className="craft-label">Phone Number</label>
              <input
                type="tel"
                className="craft-input font-mono"
                placeholder="9876543210"
                value={walkInForm.phone}
                onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-field-group">
              <label className="craft-label">Academic Year</label>
              <select
                className="craft-input"
                value={walkInForm.year}
                onChange={(e) => setWalkInForm({ ...walkInForm, year: e.target.value })}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
            <div className="form-field-group">
              <label className="craft-label">Department</label>
              <input
                type="text"
                className="craft-input"
                placeholder="CSE / ECE / MECH"
                value={walkInForm.department}
                onChange={(e) => setWalkInForm({ ...walkInForm, department: e.target.value })}
              />
            </div>
            <div className="form-field-group">
              <label className="craft-label">College / Institution</label>
              <input
                type="text"
                className="craft-input"
                placeholder="SCTCE / CET / etc."
                value={walkInForm.college}
                onChange={(e) => setWalkInForm({ ...walkInForm, college: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label className="craft-label">Pass Category Tier</label>
              <input
                type="text"
                className="craft-input font-mono"
                placeholder="Spot Pass / Walk-in"
                value={walkInForm.pricingTier}
                onChange={(e) => setWalkInForm({ ...walkInForm, pricingTier: e.target.value })}
              />
            </div>
            <div className="form-field-group">
              <label className="craft-label">Spot Fee Collected (₹)</label>
              <input
                type="number"
                className="craft-input font-mono"
                placeholder="100"
                value={walkInForm.totalPaid}
                onChange={(e) => setWalkInForm({ ...walkInForm, totalPaid: e.target.value })}
              />
            </div>
          </div>

          <div className="walkin-auto-checkin-row">
            <label className="toggle-switch-label">
              <input
                type="checkbox"
                checked={walkInForm.autoCheckIn}
                onChange={(e) => setWalkInForm({ ...walkInForm, autoCheckIn: e.target.checked })}
              />
              <span className="toggle-switch-track" />
              <span className="toggle-switch-text font-mono">
                Automatically mark attendee as PRESENT & CHECKED IN immediately
              </span>
            </label>
          </div>

          <div className="walkin-actions-row">
            <Button type="button" variant="ghost" onClick={() => setShowWalkInModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmittingWalkIn}>
              Issue Spot Pass & Check-In ⚡
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendancePage;
