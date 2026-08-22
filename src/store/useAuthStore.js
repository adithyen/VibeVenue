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

    const hasAuthHash = typeof window !== 'undefined' && (
      window.location.hash.includes('access_token=') ||
      window.location.search.includes('code=')
    );

    // Listen for auth state changes (OAuth callback, token refresh, sign-in/out)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await get()._fetchProfile(session.user.id, session.user);
        set({ session, user: profile, isLoading: false });
      } else if (event === 'SIGNED_OUT') {
        set({ session: null, user: null, isLoading: false });
      }
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await get()._fetchProfile(session.user.id, session.user);
        set({ session, user: profile, isLoading: false });
      } else if (!hasAuthHash) {
        set({ session: null, user: null, isLoading: false });
      }
    } catch (err) {
      console.warn('Session check error:', err);
      if (!hasAuthHash) {
        set({ session: null, user: null, isLoading: false });
      }
    }
  },

  // ── Internal: fetch or auto-create profile row ─────────────
  _fetchProfile: async (userId, passedUser = null) => {
    try {
      let authUser = passedUser;
      if (!authUser) {
        const { data: authData } = await supabase.auth.getUser();
        authUser = authData?.user;
      }
      if (!authUser) return null;

      const meta = authUser.user_metadata || {};
      const savedRole = localStorage.getItem('vibe_intended_role');

      // Attempt to read from profiles table
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let profile = profileRow;

      // If no profile exists yet in DB (e.g. first-time Google sign-in), auto-create it!
      if (!profile) {
        const fallbackName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User';
        const fallbackAvatar = meta.avatar_url || meta.picture || null;
        const fallbackRole = meta.role || savedRole || 'participant';

        try {
          const { data: created } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: fallbackName,
              avatar_url: fallbackAvatar,
              role: fallbackRole,
            })
            .select()
            .maybeSingle();
          if (created) profile = created;
        } catch (e) {
          console.warn('Auto profile upsert warning:', e);
        }
      }

      const role = profile?.role || meta.role || savedRole || 'participant';
      const name = profile?.name || meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User';
      const avatar = profile?.avatar_url || meta.avatar_url || meta.picture || null;

      return {
        id: userId,
        name,
        email: authUser.email,
        avatar,
        role,
        studentId: profile?.student_id || meta.studentId || meta.student_id || meta.rollNumber || '',
        college: profile?.college || meta.college || '',
        department: profile?.department || meta.department || '',
        year: profile?.year || meta.year || '',
        phone: profile?.phone || meta.phone || '',
        initials: (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };
    } catch (err) {
      console.error('_fetchProfile exception:', err);
      // Failsafe fallback: return user object so authentication never hangs
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) return null;
      const meta = authUser.user_metadata || {};
      const name = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User';
      return {
        id: userId,
        name,
        email: authUser.email,
        avatar: meta.avatar_url || meta.picture || null,
        role: meta.role || localStorage.getItem('vibe_intended_role') || 'participant',
        studentId: meta.studentId || meta.student_id || meta.rollNumber || '',
        college: meta.college || '',
        department: meta.department || '',
        year: meta.year || '',
        phone: meta.phone || '',
        initials: 'U',
      };
    }
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
    localStorage.setItem('vibe_intended_role', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
        data: { role },
      },
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    return true;
  },

  // ── Update profile ───────────────────────────────────────────
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return false;
    try {
      // 1. Update Supabase profiles table
      const profileUpdates = {
        name: updates.name,
        student_id: updates.studentId || updates.rollNumber,
        college: updates.college,
        department: updates.department,
        year: updates.year,
        phone: updates.phone,
        avatar_url: updates.avatar || updates.avatarUrl,
      };

      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      // 2. Also update Supabase auth user_metadata for reliable sync
      await supabase.auth.updateUser({
        data: {
          full_name: updates.name,
          phone: updates.phone,
          college: updates.college,
          studentId: updates.studentId || updates.rollNumber,
          rollNumber: updates.studentId || updates.rollNumber,
          year: updates.year,
          department: updates.department,
          avatar_url: updates.avatar || updates.avatarUrl,
        },
      });

      const updatedUser = {
        ...user,
        ...updates,
        initials: (updates.name || user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };
      set({ user: updatedUser });
      return true;
    } catch (err) {
      console.error('updateProfile error:', err);
      // Fallback local update
      set({ user: { ...user, ...updates } });
      return true;
    }
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

    let query = supabase
      .from('registrations')
      .select(`
        *,
        events (
          id, name, category, start_date, start_time, end_time,
          venue, meeting_link, status, is_online
        )
      `);

    if (user.id && user.email) {
      query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
    } else if (user.id) {
      query = query.eq('user_id', user.id);
    } else if (user.email) {
      query = query.eq('email', user.email);
    }

    const { data, error } = await query.order('registered_at', { ascending: false });

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
