// Service Business accounts (Rent a Car, Recovery Service, HGV Repair & Servicing, Auto Repair & Servicing): what a business
// may choose, what a listing costs, and when it counts as listed.
//
// This server copy is the one that counts: updateProfile only saves values from these lists, and createServiceCheckout charges
// the amounts below (the browser only says how many months). Keep the lists in step with frontend/src/lib/serviceCategories.js.
export const SERVICE_CATEGORIES = {
  'Rent a Car': ['Small car', 'Family car', '7-seater', 'Van', 'Automatic', 'Electric', 'Airport pickup'],
  'Recovery Service': ['Towing', 'Breakdown assistance', 'Accident recovery', 'Flatbed transport', 'Vehicle collection', 'Jump start', 'Tyre change'],
  'HGV Repair & Servicing': ['Servicing', 'Brakes', 'Tachograph', 'Tyres', 'Diagnostics', 'Trailer repairs', 'Roadside repair'],
  'Auto Repair & Servicing': ['Servicing', 'Brakes', 'Tyres', 'Diagnostics', 'Clutch', 'Exhaust', 'Air conditioning', 'NCT preparation'],
};

export const isCategory = (c) => typeof c === 'string' && Object.hasOwn(SERVICE_CATEGORIES, c);

// Months of listing -> price in cents (EUR). One payment per period, no subscription; paying again before the end adds on.
export const LISTING_PERIODS = Object.freeze({ 1: 2900, 3: 4900, 6: 7900, 9: 9900, 12: 10999 });

// The date a listing ends when `months` are added to `from` (a Date).
export function addMonths(from, months) {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

// A profile is ready to be listed when it has a name, a category and a county.
export const listingComplete = (p) => !!(p && String(p.business_name || '').trim() && isCategory(p.service_category) && p.county);

// Shown in the directory: a Service Business, complete, paid up and not hidden by the site owner (service_hidden = true,
// set directly in the database, like a hidden review).
export const isListed = (p, now = Date.now()) => !!(
  p && p.seller_type === 'service' && listingComplete(p) && p.service_hidden !== true && Date.parse(p.listed_until || '') > now
);
