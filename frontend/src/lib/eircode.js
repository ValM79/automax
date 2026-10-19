// An Irish Eircode is 7 letters and digits: a 3 character routing key and a 4 character unique part ("A65 F4E2").
// Returns the tidy form, '' if nothing was typed, or null if it cannot be an Eircode.
export function normalizeEircode(input) {
  const v = String(input ?? '').replace(/\s+/g, '').toUpperCase();
  if (!v) return '';
  return /^[A-Z0-9]{7}$/.test(v) ? `${v.slice(0, 3)} ${v.slice(3)}` : null;
}
