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
    banner: null,
    noun: 'HGV garages',
    placeholder: 'Search by garage name or town',
    services: ['Servicing', 'Brakes', 'Tachograph', 'Tyres', 'Diagnostics', 'Trailer repairs', 'Roadside repair'],
  },
  'Auto Repair & Servicing': {
    path: '/auto-repair-servicing',
    banner: null,
    noun: 'garages',
    placeholder: 'Search by garage name or town',
    services: ['Servicing', 'Brakes', 'Tyres', 'Diagnostics', 'Clutch', 'Exhaust', 'Air conditioning', 'NCT preparation'],
  },
};

// The "Show map" button on the directory pages. The map pictures come from OpenStreetMap (a third party), so they are only
// requested after a visitor clicks the button. Set to false to take the map off the pages completely.
export const SHOW_SERVICE_MAP = true;
