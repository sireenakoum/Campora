import { supabase } from './supabase';

export async function createDirectMessageConversation(otherUserId) {
  const { data, error } = await supabase.rpc('create_dm', {
    other_user_id: otherUserId,
  });

  if (error) {
    console.error('create_dm error:', error);
    throw error;
  }

  return data;
}