import { useState } from 'react';
import { AppProvider, useApp } from './app-state';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { LockScreen } from './components/LockScreen';
import { MonthTab } from './components/MonthTab';
import { PetTab } from './components/PetTab';
import { TabBar } from './components/TabBar';
import { WalkersSheet } from './components/WalkersSheet';
import { WeightSheet } from './components/WeightSheet';
import { WeightTab } from './components/WeightTab';
import './styles.css';

function Shell(): React.JSX.Element {
  const { authed, tab, online, error, pending, flushNow } = useApp();
  const [walkersOpen, setWalkersOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);

  return (
    <div className="phone">
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
        {tab === 'home' && (
          <HomeTab onOpenWalkers={() => setWalkersOpen(true)} onOpenWeight={() => setWeightOpen(true)} />
        )}
        {tab === 'month' && <MonthTab onOpenWalkers={() => setWalkersOpen(true)} />}
        {tab === 'weight' && <WeightTab onOpenWeight={() => setWeightOpen(true)} />}
        {tab === 'pet' && <PetTab />}
      </main>
      <TabBar />
      {walkersOpen && <WalkersSheet onClose={() => setWalkersOpen(false)} />}
      {weightOpen && <WeightSheet onClose={() => setWeightOpen(false)} />}
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
