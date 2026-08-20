// EventForm — multi-step add/edit event form
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, ORGANIZERS } from '../../data/mockData';
import useEventStore from '../../store/useEventStore';
import useUIStore from '../../store/useUIStore';
import { validateEventForm, hasErrors } from '../../utils/validators';
import Button from '../ui/Button';
import './EventForm.css';

const STEPS = [
  { id: 0, label: 'Basic Info', icon: '📋' },
  { id: 1, label: 'Schedule',   icon: '📅' },
  { id: 2, label: 'Settings',   icon: '⚙️' },
];

const initialData = {
  name: '',
  description: '',
  date: '',
  time: '',
  endTime: '',
  venue: '',
  category: '',
  maxParticipants: '',
  organizerId: '',
  tags: '',
  shortDescription: '',
};

const EventForm = ({ event = null, onClose }) => {
  const isEdit = !!event;
  const [step, setStep] = useState(0);
  const [data, setData] = useState(
    isEdit
      ? { ...event, tags: (event.tags || []).join(', ') }
      : { ...initialData }
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { addEvent, updateEvent } = useEventStore();
  const { addToast } = useUIStore();

  const set = (key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const validateStep = () => {
    if (step === 0) {
      const errs = {};
      if (!data.name?.trim()) errs.name = 'Event name is required.';
      else if (data.name.trim().length < 3) errs.name = 'At least 3 characters.';
      if (!data.description?.trim()) errs.description = 'Description is required.';
      else if (data.description.trim().length < 20) errs.description = 'At least 20 characters.';
      if (!data.category) errs.category = 'Please select a category.';
      setErrors(errs);
      return Object.keys(errs).length === 0;
    }
    if (step === 1) {
      const errs = {};
      if (!data.date) errs.date = 'Date is required.';
      if (!data.time) errs.time = 'Start time is required.';
      if (!data.venue?.trim()) errs.venue = 'Venue is required.';
      setErrors(errs);
      return Object.keys(errs).length === 0;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    // Validate all fields
    const allErrors = validateEventForm(data);
    if (hasErrors(allErrors)) {
      setErrors(allErrors);
      // Go to first step with errors
      if (allErrors.name || allErrors.description || allErrors.category) setStep(0);
      else if (allErrors.date || allErrors.time || allErrors.venue) setStep(1);
      return;
    }

    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      maxParticipants: parseInt(data.maxParticipants, 10),
    };

    if (isEdit) {
      updateEvent(event.id, payload);
      addToast({ type: 'success', title: 'Event Updated', message: `"${data.name}" has been updated.` });
    } else {
      addEvent(payload);
      addToast({ type: 'success', title: 'Event Created', message: `"${data.name}" has been added.` });
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose?.();
    }, 1500);
  };

  if (success) {
    return (
      <motion.div
        className="form-success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="form-success-icon">✅</div>
        <h3>{isEdit ? 'Event Updated!' : 'Event Created!'}</h3>
        <p>Redirecting...</p>
      </motion.div>
    );
  }

  return (
    <div className="event-form">
      {/* Step indicator */}
      <div className="form-steps">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              className={`form-step-item ${step === i ? 'step-active' : ''} ${step > i ? 'step-done' : ''}`}
              onClick={() => { if (i < step) setStep(i); }}
              disabled={i > step}
              type="button"
            >
              <span className="step-num">{step > i ? '✓' : i + 1}</span>
              <span className="step-label">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${step > i ? 'step-line-done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="form-step-content"
        >
          {step === 0 && (
            <div className="form-fields">
              <Field
                id="ef-name" label="Event Name" required
                error={errors.name}
              >
                <input
                  id="ef-name"
                  type="text"
                  value={data.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. TechVista Summit 2025"
                  className={errors.name ? 'field-error' : ''}
                />
              </Field>

              <Field
                id="ef-desc" label="Description" required
                error={errors.description}
                hint={`${data.description.length}/500 characters`}
              >
                <textarea
                  id="ef-desc"
                  value={data.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the event, its highlights, and what participants can expect..."
                  rows={4}
                  maxLength={500}
                  className={errors.description ? 'field-error' : ''}
                />
              </Field>

              <Field
                id="ef-short-desc" label="Short Description"
                hint="Shown on event cards (optional)"
              >
                <input
                  id="ef-short-desc"
                  type="text"
                  value={data.shortDescription}
                  onChange={e => set('shortDescription', e.target.value)}
                  placeholder="One-line summary for event cards"
                />
              </Field>

              <Field id="ef-category" label="Category" required error={errors.category}>
                <div className="category-grid">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-btn ${data.category === cat.id ? 'cat-btn-active' : ''}`}
                      style={data.category === cat.id ? {
                        borderColor: cat.color,
                        background: `${cat.color}18`,
                        color: cat.color,
                      } : {}}
                      onClick={() => set('category', cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="field-error-msg">{errors.category}</p>}
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="form-fields">
              <div className="form-row">
                <Field id="ef-date" label="Event Date" required error={errors.date}>
                  <input
                    id="ef-date"
                    type="date"
                    value={data.date}
                    onChange={e => set('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.date ? 'field-error' : ''}
                  />
                </Field>
                <Field id="ef-time" label="Start Time" required error={errors.time}>
                  <input
                    id="ef-time"
                    type="time"
                    value={data.time}
                    onChange={e => set('time', e.target.value)}
                    className={errors.time ? 'field-error' : ''}
                  />
                </Field>
                <Field id="ef-end-time" label="End Time">
                  <input
                    id="ef-end-time"
                    type="time"
                    value={data.endTime}
                    onChange={e => set('endTime', e.target.value)}
                  />
                </Field>
              </div>

              <Field id="ef-venue" label="Venue" required error={errors.venue}>
                <input
                  id="ef-venue"
                  type="text"
                  value={data.venue}
                  onChange={e => set('venue', e.target.value)}
                  placeholder="e.g. Main Auditorium, Block A"
                  className={errors.venue ? 'field-error' : ''}
                />
              </Field>

              <Field id="ef-tags" label="Tags" hint="Comma-separated (e.g. ai, hackathon, beginner)">
                <input
                  id="ef-tags"
                  type="text"
                  value={data.tags}
                  onChange={e => set('tags', e.target.value)}
                  placeholder="ai, hackathon, beginner-friendly"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="form-fields">
              <Field
                id="ef-max" label="Maximum Participants" required
                error={errors.maxParticipants}
                hint="Enter the maximum number of registrations allowed"
              >
                <input
                  id="ef-max"
                  type="number"
                  min="1"
                  max="10000"
                  value={data.maxParticipants}
                  onChange={e => set('maxParticipants', e.target.value)}
                  placeholder="e.g. 200"
                  className={errors.maxParticipants ? 'field-error' : ''}
                />
              </Field>

              <Field
                id="ef-organizer" label="Organizer" required
                error={errors.organizerId}
              >
                <select
                  id="ef-organizer"
                  value={data.organizerId}
                  onChange={e => set('organizerId', e.target.value)}
                  className={errors.organizerId ? 'field-error' : ''}
                >
                  <option value="">Select an organizer...</option>
                  {ORGANIZERS.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} — {org.role}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Summary */}
              {data.name && (
                <div className="form-summary">
                  <p className="summary-label">Summary Preview</p>
                  <div className="summary-card">
                    <p className="summary-name">{data.name}</p>
                    {data.date && <p className="summary-detail">📅 {data.date} at {data.time || '--:--'}</p>}
                    {data.venue && <p className="summary-detail">📍 {data.venue}</p>}
                    {data.maxParticipants && <p className="summary-detail">👥 Max {data.maxParticipants} participants</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="form-actions">
        <Button
          variant="ghost"
          onClick={step === 0 ? onClose : prevStep}
          type="button"
          id="ef-back"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        <div className="form-actions-right">
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={nextStep} type="button" id="ef-next">
              Continue →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              type="button"
              id="ef-submit"
            >
              {isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable form field wrapper
const Field = ({ id, label, required, error, hint, children }) => (
  <div className={`form-field ${error ? 'has-error' : ''}`}>
    <label htmlFor={id} className="field-label">
      {label}
      {required && <span className="field-required">*</span>}
    </label>
    {children}
    {hint && !error && <p className="field-hint">{hint}</p>}
    {error && (
      <motion.p
        className="field-error-msg"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        ⚠ {error}
      </motion.p>
    )}
  </div>
);

export default EventForm;
