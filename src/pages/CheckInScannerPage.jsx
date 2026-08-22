// CheckInScannerPage — Ultra-Fast Dual-Engine Camera & Hardware Barcode Suite
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import { supabase } from '../lib/supabase';
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
  const [scannedFrameBox, setScannedFrameBox] = useState(null);

  // Manual / Keyboard Barcode Scanner input
  const [manualInput, setManualInput] = useState('');
  const [barcodeReaderDetected, setBarcodeReaderDetected] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [lastScannedResult, setLastScannedResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());
  const isScanningActiveRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Keep ref in sync to prevent duplicate trigger races
  isProcessingRef.current = isProcessingScan;

  // 1. Fetch all registrations (Live Sync)
  const fetchAttendees = useCallback(async () => {
    const data = await getRecentRegistrations(2000);
    setAttendees(data || []);
    setLoading(false);
  }, [getRecentRegistrations]);

  useEffect(() => {
    fetchAttendees();

    // Supabase Realtime channel for instant gate synchronization
    const channel = supabase
      .channel('scanner-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchAttendees();
      })
      .subscribe();

    const handleFocus = () => fetchAttendees();
    window.addEventListener('focus', handleFocus);

    const timer = setInterval(fetchAttendees, 4000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
  }, [fetchAttendees]);

  // Check WebHID devices on mount
  useEffect(() => {
    if (navigator.hid?.getDevices) {
      navigator.hid.getDevices().then((devices) => {
        if (devices.length > 0) setBarcodeReaderDetected(true);
      }).catch(() => {});
    }
  }, []);

  // 2. Hardware Barcode Gun / USB Scanner Listener (Keyboard Wedge)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      if (interval > 200) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scanned = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        if (scanned.length >= 3) {
          setBarcodeReaderDetected(true);
          processScanCode(scanned);
        }
      } else if (e.key.length === 1) {
        if (interval < 55) {
          setBarcodeReaderDetected(true);
        }
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attendees, selectedEventId]);

  // 3. Camera Device Enumeration
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          if (videoDevs.length > 0) {
            setCamerasList(videoDevs);
            const backCam = videoDevs.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
            setSelectedCameraId(backCam ? backCam.deviceId : videoDevs[0].deviceId);
          }
        })
        .catch((err) => {
          console.warn('Camera enumeration error:', err);
        });
    }
  }, []);

  // 4. Start Ultra-Fast Canvas jsQR Scanner
  const startCamera = async (deviceId) => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setCameraActive(true);
      isScanningActiveRef.current = true;

      // Start Frame-by-Frame Decoding Loop
      requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.error('Camera start failed:', err);
      setCameraError(err?.message || 'Could not access camera. Please check permissions.');
      setCameraActive(false);
      isScanningActiveRef.current = false;
    }
  };

  // 5. Frame Analysis Loop using jsQR (Zero Latency)
  const scanVideoFrame = () => {
    if (!isScanningActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Decode using jsQR (Dual-pass: standard + inverted for screens)
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && !isProcessingRef.current) {
          processScanCode(code.data);
        }
      }
    }

    if (isScanningActiveRef.current) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // 6. Stop Camera
  const stopCamera = () => {
    isScanningActiveRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 7. Process Scanned Code (QR / Barcode / Roll No / Ticket ID)
  const processScanCode = async (rawCode) => {
    if (!rawCode || isProcessingRef.current) return;
    const cleanCode = String(rawCode).trim().toUpperCase();

    setIsProcessingScan(true);

    // Look for matching attendee
    const match = attendees.find((a) => {
      if (selectedEventId !== 'all' && a.eventId !== selectedEventId) {
        return false;
      }
      const ticket = a.ticketId?.toUpperCase();
      const ticketMatch = ticket && (cleanCode === ticket || cleanCode.includes(ticket) || ticket.includes(cleanCode));
      const studentMatch = (a.studentId && cleanCode.includes(a.studentId.toUpperCase())) || (a.rollNumber && cleanCode.includes(a.rollNumber.toUpperCase()));
      const idMatch = a.id && cleanCode.includes(a.id.toUpperCase());
      const emailMatch = a.email && cleanCode.includes(a.email.toUpperCase());
      return ticketMatch || studentMatch || idMatch || emailMatch;
    });

    const scanTimestamp = new Date();

    if (!match) {
      playErrorBuzz();
      setLastScannedResult({
        status: 'not_found',
        scannedCode: rawCode,
        timestamp: scanTimestamp,
      });
      addToast({
        type: 'error',
        title: 'Pass Not Found ✕',
        message: `No active registration matched "${rawCode}".`,
      });
      setTimeout(() => setIsProcessingScan(false), 1800);
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
      setTimeout(() => setIsProcessingScan(false), 1800);
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
        title: 'Gate Entry Approved ✓',
        message: `Welcome, ${match.name}! Check-in verified.`,
      });
    }

    setTimeout(() => setIsProcessingScan(false), 1800);
  };

  // 8. Image File Scanner
  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const qrCode = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });

          if (qrCode && qrCode.data) {
            processScanCode(qrCode.data);
          } else {
            // Fallback: Html5Qrcode for 1D Barcodes
            const html5 = new Html5Qrcode('qr-file-reader-dummy', {
              formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_39],
              verbose: false,
            });
            html5
              .scanFile(file, true)
              .then((decoded) => {
                html5.clear();
                processScanCode(decoded);
              })
              .catch(() => {
                addToast({
                  type: 'error',
                  title: 'Could Not Decode Image',
                  message: 'No readable QR code or barcode found in this file.',
                });
              });
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      addToast({ type: 'error', title: 'File Error', message: err?.message });
    }
  };

  // 9. Manual Search / Barcode Form Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processScanCode(manualInput.trim());
    setManualInput('');
  };

  // 10. Toggle Add-on fulfillment directly from scan card
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
            Ultra-fast 60FPS QR badge scanner & hardware USB laser support.
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
                  {cameraActive ? 'CAMERA LIVE — 60FPS SCANNING' : 'CAMERA STANDBY'}
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
                    <option key={c.deviceId} value={c.deviceId}>
                      📷 {c.label || `Camera ${c.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Native Video + Canvas Viewport */}
            <div className="qr-viewport-wrapper">
              <video
                ref={videoRef}
                className={`native-scanner-video ${cameraActive ? 'active' : ''}`}
                muted
                playsInline
                autoPlay
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {!cameraActive && (
                <div className="camera-standby-overlay">
                  <div className="camera-standby-icon">📷</div>
                  <h3 className="standby-title">Instant QR & Barcode Scanner</h3>
                  <p className="standby-sub font-mono">
                    Point laptop camera or mobile lens at the attendee's ticket QR code.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => startCamera(selectedCameraId)}
                    >
                      ▶ Start Live Camera
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📁 Upload / Scan Image
                    </Button>
                  </div>
                </div>
              )}

              {/* Hidden file input & dummy container */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileScan}
              />
              <div id="qr-file-reader-dummy" style={{ display: 'none' }} />

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
              <div className="camera-controls-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Scan Image File
                </Button>
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
              <span className={`font-mono usb-status-tag ${barcodeReaderDetected ? 'tag-detected' : 'tag-not-detected'}`}>
                {barcodeReaderDetected ? '⚡ BARCODE READER DETECTED' : '○ BARCODE READER NOT DETECTED'}
              </span>
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
