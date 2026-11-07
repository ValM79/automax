// Free launch offer: while FREE_LISTINGS is true, an ad can be made live without paying (publishFreeAd). The paid packages, Stripe
// checkout and Apple purchase code are all still in place; set this to false and deploy to turn paid listings back on.
//
// This server copy is the one that counts: the browser only says which ad, never how long it runs or how many photos it may have.
// Keep FREE_LISTINGS in step with frontend/src/lib/freeListings.js.
export const FREE_LISTINGS = true;

const DAY_MS = 24 * 60 * 60 * 1000;

// Free ads run for what the Basic package gave: 60 days for cars and everything else, 30 days for the bike-priced sections.
// Keep BIKE_SUBSECTIONS in step with createCheckoutSession and frontend/src/components/automarket/AdPackageSelector.jsx.
const BIKE_SUBSECTIONS = ['Bikes & Bicycles', 'Car Extras', 'Car Parts', 'Boat Extras', 'Other items', 'Motorbike Extras'];
export const FREE_PACKAGE_NAME = 'Free';
export const freeListingDays = (subsection) => (BIKE_SUBSECTIONS.includes(subsection) ? 30 : 60);

// Live free ads one account may have at a time: private sellers 3, business accounts (Trader, Dealership, Dealer) 20.
export const FREE_LIMIT_PRIVATE = 3;
export const FREE_LIMIT_BUSINESS = 20;
const BUSINESS_TYPES = ['trader', 'dealership', 'dealer'];
export const freeLimitFor = (sellerType) => (BUSINESS_TYPES.includes(sellerType) ? FREE_LIMIT_BUSINESS : FREE_LIMIT_PRIVATE);

// True while a free ad is live: active, and its period (counted from created_date) has not run out.
export const isLiveFreeAd = (ad, now = Date.now()) => !!ad
  && ad.status === 'active'
  && ad.packageName === FREE_PACKAGE_NAME
  && Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS > now;
