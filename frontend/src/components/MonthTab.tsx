import { useApp } from '../app-state';
import { monthName, parseDate } from '../lib/dates';
import { Legend, walkerById } from './common';

const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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
          ‹
        </button>
        <b>
          {monthName(monthCursor.month)} {monthCursor.year}
        </b>
        <button type="button" aria-label="Следующий месяц" onClick={() => shift(1)}>
          ›
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
            return (
              <div key={d.date} className="month-cell">
                <span
                  style={{
                    background: w?.color ?? '#dcd3c4',
                    fontWeight: isToday ? 900 : 600,
                    boxShadow: isToday ? '0 0 0 3px #fbf6ec, 0 0 0 5px rgba(32,30,29,.42)' : 'none',
                    opacity: d.date < todayDate ? 0.5 : 1,
                  }}
                >
                  {num}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Legend />

      <button type="button" className="btn-outline" onClick={onOpenWalkers}>
        ✎ Изменить выгульщиков
      </button>
    </>
  );
}
