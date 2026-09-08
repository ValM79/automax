// Local block list for abusive message senders.
//
// This is a per-device list kept in localStorage. Blocking hides every message
// from that sender across the app immediately; it does not require a round trip
// to the backend, so it still works offline and in the native WebView. Reports
// are additionally forwarded to the AutoMax team (best effort) from the Messages
// screen.

const KEY = 'automax_blocked_users';

const norm = (email) => String(email || '').trim().toLowerCase();

export function getBlocked() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function isBlocked(email) {
  const e = norm(email);
  if (!e) return false;
  return getBlocked().includes(e);
}

export function blockUser(email) {
  const e = norm(email);
  if (!e) return getBlocked();
  const next = Array.from(new Set([...getBlocked(), e]));
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — block is best effort for this session */
  }
  return next;
}

export function unblockUser(email) {
  const e = norm(email);
  const next = getBlocked().filter((x) => x !== e);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
