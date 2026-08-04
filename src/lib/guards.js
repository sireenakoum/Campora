import { supabase } from './supabase';

// Check if a user is currently logged in
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// Helper to require authentication on protected routes
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: User must be logged in');
  }
  return user;
}