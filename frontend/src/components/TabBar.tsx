import { useApp } from '../app-state';
import type { Tab } from '../api/types';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: '⌂' },
  { id: 'month', label: 'Месяц', icon: '▦' },
  { id: 'weight', label: 'Вес', icon: '📈' },
  { id: 'pet', label: 'Питомец', icon: '🐾' },
];

export function TabBar(): React.JSX.Element {
  const { tab, setTab } = useApp();
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={tab === t.id ? 'active' : ''}
          onClick={() => setTab(t.id)}
        >
          <span className="ico">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
