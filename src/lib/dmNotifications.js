import { supabase } from './supabase';

// Which DM conversation the user is currently looking at. The Study Groups
// page updates this so the global listener can avoid notifying for a message
// the user is already reading.
export const dmViewStatus = {
  viewingPartnerId: null
};

const getNotifiedKey = (userId) => `campora_dm_notified_${userId}`;

export function getDmNotifiedIds(userId) {
  try {
    const saved = localStorage.getItem(getNotifiedKey(userId));
    const parsed = saved ? JSON.parse(saved) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveDmNotifiedIds(userId, ids) {
  try {
    localStorage.setItem(getNotifiedKey(userId), JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage may be unavailable; notifications still work, just no dedup.
  }
}

export function stripDmMarker(content) {
  return String(content || '')
    .replace(/^\[\[CAMPORA_DM:[^\]]+\]\]/, '')
    .trim();
}

const senderNameCache = new Map();

export async function resolveSenderName(senderId) {
  if (!senderId) return 'a student';

  if (senderNameCache.has(senderId)) {
    return senderNameCache.get(senderId);
  }

  try {
    const { data, error } = await supabase.rpc('get_student_directory_by_ids', {
      user_ids: [senderId]
    });

    const profile = data && data[0];
    const name =
      profile?.name ||
      profile?.full_name ||
      profile?.email?.split('@')[0] ||
      'a student';

    senderNameCache.set(senderId, name);
    return name;
  } catch {
    return 'a student';
  }
}

async function insertDmNotification({ userId, senderId, senderName, content, createdAt }) {
  const title = `New direct message from ${senderName || 'a student'}`;
  const message = stripDmMarker(content) || 'Sent you a message';

  const payload = {
    user_id: userId,
    title,
    message,
    category: 'Study Groups',
    read: false,
    ...(senderId ? { sender_id: senderId } : {}),
    ...(createdAt ? { created_at: createdAt } : {})
  };

  let result = await supabase.from('notifications').insert([payload]);

  // Some versions of the notifications table may not have a category column.
  if (result.error && result.error.message?.toLowerCase().includes('category')) {
    const fallback = {
      user_id: userId,
      title,
      message,
      read: false,
      ...(senderId ? { sender_id: senderId } : {})
    };
    result = await supabase
      .from('notifications')
      .insert([createdAt ? { ...fallback, created_at: createdAt } : fallback]);
  }

  // Older schemas may use content instead of message.
  if (result.error && result.error.message?.toLowerCase().includes('message')) {
    const fallback = {
      user_id: userId,
      title,
      content: message,
      read: false,
      ...(senderId ? { sender_id: senderId } : {}),
      ...(createdAt ? { created_at: createdAt } : {})
    };
    result = await supabase.from('notifications').insert([fallback]);
  }

  if (result.error) {
    console.error('Could not create DM notification:', result.error);
  }

  return result;
}

/**
 * Create a notification for an unread incoming DM message, de-duplicated by
 * message id so the same message never produces more than one notification.
 */
export async function ensureDmNotification({ userId, message, senderName }) {
  if (!userId || !message || !message.id) return false;
  if (message.sender_id === userId) return false;

  const notified = getDmNotifiedIds(userId);
  if (notified.has(message.id)) return false;

  const name = senderName || (await resolveSenderName(message.sender_id));
  const result = await insertDmNotification({
    userId,
    senderId: message.sender_id,
    senderName: name,
    content: message.content,
    createdAt: message.created_at
  });

  if (!result.error) {
    notified.add(message.id);
    saveDmNotifiedIds(userId, notified);
    return true;
  }

  return false;
}

/**
 * Catch-up: create notifications for any messages the user received while the
 * app was closed. Called once when the user signs in.
 */
export async function catchUpUnreadDmNotifications(userId) {
  if (!userId) return;

  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('receiver_id', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return;

    const messages = Array.isArray(data) ? data : [];
    const notified = getDmNotifiedIds(userId);
    let changed = false;

    for (const message of messages) {
      if (message.sender_id === userId) continue;
      if (dmViewStatus.viewingPartnerId === message.sender_id) continue;
      if (notified.has(message.id)) continue;

      const senderName = await resolveSenderName(message.sender_id);
      const result = await insertDmNotification({
        userId,
        senderId: message.sender_id,
        senderName,
        content: message.content,
        createdAt: message.created_at
      });

      if (!result.error) {
        notified.add(message.id);
        changed = true;
      }
    }

    if (changed) {
      saveDmNotifiedIds(userId, notified);
    }
  } catch (error) {
    console.error('Could not catch up unread DM notifications:', error);
  }
}

/**
 * Best-effort: mark notifications from a sender as read when the user opens
 * that conversation.
 */
export async function markDmNotificationsRead({ userId, senderId, senderName }) {
  if (!userId || !senderId) return;

  try {
    let result = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('sender_id', senderId)
      .eq('read', false);

    // Fall back to title matching if the table has no sender_id column.
    if (result.error && result.error.message?.toLowerCase().includes('sender_id') && senderName) {
      result = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('title', `New direct message from ${senderName}`)
        .eq('read', false);
    }

    if (result.error) {
      console.error('Could not mark DM notifications read:', result.error);
    }
  } catch (error) {
    console.error('Could not mark DM notifications read:', error);
  }
}
