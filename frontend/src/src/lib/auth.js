import { supabase } from './supabaseClient'

// 1. Sign Up a new user
export async function signUpUser(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}

// 2. Log In an existing user
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// 3. Log Out the current user
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 4. Send a Password Reset email
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/reset-password',
  })
  if (error) throw error
  return data
}
