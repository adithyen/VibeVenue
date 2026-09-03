// ============================================================
//  DATE UTILITIES
// ============================================================
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') {
    try {
      const d = parseISO(val);
      if (!isNaN(d.getTime())) return d;
    } catch {}
    const d2 = new Date(val);
    if (!isNaN(d2.getTime())) return d2;
  }
  if (typeof val === 'number') {
    const d3 = new Date(val);
    if (!isNaN(d3.getTime())) return d3;
  }
  return null;
};

export const formatDate = (dateStr) => {
  const d = toDate(dateStr);
  return d ? format(d, 'dd MMM yyyy') : (dateStr ? String(dateStr) : '—');
};

export const formatDateTime = (dateStr, timeStr) => {
  const d = toDate(dateStr);
  if (!d) return dateStr ? String(dateStr) : '—';
  try {
    if (timeStr) {
      return `${format(d, 'EEE, dd MMM yyyy')} • ${timeStr}`;
    }
    return format(d, 'EEE, dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr ? String(dateStr) : '—';
  }
};

export const formatTimeAgo = (dateStr) => {
  const d = toDate(dateStr);
  if (!d) return 'just now';
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'recently';
  }
};

export const isUpcoming = (dateStr) => {
  const d = toDate(dateStr);
  return d ? isAfter(d, new Date()) : false;
};

export const isPast = (dateStr) => {
  const d = toDate(dateStr);
  return d ? isBefore(d, new Date()) : false;
};

export const getDaysUntil = (dateStr) => {
  const d = toDate(dateStr);
  if (!d) return null;
  const diff = d - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatShortDate = (dateStr) => {
  const d = toDate(dateStr);
  return d ? format(d, 'MMM dd') : (dateStr ? String(dateStr) : '—');
};

export const formatMonthYear = (dateStr) => {
  const d = toDate(dateStr);
  return d ? format(d, 'MMMM yyyy') : (dateStr ? String(dateStr) : '—');
};

export const formatEventSchedule = (dateStr, startTime, endTime) => {
  const dateFormatted = dateStr ? formatDate(dateStr) : '';
  const start = (startTime || '').trim();
  const end = (endTime || '').trim();

  let timeFormatted = '';
  if (start && end) {
    timeFormatted = `${start} – ${end}`;
  } else if (start) {
    timeFormatted = start;
  } else if (end) {
    timeFormatted = `Until ${end}`;
  }

  if (dateFormatted && timeFormatted) {
    return `${dateFormatted} · ${timeFormatted}`;
  }
  return dateFormatted || timeFormatted || 'Date TBA';
};

export const getEventFeeDisplay = (event) => {
  if (!event) return 'Free';
  if (!event.isPaid) return 'Free';

  let tiers = event.pricingTiers;
  if (typeof tiers === 'string') {
    try { tiers = JSON.parse(tiers); } catch { tiers = []; }
  }
  if (!Array.isArray(tiers)) tiers = [];

  const isTiered = (event.pricingType === 'tiered' || tiers.length > 0) && tiers.length > 0;

  if (isTiered) {
    const prices = tiers.map(t => parseFloat(t.price) || 0).filter(p => !isNaN(p));
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
    }
  }

  if (event.fee && event.fee !== '') return event.fee;
  if (event.registrationType === 'group' && event.groupPrice) return `₹${event.groupPrice}/team`;
  if (event.individualPrice) return `₹${event.individualPrice}`;
  return 'Free';
};

export const parseEventDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const t = (timeStr || '00:00').trim();
    let hours = 0;
    let mins = 0;
    if (t.toLowerCase().includes('pm') || t.toLowerCase().includes('am')) {
      const isPm = t.toLowerCase().includes('pm');
      const clean = t.toLowerCase().replace(/pm|am/g, '').trim();
      const parts = clean.split(':');
      hours = parseInt(parts[0], 10) || 0;
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      mins = parseInt(parts[1], 10) || 0;
    } else {
      const parts = t.split(':');
      hours = parseInt(parts[0], 10) || 0;
      mins = parseInt(parts[1], 10) || 0;
    }
    const result = new Date(d);
    result.setHours(hours, mins, 0, 0);
    return result;
  } catch {
    return null;
  }
};

export const getComputedEventStatus = (event) => {
  if (!event) return 'upcoming';
  if (event.status === 'cancelled') return 'cancelled';

  const now = new Date();
  const startDt = parseEventDateTime(event.date || event.startDate, event.time || event.startTime);
  const endDt = parseEventDateTime(event.endDate || event.date || event.startDate, event.endTime || event.time || '23:59');

  if (endDt && now > endDt) {
    return 'completed';
  }
  if (startDt && now >= startDt && (!endDt || now <= endDt)) {
    return 'ongoing';
  }
  return 'upcoming';
};

export const getRegistrationStatusInfo = (event) => {
  if (!event) {
    return { isOpen: false, isSpot: false, isClosed: true, isFull: false, badgeText: 'Closed', badgeType: 'error', actionLabel: 'Closed' };
  }

  if (event.status === 'cancelled') {
    return { isOpen: false, isSpot: false, isClosed: true, isFull: false, badgeText: 'Cancelled', badgeType: 'error', actionLabel: 'Event Cancelled' };
  }

  const computedStatus = getComputedEventStatus(event);
  if (computedStatus === 'completed') {
    return { isOpen: false, isSpot: false, isClosed: true, isFull: false, badgeText: 'Event Ended', badgeType: 'neutral', actionLabel: 'Event Ended' };
  }

  const isCapacityFull = event.hasCapacityLimit && event.maxParticipants && (event.registrationCount >= event.maxParticipants) && !event.isOnline;
  if (isCapacityFull) {
    if (event.enableWaitlist) {
      const waitlistCapacity = parseInt(event.waitlistCapacity, 10) || 30;
      const waitlistCount = event.waitlistCount || 0;
      const isWaitlistFull = waitlistCount >= waitlistCapacity;

      if (!isWaitlistFull) {
        return {
          isOpen: true,
          isSpot: false,
          isClosed: false,
          isFull: false,
          isWaitlist: true,
          isWaitlistActive: true,
          waitlistPosition: waitlistCount + 1,
          waitlistCount,
          waitlistCapacity,
          badgeText: `Waitlist Open (#${waitlistCount + 1})`,
          badgeType: 'warning',
          actionLabel: `Join Waitlist (#${waitlistCount + 1})`,
        };
      } else {
        return {
          isOpen: false,
          isSpot: false,
          isClosed: true,
          isFull: true,
          isWaitlist: true,
          isWaitlistActive: false,
          isWaitlistFull: true,
          waitlistCount,
          waitlistCapacity,
          badgeText: 'Capacity & Waitlist Full',
          badgeType: 'error',
          actionLabel: 'Waitlist Full',
        };
      }
    }

    return { isOpen: false, isSpot: false, isClosed: true, isFull: true, badgeText: 'Housefull', badgeType: 'error', actionLabel: 'Event Full' };
  }

  const now = new Date();

  // Regular registration deadline
  let regUntilDt = null;
  if (event.allowRegistrationsUntil) {
    regUntilDt = new Date(event.allowRegistrationsUntil);
  } else {
    regUntilDt = parseEventDateTime(event.date || event.startDate, event.time || event.startTime);
  }

  // Spot registration deadline
  let spotUntilDt = null;
  if (event.enableSpotRegistrations) {
    if (event.allowSpotRegistrationsUntil) {
      spotUntilDt = new Date(event.allowSpotRegistrationsUntil);
    } else {
      spotUntilDt = parseEventDateTime(event.endDate || event.date || event.startDate, event.endTime || event.time || '23:59');
    }
  }

  // 1. Regular registration open?
  const isRegularOpen = !regUntilDt || now <= regUntilDt;
  if (isRegularOpen) {
    return {
      isOpen: true,
      isSpot: false,
      isClosed: false,
      isFull: false,
      badgeText: 'Registration Open',
      badgeType: 'success',
      actionLabel: 'Register Now',
      deadline: regUntilDt,
    };
  }

  // 2. Spot registration active?
  const isSpotActive = event.enableSpotRegistrations && (!spotUntilDt || now <= spotUntilDt);
  if (isSpotActive) {
    return {
      isOpen: true,
      isSpot: true,
      isClosed: false,
      isFull: false,
      badgeText: 'Spot Registration Active ⚡',
      badgeType: 'warning',
      actionLabel: 'Spot Register Now ⚡',
      deadline: spotUntilDt,
    };
  }

  // 3. Registrations closed
  return {
    isOpen: false,
    isSpot: false,
    isClosed: true,
    isFull: false,
    badgeText: 'Registrations Closed',
    badgeType: 'neutral',
    actionLabel: 'Registrations Closed',
    deadline: regUntilDt,
  };
};

export const formatPricingTier = (tier) => {
  if (!tier) return '';
  if (typeof tier === 'object' && tier !== null) {
    return tier.label || tier.name || tier.title || '';
  }
  if (typeof tier === 'string') {
    let str = tier.trim();
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      try { str = JSON.parse(str); } catch {}
    }
    if (typeof str === 'object' && str !== null) {
      return str.label || str.name || str.title || '';
    }
    if (str.includes('"label"') || str.includes('label:')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === 'object') {
          return parsed.label || parsed.name || str;
        }
      } catch {
        const match = str.match(/"label"\s*:\s*"([^"]+)"/);
        if (match && match[1]) return match[1];
      }
    }
    return str;
  }
  return String(tier);
};

// ── Overlap Detection Helpers ─────────────────────────────────────────────────

/**
 * Returns the active time window { start: Date, end: Date } for an event.
 * "start" = event's startDate + startTime
 * "end"   = event's endDate (or startDate if none) + endTime (or 23:59 if none)
 * Returns null if start date cannot be parsed.
 */
export const getEventWindow = (event) => {
  if (!event) return null;
  const startDate = event.startDate || event.date || event.start_date;
  const startTime = event.startTime || event.time || event.start_time || '00:00';
  const endDate = event.endDate || event.end_date || startDate;
  const endTime = event.endTime || event.end_time || '23:59';

  const start = parseEventDateTime(startDate, startTime);
  const end = parseEventDateTime(endDate, endTime);

  if (!start) return null;
  return { start, end: end || start };
};

/**
 * Returns true when the active windows of eventA and eventB overlap.
 * Uses standard interval overlap: A.start < B.end && A.end > B.start
 */
export const eventsOverlap = (eventA, eventB) => {
  const winA = getEventWindow(eventA);
  const winB = getEventWindow(eventB);
  if (!winA || !winB) return false;
  return winA.start < winB.end && winA.end > winB.start;
};

