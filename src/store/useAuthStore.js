// ============================================================
//  CAMPUSCORE — AUTHENTICATION STORE (Zustand)
//  Manages user roles, local sessions, and Google OAuth tokens
// ============================================================

import { create } from 'zustand';
import { MOCK_EVENTS } from '../data/mockData';

// Parse JWT token payload from Google Login
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('cc_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  isLoading: false,
  error: null,

  // Local standard login
  login: async (email, password, role) => {
    set({ isLoading: true, error: null });
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const normalizedEmail = email.toLowerCase().trim();

    if (role === 'admin') {
      if (normalizedEmail === 'admin@campus.edu' && password === 'admin123') {
        const adminUser = {
          name: 'Dr. Priya Sharma',
          email: 'admin@campus.edu',
          avatar: null,
          role: 'admin',
          initials: 'PS',
        };
        localStorage.setItem('cc_user', JSON.stringify(adminUser));
        set({ user: adminUser, isLoading: false });
        return true;
      }
    } else {
      // Participant login
      if (normalizedEmail === 'student@campus.edu' && password === 'student123') {
        const studentUser = {
          name: 'Aarav Sharma',
          email: 'student@campus.edu',
          avatar: null,
          role: 'participant',
          studentId: 'CSE22405',
          department: 'Computer Science & Engineering',
          year: '3rd Year B.Tech',
          initials: 'AS',
        };
        localStorage.setItem('cc_user', JSON.stringify(studentUser));
        set({ user: studentUser, isLoading: false });
        return true;
      }
    }

    set({ error: 'Invalid credentials. Please try again.', isLoading: false });
    return false;
  },

  // Google Login handling
  loginWithGoogle: async (credential, role) => {
    set({ isLoading: true, error: null });
    const payload = parseJwt(credential);

    if (!payload) {
      set({ error: 'Failed to process Google Identity token.', isLoading: false });
      return false;
    }

    // Role assignment based on email domains or direct settings
    // If logging in as admin, let's check if they have a staff email
    const isAdminEmail = payload.email.includes('admin') || payload.email.includes('staff') || payload.email.includes('priya');
    const assignedRole = role || (isAdminEmail ? 'admin' : 'participant');

    const googleUser = {
      name: payload.name,
      email: payload.email,
      avatar: payload.picture,
      role: assignedRole,
      studentId: assignedRole === 'participant' ? `CSE22${Math.floor(100 + Math.random() * 899)}` : undefined,
      department: assignedRole === 'participant' ? 'Information Technology' : undefined,
      year: assignedRole === 'participant' ? '3rd Year B.Tech' : undefined,
      initials: payload.given_name?.[0] + payload.family_name?.[0] || 'G',
    };

    localStorage.setItem('cc_user', JSON.stringify(googleUser));
    set({ user: googleUser, isLoading: false });
    return true;
  },

  logout: () => {
    localStorage.removeItem('cc_user');
    set({ user: null, error: null });
  },

  // Helper selector to query tickets registered for the logged in participant user
  getParticipantPasses: () => {
    const user = get().user;
    if (!user || user.role !== 'participant') return [];

    // Find all registrations associated with the student's email across mock data events
    const passes = MOCK_EVENTS.flatMap((evt) => {
      // Find matches on email or name
      const matches = evt.participants.filter(
        (p) => p.email.toLowerCase() === user.email.toLowerCase() || p.name === user.name
      );
      return matches.map((p) => ({
        ...p,
        eventName: evt.name,
        eventId: evt.id,
        eventCategory: evt.category,
        eventDate: evt.date,
        eventTime: evt.time,
        eventVenue: evt.venue,
        eventStatus: evt.status,
      }));
    });

    // If there are no matches, generate a default ticket pass dynamically for demo purposes
    if (passes.length === 0) {
      return [
        {
          id: `reg-default-1`,
          ticketId: 'TCK-224859',
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          year: user.year,
          status: 'confirmed',
          checkInStatus: 'Checked In',
          registeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          eventId: 'evt-001',
          eventName: 'Nexus AI Summit 2026',
          eventCategory: 'ai-ml',
          eventDate: '2026-09-15',
          eventTime: '09:00 AM',
          eventVenue: 'APJ Abdul Kalam Auditorium, Block A',
          eventStatus: 'upcoming',
        },
        {
          id: `reg-default-2`,
          ticketId: 'TCK-849502',
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          year: user.year,
          status: 'pending',
          checkInStatus: 'Not Checked In',
          registeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          eventId: 'evt-002',
          eventName: 'CodeCraft 36h Hackathon',
          eventCategory: 'hackathon',
          eventDate: '2026-09-22',
          eventTime: '08:30 AM',
          eventVenue: 'Innovation & Incubation Center, Block C',
          eventStatus: 'upcoming',
        },
      ];
    }

    return passes;
  },
}));

export default useAuthStore;
