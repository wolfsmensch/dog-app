/** Local date helpers. Backend stores dates as TEXT 'YYYY-MM-DD'. */

export function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];
const DOW_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function parseDate(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

/** '2026-09-27' -> '27 сентября'. */
export function formatDayMonth(date: string): string {
  const { m, d } = parseDate(date);
  return `${d} ${MONTHS_GEN[m - 1]}`;
}

/** '2026-09-27' -> '27 сентября 2026'. */
export function formatFull(date: string): string {
  const { y, m, d } = parseDate(date);
  return `${d} ${MONTHS_GEN[m - 1]} ${y}`;
}

/** 9 -> 'Сентябрь'. */
export function monthName(month: number): string {
  return MONTHS_NOM[month - 1];
}

/** '2026-09-27' -> '27 сен'. */
export function formatShort(date: string): string {
  const { m, d } = parseDate(date);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** '2026-09-27' -> 'вс' (Monday-first weekday). */
export function weekdayShort(date: string): string {
  const { y, m, d } = parseDate(date);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return DOW_SHORT[dow];
}

/** Whole-day difference: days(b - a). */
export function diffDays(a: string, b: string): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round(
    (Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000,
  );
}

export function addDays(date: string, n: number): string {
  const { y, m, d } = parseDate(date);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** Monday of the week containing `date`. */
export function mondayOf(date: string): string {
  const { y, m, d } = parseDate(date);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return addDays(date, -dow);
}
