// ============================================================
//  EVENTFLOW — EVENT STORE (Zustand)
//  Central state for all event and participant data
// ============================================================

import { create } from 'zustand';
import { MOCK_EVENTS, ORGANIZERS, getDashboardStats, getRecentRegistrations, REGISTRATION_TREND } from '../data/mockData';

const useEventStore = create((set, get) => ({
  // ---- State ----
  events: MOCK_EVENTS,
  organizers: ORGANIZERS,
  registrationTrend: REGISTRATION_TREND,
  isLoading: false,
  error: null,

  // ---- Selectors ----
  getEventById: (id) => get().events.find(e => e.id === id),
  getOrganizerById: (id) => get().organizers.find(o => o.id === id),

  getDashboardStats: () => getDashboardStats(get().events),

  getRecentRegistrations: (limit = 10) => getRecentRegistrations(get().events, limit),

  getFilteredEvents: ({ search = '', category = '', sort = 'date-asc', status = '' }) => {
    let events = [...get().events];

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (category) {
      events = events.filter(e => e.category === category);
    }

    // Filter by status
    if (status) {
      events = events.filter(e => e.status === status);
    }

    // Sort
    switch (sort) {
      case 'date-asc':
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date-desc':
        events.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'name-asc':
        events.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        events.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'capacity-desc':
        events.sort((a, b) =>
          (b.registrationCount / b.maxParticipants) - (a.registrationCount / a.maxParticipants)
        );
        break;
      case 'registrations-desc':
        events.sort((a, b) => b.registrationCount - a.registrationCount);
        break;
      default:
        break;
    }

    return events;
  },

  // ---- Actions ----
  addEvent: (eventData) => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      ...eventData,
      participants: [],
      registrationCount: 0,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      schedule: eventData.schedule || [],
    };
    set(state => ({ events: [newEvent, ...state.events] }));
    return newEvent;
  },

  updateEvent: (id, updates) => {
    set(state => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  },

  deleteEvent: (id) => {
    set(state => ({
      events: state.events.filter(e => e.id !== id),
    }));
  },

  removeParticipant: (eventId, participantId) => {
    set(state => ({
      events: state.events.map(e => {
        if (e.id !== eventId) return e;
        const newParticipants = e.participants.filter(p => p.id !== participantId);
        return {
          ...e,
          participants: newParticipants,
          registrationCount: newParticipants.length,
        };
      }),
    }));
  },

  updateParticipantStatus: (eventId, participantId, status) => {
    set(state => ({
      events: state.events.map(e => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          participants: e.participants.map(p =>
            p.id === participantId ? { ...p, status } : p
          ),
        };
      }),
    }));
  },

  setLoading: (val) => set({ isLoading: val }),
  setError: (err) => set({ error: err }),
}));

export default useEventStore;
