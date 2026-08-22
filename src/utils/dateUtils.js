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
