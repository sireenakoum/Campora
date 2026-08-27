-- Campora: admin user deactivation
-- Run this in Supabase dashboard -> SQL Editor -> New query, then Run.
-- Safe to re-run: every statement is guarded or uses drop-if-exists + create.
--
-- What this does:
--   1. Adds deactivation columns to profiles.
--   2. Adds helper functions (admin check + deactivated check).
--   3. Lets campora_admins members deactivate/reactivate users (and nothing
--      else on other people's profiles, enforced by a trigger guard).
--   4. Blocks deactivated users from writing data anywhere the repo defines
--      write policies (reads stay open so the app can detect the flag at
--      login and sign the user out with a clear message).

-- Helper: run a statement only if the table exists (some tables here are
-- created in the dashboard and may be missing on fresh projects). Must be
-- created before any of the guarded sections below.
create or replace function public.__run_if_table(target text, stmt text)
returns void
language plpgsql
as $$
begin
  if to_regclass(target) is not null then
    execute stmt;
  end if;
end;
$$;

-- -----------------------------------------------------------------------
-- 1) Deactivation columns on profiles
-- -----------------------------------------------------------------------
alter table public.profiles add column if not exists is_deactivated boolean not null default false;
alter table public.profiles add column if not exists deactivated_at timestamptz;
alter table public.profiles add column if not exists deactivated_by uuid references public.profiles (id) on delete set null;

create index if not exists profiles_is_deactivated_idx
  on public.profiles (is_deactivated);

-- -----------------------------------------------------------------------
-- 2) Helper functions
--    security definer so they bypass RLS on profiles / campora_admins
--    (avoids recursion) while still scoping to auth.uid().
-- -----------------------------------------------------------------------
create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.campora_admins a
    where a.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_is_deactivated()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select p.is_deactivated
    from public.profiles p
    where p.id = auth.uid()
  ), false);
$$;

-- -----------------------------------------------------------------------
-- 3) Admin policy + guard trigger on profiles
-- -----------------------------------------------------------------------
-- Admins may update any profile row; the trigger below restricts what an
-- admin (who is not the row owner) is allowed to change.
drop policy if exists "Admins can manage user status" on public.profiles;
create policy "Admins can manage user status"
  on public.profiles for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Columns an admin may change on somebody else's profile.
-- Anyone updating their OWN row is unaffected (normal self-edit flow).
create or replace function public.guard_profile_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed text[] := '{}';
begin
  -- Deactivated users can never lift their own flag back.
  if auth.uid() = new.id
     and old.is_deactivated
     and not new.is_deactivated then
    raise exception 'A deactivated account cannot reactivate itself.';
  end if;

  if auth.uid() = new.id then
    return new; -- self-update: existing owner policies already scope this.
  end if;

  -- From here on the updater is editing somebody else's row (admin path).
  if coalesce(old.name, '') is distinct from coalesce(new.name, '') then
    changed := changed || 'name';
  end if;
  if coalesce(old.role, '') is distinct from coalesce(new.role, '') then
    changed := changed || 'role';
  end if;
  if coalesce(old.avatar_url, '') is distinct from coalesce(new.avatar_url, '') then
    changed := changed || 'avatar_url';
  end if;
  if old.gpa is distinct from new.gpa
    or old.credit_hours is distinct from new.credit_hours
    or old.standing_percent is distinct from new.standing_percent
    or coalesce(old.account_type, '') is distinct from coalesce(new.account_type, '')
    or coalesce(old.major, '') is distinct from coalesce(new.major, '')
    or coalesce(old.year, '') is distinct from coalesce(new.year, '')
    or old.courses_taken is distinct from new.courses_taken
    or old.onboarding_completed is distinct from new.onboarding_completed
    or coalesce(old.guest_title, '') is distinct from coalesce(new.guest_title, '')
    or old.credits_percent is distinct from new.credits_percent
    or old.attendance_percent is distinct from new.attendance_percent
    or old.friends_online is distinct from new.friends_online then
    changed := changed || 'academic_fields';
  end if;

  if array_length(changed, 1) > 0 then
    raise exception 'Admins may only change the account status fields, tried to change: %',
      array_to_string(changed, ', ');
  end if;

  -- Admins cannot deactivate (or modify) other admins.
  if new.is_deactivated and exists (
    select 1 from public.campora_admins a where a.user_id = new.id
  ) then
    raise exception 'Admin accounts cannot be deactivated.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_status_update on public.profiles;
create trigger on_profile_status_update
  before update on public.profiles
  for each row execute procedure public.guard_profile_status_update();

-- -----------------------------------------------------------------------
-- 4) Block writes from deactivated users
--    Recreates the repo-defined write policies with an extra
--    "not deactivated" condition. Select policies are untouched so the
--    app can read the flag right after login and sign the user out.
--    NOTE: tables created in the dashboard (study_groups, group_messages,
--    mentor_profiles, announcements) need the same treatment there if you
--    want their writes blocked too.
-- -----------------------------------------------------------------------

-- profiles: users can no longer edit their own profile while deactivated.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id and not public.current_user_is_deactivated()) with check (auth.uid() = id);

-- Helper: run a statement only if the table exists (some tables here are
-- created in the dashboard and may be missing on fresh projects).
create or replace function public.__run_if_table(target text, stmt text)
returns void
language plpgsql
as $$
begin
  if to_regclass(target) is not null then
    execute stmt;
  end if;
end;
$$;

-- classes
select public.__run_if_table(
  'public.classes',
  $stmt$
  drop policy if exists "Users can create own classes" on public.classes;
  create policy "Users can create own classes" on public.classes for insert to authenticated with check (auth.uid() = profile_id and not public.current_user_is_deactivated());
  drop policy if exists "Users can update own classes" on public.classes;
  create policy "Users can update own classes" on public.classes for update to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated()) with check (auth.uid() = profile_id);
  drop policy if exists "Users can delete own classes" on public.classes;
  create policy "Users can delete own classes" on public.classes for delete to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated());
  $stmt$
);

-- deadlines
select public.__run_if_table(
  'public.deadlines',
  $stmt$
  drop policy if exists "Users can create own deadlines" on public.deadlines;
  create policy "Users can create own deadlines" on public.deadlines for insert to authenticated with check (auth.uid() = profile_id and not public.current_user_is_deactivated());
  drop policy if exists "Users can update own deadlines" on public.deadlines;
  create policy "Users can update own deadlines" on public.deadlines for update to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated()) with check (auth.uid() = profile_id);
  drop policy if exists "Users can delete own deadlines" on public.deadlines;
  create policy "Users can delete own deadlines" on public.deadlines for delete to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated());
  $stmt$
);

-- briefing items
select public.__run_if_table(
  'public.briefing_items',
  $stmt$
  drop policy if exists "Users can create own briefing items" on public.briefing_items;
  create policy "Users can create own briefing items" on public.briefing_items for insert to authenticated with check (auth.uid() = profile_id and not public.current_user_is_deactivated());
  drop policy if exists "Users can update own briefing items" on public.briefing_items;
  create policy "Users can update own briefing items" on public.briefing_items for update to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated()) with check (auth.uid() = profile_id);
  drop policy if exists "Users can delete own briefing items" on public.briefing_items;
  create policy "Users can delete own briefing items" on public.briefing_items for delete to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated());
  $stmt$
);

-- reminders
select public.__run_if_table(
  'public.reminders',
  $stmt$
  drop policy if exists "Users can create own reminders" on public.reminders;
  create policy "Users can create own reminders" on public.reminders for insert to authenticated with check (auth.uid() = profile_id and not public.current_user_is_deactivated());
  drop policy if exists "Users can update own reminders" on public.reminders;
  create policy "Users can update own reminders" on public.reminders for update to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated()) with check (auth.uid() = profile_id);
  drop policy if exists "Users can delete own reminders" on public.reminders;
  create policy "Users can delete own reminders" on public.reminders for delete to authenticated using (auth.uid() = profile_id and not public.current_user_is_deactivated());
  $stmt$
);

-- notifications
select public.__run_if_table(
  'public.notifications',
  $stmt$
  drop policy if exists "Users can create own notifications" on public.notifications;
  create policy "Users can create own notifications" on public.notifications for insert to authenticated with check (auth.uid() IS NOT NULL and not public.current_user_is_deactivated());
  drop policy if exists "Users can update own notifications" on public.notifications;
  create policy "Users can update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id and not public.current_user_is_deactivated()) with check (auth.uid() = user_id);
  drop policy if exists "Users can delete own notifications" on public.notifications;
  create policy "Users can delete own notifications" on public.notifications for delete to authenticated using (auth.uid() = user_id and not public.current_user_is_deactivated());
  $stmt$
);

-- direct messages
select public.__run_if_table(
  'public.direct_messages',
  $stmt$
  drop policy if exists "Users can send DMs" on public.direct_messages;
  create policy "Users can send DMs" on public.direct_messages for insert to authenticated with check (auth.uid() = sender_id and not public.current_user_is_deactivated());
  drop policy if exists "Recipient can mark DMs read" on public.direct_messages;
  create policy "Recipient can mark DMs read" on public.direct_messages for update to authenticated using (auth.uid() = receiver_id and not public.current_user_is_deactivated()) with check (auth.uid() = receiver_id);
  drop policy if exists "Users can delete own DMs" on public.direct_messages;
  create policy "Users can delete own DMs" on public.direct_messages for delete to authenticated using (auth.uid() = sender_id and not public.current_user_is_deactivated());
  $stmt$
);

-- legacy messages table
select public.__run_if_table(
  'public.messages',
  $stmt$
  drop policy if exists "Users can only insert their own messages" on public.messages;
  create policy "Users can only insert their own messages" on public.messages for insert with check (auth.uid() = sender_id and not public.current_user_is_deactivated());
  drop policy if exists "Users can only delete their own messages" on public.messages;
  create policy "Users can only delete their own messages" on public.messages for delete using (auth.uid() = sender_id and not public.current_user_is_deactivated());
  $stmt$
);

-- message reports: deactivated users cannot file new reports.
select public.__run_if_table(
  'public.message_reports',
  $stmt$
  drop policy if exists "Students can report a message" on public.message_reports;
  create policy "Students can report a message"
    on public.message_reports for insert
    to authenticated
    with check (auth.uid() = reporter_id and not public.current_user_is_deactivated());
  $stmt$
);

drop function public.__run_if_table(text, text);
