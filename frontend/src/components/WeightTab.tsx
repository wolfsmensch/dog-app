import { useMemo, useState } from 'react';
import { QueuedError, api } from '../api/client';
import { useApp } from '../app-state';
import { formatShort, parseDate } from '../lib/dates';
import { formatWeight } from '../lib/weightInput';

const W = 302;
const H = 128;
const PX = 6;

export function WeightTab({ onOpenWeight }: { onOpenWeight: () => void }): React.JSX.Element {
  const { weights, refreshWeights } = useApp();
  const [deleting, setDeleting] = useState<number | null>(null);

  const asc = useMemo(() => [...weights].reverse(), [weights]);

  const chart = useMemo(() => {
    if (asc.length === 0) return null;
    const kgs = asc.map((e) => e.kg);
    const lo = Math.min(...kgs) - 0.4;
    const hi = Math.max(...kgs) + 0.4;
    const px = (i: number): number =>
      PX + (asc.length > 1 ? (i * (W - PX * 2)) / (asc.length - 1) : (W - PX * 2) / 2);
    const py = (v: number): number => H - 12 - ((v - lo) / (hi - lo || 1)) * (H - 28);
    const points = asc.map((e, i) => `${px(i).toFixed(1)},${py(e.kg).toFixed(1)}`).join(' ');
    const area = `M${points.split(' ').join(' L')} L${px(asc.length - 1).toFixed(1)},${H} L${px(0).toFixed(1)},${H} Z`;
    return {
      points,
      area,
      dots: asc.map((e, i) => ({ cx: px(i), cy: py(e.kg), label: formatShort(e.date), id: e.id })),
      hi: formatWeight(Math.max(...kgs)),
      lo: formatWeight(Math.min(...kgs)),
    };
  }, [asc]);

  const range =
    weights.length > 0
      ? `${formatShort(asc[0]?.date ?? '')} — ${formatShort(weights[0].date)}`
      : '';

  async function remove(id: number): Promise<void> {
    if (!window.confirm('Удалить этот замер?')) return;
    setDeleting(id);
    try {
      await api.deleteWeight(id);
      await refreshWeights();
    } catch (e) {
      if (e instanceof QueuedError) return;
      throw e;
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">История веса</div>
          <div style={{ fontSize: 11.5, color: '#a19786' }}>{range}</div>
        </div>
        <button type="button" className="icon-btn accent" style={{ width: 44, height: 44, fontSize: 22 }} aria-label="Добавить замер веса" onClick={onOpenWeight}>
          +
        </button>
      </div>

      {chart && (
        <div className="panel">
          <div className="panel-head">
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase', color: '#82796a' }}>
              Динамика
            </span>
            <span>
              макс {chart.hi} · мин {chart.lo}
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="132" fill="none" preserveAspectRatio="none">
            <path d={chart.area} fill="var(--accent)" fillOpacity=".16" />
            <polyline points={chart.points} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {chart.dots.map((p) => (
              <circle key={p.id} cx={p.cx} cy={p.cy} r="4.5" fill="#fbf6ec" stroke="var(--accent)" strokeWidth="3" />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {chart.dots.map((p) => (
              <span key={p.id} style={{ fontSize: 9.5, fontWeight: 600, color: '#a19786' }}>
                {p.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="list-head">
          <span>Дата</span>
          <span style={{ textAlign: 'right' }}>Вес</span>
          <span style={{ textAlign: 'right', minWidth: 78 }}>Изм.</span>
        </div>
        {weights.map((e, i) => {
          const prev = weights[i + 1];
          const diff = prev ? Math.round((e.kg - prev.kg) * 10) / 10 : null;
          const cls = diff === null ? 'flat' : diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
          const label =
            diff === null
              ? 'первый замер'
              : diff === 0
                ? 'без изменений'
                : `${diff > 0 ? '+' : '−'}${formatWeight(Math.abs(diff))} кг`;
          return (
            <div key={e.id} className="weight-row">
              <span>
                <span className="d">{formatShort(e.date)}</span>
                <br />
                <span className="y">{parseDate(e.date).y}</span>
              </span>
              <span className="kg">{formatWeight(e.kg)}</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                <span className={`delta ${cls}`}>{label}</span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Удалить замер"
                  disabled={deleting === e.id}
                  onClick={() => void remove(e.id)}
                >
                  🗑
                </button>
              </span>
            </div>
          );
        })}
        {weights.length === 0 && <div className="stub">Пока нет замеров — добавьте первый</div>}
      </div>
    </>
  );
}
