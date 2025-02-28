import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwzedwzcccxjxmmwemmg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3emVkd3pjY2N4anhtbXdlbW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDI2NzcsImV4cCI6MjA1NTgxODY3N30.JIPRUGDVyiNyQE6iShAQpBP5IMJkgWzuGAa2dA5Cu_c';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Use the confirmed bucket name that exists in your Supabase project
export const STORAGE_BUCKET = 'fileo-uploads';

// Helper function to validate the bucket exists
export const validateBucket = async () => {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list();
    if (error) {
      console.error(`Error accessing bucket '${STORAGE_BUCKET}':`, error);
      return false;
    }
    console.log(`Successfully connected to bucket '${STORAGE_BUCKET}'`);
    return true;
  } catch (err) {
    console.error(`Exception accessing bucket '${STORAGE_BUCKET}':`, err);
    return false;
  }
};

// Helper functions for common database operations
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const signInWithEmail = async (email, password) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signUpWithEmail = async (email, password) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const resetPassword = async (email) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
};

export const updatePassword = async (newPassword) => {
  return await supabase.auth.updateUser({
    password: newPassword,
  });
};

export const signInWithProvider = async (provider) => {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};
