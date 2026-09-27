import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, api, clearToken, flushOutbox, getToken, onUnauthorized, setToken } from './api/client';
import { loadCache, saveCache } from './api/cache';
import { pendingCount, subscribeOutbox } from './api/outbox';
import type { DayAssignment, Pet, Tab, Walker, WeightEntry } from './api/types';

interface AppState {
  authed: boolean;
  authError: string | null;
  login: (password: string) => Promise<void>;
  tab: Tab;
  setTab: (t: Tab) => void;
  walkers: Walker[];
  todayWalkerId: number | null;
  todayDate: string;
  week: DayAssignment[];
  monthCells: DayAssignment[];
  monthCursor: { year: number; month: number };
  setMonthCursor: (c: { year: number; month: number }) => void;
  weights: WeightEntry[];
  pet: Pet | null;
  loading: boolean;
  error: string | null;
  online: boolean;
  pending: number;
  flushNow: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshWalk: () => Promise<void>;
  refreshWeights: () => Promise<void>;
  refreshPet: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}

/** 401 must never fall back to cache (it would mask a bad/expired token). */
function isAuthError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 401;
}

const now = new Date();

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [authed, setAuthed] = useState<boolean>(() => getToken() !== null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [todayWalkerId, setTodayWalkerId] = useState<number | null>(null);
  const [todayDate, setTodayDate] = useState<string>('');
  const [week, setWeek] = useState<DayAssignment[]>([]);
  const [monthCells, setMonthCells] = useState<DayAssignment[]>([]);
  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(() => pendingCount());

  useEffect(() => {
    onUnauthorized(() => setAuthed(false));
  }, []);

  useEffect(() => subscribeOutbox(() => setPending(pendingCount())), []);

  useEffect(() => {
    const on = (): void => {
      setOnline(true);
      void flushOutbox()
        .catch(() => undefined)
        .finally(() => setPending(pendingCount()));
    };
    const off = (): void => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const login = useCallback(async (password: string) => {
    setAuthError(null);
    try {
      const { accessToken } = await api.login(password);
      setToken(accessToken);
      setAuthed(true);
    } catch {
      setAuthError('Неверный пароль');
      throw new Error('auth failed');
    }
  }, []);

  const refreshWalk = useCallback(async () => {
    try {
      const [list, today, w] = await Promise.all([api.walkers(), api.today(), api.week()]);
      setWalkers(list);
      setTodayWalkerId(today.walkerId);
      setTodayDate(today.date);
      setWeek(w);
      saveCache('walk', { list, today, week: w });
    } catch (e) {
      if (isAuthError(e)) throw e;
      const cached = loadCache<{ list: Walker[]; today: { walkerId: number | null; date: string }; week: DayAssignment[] }>('walk');
      if (cached) {
        setWalkers(cached.list);
        setTodayWalkerId(cached.today.walkerId);
        setTodayDate(cached.today.date);
        setWeek(cached.week);
      } else {
        throw e;
      }
    }
  }, []);

  const refreshWeights = useCallback(async () => {
    try {
      const list = await api.weights();
      setWeights(list);
      saveCache('weights', list);
    } catch (e) {
      if (isAuthError(e)) throw e;
      const cached = loadCache<WeightEntry[]>('weights');
      if (cached) setWeights(cached);
      else throw e;
    }
  }, []);

  const refreshPet = useCallback(async () => {
    try {
      const p = await api.pet();
      setPet(p);
      saveCache('pet', p);
    } catch (e) {
      if (isAuthError(e)) throw e;
      const cached = loadCache<Pet>('pet');
      if (cached) setPet(cached);
      else throw e;
    }
  }, []);

  const refreshMonth = useCallback(async (year: number, month: number) => {
    try {
      const cells = await api.month(year, month);
      setMonthCells(cells);
      saveCache(`month:${year}-${month}`, cells);
    } catch (e) {
      if (isAuthError(e)) throw e;
      const cached = loadCache<DayAssignment[]>(`month:${year}-${month}`);
      if (cached) setMonthCells(cached);
      else throw e;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await flushOutbox().catch(() => undefined);
      setPending(pendingCount());
      await Promise.all([refreshWalk(), refreshWeights(), refreshPet()]);
    } catch (e) {
      if (!isAuthError(e)) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  }, [refreshPet, refreshWalk, refreshWeights]);

  const flushNow = useCallback(async () => {
    await flushOutbox().catch(() => undefined);
    setPending(pendingCount());
    await refreshAll().catch(() => undefined);
  }, [refreshAll]);

  useEffect(() => {
    if (!authed) return;
    void refreshAll().catch(() => undefined);
  }, [authed, refreshAll]);

  useEffect(() => {
    if (!authed || tab !== 'month') return;
    void refreshMonth(monthCursor.year, monthCursor.month).catch(() => undefined);
  }, [authed, tab, monthCursor, refreshMonth]);

  const value = useMemo<AppState>(
    () => ({
      authed,
      authError,
      login,
      tab,
      setTab,
      walkers,
      todayWalkerId,
      todayDate,
      week,
      monthCells,
      monthCursor,
      setMonthCursor,
      weights,
      pet,
      loading,
      error,
      online,
      pending,
      flushNow,
      refreshAll,
      refreshWalk,
      refreshWeights,
      refreshPet,
    }),
    [
      authed, authError, login, tab, walkers, todayWalkerId, todayDate, week,
      monthCells, monthCursor, weights, pet, loading, error, online, pending,
      flushNow, refreshAll, refreshWalk, refreshWeights, refreshPet,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function signOutLocal(): void {
  clearToken();
}
