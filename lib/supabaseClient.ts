import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to get credentials safely
const getCredentials = () => {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');
  return { url, key };
};

// Singleton-like instance that gets recreated if keys change
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const { url, key } = getCredentials();

  if (!url || !key) {
    return null;
  }

  // If instance exists and keys haven't changed (simplified check), return it
  // In a real scenario, we might want to check if the url/key match the instance's config,
  // but usually a hard reload is triggered on change, so simple persistence is fine.
  if (!supabaseInstance) {
    try {
        supabaseInstance = createClient(url, key);
    } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
        return null;
    }
  }

  return supabaseInstance;
};

export const resetSupabaseClient = () => {
  supabaseInstance = null;
};
