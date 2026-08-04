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
-- Stores alerts generated from reminders for each student.
-- -----------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  reminder_id uuid references reminders(id) on delete cascade,

  title text not null,
  message text not null,

  status text not null default 'unread'
    check (status in ('unread', 'read')),

  sent_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes improve notification and reminder lookups for each student.
create index if not exists reminders_profile_id_idx
  on reminders(profile_id);

create index if not exists reminders_remind_at_idx
  on reminders(remind_at);

create index if not exists notifications_profile_id_idx
  on notifications(profile_id);

create index if not exists notifications_status_idx
  on notifications(status);
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
using (auth.uid() = profile_id);

drop policy if exists "Users can create own notifications" on notifications;
create policy "Users can create own notifications"
on notifications
for insert
to authenticated
with check (auth.uid() = profile_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
on notifications
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "Users can delete own notifications" on notifications;
create policy "Users can delete own notifications"
on notifications
for delete
to authenticated
using (auth.uid() = profile_id);
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
