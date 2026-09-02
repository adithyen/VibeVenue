// AttendancePage — Dedicated Delegate Attendance & Turnout Hub (2026 Impeccable Edition)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import { supabase } from '../lib/supabase';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import { formatTimeAgo, formatDateTime, formatEventSchedule, formatPricingTier } from '../utils/dateUtils';
import { playSuccessChime } from '../utils/audioUtils';
import './AttendancePage.css';

const AttendancePage = () => {
  const navigate = useNavigate();
  const {
    events,
    getRecentRegistrations,
    updateCheckInStatus,
    updateTeamCheckIn,
    updateMemberCheckIn,
    updateAddonFulfillment,
    registerParticipant,
  } = useEventStore();
  const { addToast } = useUIStore();

  const [selectedEventId, setSelectedEventId] = useState('all');
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'present' | 'absent' | 'spot' | 'teams'
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingId, setIsUpdatingId] = useState(null);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [teamModalData, setTeamModalData] = useState(null); // { attendee, selectedIndices }

  // Quick Check-In Bar state
  const [quickScanCode, setQuickScanCode] = useState('');
  const [quickCheckInSuccess, setQuickCheckInSuccess] = useState(null);

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

  // 1. Fetch registrations with live Realtime Sync + Focus Sync
  const fetchAttendees = useCallback(async () => {
    const data = await getRecentRegistrations(2000);
    setAttendees(data || []);
    setLoading(false);
  }, [getRecentRegistrations]);

  useEffect(() => {
    fetchAttendees();

    // Supabase Realtime channel
    const channelName = `attendance-live-sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchAttendees();
      })
      .subscribe();

    const handleFocus = () => fetchAttendees();
    window.addEventListener('focus', handleFocus);

    const timer = setInterval(fetchAttendees, 4000);

    return () => {
      try { supabase.removeChannel(channel); } catch {}
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
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
    return eventAttendees.filter((a) => a.checkInStatus === 'Checked In' || a.checkInStatus === 'Partially Checked In');
  }, [eventAttendees]);

  const absentAttendees = useMemo(() => {
    return eventAttendees.filter((a) => a.checkInStatus !== 'Checked In' && a.checkInStatus !== 'Partially Checked In');
  }, [eventAttendees]);

  const spotAttendees = useMemo(() => {
    return eventAttendees.filter((a) => a.pricingTier?.toLowerCase().includes('spot') || a.ticketId?.startsWith('SPT-'));
  }, [eventAttendees]);

  const teamAttendees = useMemo(() => {
    return eventAttendees.filter((a) => a.registrationType === 'group' || (Array.isArray(a.teamMembers) && a.teamMembers.length > 0));
  }, [eventAttendees]);

  // Current view list
  const currentTabList = useMemo(() => {
    let list = eventAttendees;
    if (activeTab === 'present') list = presentAttendees;
    if (activeTab === 'absent') list = absentAttendees;
    if (activeTab === 'spot') list = spotAttendees;
    if (activeTab === 'teams') list = teamAttendees;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.studentId?.toLowerCase().includes(q) ||
        a.ticketId?.toLowerCase().includes(q) ||
        a.department?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.teamName?.toLowerCase().includes(q) ||
        (Array.isArray(a.teamMembers) && a.teamMembers.some((m) => m.name?.toLowerCase().includes(q) || m.rollNumber?.toLowerCase().includes(q)))
    );
  }, [activeTab, eventAttendees, presentAttendees, absentAttendees, spotAttendees, teamAttendees, searchQuery]);

  // Turnout stats
  const totalCount = eventAttendees.length;
  const presentCount = presentAttendees.length;
  const absentCount = absentAttendees.length;
  const spotCount = spotAttendees.length;
  const teamCount = teamAttendees.length;
  const turnoutPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // 4. Quick Check-In Bar by Ticket ID / Roll No / Scanner
  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    if (!quickScanCode.trim()) return;
    const cleanCode = quickScanCode.trim().toUpperCase();

    const match = eventAttendees.find((a) => {
      const ticket = a.ticketId?.toUpperCase();
      const ticketMatch = ticket && (cleanCode === ticket || cleanCode.includes(ticket) || ticket.includes(cleanCode));
      const studentMatch = (a.studentId && cleanCode.includes(a.studentId.toUpperCase())) || (a.rollNumber && cleanCode.includes(a.rollNumber.toUpperCase()));
      const nameMatch = a.name && a.name.toUpperCase().includes(cleanCode);
      return ticketMatch || studentMatch || nameMatch;
    });

    if (!match) {
      addToast({
        type: 'error',
        title: 'Attendee Not Found',
        message: `No attendee matched "${quickScanCode}" in active event track.`,
      });
      return;
    }

    if (match.checkInStatus === 'Checked In') {
      addToast({
        type: 'warning',
        title: 'Already Checked In',
        message: `${match.name} was already marked as present.`,
      });
      setQuickScanCode('');
      return;
    }

    // For Group / Team Registrations: Open individual member selection modal rather than marking everyone present!
    const isGroup = match.registrationType === 'group' || (Array.isArray(match.teamMembers) && match.teamMembers.length > 0);
    if (isGroup) {
      const currentlyChecked = (match.teamMembers || [])
        .map((m, idx) => (m.checkedIn ? idx : null))
        .filter((idx) => idx !== null);
      setTeamModalData({
        attendee: match,
        selectedIndices: currentlyChecked,
      });
      setQuickScanCode('');
      return;
    }

    setIsUpdatingId(match.id);
    const ok = await updateCheckInStatus(match.id, true);
    if (ok) {
      playSuccessChime();
      const updated = {
        ...match,
        checkInStatus: 'Checked In',
        checkedInAt: new Date().toISOString(),
      };
      setAttendees((prev) => prev.map((a) => (a.id === match.id ? updated : a)));
      setQuickCheckInSuccess(updated);
      setTimeout(() => setQuickCheckInSuccess(null), 3500);
      addToast({
        type: 'success',
        title: 'Gate Entry Approved ✓',
        message: `Welcome, ${match.name}! (Ticket: ${match.ticketId})`,
      });
      setQuickScanCode('');
    }
    setIsUpdatingId(null);
  };

  // Team Modal Handlers for Interactive Individual Delegate Check-In
  const handleToggleMemberIndex = (idx) => {
    if (!teamModalData) return;
    const current = teamModalData.selectedIndices;
    const next = current.includes(idx) ? current.filter((i) => i !== idx) : [...current, idx];
    setTeamModalData({ ...teamModalData, selectedIndices: next });
  };

  const handleSelectAllMembers = () => {
    if (!teamModalData?.attendee?.teamMembers) return;
    const all = teamModalData.attendee.teamMembers.map((_, i) => i);
    setTeamModalData({ ...teamModalData, selectedIndices: all });
  };

  const handleDeselectAllMembers = () => {
    if (!teamModalData) return;
    setTeamModalData({ ...teamModalData, selectedIndices: [] });
  };

  const handleConfirmTeamCheckIn = async () => {
    if (!teamModalData?.attendee) return;
    const { attendee, selectedIndices } = teamModalData;
    const scanTimestamp = new Date();

    setIsUpdatingId(attendee.id);
    const ok = await updateTeamCheckIn(attendee.id, selectedIndices);
    if (ok) {
      if (selectedIndices.length > 0) playSuccessChime();
      const members = Array.isArray(attendee.teamMembers) ? attendee.teamMembers : [];
      const updatedMembers = members.map((m, idx) => ({
        ...m,
        checkedIn: selectedIndices.includes(idx),
        checkedInAt: selectedIndices.includes(idx) ? (m.checkedInAt || scanTimestamp.toISOString()) : null,
      }));
      const allChecked = updatedMembers.length > 0 && updatedMembers.every((m) => m.checkedIn);
      const anyChecked = updatedMembers.some((m) => m.checkedIn);
      const overallStatus = allChecked ? 'Checked In' : anyChecked ? 'Partially Checked In' : 'Not Checked In';

      const updatedAttendee = {
        ...attendee,
        teamMembers: updatedMembers,
        checkInStatus: overallStatus,
        checkedInAt: anyChecked ? attendee.checkedInAt || scanTimestamp.toISOString() : null,
      };

      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? updatedAttendee : a)));
      addToast({
        type: selectedIndices.length > 0 ? 'success' : 'info',
        title: 'Team Attendance Saved ✓',
        message: `${selectedIndices.length} of ${members.length} members marked present for ${attendee.teamName || 'Team'}.`,
      });
    }
    setIsUpdatingId(null);
    setTeamModalData(null);
  };

  // Quick Batch Toggle for all members in expanded roster
  const handleMarkAllTeamMembers = async (attendee, markAllPresent) => {
    const members = Array.isArray(attendee.teamMembers) ? attendee.teamMembers : [];
    if (members.length === 0) return;

    setIsUpdatingId(`${attendee.id}-all-members`);
    const selectedIndices = markAllPresent ? members.map((_, i) => i) : [];
    const ok = await updateTeamCheckIn(attendee.id, selectedIndices);
    if (ok) {
      if (markAllPresent) playSuccessChime();
      const scanTimestamp = new Date().toISOString();
      const updatedMembers = members.map((m) => ({
        ...m,
        checkedIn: markAllPresent,
        checkedInAt: markAllPresent ? (m.checkedInAt || scanTimestamp) : null,
      }));
      const overallStatus = markAllPresent ? 'Checked In' : 'Not Checked In';
      const updatedAttendee = {
        ...attendee,
        teamMembers: updatedMembers,
        checkInStatus: overallStatus,
        checkedInAt: markAllPresent ? (attendee.checkedInAt || scanTimestamp) : null,
      };

      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? updatedAttendee : a)));
      addToast({
        type: markAllPresent ? 'success' : 'info',
        title: markAllPresent ? 'All Team Members Present ✓' : 'All Members Marked Absent',
        message: `${attendee.teamName || 'Team'}: ${markAllPresent ? `All ${members.length} members marked present.` : 'All members marked absent.'}`,
      });
    }
    setIsUpdatingId(null);
  };

  // 5. Manual Check-in toggle (for individuals or opens modal for groups)
  const handleToggleCheckIn = async (attendee) => {
    const isGroup = attendee.registrationType === 'group' || (Array.isArray(attendee.teamMembers) && attendee.teamMembers.length > 0);
    if (isGroup) {
      // For a group/team, open individual team member attendance modal rather than marking everyone present
      const currentlyChecked = (attendee.teamMembers || [])
        .map((m, idx) => (m.checkedIn ? idx : null))
        .filter((idx) => idx !== null);
      setTeamModalData({
        attendee,
        selectedIndices: currentlyChecked,
      });
      return;
    }

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

  // 6. Individual Team Member Attendance Check-In Toggle
  const handleToggleMemberCheckIn = async (attendee, memberIndex) => {
    const members = Array.isArray(attendee.teamMembers) ? attendee.teamMembers : [];
    const member = members[memberIndex];
    if (!member) return;

    const nextVal = !member.checkedIn;
    setIsUpdatingId(`${attendee.id}-member-${memberIndex}`);
    const ok = await updateMemberCheckIn(attendee.id, memberIndex, nextVal);
    if (ok) {
      if (nextVal) playSuccessChime();
      const updatedMembers = [...members];
      updatedMembers[memberIndex] = {
        ...member,
        checkedIn: nextVal,
        checkedInAt: nextVal ? new Date().toISOString() : null,
      };
      const allChecked = updatedMembers.length > 0 && updatedMembers.every((m) => m.checkedIn);
      const anyChecked = updatedMembers.some((m) => m.checkedIn);
      const overallStatus = allChecked ? 'Checked In' : anyChecked ? 'Partially Checked In' : 'Not Checked In';

      const updatedAttendee = {
        ...attendee,
        teamMembers: updatedMembers,
        checkInStatus: overallStatus,
        checkedInAt: anyChecked ? attendee.checkedInAt || new Date().toISOString() : null,
      };

      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? updatedAttendee : a)));
      addToast({
        type: nextVal ? 'success' : 'info',
        title: nextVal ? 'Team Member Present ✓' : 'Member Marked Absent',
        message: `${member.name} (${attendee.teamName || 'Team'}) marked as ${nextVal ? 'Present' : 'Absent'}.`,
      });
    }
    setIsUpdatingId(null);
  };

  const toggleExpandTeam = (attendeeId) => {
    setExpandedTeams((prev) => ({ ...prev, [attendeeId]: !prev[attendeeId] }));
  };

  // 7. Toggle Add-on
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

  // 8. Submit Walk-In / Spot Registration
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

  // 9. Export Attendance CSV
  const handleExportCSV = () => {
    if (currentTabList.length === 0) {
      addToast({ type: 'warning', title: 'Nothing to Export', message: 'No attendee records in this view.' });
      return;
    }

    const headers = ['Ticket ID', 'Name', 'Team Name', 'Role/Type', 'Roll No', 'Department', 'Year', 'College', 'Email', 'Phone', 'Category Tier', 'Paid Amount', 'Status', 'Gate Check-In', 'Checked-In Timestamp'];
    const rows = currentTabList.map((a) => [
      `"${a.ticketId || ''}"`,
      `"${a.name || ''}"`,
      `"${a.teamName || ''}"`,
      `"${a.registrationType || 'individual'}"`,
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
            <h1 className="attendance-page-title">📋 Attendance & Turnout Hub</h1>
            <span className="attendance-pill font-mono">{presentCount} Present</span>
          </div>
          <p className="attendance-page-sub">
            Track delegate arrivals, manage individual team member check-ins, and issue spot passes.
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
            Launch Camera Scanner
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

      {/* Quick Check-In Bar by Ticket ID / Scanner */}
      <div className="craft-card attendance-quick-scan-container">
        <form onSubmit={handleQuickCheckIn} className="attendance-quick-scan-form">
          <div className="quick-scan-input-wrapper">
            <span className="quick-scan-icon">⚡</span>
            <input
              type="text"
              className="craft-input font-mono quick-scan-input"
              placeholder="Instant Check-In: Scan barcode or enter Ticket ID (e.g. TCK-163318 / Roll No)..."
              value={quickScanCode}
              onChange={(e) => setQuickScanCode(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            ✓ Check In Present ↵
          </Button>
        </form>

        {quickCheckInSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="quick-scan-success-banner font-mono"
          >
            ✓ <strong>{quickCheckInSuccess.name}</strong> ({quickCheckInSuccess.ticketId}) marked present for {quickCheckInSuccess.eventName || 'Event'}.
          </motion.div>
        )}
      </div>

      {/* Event Selector Strip */}
      <div className="attendance-event-strip craft-card font-mono">
        <span className="strip-label">GATE TRACK:</span>
        <div className="event-pills-row">
          <button
            type="button"
            className={`event-pill-btn ${selectedEventId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedEventId('all')}
          >
            ⚡ All Events ({attendees.length})
          </button>
          {events.map((evt) => {
            const count = attendees.filter((a) => a.eventId === evt.id).length;
            return (
              <button
                key={evt.id}
                type="button"
                className={`event-pill-btn ${selectedEventId === evt.id ? 'active' : ''}`}
                onClick={() => setSelectedEventId(evt.id)}
              >
                {evt.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Key Turnout Statistics Cards — Clickable to Filter Table */}
      <div className="attendance-stats-grid">
        <div
          className={`craft-card att-stat-card ${activeTab === 'all' ? 'card-active' : ''}`}
          onClick={() => setActiveTab('all')}
          title="Click to filter table to All Registered Delegates"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="att-stat-label font-mono">TOTAL REGISTERED</span>
            {activeTab === 'all' && <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--accent-iris, #6366F1)', fontWeight: 700 }}>● ACTIVE</span>}
          </div>
          <span className="att-stat-val text-iris font-mono">{totalCount}</span>
          <span className="att-stat-sub font-mono">Click to view all {totalCount} records</span>
        </div>

        <div
          className={`craft-card att-stat-card ${activeTab === 'present' ? 'card-active' : ''}`}
          onClick={() => setActiveTab('present')}
          title="Click to filter table to Present Delegates"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="att-stat-label font-mono">ATTENDED & PRESENT</span>
            {activeTab === 'present' && <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--accent-emerald, #059669)', fontWeight: 700 }}>● ACTIVE</span>}
          </div>
          <span className="att-stat-val text-emerald font-mono">{presentCount}</span>
          <div className="att-progress-box">
            <ProgressBar current={presentCount} total={totalCount || 1} height={6} showLabel={false} />
            <span className="att-progress-txt font-mono">{turnoutPercent}% Turnout Rate</span>
          </div>
        </div>

        <div
          className={`craft-card att-stat-card ${activeTab === 'absent' ? 'card-active' : ''}`}
          onClick={() => setActiveTab('absent')}
          title="Click to filter table to Absent Registrants"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="att-stat-label font-mono">ABSENT / NOT ARRIVED</span>
            {activeTab === 'absent' && <span className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--accent-rose, #E11D48)', fontWeight: 700 }}>● ACTIVE</span>}
          </div>
          <span className="att-stat-val text-rose font-mono">{absentCount}</span>
          <span className="att-stat-sub font-mono">{100 - turnoutPercent}% Pending arrival</span>
        </div>

        <div
          className={`craft-card att-stat-card ${activeTab === 'teams' ? 'card-active' : ''}`}
          onClick={() => setActiveTab('teams')}
          title="Click to filter table to Team Rosters"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="att-stat-label font-mono">TEAMS & SPOT PASSES</span>
            {activeTab === 'teams' && <span className="font-mono" style={{ fontSize: '0.625rem', color: '#D97706', fontWeight: 700 }}>● ACTIVE</span>}
          </div>
          <span className="att-stat-val text-amber font-mono">{teamCount} Teams • {spotCount} Spot</span>
          <span className="att-stat-sub font-mono">Click to view team rosters</span>
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
              ✓ Present ({presentCount})
            </button>
            <button
              type="button"
              className={`att-tab-btn ${activeTab === 'absent' ? 'active' : ''}`}
              onClick={() => setActiveTab('absent')}
            >
              ⏳ Absent ({absentCount})
            </button>
            <button
              type="button"
              className={`att-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              👥 Teams ({teamCount})
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
              placeholder="Search name, team, roll no, ticket ID..."
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
                <th>DELEGATE / TEAM ROSTER</th>
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
                  const isPartial = a.checkInStatus === 'Partially Checked In';
                  const addons = a.selectedAddOns || [];
                  const addonsProvided = a.addonsProvided || {};
                  const isGroup = a.registrationType === 'group' || (Array.isArray(a.teamMembers) && a.teamMembers.length > 0);
                  const members = Array.isArray(a.teamMembers) ? a.teamMembers : [];
                  const checkedMembersCount = members.filter((m) => m.checkedIn).length;
                  const isExpanded = !!expandedTeams[a.id];

                  return (
                    <React.Fragment key={a.id}>
                      <tr className={`att-row ${isPresent ? 'row-present' : isPartial ? 'row-partial' : 'row-absent'}`}>
                        {/* Delegate / Team Info */}
                        <td>
                          <div className="att-user-col">
                            <Avatar name={a.name} initials={a.initials} size="sm" />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="att-name">{a.name}</span>
                                {isGroup && (
                                  <span className="font-mono" style={{ fontSize: '0.625rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-iris, #6366F1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    👥 {a.teamName || 'Team'}
                                  </span>
                                )}
                              </div>
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
                            <span className="att-tier-pill">🏷️ {formatPricingTier(a.pricingTier) || 'Individual'}</span>
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
                            <span className={`att-status-badge ${isPresent ? 'badge-present' : isPartial ? 'badge-partial' : 'badge-absent'}`}>
                              {isPresent ? '✓ FULLY PRESENT' : isPartial ? `🟡 PARTIAL (${checkedMembersCount}/${members.length})` : '○ ABSENT'}
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
                            {isGroup ? (
                              <>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => toggleExpandTeam(a.id)}
                                >
                                  {isExpanded ? 'Hide Roster ▲' : `Team Roster (${members.length}) ▼`}
                                </Button>

                                <Button
                                  type="button"
                                  variant={isPresent ? 'secondary' : isPartial ? 'secondary' : 'primary'}
                                  size="xs"
                                  loading={isUpdatingId === a.id}
                                  onClick={() => handleToggleCheckIn(a)}
                                  title="Mark individual team participants present or absent"
                                >
                                  {isPresent
                                    ? `✓ Team (${members.length}/${members.length})`
                                    : isPartial
                                    ? `🟡 Team (${checkedMembersCount}/${members.length})`
                                    : '👥 Team Check-In'}
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant={isPresent ? 'secondary' : 'primary'}
                                size="xs"
                                loading={isUpdatingId === a.id}
                                onClick={() => handleToggleCheckIn(a)}
                              >
                                {isPresent ? '↺ Reset' : '✓ Check In'}
                              </Button>
                            )}

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

                      {/* Expandable Individual Team Members Roster Row */}
                      {isGroup && isExpanded && (
                        <tr className="team-roster-expanded-row">
                          <td colSpan={6} style={{ padding: '14px 24px', background: 'var(--surface-inset, #F8F9FA)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div className="team-members-attendance-grid">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                  👥 INDIVIDUAL TEAM MEMBER ATTENDANCE — {a.teamName?.toUpperCase() || 'TEAM'} ({checkedMembersCount} / {members.length} Present)
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    className="font-mono copy-btn"
                                    onClick={() => handleMarkAllTeamMembers(a, true)}
                                    disabled={isUpdatingId === `${a.id}-all-members`}
                                    style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald, #059669)', borderColor: 'rgba(5, 150, 105, 0.3)' }}
                                  >
                                    ✓ All Present
                                  </button>
                                  <button
                                    type="button"
                                    className="font-mono copy-btn"
                                    onClick={() => handleMarkAllTeamMembers(a, false)}
                                    disabled={isUpdatingId === `${a.id}-all-members`}
                                    style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}
                                  >
                                    ○ All Absent
                                  </button>
                                  <button
                                    type="button"
                                    className="font-mono copy-btn"
                                    onClick={() => handleToggleCheckIn(a)}
                                    style={{ fontSize: '0.6875rem', color: 'var(--accent-iris, #6366F1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                                  >
                                    ⚡ Modal Selector
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                                {members.map((member, mIdx) => {
                                  const isMemberChecked = !!member.checkedIn;
                                  return (
                                    <div
                                      key={mIdx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: 'var(--surface-card, #FFFFFF)',
                                        border: isMemberChecked ? '1px solid rgba(5, 150, 105, 0.35)' : '1px solid var(--border-subtle)',
                                        borderRadius: 8,
                                        boxShadow: isMemberChecked ? '0 1px 4px rgba(5, 150, 105, 0.08)' : 'none',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Avatar name={member.name} size="xs" />
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{member.name}</strong>
                                            {member.isLeader && (
                                              <span className="font-mono" style={{ fontSize: '0.625rem', color: '#D97706', background: 'rgba(217, 119, 6, 0.1)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                                                👑 Leader
                                              </span>
                                            )}
                                          </div>
                                          <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                            {member.rollNumber || member.email || `Member ${mIdx + 1}`}
                                          </span>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span
                                          className="font-mono"
                                          style={{
                                            fontSize: '0.6875rem',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: isMemberChecked ? 'rgba(5, 150, 105, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                                            color: isMemberChecked ? 'var(--accent-emerald, #059669)' : 'var(--text-muted)',
                                            border: isMemberChecked ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid var(--border-subtle)',
                                          }}
                                        >
                                          {isMemberChecked ? '✓ PRESENT' : '○ ABSENT'}
                                        </span>

                                        <button
                                          type="button"
                                          className="font-mono"
                                          disabled={isUpdatingId === `${a.id}-member-${mIdx}`}
                                          onClick={() => handleToggleMemberCheckIn(a, mIdx)}
                                          style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 12px',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            transition: 'all 0.15s ease',
                                            border: isMemberChecked
                                              ? '1px solid rgba(239, 68, 68, 0.35)'
                                              : '1px solid var(--accent-emerald, #059669)',
                                            background: isMemberChecked
                                              ? 'rgba(239, 68, 68, 0.08)'
                                              : 'var(--accent-emerald, #059669)',
                                            color: isMemberChecked
                                              ? '#DC2626'
                                              : '#FFFFFF',
                                          }}
                                          title={isMemberChecked ? 'Click to mark this member Absent' : 'Click to mark this member Present'}
                                        >
                                          {isMemberChecked ? '✕ Mark Absent' : '✓ Mark Present'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spot Walk-In Pass Modal */}
      {showWalkInModal && (
        <Modal
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
          title="⚡ Issue On-Desk Spot Registration Pass"
        >
          <form onSubmit={handleSubmitWalkIn} className="spot-walkin-form">
            <p className="font-mono spot-form-sub">
              Register a walk-in delegate on the spot and immediately issue entry badge clearance.
            </p>

            <div className="spot-form-grid">
              <div className="form-field-group">
                <label className="craft-label">Delegate Full Name <span className="req-star">*</span></label>
                <input
                  type="text"
                  className="craft-input"
                  placeholder="e.g. Rahul Sharma"
                  value={walkInForm.name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Roll Number / Student ID</label>
                <input
                  type="text"
                  className="craft-input font-mono"
                  placeholder="e.g. 21CS088"
                  value={walkInForm.rollNumber}
                  onChange={(e) => setWalkInForm({ ...walkInForm, rollNumber: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Email Address</label>
                <input
                  type="email"
                  className="craft-input font-mono"
                  placeholder="delegate@college.edu"
                  value={walkInForm.email}
                  onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Phone Number</label>
                <input
                  type="tel"
                  className="craft-input font-mono"
                  placeholder="+91 98765 43210"
                  value={walkInForm.phone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">College / Institution</label>
                <input
                  type="text"
                  className="craft-input"
                  placeholder="College Name"
                  value={walkInForm.college}
                  onChange={(e) => setWalkInForm({ ...walkInForm, college: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Spot Pass Fee Collected (₹)</label>
                <input
                  type="number"
                  className="craft-input font-mono"
                  placeholder="100"
                  value={walkInForm.totalPaid}
                  onChange={(e) => setWalkInForm({ ...walkInForm, totalPaid: e.target.value })}
                />
              </div>
            </div>

            <div className="spot-auto-checkin-row">
              <label className="spot-checkbox-label font-mono">
                <input
                  type="checkbox"
                  checked={walkInForm.autoCheckIn}
                  onChange={(e) => setWalkInForm({ ...walkInForm, autoCheckIn: e.target.checked })}
                />
                <span>✓ Automatically mark as Checked-In immediately upon creation</span>
              </label>
            </div>

            <div className="spot-form-actions">
              <Button type="button" variant="secondary" onClick={() => setShowWalkInModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmittingWalkIn}>
                ⚡ Issue Spot Pass & Print Badge
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Interactive Team Check-In Individual Participant Selection Modal */}
      {teamModalData && (
        <Modal
          isOpen={!!teamModalData}
          onClose={() => setTeamModalData(null)}
          title={`👥 Team Attendance Clearance: ${teamModalData.attendee.teamName || teamModalData.attendee.name || 'Team'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'var(--surface-inset)', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span className="font-mono" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>TICKET ID: </span>
                <strong className="font-mono text-iris">{teamModalData.attendee.ticketId}</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {teamModalData.attendee.eventName || 'Event Pass'} • {teamModalData.attendee.pricingTier || 'Team Pass'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="font-mono copy-btn"
                  onClick={handleSelectAllMembers}
                  style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald, #059669)', borderColor: 'rgba(5, 150, 105, 0.3)' }}
                >
                  ✓ All Present
                </button>
                <button
                  type="button"
                  className="font-mono copy-btn"
                  onClick={handleDeselectAllMembers}
                  style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}
                >
                  ○ All Absent
                </button>
              </div>
            </div>

            <p className="font-mono" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', margin: 0 }}>
              Mark individual delegates as Present or Absent:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
              {teamModalData.attendee.teamMembers?.map((member, idx) => {
                const isSelected = teamModalData.selectedIndices.includes(idx);
                const isLeader = member.isLeader || idx === 0;

                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleMemberIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(5, 150, 105, 0.08)' : 'var(--surface-card)',
                      border: isSelected ? '1px solid var(--accent-emerald, #059669)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div click
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-emerald, #059669)' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.name}</strong>
                          {isLeader && (
                            <span className="font-mono" style={{ fontSize: '0.625rem', color: '#D97706', background: 'rgba(217, 119, 6, 0.1)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              👑 Leader
                            </span>
                          )}
                        </div>
                        <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {member.rollNumber ? `${member.rollNumber} • ` : ''}{member.email || `Member ${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: isSelected ? 'rgba(5, 150, 105, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                        color: isSelected ? 'var(--accent-emerald, #059669)' : 'var(--text-muted)',
                      }}
                    >
                      {isSelected ? '✓ Present' : '○ Absent'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {teamModalData.selectedIndices.length} of {teamModalData.attendee.teamMembers?.length || 0} delegates marked present
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setTeamModalData(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={handleConfirmTeamCheckIn}>
                  Save Team Attendance
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AttendancePage;
