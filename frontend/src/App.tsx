import { AppProvider, useApp } from './app-state';
import { Header } from './components/Header';
import { LockScreen } from './components/LockScreen';
import { TabBar } from './components/TabBar';
import { HomeTab, MonthTab, PetTab, WeightTab } from './components/tabs';
import './styles.css';

function Shell(): React.JSX.Element {
  const { authed, tab, online, error } = useApp();
  return (
    <div className="phone">
      {!online && <div className="offline-bar">Нет соединения — показаны последние данные</div>}
      <Header />
      <main className="main">
        {error && <div className="error-bar">{error}</div>}
        {tab === 'home' && <HomeTab />}
        {tab === 'month' && <MonthTab />}
        {tab === 'weight' && <WeightTab />}
        {tab === 'pet' && <PetTab />}
      </main>
      <TabBar />
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
