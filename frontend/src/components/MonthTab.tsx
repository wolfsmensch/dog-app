import { useApp } from '../app-state';
import { monthName, parseDate } from '../lib/dates';
import { Legend, walkerById } from './common';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from './icons';

const DOW = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

export function MonthTab({ onOpenWalkers }: { onOpenWalkers: () => void }): React.JSX.Element {
  const { walkers, monthCells, monthCursor, setMonthCursor, todayDate } = useApp();

  function shift(delta: number): void {
    let { year, month } = monthCursor;
    month += delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setMonthCursor({ year, month });
  }

  // Leading blanks so the 1st lands on the right weekday (Monday-first).
  const firstDow = monthCells.length > 0 ? new Date(monthCursor.year, monthCursor.month - 1, 1).getDay() : 0;
  const lead = (firstDow + 6) % 7;

  return (
    <>
      <div className="month-nav">
        <button type="button" aria-label="Предыдущий месяц" onClick={() => shift(-1)}>
          <ChevronLeftIcon size={20} />
        </button>
        <b>
          {monthName(monthCursor.month)} {monthCursor.year}
        </b>
        <button type="button" aria-label="Следующий месяц" onClick={() => shift(1)}>
          <ChevronRightIcon size={20} />
        </button>
      </div>

      <div className="panel">
        <div className="week-grid">
          {DOW.map((d) => (
            <span key={d} className="dow" style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#82796a' }}>
              {d}
            </span>
          ))}
        </div>
        <div className="month-grid">
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`e${i}`} className="month-cell">
              <span />
            </div>
          ))}
          {monthCells.map((d) => {
            const w = walkerById(walkers, d.walkerId);
            const num = parseDate(d.date).d;
            const isToday = d.date === todayDate;
            const isPast = d.date < todayDate;
            const bg = w?.color ?? '#dcd3c4';
            return (
              <div key={d.date} className="month-cell">
                <span
                  style={{
                    background: isPast && !isToday ? `color-mix(in srgb, ${bg} 45%, #fbf6ec)` : bg,
                    color: isPast && !isToday ? '#a19786' : '#201e1d',
                    fontWeight: isToday ? 900 : 600,
                    boxShadow: isToday ? '0 0 0 3px #fbf6ec, 0 0 0 5px rgba(32,30,29,.42)' : 'none',
                  }}
                >
                  {num}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Legend plain />

      <button type="button" className="btn-outline" onClick={onOpenWalkers}>
        <PencilIcon size={19} />
        Изменить выгульщиков
      </button>
    </>
  );
}
