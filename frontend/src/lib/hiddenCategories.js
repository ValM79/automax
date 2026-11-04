// Categories that are built but not shown yet. Hidden ones are left out of "Search by category", the search box, Place Ad and Edit Ad,
// and their pages show "not found". To hide one, add its name (and page address) to these lists and deploy; to show it again, remove it.
// The four service directory categories were launched 2026-11-04 and hidden again the same evening (user decision): their pages, the
// Service Business sign-up option and the business pages stay off until they are taken out of these lists.
export const HIDDEN_CATEGORIES = ['Rent a Car', 'Recovery Service', 'HGV Repair & Servicing', 'Auto Repair & Servicing'];
export const HIDDEN_ROUTES = ['/car-rent', '/recovery-service', '/hgv-repair-servicing', '/auto-repair-servicing'];

// Categories where businesses are listed in a directory (components/automarket/ServiceDirectory.jsx), not through Place Ad:
// an ad placed there would never be shown on the directory page.
export const DIRECTORY_CATEGORIES = ['Rent a Car', 'Recovery Service', 'HGV Repair & Servicing', 'Auto Repair & Servicing'];

export const isHiddenCategory = (name) => HIDDEN_CATEGORIES.includes(name);
export const isVisibleCategory = (name) => !isHiddenCategory(name);
export const isPlaceAdCategory = (name) => isVisibleCategory(name) && !DIRECTORY_CATEGORIES.includes(name);
export const isHiddenRoute = (path) => HIDDEN_ROUTES.includes(path);
// True while every directory category is hidden: then there is nothing for a Service Business to be listed in.
export const isServiceDirectoryHidden = () => DIRECTORY_CATEGORIES.every(isHiddenCategory);
