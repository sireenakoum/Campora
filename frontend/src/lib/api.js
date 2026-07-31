import { supabase } from "./supabaseClient";

const PROFILE_COLUMNS = "id, name, role, avatar_url, credits_percent, attendance_percent, friends_online";

export async function fetchDashboard(studentId) {
  let profileQuery = supabase.from("profiles").select(PROFILE_COLUMNS);
  profileQuery = studentId
    ? profileQuery.eq("id", studentId)
    : profileQuery.order("created_at", { ascending: true }).limit(1);

  const { data: profile, error: profileError } = await profileQuery.maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("No profile found. Have you run supabase/schema.sql in your Supabase project?");

  const [classes, deadlines, briefingItems, campusEvents, marketplaceListings] = await Promise.all([
    supabase
      .from("classes")
      .select("id, title, professor, location, icon, join_type, join_url, starts_at, ends_at")
      .eq("profile_id", profile.id)
      .order("starts_at", { ascending: true }),
    supabase
      .from("deadlines")
      .select("id, title, tag, tag_style, percent_complete, due_at")
      .eq("profile_id", profile.id)
      .order("due_at", { ascending: true }),
    supabase.from("briefing_items").select("id, type, label, body").eq("profile_id", profile.id),
    supabase
      .from("campus_events")
      .select("id, category, title, description, image_url, event_date")
      .order("event_date", { ascending: true }),
    supabase
      .from("marketplace_listings")
      .select("id, title, price, image_url")
      .order("created_at", { ascending: false }),
  ]);

  const firstError = [classes, deadlines, briefingItems, campusEvents, marketplaceListings].find((r) => r.error);
  if (firstError) throw new Error(firstError.error.message);

  return {
    profile,
    classes: classes.data,
    deadlines: deadlines.data,
    briefingItems: briefingItems.data,
    campusEvents: campusEvents.data,
    marketplaceListings: marketplaceListings.data,
  };
}
