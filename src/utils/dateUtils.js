// ============================================================
//  DATE UTILITIES
// ============================================================
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export const formatDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr, timeStr) => {
  try {
    const d = parseISO(dateStr);
    return `${format(d, 'EEE, dd MMM yyyy')} • ${timeStr}`;
  } catch {
    return `${dateStr} ${timeStr}`;
  }
};

export const formatTimeAgo = (dateStr) => {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

export const isUpcoming = (dateStr) => {
  try {
    return isAfter(parseISO(dateStr), new Date());
  } catch {
    return false;
  }
};

export const isPast = (dateStr) => {
  try {
    return isBefore(parseISO(dateStr), new Date());
  } catch {
    return false;
  }
};

export const getDaysUntil = (dateStr) => {
  try {
    const diff = parseISO(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
};

export const formatShortDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM dd');
  } catch {
    return dateStr;
  }
};

export const formatMonthYear = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMMM yyyy');
  } catch {
    return dateStr;
  }
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

  const isFull = event.hasCapacityLimit && event.maxParticipants && (event.registrationCount >= event.maxParticipants) && !event.isOnline;
  if (isFull) {
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

