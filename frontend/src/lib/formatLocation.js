// Ads store their place as "area, county" (e.g. "West Dublin, Dublin"). People read it better the other
// way round: the county first, then the area or town. This only changes how it is shown; the stored
// value is not touched. The last part is the county, everything before it is the area (which may itself
// contain a comma if the seller typed one).
export function formatLocation(location) {
  const parts = String(location || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return parts[0] || '';
  const county = parts.pop();
  return `${county}, ${parts.join(', ')}`;
}
