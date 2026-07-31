-- Campora dashboard schema
-- Run this in the Supabase SQL editor for project rupvcrpwokzvjutiootp.
-- Safe to re-run: uses "create table if not exists".

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Student',
  avatar_url text,
  credits_percent int not null default 0,
  attendance_percent int not null default 0,
  friends_online int not null default 0,
  created_at timestamptz not null default now()
);

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

-- Row Level Security: the backend reads with the service role key (bypasses RLS),
-- but enable RLS + a public read policy so the tables are safe if ever queried
-- with the anon key directly.
alter table profiles enable row level security;
alter table classes enable row level security;
alter table deadlines enable row level security;
alter table briefing_items enable row level security;
alter table campus_events enable row level security;
alter table marketplace_listings enable row level security;

drop policy if exists "Public read" on profiles;
create policy "Public read" on profiles for select using (true);
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

-- Seed data mirroring the dashboard's current mock content, so the UI looks
-- the same once wired up to real queries.
with seeded_profile as (
  insert into profiles (name, role, credits_percent, attendance_percent, friends_online)
  values ('Lara', 'Senior Year', 75, 92, 12)
  returning id
)
insert into classes (profile_id, title, professor, location, icon, join_type, join_url, starts_at, ends_at)
select id, 'Advanced Architecture', 'Prof. Julian Vane', 'Building 4, Room 202', 'architecture', 'video', '#',
       date_trunc('day', now()) + interval '9 hours', date_trunc('day', now()) + interval '10 hours 30 minutes'
from seeded_profile
union all
select id, 'Algorithm Design', 'Dr. Sarah Chen', 'Engineering Wing', 'code', 'map', '#',
       date_trunc('day', now()) + interval '13 hours', date_trunc('day', now()) + interval '14 hours 30 minutes'
from seeded_profile;

insert into deadlines (profile_id, title, tag, tag_style, percent_complete, due_at)
select id, 'Physics Lab Report', 'High', 'error', 80, date_trunc('day', now()) + interval '18 hours'
from profiles where name = 'Lara'
union all
select id, 'Art History Essay', 'Medium', 'secondary', 35, date_trunc('day', now()) + interval '1 day 9 hours'
from profiles where name = 'Lara';

insert into briefing_items (profile_id, type, label, body)
select id, 'unread', 'Unread', '4 emails from Prof. Aris regarding the final thesis structure.'
from profiles where name = 'Lara'
union all
select id, 'urgent', 'Urgent', 'Physics lab report is due in 6 hours. You''ve completed 80%.'
from profiles where name = 'Lara';

insert into campus_events (category, title, description, image_url, event_date)
values
  ('Career Center', 'Tech Internship Fair 2024', 'Meet recruiters from Google, Meta, and Tesla', null, now()),
  ('Student Life', 'Outdoor Cinema Night', 'Join us for ''Interstellar'' under the stars', null, now());

insert into marketplace_listings (title, price, image_url)
values
  ('MacBook Air M2', 850.00, null),
  ('Arch. Textbooks', 120.00, null);
