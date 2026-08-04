import { supabase } from './supabase';

// ==========================================
// 1. User Profiles & Auth Utilities
// ==========================================

export async function getProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw authError ?? new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ==========================================
// 2. Courses & Enrollments
// ==========================================

export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addCourse(course) {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select();
  if (error) throw error;
  return data;
}

export async function updateCourse(courseId, updates) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select();
  if (error) throw error;
  return data;
}

export async function updateCourseNotes(courseId, notes) {
  return updateCourse(courseId, { notes });
}

export async function updateCourseColor(courseId, color) {
  return updateCourse(courseId, { color });
}

export async function deleteCourse(courseId) {
  const { data, error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  if (error) throw error;
  return data;
}

export async function getCourseResources(courseId) {
  const { data, error } = await supabase
    .from('course_resources')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addCourseResource(resource) {
  const { data, error } = await supabase
    .from('course_resources')
    .insert([resource])
    .select();
  if (error) throw error;
  return data;
}

export async function deleteCourseResource(resourceId) {
  const { data, error } = await supabase
    .from('course_resources')
    .delete()
    .eq('id', resourceId);
  if (error) throw error;
  return data;
}

// ==========================================
// 3. Announcements & Assignments
// ==========================================

export async function getCampusEvents() {
  const { data, error } = await supabase
    .from('campus_events')
    .select('*')
    .order('event_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAnnouncements() {
  return getCampusEvents();
}

export async function getAssignments(profileId) {
  return getUpcomingDeadlines(profileId);
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

// ==========================================
// 4. Planner Events & Tasks
// ==========================================

export async function getPlannerCourses() {
  const { data, error } = await supabase
    .from('planner_courses')
    .select('*')
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addPlannerEvents(events) {
  const { data, error } = await supabase
    .from('planner_courses')
    .insert(events)
    .select();
  if (error) throw error;
  return data;
}

export async function updatePlannerEvent(eventId, updates) {
  const { data, error } = await supabase
    .from('planner_courses')
    .update(updates)
    .eq('id', eventId)
    .select();
  if (error) throw error;
  return data;
}

export async function toggleTaskComplete(taskId, completed) {
  return updatePlannerEvent(taskId, { completed });
}

export async function deletePlannerEvent(eventId) {
  const { data, error } = await supabase
    .from('planner_courses')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
  return data;
}

export async function deletePlannerSeries(groupId) {
  const { data, error } = await supabase
    .from('planner_courses')
    .delete()
    .eq('group_id', groupId);
  if (error) throw error;
  return data;
}
// ==========================================
// 5. Notifications
// ==========================================

export async function getNotificationsForCurrentUser() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw authError ?? new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      reminders (
        id,
        title,
        reminder_type,
        remind_at,
        status
      )
    `)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUnreadNotificationsForCurrentUser() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw authError ?? new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'unread')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}