import { useApp } from '../app-state';
import { calcAge } from '../lib/age';
import { formatDayMonth, formatFull, todayLocal, weekdayShort } from '../lib/dates';
import { formatWeight } from '../lib/weightInput';
import { Legend, walkerById } from './common';
import { PencilIcon, PlusIcon } from './icons';

interface Props {
  onOpenWalkers: () => void;
  onOpenWeight: () => void;
}

export function HomeTab({ onOpenWalkers, onOpenWeight }: Props): React.JSX.Element {
  const { walkers, todayWalkerId, todayDate, week, weights, pet } = useApp();
  const today = walkerById(walkers, todayWalkerId);
  const latest = weights[0];
  const todayStr = todayLocal();

  const age = pet?.birthDate ? calcAge(pet.birthDate, todayDate || todayStr) : null;

  const range =
    week.length === 7 ? `${formatDayMonth(week[0].date)} — ${formatDayMonth(week[6].date)}` : '';

  return (
    <>
      <div className="cards2">
        <div className="card">
          <span className="label">Возраст</span>
          <div className="big">
            <b>{age ? age.years : '—'}</b>
            {age && <span>{age.yearsWord}</span>}
          </div>
          <span className="sub">{pet?.birthDate ? `род. ${formatFull(pet.birthDate)}` : 'нет даты рождения'}</span>
        </div>
        <div className="card">
          <span className="label">Вес</span>
          <div className="big">
            <b>{latest ? formatWeight(latest.kg) : '—'}</b>
            {latest && <span>кг</span>}
          </div>
          <span className="sub">{latest ? `замер ${formatDayMonth(latest.date)}` : 'нет замеров'}</span>
          <button type="button" className="fab" aria-label="Добавить замер веса" onClick={onOpenWeight}>
            <PlusIcon size={22} />
          </button>
        </div>
      </div>

      <div className="today-banner" style={{ background: today?.color ?? '#dcd3c4' }}>
        <div>
          <div className="cap">Сегодня выгуливает</div>
          <div className="name">{today?.name ?? '—'}</div>
        </div>
        <span className="date">
          {todayDate ? (
            <>
              {weekdayShort(todayDate)}
              <br />
              {formatDayMonth(todayDate)}
            </>
          ) : (
            ''
          )}
        </span>
      </div>

      <div className="panel">
        <div className="panel-head">
          <b>График выгула</b>
          <span>{range}</span>
        </div>
        <div className="week-grid">
          {week.map((d) => {
            const w = walkerById(walkers, d.walkerId);
            const isToday = d.date === todayDate;
            return (
              <div
                key={d.date}
                className="week-cell"
                style={{ background: isToday ? '#f3ecdf' : 'transparent' }}
              >
                <span className="dow">{weekdayShort(d.date)}</span>
                <span className="num">{Number(d.date.slice(8, 10))}</span>
                <span className="dot" style={{ background: w?.color ?? '#dcd3c4' }} />
              </div>
            );
          })}
        </div>
        <Legend />
      </div>

      <button type="button" className="btn-outline" onClick={onOpenWalkers}>
        <PencilIcon size={19} />
        Изменить выгульщиков
      </button>
    </>
  );
}
