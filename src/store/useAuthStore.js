// ============================================================
//  VIBEVENUE — AUTHENTICATION STORE (Supabase Auth)
//  Replaces all hardcoded credentials + localStorage hacks
// ============================================================
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  user: null,          // { id, name, email, avatar, role, studentId, department, year, initials }
  session: null,
  isLoading: true,     // true on boot while checking session
  error: null,

  // ── Boot: restore session from Supabase ─────────────────────
  init: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const profile = await get()._fetchProfile(session.user.id);
      set({ session, user: profile, isLoading: false });
    } else {
      set({ session: null, user: null, isLoading: false });
    }

    // Listen for auth state changes (login/logout from any tab)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await get()._fetchProfile(session.user.id);
        set({ session, user: profile });
      } else {
        set({ session: null, user: null });
      }
    });
  },

  // ── Internal: fetch profile row ─────────────────────────────
  _fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    const authUser = (await supabase.auth.getUser()).data.user;
    return {
      id: data.id,
      name: data.name || authUser?.email,
      email: authUser?.email,
      avatar: data.avatar_url,
      role: data.role,
      studentId: data.student_id,
      department: data.department,
      year: data.year,
      phone: data.phone,
      initials: (data.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    };
  },

  // ── Email / Password login ───────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    const profile = await get()._fetchProfile(data.user.id);
    set({ session: data.session, user: profile, isLoading: false });
    return true;
  },

  // ── Sign up (new accounts) ───────────────────────────────────
  signUp: async (email, password, role = 'participant', meta = {}) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: meta.name || email,
          role,
          ...meta,
        },
      },
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    // If email confirmation is disabled, session is available immediately
    if (data.session) {
      const profile = await get()._fetchProfile(data.user.id);
      set({ session: data.session, user: profile, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return 'confirm-email'; // Tell the UI to show "check your email"
  },

  // ── Google OAuth ─────────────────────────────────────────────
  loginWithGoogle: async (role = 'participant') => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        data: { role },
      },
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    // OAuth redirects — state handled in onAuthStateChange
    return true;
  },

  // ── Update profile ───────────────────────────────────────────
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        student_id: updates.studentId,
        department: updates.department,
        year: updates.year,
        phone: updates.phone,
      })
      .eq('id', user.id);
    if (error) return false;
    set({ user: { ...user, ...updates } });
    return true;
  },

  // ── Logout ───────────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, error: null });
  },

  // ── Get participant's registrations (for portal) ─────────────
  getParticipantPasses: async () => {
    const { user } = get();
    if (!user || user.role !== 'participant') return [];
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events (
          id, name, category, start_date, start_time, end_time,
          venue, meeting_link, status, is_online
        )
      `)
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false });

    if (error) { console.error('getParticipantPasses error:', error); return []; }

    return (data || []).map(r => ({
      ...r,
      ticketId: r.ticket_id,
      eventName: r.events?.name,
      eventId: r.events?.id,
      eventCategory: r.events?.category,
      eventDate: r.events?.start_date,
      eventTime: r.events?.start_time,
      eventVenue: r.events?.venue || r.events?.meeting_link,
      eventStatus: r.events?.status,
    }));
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
