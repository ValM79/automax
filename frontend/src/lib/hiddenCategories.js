// Categories that are built but not shown yet. Hidden ones are left out of "Search by category", the search box, Place Ad and Edit Ad,
// and their pages show "not found". To hide one again, add its name (and page address) to these lists and deploy. Nothing is hidden at the moment (Rent a Car and Recovery Service were launched 2026-11-04).
export const HIDDEN_CATEGORIES = [];
export const HIDDEN_ROUTES = [];

// Categories where businesses are listed in a directory (components/automarket/ServiceDirectory.jsx), not through Place Ad:
// an ad placed there would never be shown on the directory page.
export const DIRECTORY_CATEGORIES = ['Rent a Car', 'Recovery Service', 'HGV Repair & Servicing', 'Auto Repair & Servicing'];

export const isHiddenCategory = (name) => HIDDEN_CATEGORIES.includes(name);
export const isVisibleCategory = (name) => !isHiddenCategory(name);
export const isPlaceAdCategory = (name) => isVisibleCategory(name) && !DIRECTORY_CATEGORIES.includes(name);
export const isHiddenRoute = (path) => HIDDEN_ROUTES.includes(path);
