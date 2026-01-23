import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Prioritize Environment Variables (GitHub Secrets / .env)
// Fallback to the hardcoded values provided for immediate functionality
const env = (import.meta as any).env || {};

export const DEFAULT_SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://khfzxeesnojmfmwahkxg.supabase.co';
export const DEFAULT_SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4ZWVzbm9qbWZtd2Foa3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM2NDQsImV4cCI6MjA4Mzg3OTY0NH0.OemAGDSn7mJfHy1iZmpDGf_T_4-lMRZauWegRvqc7qA';

// Helper to get credentials safely
const getCredentials = () => {
  const url = localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem('supabase_key') || DEFAULT_SUPABASE_KEY;
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