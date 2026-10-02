export const ENGINE_SIZE_OPTIONS = ['1.0L', '1.2L', '1.4L', '1.6L', '1.8L', '2.0L', '2.5L', '3.0L+'];

// Maps a free-typed engine size ("1.6", "1.6 l", "1,6L") onto the matching dropdown
// option ("1.6L") so ads saved with a custom value still show the normal dropdown.
// Anything that isn't a plain litre figure with a matching option is returned as-is.
export function canonicalEngineSize(value) {
  if (!value || value === '__other__') return value;
  const match = String(value).trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:l|ltr|litres?|liters?)?$/i);
  if (!match) return value;
  const litres = parseFloat(match[1].replace(',', '.'));
  return ENGINE_SIZE_OPTIONS.find((option) => parseFloat(option) === litres) ?? value;
}
