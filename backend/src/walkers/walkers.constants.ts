/** Default color palette (10 entries = walker limit). */
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

export const MAX_WALKERS = 10;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}
