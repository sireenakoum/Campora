// Campora toast system
// Centralized + backwards-compatible with existing toast(...) calls.

let toasts = [];
let listeners = new Set();
let nextId = 1;

function getSourceFromPage(message, source) {
  if (source && source !== 'default') return source;

  const text = String(message || '').toLowerCase();
  if (text.includes('new message') || text.includes('direct message') || text.includes('received a message') || text.includes('message from')) return 'messages';
  if (text.includes('campus news')) return 'campus-news';
  if (text.includes('announcement')) return 'announcements';
  if (text.includes('study group')) return 'study-groups';
  if (text.includes('seat alert') || text.includes('registration')) return 'registration';
  if (text.includes('campus pulse')) return 'campus-pulse';
  if (text.includes('to-do') || text.includes('todo')) return 'todo';

  if (typeof window !== 'undefined') {
    const path = String(window.location.pathname || '').toLowerCase();
    if (path.includes('/campus-pulse')) return 'campus-pulse';
    if (path.includes('/registration')) return 'registration';
    if (path.includes('/planner')) return 'planner';
    if (path.includes('/courses')) return 'courses';
    if (path.includes('/study-groups')) return 'study-groups';
    if (path.includes('/todo')) return 'todo';
    if (path.includes('/messages')) return 'messages';
    if (path.includes('/announcements')) return 'announcements';
  }
  return 'default';
}

export function toast(message, kind = 'success', duration = 3500, source = 'default') {
  if (kind && typeof kind === 'object') {
    const options = kind;
    kind = options.kind || 'success';
    duration = typeof options.duration === 'number' ? options.duration : 3500;
    source = options.source || 'default';
  }

  const item = {
    id: nextId++,
    message,
    kind,
    source: getSourceFromPage(message, source),
  };

  toasts = [...toasts, item];
  emit();
  setTimeout(() => dismiss(item.id), duration);
  return item.id;
}

export function toastNotification(message, options = {}) {
  return toast(message, { ...options, kind: 'notification' });
}

export function toastReminder(message, options = {}) {
  return toast(message, { ...options, kind: 'reminder' });
}

export function toastBoth({
  notificationMessage = 'Notification set.',
  reminderMessage = 'Reminder set.',
  source = 'default',
  duration = 3500,
} = {}) {
  const first = toast(notificationMessage, { source, kind: 'notification', duration });
  const second = toast(reminderMessage, { source, kind: 'reminder', duration });
  return [first, second];
}

export function dismiss(id) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function getToasts() { return toasts; }

function emit() { listeners.forEach((listener) => listener(toasts)); }

export function subscribeToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}