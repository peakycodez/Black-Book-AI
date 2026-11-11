import { createClient } from '@supabase/supabase-js';

const configuredUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();

const configuredAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);
export const supabaseUrl = configuredUrl;
export const supabaseAnonKey = configuredAnonKey;

// Avoid throwing at module load when developers run Guest Mode before adding .env
const clientUrl = isSupabaseConfigured ? configuredUrl : 'https://placeholder.supabase.co';
const clientAnonKey = isSupabaseConfigured ? configuredAnonKey : 'unconfigured-anon-key';

export const supabase = createClient(clientUrl, clientAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
