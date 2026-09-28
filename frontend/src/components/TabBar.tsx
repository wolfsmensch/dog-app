import { useApp } from '../app-state';
import type { Tab } from '../api/types';
import { CalendarIcon, ChartIcon, HomeIcon, PawIcon } from './icons';
import type { JSX } from 'react';

const TABS: { id: Tab; label: string; Icon: (p: { size?: number; filled?: boolean }) => JSX.Element }[] = [
  { id: 'home', label: 'Главная', Icon: HomeIcon },
  { id: 'month', label: 'Месяц', Icon: CalendarIcon },
  { id: 'weight', label: 'Вес', Icon: ChartIcon },
  { id: 'pet', label: 'Питомец', Icon: PawIcon },
];

export function TabBar(): React.JSX.Element {
  const { tab, setTab } = useApp();
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={tab === id ? 'active' : ''}
          onClick={() => setTab(id)}
        >
          <span className="ico">
            <Icon size={24} filled={tab === id} />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
