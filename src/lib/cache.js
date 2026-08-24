// Tiny in-memory stale-while-revalidate cache.
//
// Navigating between pages remounts components, which used to refetch
// everything from Supabase on every visit. Pages now peek at the cache
// for an instant paint and then revalidate through cachedFetch: fresh
// entries are served without a network call, stale ones trigger a quiet
// background refresh so new data still shows up.

const store = new Map();

export const peekCache = (key) => {
  const entry = store.get(key);
  return entry && entry.data !== undefined ? entry.data : null;
};

export function cachedFetch(key, ttlMs, fetcher) {
  const entry = store.get(key);

  if (
    entry &&
    entry.data !== undefined &&
    Date.now() - entry.at < ttlMs
  ) {
    return Promise.resolve(entry.data);
  }

  // Deduplicate concurrent requests for the same key.
  if (entry && entry.promise) {
    return entry.promise;
  }

  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      store.set(key, { data, at: Date.now(), promise: null });
      return data;
    })
    .catch((error) => {
      const current = store.get(key);
      if (current && current.promise === promise) {
        store.set(key, { ...current, promise: null });
      }
      throw error;
    });

  store.set(key, { ...(entry || {}), data: entry?.data, at: entry?.at ?? 0, promise });

  return promise;
}

export const putCache = (key, data) => {
  store.set(key, { data, at: Date.now(), promise: null });
};

export const clearCache = (...keys) => {
  if (!keys.length) {
    store.clear();
    return;
  }
  for (const key of keys) {
    store.delete(key);
  }
};

export const invalidatePrefix = (prefix) => {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
};
