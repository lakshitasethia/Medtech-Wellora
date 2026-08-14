import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when Supabase credentials are present AND the mock flag is off.
 * The app reads this to decide between live queries and the bundled
 * dataset, so a missing .env.local degrades to the offline demo rather
 * than crashing on a null client.
 */
export const isSupabaseConfigured =
  Boolean(url && anonKey) && import.meta.env.VITE_USE_MOCK !== 'true';

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
