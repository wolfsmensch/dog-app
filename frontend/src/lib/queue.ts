/** Client-side mirror of the server rotation (instant UI, server is the truth). */
export function walkerForDate(
  orderedIds: number[],
  anchorId: number,
  anchorDate: string,
  date: string,
  diffDaysFn: (a: string, b: string) => number,
): number {
  const n = orderedIds.length;
  const idx = orderedIds.indexOf(anchorId);
  const at = idx >= 0 ? idx : 0;
  return orderedIds[(((at + diffDaysFn(anchorDate, date)) % n) + n) % n];
}

export const WALKER_PALETTE = [
  '#FFA500',
  '#4F7CAC',
  '#FF7A45',
  '#FFC300',
  '#E4572E',
  '#7A8A5E',
  '#AEBF92',
  '#5E8A86',
  '#8A5E7A',
  '#B4656F',
];
