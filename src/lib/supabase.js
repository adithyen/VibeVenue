// src/lib/supabase.js — Supabase client singleton for VibeVenue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// Admin Supabase client singleton for non-RLS operations (waitlist promotions, live count syncs)
let _adminClient = null;
export async function getAdminSupabaseClient() {
  if (_adminClient) {
    try {
      const { data } = await _adminClient.auth.getSession();
      if (data?.session) return _adminClient;
    } catch {}
  }

  _adminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
  });

  try {
    await _adminClient.auth.signInWithPassword({
      email: 'organizer.admin@vibevenue.tech',
      password: 'VibeVenueAdmin#2026',
    });
  } catch (err) {
    console.warn('[getAdminSupabaseClient] Admin auth warning:', err?.message || err);
  }

  return _adminClient;
}

export default supabase;

// ── Storage helpers ──────────────────────────────────────────────

/**
 * Upload a base64 data URL to a Supabase Storage bucket.
 * Returns the public URL string, or the raw dataUrl on storage bucket failure.
 * This guarantees the user's uploaded images are NEVER lost!
 */
export async function uploadBase64(bucket, path, dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  if (!dataUrl.startsWith('data:')) return dataUrl; // Already a URL

  try {
    const [meta, b64] = dataUrl.split(',');
    const mimeMatch = meta?.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteChars = atob(b64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: mimeType });

    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType: mimeType,
    });

    if (error) {
      console.warn(`Supabase Storage [${bucket}] upload issue (saving base64 directly):`, error.message);
      // Fallback: Return raw dataUrl so image is preserved directly in DB!
      return dataUrl;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || dataUrl;
  } catch (err) {
    console.warn(`Supabase Storage [${bucket}] exception (saving base64 directly):`, err);
    return dataUrl;
  }
}
