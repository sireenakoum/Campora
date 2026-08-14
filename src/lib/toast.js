// Minimal pub/sub toast system (no extra deps).
let toasts = [];
let listeners = new Set();
let nextId = 1;

export function toast(message, kind = 'success', duration = 3500) {
  const item = { id: nextId++, message, kind };
  toasts = [...toasts, item];
  emit();
  setTimeout(() => dismiss(item.id), duration);
}

export function dismiss(id) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function getToasts() {
  return toasts;
}

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function subscribeToasts(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}