// VibeVenue — Complete Event Creation Form (v4.0)
// 4 Redesigned Steps: Event Info | Schedule & Venue | Registration & Pricing | Resources & Comms
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../../data/mockData';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import Button from '../ui/Button';
import './EventForm.css';

const STEPS = [
  { id: 0, label: 'Event Info',             icon: '📋' },
  { id: 1, label: 'Schedule & Venue',       icon: '📍' },
  { id: 2, label: 'Registration & Pricing', icon: '🎟' },
  { id: 3, label: 'Resources & Comms',      icon: '🔗' },
];

const freshData = () => ({
  // Step 1
  name: '',
  tagline: '',
  description: '',
  bannerBase64: null,
  bannerName: '',
  logoBase64: null,
  logoName: '',
  category: '',
  customCategory: null, // { label, icon (emoji), imageBase64 }
  isOnline: false,
  tags: '',

  // Step 2
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  venue: '',
  meetingLink: '',
  contacts: [{ name: '', role: '', phone: '', email: '' }],

  // Step 3
  registrationType: 'individual', // 'individual' | 'group' | 'both'
  pricingType: 'flat', // 'flat' | 'tiered'
  openTo: ['All'],
  pricingTiers: [
    { id: 'tier-1', label: 'SCTians', price: '600', requiresProof: false, proofLabel: '' },
    { id: 'tier-2', label: 'Non-SCTians', price: '750', requiresProof: false, proofLabel: '' },
  ],
  individualPrice: '',
  groupPrice: '',
  groupMinSize: '2',
  groupMaxSize: '5',
  hasCapacityLimit: true,
  maxParticipants: '100',
  enableWaitlist: true,
  waitlistCapacity: '10',
  acceptCancellationsUntil: '',
  cancellationPolicy: '100% refund for cancellations requested up to 48 hours before the event. Cancellations within 48 hours of kickoff are non-refundable. Vacated seats are automatically offered to the waitlist queue.',
  allowRegistrationsUntil: '',
  enableSpotRegistrations: false,
  allowSpotRegistrationsUntil: '',
  addOns: [], // [{ label, price, required }]
  hasEarlyBird: false,
  earlyBirdDiscount: '',
  amenities: { refreshments: false, accommodation: false, certificate: false, wifi: false },
  isPaid: false,
  upiId: '',
  hasBankTransfer: false,
  accountNo: '',
  ifscCode: '',
  paymentVerification: 'both', // 'screenshot' | 'txnId' | 'both'
  whatsappLink: '',

  // Step 4
  preLinks: [{ label: '', url: '' }],
  postLinks: [{ label: '', url: '' }],
  confirmationMessage: 'Thank you for registering! We look forward to seeing you.',
});

const POLICY_TEMPLATES = [
  {
    label: '⭐ Flexible 48h Refund (Default)',
    text: '100% refund for cancellations requested up to 48 hours before the event. Cancellations within 48 hours of kickoff are non-refundable. Vacated seats are automatically offered to the waitlist queue.',
  },
  {
    label: '⚡ Standard 24h Refund',
    text: 'Full 100% refund processed automatically for cancellations requested at least 24 hours prior to event start. Vacated seats are promoted immediately to the waiting list.',
  },
  {
    label: '🔒 Strict / Non-Refundable',
    text: 'All registrations and pass purchases are final and non-refundable. Delegate passes may be transferred upon organizer approval.',
  },
  {
    label: '🎓 Free Track Self-Release',
    text: 'This is a free collegiate track. If your schedule changes, please cancel your pass in the student portal before the deadline to release your seat to waitlisted peers.',
  },
];

const EventForm = ({ event = null, onClose }) => {
  const isEdit = !!event;
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(
    isEdit
      ? {
          ...freshData(),
          ...event,
          pricingType: event.pricingType || (event.pricingTiers?.length ? 'tiered' : 'flat'),
          pricingTiers: event.pricingTiers?.length ? event.pricingTiers : freshData().pricingTiers,
          openTo: event.openTo?.length ? event.openTo : ['All'],
          hasCapacityLimit: event.hasCapacityLimit ?? (event.capacity !== 'Unlimited' && Boolean(event.capacity || event.maxParticipants)),
          maxParticipants: String(event.capacity || event.maxParticipants || '100'),
          enableWaitlist: event.enableWaitlist ?? event.amenities?.enableWaitlist ?? true,
          waitlistCapacity: String(event.waitlistCapacity ?? event.amenities?.waitlistCapacity ?? '10'),
          acceptCancellationsUntil: event.acceptCancellationsUntil ?? event.amenities?.acceptCancellationsUntil ?? '',
          cancellationPolicy: event.cancellationPolicy ?? event.amenities?.cancellationPolicy ?? freshData().cancellationPolicy,
          allowRegistrationsUntil: event.allowRegistrationsUntil || event.amenities?.allowRegistrationsUntil || '',
          enableSpotRegistrations: event.enableSpotRegistrations ?? event.amenities?.enableSpotRegistrations ?? false,
          allowSpotRegistrationsUntil: event.allowSpotRegistrationsUntil || event.amenities?.allowSpotRegistrationsUntil || '',
          bannerBase64: event.bannerUrl || null,
          bannerName: event.bannerUrl ? 'Current Banner' : '',
          logoBase64: event.logoUrl || null,
          logoName: event.logoUrl ? 'Current Logo' : '',
          tags: (event.tags || []).join(', '),
          contacts: event.contacts?.length ? event.contacts : [{ name: '', role: '', phone: '', email: '' }],
          preLinks: event.preLinks?.length ? event.preLinks : [{ label: '', url: '' }],
          postLinks: event.postLinks?.length ? event.postLinks : [{ label: '', url: '' }],
          addOns: event.addOns || [],
          amenities: event.amenities || { refreshments: false, accommodation: false, certificate: false, wifi: false },
        }
      : freshData()
  );
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [customCatInput, setCustomCatInput] = useState({ label: '', emoji: '🎯', show: false });

  const bannerRef = useRef();
  const logoRef = useRef();
  const customCatImgRef = useRef();

  const { addEvent, updateEvent } = useEventStore();
  const { addToast } = useUIStore();

  const set = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const toggleOpenToYear = (yr) => {
    let current = Array.isArray(formData.openTo) ? [...formData.openTo] : ['All'];
    if (yr === 'All') {
      set('openTo', ['All']);
      return;
    }
    current = current.filter(y => y !== 'All');
    if (current.includes(yr)) {
      current = current.filter(y => y !== yr);
    } else {
      current.push(yr);
    }
    if (current.length === 0) {
      current = ['All'];
    }
    set('openTo', current);
  };

  const setNested = (key, subKey, val) => {
    setFormData(prev => ({ ...prev, [key]: { ...prev[key], [subKey]: val } }));
  };

  const setCancellationPreset = (offsetHours) => {
    if (!formData.startDate) {
      addToast({
        type: 'warning',
        title: 'Start Date Required',
        message: 'Please specify the event start date in Step 2 first.',
      });
      return;
    }
    const timeStr = formData.startTime || '09:00';
    const startDt = new Date(`${formData.startDate}T${timeStr}`);
    if (isNaN(startDt.getTime())) return;
    const cutoffDt = new Date(startDt.getTime() - offsetHours * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const isoLocal = `${cutoffDt.getFullYear()}-${pad(cutoffDt.getMonth() + 1)}-${pad(cutoffDt.getDate())}T${pad(cutoffDt.getHours())}:${pad(cutoffDt.getMinutes())}`;
    set('acceptCancellationsUntil', isoLocal);
    addToast({
      type: 'info',
      title: 'Cutoff Set',
      message: offsetHours === 0 ? 'Cutoff set to exact kickoff time.' : `Cutoff set to ${offsetHours}h before event kickoff.`,
    });
  };

  const applyPolicyTemplate = (templateText) => {
    set('cancellationPolicy', templateText);
    addToast({
      type: 'success',
      title: 'Policy Applied',
      message: 'Refund policy template loaded into editor.',
    });
  };

  const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFile(file);
    setFormData(prev => ({ ...prev, bannerBase64: b64, bannerName: file.name }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await readFile(file);
    setFormData(prev => ({ ...prev, logoBase64: b64, logoName: file.name }));
  };

  // ---- Contact persons helpers ----
  const addContact = () =>
    setFormData(prev => ({ ...prev, contacts: [...prev.contacts, { name: '', role: '', phone: '', email: '' }] }));

  const updateContact = (idx, field, val) =>
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => i === idx ? { ...c, [field]: val } : c),
    }));

  const removeContact = (idx) =>
    setFormData(prev => ({ ...prev, contacts: prev.contacts.filter((_, i) => i !== idx) }));

  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vibe_saved_pricing_templates') || '[]');
    } catch {
      return [];
    }
  });
  const [showSaveTplModal, setShowSaveTplModal] = useState(false);
  const [newTplName, setNewTplName] = useState('');

  // ---- Pricing Tier helpers ----
  const addPricingTier = () =>
    setFormData(prev => ({
      ...prev,
      pricingTiers: [
        ...prev.pricingTiers,
        { id: `tier-${Date.now()}`, label: '', price: '', requiresProof: false, proofLabel: 'Membership ID / Roll No' }
      ]
    }));

  const updatePricingTier = (idx, field, val) =>
    setFormData(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((t, i) => i === idx ? { ...t, [field]: val } : t),
    }));

  const removePricingTier = (idx) =>
    setFormData(prev => ({ ...prev, pricingTiers: prev.pricingTiers.filter((_, i) => i !== idx) }));

  const applyTierPreset = (presetType) => {
    let presets = [];
    if (presetType === 'sctians') {
      presets = [
        { id: 'tier-1', label: 'SCTians', price: '600', requiresProof: false, proofLabel: '' },
        { id: 'tier-2', label: 'Non-SCTians', price: '750', requiresProof: false, proofLabel: '' },
      ];
    } else if (presetType === 'delegates') {
      presets = [
        { id: 'tier-1', label: 'Early Bird Pass', price: '450', requiresProof: false, proofLabel: '' },
        { id: 'tier-2', label: 'Regular Delegate Pass', price: '600', requiresProof: false, proofLabel: '' },
        { id: 'tier-3', label: 'VIP / All-Access Pass', price: '900', requiresProof: false, proofLabel: '' },
      ];
    }
    setFormData(prev => ({ ...prev, pricingType: 'tiered', pricingTiers: presets }));
    addToast({ type: 'info', title: 'Template Loaded', message: 'Applied pricing tier template.' });
  };

  const applyCustomTemplate = (tiers) => {
    if (!Array.isArray(tiers) || tiers.length === 0) return;
    setFormData(prev => ({ ...prev, pricingType: 'tiered', pricingTiers: JSON.parse(JSON.stringify(tiers)) }));
    addToast({ type: 'info', title: 'Custom Template Loaded', message: 'Applied your saved pricing tiers.' });
  };

  const handleSaveCustomTemplate = (e) => {
    e?.preventDefault();
    if (!newTplName.trim()) {
      addToast({ type: 'warning', title: 'Missing Name', message: 'Please enter a name for the template.' });
      return;
    }
    if (!formData.pricingTiers?.length) {
      addToast({ type: 'warning', title: 'No Tiers', message: 'Please add at least one tier to save.' });
      return;
    }
    const newTpl = {
      id: `tpl-${Date.now()}`,
      name: newTplName.trim(),
      tiers: JSON.parse(JSON.stringify(formData.pricingTiers)),
    };
    const updated = [...savedTemplates, newTpl];
    setSavedTemplates(updated);
    localStorage.setItem('vibe_saved_pricing_templates', JSON.stringify(updated));
    setNewTplName('');
    setShowSaveTplModal(false);
    addToast({ type: 'success', title: 'Template Saved! ⭐', message: `"${newTpl.name}" is now available in your templates.` });
  };

  const deleteSavedTemplate = (idx) => {
    const updated = savedTemplates.filter((_, i) => i !== idx);
    setSavedTemplates(updated);
    localStorage.setItem('vibe_saved_pricing_templates', JSON.stringify(updated));
    addToast({ type: 'info', title: 'Template Removed', message: 'Custom template deleted.' });
  };

  // ---- Add-on helpers ----
  const addAddOn = () =>
    setFormData(prev => ({ ...prev, addOns: [...prev.addOns, { label: '', price: '', required: false }] }));

  const updateAddOn = (idx, field, val) =>
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.map((a, i) => i === idx ? { ...a, [field]: val } : a),
    }));

  const removeAddOn = (idx) =>
    setFormData(prev => ({ ...prev, addOns: prev.addOns.filter((_, i) => i !== idx) }));

  // ---- Pre/Post link helpers ----
  const addLink = (type) =>
    setFormData(prev => ({ ...prev, [type]: [...prev[type], { label: '', url: '' }] }));

  const updateLink = (type, idx, field, val) =>
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((l, i) => i === idx ? { ...l, [field]: val } : l),
    }));

  const removeLink = (type, idx) =>
    setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== idx) }));

  // ---- Custom category ----
  const handleAddCustomCategory = () => {
    if (!customCatInput.label.trim()) return;
    const custom = {
      label: customCatInput.label.trim(),
      icon: customCatInput.emoji,
      id: `custom-${Date.now()}`,
    };
    setFormData(prev => ({ ...prev, category: custom.id, customCategory: custom }));
    setCustomCatInput({ label: '', emoji: '🎯', show: false });
  };

  // ---- Validation per step ----
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!formData.name?.trim()) e.name = 'Event name is required.';
      if (!formData.description?.trim() || formData.description.trim().length < 20)
        e.description = 'Description must be at least 20 characters.';
      if (!formData.category) e.category = 'Please select a category.';
    } else if (s === 1) {
      if (!formData.startDate) e.startDate = 'Start date is required.';
      if (!formData.startTime) e.startTime = 'Start time is required.';
      if (!formData.isOnline && !formData.venue?.trim()) e.venue = 'Venue is required for in-person events.';
    } else if (s === 2) {
      if (formData.isPaid && !formData.upiId?.trim()) e.upiId = 'UPI ID is required for paid events.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e) => {
    // Explicitly stop any possible event propagation
    e?.preventDefault();
    e?.stopPropagation();
    if (validateStep(step)) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const handleBack = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!validateStep(step)) return;
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await updateEvent(event.id, formData);
        addToast({ type: 'success', title: 'Event Updated', message: `"${formData.name}" has been updated.` });
      } else {
        await addEvent(formData);
        addToast({ type: 'success', title: 'Event Created! 🎉', message: `"${formData.name}" is now live.` });
      }
      setIsDone(true);
      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err?.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="craft-form-done-state">
        <span className="done-icon-box">✓</span>
        <h3 className="done-title">{isEdit ? 'Event Updated!' : 'Event Created!'}</h3>
        <p className="done-sub">Your event is now live on VibeVenue.</p>
      </div>
    );
  }

  return (
    // ⚠️  INTENTIONALLY a div, NOT a form — using a <form> caused Framer Motion's
    // motion.button to lose type="button", defaulting every button to type="submit".
    // All submission is handled explicitly via onClick handlers.
    <div className="craft-event-form">
      {/* Step Indicator */}
      <div className="form-steps-indicator" role="tablist">
        {STEPS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            className={`step-tab ${step === idx ? 'step-tab-active' : ''} ${step > idx ? 'step-tab-done' : ''}`}
            onClick={() => { if (idx < step) setStep(idx); }}
            disabled={idx > step}
          >
            <span className="step-tab-pill font-mono">{step > idx ? '✓' : idx + 1}</span>
            <span className="step-tab-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step Panels */}
      <div className="form-step-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.16 }}
            className="form-step-panel"
          >
            {/* ── STEP 0: Event Info ── */}
            {step === 0 && (
              <div className="form-grid-fields">
                {/* Banner Upload */}
                <div className="form-field-group">
                  <label className="craft-label">Event Banner</label>
                  <div
                    className="upload-dropzone"
                    onClick={() => bannerRef.current?.click()}
                    style={formData.bannerBase64 ? { backgroundImage: `url(${formData.bannerBase64})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!formData.bannerBase64 && (
                      <>
                        <span className="upload-icon">🖼</span>
                        <span className="upload-hint">Click to upload banner image</span>
                        <span className="upload-sub">PNG, JPG, WEBP — recommended 1200×400</span>
                      </>
                    )}
                    {formData.bannerBase64 && (
                      <span className="upload-overlay-label">✓ {formData.bannerName}</span>
                    )}
                  </div>
                  <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
                </div>

                {/* Logo + Title row */}
                <div className="form-row-logo-title">
                  <div className="form-field-group" style={{ width: 90, flexShrink: 0 }}>
                    <label className="craft-label">Logo</label>
                    <div
                      className="upload-logo-box"
                      onClick={() => logoRef.current?.click()}
                      style={formData.logoBase64 ? { backgroundImage: `url(${formData.logoBase64})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    >
                      {!formData.logoBase64 && <span style={{ fontSize: '1.5rem' }}>+</span>}
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  </div>

                  <div className="form-field-group" style={{ flex: 1 }}>
                    <label htmlFor="evt-name" className="craft-label">Event Name <span className="req-star">*</span></label>
                    <input
                      id="evt-name"
                      type="text"
                      className={`craft-input ${errors.name ? 'input-error' : ''}`}
                      placeholder="e.g. HackVerse 2026"
                      value={formData.name}
                      onChange={e => set('name', e.target.value)}
                      autoFocus
                    />
                    {errors.name && <p className="field-error-text">{errors.name}</p>}
                  </div>
                </div>

                {/* Tagline */}
                <div className="form-field-group">
                  <label htmlFor="evt-tagline" className="craft-label">Tagline / One-liner</label>
                  <input
                    id="evt-tagline"
                    type="text"
                    className="craft-input"
                    placeholder="A short exciting description for the event card"
                    value={formData.tagline}
                    onChange={e => set('tagline', e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="form-field-group">
                  <label htmlFor="evt-desc" className="craft-label">Full Description <span className="req-star">*</span></label>
                  <textarea
                    id="evt-desc"
                    className={`craft-input craft-textarea ${errors.description ? 'input-error' : ''}`}
                    rows={4}
                    placeholder="Tell participants what this event is about, what they'll learn, who should attend..."
                    value={formData.description}
                    onChange={e => set('description', e.target.value)}
                  />
                  {errors.description && <p className="field-error-text">{errors.description}</p>}
                </div>

                {/* Event Mode: Online / Offline */}
                <div className="form-field-group">
                  <label className="craft-label">Event Mode</label>
                  <div className="mode-toggle-row">
                    <button
                      type="button"
                      className={`mode-toggle-btn ${!formData.isOnline ? 'mode-toggle-active' : ''}`}
                      onClick={() => set('isOnline', false)}
                    >
                      📍 In-Person
                    </button>
                    <button
                      type="button"
                      className={`mode-toggle-btn ${formData.isOnline ? 'mode-toggle-active' : ''}`}
                      onClick={() => set('isOnline', true)}
                    >
                      🌐 Online
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="form-field-group">
                  <label className="craft-label">Category <span className="req-star">*</span></label>
                  <div className="form-domain-grid">
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`domain-tile ${formData.category === cat.id ? 'domain-tile-selected' : ''}`}
                        onClick={() => set('category', cat.id)}
                      >
                        <span className="domain-tile-icon">{cat.icon}</span>
                        <span className="domain-tile-lbl">{cat.label}</span>
                      </button>
                    ))}
                    {formData.customCategory && (
                      <button
                        type="button"
                        className={`domain-tile ${formData.category === formData.customCategory.id ? 'domain-tile-selected' : ''}`}
                        onClick={() => set('category', formData.customCategory.id)}
                      >
                        <span className="domain-tile-icon">{formData.customCategory.icon}</span>
                        <span className="domain-tile-lbl">{formData.customCategory.label}</span>
                      </button>
                    )}
                    {!customCatInput.show && (
                      <button
                        type="button"
                        className="domain-tile domain-tile-add"
                        onClick={() => setCustomCatInput(p => ({ ...p, show: true }))}
                      >
                        <span className="domain-tile-icon">+</span>
                        <span className="domain-tile-lbl">Custom</span>
                      </button>
                    )}
                  </div>
                  {errors.category && <p className="field-error-text">{errors.category}</p>}

                  {customCatInput.show && (
                    <div className="custom-cat-inline">
                      <input
                        type="text"
                        className="craft-input"
                        placeholder="Category name"
                        value={customCatInput.label}
                        onChange={e => setCustomCatInput(p => ({ ...p, label: e.target.value }))}
                      />
                      <input
                        type="text"
                        className="craft-input"
                        placeholder="Emoji icon"
                        maxLength={2}
                        style={{ width: 70 }}
                        value={customCatInput.emoji}
                        onChange={e => setCustomCatInput(p => ({ ...p, emoji: e.target.value }))}
                      />
                      <Button type="button" variant="primary" size="sm" onClick={handleAddCustomCategory}>Add</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCustomCatInput(p => ({ ...p, show: false }))}>Cancel</Button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="form-field-group">
                  <label htmlFor="evt-tags" className="craft-label">Tags (comma-separated)</label>
                  <input
                    id="evt-tags"
                    type="text"
                    className="craft-input font-mono"
                    placeholder="react, hackathon, beginners-welcome"
                    value={formData.tags}
                    onChange={e => set('tags', e.target.value)}
                  />
                </div>

                {/* Open To / Eligibility */}
                <div className="form-field-group">
                  <div className="form-label-row">
                    <label className="craft-label">Open To / Eligibility</label>
                    <span className="form-field-hint font-mono">Select target batch(es)</span>
                  </div>
                  <div className="open-to-pills-row">
                    {[
                      { id: 'All', label: '🌟 All Students' },
                      { id: '1st Year', label: '1st Year' },
                      { id: '2nd Year', label: '2nd Year' },
                      { id: '3rd Year', label: '3rd Year' },
                      { id: '4th Year', label: '4th Year' },
                      { id: 'Postgraduate', label: 'Postgraduate' },
                    ].map((opt) => {
                      const isSelected = (formData.openTo || ['All']).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`open-to-pill-btn ${isSelected ? 'open-to-pill-active' : ''}`}
                          onClick={() => toggleOpenToYear(opt.id)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="field-hint-text font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {(formData.openTo || []).includes('All')
                      ? '✓ Open to all registered students across all academic years'
                      : `🔒 Visible only to students in: ${(formData.openTo || []).join(', ')}`}
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 1: Schedule & Venue ── */}
            {step === 1 && (
              <div className="form-grid-fields">
                <div className="form-row-2">
                  <div className="form-field-group">
                    <label htmlFor="evt-start-date" className="craft-label">Start Date <span className="req-star">*</span></label>
                    <input
                      id="evt-start-date"
                      type="date"
                      className={`craft-input font-mono ${errors.startDate ? 'input-error' : ''}`}
                      value={formData.startDate}
                      onChange={e => set('startDate', e.target.value)}
                    />
                    {errors.startDate && <p className="field-error-text">{errors.startDate}</p>}
                  </div>
                  <div className="form-field-group">
                    <label htmlFor="evt-start-time" className="craft-label">Start Time <span className="req-star">*</span></label>
                    <input
                      id="evt-start-time"
                      type="time"
                      className={`craft-input font-mono ${errors.startTime ? 'input-error' : ''}`}
                      value={formData.startTime}
                      onChange={e => set('startTime', e.target.value)}
                    />
                    {errors.startTime && <p className="field-error-text">{errors.startTime}</p>}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field-group">
                    <label htmlFor="evt-end-date" className="craft-label">End Date</label>
                    <input
                      id="evt-end-date"
                      type="date"
                      className="craft-input font-mono"
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={e => set('endDate', e.target.value)}
                    />
                  </div>
                  <div className="form-field-group">
                    <label htmlFor="evt-end-time" className="craft-label">End Time</label>
                    <input
                      id="evt-end-time"
                      type="time"
                      className="craft-input font-mono"
                      value={formData.endTime}
                      onChange={e => set('endTime', e.target.value)}
                    />
                  </div>
                </div>

                {formData.isOnline ? (
                  <div className="form-field-group">
                    <label htmlFor="evt-meeting" className="craft-label">Meeting Link / Platform</label>
                    <input
                      id="evt-meeting"
                      type="url"
                      className="craft-input"
                      placeholder="https://meet.google.com/... or Zoom link"
                      value={formData.meetingLink}
                      onChange={e => set('meetingLink', e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-field-group">
                    <label htmlFor="evt-venue" className="craft-label">Venue / Hall <span className="req-star">*</span></label>
                    <input
                      id="evt-venue"
                      type="text"
                      className={`craft-input ${errors.venue ? 'input-error' : ''}`}
                      placeholder="e.g. APJ Abdul Kalam Auditorium, Block A"
                      value={formData.venue}
                      onChange={e => set('venue', e.target.value)}
                    />
                    {errors.venue && <p className="field-error-text">{errors.venue}</p>}
                  </div>
                )}

                {/* Contact Persons */}
                <div className="form-field-group">
                  <div className="form-label-row">
                    <label className="craft-label">Student Coordinators & Contacts</label>
                    <Button type="button" variant="ghost" size="sm" onClick={addContact}>+ Add Coordinator</Button>
                  </div>
                  <div className="contacts-list">
                    {formData.contacts.map((contact, idx) => (
                      <div key={idx} className="contact-card">
                        <div className="contact-card-header">
                          <span className="contact-card-num font-mono">Coordinator {idx + 1}</span>
                          {idx > 0 && (
                            <button type="button" className="contact-remove-btn" onClick={() => removeContact(idx)}>✕</button>
                          )}
                        </div>
                        <div className="form-row-2">
                          <input
                            type="text"
                            className="craft-input"
                            placeholder="Coordinator Name"
                            value={contact.name}
                            onChange={e => updateContact(idx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="craft-input"
                            placeholder="Role (e.g. Lead Coordinator, Tech Head)"
                            value={contact.role}
                            onChange={e => updateContact(idx, 'role', e.target.value)}
                          />
                        </div>
                        <div className="form-row-2">
                          <input
                            type="tel"
                            className="craft-input font-mono"
                            placeholder="Phone"
                            value={contact.phone}
                            onChange={e => updateContact(idx, 'phone', e.target.value)}
                          />
                          <input
                            type="email"
                            className="craft-input font-mono"
                            placeholder="Email"
                            value={contact.email}
                            onChange={e => updateContact(idx, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Registration & Pricing ── */}
            {step === 2 && (
              <div className="form-grid-fields">
                {/* Registration Type */}
                <div className="form-field-group">
                  <label className="craft-label">Registration Type</label>
                  <div className="reg-type-row">
                    {[
                      { val: 'individual', label: '👤 Individual Only' },
                      { val: 'group',      label: '👥 Group Only' },
                      { val: 'both',       label: '👤👥 Individual + Group' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        className={`reg-type-btn ${formData.registrationType === opt.val ? 'reg-type-btn-active' : ''}`}
                        onClick={() => set('registrationType', opt.val)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paid / Free Toggle */}
                <div className="form-field-group">
                  <label className="craft-label">Pricing Model</label>
                  <div className="mode-toggle-row">
                    <button type="button" className={`mode-toggle-btn ${!formData.isPaid ? 'mode-toggle-active' : ''}`} onClick={() => set('isPaid', false)}>✓ Free</button>
                    <button type="button" className={`mode-toggle-btn ${formData.isPaid ? 'mode-toggle-active' : ''}`} onClick={() => set('isPaid', true)}>₹ Paid</button>
                  </div>
                </div>

                {formData.isPaid && (
                  <>
                    {/* Pricing Structure Type */}
                    <div className="form-field-group">
                      <label className="craft-label">Pricing Structure</label>
                      <div className="mode-toggle-row">
                        <button
                          type="button"
                          className={`mode-toggle-btn ${formData.pricingType === 'flat' ? 'mode-toggle-active' : ''}`}
                          onClick={() => set('pricingType', 'flat')}
                        >
                          🏷️ Flat Price
                        </button>
                        <button
                          type="button"
                          className={`mode-toggle-btn ${formData.pricingType === 'tiered' ? 'mode-toggle-active' : ''}`}
                          onClick={() => {
                            set('pricingType', 'tiered');
                            if (!formData.pricingTiers?.length) applyTierPreset('sctians');
                          }}
                        >
                          📊 Dynamic Pricing
                        </button>
                      </div>
                    </div>

                    {/* Flat Pricing Inputs */}
                    {formData.pricingType === 'flat' && (
                      <div className="form-row-2">
                        {(formData.registrationType === 'individual' || formData.registrationType === 'both') && (
                          <div className="form-field-group">
                            <label htmlFor="individual-price" className="craft-label">Individual Price (₹)</label>
                            <input id="individual-price" type="number" min="0" className="craft-input font-mono" placeholder="e.g. 200" value={formData.individualPrice} onChange={e => set('individualPrice', e.target.value)} />
                          </div>
                        )}
                        {(formData.registrationType === 'group' || formData.registrationType === 'both') && (
                          <div className="form-field-group">
                            <label htmlFor="group-price" className="craft-label">Group Price (₹ per team)</label>
                            <input id="group-price" type="number" min="0" className="craft-input font-mono" placeholder="e.g. 500" value={formData.groupPrice} onChange={e => set('groupPrice', e.target.value)} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dynamic Pricing Tiers Builder */}
                    {formData.pricingType === 'tiered' && (
                      <div className="form-field-group">
                        <div className="form-label-row">
                          <label className="craft-label">Dynamic Pricing Tiers</label>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSaveTplModal(!showSaveTplModal)}>
                              💾 Save as Template
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={addPricingTier}>
                              + Add Tier
                            </Button>
                          </div>
                        </div>

                        {/* Save Custom Template Input Box */}
                        {showSaveTplModal && (
                          <div className="save-template-box">
                            <span className="save-template-title font-mono">Save Current Configuration as Template:</span>
                            <div className="save-template-row">
                              <input
                                type="text"
                                className="craft-input"
                                placeholder="Template Name (e.g. Hackathon Tiers, Fest Special)"
                                value={newTplName}
                                onChange={e => setNewTplName(e.target.value)}
                                autoFocus
                              />
                              <Button type="button" variant="primary" size="sm" onClick={handleSaveCustomTemplate}>
                                Save
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setShowSaveTplModal(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Quick Presets */}
                        <div className="tier-presets-row">
                          <span className="tier-presets-label font-mono">Templates:</span>
                          <button type="button" className="tier-preset-btn" onClick={() => applyTierPreset('sctians')}>
                            + SCTians / Non-SCTians
                          </button>
                          <button type="button" className="tier-preset-btn" onClick={() => applyTierPreset('delegates')}>
                            + Early Bird / Regular / VIP
                          </button>

                          {/* Custom Saved Templates */}
                          {savedTemplates.map((tpl, i) => (
                            <div key={tpl.id || i} className="tier-preset-saved-pill">
                              <button
                                type="button"
                                className="tier-preset-btn tier-preset-custom-btn"
                                onClick={() => applyCustomTemplate(tpl.tiers)}
                                title={`Apply "${tpl.name}" (${tpl.tiers?.length || 0} tiers)`}
                              >
                                ⭐ {tpl.name}
                              </button>
                              <button
                                type="button"
                                className="tier-preset-del-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSavedTemplate(i);
                                }}
                                title="Delete saved template"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="pricing-tiers-list">
                          {formData.pricingTiers.map((tier, idx) => (
                            <div key={tier.id || idx} className="tier-builder-card">
                              <div className="tier-builder-main-row">
                                <input
                                  type="text"
                                  className="craft-input tier-name-input"
                                  placeholder="Category Name (e.g. SCTians / External Delegations)"
                                  value={tier.label}
                                  onChange={e => updatePricingTier(idx, 'label', e.target.value)}
                                />
                                <div className="tier-price-wrapper">
                                  <span className="tier-currency-prefix">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    className="craft-input font-mono tier-price-input"
                                    placeholder="600"
                                    value={tier.price}
                                    onChange={e => updatePricingTier(idx, 'price', e.target.value)}
                                  />
                                </div>
                                <label className="tier-proof-toggle">
                                  <input
                                    type="checkbox"
                                    checked={tier.requiresProof}
                                    onChange={e => updatePricingTier(idx, 'requiresProof', e.target.checked)}
                                  />
                                  <span>Verify ID</span>
                                </label>
                                {formData.pricingTiers.length > 1 && (
                                  <button type="button" className="contact-remove-btn" onClick={() => removePricingTier(idx)}>✕</button>
                                )}
                              </div>

                              {tier.requiresProof && (
                                <div className="tier-proof-prompt-row">
                                  <span className="tier-proof-icon">🔒</span>
                                  <input
                                    type="text"
                                    className="craft-input tier-proof-input"
                                    placeholder="Proof Prompt for Student (e.g. College ID / Student ID)"
                                    value={tier.proofLabel}
                                    onChange={e => updatePricingTier(idx, 'proofLabel', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Group size */}
                {(formData.registrationType === 'group' || formData.registrationType === 'both') && (
                  <div className="form-row-2">
                    <div className="form-field-group">
                      <label htmlFor="group-min" className="craft-label">Min Team Size</label>
                      <input id="group-min" type="number" min="2" className="craft-input font-mono" value={formData.groupMinSize} onChange={e => set('groupMinSize', e.target.value)} />
                    </div>
                    <div className="form-field-group">
                      <label htmlFor="group-max" className="craft-label">Max Team Size</label>
                      <input id="group-max" type="number" min="2" className="craft-input font-mono" value={formData.groupMaxSize} onChange={e => set('groupMaxSize', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* 📋 Capacity, Waiting List & Cancellation Policies */}
                <div className="form-field-group" style={{ background: 'var(--surface-inset)', padding: '18px 20px', borderRadius: 'var(--radius-xl)', border: '1.5px solid rgba(99, 102, 241, 0.25)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 className="craft-label" style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👥</span> Capacity, Waiting List & Policy Architecture
                    </h4>
                    <p className="field-hint-text font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                      Configure attendee seat quotas, automated waitlist pipelines, and cancellation refund terms.
                    </p>
                  </div>

                  {/* 1. Capacity Mode Selector (Limited vs Unlimited) */}
                  <div className="capacity-mode-segmented">
                    <button
                      type="button"
                      className={`capacity-mode-btn ${formData.hasCapacityLimit ? 'active' : ''}`}
                      onClick={() => set('hasCapacityLimit', true)}
                    >
                      <span className="mode-icon">🔒</span>
                      <span>Limited Capacity</span>
                    </button>
                    <button
                      type="button"
                      className={`capacity-mode-btn ${!formData.hasCapacityLimit ? 'active' : ''}`}
                      onClick={() => set('hasCapacityLimit', false)}
                    >
                      <span className="mode-icon">♾️</span>
                      <span>Unlimited Admission</span>
                    </button>
                  </div>

                  {/* 2. Limited Capacity Inputs & Quick Stepper (Only shown when Limited) */}
                  <AnimatePresence>
                    {formData.hasCapacityLimit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}
                      >
                        {/* Confirmed Seats Limit */}
                        <div style={{ padding: '14px 16px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                          <div className="form-label-row">
                            <label htmlFor="evt-max-capacity" className="craft-label" style={{ fontSize: '0.8125rem' }}>
                              Confirmed Seat Capacity
                            </label>
                            <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700 }}>
                              🎟️ {formData.maxParticipants || '0'} Confirmed Seats
                            </span>
                          </div>
                          <input
                            id="evt-max-capacity"
                            type="number"
                            min="1"
                            className="craft-input font-mono"
                            placeholder="e.g. 100"
                            value={formData.maxParticipants}
                            onChange={e => set('maxParticipants', e.target.value)}
                          />
                          <div className="capacity-stepper-pills">
                            <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginRight: 2 }}>Quick:</span>
                            {['30', '50', '100', '150', '250', '500'].map(val => (
                              <button
                                key={val}
                                type="button"
                                className={`capacity-stepper-btn ${formData.maxParticipants === val ? 'selected' : ''}`}
                                onClick={() => set('maxParticipants', val)}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Waiting List Configuration (Disappears when Unlimited!) */}
                        <div style={{ padding: '14px 16px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                          <div className="form-label-row">
                            <div>
                              <label className="craft-label" style={{ fontSize: '0.8125rem', marginBottom: 2 }}>
                                Allow Waiting List Queue 📋
                              </label>
                              <p className="field-hint-text font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
                                When regular seats fill, overflow delegates queue on the waitlist and auto-upgrade upon cancellations.
                              </p>
                            </div>
                            <label className="toggle-switch-label" style={{ flexShrink: 0 }}>
                              <input
                                type="checkbox"
                                checked={formData.enableWaitlist}
                                onChange={e => set('enableWaitlist', e.target.checked)}
                              />
                              <span className="toggle-switch-track" />
                              <span className="toggle-switch-text font-mono">{formData.enableWaitlist ? 'Enabled' : 'Disabled'}</span>
                            </label>
                          </div>

                          {formData.enableWaitlist && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border-default)' }}>
                              <div className="form-label-row">
                                <label htmlFor="evt-waitlist-capacity" className="craft-label" style={{ fontSize: '0.75rem' }}>
                                  Max Waitlist Queue Slots
                                </label>
                                <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#6366F1', fontWeight: 700 }}>
                                  📋 {formData.waitlistCapacity || '0'} Waitlist Slots
                                </span>
                              </div>
                              <input
                                id="evt-waitlist-capacity"
                                type="number"
                                min="1"
                                className="craft-input font-mono"
                                placeholder="Max waitlist queue (e.g. 25)"
                                value={formData.waitlistCapacity}
                                onChange={e => set('waitlistCapacity', e.target.value)}
                              />
                              <div className="capacity-stepper-pills">
                                <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginRight: 2 }}>Preset:</span>
                                {['5', '10', '15', '25', '50'].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    className={`capacity-stepper-btn ${formData.waitlistCapacity === val ? 'selected' : ''}`}
                                    onClick={() => set('waitlistCapacity', val)}
                                  >
                                    +{val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 3. Live Architecture Status Visualization (Total Allowed Registrations Overview) */}
                  {formData.hasCapacityLimit ? (
                    (() => {
                      const confirmed = parseInt(formData.maxParticipants, 10) || 0;
                      const waitlist = formData.enableWaitlist ? (parseInt(formData.waitlistCapacity, 10) || 0) : 0;
                      const total = confirmed + waitlist;
                      return (
                        <div className="total-registrations-card font-mono">
                          <div className="total-reg-header">
                            <div className="total-reg-main">
                              <span className="total-reg-kicker">📊 REGISTRATION CAPACITY OVERVIEW</span>
                              <div className="total-reg-number-row">
                                <span className="total-reg-title-text">Total Allowed Registrations:</span>
                                <span className="total-reg-highlight">{total} Max Seats</span>
                              </div>
                            </div>
                            <div className="total-reg-pills-row">
                              <span className="reg-badge confirmed">
                                🎟️ {confirmed} Confirmed
                              </span>
                              {formData.enableWaitlist ? (
                                <span className="reg-badge waitlist">
                                  📋 {waitlist} Waitlist
                                </span>
                              ) : (
                                <span className="reg-badge disabled">
                                  🚫 Waitlist Disabled
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="total-reg-summary-bar">
                            <span className="total-reg-bullet" />
                            <span className="total-reg-summary-text">
                              {formData.enableWaitlist
                                ? `Accepting ${confirmed} confirmed seats + ${waitlist} waitlisted registrations.`
                                : `Accepting up to ${confirmed} confirmed seats (waitlist queue is disabled).`}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="total-registrations-card unlimited font-mono">
                      <div className="total-reg-header">
                        <div className="total-reg-main">
                          <span className="total-reg-kicker">♾️ OPEN ADMISSION PIPELINE</span>
                          <div className="total-reg-number-row">
                            <span className="total-reg-title-text">Total Allowed Registrations:</span>
                            <span className="total-reg-highlight text-cyan">Unlimited</span>
                          </div>
                        </div>
                        <div className="total-reg-pills-row">
                          <span className="reg-badge unlimited">
                            ✨ Open Entry (No Registration Cap)
                          </span>
                        </div>
                      </div>
                      <div className="total-reg-summary-bar">
                        <span className="total-reg-bullet cyan" />
                        <span className="total-reg-summary-text">
                          Delegates can register freely with instant confirmed passes. No capacity cap or waitlist queue.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 4. Spacious Cancellation Cutoff & Policy Editor */}
                  <div className="policy-card-container">
                    <div>
                      <h5 className="craft-label" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛡️</span> Self-Cancellation Window & Refund Policy
                      </h5>
                      <p className="field-hint-text font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        Empower participants to self-revoke passes to automatically promote waitlisted peers.
                      </p>
                    </div>

                    {/* Accept Cancellations Until */}
                    <div>
                      <div className="form-label-row">
                        <label htmlFor="evt-cancel-until" className="craft-label" style={{ fontSize: '0.8125rem' }}>
                          Accept Cancellations Until ⏱️
                        </label>
                        {formData.acceptCancellationsUntil && (
                          <button
                            type="button"
                            className="craft-btn-text font-mono"
                            style={{ fontSize: '0.6875rem', color: 'var(--accent-rose)' }}
                            onClick={() => set('acceptCancellationsUntil', '')}
                          >
                            Clear Cutoff
                          </button>
                        )}
                      </div>
                      <input
                        id="evt-cancel-until"
                        type="datetime-local"
                        className="craft-input font-mono"
                        value={formData.acceptCancellationsUntil}
                        onChange={e => set('acceptCancellationsUntil', e.target.value)}
                      />
                      <div className="preset-time-row">
                        <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginRight: 2 }}>Quick Presets:</span>
                        <button type="button" className="preset-time-btn" onClick={() => setCancellationPreset(24)}>
                          ⚡ 24h Before Start
                        </button>
                        <button type="button" className="preset-time-btn" onClick={() => setCancellationPreset(48)}>
                          ⏱️ 48h Before Start
                        </button>
                        <button type="button" className="preset-time-btn" onClick={() => setCancellationPreset(0)}>
                          📍 At Kickoff
                        </button>
                      </div>
                    </div>

                    {/* Cancellation & Refund Policy Editor */}
                    <div style={{ width: '100%' }}>
                      <div className="form-label-row">
                        <label htmlFor="evt-cancel-policy" className="craft-label" style={{ fontSize: '0.8125rem' }}>
                          Cancellation & Refund Policy Terms 📝
                        </label>
                        <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {(formData.cancellationPolicy || '').length} characters
                        </span>
                      </div>
                      <textarea
                        id="evt-cancel-policy"
                        rows={4}
                        className="craft-input craft-textarea cancellation-textarea font-mono"
                        placeholder="Detail refund conditions, cutoff timelines, and seat release policies shown to participants..."
                        value={formData.cancellationPolicy}
                        onChange={e => set('cancellationPolicy', e.target.value)}
                      />
                      
                      {/* One-Tap Policy Template Pills */}
                      <div style={{ marginTop: 8 }}>
                        <span className="font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                          Load Policy Template:
                        </span>
                        <div className="policy-template-pills">
                          {POLICY_TEMPLATES.map((tmpl) => (
                            <button
                              key={tmpl.label}
                              type="button"
                              className="policy-template-btn"
                              onClick={() => applyPolicyTemplate(tmpl.text)}
                            >
                              {tmpl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⏱️ Registration Deadlines & Spot Registration Access */}
                <div className="form-field-group" style={{ background: 'var(--surface-inset)', padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <label className="craft-label" style={{ marginBottom: 8, color: 'var(--text-primary)' }}>⏱️ Registration Windows & Spot Access</label>
                  
                  {/* Allow registrations until */}
                  <div className="form-field-group" style={{ marginBottom: 12 }}>
                    <label htmlFor="evt-reg-until" className="craft-label" style={{ fontSize: '0.8125rem' }}>Allow Online Registrations Until</label>
                    <input
                      id="evt-reg-until"
                      type="datetime-local"
                      className="craft-input font-mono"
                      value={formData.allowRegistrationsUntil}
                      onChange={e => set('allowRegistrationsUntil', e.target.value)}
                    />
                    <p className="field-hint-text font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      Defaults to event start time if left empty. Once passed, online registration closes.
                    </p>
                  </div>

                  {/* Enable spot registration toggle */}
                  <div className="form-field-group" style={{ marginBottom: 0 }}>
                    <div className="form-label-row">
                      <label className="craft-label" style={{ fontSize: '0.8125rem' }}>Enable Spot Registrations ⚡</label>
                      <label className="toggle-switch-label">
                        <input
                          type="checkbox"
                          checked={formData.enableSpotRegistrations}
                          onChange={e => set('enableSpotRegistrations', e.target.checked)}
                        />
                        <span className="toggle-switch-track" />
                        <span className="toggle-switch-text font-mono">{formData.enableSpotRegistrations ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>
                    <p className="field-hint-text font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Allows on-desk and walk-in spot passes at the venue after regular online registration closes.
                    </p>

                    {formData.enableSpotRegistrations && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-default)' }}>
                        <label htmlFor="evt-spot-until" className="craft-label" style={{ fontSize: '0.8125rem' }}>Allow Spot Registrations Until</label>
                        <input
                          id="evt-spot-until"
                          type="datetime-local"
                          className="craft-input font-mono"
                          value={formData.allowSpotRegistrationsUntil}
                          onChange={e => set('allowSpotRegistrationsUntil', e.target.value)}
                        />
                        <p className="field-hint-text font-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          Defaults to event end time. Spot passes close permanently after this timestamp.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add-ons */}
                <div className="form-field-group">
                  <div className="form-label-row">
                    <label className="craft-label">Add-ons / Extras</label>
                    <Button type="button" variant="ghost" size="sm" onClick={addAddOn}>+ Add Item</Button>
                  </div>
                  {formData.addOns.length === 0 && (
                    <p className="form-helper-text">Add optional or required extras (T-shirt, workshop kit, etc.)</p>
                  )}
                  {formData.addOns.map((addon, idx) => (
                    <div key={idx} className="addon-row">
                      <input type="text" className="craft-input" placeholder="Add-on name" value={addon.label} onChange={e => updateAddOn(idx, 'label', e.target.value)} />
                      <input type="number" min="0" className="craft-input font-mono" style={{ width: 110 }} placeholder="Price ₹" value={addon.price} onChange={e => updateAddOn(idx, 'price', e.target.value)} />
                      <label className="addon-required-chk">
                        <input type="checkbox" checked={addon.required} onChange={e => updateAddOn(idx, 'required', e.target.checked)} />
                        Required
                      </label>
                      <button type="button" className="contact-remove-btn" onClick={() => removeAddOn(idx)}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Amenities */}
                <div className="form-field-group">
                  <label className="craft-label">Amenities Provided</label>
                  <div className="amenities-grid">
                    {[
                      { key: 'refreshments',  label: '🍵 Refreshments' },
                      { key: 'accommodation', label: '🏠 Accommodation' },
                      { key: 'certificate',   label: '📜 Certificate' },
                      { key: 'wifi',          label: '📶 Wi-Fi' },
                    ].map(a => (
                      <label key={a.key} className={`amenity-chip ${formData.amenities[a.key] ? 'amenity-chip-active' : ''}`}>
                        <input type="checkbox" checked={formData.amenities[a.key]} onChange={e => setNested('amenities', a.key, e.target.checked)} style={{ display: 'none' }} />
                        {a.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment details (only if paid) */}
                {formData.isPaid && (
                  <>
                    <div className="form-field-group">
                      <label htmlFor="upi-id" className="craft-label">UPI ID <span className="req-star">*</span></label>
                      <input
                        id="upi-id"
                        type="text"
                        className={`craft-input font-mono ${errors.upiId ? 'input-error' : ''}`}
                        placeholder="adityenh@oksbi"
                        value={formData.upiId}
                        onChange={e => set('upiId', e.target.value)}
                      />
                      {errors.upiId && <p className="field-error-text">{errors.upiId}</p>}
                    </div>

                    <div className="form-field-group">
                      <div className="form-label-row">
                        <label className="craft-label">Bank Transfer (Optional)</label>
                        <label className="toggle-switch-label">
                          <input type="checkbox" checked={formData.hasBankTransfer} onChange={e => set('hasBankTransfer', e.target.checked)} />
                          <span className="toggle-switch-track" />
                          <span className="toggle-switch-text">Enable</span>
                        </label>
                      </div>
                      {formData.hasBankTransfer && (
                        <div className="form-row-2">
                          <input type="text" className="craft-input font-mono" placeholder="Account Number" value={formData.accountNo} onChange={e => set('accountNo', e.target.value)} />
                          <input type="text" className="craft-input font-mono" placeholder="IFSC Code" value={formData.ifscCode} onChange={e => set('ifscCode', e.target.value)} />
                        </div>
                      )}
                    </div>

                    <div className="form-field-group">
                      <label className="craft-label">Payment Proof Required</label>
                      <div className="reg-type-row">
                        {[
                          { val: 'screenshot', label: '📷 Screenshot' },
                          { val: 'txnId',      label: '#️⃣ Transaction ID' },
                          { val: 'both',       label: '📷 + #️⃣ Both' },
                        ].map(opt => (
                          <button key={opt.val} type="button"
                            className={`reg-type-btn ${formData.paymentVerification === opt.val ? 'reg-type-btn-active' : ''}`}
                            onClick={() => set('paymentVerification', opt.val)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* WhatsApp Group */}
                <div className="form-field-group">
                  <label htmlFor="wa-link" className="craft-label">WhatsApp Group Link <span className="craft-label-hint">(shown after registration)</span></label>
                  <input id="wa-link" type="url" className="craft-input" placeholder="https://chat.whatsapp.com/..." value={formData.whatsappLink} onChange={e => set('whatsappLink', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── STEP 3: Resources & Comms ── */}
            {step === 3 && (
              <div className="form-grid-fields">
                {/* Pre-registration resources */}
                <div className="form-field-group">
                  <div className="form-label-row">
                    <label className="craft-label">Pre-Registration Links <span className="craft-label-hint">(visible before registration)</span></label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addLink('preLinks')}>+ Add Link</Button>
                  </div>
                  <p className="form-helper-text">Add your event website, social media handles, or promotional posts.</p>
                  {formData.preLinks.map((link, idx) => (
                    <div key={idx} className="link-row">
                      <input type="text" className="craft-input" placeholder="Label (e.g. Event Website)" value={link.label} onChange={e => updateLink('preLinks', idx, 'label', e.target.value)} />
                      <input type="url" className="craft-input" placeholder="https://..." value={link.url} onChange={e => updateLink('preLinks', idx, 'url', e.target.value)} />
                      {idx > 0 && <button type="button" className="contact-remove-btn" onClick={() => removeLink('preLinks', idx)}>✕</button>}
                    </div>
                  ))}
                </div>

                {/* Post-registration resources */}
                <div className="form-field-group">
                  <div className="form-label-row">
                    <label className="craft-label">Post-Registration Links <span className="craft-label-hint">(shown after successful registration)</span></label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addLink('postLinks')}>+ Add Link</Button>
                  </div>
                  <p className="form-helper-text">Pre-course material, reading resources, or setup guides.</p>
                  {formData.postLinks.map((link, idx) => (
                    <div key={idx} className="link-row">
                      <input type="text" className="craft-input" placeholder="Label (e.g. Pre-course Material)" value={link.label} onChange={e => updateLink('postLinks', idx, 'label', e.target.value)} />
                      <input type="url" className="craft-input" placeholder="https://..." value={link.url} onChange={e => updateLink('postLinks', idx, 'url', e.target.value)} />
                      {idx > 0 && <button type="button" className="contact-remove-btn" onClick={() => removeLink('postLinks', idx)}>✕</button>}
                    </div>
                  ))}
                </div>

                {/* Confirmation message */}
                <div className="form-field-group">
                  <label htmlFor="conf-msg" className="craft-label">Confirmation Message</label>
                  <textarea
                    id="conf-msg"
                    className="craft-input craft-textarea"
                    rows={3}
                    placeholder="Message shown to students after they register..."
                    value={formData.confirmationMessage}
                    onChange={e => set('confirmationMessage', e.target.value)}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="form-actions-bar">
        <Button variant="ghost" size="sm" type="button" onClick={step === 0 ? onClose : handleBack}>
          {step === 0 ? 'Cancel' : '← Back'}
        </Button>
        <div className="form-right-actions">
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="sm" type="button" onClick={handleNext}>
              Continue →
            </Button>
          ) : (
            <Button variant="primary" size="sm" loading={isSubmitting} type="button" onClick={handleSubmit}>
              {isEdit ? 'Save Changes' : '🎉 Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventForm;
