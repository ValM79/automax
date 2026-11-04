// The four "service" categories: businesses that provide a service rather than vehicles for sale. All four pages use the same
// directory (components/automarket/ServiceDirectory.jsx) with these settings. `services` is the tick-list a business picks from
// and the buyer filters by; change the lists here to change both.
export const SERVICE_CATEGORIES = {
  'Rent a Car': {
    path: '/car-rent',
    banner: '/img/12a53ea6f_generated_image.jpg',
    noun: 'car rental companies',
    placeholder: 'Search by company name or town',
    services: ['Small car', 'Family car', '7-seater', 'Van', 'Automatic', 'Electric', 'Airport pickup'],
  },
  'Recovery Service': {
    path: '/recovery-service',
    banner: '/img/0babdc7b0_generated_image.jpg',
    noun: 'recovery services',
    placeholder: 'Search by company name or town',
    services: ['Towing', 'Breakdown assistance', 'Accident recovery', 'Flatbed transport', 'Vehicle collection', 'Jump start', 'Tyre change'],
  },
  'HGV Repair & Servicing': {
    path: '/hgv-repair-servicing',
    banner: '/img/hgv-repair-banner.jpg', // wide white-studio picture cut from hgv-repair.jpg so the truck fills the strip like the Recovery one
    noun: 'HGV garages',
    placeholder: 'Search by garage name or town',
    services: ['Servicing', 'Brakes', 'Tachograph', 'Tyres', 'Diagnostics', 'Trailer repairs', 'Roadside repair'],
  },
  'Auto Repair & Servicing': {
    path: '/auto-repair-servicing',
    banner: '/img/auto-repair-banner.jpg', // cut from auto-repair.jpg, same idea
    noun: 'garages',
    placeholder: 'Search by garage name or town',
    services: ['Servicing', 'Brakes', 'Tyres', 'Diagnostics', 'Clutch', 'Exhaust', 'Air conditioning', 'NCT preparation'],
  },
};

// What a business pays for one listing: months and price in cents (EUR). Display copy only: the amounts that are charged are
// in backend/lambda/_lib/serviceListing.mjs. One payment per period, no subscription; paying again adds months on.
export const LISTING_PERIODS = [
  { months: 1, cents: 2900 },
  { months: 3, cents: 4900 },
  { months: 6, cents: 7900 },
  { months: 9, cents: 9900 },
  { months: 12, cents: 10999 },
];
export const euro = (cents) => `€${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

// The "Show map" button on the directory pages. The map pictures come from OpenStreetMap (a third party), so they are only
// requested after a visitor clicks the button. Set to false to take the map off the pages completely.
export const SHOW_SERVICE_MAP = true;
