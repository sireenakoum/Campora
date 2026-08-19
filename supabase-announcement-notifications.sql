-- Campora: notifications for important (pinned) announcements
-- Run this in Supabase dashboard -> SQL Editor -> New query, then Run.
--
-- Behaviour: whenever an announcement is inserted with is_pinned = true,
-- a notification row is created for EVERY student so it shows as unread in
-- the topbar + Notifications page. Non-pinned announcements are NOT notified.
--
-- The function is resilient to notifications table variants (with/without
-- a category column, and message vs content column).

create or replace function notify_important_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text := coalesce(new.title, 'Important campus announcement');
  v_message text := left(
    coalesce(nullif(new.content, ''), new.message, new.description, 'New announcement'),
    160
  );
begin
  if coalesce(new.is_pinned, false) then
    begin
      insert into notifications (user_id, title, message, category, read)
      select p.id, v_title, v_message, 'Announcements', false
      from profiles p
      where p.id is not null;
    exception when undefined_column then
      begin
        insert into notifications (user_id, title, message, read)
        select p.id, v_title, v_message, false
        from profiles p
        where p.id is not null;
      exception when undefined_column then
        insert into notifications (user_id, title, content, read)
        select p.id, v_title, v_message, false
        from profiles p
        where p.id is not null;
      end;
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_important_announcement_insert on announcements;

create trigger notify_important_announcement_insert
after insert on announcements
for each row
execute function notify_important_announcement();