// ============================================================
//  FORM VALIDATION RULES
// ============================================================

export const validateEventForm = (data) => {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = 'Event name is required.';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Event name must be at least 3 characters.';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Event name must not exceed 100 characters.';
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required.';
  } else if (data.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  }

  if (!data.date) {
    errors.date = 'Event date is required.';
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) {
      errors.date = 'Invalid date.';
    }
  }

  if (!data.time) {
    errors.time = 'Start time is required.';
  }

  if (!data.venue?.trim()) {
    errors.venue = 'Venue is required.';
  }

  if (!data.category) {
    errors.category = 'Please select a category.';
  }

  const max = parseInt(data.maxParticipants, 10);
  if (!data.maxParticipants) {
    errors.maxParticipants = 'Maximum participants is required.';
  } else if (isNaN(max) || max < 1) {
    errors.maxParticipants = 'Must be a positive number.';
  } else if (max > 10000) {
    errors.maxParticipants = 'Cannot exceed 10,000.';
  }

  if (!data.organizerId) {
    errors.organizerId = 'Please select an organizer.';
  }

  return errors;
};

export const hasErrors = (errors) => Object.keys(errors).length > 0;
