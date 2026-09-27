/**
 * Weight input mask: digits and a single dot only (per confirmed decision).
 * Returns the sanitized string and whether it is a valid weight.
 */

export function sanitizeWeightInput(raw: string): string {
  let out = '';
  let dotSeen = false;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if ((ch === '.' || ch === ',') && !dotSeen) {
      // Accept comma keystrokes but normalize to a dot.
      out += '.';
      dotSeen = true;
    }
    if (out.length >= 6) break;
  }
  // Leading dot -> '0.'
  if (out.startsWith('.')) out = `0${out}`;
  return out;
}

export function parseWeight(value: string): number | null {
  if (!/^\d{1,3}(\.\d{1})?$/.test(value)) return null;
  const kg = Number(value);
  if (!Number.isFinite(kg) || kg < 1 || kg > 150) return null;
  return Math.round(kg * 10) / 10;
}

/** 24.6 -> '24.6' (dot separator, one decimal). */
export function formatWeight(kg: number): string {
  return (Math.round(kg * 10) / 10).toFixed(1);
}
