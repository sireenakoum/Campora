-- Campora: message reporting support
-- Run this in Supabase dashboard -> SQL Editor -> New query, then Run.
-- NOTE: this DROPS an existing message_reports table so its schema exactly
-- matches what the app inserts/reads. No reports are stored yet in normal use.

drop table if exists public.message_reports cascade;

-- 1) Table: one row per message that a student reported.
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  message_type text not null
    check (message_type in ('dm', 'group', 'custom-group')),
  content text,
  sender_id uuid references public.profiles (id) on delete set null,
  receiver_id uuid references public.profiles (id) on delete set null,
  group_id uuid,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2) Indexes for the admin queue and dedupe lookups.
create index if not exists message_reports_status_idx
  on public.message_reports (status, created_at desc);
create index if not exists message_reports_message_idx
  on public.message_reports (message_id);

-- 3) Row Level Security.
alter table public.message_reports enable row level security;

-- Students can report messages (insert) and see their own reports.
create policy "Students can report a message"
  on public.message_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "Reporters can read their own reports"
  on public.message_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- Admins (campora_admins table) can read and resolve all reports.
create policy "Admins can read all reports"
  on public.message_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.campora_admins a
      where a.user_id = auth.uid()
    )
  );

create policy "Admins can resolve reports"
  on public.message_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.campora_admins a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.campora_admins a
      where a.user_id = auth.uid()
    )
  );