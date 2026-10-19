// Opening hours of a Dealer: one value for each day of the week and for bank holidays, kept on the profile as
// opening_times = { mon: '09:00 - 18:00', sat: '09:00 - 13:00', sun: 'Closed', bank: 'Closed' } (a day left empty is not shown).
export const DAY_KEYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'], ['bank', 'Bank Holiday'],
];

// What the dealer typed -> the standard form. '' = nothing typed, 'Closed', "09:00 - 18:00", or null when it cannot be read.
export function normalizeTime(input) {
  const v = String(input ?? '').trim();
  if (!v) return '';
  if (/^closed$/i.test(v)) return 'Closed';
  const m = /^(\d{1,2})(?:[:.]?(\d{2}))?\s*(?:-|–|—|to)\s*(\d{1,2})(?:[:.]?(\d{2}))?$/i.exec(v);
  if (!m) return null;
  const h1 = +m[1]; const m1 = +(m[2] ?? 0); const h2 = +m[3]; const m2 = +(m[4] ?? 0);
  if (h1 > 23 || h2 > 24 || m1 > 59 || m2 > 59 || (h2 === 24 && m2 !== 0)) return null;
  if (h2 * 60 + m2 <= h1 * 60 + m1) return null; // closing must be later than opening (so "9 to 5" is not read as 09:00 - 05:00)
  const p = (n) => String(n).padStart(2, '0');
  return `${p(h1)}:${p(m1)} - ${p(h2)}:${p(m2)}`;
}

export const hasTimes = (times) => !!times && DAY_KEYS.some(([k]) => times[k]);
