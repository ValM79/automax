const STORAGE_KEY = 'automax_saved_searches';

export function getSavedSearches() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

export function saveSearch(search) {
  const searches = getSavedSearches();
  const entry = {
    id: Date.now().toString(),
    ...search,
    savedAt: new Date().toISOString()
  };
  searches.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  return entry;
}

export function removeSavedSearch(id) {
  const searches = getSavedSearches().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function generateSearchName(filters) {
  const parts = [];
  if (filters.vehicles) {
    const activeVehicles = filters.vehicles.filter((v) => v.make);
    activeVehicles.forEach((v) => {
      let label = v.make;
      if (v.model) label += ` ${v.model}`;
      if (v.trims && v.trims.length) label += ` ${v.trims.join("/")}`;
      parts.push(label);
    });
  }
  if (filters.yearFrom || filters.yearTo) {
    parts.push(`Year ${filters.yearFrom || '...'}-${filters.yearTo || '...'}`);
  }
  if (filters.priceFrom || filters.priceTo) {
    parts.push(`Price ${filters.priceFrom || '...'}-${filters.priceTo || '...'}`);
  }
  if (filters.fuelSelected && filters.fuelSelected.length > 0) parts.push(filters.fuelSelected.join('/'));
  if (filters.transSelected && filters.transSelected.length > 0) parts.push(filters.transSelected.join('/'));
  if (filters.bodySelected && filters.bodySelected.length > 0) parts.push(filters.bodySelected.join('/'));
  if (filters.county && filters.county !== 'All Ireland') parts.push(filters.county);
  if (parts.length === 0) return 'All listings';
  return parts.slice(0, 4).join(' · ');
}