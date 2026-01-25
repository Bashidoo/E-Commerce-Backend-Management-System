import React, { createContext, useContext, ReactNode } from 'react';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from '../lib/supabaseClient';

interface SettingsContextType {
  supabaseUrl: string;
  supabaseKey: string;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const supabaseUrl = DEFAULT_SUPABASE_URL;
  const supabaseKey = DEFAULT_SUPABASE_KEY;
  
  // Only consider configured if we actually have a key
  const isConfigured = !!supabaseKey && !!supabaseUrl;

  return (
    <SettingsContext.Provider value={{ 
      supabaseUrl, 
      supabaseKey, 
      isConfigured
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