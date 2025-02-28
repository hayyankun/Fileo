import { createContext, useContext } from 'react';
import { supabase } from '../utils/supabaseClient';

const SupabaseContext = createContext();

export function useSupabase() {
  return useContext(SupabaseContext);
}

export function SupabaseProvider({ children }) {
  // Value to be provided by the context
  const value = {
    supabase,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
