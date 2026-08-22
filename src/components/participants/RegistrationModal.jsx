import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../../store/useAuthStore';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import { formatDate, formatEventSchedule } from '../../utils/dateUtils';
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
  const hasTiers = isPaid && event.pricingType === 'tiered' && Array.isArray(event.pricingTiers) && event.pricingTiers.length > 0;
  const defaultTier = hasTiers ? (event.pricingTiers[0]?.label || '') : '';
  const needsPreferences = hasGroup || (event.addOns && event.addOns.length > 0) || hasTiers;

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
    pricingTier: defaultTier,
    membershipProof: '',
    selectedAddOns: (event.addOns || []).filter(a => a.required).map(a => a.label),
    txnId: '',
    screenshotBase64: null,
    screenshotName: '',
  });

  const [errors, setErrors] = useState({});

  const setF = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  // Find currently selected tier object
  const selectedTierObj = hasTiers
    ? (event.pricingTiers.find(t => t.label === form.pricingTier) || event.pricingTiers[0])
    : null;

  // Calculate base price
  const basePrice = hasTiers
    ? parseFloat(selectedTierObj?.price || 0)
    : (form.registrationType === 'individual'
        ? parseFloat(event.individualPrice || 0)
        : parseFloat(event.groupPrice || 0));

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
    } else if (s === 1) {
      if (hasTiers && selectedTierObj?.requiresProof && !form.membershipProof?.trim()) {
        e.membershipProof = `${selectedTierObj.proofLabel || 'Membership ID'} is required for this discounted category.`;
      }
    } else if (s === 2 && isPaid) {
      const needsShot = event.paymentVerification === 'screenshot' || event.paymentVerification === 'both';
      const needsTxn = event.paymentVerification === 'txnId' || event.paymentVerification === 'both';
      if (needsTxn && !form.txnId?.trim()) e.txnId = 'Transaction ID is required.';
      if (needsShot && !form.screenshotBase64) e.screenshot = 'Please upload your payment screenshot.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const currentVisibleIdx = visibleSteps.indexOf(step);

  const handleNext = () => {
    if (!validateStep(step)) return;
    const nextStepInVisible = visibleSteps[currentVisibleIdx + 1];
    if (nextStepInVisible !== undefined) setStep(nextStepInVisible);
  };

  const handleBack = () => {
    const prevStepInVisible = visibleSteps[currentVisibleIdx - 1];
    if (prevStepInVisible !== undefined) setStep(prevStepInVisible);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    await new Promise(r => setTimeout(r, 500));
    registerParticipant?.(event.id, { ...form, ticketId: tempTicketId, userId: user?.id, totalPaid: totalAmount, registeredAt: new Date().toISOString() });
    setStep(3);
    addToast({ type: 'success', title: 'Registered! 🎉', message: `You're confirmed for ${event.name}. Ticket: ${tempTicketId}` });
  };

  return (
    <AnimatePresence>
      <motion.div className="reg-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={step !== 3 ? onClose : undefined}>
        <motion.div className="reg-modal-container" initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} onClick={e => e.stopPropagation()}>
          {event.bannerUrl && (
            <div className="reg-modal-banner" style={{ backgroundImage: `url(${event.bannerUrl})` }}>
              <div className="reg-modal-banner-overlay" />
              {event.logoUrl && <img src={event.logoUrl} alt={event.name} className="reg-modal-banner-logo" />}
            </div>
          )}
          <div className="reg-modal-header">
            <div className="reg-header-meta">
              <span className="reg-event-badge font-mono">{event.category?.toUpperCase() || 'EVENT'}</span>
              <h2 className="reg-event-title">{event.name}</h2>
              <p className="reg-event-sub font-mono">📅 {formatEventSchedule(event.date || event.startDate, event.time || event.startTime, event.endTime)} • 📍 {event.venue || (event.isOnline ? 'Online Event' : 'Campus Venue')}</p>
            </div>
            <button className="reg-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
          </div>
          <div className="reg-stepper-bar">
            {visibleSteps.map((s, idx) => {
              const isActive = s === step;
              const isPast = visibleSteps.indexOf(step) > idx;
              return (
                <React.Fragment key={s}>
                  <div className={`reg-step-node ${isActive ? 'step-node-active' : ''} ${isPast ? 'step-node-done' : ''}`}>
                    <span className="step-num">{isPast ? '✓' : idx + 1}</span>
                    <span className="step-name">{STEP_LABELS[s]}</span>
                  </div>
                  {idx < visibleSteps.length - 1 && <div className={`reg-step-connector ${isPast ? 'connector-done' : ''}`} />}
                </React.Fragment>
              );
            })}
          </div>
          <div className="reg-modal-body">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                {step === 0 && (
                  <div className="reg-form-grid">
                    <div className="reg-field-row-2">
                      <div className="reg-field">
                        <label className="reg-label">Full Name <span className="req-star">*</span></label>
                        <input className={`craft-input ${errors.fullName ? 'input-error' : ''}`} type="text" placeholder="Adithyen H" value={form.fullName} onChange={e => setF('fullName', e.target.value)} />
                        {errors.fullName && <p className="reg-error">{errors.fullName}</p>}
                      </div>
                      <div className="reg-field">
                        <label className="reg-label">Email Address <span className="req-star">*</span></label>
                        <input className={`craft-input font-mono ${errors.email ? 'input-error' : ''}`} type="email" placeholder="adithyen@college.edu" value={form.email} onChange={e => setF('email', e.target.value)} />
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
                  </div>
                )}
                {step === 1 && (
                  <div className="reg-form-grid">
                    {hasTiers && (
                      <div className="reg-field">
                        <label className="reg-label">Select Your Category / Membership <span className="req-star">*</span></label>
                        <div className="reg-tiers-grid">
                          {event.pricingTiers.map(tier => {
                            const isSelected = form.pricingTier === tier.label;
                            return (
                              <button key={tier.id || tier.label} type="button" className={`reg-tier-card ${isSelected ? 'reg-tier-card-active' : ''}`} onClick={() => setF('pricingTier', tier.label)}>
                                <div className="reg-tier-header">
                                  <span className="reg-tier-name">{tier.label}</span>
                                  <span className="reg-tier-price font-mono">₹{tier.price}</span>
                                </div>
                                {tier.requiresProof && <div className="reg-tier-req-tag font-mono">🔒 Requires {tier.proofLabel || 'Membership ID'}</div>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {hasTiers && selectedTierObj?.requiresProof && (
                      <div className="reg-field reg-proof-field-box">
                        <label className="reg-label">{selectedTierObj.proofLabel || 'Membership ID / Verification Code'} <span className="req-star">*</span></label>
                        <input type="text" className={`craft-input font-mono ${errors.membershipProof ? 'input-error' : ''}`} placeholder={`Enter your ${selectedTierObj.proofLabel || 'Membership ID / Proof Number'}`} value={form.membershipProof} onChange={e => setF('membershipProof', e.target.value)} />
                        {errors.membershipProof ? <p className="reg-error">{errors.membershipProof}</p> : <p className="reg-proof-note">🔒 Proof is required for this discounted member tier and will be audited at event check-in.</p>}
                      </div>
                    )}
                    {!hasTiers && hasIndividual && hasGroup && (
                      <div className="reg-field">
                        <label className="reg-label">How are you registering?</label>
                        <div className="mode-toggle-row">
                          <button type="button" className={`mode-toggle-btn ${form.registrationType === 'individual' ? 'mode-toggle-active' : ''}`} onClick={() => setF('registrationType', 'individual')}>👤 Individual</button>
                          <button type="button" className={`mode-toggle-btn ${form.registrationType === 'group' ? 'mode-toggle-active' : ''}`} onClick={() => setF('registrationType', 'group')}>👥 Group</button>
                        </div>
                      </div>
                    )}
                    {isPaid && (
                      <div className="reg-price-summary">
                        <div className="reg-price-row">
                          <span>{hasTiers ? (form.pricingTier || 'Category Tier') : `Base (${form.registrationType})`}</span>
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

                    {form.pricingTier && (
                      <div className="reg-tier-badge-confirmed font-mono">
                        <span>Category: <strong>{form.pricingTier}</strong></span>
                        {form.membershipProof && <span> • ID: <strong>{form.membershipProof}</strong></span>}
                      </div>
                    )}

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
