// ============================================================
//  VIBEVENUE — AUTHENTICATION STORE (Supabase Auth)
//  Replaces all hardcoded credentials + localStorage hacks
// ============================================================
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { formatPricingTier } from '../utils/dateUtils';
import useEventStore from './useEventStore';

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

    // Helper to sync events whenever auth session becomes active
    const syncEventStore = () => {
      try {
        useEventStore.getState().fetchEvents();
      } catch {}
    };

    // Listen for auth state changes (OAuth callback, token refresh, sign-in/out)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await get()._fetchProfile(session.user.id, session.user);
        set({ session, user: profile, isLoading: false });
        syncEventStore();
      } else if (event === 'SIGNED_OUT') {
        set({ session: null, user: null, isLoading: false });
        syncEventStore();
      }
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await get()._fetchProfile(session.user.id, session.user);
        set({ session, user: profile, isLoading: false });
        syncEventStore();
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
      const savedRole = typeof window !== 'undefined' ? localStorage.getItem('vibe_intended_role') : null;

      // Check client-side cached profile backup
      let cached = null;
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(`vibe_user_profile_${userId}`);
          if (raw) cached = JSON.parse(raw);
        }
      } catch {}

      // Attempt to read from profiles table
      let profile = null;
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        profile = profileRow;
      } catch (e) {
        console.warn('Failed querying profiles table:', e);
      }

      // If no profile exists yet in DB (e.g. first-time Google sign-in), auto-create it!
      if (!profile) {
        const fallbackName = meta.full_name || meta.name || cached?.name || authUser.email?.split('@')[0] || 'User';
        const fallbackAvatar = meta.avatar_url || meta.picture || cached?.avatar || null;
        const fallbackRole = meta.role || cached?.role || savedRole || 'participant';

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

      const role = profile?.role || meta.role || cached?.role || savedRole || 'participant';

      // Name resolution: prioritize the most recently saved name
      let name = profile?.name || meta.full_name || meta.name || cached?.name || authUser.email?.split('@')[0] || 'User';
      // If local cache or Auth metadata has a custom edited name that differs from stale DB row, use the latest
      if (cached?.name && cached.name.trim() && cached.name !== profile?.name) {
        name = cached.name.trim();
      } else if (meta.full_name && meta.full_name.trim() && meta.full_name !== profile?.name) {
        name = meta.full_name.trim();
      }

      // Self-heal: If profile table has an outdated name compared to resolved name, sync DB row
      if (name && profile?.name && profile.name !== name) {
        try {
          supabase
            .from('profiles')
            .update({ name, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .then();
        } catch {}
      }

      const avatar = profile?.avatar_url || meta.avatar_url || meta.picture || cached?.avatar || null;
      const studentId = profile?.student_id || meta.student_id || meta.studentId || meta.rollNumber || cached?.studentId || cached?.rollNumber || '';
      const designation = studentId || meta.designation || meta.roleTitle || cached?.designation || (role === 'admin' ? 'Lead Organizer' : '');
      const college = meta.college || cached?.college || profile?.college || '';
      const department = profile?.department || meta.department || cached?.department || '';
      const year = profile?.year || meta.year || cached?.year || '';
      const phone = profile?.phone || meta.phone || cached?.phone || '';

      const resolved = {
        id: userId,
        name,
        email: authUser.email,
        avatar,
        role,
        designation: designation || (role === 'admin' ? 'Lead Organizer' : ''),
        roleTitle: designation || (role === 'admin' ? 'Lead Organizer' : ''),
        studentId,
        rollNumber: studentId,
        college,
        department,
        year,
        phone,
        initials: (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };

      // Always maintain synchronous localStorage cache
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`vibe_user_profile_${userId}`, JSON.stringify(resolved));
        }
      } catch {}

      return resolved;
    } catch (err) {
      console.error('_fetchProfile exception:', err);
      // Failsafe fallback: return user object so authentication never hangs
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) return null;
      const meta = authUser.user_metadata || {};
      let cached = null;
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(`vibe_user_profile_${userId}`);
          if (raw) cached = JSON.parse(raw);
        }
      } catch {}

      const name = cached?.name || meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User';
      const role = cached?.role || meta.role || localStorage.getItem('vibe_intended_role') || 'participant';
      const designation = cached?.designation || meta.designation || meta.roleTitle || (role === 'admin' ? (meta.studentId || meta.rollNumber || '') : '');
      const studentId = cached?.studentId || meta.studentId || meta.student_id || meta.rollNumber || '';
      return {
        id: userId,
        name,
        email: authUser.email,
        avatar: cached?.avatar || meta.avatar_url || meta.picture || null,
        role,
        designation: designation || (role === 'admin' ? 'Lead Organizer' : ''),
        roleTitle: designation || (role === 'admin' ? 'Lead Organizer' : ''),
        studentId,
        rollNumber: studentId,
        college: cached?.college || meta.college || '',
        department: cached?.department || meta.department || '',
        year: cached?.year || meta.year || '',
        phone: cached?.phone || meta.phone || '',
        initials: (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
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
    try {
      useEventStore.getState().fetchEvents();
    } catch {}
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
      try {
        useEventStore.getState().fetchEvents();
      } catch {}
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
      const designationValue = updates.designation || updates.roleTitle || updates.studentId || updates.rollNumber || '';
      const trimmedName = updates.name ? updates.name.trim() : user.name;
      const trimmedPhone = updates.phone ? updates.phone.trim() : '';
      const trimmedCollege = updates.college ? updates.college.trim() : (user.college || '');
      const trimmedStudentId = updates.studentId || updates.rollNumber || designationValue || '';
      const trimmedDept = updates.department ? updates.department.trim() : '';
      const selectedYear = updates.year || '';
      const avatarUrl = updates.avatar || updates.avatarUrl || user.avatar || null;

      // 1. Update Supabase profiles table
      // CRITICAL: ONLY valid schema columns ('name', 'student_id', 'department', 'year', 'phone', 'avatar_url', 'updated_at')!
      // 'college' is NOT a column in public.profiles; sending it causes PGRST204 HTTP 400 Bad Request error.
      const profileUpdates = {
        name: trimmedName,
        student_id: trimmedStudentId,
        department: trimmedDept,
        year: selectedYear,
        phone: trimmedPhone,
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl) {
        profileUpdates.avatar_url = avatarUrl;
      }

      try {
        const { error: pError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (pError) {
          console.warn('[updateProfile] Direct profiles table update warning:', pError.message);
        }
      } catch (dbErr) {
        console.warn('[updateProfile] DB update exception:', dbErr);
      }

      // 2. Update Supabase auth user_metadata (this preserves college and synchronizes across all devices/sessions)
      try {
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            name: trimmedName,
            phone: trimmedPhone,
            college: trimmedCollege,
            student_id: trimmedStudentId,
            studentId: trimmedStudentId,
            rollNumber: trimmedStudentId,
            designation: designationValue,
            roleTitle: designationValue,
            year: selectedYear,
            department: trimmedDept,
            avatar_url: avatarUrl,
          },
        });
        if (authErr) {
          console.warn('[updateProfile] Supabase auth updateUser warning:', authErr.message);
        }
      } catch (authErr) {
        console.warn('[updateProfile] Supabase auth updateUser exception:', authErr);
      }

      // 3. Keep any existing registrations by this user in sync with their updated name and phone
      try {
        await supabase
          .from('registrations')
          .update({
            full_name: trimmedName,
            phone: trimmedPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } catch (regErr) {
        console.warn('[updateProfile] Registrations sync non-blocking warning:', regErr);
      }

      // 4. Construct updated user object
      const updatedUser = {
        ...user,
        ...updates,
        name: trimmedName,
        phone: trimmedPhone,
        college: trimmedCollege,
        studentId: trimmedStudentId,
        rollNumber: trimmedStudentId,
        department: trimmedDept,
        year: selectedYear,
        avatar: avatarUrl,
        designation: designationValue || user.designation,
        roleTitle: designationValue || user.roleTitle,
        initials: (trimmedName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };

      // 5. Persist to localStorage for 100% reload resilience
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`vibe_user_profile_${user.id}`, JSON.stringify(updatedUser));
        }
      } catch {}

      // 6. Update in-memory Zustand store
      set({ user: updatedUser });
      return true;
    } catch (err) {
      console.error('updateProfile error:', err);
      // Fallback local update
      const fallbackUser = { ...user, ...updates };
      try {
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`vibe_user_profile_${user.id}`, JSON.stringify(fallbackUser));
        }
      } catch {}
      set({ user: fallbackUser });
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

    query = query.neq('status', 'cancelled');

    const { data, error } = await query.order('registered_at', { ascending: false });

    if (error) { console.error('getParticipantPasses error:', error); return []; }

    return (data || [])
      .filter(r => {
        const s = String(r.status || '').toLowerCase().trim();
        return s === 'confirmed' || s === 'waitlisted';
      })
      .map(r => {
      const tm = r.team_members;
      let checkInStatus = r.check_in_status || 'Not Checked In';
      if (Array.isArray(tm) && tm.length > 0) {
        const all = tm.every(m => m.checkedIn);
        const any = tm.some(m => m.checkedIn);
        checkInStatus = all ? 'Checked In' : any ? 'Partially Checked In' : 'Not Checked In';
      }

      return {
        ...r,
        ticketId: r.ticket_id,
        name: r.full_name,
        studentId: r.student_id,
        teamName: r.team_name || null,
        teamMembers: r.team_members || [],
        pricingTier: formatPricingTier(r.pricing_tier),
        membershipProof: r.membership_proof,
        screenshotUrl: r.payment_screenshot || r.screenshot_url || null,
        statusReason: r.status_reason || r.admin_notes || null,
        checkInStatus,
        eventName: r.events?.name,
        eventId: r.events?.id,
        eventCategory: r.events?.category,
        eventDate: r.events?.start_date,
        eventTime: r.events?.start_time,
        eventEndTime: r.events?.end_time,
        eventVenue: r.events?.venue || r.events?.meeting_link,
        eventStatus: r.events?.status,
      };
    });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
