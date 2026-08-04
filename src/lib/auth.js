import { supabase } from './supabase'

// Sign up a new user
export async function signUp(email, password, profileData = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: profileData,
      emailRedirectTo: `${window.location.origin}/verified`,
    },
  })
  return { data, error }
}

// Log in an existing user
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Log out the current user
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Send a password reset email
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}
