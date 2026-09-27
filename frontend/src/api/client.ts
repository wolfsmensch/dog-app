import { enqueue, flushOutbox, registerExecutor } from './outbox';
import type { MutationKind } from './outbox';
import type { DayAssignment, Pet, Walker, WeightEntry } from './types';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export class QueuedError extends Error {
  constructor() {
    super('Нет соединения — изменение сохранено и отправится позже');
    this.name = 'QueuedError';
  }
}

async function mutate<T>(kind: MutationKind, payload: unknown, fn: () => Promise<T>): Promise<T> {
  if (!navigator.onLine) {
    enqueue(kind, payload);
    throw new QueuedError();
  }
  try {
    return await fn();
  } catch (e) {
    if (e instanceof TypeError) {
      // Network failure mid-request: queue for replay.
      enqueue(kind, payload);
      throw new QueuedError();
    }
    throw e;
  }
}
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    unauthorizedHandler?.();
    throw new ApiError(401, 'Unauthorized');
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  login(password: string): Promise<{ accessToken: string }> {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
  },
  walkers(): Promise<Walker[]> {
    return request('/api/walkers');
  },
  createWalker(name: string, color?: string): Promise<Walker> {
    const payload = { name, color };
    return mutate('createWalker', payload, () =>
      request<Walker>('/api/walkers', { method: 'POST', body: JSON.stringify(payload) }),
    );
  },
  updateWalker(id: number, patch: { name?: string; color?: string; position?: number }): Promise<Walker> {
    const payload = { id, patch };
    return mutate('updateWalker', payload, () =>
      request<Walker>(`/api/walkers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    );
  },
  deleteWalker(id: number): Promise<void> {
    return mutate('deleteWalker', { id }, () =>
      request<void>(`/api/walkers/${id}`, { method: 'DELETE' }),
    );
  },
  today(): Promise<{ date: string; walkerId: number | null }> {
    return request('/api/schedule/today');
  },
  setToday(walkerId: number): Promise<{ date: string; walkerId: number }> {
    return mutate('setToday', { walkerId }, () =>
      request<{ date: string; walkerId: number }>('/api/schedule/today', {
        method: 'PUT',
        body: JSON.stringify({ walkerId }),
      }),
    );
  },
  week(start?: string): Promise<DayAssignment[]> {
    return request(start ? `/api/schedule/week?start=${start}` : '/api/schedule/week');
  },
  month(year: number, month: number): Promise<DayAssignment[]> {
    return request(`/api/schedule/month?year=${year}&month=${month}`);
  },
  weights(from?: string, to?: string): Promise<WeightEntry[]> {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return request(`/api/weights${suffix}`);
  },
  upsertWeight(kg: number, date?: string): Promise<WeightEntry> {
    const payload = { kg, date };
    return mutate('upsertWeight', payload, () =>
      request<WeightEntry>('/api/weights', { method: 'POST', body: JSON.stringify(payload) }),
    );
  },
  deleteWeight(id: number): Promise<void> {
    return mutate('deleteWeight', { id }, () =>
      request<void>(`/api/weights/${id}`, { method: 'DELETE' }),
    );
  },
  pet(): Promise<Pet> {
    return request('/api/pet');
  },
  updatePet(patch: { name?: string; birthDate?: string }): Promise<Pet> {
    return mutate('updatePet', patch, () =>
      request<Pet>('/api/pet', { method: 'PUT', body: JSON.stringify(patch) }),
    );
  },
  uploadPhoto(file: File): Promise<Pet> {
    // Photo uploads are never queued (binary payloads); they require network.
    if (!navigator.onLine) throw new QueuedError();
    const form = new FormData();
    form.append('photo', file);
    return request('/api/pet/photo', { method: 'POST', body: form });
  },
  deletePhoto(): Promise<Pet> {
    return request('/api/pet/photo', { method: 'DELETE' });
  },
};

// Outbox replay executors: raw requests that must NOT re-queue.
registerExecutor('upsertWeight', (e) =>
  request<WeightEntry>('/api/weights', { method: 'POST', body: JSON.stringify(e.payload) }),
);
registerExecutor('deleteWeight', (e) =>
  request<void>(`/api/weights/${(e.payload as { id: number }).id}`, { method: 'DELETE' }),
);
registerExecutor('setToday', (e) =>
  request('/api/schedule/today', { method: 'PUT', body: JSON.stringify(e.payload) }),
);
registerExecutor('createWalker', (e) =>
  request<Walker>('/api/walkers', { method: 'POST', body: JSON.stringify(e.payload) }),
);
registerExecutor('updateWalker', (e) => {
  const { id, patch } = e.payload as { id: number; patch: unknown };
  return request<Walker>(`/api/walkers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
});
registerExecutor('deleteWalker', (e) =>
  request<void>(`/api/walkers/${(e.payload as { id: number }).id}`, { method: 'DELETE' }),
);
registerExecutor('updatePet', (e) =>
  request<Pet>('/api/pet', { method: 'PUT', body: JSON.stringify(e.payload) }),
);

export { flushOutbox };
