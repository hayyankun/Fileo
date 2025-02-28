import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from './SupabaseContext';
import { getUser, signOut as supabaseSignOut } from '../utils/supabaseClient';
import { showToast } from '../components/ui/Toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { supabase } = useSupabase();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there is a user session on initial load
    const initializeAuth = async () => {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user:', error.message);
        setError(error.message);
        setIsLoading(false);
      }
    };

    // Call the initialization function
    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabaseSignOut();
      setUser(null);
      showToast('Successfully logged out', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
      showToast('Failed to log out', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
