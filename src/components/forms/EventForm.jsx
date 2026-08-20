// Precision Multi-Step Event Form Component (Craft Standard v2.0)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, ORGANIZERS } from '../../data/mockData';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import { validateEventForm, hasErrors } from '../../utils/validators';
import Button from '../ui/Button';
import './EventForm.css';

const STEPS = [
  { id: 0, label: '1. Specification', icon: '📋' },
  { id: 1, label: '2. Logistics',     icon: '📍' },
  { id: 2, label: '3. Capacity',      icon: '👥' },
];

const initialData = {
  name: '',
  description: '',
  shortDescription: '',
  category: '',
  date: '',
  time: '',
  endTime: '',
  venue: '',
  fee: 'Free',
  maxParticipants: '100',
  organizerId: 'org-1',
  tags: '',
};

const EventForm = ({ event = null, onClose }) => {
  const isEdit = !!event;
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(
    isEdit
      ? {
          ...event,
          tags: (event.tags || []).join(', '),
          maxParticipants: String(event.maxParticipants),
        }
      : { ...initialData }
  );

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const { addEvent, updateEvent } = useEventStore();
  const { addToast } = useUIStore();

  const updateField = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateCurrentStep = () => {
    const errs = {};

    if (step === 0) {
      if (!formData.name?.trim()) errs.name = 'Event title is required.';
      else if (formData.name.trim().length < 3) errs.name = 'Must be at least 3 characters.';
      if (!formData.description?.trim()) errs.description = 'Description is required.';
      else if (formData.description.trim().length < 20) errs.description = 'Must be at least 20 characters.';
      if (!formData.category) errs.category = 'Please select an engineering domain.';
    } else if (step === 1) {
      if (!formData.date) errs.date = 'Event date is required.';
      if (!formData.time) errs.time = 'Start time is required.';
      if (!formData.venue?.trim()) errs.venue = 'Venue or laboratory hall is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const allErrors = validateEventForm(formData);
    if (hasErrors(allErrors)) {
      setErrors(allErrors);
      if (allErrors.name || allErrors.description || allErrors.category) setStep(0);
      else if (allErrors.date || allErrors.time || allErrors.venue) setStep(1);
      return;
    }

    setIsSubmitting(true);
    // Simulate brief network save
    await new Promise((r) => setTimeout(r, 600));

    const payload = {
      ...formData,
      maxParticipants: parseInt(formData.maxParticipants, 10),
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    if (isEdit) {
      updateEvent(event.id, payload);
      addToast({
        type: 'success',
        title: 'Event Specification Saved',
        message: `Updated parameters for "${formData.name}".`,
      });
    } else {
      addEvent(payload);
      addToast({
        type: 'success',
        title: 'New Event Scheduled',
        message: `"${formData.name}" added to symposium schedule.`,
      });
    }

    setIsSubmitting(false);
    setIsDone(true);
    setTimeout(() => {
      onClose?.();
    }, 900);
  };

  if (isDone) {
    return (
      <div className="craft-form-done-state">
        <span className="done-icon-box">✓</span>
        <h3 className="done-title">{isEdit ? 'Specification Updated' : 'Event Successfully Scheduled'}</h3>
        <p className="done-sub">Syncing symposium manifest & attendee routes...</p>
      </div>
    );
  }

  return (
    <form className="craft-event-form" onSubmit={handleSubmit} noValidate>
      {/* Form Step Indicator Bar */}
      <div className="form-steps-indicator" role="tablist">
        {STEPS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            className={`step-tab ${step === idx ? 'step-tab-active' : ''} ${step > idx ? 'step-tab-done' : ''}`}
            onClick={() => {
              if (idx < step) setStep(idx);
            }}
            disabled={idx > step}
          >
            <span className="step-tab-pill font-mono">{idx + 1}</span>
            <span className="step-tab-label">{s.label.split('. ')[1]}</span>
          </button>
        ))}
      </div>

      {/* Step Panels with Spring Transition */}
      <div className="form-step-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.16 }}
            className="form-step-panel"
          >
            {/* Step 0: Specification */}
            {step === 0 && (
              <div className="form-grid-fields">
                <div className="form-field-group">
                  <label htmlFor="evt-name" className="craft-label">
                    Event Title <span className="req-star">*</span>
                  </label>
                  <input
                    id="evt-name"
                    type="text"
                    className={`craft-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Nexus AI Summit 2026"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    autoFocus
                  />
                  {errors.name && <p className="field-error-text font-mono">{errors.name}</p>}
                </div>

                <div className="form-field-group">
                  <label htmlFor="evt-short" className="craft-label">
                    One-line Summary (Card View)
                  </label>
                  <input
                    id="evt-short"
                    type="text"
                    className="craft-input"
                    placeholder="Brief 1-line hook for directory card display"
                    value={formData.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="evt-desc" className="craft-label">
                    Detailed Specification Description <span className="req-star">*</span>
                  </label>
                  <textarea
                    id="evt-desc"
                    className={`craft-input craft-textarea ${errors.description ? 'input-error' : ''}`}
                    rows={4}
                    placeholder="Comprehensive overview of session objectives, technical stack, eligibility criteria, and deliverables..."
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                  {errors.description && (
                    <p className="field-error-text font-mono">{errors.description}</p>
                  )}
                </div>

                <div className="form-field-group">
                  <label className="craft-label">
                    Engineering Domain Category <span className="req-star">*</span>
                  </label>
                  <div className="form-domain-grid">
                    {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                      const isSelected = formData.category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`domain-tile ${isSelected ? 'domain-tile-selected' : ''}`}
                          onClick={() => updateField('category', cat.id)}
                        >
                          <span className="domain-tile-icon">{cat.icon}</span>
                          <span className="domain-tile-lbl">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p className="field-error-text font-mono">{errors.category}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Logistics */}
            {step === 1 && (
              <div className="form-grid-fields">
                <div className="form-row-2">
                  <div className="form-field-group">
                    <label htmlFor="evt-date" className="craft-label">
                      Event Date <span className="req-star">*</span>
                    </label>
                    <input
                      id="evt-date"
                      type="date"
                      className={`craft-input font-mono ${errors.date ? 'input-error' : ''}`}
                      value={formData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                    />
                    {errors.date && <p className="field-error-text font-mono">{errors.date}</p>}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="evt-time" className="craft-label">
                      Start Time <span className="req-star">*</span>
                    </label>
                    <input
                      id="evt-time"
                      type="text"
                      className={`craft-input font-mono ${errors.time ? 'input-error' : ''}`}
                      placeholder="e.g. 09:30 AM"
                      value={formData.time}
                      onChange={(e) => updateField('time', e.target.value)}
                    />
                    {errors.time && <p className="field-error-text font-mono">{errors.time}</p>}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field-group">
                    <label htmlFor="evt-end" className="craft-label">
                      End Time (Optional)
                    </label>
                    <input
                      id="evt-end"
                      type="text"
                      className="craft-input font-mono"
                      placeholder="e.g. 05:00 PM"
                      value={formData.endTime}
                      onChange={(e) => updateField('endTime', e.target.value)}
                    />
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="evt-fee" className="craft-label">
                      Registration Fee
                    </label>
                    <input
                      id="evt-fee"
                      type="text"
                      className="craft-input"
                      placeholder="e.g. Free or ₹200 / Team"
                      value={formData.fee}
                      onChange={(e) => updateField('fee', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label htmlFor="evt-venue" className="craft-label">
                    Laboratory / Auditorium Venue <span className="req-star">*</span>
                  </label>
                  <input
                    id="evt-venue"
                    type="text"
                    className={`craft-input ${errors.venue ? 'input-error' : ''}`}
                    placeholder="e.g. APJ Abdul Kalam Auditorium, Block A"
                    value={formData.venue}
                    onChange={(e) => updateField('venue', e.target.value)}
                  />
                  {errors.venue && <p className="field-error-text font-mono">{errors.venue}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Capacity & Convener */}
            {step === 2 && (
              <div className="form-grid-fields">
                <div className="form-field-group">
                  <label htmlFor="evt-max" className="craft-label">
                    Maximum Delegate Capacity <span className="req-star">*</span>
                  </label>
                  <div className="capacity-slider-row">
                    <input
                      id="evt-max"
                      type="number"
                      min="5"
                      max="5000"
                      className={`craft-input font-mono ${errors.maxParticipants ? 'input-error' : ''}`}
                      style={{ maxWidth: '140px' }}
                      value={formData.maxParticipants}
                      onChange={(e) => updateField('maxParticipants', e.target.value)}
                    />
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      className="craft-range"
                      value={formData.maxParticipants || 100}
                      onChange={(e) => updateField('maxParticipants', e.target.value)}
                    />
                  </div>
                  {errors.maxParticipants && (
                    <p className="field-error-text font-mono">{errors.maxParticipants}</p>
                  )}
                </div>

                <div className="form-field-group">
                  <label htmlFor="evt-org" className="craft-label">
                    Faculty Convener / Lead <span className="req-star">*</span>
                  </label>
                  <select
                    id="evt-org"
                    className="craft-input craft-form-select"
                    value={formData.organizerId}
                    onChange={(e) => updateField('organizerId', e.target.value)}
                  >
                    {ORGANIZERS.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} — {org.role} ({org.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field-group">
                  <label htmlFor="evt-tags" className="craft-label">
                    Subject Keywords / Tags (Comma-separated)
                  </label>
                  <input
                    id="evt-tags"
                    type="text"
                    className="craft-input font-mono"
                    placeholder="ai, llm, edge-computing, hackathon"
                    value={formData.tags}
                    onChange={(e) => updateField('tags', e.target.value)}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Form Bottom Control Buttons */}
      <div className="form-actions-bar">
        <Button
          variant="ghost"
          size="sm"
          onClick={step === 0 ? onClose : handleBack}
          type="button"
        >
          {step === 0 ? 'Discard' : '← Previous Step'}
        </Button>

        <div className="form-right-actions">
          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              type="button"
            >
              Continue →
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              type="submit"
            >
              {isEdit ? 'Save Specification' : 'Confirm & Schedule Event'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default EventForm;
