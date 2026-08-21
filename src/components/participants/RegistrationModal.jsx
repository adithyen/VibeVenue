import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../../store/useAuthStore';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import './RegistrationModal.css';

const STEPS = ['Personal Details', 'Preferences', 'Payment', 'Confirmed'];

const RegistrationModal = ({ event, onClose }) => {
  const { user } = useAuthStore();
  const { registerParticipant } = useEventStore();
  const { addToast } = useUIStore();
  const screenshotRef = useRef();

  // Generate a persistent unique ticket ID for this registration session
  const tempTicketId = useMemo(() => `TCK-${Math.floor(100000 + Math.random() * 900000)}`, []);

  const isPaid = event.isPaid || (event.fee && event.fee !== 'Free' && event.fee !== '');
  const hasGroup = event.registrationType === 'group' || event.registrationType === 'both';
  const hasIndividual = event.registrationType === 'individual' || event.registrationType === 'both';
  const needsPreferences = hasGroup || (event.addOns && event.addOns.length > 0);

  // Determine starting step — if no preferences and free event, may skip to confirm
  const firstUsefulStep = 0;
  const [step, setStep] = useState(firstUsefulStep);

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    college: '',
    department: '',
    year: '',
    rollNumber: '',
    registrationType: hasIndividual ? 'individual' : 'group',
    teamName: '',
    teamMembers: [{ name: '', email: '' }],
    selectedAddOns: [],
    txnId: '',
    screenshotBase64: null,
    screenshotName: '',
  });

  const [errors, setErrors] = useState({});

  const setF = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  // Calculate total price
  const basePrice = form.registrationType === 'individual'
    ? parseFloat(event.individualPrice || 0)
    : parseFloat(event.groupPrice || 0);

  const addOnTotal = form.selectedAddOns.reduce((sum, label) => {
    const addon = event.addOns?.find(a => a.label === label);
    return sum + (parseFloat(addon?.price || 0));
  }, 0);

  const totalAmount = basePrice + addOnTotal;

  // Build UPI note: <StudentName> <EventName> <TicketID>
  // NPCI 2025 compliance: tn must be STRICTLY alphanumeric + spaces only.
  // NO hyphens, NO underscores, NO special chars — causes rejection.
  const cleanStudent = (form.fullName || user?.name || 'STUDENT')
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 15)
    .trim() || 'STUDENT';
  const cleanEvent = (event.name || 'EVENT')
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 15)
    .trim() || 'EVENT';
  // Strip hyphens from ticketId too: TCK-482910 → TCK482910
  const cleanTicketId = tempTicketId.replace(/[^a-zA-Z0-9]/g, '');

  // Format: 'StudentName EventName TCK482910' (≤50 chars, alphanumeric+spaces only)
  const upiNote = `${cleanStudent} ${cleanEvent} ${cleanTicketId}`.slice(0, 50);

  // Standard NPCI P2P UPI URI.
  // Only safe P2P params: pa, pn, am, cu, tn
  // tr/mc are merchant-only and cause instant rejection on personal VPAs.
  const cleanUpiId = (event.upiId || '').trim().toLowerCase();
  // pn: only letters, digits, spaces (max 25 chars)
  const cleanPayee = (event.organizerName || event.name || 'VibeVenue')
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 25)
    .trim() || 'VibeVenue';
  // am: exactly 2 decimal places
  const formattedAmount = totalAmount.toFixed(2);

  // Final URI: strictly P2P format accepted by GPay, PhonePe, Paytm, BHIM
  const upiPayload = cleanUpiId
    ? `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(cleanPayee)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(upiNote)}`
    : '';

  const toggleAddOn = (label) => {
    setF('selectedAddOns', form.selectedAddOns.includes(label)
      ? form.selectedAddOns.filter(a => a !== label)
      : [...form.selectedAddOns, label]);
  };

  const readFile = (file) => new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(file);
  });

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFile(file);
    setForm(p => ({ ...p, screenshotBase64: b64, screenshotName: file.name }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.fullName?.trim()) e.fullName = 'Required';
      if (!form.email?.trim()) e.email = 'Required';
      if (!form.phone?.trim()) e.phone = 'Required';
      if (!form.college?.trim()) e.college = 'Required';
      if (!form.rollNumber?.trim()) e.rollNumber = 'Required';
    } else if (s === 2 && isPaid) {
      const needsShot = event.paymentVerification === 'screenshot' || event.paymentVerification === 'both';
      const needsTxn = event.paymentVerification === 'txnId' || event.paymentVerification === 'both';
      if (needsTxn && !form.txnId?.trim()) e.txnId = 'Transaction ID is required.';
      if (needsShot && !form.screenshotBase64) e.screenshot = 'Please upload your payment screenshot.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const visibleSteps = [0];
  if (needsPreferences) visibleSteps.push(1);
  if (isPaid) visibleSteps.push(2);
  visibleSteps.push(3);

  const currentVisibleIdx = visibleSteps.indexOf(step);

  const handleNext = () => {
    if (!validateStep(step)) return;
    const nextStepInVisible = visibleSteps[currentVisibleIdx + 1];
    if (nextStepInVisible !== undefined) {
      setStep(nextStepInVisible);
    }
  };

  const handleBack = () => {
    const prevStepInVisible = visibleSteps[currentVisibleIdx - 1];
    if (prevStepInVisible !== undefined) setStep(prevStepInVisible);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    await new Promise(r => setTimeout(r, 500));
    registerParticipant?.(event.id, {
      ...form,
      ticketId: tempTicketId,
      userId: user?.id,
      totalPaid: totalAmount,
      registeredAt: new Date().toISOString(),
    });
    setStep(3);
    addToast({ type: 'success', title: 'Registered! 🎉', message: `You're confirmed for ${event.name}. Ticket: ${tempTicketId}` });
  };

  const isLastBeforeConfirm = visibleSteps[currentVisibleIdx + 1] === 3;

  return (
    <AnimatePresence>
      <motion.div
        className="reg-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step !== 3 ? onClose : undefined}
      >
        <motion.div
          className="reg-modal-container"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Exact Creator Event Banner */}
          {event.bannerUrl && (
            <div className="reg-modal-banner" style={{ backgroundImage: `url(${event.bannerUrl})` }}>
              <div className="reg-modal-banner-overlay" />
              {event.logoUrl && (
                <img src={event.logoUrl} alt={event.name} className="reg-modal-banner-logo" />
              )}
              {step !== 3 && (
                <button className="reg-modal-close-btn banner-close" onClick={onClose} type="button" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Header */}
          <div className="reg-modal-hdr">
            <div className="reg-modal-hdr-left">
              {!event.bannerUrl && event.logoUrl && (
                <img src={event.logoUrl} alt={event.name} className="reg-modal-hdr-logo" />
              )}
              <div>
                <h2 className="reg-modal-hdr-title">Register for {event.name}</h2>
                <p className="reg-modal-hdr-sub">
                  {STEPS[step === 3 ? 3 : currentVisibleIdx]} · Step {step === 3 ? visibleSteps.length : currentVisibleIdx + 1} of {visibleSteps.length}
                </p>
              </div>
            </div>
            {!event.bannerUrl && step !== 3 && (
              <button className="reg-modal-close-btn" onClick={onClose} type="button" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="reg-progress-bar">
            <motion.div
              className="reg-progress-fill"
              animate={{ width: `${((currentVisibleIdx + 1) / visibleSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Body */}
          <div className="reg-modal-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                {/* Step 0: Personal Details */}
                {step === 0 && (
                  <div className="reg-form-grid">
                    <h3 className="reg-section-title">Personal Information</h3>

                    <div className="reg-field-row-2">
                      <div className="reg-field">
                        <label className="reg-label">Full Name <span className="req-star">*</span></label>
                        <input className={`craft-input ${errors.fullName ? 'input-error' : ''}`} type="text" placeholder="Aditya Kumar" value={form.fullName} onChange={e => setF('fullName', e.target.value)} />
                        {errors.fullName && <p className="reg-error">{errors.fullName}</p>}
                      </div>
                      <div className="reg-field">
                        <label className="reg-label">Email <span className="req-star">*</span></label>
                        <input className={`craft-input ${errors.email ? 'input-error' : ''}`} type="email" placeholder="you@college.edu" value={form.email} onChange={e => setF('email', e.target.value)} />
                        {errors.email && <p className="reg-error">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="reg-field-row-2">
                      <div className="reg-field">
                        <label className="reg-label">Phone <span className="req-star">*</span></label>
                        <input className={`craft-input font-mono ${errors.phone ? 'input-error' : ''}`} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setF('phone', e.target.value)} />
                        {errors.phone && <p className="reg-error">{errors.phone}</p>}
                      </div>
                      <div className="reg-field">
                        <label className="reg-label">Roll Number <span className="req-star">*</span></label>
                        <input className={`craft-input font-mono ${errors.rollNumber ? 'input-error' : ''}`} type="text" placeholder="21CS001" value={form.rollNumber} onChange={e => setF('rollNumber', e.target.value)} />
                        {errors.rollNumber && <p className="reg-error">{errors.rollNumber}</p>}
                      </div>
                    </div>

                    <div className="reg-field">
                      <label className="reg-label">College / Institution <span className="req-star">*</span></label>
                      <input className={`craft-input ${errors.college ? 'input-error' : ''}`} type="text" placeholder="SRM Institute of Science & Technology" value={form.college} onChange={e => setF('college', e.target.value)} />
                      {errors.college && <p className="reg-error">{errors.college}</p>}
                    </div>

                    <div className="reg-field-row-2">
                      <div className="reg-field">
                        <label className="reg-label">Department</label>
                        <input className="craft-input" type="text" placeholder="Computer Science" value={form.department} onChange={e => setF('department', e.target.value)} />
                      </div>
                      <div className="reg-field">
                        <label className="reg-label">Year of Study</label>
                        <select className="craft-input" value={form.year} onChange={e => setF('year', e.target.value)}>
                          <option value="">Select year</option>
                          {['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG / Masters', 'PhD'].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Pre-event Resource Links */}
                    {event.preLinks && event.preLinks.filter(l => l.url).length > 0 && (
                      <div className="reg-resources-box">
                        <span className="reg-res-title font-mono">Official Event Resources:</span>
                        <div className="reg-res-links-row">
                          {event.preLinks.filter(l => l.url).map((l, i) => (
                            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="reg-res-link-pill">
                              🔗 {l.label || 'Resource Link'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Event Contacts & Coordinators */}
                    {event.contacts && event.contacts.filter(c => c.name).length > 0 && (
                      <div className="reg-contacts-box">
                        <span className="reg-contacts-title font-mono">Event Coordinators & Helpdesk:</span>
                        <div className="reg-contacts-grid">
                          {event.contacts.filter(c => c.name).map((c, i) => (
                            <div key={i} className="reg-contact-pill">
                              <span className="reg-contact-name">{c.name} {c.role ? `(${c.role})` : ''}</span>
                              <div className="reg-contact-links">
                                {c.phone && <a href={`tel:${c.phone}`} className="reg-contact-action font-mono">📞 {c.phone}</a>}
                                {c.email && <a href={`mailto:${c.email}`} className="reg-contact-action font-mono">✉️ {c.email}</a>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1: Preferences */}
                {step === 1 && (
                  <div className="reg-form-grid">
                    {/* Registration type choice */}
                    {hasIndividual && hasGroup && (
                      <div className="reg-field">
                        <label className="reg-label">How are you registering?</label>
                        <div className="mode-toggle-row">
                          <button type="button" className={`mode-toggle-btn ${form.registrationType === 'individual' ? 'mode-toggle-active' : ''}`} onClick={() => setF('registrationType', 'individual')}>👤 Individual</button>
                          <button type="button" className={`mode-toggle-btn ${form.registrationType === 'group' ? 'mode-toggle-active' : ''}`} onClick={() => setF('registrationType', 'group')}>👥 Group</button>
                        </div>
                      </div>
                    )}

                    {form.registrationType === 'group' && (
                      <>
                        <div className="reg-field">
                          <label className="reg-label">Team Name <span className="req-star">*</span></label>
                          <input className="craft-input" type="text" placeholder="Team Nexus" value={form.teamName} onChange={e => setF('teamName', e.target.value)} />
                        </div>
                        <div className="reg-field">
                          <div className="form-label-row">
                            <label className="reg-label">Team Members (Name & Email)</label>
                            <button type="button" className="reg-add-link" onClick={() => setF('teamMembers', [...form.teamMembers, { name: '', email: '' }])}>+ Add Member</button>
                          </div>
                          <div className="team-members-list">
                            {form.teamMembers.map((m, i) => {
                              const memberName = typeof m === 'object' ? (m.name || '') : '';
                              const memberEmail = typeof m === 'object' ? (m.email || '') : (m || '');
                              return (
                                <div key={i} className="team-member-item">
                                  <div className="team-member-inputs">
                                    <input
                                      className="craft-input"
                                      type="text"
                                      placeholder={`Member ${i + 1} Name`}
                                      value={memberName}
                                      onChange={e => {
                                        const updated = [...form.teamMembers];
                                        updated[i] = { name: e.target.value, email: memberEmail };
                                        setF('teamMembers', updated);
                                      }}
                                    />
                                    <input
                                      className="craft-input font-mono"
                                      type="email"
                                      placeholder={`member${i + 1}@college.edu`}
                                      value={memberEmail}
                                      onChange={e => {
                                        const updated = [...form.teamMembers];
                                        updated[i] = { name: memberName, email: e.target.value };
                                        setF('teamMembers', updated);
                                      }}
                                    />
                                  </div>
                                  {i > 0 && (
                                    <button
                                      type="button"
                                      className="contact-remove-btn"
                                      onClick={() => setF('teamMembers', form.teamMembers.filter((_, idx) => idx !== i))}
                                      title="Remove member"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Add-ons */}
                    {event.addOns && event.addOns.length > 0 && (
                      <div className="reg-field">
                        <label className="reg-label">Select Add-ons</label>
                        <div className="reg-addons-list">
                          {event.addOns.map(addon => {
                            const selected = form.selectedAddOns.includes(addon.label);
                            return (
                              <button
                                key={addon.label}
                                type="button"
                                className={`reg-addon-chip ${selected ? 'reg-addon-selected' : ''}`}
                                onClick={() => toggleAddOn(addon.label)}
                              >
                                <span>{addon.label}</span>
                                {addon.price ? <span className="reg-addon-price font-mono">+₹{addon.price}</span> : <span className="reg-addon-price">Free</span>}
                                {addon.required && <span className="reg-addon-req">Required</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price Summary */}
                    {isPaid && (
                      <div className="reg-price-summary">
                        <div className="reg-price-row">
                          <span>Base ({form.registrationType})</span>
                          <span className="font-mono">₹{basePrice}</span>
                        </div>
                        {form.selectedAddOns.map(label => {
                          const addon = event.addOns?.find(a => a.label === label);
                          return (
                            <div key={label} className="reg-price-row">
                              <span>{label}</span>
                              <span className="font-mono">+₹{addon?.price || 0}</span>
                            </div>
                          );
                        })}
                        <div className="reg-price-total">
                          <span>Total</span>
                          <span className="font-mono">₹{totalAmount}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && isPaid && (
                  <div className="reg-form-grid">
                    <div className="reg-payment-header">
                      <h3 className="reg-section-title">Complete Payment</h3>
                      <div className="reg-amount-display font-mono">₹{totalAmount}</div>
                    </div>

                    {/* UPI QR Code */}
                    {upiPayload && (
                      <div className="reg-qr-section">
                        <p className="reg-qr-label">Scan to pay via any UPI app (GPay, PhonePe, Paytm, BHIM)</p>
                        <div className="reg-qr-box">
                          <QRCodeSVG
                            value={upiPayload}
                            size={210}
                            level="M"
                            includeMargin={false}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                        </div>
                        <p className="reg-upi-id font-mono">{cleanUpiId}</p>
                        <div className="reg-note-badge">
                          <span className="reg-note-lbl">Payment Note:</span>
                          <span className="reg-note-val font-mono">{upiNote}</span>
                        </div>
                        <p className="reg-qr-hint">Pre-filled remark: <strong>{upiNote}</strong></p>
                      </div>
                    )}

                    {/* Payment verification fields */}
                    {(event.paymentVerification === 'txnId' || event.paymentVerification === 'both') && (
                      <div className="reg-field">
                        <label className="reg-label">Transaction ID / UTR Number <span className="req-star">*</span></label>
                        <input
                          className={`craft-input font-mono ${errors.txnId ? 'input-error' : ''}`}
                          type="text"
                          placeholder="e.g. T2026082100123456789"
                          value={form.txnId}
                          onChange={e => setF('txnId', e.target.value)}
                        />
                        {errors.txnId && <p className="reg-error">{errors.txnId}</p>}
                      </div>
                    )}

                    {(event.paymentVerification === 'screenshot' || event.paymentVerification === 'both') && (
                      <div className="reg-field">
                        <label className="reg-label">Payment Screenshot <span className="req-star">*</span></label>
                        <div
                          className={`reg-screenshot-upload ${errors.screenshot ? 'upload-error' : ''}`}
                          onClick={() => screenshotRef.current?.click()}
                        >
                          {form.screenshotBase64 ? (
                            <div className="reg-screenshot-preview">
                              <img src={form.screenshotBase64} alt="Payment screenshot" />
                              <span className="upload-overlay-label">✓ {form.screenshotName}</span>
                            </div>
                          ) : (
                            <>
                              <span style={{ fontSize: '1.5rem' }}>📷</span>
                              <span className="upload-hint">Tap to upload screenshot</span>
                            </>
                          )}
                        </div>
                        <input ref={screenshotRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScreenshot} />
                        {errors.screenshot && <p className="reg-error">{errors.screenshot}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div className="reg-confirm-screen">
                    <motion.div
                      className="reg-confirm-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    >
                      🎉
                    </motion.div>
                    <h3 className="reg-confirm-title">You're Registered!</h3>
                    <div className="reg-ticket-badge">
                      <span className="reg-ticket-lbl font-mono">Digital Ticket ID:</span>
                      <span className="reg-ticket-code font-mono">{tempTicketId}</span>
                    </div>
                    <p className="reg-confirm-sub">{event.confirmationMessage || `You're confirmed for ${event.name}. Check your email for details.`}</p>

                    {/* WhatsApp group */}
                    {event.whatsappLink && (
                      <a
                        href={event.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reg-whatsapp-btn"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        Join WhatsApp Group
                      </a>
                    )}

                    {/* Post-registration links */}
                    {event.postLinks && event.postLinks.filter(l => l.url).length > 0 && (
                      <div className="reg-post-links">
                        <p className="reg-post-links-title">Resources for you</p>
                        {event.postLinks.filter(l => l.url).map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="reg-resource-link">
                            🔗 {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    )}

                    <button type="button" className="reg-done-btn" onClick={onClose}>
                      Done
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          {step !== 3 && (
            <div className="reg-modal-footer">
              {currentVisibleIdx > 0 ? (
                <button type="button" className="reg-back-btn" onClick={handleBack}>← Back</button>
              ) : <div />}

              {isLastBeforeConfirm ? (
                <button type="button" className="reg-submit-btn" onClick={handleSubmit}>
                  ✓ Confirm Registration
                </button>
              ) : (
                <button type="button" className="reg-next-btn" onClick={handleNext}>
                  Continue →
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;
