// EventRegistrationPage — Full-Page Immersive Registration Flow (2026 Impeccable Edition)
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import useAuthStore from '../store/useAuthStore';
import useEventStore from '../store/useEventStore';
import useUIStore from '../store/useUIStore';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { VibeVenueLogo, VibeVenueMark } from '../components/common/VibeVenueLogo';
import { formatEventSchedule, getRegistrationStatusInfo, getComputedEventStatus, formatPricingTier } from '../utils/dateUtils';
import { getCategoryById } from '../data/mockData';
import { getAdminSupabaseClient } from '../lib/supabase';
import './EventRegistrationPage.css';

const EventRegistrationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events, isLoading: eventsLoading, fetchEvents, registerParticipant } = useEventStore();
  const { addToast } = useUIStore();

  const [liveCounts, setLiveCounts] = useState(null);

  // Fetch live registrations fresh from DB on mount
  useEffect(() => {
    let active = true;
    async function fetchLiveCapacity() {
      try {
        const admin = await getAdminSupabaseClient();
        const { data: dbEvt } = await admin
          .from('events')
          .select('*, registrations(id, status)')
          .eq('id', id)
          .single();

        if (dbEvt && active) {
          const regs = dbEvt.registrations || [];
          const confirmed = regs.filter(r => r.status === 'confirmed').length;
          const waitlisted = regs.filter(r => r.status === 'waitlisted').length;
          const confirmedFinal = Math.max(
            confirmed,
            typeof dbEvt.amenities?.confirmedCount === 'number' ? dbEvt.amenities.confirmedCount : 0
          );
          const waitlistFinal = Math.max(
            waitlisted,
            typeof dbEvt.amenities?.waitlistCount === 'number' ? dbEvt.amenities.waitlistCount : 0
          );
          setLiveCounts({ confirmed: confirmedFinal, waitlisted: waitlistFinal });
        }
      } catch (err) {
        console.warn('fetchLiveCapacity error:', err);
      }
    }
    if (id) fetchLiveCapacity();
    return () => { active = false; };
  }, [id]);

  // Ensure events are always fetched if navigating directly
  useEffect(() => {
    if ((!events || events.length === 0) && fetchEvents) {
      fetchEvents();
    }
  }, [events?.length, fetchEvents]);

  const event = events.find(e => e.id === id);

  const effectiveEvent = useMemo(() => {
    if (!event) return null;
    if (!liveCounts) return event;
    return {
      ...event,
      registrationCount: liveCounts.confirmed,
      waitlistCount: liveCounts.waitlisted,
    };
  }, [event, liveCounts]);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null); // { conflictingEventName, overlapDescription }

  const regInfo = useMemo(() => getRegistrationStatusInfo(effectiveEvent), [effectiveEvent]);

  const isCurrentlyWaitlist = registrationResult
    ? registrationResult.status === 'waitlisted'
    : regInfo.isWaitlistActive;

  const stepTitles = useMemo(() => [
    { id: 0, title: 'Personal Details', icon: '👤' },
    { id: 1, title: 'Category & Pricing', icon: '📊' },
    { id: 2, title: 'Payment Verification', icon: '💳' },
    { id: 3, title: isCurrentlyWaitlist ? 'Waitlist Pass' : 'Confirmed Pass', icon: isCurrentlyWaitlist ? '📋' : '🎟️' },
  ], [isCurrentlyWaitlist]);

  // Generate unique Ticket ID
  const tempTicketId = useMemo(() => `TCK-${Math.floor(100000 + Math.random() * 900000)}`, []);

  const isPaid = Boolean(event?.isPaid || (event?.fee && event?.fee !== 'Free' && event?.fee !== '' && event?.fee !== '0' && event?.fee !== '₹0'));
  const hasGroup = event?.registrationType === 'group' || event?.registrationType === 'both';
  const hasIndividual = event?.registrationType === 'individual' || event?.registrationType === 'both';
  const hasTiers = isPaid && (event?.pricingType === 'tiered' || (Array.isArray(event?.pricingTiers) && event?.pricingTiers.length > 0)) && Array.isArray(event?.pricingTiers) && event?.pricingTiers.length > 0;
  const defaultTier = hasTiers ? (event.pricingTiers[0]?.label || '') : '';
  const hasAddOns = Array.isArray(event?.addOns) && event.addOns.length > 0;
  const needsPreferences = hasTiers || hasAddOns;

  const visibleSteps = useMemo(() => {
    const steps = [0];
    if (needsPreferences) steps.push(1);
    if (isPaid) steps.push(2);
    steps.push(3);
    return steps;
  }, [needsPreferences, isPaid]);

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || '',
    rollNumber: user?.studentId || user?.rollNumber || '',
    registrationType: event?.registrationType === 'group' ? 'group' : 'individual',
    teamName: '',
    teamMembers: [{ name: '', email: '', phone: '', rollNumber: '', department: '' }],
    pricingTier: defaultTier,
    membershipProof: '',
    selectedAddOns: (event?.addOns || []).filter(a => a.required).map(a => a.label),
    txnId: '',
    screenshotBase64: null,
    screenshotName: '',
  });

  const [errors, setErrors] = useState({});

  // Dynamically sync registrationType & pricingTier when event arrives
  useEffect(() => {
    if (event) {
      const allowedIndividual = event.registrationType === 'individual' || event.registrationType === 'both';
      const allowedGroup = event.registrationType === 'group' || event.registrationType === 'both';
      setForm(prev => {
        let nextType = prev.registrationType;
        if (!allowedGroup && nextType === 'group') nextType = 'individual';
        if (!allowedIndividual && nextType === 'individual') nextType = 'group';
        if (!nextType) nextType = allowedIndividual ? 'individual' : (allowedGroup ? 'group' : 'individual');
        return {
          ...prev,
          registrationType: nextType,
          pricingTier: prev.pricingTier || (event.pricingTiers?.[0]?.label || ''),
        };
      });
    }
  }, [event]);

  // Sync user profile if loaded asynchronously
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        college: prev.college || user.college || '',
        department: prev.department || user.department || '',
        year: prev.year || user.year || '',
        rollNumber: prev.rollNumber || user.studentId || user.rollNumber || '',
      }));
    }
  }, [user]);

  // Set default tier if needed
  useEffect(() => {
    if (hasTiers && !form.pricingTier && defaultTier) {
      setForm(p => ({ ...p, pricingTier: defaultTier }));
    }
  }, [hasTiers, defaultTier]);

  const setF = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const selectedTierObj = useMemo(() => {
    if (!hasTiers) return null;
    return event.pricingTiers.find(t => t.label === form.pricingTier) || event.pricingTiers[0];
  }, [hasTiers, event?.pricingTiers, form.pricingTier]);

  const basePrice = useMemo(() => {
    if (!isPaid) return 0;
    if (hasTiers && selectedTierObj) {
      return parseFloat(selectedTierObj.price) || 0;
    }
    if (form.registrationType === 'group') {
      return parseFloat(event.groupPrice) || 0;
    }
    return parseFloat(event.individualPrice) || 0;
  }, [isPaid, hasTiers, selectedTierObj, form.registrationType, event?.groupPrice, event?.individualPrice]);

  const addOnsTotal = useMemo(() => {
    if (!event?.addOns?.length) return 0;
    return (form.selectedAddOns || []).reduce((acc, label) => {
      const a = event.addOns.find(x => x.label === label);
      return acc + (a ? parseFloat(a.price) || 0 : 0);
    }, 0);
  }, [event?.addOns, form.selectedAddOns]);

  const totalAmount = basePrice + addOnsTotal;

  // NPCI-compliant UPI configuration
  const cleanStudent = (form.fullName || 'Student').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanEvent = (event?.name || 'Event').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanTicketId = tempTicketId.replace(/[^a-zA-Z0-9]/g, '');
  const upiNote = `${cleanStudent} ${cleanEvent} ${cleanTicketId}`.slice(0, 50);

  const cleanUpiId = (event?.upiId || '').trim().toLowerCase();
  const cleanPayee = (event?.organizerName || event?.name || 'VibeVenue')
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 25)
    .trim() || 'VibeVenue';
  const formattedAmount = totalAmount.toFixed(2);

  const upiPayload = cleanUpiId
    ? `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(cleanPayee)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(upiNote)}`
    : '';

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast({ type: 'info', title: 'Copied to clipboard', message: text });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(p => ({ ...p, screenshotBase64: event.target.result, screenshotName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddMember = () => {
    const maxMembers = event?.groupMaxSize || 4;
    if (form.teamMembers.length < maxMembers - 1) {
      setForm(p => ({
        ...p,
        teamMembers: [...p.teamMembers, { name: '', email: '', phone: '', rollNumber: '', department: '' }]
      }));
    }
  };

  const handleRemoveMember = (idx) => {
    setForm(p => ({
      ...p,
      teamMembers: p.teamMembers.filter((_, i) => i !== idx)
    }));
  };

  const handleMemberChange = (idx, field, value) => {
    setForm(p => {
      const next = [...p.teamMembers];
      next[idx] = { ...next[idx], [field]: value };
      return { ...p, teamMembers: next };
    });
    if (errors[`member_${idx}_${field}`]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[`member_${idx}_${field}`];
        return n;
      });
    }
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.fullName?.trim()) e.fullName = 'Full name is required';
      if (!form.email?.trim()) e.email = 'Email address is required';
      if (!form.phone?.trim()) e.phone = 'Phone number is required';
      if (!form.college?.trim()) e.college = 'College name is required';
      if (!form.rollNumber?.trim()) e.rollNumber = 'Roll number / Student ID is required';
      if (form.registrationType === 'group') {
        if (!form.teamName?.trim()) e.teamName = 'Team name is required for group registration';
        const totalMembers = 1 + (form.teamMembers?.length || 0);
        const minMembers = event?.groupMinSize || 2;
        const maxMembers = event?.groupMaxSize || 4;
        if (totalMembers < minMembers) {
          e.teamRoster = `Minimum ${minMembers} team members required (including Team Leader). Please add more members.`;
        }
        if (totalMembers > maxMembers) {
          e.teamRoster = `Maximum ${maxMembers} team members allowed.`;
        }
        (form.teamMembers || []).forEach((m, idx) => {
          if (!m.name?.trim()) e[`member_${idx}_name`] = `Member ${idx + 2} name is required`;
          if (!m.email?.trim()) e[`member_${idx}_email`] = `Member ${idx + 2} email is required`;
        });
      }
    } else if (s === 1) {
      if (hasTiers && selectedTierObj?.requiresProof && !form.membershipProof?.trim()) {
        e.membershipProof = `${selectedTierObj.proofLabel || 'Membership ID'} is required for this discount tier.`;
      }
    } else if (s === 2 && isPaid) {
      const needsShot = event.paymentVerification === 'screenshot' || event.paymentVerification === 'both';
      const needsTxn = event.paymentVerification === 'txnId' || event.paymentVerification === 'both';
      if (needsTxn && !form.txnId?.trim()) e.txnId = 'Transaction ID / UTR is required.';
      if (needsShot && !form.screenshotBase64) e.screenshot = 'Please upload your payment screenshot.';
    }
    setErrors(e);
    const isValid = Object.keys(e).length === 0;
    if (!isValid) {
      const firstMsg = Object.values(e)[0] || 'Please complete all required fields marked with *';
      addToast({
        type: 'warning',
        title: 'Required Field Missing',
        message: firstMsg,
      });
      setTimeout(() => {
        const firstErr = document.querySelector('.input-error, .field-error-msg, [class*="error"]');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
    return isValid;
  };

  const currentVisibleIdx = visibleSteps.indexOf(step);
  const isLastBeforeConfirm = currentVisibleIdx === visibleSteps.length - 2;

  const handleNext = () => {
    if (!validateStep(step)) return;
    const nextStep = visibleSteps[currentVisibleIdx + 1];
    if (nextStep !== undefined) {
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    const prevStep = visibleSteps[currentVisibleIdx - 1];
    if (prevStep !== undefined) {
      setStep(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setIsSubmitting(true);
    try {
      const fullTeamMembers = form.registrationType === 'group' ? [
        {
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          rollNumber: form.rollNumber,
          department: form.department,
          college: form.college,
          isLeader: true,
          checkedIn: false,
        },
        ...(form.teamMembers || []).map((m) => ({
          name: m.name,
          email: m.email,
          phone: m.phone || '',
          rollNumber: m.rollNumber || '',
          department: m.department || form.department,
          college: m.college || form.college,
          isLeader: false,
          checkedIn: false,
        })),
      ] : [];

      const isWaitlist = !!regInfo.isWaitlistActive;
      const result = await registerParticipant(event.id, {
        ...form,
        teamMembers: fullTeamMembers,
        ticketId: tempTicketId,
        userId: user?.id,
        totalPaid: totalAmount,
        status: isWaitlist ? 'waitlisted' : 'confirmed',
        registeredAt: new Date().toISOString(),
      });
      setRegistrationResult(result);
      const isActuallyWaitlisted = result?.status === 'waitlisted';
      setStep(3);
      addToast({
        type: isActuallyWaitlisted ? 'warning' : 'success',
        title: isActuallyWaitlisted ? 'Added to Waiting List! 📋' : 'Registration Confirmed! 🎉',
        message: isActuallyWaitlisted
          ? `You are #${result?.queuePosition || 1} in queue. You will be automatically promoted if a seat opens.`
          : `Your pass ${result?.ticketId || tempTicketId} is now live in your dashboard.`,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err?.message || '';
      if (msg.startsWith('OVERLAP:')) {
        // e.g. "OVERLAP:TechFest 2026:3 Sep 2026, 10:00 AM – 12:00 PM"
        const parts = msg.split(':');
        const conflictingEventName = parts[1] || 'another event';
        const overlapDescription = parts.slice(2).join(':');
        setConflictInfo({ conflictingEventName, overlapDescription });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        addToast({ type: 'error', title: 'Registration Failed', message: msg || 'Could not confirm registration.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventsLoading && !event) {
    return (
      <div className="full-reg-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="craft-spinner" style={{ margin: '0 auto 1.5rem', width: 36, height: 36 }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Loading Event Registration...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving event specifications and track details</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="full-reg-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Event Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The event you are registering for does not exist or has been removed.</p>
        <Button variant="primary" onClick={() => navigate('/portal')}>Back to My Dashboard</Button>
      </div>
    );
  }

  const cat = getCategoryById(event.category) || { label: event.category || 'General', icon: '⚡' };

  return (
    <div className="full-reg-page">
      {/* Top Header & Breadcrumb */}
      <div className="full-reg-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="full-reg-back-btn" onClick={() => navigate('/portal')} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <VibeVenueLogo size="sm" showTagline={false} />
        </div>
        <div className="full-reg-event-pill font-mono">
          <span>{cat.icon} {event.name}</span>
        </div>
      </div>

      {/* Hero Event Banner Summary */}
      <div
        className="full-reg-hero"
        style={{
          backgroundImage: event.bannerUrl
            ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%), url(${event.bannerUrl})`
            : `radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.35), transparent 70%), linear-gradient(135deg, #090D16 0%, #111827 50%, #1E1B4B 100%)`
        }}
      >
        <div className="full-reg-hero-content">
          <div className="full-reg-hero-left">
            {event.logoUrl && <img src={event.logoUrl} alt={event.name} className="full-reg-hero-logo" />}
            <div>
              <div className="full-reg-badge-row">
                <span className="full-reg-category-badge font-mono">{event.category?.toUpperCase() || 'EVENT'}</span>
                <span className="full-reg-price-badge font-mono">{event.fee || 'Free'}</span>
              </div>
              <h1 className="full-reg-hero-title">{event.name}</h1>
              <p className="full-reg-hero-meta font-mono">
                📅 {formatEventSchedule(event.date || event.startDate, event.time || event.startTime, event.endTime)} • 📍 {event.venue || (event.isOnline ? 'Online Event' : 'Campus Venue')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling Conflict Card */}
      <AnimatePresence>
        {conflictInfo && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            style={{
              background: 'rgba(225, 29, 72, 0.10)',
              border: '1.5px solid var(--accent-rose)',
              borderRadius: 'var(--radius-xl)',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--accent-rose)', display: 'block', fontSize: '0.9375rem', marginBottom: 6 }}>
                Scheduling Conflict Detected
              </strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5', margin: 0 }}>
                You already have a confirmed or waitlisted registration for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{conflictInfo.conflictingEventName}&rdquo;</strong>
                {conflictInfo.overlapDescription && (
                  <>
                    {', which runs '}
                    <strong style={{ color: 'var(--text-primary)' }}>{conflictInfo.overlapDescription}</strong>
                  </>
                )}
                . This event's schedule overlaps with that registration.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8, marginBottom: 0 }}>
                To register here, please go to your dashboard and cancel your existing pass for “{conflictInfo.conflictingEventName}” first.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/portal')}
                >
                  📄 View My Passes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConflictInfo(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step < 3 && regInfo.isWaitlistFull && (
        <div style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1.5px solid var(--accent-rose)', borderRadius: 'var(--radius-xl)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '1.75rem' }}>🔒</span>
          <div>
            <strong style={{ color: 'var(--accent-rose)', display: 'block', fontSize: '0.95rem' }}>Capacity & Waiting List Full</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.4', display: 'block', marginTop: 2 }}>
              Both regular seats ({event.maxParticipants}) and maximum waitlist queue capacity ({event.waitlistCapacity || 30}) have been filled. No further registrations can be accepted at this time.
            </span>
          </div>
        </div>
      )}

      {step < 3 && !regInfo.isWaitlistFull && regInfo.isWaitlistActive && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1.5px solid #F59E0B', borderRadius: 'var(--radius-xl)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '1.75rem' }}>📋</span>
          <div>
            <strong style={{ color: '#F59E0B', display: 'block', fontSize: '0.95rem' }}>
              Regular Seats Full — You are Registering for the Waiting List (#{regInfo.waitlistPosition} in Queue)
            </strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.4', display: 'block', marginTop: 2 }}>
              The standard venue limit of {event.maxParticipants} attendees has been reached. Submitting this form secures your spot on the official waiting list. If any confirmed delegate cancels, you will automatically be promoted to a Confirmed pass!
            </span>
          </div>
        </div>
      )}

      {step < 3 && !regInfo.isWaitlistActive && !regInfo.isWaitlistFull && regInfo.isClosed && (
        <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1.5px solid var(--accent-rose)', borderRadius: 'var(--radius-xl)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <div>
            <strong style={{ color: 'var(--accent-rose)', display: 'block', fontSize: '0.95rem' }}>Online Registration Closed</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>The deadline for this event has passed or the venue is at full capacity. New registrations cannot be submitted.</span>
          </div>
        </div>
      )}

      {step < 3 && regInfo.isSpot && (
        <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1.5px solid #D97706', borderRadius: 'var(--radius-xl)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <div>
            <strong style={{ color: '#D97706', display: 'block', fontSize: '0.95rem' }}>Spot Registration Active</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>You are applying for an on-desk / venue spot pass. Please present this confirmed pass at the registration desk.</span>
          </div>
        </div>
      )}

      {/* Full Page Stepper Bar */}
      <div className="full-reg-stepper-container craft-card">
        <div className="full-reg-stepper">
          {visibleSteps.map((sIdx, i) => {
            const stepInfo = stepTitles[sIdx] || { title: `Step ${sIdx + 1}`, icon: '📌' };
            const isActive = step === sIdx;
            const isDone = visibleSteps.indexOf(step) > i;

            return (
              <React.Fragment key={sIdx}>
                {i > 0 && <div className={`full-reg-step-line ${isDone ? 'line-done' : ''}`} />}
                <div className={`full-reg-step-node ${isActive ? 'step-active' : ''} ${isDone ? 'step-done' : ''}`}>
                  <div className="step-circle font-mono">
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div className="step-text-col">
                    <span className="step-title">{stepInfo.title}</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <motion.div
        key={step}
        className="full-reg-content-card craft-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      >
        {/* ── STEP 0: Personal Details ── */}
        {step === 0 && (
          <div className="full-reg-step-box">
            <div className="full-reg-step-header">
              <h2 className="step-heading">Personal & Academic Details</h2>
              <p className="step-subheading">Your details are autofilled from your profile and will be printed on your digital gate pass.</p>
            </div>

            <div className="full-reg-form-grid">
              <div className="form-field-group">
                <label className="craft-label">Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="text"
                  className={`craft-input ${errors.fullName ? 'input-error' : ''}`}
                  placeholder="Aarav Sharma"
                  value={form.fullName}
                  onChange={e => setF('fullName', e.target.value)}
                />
                {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
              </div>

              <div className="form-field-group">
                <label className="craft-label">Email Address <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="email"
                  className={`craft-input font-mono ${errors.email ? 'input-error' : ''}`}
                  placeholder="student@campus.edu"
                  value={form.email}
                  onChange={e => setF('email', e.target.value)}
                />
                {errors.email && <span className="field-error-msg">{errors.email}</span>}
              </div>

              <div className="form-field-group">
                <label className="craft-label">Phone Number <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="tel"
                  className={`craft-input font-mono ${errors.phone ? 'input-error' : ''}`}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setF('phone', e.target.value)}
                />
                {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
              </div>

              <div className="form-field-group">
                <label className="craft-label">Roll Number / Student ID <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="text"
                  className={`craft-input font-mono ${errors.rollNumber ? 'input-error' : ''}`}
                  placeholder="21CS001"
                  value={form.rollNumber}
                  onChange={e => setF('rollNumber', e.target.value)}
                />
                {errors.rollNumber && <span className="field-error-msg">{errors.rollNumber}</span>}
              </div>

              <div className="form-field-group">
                <label className="craft-label">College / Institution <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="text"
                  className={`craft-input ${errors.college ? 'input-error' : ''}`}
                  placeholder="SCT College of Engineering"
                  value={form.college}
                  onChange={e => setF('college', e.target.value)}
                />
                {errors.college && <span className="field-error-msg">{errors.college}</span>}
              </div>

              <div className="form-field-group">
                <label className="craft-label">Department / Branch</label>
                <input
                  type="text"
                  className="craft-input"
                  placeholder="Computer Science & Engineering"
                  value={form.department}
                  onChange={e => setF('department', e.target.value)}
                />
              </div>
            </div>

            {/* Team Option if event allows group */}
            {hasGroup && (
              <div className="full-reg-group-section">
                {hasIndividual ? (
                  <>
                    <label className="craft-label">Registration Type</label>
                    <div className="full-reg-toggle-row">
                      <button
                        type="button"
                        className={`full-reg-toggle-btn ${form.registrationType === 'individual' ? 'active' : ''}`}
                        onClick={() => setF('registrationType', 'individual')}
                      >
                        👤 Individual Delegate
                      </button>
                      <button
                        type="button"
                        className={`full-reg-toggle-btn ${form.registrationType === 'group' ? 'active' : ''}`}
                        onClick={() => setF('registrationType', 'group')}
                      >
                        👥 Team Registration
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: '1.25rem', padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <strong style={{ color: 'var(--accent-iris, #6366F1)', fontSize: '0.875rem' }}>👥 Team Only Track</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      This track requires group/team registration. Please specify your team name and delegate roster below.
                    </p>
                  </div>
                )}

                {form.registrationType === 'group' && (
                  <div className="team-roster-builder" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-field-group">
                      <label className="craft-label">Team Name <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                      <input
                        type="text"
                        className={`craft-input ${errors.teamName ? 'input-error' : ''}`}
                        placeholder="e.g. NeuralKnights"
                        value={form.teamName}
                        onChange={e => setF('teamName', e.target.value)}
                      />
                      {errors.teamName && <span className="field-error-msg">{errors.teamName}</span>}
                    </div>

                    {/* Team Members Roster Container */}
                    <div className="team-roster-container craft-card" style={{ padding: '16px 20px', background: 'var(--surface-inset, #F8F9FA)', border: '1px solid var(--border-default)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>👥 Team Roster Specification</strong>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Min: {event.groupMinSize || 2} members • Max: {event.groupMaxSize || 4} members (including Leader)
                          </p>
                        </div>
                        <span className="font-mono" style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-iris, #6366F1)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {1 + form.teamMembers.length} / {event.groupMaxSize || 4} Delegates
                        </span>
                      </div>

                      {errors.teamRoster && (
                        <div style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--accent-rose)', padding: '8px 12px', borderRadius: 8, fontSize: '0.8125rem', marginBottom: 12 }}>
                          ⚠️ {errors.teamRoster}
                        </div>
                      )}

                      {/* Member 1: Team Leader */}
                      <div className="team-member-card" style={{ padding: '12px 16px', background: 'var(--surface-card, #FFFFFF)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>👑 Member 1 — Team Leader</span>
                          <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald, #059669)', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Primary Delegate (You)
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <strong>{form.fullName || 'Leader Name'}</strong> • {form.email || 'leader@email.com'} • {form.rollNumber || 'Roll No'} • {form.phone || 'Phone'}
                        </p>
                      </div>

                      {/* Additional Team Members */}
                      {form.teamMembers.map((member, idx) => (
                        <div key={idx} className="team-member-card" style={{ padding: '14px 16px', background: 'var(--surface-card, #FFFFFF)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              👤 Member {idx + 2} Details
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              ✕ Remove Member
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <div>
                              <label className="craft-label" style={{ fontSize: '0.75rem' }}>Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                              <input
                                type="text"
                                className={`craft-input ${errors[`member_${idx}_name`] ? 'input-error' : ''}`}
                                placeholder="Member full name"
                                value={member.name}
                                onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                              />
                              {errors[`member_${idx}_name`] && <span className="field-error-msg">{errors[`member_${idx}_name`]}</span>}
                            </div>

                            <div>
                              <label className="craft-label" style={{ fontSize: '0.75rem' }}>Email Address <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                              <input
                                type="email"
                                className={`craft-input font-mono ${errors[`member_${idx}_email`] ? 'input-error' : ''}`}
                                placeholder="member@campus.edu"
                                value={member.email}
                                onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                              />
                              {errors[`member_${idx}_email`] && <span className="field-error-msg">{errors[`member_${idx}_email`]}</span>}
                            </div>

                            <div>
                              <label className="craft-label" style={{ fontSize: '0.75rem' }}>Phone Number</label>
                              <input
                                type="tel"
                                className="craft-input font-mono"
                                placeholder="+91 98765 00000"
                                value={member.phone}
                                onChange={e => handleMemberChange(idx, 'phone', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="craft-label" style={{ fontSize: '0.75rem' }}>Roll No / Student ID</label>
                              <input
                                type="text"
                                className="craft-input font-mono"
                                placeholder="e.g. 21CS042"
                                value={member.rollNumber}
                                onChange={e => handleMemberChange(idx, 'rollNumber', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="craft-label" style={{ fontSize: '0.75rem' }}>Department / Branch</label>
                              <input
                                type="text"
                                className="craft-input"
                                placeholder="e.g. CSE / ECE"
                                value={member.department}
                                onChange={e => handleMemberChange(idx, 'department', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Member Button */}
                      {1 + form.teamMembers.length < (event.groupMaxSize || 4) && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAddMember}
                          style={{ width: '100%', marginTop: 4 }}
                        >
                          + Add Team Member {form.teamMembers.length + 2}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Category & Preferences ── */}
        {step === 1 && (
          <div className="full-reg-step-box">
            <div className="full-reg-step-header">
              <h2 className="step-heading">Select Category & Preferences</h2>
              <p className="step-subheading">Choose your delegate pricing tier and customize your registration add-ons.</p>
            </div>

            {/* Dynamic Pricing Tiers Grid */}
            {hasTiers && (
              <div className="full-reg-section-block">
                <label className="craft-label">Select Your Category</label>
                <div className="full-reg-tiers-grid">
                  {event.pricingTiers.map((tier) => {
                    const isSelected = form.pricingTier === tier.label;
                    return (
                      <div
                        key={tier.id || tier.label}
                        className={`full-reg-tier-card ${isSelected ? 'tier-card-active' : ''}`}
                        onClick={() => setF('pricingTier', tier.label)}
                      >
                        <div className="tier-card-top">
                          <span className="tier-card-name">{tier.label}</span>
                          <span className="tier-card-price font-mono">₹{tier.price}</span>
                        </div>
                        {tier.requiresProof && (
                          <div className="tier-card-proof-tag font-mono">
                            🔒 Requires {tier.proofLabel || 'Verification ID'}
                          </div>
                        )}
                        <div className="tier-card-radio font-mono">
                          {isSelected ? '● Selected' : '○ Click to select'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Membership proof box */}
                {selectedTierObj?.requiresProof && (
                  <div className="full-reg-proof-box">
                    <label className="craft-label">
                      {selectedTierObj.proofLabel || 'Membership ID / Roll Number'} <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`craft-input font-mono ${errors.membershipProof ? 'input-error' : ''}`}
                      placeholder={`Enter your ${selectedTierObj.proofLabel || 'Membership ID'}`}
                      value={form.membershipProof}
                      onChange={e => setF('membershipProof', e.target.value)}
                    />
                    {errors.membershipProof && <span className="field-error-msg">{errors.membershipProof}</span>}
                    <p className="proof-hint font-mono">Will be verified by the organizers at the desk.</p>
                  </div>
                )}
              </div>
            )}

            {/* Add-ons */}
            {event.addOns?.length > 0 && (
              <div className="full-reg-section-block">
                <label className="craft-label">Available Add-ons</label>
                <div className="full-reg-addons-list">
                  {event.addOns.map(addon => {
                    const isChecked = (form.selectedAddOns || []).includes(addon.label);
                    return (
                      <label key={addon.id || addon.label} className="addon-row-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={addon.required}
                          onChange={(e) => {
                            if (addon.required) return;
                            const next = e.target.checked
                              ? [...(form.selectedAddOns || []), addon.label]
                              : (form.selectedAddOns || []).filter(l => l !== addon.label);
                            setF('selectedAddOns', next);
                          }}
                        />
                        <span className="addon-name">{addon.label}</span>
                        <span className="addon-price font-mono">+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Summary Banner */}
            <div className="full-reg-summary-banner">
              <div className="summary-row">
                <span>Base Registration ({form.pricingTier || form.registrationType})</span>
                <span className="font-mono">₹{basePrice}</span>
              </div>
              {addOnsTotal > 0 && (
                <div className="summary-row">
                  <span>Selected Add-ons</span>
                  <span className="font-mono">+₹{addOnsTotal}</span>
                </div>
              )}
              <div className="summary-total-row">
                <span className="total-label">Total Payable</span>
                <span className="total-val font-mono">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Payment & Verification ── */}
        {step === 2 && isPaid && (
          <div className="full-reg-step-box">
            <div className="full-reg-step-header">
              <h2 className="step-heading">Payment Verification</h2>
              <p className="step-subheading">Scan the official UPI QR code with any UPI app and enter the transaction reference.</p>
            </div>

            <div className="full-reg-payment-layout">
              {/* Left Column: QR & UPI details */}
              <div className="payment-qr-col">
                <div className="payment-qr-card">
                  {upiPayload ? (
                    <div className="qr-box-inner">
                      <QRCodeSVG value={upiPayload} size={180} level="M" />
                    </div>
                  ) : (
                    <div className="qr-box-inner no-qr">
                      <p>UPI ID not configured for this event</p>
                    </div>
                  )}

                  <div className="qr-details-block font-mono">
                    <div className="qr-data-row">
                      <span className="data-lbl">UPI ID:</span>
                      <span className="data-val">{cleanUpiId || 'organizer@upi'}</span>
                      {cleanUpiId && (
                        <button type="button" className="copy-btn" onClick={() => copyToClipboard(cleanUpiId, 'upi')}>
                          {copiedField === 'upi' ? '✓ Copied' : '📋 Copy'}
                        </button>
                      )}
                    </div>

                    <div className="qr-data-row remark-row">
                      <span className="data-lbl">Remark:</span>
                      <span className="data-val remark-val" title={upiNote}>{upiNote}</span>
                      <button type="button" className="copy-btn" onClick={() => copyToClipboard(upiNote, 'note')}>
                        {copiedField === 'note' ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>

                    <div className="payable-amount-box">
                      <span className="payable-lbl">Payable Amount</span>
                      <span className="payable-num">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Transaction ID & Screenshot */}
              <div className="payment-form-col">
                <div className="form-field-group">
                  <label className="craft-label">Transaction ID / UTR Number <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                  <input
                    type="text"
                    className={`craft-input font-mono ${errors.txnId ? 'input-error' : ''}`}
                    placeholder="e.g. 324109854721"
                    value={form.txnId}
                    onChange={e => setF('txnId', e.target.value)}
                  />
                  {errors.txnId && <span className="field-error-msg">{errors.txnId}</span>}
                  <span className="field-hint font-mono">Available on your GPay, PhonePe, or Paytm receipt.</span>
                </div>

                <div className="form-field-group" style={{ marginTop: '1.25rem' }}>
                  <label className="craft-label">Payment Screenshot <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                  <label className={`full-reg-upload-dropzone ${errors.screenshot ? 'upload-error' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleScreenshot}
                    />
                    {form.screenshotBase64 ? (
                      <div className="screenshot-uploaded-preview">
                        <img src={form.screenshotBase64} alt="Proof" className="uploaded-thumb" />
                        <div className="uploaded-meta">
                          <span className="uploaded-name font-mono">✓ {form.screenshotName || 'screenshot.jpg'}</span>
                          <span className="uploaded-action font-mono">Click to change file</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon">📸</div>
                        <span className="upload-title">Click to upload payment receipt</span>
                        <span className="upload-sub font-mono">Supports PNG, JPG, WEBP (Max 5MB)</span>
                      </div>
                    )}
                  </label>
                  {errors.screenshot && <span className="field-error-msg">{errors.screenshot}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirmed Gate Pass or Waitlist Pass ── */}
        {step === 3 && (() => {
          const isPassWaitlisted = registrationResult ? (registrationResult.status === 'waitlisted') : regInfo.isWaitlistActive;
          const passQueuePosition = registrationResult?.queuePosition || regInfo.waitlistPosition || 1;
          const finalTicketId = registrationResult?.ticketId || tempTicketId;

          return (
            <div className="full-reg-confirmed-box">
              <div className="confirmed-celebration-badge">
                <div className="celebration-icon">{isPassWaitlisted ? '📋' : '🎉'}</div>
                <h2 className="confirmed-title">
                  {isPassWaitlisted ? 'Added to Waiting List!' : 'Registration Confirmed!'}
                </h2>
                <p className="confirmed-sub">
                  {isPassWaitlisted
                    ? `You have secured Queue Position #${passQueuePosition}. If a confirmed participant cancels their registration, your pass will automatically be upgraded to Confirmed!`
                    : 'Your digital gate pass is ready. Present this pass at the venue entrance desk.'}
                </p>
              </div>

              {/* Official Pass Ticket Card */}
              <div className="full-reg-pass-ticket craft-card" style={isPassWaitlisted ? { border: '1.5px solid #F59E0B' } : undefined}>
                <div className="pass-ticket-left">
                  <div className="ticket-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <VibeVenueMark size={18} idPrefix="pass-reg-vv" />
                      <span className="ticket-brand font-mono">
                        {isPassWaitlisted ? 'VIBEVENUE WAITLIST PASS' : 'VIBEVENUE GATE PASS'}
                      </span>
                    </div>
                    <span className="ticket-category-tag font-mono">{event.category?.toUpperCase()}</span>
                  </div>
                  <h3 className="ticket-event-name">{event.name}</h3>
                  <p className="ticket-venue-meta font-mono">📍 {event.venue || (event.isOnline ? 'Online' : 'Campus Venue')}</p>
                  <p className="ticket-date-meta font-mono">📅 {formatEventSchedule(event.date || event.startDate, event.time || event.startTime, event.endTime)}</p>

                  <div className="ticket-delegate-grid font-mono">
                    <div>
                      <span className="t-lbl">DELEGATE</span>
                      <span className="t-val">{form.fullName}</span>
                    </div>
                    <div>
                      <span className="t-lbl">ROLL NO</span>
                      <span className="t-val">{form.rollNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="t-lbl">CATEGORY</span>
                      <span className="t-val">
                        {(typeof formatPricingTier === 'function' && form.pricingTier ? formatPricingTier(form.pricingTier) : '') ||
                         (form.registrationType === 'group' ? 'Team Delegate' : 'Individual Delegate')}
                      </span>
                    </div>
                    <div>
                      <span className="t-lbl">{isPassWaitlisted ? 'QUEUE POSITION' : 'AMOUNT PAID'}</span>
                      <span className="t-val" style={isPassWaitlisted ? { color: '#F59E0B', fontWeight: 700 } : undefined}>
                        {isPassWaitlisted ? `#${passQueuePosition}` : (totalAmount > 0 ? `₹${totalAmount}` : 'Free Entry')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pass-ticket-right font-mono">
                  <div className="ticket-qr-box">
                    <QRCodeSVG value={finalTicketId} size={110} />
                  </div>
                  <span className="ticket-id-code">{finalTicketId}</span>
                  <span
                    className="ticket-status-pill"
                    style={isPassWaitlisted ? { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderColor: '#F59E0B' } : undefined}
                  >
                    {isPassWaitlisted ? `STATUS: WAITLISTED (#${passQueuePosition})` : 'STATUS: CONFIRMED'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="confirmed-actions-row">
                {event.whatsappLink && (
                  <a
                    href={event.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="full-reg-whatsapp-btn"
                  >
                    💬 Join Event WhatsApp Community
                  </a>
                )}
                <Button
                  id="full-reg-finish-btn"
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/portal')}
                >
                  Return to My Dashboard →
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Cancellation & Refund Policy Card (Displayed before confirmation) */}
        {step < 3 && (event.cancellationPolicy || event.acceptCancellationsUntil) && (
          <div className="full-reg-policy-card font-mono">
            <div className="full-reg-policy-header">
              <span className="policy-icon">🛡️</span>
              <strong className="policy-title">CANCELLATION & REFUND POLICY</strong>
            </div>
            {event.acceptCancellationsUntil && (
              <p className="policy-cutoff-text">
                ⏱️ <strong>Self-cancellation cutoff:</strong> Open until {new Date(event.acceptCancellationsUntil).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
            {event.cancellationPolicy && (
              <p className="policy-desc-text">
                {event.cancellationPolicy}
              </p>
            )}
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        {step !== 3 && (
          <div className="full-reg-footer-nav">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={currentVisibleIdx === 0}
            >
              ← Back
            </Button>

            {isLastBeforeConfirm ? (
              <Button
                type="button"
                variant={regInfo.isClosed ? 'secondary' : 'primary'}
                loading={isSubmitting}
                disabled={regInfo.isClosed}
                onClick={handleSubmit}
                id="submit-registration-btn"
                style={regInfo.isWaitlistActive ? { background: '#D97706', borderColor: '#B45309' } : undefined}
              >
                {regInfo.isClosed
                  ? 'Registrations Closed'
                  : regInfo.isWaitlistActive
                  ? `Join Waitlist (#${regInfo.waitlistPosition} in Queue) 📋`
                  : regInfo.isSpot
                  ? 'Confirm Spot Registration ⚡'
                  : 'Confirm Registration & Generate Pass 🎟️'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                disabled={regInfo.isClosed}
                onClick={handleNext}
              >
                {regInfo.isClosed ? 'Registrations Closed' : 'Continue →'}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

class RegistrationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Registration Page render error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="full-reg-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎟️</span>
          <h2>Registration View Recovered</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0.5rem auto 1.5rem' }}>
            Your registration details have been saved. If your pass has generated, it is ready in your student portal.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => window.location.href = '/portal'}>
              View My Passes in Dashboard →
            </Button>
            <Button variant="secondary" onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const EventRegistrationPageWrapper = () => (
  <RegistrationErrorBoundary>
    <EventRegistrationPage />
  </RegistrationErrorBoundary>
);

export default EventRegistrationPageWrapper;
