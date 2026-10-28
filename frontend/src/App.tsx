import { useState } from 'react';
import { AppProvider, useApp } from './app-state';
import type { WeightEntry } from './api/types';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { LockScreen } from './components/LockScreen';
import { MonthTab } from './components/MonthTab';
import { PetTab } from './components/PetTab';
import { TabBar } from './components/TabBar';
import { WalkersSheet } from './components/WalkersSheet';
import { WeightSheet } from './components/WeightSheet';
import { WeightTab } from './components/WeightTab';
import './styles.scss';

function Shell(): React.JSX.Element {
  const { authed, tab, online, error, pending, syncNotice, dismissSyncNotice, flushNow } = useApp();
  const [walkersOpen, setWalkersOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightEdit, setWeightEdit] = useState<WeightEntry | null>(null);

  function openNewWeight(): void {
    setWeightEdit(null);
    setWeightOpen(true);
  }

  function openWeightEdit(entry: WeightEntry): void {
    setWeightEdit(entry);
    setWeightOpen(true);
  }

  function closeWeight(): void {
    setWeightOpen(false);
    setWeightEdit(null);
  }

  return (
    <div className="app">
      <div className="app-content">
        {!online && <div className="offline-bar">Нет соединения — показаны последние данные</div>}
        {online && pending > 0 && (
          <button
            type="button"
            className="offline-bar"
            style={{ cursor: 'pointer', border: 'none', width: '100%', fontFamily: 'inherit' }}
            onClick={() => void flushNow()}
          >
            Ожидает отправки: {pending} — нажмите для синхронизации
          </button>
        )}
        <Header />
        <main className="main">
          {error && <div className="error-bar">{error}</div>}
          {syncNotice && (
            <div className="error-bar sync-bar" role="status">
              <span>{syncNotice}</span>
              <button type="button" aria-label="Скрыть уведомление" onClick={dismissSyncNotice}>
                ×
              </button>
            </div>
          )}
          {tab === 'home' && (
            <HomeTab onOpenWalkers={() => setWalkersOpen(true)} onOpenWeight={openNewWeight} />
          )}
          {tab === 'month' && <MonthTab onOpenWalkers={() => setWalkersOpen(true)} />}
          {tab === 'weight' && <WeightTab onOpenWeight={openNewWeight} onEditWeight={openWeightEdit} />}
          {tab === 'pet' && <PetTab />}
        </main>
      </div>
      {authed && <TabBar />}
      {walkersOpen && <WalkersSheet onClose={() => setWalkersOpen(false)} />}
      {weightOpen && <WeightSheet entry={weightEdit} onClose={closeWeight} />}
      {!authed && <LockScreen />}
    </div>
  );
}

export default function App(): React.JSX.Element {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
