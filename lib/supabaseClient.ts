import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Prioritize Environment Variables (GitHub Secrets / .env)
// Fallback to the hardcoded values provided for immediate functionality
const env = (import.meta as any).env || {};

export const DEFAULT_SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://khfzxeesnojmfmwahkxg.supabase.co';
export const DEFAULT_SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4ZWVzbm9qbWZtd2Foa3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM2NDQsImV4cCI6MjA4Mzg3OTY0NH0.OemAGDSn7mJfHy1iZmpDGf_T_4-lMRZauWegRvqc7qA';

// Singleton-like instance that gets recreated if keys change
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  // Strictly use the defined constants to ensure we use the specific project
  const url = DEFAULT_SUPABASE_URL;
  const key = DEFAULT_SUPABASE_KEY;

  if (!url || !key) {
    return null;
  }

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