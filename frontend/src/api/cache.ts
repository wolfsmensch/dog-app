/** Last-good snapshots: reads fall back to these when the network fails. */
const PREFIX = 'dogapp:cache:v1:';

export function saveCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Storage full/blocked — offline cache is best effort.
  }
}

export function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return (JSON.parse(raw) as { data: T }).data;
  } catch {
    return null;
  }
}
