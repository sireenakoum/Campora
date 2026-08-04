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
  created_at timestamptz not null default now()
);

-- Academic-standing fields used by the Course Management page.
alter table profiles add column if not exists gpa numeric(3, 2) not null default 0;
alter table profiles add column if not exists credit_hours int not null default 0;
alter table profiles add column if not exists standing_percent int not null default 0;

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

-- Row Level Security: the frontend reads directly with the anon key, so
-- RLS is on with a public read policy on every table it queries.
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
-- Seed data mirroring the dashboard's original mock content, so the UI
-- looks the same once wired up to real queries. Each insert is guarded
-- so re-running this file never duplicates rows.
-- -----------------------------------------------------------------------
insert into profiles (id, name, role, credits_percent, attendance_percent, friends_online, gpa, credit_hours, standing_percent)
select gen_random_uuid(), 'Lara', 'Senior Year', 75, 92, 12, 3.92, 22, 85
where not exists (select 1 from profiles where name = 'Lara');

-- Backfill for rows created before gpa/credit_hours/standing_percent existed.
update profiles set gpa = 3.92, credit_hours = 22, standing_percent = 85
where name = 'Lara' and gpa = 0 and credit_hours = 0 and standing_percent = 0;

insert into classes (profile_id, title, professor, location, icon, join_type, join_url, starts_at, ends_at)
select p.id, v.title, v.professor, v.location, v.icon, v.join_type, v.join_url,
       date_trunc('day', now()) + v.start_offset, date_trunc('day', now()) + v.end_offset
from profiles p
cross join (values
  ('Advanced Architecture', 'Prof. Julian Vane', 'Building 4, Room 202', 'architecture', 'video', '#', interval '9 hours', interval '10 hours 30 minutes'),
  ('Algorithm Design', 'Dr. Sarah Chen', 'Engineering Wing', 'code', 'map', '#', interval '13 hours', interval '14 hours 30 minutes')
) as v(title, professor, location, icon, join_type, join_url, start_offset, end_offset)
where p.name = 'Lara'
  and not exists (select 1 from classes c where c.profile_id = p.id);

insert into deadlines (profile_id, title, tag, tag_style, percent_complete, due_at)
select p.id, v.title, v.tag, v.tag_style, v.percent_complete, date_trunc('day', now()) + v.due_offset
from profiles p
cross join (values
  ('Physics Lab Report', 'High', 'error', 80, interval '18 hours'),
  ('Art History Essay', 'Medium', 'secondary', 35, interval '1 day 9 hours')
) as v(title, tag, tag_style, percent_complete, due_offset)
where p.name = 'Lara'
  and not exists (select 1 from deadlines d where d.profile_id = p.id);

insert into briefing_items (profile_id, type, label, body)
select p.id, v.type, v.label, v.body
from profiles p
cross join (values
  ('unread', 'Unread', '4 emails from Prof. Aris regarding the final thesis structure.'),
  ('urgent', 'Urgent', 'Physics lab report is due in 6 hours. You''ve completed 80%.')
) as v(type, label, body)
where p.name = 'Lara'
  and not exists (select 1 from briefing_items b where b.profile_id = p.id);

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
