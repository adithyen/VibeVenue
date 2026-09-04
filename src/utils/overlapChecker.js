// ============================================================
//  VIBEVENUE — Overlap Checker
//  Pure utility: detects scheduling conflicts between a user's
//  existing registrations and an event they want to register for.
// ============================================================
import { getEventWindow, eventsOverlap } from './dateUtils';
import { format } from 'date-fns';

/**
 * Formats a Date into a readable time string: "10:30 AM"
 */
const fmtTime = (d) => {
  try { return format(d, 'h:mm a'); } catch { return ''; }
};

/**
 * Formats a Date into a readable date+time: "3 Sep 2026, 10:30 AM"
 */
const fmtDT = (d) => {
  try { return format(d, 'd MMM yyyy, h:mm a'); } catch { return ''; }
};

/**
 * Formats an event window into a human-readable overlap description.
 * e.g. "3 Sep 2026, 10:00 AM – 12:00 PM"
 */
export const formatOverlapWindow = (event) => {
  const win = getEventWindow(event);
  if (!win) return '';
  const startStr = fmtDT(win.start);
  const endStr = fmtTime(win.end);
  return `${startStr} – ${endStr}`;
};

/**
 * Main conflict detection function.
 *
 * @param {Object} candidateEvent  - The event the user is attempting to register for.
 * @param {Array}  userPasses      - Array of existing passes (from getParticipantPasses or raw Supabase query with events joined)
 *
 * @returns {{ hasConflict, conflictingEvent, conflictingPass, overlapDescription }}
 */
export const detectRegistrationConflict = (candidateEvent, userPasses) => {
  if (!candidateEvent || !Array.isArray(userPasses) || userPasses.length === 0) {
    return { hasConflict: false, conflictingEvent: null, conflictingPass: null, overlapDescription: '' };
  }

  for (const pass of userPasses) {
    // Only check active confirmed or waitlisted passes — cancelled/revoked passes NEVER create a conflict
    const passStatus = String(pass.status || '').toLowerCase().trim();
    if (passStatus !== 'confirmed' && passStatus !== 'waitlisted') {
      continue;
    }

    // Build an event-shaped object from the pass joined event data
    // Works for both getParticipantPasses (camelCase) and raw Supabase query (snake_case)
    const existingEvent = pass.events
      ? {
          id:        pass.events.id,
          name:      pass.events.name,
          startDate: pass.events.start_date,
          startTime: pass.events.start_time,
          endDate:   pass.events.end_date || pass.events.start_date,
          endTime:   pass.events.end_time,
        }
      : {
          id:        pass.eventId,
          name:      pass.eventName,
          startDate: pass.eventDate,
          startTime: pass.eventTime,
          endDate:   pass.eventDate,
          endTime:   pass.eventEndTime || null,
        };

    // Don't check the same event (re-registration handled separately)
    if (existingEvent.id === candidateEvent.id) continue;

    if (eventsOverlap(candidateEvent, existingEvent)) {
      return {
        hasConflict: true,
        conflictingEvent: existingEvent,
        conflictingPass: pass,
        overlapDescription: formatOverlapWindow(existingEvent),
      };
    }
  }

  return { hasConflict: false, conflictingEvent: null, conflictingPass: null, overlapDescription: '' };
};
