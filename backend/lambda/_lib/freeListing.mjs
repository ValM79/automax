// Free launch offer: while FREE_LISTINGS is true, an ad can be made live without paying (publishFreeAd). The paid packages, Stripe
// checkout and Apple purchase code are all still in place; set this to false and deploy to turn paid listings back on.
//
// This server copy is the one that counts: the browser only says which ad, never how long it runs or how many photos it may have.
// Keep FREE_LISTINGS in step with frontend/src/lib/freeListings.js.
export const FREE_LISTINGS = true;

const DAY_MS = 24 * 60 * 60 * 1000;

// A free ad runs for 60 days in every category. Keep in step with FREE_PACKAGE in frontend/src/lib/freeListings.js (display only).
export const FREE_PACKAGE_NAME = 'Free';
export const FREE_LISTING_DAYS = 60;

// Live free ads one account may have at a time. No limit for now (user decision 2026-11-10); to bring a cap back, set these to numbers
// (they were 3 for private sellers and 20 for business accounts) and keep freeLimitText in frontend/src/lib/freeListings.js in step.
export const FREE_LIMIT_PRIVATE = Infinity;
export const FREE_LIMIT_BUSINESS = Infinity;
const BUSINESS_TYPES = ['trader', 'dealership', 'dealer'];
export const freeLimitFor = (sellerType) => (BUSINESS_TYPES.includes(sellerType) ? FREE_LIMIT_BUSINESS : FREE_LIMIT_PRIVATE);

// True while a free ad is live: active, and its period (counted from created_date) has not run out.
export const isLiveFreeAd = (ad, now = Date.now()) => !!ad
  && ad.status === 'active'
  && ad.packageName === FREE_PACKAGE_NAME
  && Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS > now;
