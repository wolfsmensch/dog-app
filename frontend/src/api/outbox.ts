/**
 * Offline mutation outbox: when a JSON mutation cannot reach the server
 * (offline or network error), it is stored here and replayed later in order.
 * Photo uploads are NOT queued (binary payloads don't fit localStorage well).
 */

export type MutationKind =
  | 'upsertWeight'
  | 'deleteWeight'
  | 'setToday'
  | 'createWalker'
  | 'updateWalker'
  | 'deleteWalker'
  | 'updatePet';

export interface OutboxEntry {
  id: string;
  ts: number;
  kind: MutationKind;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

const KEY = 'dogapp:outbox:v1';
const EVENT = 'dogapp:outbox-changed';

type Executor = (entry: OutboxEntry) => Promise<unknown>;
const executors = new Map<MutationKind, Executor>();

export function registerExecutor(kind: MutationKind, fn: Executor): void {
  executors.set(kind, fn);
}

function read(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as OutboxEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: OutboxEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Best effort.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function enqueue(kind: MutationKind, payload: unknown): OutboxEntry {
  const entry: OutboxEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: Date.now(),
    kind,
    payload,
  };
  write([...read(), entry]);
  return entry;
}

export function pendingCount(): number {
  return read().length;
}

export function subscribeOutbox(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** Replay queued mutations in FIFO order. Stops at the first failure. */
export async function flushOutbox(): Promise<{ done: number; left: number }> {
  let done = 0;
  for (;;) {
    const list = read();
    const next = list[0];
    if (!next) return { done, left: 0 };
    const exec = executors.get(next.kind);
    if (!exec) {
      write(list.slice(1));
      continue;
    }
    try {
      await exec(next);
    } catch {
      return { done, left: list.length };
    }
    write(read().filter((e) => e.id !== next.id));
    done += 1;
  }
}
