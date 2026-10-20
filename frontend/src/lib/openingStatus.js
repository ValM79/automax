import { hasTimes } from './openingHours.js';

// "Open now · Closes 18:00" / "Closed · Opens tomorrow at 09:00" from a dealer's opening_times, using Irish time
// (Europe/Dublin) whatever the visitor's clock says. Returns null when the dealer has not set hours, or has not set today.
// Bank holidays are not known to the site, so the Bank Holiday row is not used here.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SHORT = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
const SLOT = /^(\d\d):(\d\d) - (\d\d):(\d\d)$/;

const slotOf = (v) => {
  const m = SLOT.exec(String(v || ''));
  return m ? { open: m[1] + ':' + m[2], close: m[3] + ':' + m[4], from: +m[1] * 60 + +m[2], to: +m[3] * 60 + +m[4] } : null;
};

function irishClock(date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { day: String(get('weekday')).slice(0, 3).toLowerCase(), minutes: +get('hour') * 60 + +get('minute') };
}

export function openingStatus(times, date = new Date()) {
  if (!hasTimes(times)) return null;
  const { day, minutes } = irishClock(date);
  if (!times[day]) return null;
  const today = slotOf(times[day]);
  if (today && minutes >= today.from && minutes < today.to) return { open: true, text: `Open now · Closes ${today.close}` };
  if (today && minutes < today.from) return { open: false, text: `Closed · Opens at ${today.open}` };
  const start = DAYS.indexOf(day);
  for (let i = 1; i <= 7; i += 1) {
    const key = DAYS[(start + i) % 7];
    const slot = slotOf(times[key]);
    if (slot) return { open: false, text: `Closed · Opens ${i === 1 ? 'tomorrow' : SHORT[key]} at ${slot.open}` };
  }
  return { open: false, text: 'Closed' };
}
