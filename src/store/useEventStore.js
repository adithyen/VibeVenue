// ============================================================
//  VIBEVENUE — EVENT STORE (Supabase)
//  Real-time synced across all sessions / accounts
// ============================================================
import { create } from 'zustand';
import { supabase, uploadBase64 } from '../lib/supabase';
import { CATEGORIES } from '../data/mockData';

const useEventStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────
  events: [],
  isLoading: false,
  error: null,
  _realtimeChannel: null,

  // ── Boot: fetch all events + subscribe to realtime ──────────
  init: async () => {
    set({ isLoading: true });
    await get().fetchEvents();

    // Realtime subscription — any INSERT/UPDATE/DELETE on events
    // propagates to all open sessions instantly
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' },
        () => get().fetchEvents()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' },
        () => get().fetchEvents()
      )
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  // ── Fetch events with registration counts ───────────────────
  fetchEvents: async () => {
    const { data, error } = await supabase
      .from('event_summary')    // our view: events + count(registrations)
      .select(`
        *,
        event_schedule ( id, sort_order, time, title, speaker, room, duration ),
        event_contacts ( id, sort_order, name, role, phone, email ),
        event_addons   ( id, label, price, required ),
        event_links    ( id, link_type, label, url, sort_order )
      `)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('fetchEvents error:', error);
      set({ error: error.message, isLoading: false });
      return;
    }

    // Normalise DB rows → shape the rest of the app expects
    const events = (data || []).map(normaliseEvent);
    set({ events, isLoading: false, error: null });
  },

  // ── Selectors ───────────────────────────────────────────────
  getEventById: (id) => get().events.find(e => e.id === id),

  getDashboardStats: () => {
    const events = get().events;
    const upcoming  = events.filter(e => e.status === 'upcoming').length;
    const totalRegs = events.reduce((s, e) => s + (e.registrationCount || 0), 0);
    const totalSeats = events.reduce((s, e) => s + (e.maxParticipants || 0), 0);
    const available = Math.max(0, totalSeats - totalRegs);
    const avgOccupancy = totalSeats > 0 ? Math.round((totalRegs / totalSeats) * 100) : 0;
    return { totalEvents: events.length, upcomingEvents: upcoming, totalRegistrations: totalRegs, availableSeats: available, avgOccupancy };
  },

  getRecentRegistrations: async (limit = 10) => {
    const { data, error } = await supabase
      .from('registrations')
      .select(`*, events ( name, category, start_date )`)
      .order('registered_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []).map(r => ({
      ...r,
      name: r.full_name,
      studentId: r.student_id,
      eventName: r.events?.name,
      eventCategory: r.events?.category,
      eventDate: r.events?.start_date,
    }));
  },

  getFilteredEvents: ({ search = '', category = '', sort = 'date-asc', status = '' }) => {
    let events = [...get().events];
    if (search.trim()) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (category) events = events.filter(e => e.category === category);
    if (status)   events = events.filter(e => e.status === status);
    switch (sort) {
      case 'date-asc':  events.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
      case 'date-desc': events.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
      case 'name-asc':  events.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': events.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'capacity-desc': events.sort((a, b) =>
        (b.registrationCount / b.maxParticipants) - (a.registrationCount / a.maxParticipants)); break;
      case 'registrations-desc': events.sort((a, b) => b.registrationCount - a.registrationCount); break;
    }
    return events;
  },

  // ── Actions: CRUD ───────────────────────────────────────────

  addEvent: async (formData) => {
    set({ isLoading: true });

    // Upload banner + logo if they are base64
    const bannerId = `${Date.now()}-banner`;
    const logoId   = `${Date.now()}-logo`;
    const bannerUrl = formData.bannerBase64
      ? await uploadBase64('event-banners', bannerId, formData.bannerBase64)
      : null;
    const logoUrl = formData.logoBase64
      ? await uploadBase64('event-logos', logoId, formData.logoBase64)
      : null;

    const row = formDataToRow(formData, bannerUrl, logoUrl);

    const { data: event, error } = await supabase
      .from('events')
      .insert(row)
      .select()
      .single();

    if (error) { set({ error: error.message, isLoading: false }); return null; }

    // Insert child rows
    await insertChildRows(event.id, formData);
    await get().fetchEvents();
    return event;
  },

  updateEvent: async (id, formData) => {
    set({ isLoading: true });

    // Re-upload images only if they changed (still base64)
    let bannerUrl = formData.bannerUrl || null;
    let logoUrl   = formData.logoUrl   || null;
    if (formData.bannerBase64?.startsWith('data:')) {
      bannerUrl = await uploadBase64('event-banners', `${id}-banner`, formData.bannerBase64);
    }
    if (formData.logoBase64?.startsWith('data:')) {
      logoUrl = await uploadBase64('event-logos', `${id}-logo`, formData.logoBase64);
    }

    const row = formDataToRow(formData, bannerUrl, logoUrl);

    const { error } = await supabase.from('events').update(row).eq('id', id);
    if (error) { set({ error: error.message, isLoading: false }); return false; }

    // Replace child rows (delete + re-insert)
    await supabase.from('event_schedule').delete().eq('event_id', id);
    await supabase.from('event_contacts').delete().eq('event_id', id);
    await supabase.from('event_addons').delete().eq('event_id', id);
    await supabase.from('event_links').delete().eq('event_id', id);
    await insertChildRows(id, formData);

    await get().fetchEvents();
    return true;
  },

  deleteEvent: async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { set({ error: error.message }); return false; }
    set(state => ({ events: state.events.filter(e => e.id !== id) }));
    return true;
  },

  // ── Registrations ────────────────────────────────────────────

  registerParticipant: async (eventId, formData) => {
    const { data: reg, error } = await supabase
      .from('registrations')
      .insert({
        event_id:          eventId,
        user_id:           formData.userId || null,
        ticket_id:         formData.ticketId || undefined,
        full_name:         formData.fullName,
        email:             formData.email,
        phone:             formData.phone,
        student_id:        formData.rollNumber,
        college:           formData.college,
        department:        formData.department,
        year:              formData.year,
        registration_type: formData.registrationType || 'individual',
        team_name:         formData.teamName || null,
        team_members:      formData.teamMembers || [],
        total_paid:        formData.totalPaid || 0,
        txn_id:            formData.txnId || null,
        status:            'confirmed',
      })
      .select()
      .single();

    if (error) { console.error('registerParticipant error:', error); return null; }

    // Insert selected add-ons
    if (formData.selectedAddOns?.length) {
      const addonRows = formData.selectedAddOns.map(addonId => ({
        registration_id: reg.id,
        addon_id: addonId,
        quantity: 1,
      }));
      await supabase.from('registration_addons').insert(addonRows);
    }

    // Optimistically update local count
    set(state => ({
      events: state.events.map(e =>
        e.id === eventId
          ? { ...e, registrationCount: (e.registrationCount || 0) + 1 }
          : e
      ),
    }));
    return { ...reg, ticketId: reg.ticket_id };
  },

  removeParticipant: async (eventId, registrationId) => {
    const { error } = await supabase.from('registrations').delete().eq('id', registrationId);
    if (error) return false;
    set(state => ({
      events: state.events.map(e =>
        e.id === eventId
          ? { ...e, registrationCount: Math.max(0, (e.registrationCount || 1) - 1) }
          : e
      ),
    }));
    return true;
  },

  updateParticipantStatus: async (registrationId, status) => {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registrationId);
    return !error;
  },

  updateCheckInStatus: async (registrationId, checkIn) => {
    const { error } = await supabase
      .from('registrations')
      .update({
        check_in_status: checkIn ? 'Checked In' : 'Not Checked In',
        checked_in_at: checkIn ? new Date().toISOString() : null,
      })
      .eq('id', registrationId);
    return !error;
  },

  // Fetch all registrations for a single event (for the management detail page)
  fetchEventParticipants: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });
    if (error) return [];
    return (data || []).map(r => ({
      ...r,
      name: r.full_name,
      studentId: r.student_id,
      ticketId: r.ticket_id,
      checkInStatus: r.check_in_status,
      registeredAt: r.registered_at,
    }));
  },

  setLoading: (val) => set({ isLoading: val }),
  setError:   (err) => set({ error: err }),
}));

// ── Helpers ──────────────────────────────────────────────────────

function formDataToRow(f, bannerUrl, logoUrl) {
  return {
    name:                  f.name,
    tagline:               f.tagline || null,
    description:           f.description,
    category:              f.category,
    tags:                  f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    is_online:             f.isOnline || false,
    banner_url:            bannerUrl,
    logo_url:              logoUrl,
    status:                f.status || 'upcoming',
    start_date:            f.startDate || null,
    start_time:            f.startTime || null,
    end_date:              f.endDate   || null,
    end_time:              f.endTime   || null,
    venue:                 f.venue     || null,
    meeting_link:          f.meetingLink || null,
    whatsapp_link:         f.whatsappLink || null,
    registration_type:     f.registrationType || 'individual',
    is_paid:               f.isPaid || false,
    individual_price:      f.individualPrice ? parseFloat(f.individualPrice) : null,
    group_price:           f.groupPrice       ? parseFloat(f.groupPrice)       : null,
    group_min_size:        parseInt(f.groupMinSize, 10) || 2,
    group_max_size:        parseInt(f.groupMaxSize, 10) || 5,
    has_capacity_limit:    f.hasCapacityLimit || false,
    max_participants:      f.hasCapacityLimit ? (parseInt(f.maxParticipants, 10) || 9999) : 9999,
    amenities:             f.amenities || {},
    upi_id:                f.upiId    || null,
    has_bank_transfer:     f.hasBankTransfer || false,
    account_no:            f.accountNo || null,
    ifsc_code:             f.ifscCode  || null,
    payment_verification:  f.paymentVerification || 'both',
    confirmation_message:  f.confirmationMessage || null,
  };
}

async function insertChildRows(eventId, f) {
  const inserts = [];

  // Schedule
  if (f.schedule?.length) {
    inserts.push(supabase.from('event_schedule').insert(
      f.schedule.map((s, i) => ({ event_id: eventId, sort_order: i, ...s }))
    ));
  }

  // Contacts
  if (f.contacts?.length) {
    inserts.push(supabase.from('event_contacts').insert(
      f.contacts
        .filter(c => c.name || c.email || c.phone)
        .map((c, i) => ({ event_id: eventId, sort_order: i, name: c.name, role: c.role, phone: c.phone, email: c.email }))
    ));
  }

  // Add-ons
  if (f.addOns?.length) {
    inserts.push(supabase.from('event_addons').insert(
      f.addOns
        .filter(a => a.label)
        .map(a => ({ event_id: eventId, label: a.label, price: parseFloat(a.price) || 0, required: a.required || false }))
    ));
  }

  // Links
  const links = [
    ...(f.preLinks  || []).filter(l => l.label || l.url).map((l, i) => ({ event_id: eventId, link_type: 'pre',  label: l.label, url: l.url, sort_order: i })),
    ...(f.postLinks || []).filter(l => l.label || l.url).map((l, i) => ({ event_id: eventId, link_type: 'post', label: l.label, url: l.url, sort_order: i })),
  ];
  if (links.length) inserts.push(supabase.from('event_links').insert(links));

  await Promise.all(inserts);
}

function normaliseEvent(row) {
  // Flatten the DB snake_case row back to the camelCase shape pages expect
  return {
    id:                row.id,
    name:              row.name,
    tagline:           row.tagline,
    description:       row.description,
    shortDescription:  row.tagline,
    category:          row.category,
    tags:              row.tags || [],
    isOnline:          row.is_online,
    bannerUrl:         row.banner_url,
    logoUrl:           row.logo_url,
    status:            row.status,

    date:              row.start_date,
    startDate:         row.start_date,
    time:              row.start_time,
    startTime:         row.start_time,
    endDate:           row.end_date,
    endTime:           row.end_time,
    venue:             row.venue,
    meetingLink:       row.meeting_link,
    whatsappLink:      row.whatsapp_link,

    registrationType:  row.registration_type,
    isPaid:            row.is_paid,
    individualPrice:   row.individual_price,
    groupPrice:        row.group_price,
    groupMinSize:      row.group_min_size,
    groupMaxSize:      row.group_max_size,
    hasCapacityLimit:  row.has_capacity_limit,
    maxParticipants:   row.max_participants,
    amenities:         row.amenities || {},
    upiId:             row.upi_id,
    hasBankTransfer:   row.has_bank_transfer,
    accountNo:         row.account_no,
    ifscCode:          row.ifsc_code,
    paymentVerification: row.payment_verification,
    confirmationMessage: row.confirmation_message,

    fee: row.is_paid
      ? (row.registration_type === 'group' ? `₹${row.group_price}/team` : `₹${row.individual_price}`)
      : 'Free',

    // Counts from the event_summary view
    registrationCount: parseInt(row.registration_count, 10) || 0,
    checkedInCount:    parseInt(row.checked_in_count,   10) || 0,

    // Child rows
    schedule: (row.event_schedule || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ time: s.time, title: s.title, speaker: s.speaker, room: s.room, duration: s.duration })),

    contacts: (row.event_contacts || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => ({ name: c.name, role: c.role, phone: c.phone, email: c.email })),

    addOns: (row.event_addons || [])
      .map(a => ({ id: a.id, label: a.label, price: a.price, required: a.required })),

    preLinks: (row.event_links || [])
      .filter(l => l.link_type === 'pre')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(l => ({ label: l.label, url: l.url })),

    postLinks: (row.event_links || [])
      .filter(l => l.link_type === 'post')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(l => ({ label: l.label, url: l.url })),

    createdAt: row.created_at,
    // Keep participants as empty array — fetched on demand via fetchEventParticipants
    participants: [],
  };
}

export default useEventStore;
