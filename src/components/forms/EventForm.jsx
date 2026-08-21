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
  individualPrice: '',
  groupPrice: '',
  groupMinSize: '2',
  groupMaxSize: '5',
  hasCapacityLimit: false,
  maxParticipants: '',
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

const EventForm = ({ event = null, onClose }) => {
  const isEdit = !!event;
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(
    isEdit
      ? {
          ...freshData(),
          ...event,
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

  const setNested = (key, subKey, val) => {
    setFormData(prev => ({ ...prev, [key]: { ...prev[key], [subKey]: val } }));
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
                    <label className="craft-label">Contact Persons</label>
                    <Button type="button" variant="ghost" size="sm" onClick={addContact}>+ Add Contact</Button>
                  </div>
                  <div className="contacts-list">
                    {formData.contacts.map((contact, idx) => (
                      <div key={idx} className="contact-card">
                        <div className="contact-card-header">
                          <span className="contact-card-num font-mono">Contact {idx + 1}</span>
                          {idx > 0 && (
                            <button type="button" className="contact-remove-btn" onClick={() => removeContact(idx)}>✕</button>
                          )}
                        </div>
                        <div className="form-row-2">
                          <input
                            type="text"
                            className="craft-input"
                            placeholder="Name"
                            value={contact.name}
                            onChange={e => updateContact(idx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="craft-input"
                            placeholder="Role / Designation"
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
                  <label className="craft-label">Pricing</label>
                  <div className="mode-toggle-row">
                    <button type="button" className={`mode-toggle-btn ${!formData.isPaid ? 'mode-toggle-active' : ''}`} onClick={() => set('isPaid', false)}>✓ Free</button>
                    <button type="button" className={`mode-toggle-btn ${formData.isPaid ? 'mode-toggle-active' : ''}`} onClick={() => set('isPaid', true)}>₹ Paid</button>
                  </div>
                </div>

                {/* Prices based on type */}
                {formData.isPaid && (
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

                {/* Capacity — only for offline */}
                {!formData.isOnline && (
                  <div className="form-field-group">
                    <div className="form-label-row">
                      <label className="craft-label">Participant Limit</label>
                      <label className="toggle-switch-label">
                        <input type="checkbox" checked={formData.hasCapacityLimit} onChange={e => set('hasCapacityLimit', e.target.checked)} />
                        <span className="toggle-switch-track" />
                        <span className="toggle-switch-text">Set a limit</span>
                      </label>
                    </div>
                    {formData.hasCapacityLimit && (
                      <input
                        type="number"
                        min="1"
                        className="craft-input font-mono"
                        placeholder="Max participants (e.g. 150)"
                        value={formData.maxParticipants}
                        onChange={e => set('maxParticipants', e.target.value)}
                      />
                    )}
                  </div>
                )}

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
                        placeholder="yourname@upi or 9876543210@paytm"
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
