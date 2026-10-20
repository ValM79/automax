// Opening hours by day, only the known days and only values of the form "09:00 - 18:00" or "Closed".
export function openingTimes(t) {
  const out = {};
  if (!t || typeof t !== 'object') return out;
  for (const key of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'bank']) {
    const v = typeof t[key] === 'string' ? t[key].trim() : '';
    if (v === 'Closed' || /^\d{2}:\d{2} - \d{2}:\d{2}$/.test(v)) out[key] = v;
  }
  return out;
}
