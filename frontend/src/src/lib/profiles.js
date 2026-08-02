import { supabase } from './supabaseClient'

// Fetch user profile by ID
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

// Update user profile
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date(),
    })
    .eq('id', userId)

  if (error) throw error
  return data
}
