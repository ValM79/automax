// Categories that are built but not shown yet. Hidden ones are left out of "Search by category", the search box, Place Ad and Edit Ad,
// and their pages show "not found". To launch one, take its name (and page address) out of these lists and deploy.
export const HIDDEN_CATEGORIES = ['Rent a Car', 'Recovery Service'];
export const HIDDEN_ROUTES = ['/car-rent', '/recovery-service'];

export const isHiddenCategory = (name) => HIDDEN_CATEGORIES.includes(name);
export const isVisibleCategory = (name) => !isHiddenCategory(name);
export const isHiddenRoute = (path) => HIDDEN_ROUTES.includes(path);
