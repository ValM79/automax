// make / model / model type / body type matching for the category pages (Quads, Boats, ...)
const low = (x) => String(x || '').trim().toLowerCase();

export function matchesVehicleFilters(item, f) {
  if (!f) return true;
  const title = low(item.title);
  const chosen = (f.vehicles || []).filter((v) => v.make);
  if (chosen.length > 0) {
    const hit = chosen.some((v) => {
      const makeOk = low(item.vehicleMake) === low(v.make) || title.includes(low(v.make));
      if (!makeOk) return false;
      const modelOk = !v.model || low(item.vehicleModel) === low(v.model) || title.includes(low(v.model));
      if (!modelOk) return false;
      return !v.trims || v.trims.length === 0 || v.trims.some((t) => low(item.vehicleTrim) === low(t));
    });
    if (!hit) return false;
  }
  if (f.bodyType && !low(item.bodyType).includes(low(f.bodyType))) return false;
  return true;
}
