function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export interface Age {
  years: number;
  yearsWord: string;
  months: number;
  monthsWord: string;
}

/** Age at `today` for a birth date 'YYYY-MM-DD'. */
export function calcAge(birth: string, today: string): Age {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let years = ty - by;
  let months = tm - bm;
  if (td < bd) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) years = 0;
  if (months < 0) months = 0;
  return {
    years,
    yearsWord: plural(years, ['год', 'года', 'лет']),
    months,
    monthsWord: plural(months, ['месяц', 'месяца', 'месяцев']),
  };
}
