// A saved search is a target (a category, a make and model, a year and price range, a county), not an ad. These helpers build the
// target from the ad page it was saved on and write it out as short labels, for the Save search window and the Notifications page.

export const FREQUENCY_LABELS = { instant: 'Instant alerts', daily: 'Daily alerts', off: 'No alerts' };

const has = (v) => v !== '' && v != null;
const euro = (n) => `€${Number(n).toLocaleString('en-IE')}`;
const km = (n) => `${Number(n).toLocaleString('en-IE')} km`;
const whole = (v) => {
  const n = parseInt(String(v ?? '').split('.')[0].replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

// What an ad stands for as a search: the same category, make, model and model type, a year either side of the ad's, a price 15% either side
// (to the nearest 100), and the ad's county.
export function criteriaFromAd(ad) {
  const raw = ad?._raw || ad || {};
  const year = whole(raw.vehicleYear ?? ad?.year);
  const price = whole(raw.price ?? ad?.price);
  const make = raw.vehicleMake || ad?.vehicleMake || '';
  return {
    subsection: raw.subsection || ad?.subsection || '',
    make,
    model: make ? (raw.vehicleModel || ad?.vehicleModel || '') : '',
    trims: make && (raw.vehicleModel || ad?.vehicleModel) && (raw.vehicleTrim || ad?.vehicleTrim) ? [raw.vehicleTrim || ad.vehicleTrim] : [],
    yearFrom: year && year >= 1900 ? year - 1 : '',
    yearTo: year && year >= 1900 ? year + 1 : '',
    priceFrom: price ? Math.round((price * 0.85) / 100) * 100 : '',
    priceTo: price ? Math.round((price * 1.15) / 100) * 100 : '',
    county: raw.county || ad?.county || '',
  };
}

export function defaultName(c) {
  const what = [c.make, c.model].filter(Boolean).join(' ');
  return what && c.subsection ? `${what} in ${c.subsection}` : what || c.subsection || 'New ads';
}

// the labels of a target, in the order they are shown: [{ key, label }]
export function criteriaChips(c) {
  const chips = [];
  if (c.subsection) chips.push({ key: 'subsection', label: c.subsection });
  const what = [c.make, c.model].filter(Boolean).join(' ');
  if (what) chips.push({ key: 'vehicle', label: what });
  if (c.trims && c.trims.length) chips.push({ key: 'trims', label: c.trims.join(', ') });
  if (has(c.yearFrom) || has(c.yearTo)) chips.push({ key: 'year', label: has(c.yearFrom) && has(c.yearTo) ? `${c.yearFrom} - ${c.yearTo}` : has(c.yearFrom) ? `${c.yearFrom} or newer` : `Up to ${c.yearTo}` });
  if (has(c.priceFrom) || has(c.priceTo)) chips.push({ key: 'price', label: has(c.priceFrom) && has(c.priceTo) ? `${euro(c.priceFrom)} - ${euro(c.priceTo)}` : has(c.priceFrom) ? `From ${euro(c.priceFrom)}` : `Up to ${euro(c.priceTo)}` });
  if (has(c.mileageFrom) || has(c.mileageTo)) chips.push({ key: 'mileage', label: has(c.mileageFrom) && has(c.mileageTo) ? `${km(c.mileageFrom)} - ${km(c.mileageTo)}` : has(c.mileageFrom) ? `From ${km(c.mileageFrom)}` : `Up to ${km(c.mileageTo)}` });
  if (c.county) chips.push({ key: 'county', label: `${c.county} (All Areas)` });
  return chips;
}

// the labels for a card: the first line is what is searched for ("Cars • Volkswagen ID.4 • Pro Plus"), then one line each for the
// year, price, mileage and location that were set, in that order
export function criteriaLines(c) {
  const chips = criteriaChips(c);
  const what = chips.filter((x) => ['subsection', 'vehicle', 'trims'].includes(x.key)).map((x) => x.label).join(' • ');
  const details = ['year', 'price', 'mileage', 'county'].map((k) => chips.find((x) => x.key === k)?.label).filter(Boolean);
  return { what, details };
}

// the target of a saved search is the same as this ad's (any year, price or county): used to say "you already saved this"
export function sameTarget(saved, c) {
  const l = (v) => String(v ?? '').trim().toLowerCase();
  return l(saved.make) === l(c.make) && l(saved.model) === l(c.make ? c.model : '') && l(saved.subsection) === l(c.subsection);
}
