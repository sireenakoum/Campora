-- Campora dashboard schema
-- Run this in the Supabase SQL editor for project rupvcrpwokzvjutiootp.
-- Safe to re-run: table/column creation uses "if not exists" and every
-- seed insert is guarded so re-running this file never creates duplicates.

create extension if not exists "pgcrypto";

-- profiles uses its own generated UUID. The handle_new_user trigger
-- inserts with id = new.id so real auth users are linked by their auth UUID.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Student',
  avatar_url text,
  credits_percent int not null default 0,
  attendance_percent int not null default 0,
  friends_online int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Academic-standing fields used by the Course Management page.
alter table profiles add column if not exists gpa numeric(3, 2) not null default 0;
alter table profiles add column if not exists credit_hours int not null default 0;
alter table profiles add column if not exists standing_percent int not null default 0;

-- Onboarding fields collected on the post-signup onboarding page.
alter table profiles add column if not exists account_type text not null default 'Student';
alter table profiles add column if not exists major text;
alter table profiles add column if not exists year text;
alter table profiles add column if not exists courses_taken jsonb not null default '[]'::jsonb;
alter table profiles add column if not exists onboarding_completed boolean not null default false;

-- Guest accounts store their title (e.g. "Alumni") separately from a student's
-- academic year, which lives in `year`.
alter table profiles add column if not exists guest_title text;
-- One-time backfill: older versions stored the guest title in `year`.
update profiles
set guest_title = year, year = null
where account_type = 'Guest' and guest_title is null and year is not null;

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  professor text,
  location text,
  icon text not null default 'auto_stories',
  join_type text not null default 'none' check (join_type in ('video', 'map', 'none')),
  join_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  tag text not null,
  tag_style text not null default 'secondary' check (tag_style in ('error', 'secondary')),
  percent_complete int not null default 0,
  due_at timestamptz not null
);

create table if not exists briefing_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('unread', 'urgent')),
  label text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists campus_events (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  image_url text,
  event_date timestamptz not null default now()
);

create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric(10, 2) not null,
  image_url text,
  seller_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- User courses: seeded from the onboarding selection, then managed in the
-- Course Management page. `profile_id` scopes courses to their owner.
-- (If the hosted DB already has these tables, the alter below just adds
-- the ownership column.)
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  color text not null default '#E0F2FE',
  notes text,
  created_at timestamptz not null default now()
);
alter table courses add column if not exists profile_id uuid references profiles(id) on delete cascade;

create table if not exists course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);
-- -----------------------------------------------------------------------
-- REMINDERS
-- Stores reminders created from classes, deadlines, events, or personal tasks.
-- -----------------------------------------------------------------------
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,

  title text not null,
  description text,

  reminder_type text not null
    check (reminder_type in (
      'class',
      'assignment',
      'exam',
      'deadline',
      'event',
      'personal'
    )),

  source_id uuid,
  remind_at timestamptz not null,

  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------
-- NOTIFICATIONS
-- Stores in-app alerts (courses, campus pulse, direct messages, etc.).
-- The live app reads/writes these via `user_id`, `read` and `category`;
-- `sender_id` is set for direct-message alerts so read-state can be
-- cleared reliably when a conversation is opened.
-- -----------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text,
  category text,
  read boolean not null default false,
  sender_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Upgrade guards so re-runs are safe on every database shape.
alter table notifications add column if not exists user_id uuid references profiles(id) on delete cascade;
alter table notifications add column if not exists title text;
alter table notifications add column if not exists message text;
alter table notifications add column if not exists category text;
alter table notifications add column if not exists read boolean not null default false;
alter table notifications add column if not exists sender_id uuid references profiles(id) on delete set null;

-- Migrate away from the legacy profile_id/status/read_at design: point any
-- old rows at user_id, then remove the unused columns and indexes.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'notifications' and column_name = 'profile_id'
  ) then
    update notifications set user_id = profile_id
    where user_id is null and profile_id is not null;
  end if;
end
$$;
alter table notifications drop column if exists profile_id;
alter table notifications drop column if exists reminder_id;
alter table notifications drop column if exists status;
alter table notifications drop column if exists sent_at;
alter table notifications drop column if exists read_at;
drop index if exists notifications_profile_id_idx;
drop index if exists notifications_status_idx;
-- Every notification belongs to exactly one user.
alter table notifications alter column user_id set not null;

-- Indexes improve notification lookups for each student.
create index if not exists reminders_profile_id_idx
  on reminders(profile_id);

create index if not exists reminders_remind_at_idx
  on reminders(remind_at);

create index if not exists notifications_user_id_idx
  on notifications(user_id);

create index if not exists notifications_read_idx
  on notifications(read);

create index if not exists notifications_sender_id_idx
  on notifications(sender_id);
-- Row Level Security: the frontend reads directly with the anon key, so
-- RLS is on with a public read policy on every table it queries.
alter table profiles enable row level security;
alter table classes enable row level security;
alter table deadlines enable row level security;
alter table briefing_items enable row level security;
alter table campus_events enable row level security;
alter table marketplace_listings enable row level security;
alter table reminders enable row level security;
alter table notifications enable row level security;
drop policy if exists "Public read" on profiles;
create policy "Public read" on profiles for select using (true);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Public read" on classes;
create policy "Public read" on classes for select using (true);
drop policy if exists "Public read" on deadlines;
create policy "Public read" on deadlines for select using (true);
drop policy if exists "Public read" on briefing_items;
create policy "Public read" on briefing_items for select using (true);
-- Dashboard editing: each user manages their own classes, deadlines and
-- briefing items from the dashboard cards.
drop policy if exists "Users can create own classes" on classes;
create policy "Users can create own classes" on classes for insert to authenticated with check (auth.uid() = profile_id);
drop policy if exists "Users can update own classes" on classes;
create policy "Users can update own classes" on classes for update to authenticated using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
drop policy if exists "Users can delete own classes" on classes;
create policy "Users can delete own classes" on classes for delete to authenticated using (auth.uid() = profile_id);

drop policy if exists "Users can create own deadlines" on deadlines;
create policy "Users can create own deadlines" on deadlines for insert to authenticated with check (auth.uid() = profile_id);
drop policy if exists "Users can update own deadlines" on deadlines;
create policy "Users can update own deadlines" on deadlines for update to authenticated using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
drop policy if exists "Users can delete own deadlines" on deadlines;
create policy "Users can delete own deadlines" on deadlines for delete to authenticated using (auth.uid() = profile_id);

drop policy if exists "Users can create own briefing items" on briefing_items;
create policy "Users can create own briefing items" on briefing_items for insert to authenticated with check (auth.uid() = profile_id);
drop policy if exists "Users can update own briefing items" on briefing_items;
create policy "Users can update own briefing items" on briefing_items for update to authenticated using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
drop policy if exists "Users can delete own briefing items" on briefing_items;
create policy "Users can delete own briefing items" on briefing_items for delete to authenticated using (auth.uid() = profile_id);
drop policy if exists "Public read" on campus_events;
create policy "Public read" on campus_events for select using (true);
drop policy if exists "Public read" on marketplace_listings;
create policy "Public read" on marketplace_listings for select using (true);
-- Students can only access their own reminders.
drop policy if exists "Users can read own reminders" on reminders;
create policy "Users can read own reminders"
on reminders
for select
to authenticated
using (auth.uid() = profile_id);

drop policy if exists "Users can create own reminders" on reminders;
create policy "Users can create own reminders"
on reminders
for insert
to authenticated
with check (auth.uid() = profile_id);

drop policy if exists "Users can update own reminders" on reminders;
create policy "Users can update own reminders"
on reminders
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "Users can delete own reminders" on reminders;
create policy "Users can delete own reminders"
on reminders
for delete
to authenticated
using (auth.uid() = profile_id);

-- Students can only access their own notifications.
drop policy if exists "Users can read own notifications" on notifications;
create policy "Users can read own notifications"
on notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own notifications" on notifications;
create policy "Users can create own notifications"
on notifications
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
on notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on notifications;
create policy "Users can delete own notifications"
on notifications
for delete
to authenticated
using (auth.uid() = user_id);
-- -----------------------------------------------------------------------
-- DIRECT MESSAGES: READ RECEIPTS
-- The direct_messages table itself is created in the Supabase dashboard.
-- This adds read-receipt tracking so the sender can see when the
-- recipient has opened the conversation.
-- -----------------------------------------------------------------------
alter table direct_messages add column if not exists read_at timestamptz;
create index if not exists direct_messages_read_at_idx
  on direct_messages(read_at);

-- RLS policies for direct_messages (inert unless RLS is enabled on the
-- table, drop+create keeps re-runs idempotent). These mirror the read,
-- insert and delete operations the app already performs.
drop policy if exists "Users can read their DM conversations" on direct_messages;
create policy "Users can read their DM conversations"
  on direct_messages
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send DMs" on direct_messages;
create policy "Users can send DMs"
  on direct_messages
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "Recipient can mark DMs read" on direct_messages;
create policy "Recipient can mark DMs read"
  on direct_messages
  for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop policy if exists "Users can delete own DMs" on direct_messages;
create policy "Users can delete own DMs"
  on direct_messages
  for delete
  to authenticated
  using (auth.uid() = sender_id);

-- -----------------------------------------------------------------------
-- REALTIME PUBLICATION
-- The app streams rows for messaging and notifications. Add them to the
-- realtime publication (idempotent) so fresh setups work without manual
-- dashboard steps.
-- -----------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['direct_messages', 'group_messages', 'notifications']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end
$$;

-- -----------------------------------------------------------------------
-- TRIGGER: Automatically create a profile row when a user signs up.
-- Reads `full_name` from raw_user_meta_data (matches what SignUp.jsx sends).
-- Falls back to the email prefix if full_name is missing.
-- -----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)   -- fallback: use email prefix
    )
  );
  return new;
end;
$$;

-- Drop and recreate so the trigger stays up to date on re-runs.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------
-- Seed data for the global tables (announcements & marketplace).
-- Each insert is guarded so re-running this file never duplicates rows.
-- -----------------------------------------------------------------------
insert into campus_events (category, title, description, image_url, event_date)
select v.category, v.title, v.description, null::text, now()
from (values
  ('Career Center', 'Tech Internship Fair 2024', 'Meet recruiters from Google, Meta, and Tesla'),
  ('Student Life', 'Outdoor Cinema Night', 'Join us for ''Interstellar'' under the stars')
) as v(category, title, description)
where not exists (select 1 from campus_events e where e.title = v.title);

insert into marketplace_listings (title, price, image_url)
select v.title, v.price, null::text
from (values
  ('MacBook Air M2', 850.00),
  ('Arch. Textbooks', 120.00)
) as v(title, price)
where not exists (select 1 from marketplace_listings m where m.title = v.title);
