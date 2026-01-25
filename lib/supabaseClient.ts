import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Prioritize Environment Variables (Build/Cloud)
const env = (import.meta as any).env || {};

// Helper to check localStorage (Local Dev fallback)
const getLocalSetting = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    return settings[key] || '';
  } catch {
    return '';
  }
};

// 1. Try Env Var (Deployed) -> 2. Try LocalStorage (Local Dev) -> 3. Fail (Return Empty)
// We DO NOT hardcode the URL anymore to keep the codebase clean and secure.
export const DEFAULT_SUPABASE_URL = env.VITE_SUPABASE_URL || getLocalSetting('supabaseUrl') || '';
export const DEFAULT_SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || getLocalSetting('supabaseAnonKey') || '';

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const url = DEFAULT_SUPABASE_URL;
  const key = DEFAULT_SUPABASE_KEY;

  if (!url || !key) {
    // Silent fail/warn. The UI will prompt the user to enter these via SettingsModal.
    console.warn("Supabase credentials missing. Please configure them in Settings.");
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