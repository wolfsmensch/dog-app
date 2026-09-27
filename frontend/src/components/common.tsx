import { useApp } from '../app-state';
import type { Walker } from '../api/types';

export function walkerById(walkers: Walker[], id: number | null): Walker | undefined {
  if (id === null) return undefined;
  return walkers.find((w) => w.id === id);
}

export function Legend(): React.JSX.Element {
  const { walkers } = useApp();
  return (
    <div className="legend">
      {walkers.map((w) => (
        <span key={w.id} className="chip">
          <span className="dot" style={{ background: w.color }} />
          {w.name}
        </span>
      ))}
      {walkers.length === 0 && <span className="hint">Нет выгульщиков — добавьте первого</span>}
    </div>
  );
}
