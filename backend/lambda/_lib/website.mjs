// A dealer's own website address. Returns the tidy https/http address, '' if nothing was typed, or null if it cannot be one.
// "www.kumotors.ie" -> "https://www.kumotors.ie/". Only http(s) is allowed (never javascript: and the like).
export function normalizeWebsite(input) {
  let v = String(input ?? '').trim();
  if (!v) return '';
  if (v.length > 200 || /[\s<>"']/.test(v)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = 'https://' + v;
  let u;
  try { u = new URL(v); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null;
  return u.href;
}
