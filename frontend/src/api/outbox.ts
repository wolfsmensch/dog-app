/**
 * Offline mutation outbox: when a JSON mutation cannot reach the server
 * (offline or network error), it is stored here and replayed later in order.
 * Photo uploads are NOT queued (binary payloads don't fit localStorage well).
 */

import { ApiError } from './errors';

export type MutationKind =
  | 'upsertWeight'
  | 'updateWeight'
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

export interface DroppedEntry {
  id: string;
  kind: MutationKind;
  status: number;
}

export interface FlushResult {
  done: number;
  left: number;
  dropped: DroppedEntry[];
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

function isPermanentFailure(e: unknown): e is ApiError {
  if (!(e instanceof ApiError)) return false;
  // 401 must keep the queue: the user can log in again and replay it.
  // 408/429 and 5xx are transient; everything else in 4xx will never succeed.
  if (e.status === 401 || e.status === 408 || e.status === 429) return false;
  return e.status >= 400 && e.status < 500;
}

function isDelete(kind: MutationKind): boolean {
  return kind === 'deleteWeight' || kind === 'deleteWalker';
}

/**
 * Replay queued mutations in FIFO order.
 *
 * Permanent 4xx failures are dropped so one bad entry cannot block the rest;
 * transient/network failures stop the flush and keep the whole queue for later.
 * A 404 on delete means the desired state is already reached and counts as done.
 */
export async function flushOutbox(): Promise<FlushResult> {
  let done = 0;
  const dropped: DroppedEntry[] = [];
  for (;;) {
    const list = read();
    const next = list[0];
    if (!next) return { done, left: 0, dropped };
    const exec = executors.get(next.kind);
    if (!exec) {
      write(list.slice(1));
      continue;
    }
    try {
      await exec(next);
    } catch (e) {
      if (isPermanentFailure(e)) {
        write(read().filter((entry) => entry.id !== next.id));
        if (isDelete(next.kind) && e.status === 404) {
          done += 1;
        } else {
          dropped.push({ id: next.id, kind: next.kind, status: e.status });
        }
        continue;
      }
      return { done, left: list.length, dropped };
    }
    write(read().filter((e) => e.id !== next.id));
    done += 1;
  }
}
