import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase, resetSupabaseClient } from '../lib/supabaseClient';

interface SettingsContextType {
  supabaseUrl: string;
  supabaseKey: string;
  isConfigured: boolean;
  saveSettings: (url: string, key: string) => void;
  clearSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load initial settings
    const storedUrl = localStorage.getItem('supabase_url') || '';
    const storedKey = localStorage.getItem('supabase_key') || '';
    
    setSupabaseUrl(storedUrl);
    setSupabaseKey(storedKey);
    setIsConfigured(!!storedUrl && !!storedKey);
  }, []);

  const saveSettings = (url: string, key: string) => {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    setSupabaseUrl(url);
    setSupabaseKey(key);
    setIsConfigured(!!url && !!key);
    
    // Reset the singleton instance so next call uses new keys
    resetSupabaseClient();
    
    // Optional: Hard reload to ensure clean state for all services
    window.location.reload();
  };

  const clearSettings = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    setIsConfigured(false);
    resetSupabaseClient();
  };

  return (
    <SettingsContext.Provider value={{ 
      supabaseUrl, 
      supabaseKey, 
      isConfigured, 
      saveSettings, 
      clearSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
