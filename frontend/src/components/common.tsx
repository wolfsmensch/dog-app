import { useApp } from '../app-state';
import type { Walker } from '../api/types';

export function walkerById(walkers: Walker[], id: number | null): Walker | undefined {
  if (id === null) return undefined;
  return walkers.find((w) => w.id === id);
}

export function Legend({ plain = false }: { plain?: boolean }): React.JSX.Element {
  const { walkers } = useApp();
  if (plain) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '0 4px' }}>
        {walkers.map((w) => (
          <span
            key={w.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}
          >
            <span className="dot" style={{ width: 18, height: 18, background: w.color }} />
            {w.name}
          </span>
        ))}
        {walkers.length === 0 && <span className="hint">Нет выгульщиков — добавьте первого</span>}
      </div>
    );
  }
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
