// CheckInScannerPage — High-Craft Physical & Camera Barcode/QR Check-In Suite (2026 Impeccable Edition)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatTimeAgo, formatDateTime } from '../utils/dateUtils';
import { playSuccessChime, playWarningBeep, playErrorBuzz } from '../utils/audioUtils';
import './CheckInScannerPage.css';

const CheckInScannerPage = () => {
  const navigate = useNavigate();
  const { events, getRecentRegistrations, updateCheckInStatus, updateAddonFulfillment } = useEventStore();
  const { addToast } = useUIStore();

  const [selectedEventId, setSelectedEventId] = useState('all');
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [camerasList, setCamerasList] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Manual / Keyboard Barcode Scanner input
  const [manualInput, setManualInput] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [lastScannedResult, setLastScannedResult] = useState(null); // { attendee, status: 'success' | 'already_checked' | 'not_found', scannedCode, timestamp }

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());

  // 1. Fetch all registrations
  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    const data = await getRecentRegistrations(1500);
    setAttendees(data || []);
    setLoading(false);
  }, [getRecentRegistrations]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  // 2. Hardware Barcode Gun / USB Scanner Listener (Keyboard Wedge)
  // Barcode scanners type extremely fast (< 30ms per character) and end with 'Enter'
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 200) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scanned = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        if (scanned.length >= 3) {
          processScanCode(scanned);
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attendees, selectedEventId]);

  // 3. Camera Device Enumeration
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCamerasList(devices);
          // Prefer back camera if available on mobile/tablet
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error:', err);
      });
  }, []);

  // 4. Start Camera QR Scanner
  const startCamera = async (cameraId) => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraId || { facingMode: 'environment' },
        config,
        (decodedText) => {
          processScanCode(decodedText);
        },
        () => {
          // Ignore parse errors on empty frames
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error('Camera start failed:', err);
      setCameraError(err?.message || 'Could not access camera. Please check browser permissions.');
      setCameraActive(false);
    }
  };

  // 5. Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // 6. Process Scanned Code (QR / Barcode / Roll No / Ticket ID)
  const processScanCode = async (rawCode) => {
    if (!rawCode || isProcessingScan) return;
    const cleanCode = rawCode.trim().toUpperCase();

    setIsProcessingScan(true);

    // Look for matching attendee
    // Match by: ticket_id (e.g. TCK-805248), studentId / rollNumber, or registration ID
    const match = attendees.find((a) => {
      if (selectedEventId !== 'all' && a.eventId !== selectedEventId) {
        return false;
      }
      const ticketMatch = a.ticketId?.toUpperCase() === cleanCode || cleanCode.includes(a.ticketId?.toUpperCase());
      const studentMatch = a.studentId?.toUpperCase() === cleanCode || a.rollNumber?.toUpperCase() === cleanCode;
      const idMatch = a.id?.toUpperCase() === cleanCode;
      const emailMatch = a.email?.toUpperCase() === cleanCode;
      return ticketMatch || studentMatch || idMatch || emailMatch;
    });

    const scanTimestamp = new Date();

    if (!match) {
      // Invalid code / Not registered
      playErrorBuzz();
      setLastScannedResult({
        status: 'not_found',
        scannedCode: rawCode,
        timestamp: scanTimestamp,
      });
      addToast({
        type: 'error',
        title: 'Pass Not Found ✕',
        message: `No active registration matched code "${rawCode}".`,
      });
      setTimeout(() => setIsProcessingScan(false), 1200);
      return;
    }

    // Check if already checked in
    if (match.checkInStatus === 'Checked In') {
      playWarningBeep();
      setLastScannedResult({
        attendee: match,
        status: 'already_checked',
        scannedCode: rawCode,
        timestamp: scanTimestamp,
      });
      addToast({
        type: 'warning',
        title: 'Already Checked In ⚠️',
        message: `${match.name} was already checked in ${formatTimeAgo(match.checkedInAt || match.registeredAt)}.`,
      });
      setTimeout(() => setIsProcessingScan(false), 1200);
      return;
    }

    // Successful Check-In
    playSuccessChime();
    const ok = await updateCheckInStatus(match.id, true);
    const updatedAttendee = {
      ...match,
      checkInStatus: 'Checked In',
      checkedInAt: scanTimestamp.toISOString(),
    };

    if (ok) {
      setAttendees((prev) => prev.map((a) => (a.id === match.id ? updatedAttendee : a)));
      setLastScannedResult({
        attendee: updatedAttendee,
        status: 'success',
        scannedCode: rawCode,
        timestamp: scanTimestamp,
      });

      setRecentScans((prev) => [
        {
          id: match.id,
          name: match.name,
          ticketId: match.ticketId,
          eventName: match.eventName,
          time: scanTimestamp,
          avatar: match.initials,
          tier: match.pricingTier,
        },
        ...prev.slice(0, 9),
      ]);

      addToast({
        type: 'success',
        title: 'Gate Check-In Confirmed ✓',
        message: `Welcome, ${match.name}! Attendance verified.`,
      });
    }

    setTimeout(() => setIsProcessingScan(false), 1200);
  };

  // 7. Manual Search / Barcode Form Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processScanCode(manualInput.trim());
    setManualInput('');
  };

  // 8. Toggle Add-on fulfillment directly from scan card
  const handleToggleAddon = async (addonLabel) => {
    if (!lastScannedResult?.attendee) return;
    const attendee = lastScannedResult.attendee;
    const currentProvided = attendee.addonsProvided || {};
    const nextVal = !currentProvided[addonLabel];
    const updatedProvided = { ...currentProvided, [addonLabel]: nextVal };

    const ok = await updateAddonFulfillment(attendee.id, addonLabel, nextVal);
    if (ok) {
      const updatedAttendee = { ...attendee, addonsProvided: updatedProvided };
      setLastScannedResult({ ...lastScannedResult, attendee: updatedAttendee });
      setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? updatedAttendee : a)));
      addToast({
        type: 'info',
        title: 'Add-on Updated',
        message: `${addonLabel}: ${nextVal ? 'Provided' : 'Pending'}`,
      });
    }
  };

  // Metrics for selected event
  const filteredAttendees = useMemo(() => {
    if (selectedEventId === 'all') return attendees;
    return attendees.filter((a) => a.eventId === selectedEventId);
  }, [attendees, selectedEventId]);

  const checkedInCount = filteredAttendees.filter((a) => a.checkInStatus === 'Checked In').length;
  const totalCount = filteredAttendees.length;
  const attendanceRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  return (
    <div className="checkin-scanner-page">
      {/* Top Header Bar */}
      <div className="scanner-topbar">
        <div>
          <div className="scanner-title-row">
            <h1 className="scanner-page-title">⚡ Gate Check-In & Scanner Console</h1>
            <span className="scanner-live-badge font-mono">LIVE GATE DESK</span>
          </div>
          <p className="scanner-page-sub">
            Scan attendee QR badges via webcam, hardware USB laser scanner, or ticket search.
          </p>
        </div>

        {/* Event Filter Selector */}
        <div className="scanner-event-filter">
          <label htmlFor="gate-event-select" className="font-mono filter-lbl">GATE TRACK:</label>
          <select
            id="gate-event-select"
            className="craft-input font-mono scanner-event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="all">⚡ All Active Event Tracks ({attendees.length} delegates)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name} ({evt.registrationCount || 0} registered)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Gate Statistics Ribbon */}
      <div className="scanner-stats-ribbon craft-card font-mono">
        <div className="stat-pill">
          <span className="stat-num text-iris">{totalCount}</span>
          <span className="stat-lbl">TOTAL REGISTERED</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-pill">
          <span className="stat-num text-emerald">{checkedInCount}</span>
          <span className="stat-lbl">CHECKED IN ({attendanceRate}%)</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-pill">
          <span className="stat-num text-amber">{Math.max(0, totalCount - checkedInCount)}</span>
          <span className="stat-lbl">PENDING ARRIVAL</span>
        </div>
      </div>

      {/* Main 2-Column Scanner Grid */}
      <div className="scanner-main-grid">
        {/* Left Column: Camera Viewport & Hardware USB Barcode Input */}
        <div className="scanner-col-camera">
          {/* Camera Card */}
          <div className="craft-card camera-feed-card">
            <div className="camera-card-header">
              <div className="camera-status-indicator">
                <span className={`cam-dot ${cameraActive ? 'cam-dot-active' : ''}`} />
                <span className="font-mono cam-status-txt">
                  {cameraActive ? 'CAMERA LIVE — SCANNING' : 'CAMERA STANDBY'}
                </span>
              </div>

              {camerasList.length > 1 && (
                <select
                  className="craft-input font-mono cam-chooser-select"
                  value={selectedCameraId || ''}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (cameraActive) startCamera(e.target.value);
                  }}
                >
                  {camerasList.map((c) => (
                    <option key={c.id} value={c.id}>
                      📷 {c.label || `Camera ${c.id.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Viewport Box */}
            <div className="qr-viewport-wrapper">
              <div id="qr-reader-viewport" className="qr-reader-viewport" />

              {!cameraActive && (
                <div className="camera-standby-overlay">
                  <div className="camera-standby-icon">📷</div>
                  <h3 className="standby-title">Webcam QR Scanner</h3>
                  <p className="standby-sub font-mono">
                    Point laptop camera or mobile lens at the attendee's ticket QR code.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => startCamera(selectedCameraId)}
                  >
                    ▶ Start Live Camera
                  </Button>
                </div>
              )}

              {cameraActive && (
                <div className="scanner-laser-overlay">
                  <div className="scanner-laser-line" />
                  <div className="scanner-target-corners" />
                </div>
              )}
            </div>

            {cameraError && (
              <div className="camera-error-banner font-mono">
                ⚠️ {cameraError}
              </div>
            )}

            {cameraActive && (
              <div className="camera-controls-footer">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={stopCamera}
                >
                  ⏹ Stop Camera
                </Button>
              </div>
            )}
          </div>

          {/* Hardware USB Barcode / Manual Input Box */}
          <div className="craft-card scanner-manual-card">
            <div className="manual-card-header">
              <span className="font-mono manual-card-title">🔍 USB BARCODE GUN / MANUAL SEARCH</span>
              <span className="font-mono usb-status-tag">⚡ HARDWARE SCANNER READY</span>
            </div>
            <form onSubmit={handleManualSubmit} className="manual-search-form">
              <input
                type="text"
                className="craft-input font-mono manual-search-input"
                placeholder="Scan barcode gun or type Ticket ID (e.g. TCK-805248 / Roll No)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="primary" size="md">
                Check In ↵
              </Button>
            </form>
            <p className="manual-hint font-mono">
              💡 Handheld USB barcode guns automatically check in on scan without needing mouse clicks.
            </p>
          </div>
        </div>

        {/* Right Column: Instant Scan Verification Card & Recent Activity */}
        <div className="scanner-col-results">
          {/* Real-time Scan Result Card */}
          <AnimatePresence mode="wait">
            {lastScannedResult ? (
              <motion.div
                key={lastScannedResult.timestamp?.getTime() || Date.now()}
                className={`craft-card scan-result-card result-${lastScannedResult.status}`}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              >
                {/* Result Alert Header */}
                <div className={`result-alert-header ${lastScannedResult.status}`}>
                  <span className="result-alert-icon">
                    {lastScannedResult.status === 'success'
                      ? '✓'
                      : lastScannedResult.status === 'already_checked'
                      ? '⚠️'
                      : '✕'}
                  </span>
                  <div className="result-alert-text">
                    <h3 className="result-alert-title font-mono">
                      {lastScannedResult.status === 'success'
                        ? 'GATE ENTRY APPROVED'
                        : lastScannedResult.status === 'already_checked'
                        ? 'ALREADY CHECKED IN'
                        : 'INVALID TICKET / NOT FOUND'}
                    </h3>
                    <span className="result-alert-sub font-mono">
                      {lastScannedResult.status === 'success'
                        ? 'Attendee marked as present in database'
                        : lastScannedResult.status === 'already_checked'
                        ? `First checked in ${formatTimeAgo(lastScannedResult.attendee?.checkedInAt || lastScannedResult.attendee?.registeredAt)}`
                        : `No registration found for "${lastScannedResult.scannedCode}"`}
                    </span>
                  </div>
                </div>

                {/* Attendee Details if found */}
                {lastScannedResult.attendee && (
                  <div className="scanned-attendee-dossier">
                    <div className="scanned-user-header">
                      <Avatar
                        name={lastScannedResult.attendee.name}
                        initials={lastScannedResult.attendee.initials}
                        size="lg"
                      />
                      <div className="scanned-user-info">
                        <h4 className="scanned-name">{lastScannedResult.attendee.name}</h4>
                        <p className="scanned-event font-mono">
                          🎟️ {lastScannedResult.attendee.eventName || 'Registered Event'}
                        </p>
                        <span className="scanned-tier-tag font-mono">
                          🏷️ {lastScannedResult.attendee.pricingTier || 'Individual Delegate'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metadata Grid */}
                    <div className="scanned-meta-grid font-mono">
                      <div className="scanned-meta-cell">
                        <span className="m-lbl">TICKET ID</span>
                        <span className="m-val text-iris">{lastScannedResult.attendee.ticketId}</span>
                      </div>
                      <div className="scanned-meta-cell">
                        <span className="m-lbl">ROLL NO / ID</span>
                        <span className="m-val">{lastScannedResult.attendee.studentId || '—'}</span>
                      </div>
                      <div className="scanned-meta-cell">
                        <span className="m-lbl">ACADEMIC YEAR</span>
                        <span className="m-val">{lastScannedResult.attendee.year || '—'}</span>
                      </div>
                      <div className="scanned-meta-cell">
                        <span className="m-lbl">DEPARTMENT</span>
                        <span className="m-val">{lastScannedResult.attendee.department || '—'}</span>
                      </div>
                    </div>

                    {/* Add-ons Checklist */}
                    {lastScannedResult.attendee.selectedAddOns?.length > 0 && (
                      <div className="scanned-addons-box">
                        <span className="font-mono addons-title">ADD-ONS TO HAND OVER AT DESK:</span>
                        <div className="scanned-addons-list">
                          {lastScannedResult.attendee.selectedAddOns.map((addon) => {
                            const isProvided = !!lastScannedResult.attendee.addonsProvided?.[addon];
                            return (
                              <label key={addon} className={`scanned-addon-chk ${isProvided ? 'provided' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isProvided}
                                  onChange={() => handleToggleAddon(addon)}
                                />
                                <span className="font-mono">{addon}</span>
                                <span className={`addon-tag font-mono ${isProvided ? 'tag-done' : 'tag-pending'}`}>
                                  {isProvided ? '✓ Provided' : '○ Hand Over'}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="scanned-actions-row">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/registrations/${lastScannedResult.attendee.id}`)}
                      >
                        Inspect Full Dossier →
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="craft-card scan-empty-card">
                <div className="empty-scan-icon">⚡</div>
                <h3 className="empty-scan-title">Awaiting Next Badge Scan</h3>
                <p className="empty-scan-sub font-mono">
                  Scan a QR code from attendee's mobile phone or badge pass to verify entry.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Recent Scans Activity Stream */}
          <div className="craft-card recent-scans-card">
            <div className="recent-scans-header">
              <span className="font-mono recent-title">LIVE SCAN STREAM</span>
              <span className="font-mono recent-count">{recentScans.length} verified this session</span>
            </div>

            {recentScans.length === 0 ? (
              <p className="no-recent font-mono">No scans recorded yet in this session.</p>
            ) : (
              <div className="recent-scans-list font-mono">
                {recentScans.map((scan, i) => (
                  <div key={i} className="recent-scan-row" onClick={() => navigate(`/registrations/${scan.id}`)}>
                    <Avatar name={scan.name} initials={scan.avatar} size="xs" />
                    <div className="recent-info">
                      <span className="recent-name">{scan.name}</span>
                      <span className="recent-sub">{scan.ticketId} • {scan.eventName}</span>
                    </div>
                    <span className="recent-time">{formatTimeAgo(scan.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInScannerPage;
