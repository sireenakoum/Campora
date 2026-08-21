// Campora toast system
// Backwards-compatible with your original toast.js

let toasts = [];
let listeners = new Set();
let nextId = 1;

function getSourceFromPage(message, source) {
  if (source && source !== 'default') {
    return source;
  }

  const text = String(message || '').toLowerCase();

  // Message-specific cases
  if (
    text.includes('new message') ||
    text.includes('direct message') ||
    text.includes('received a message') ||
    text.includes('message from')
  ) {
    return 'messages';
  }

  // Message content can identify some sources
  if (text.includes('campus news')) return 'campus-news';
  if (text.includes('announcement')) return 'announcements';
  if (text.includes('study group')) return 'study-groups';
  if (text.includes('seat alert') || text.includes('registration')) return 'registration';
  if (text.includes('campus pulse')) return 'campus-pulse';
  if (text.includes('to-do') || text.includes('todo')) return 'todo';

  // Otherwise use the current page
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

export function toast(
  message,
  kind = 'success',
  duration = 3500,
  source = 'default'
) {
  // Also supports:
  // toast('Hello', { source: 'planner', kind: 'success' })
  if (kind && typeof kind === 'object') {
    const options = kind;

    kind = options.kind || 'success';
    duration =
      typeof options.duration === 'number'
        ? options.duration
        : 3500;
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

  setTimeout(() => {
    dismiss(item.id);
  }, duration);
}

export function dismiss(id) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function getToasts() {
  return toasts;
}

function emit() {
  listeners.forEach((listener) => {
    listener(toasts);
  });
}

export function subscribeToasts(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}