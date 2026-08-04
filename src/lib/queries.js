import { supabase } from './supabase';

export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBriefingItems(profileId) {
  const { data, error } = await supabase
    .from('briefing_items')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTodayClasses(profileId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('profile_id', profileId)
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingDeadlines(profileId, limit = 4) {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('profile_id', profileId)
    .order('due_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getNextClass(profileId) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('profile_id', profileId)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getClassesInRange(profileId, start, end) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('profile_id', profileId)
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function getDeadlinesInRange(profileId, start, end) {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('profile_id', profileId)
    .gte('due_at', start.toISOString())
    .lte('due_at', end.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function getCampusEvents() {
  const { data, error } = await supabase
    .from('campus_events')
    .select('*')
    .order('event_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
