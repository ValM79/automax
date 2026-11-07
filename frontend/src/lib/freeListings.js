// Free launch offer: while this is true, Place Ad and "Upload your Ad" make the ad live without payment (the server function
// publishFreeAd does it and enforces the limits). The paid packages, Stripe checkout and iPhone purchase code are all still in
// place; set this to false, set FREE_LISTINGS to false in backend/lambda/_lib/freeListing.mjs, and deploy to bring payments back.
export const FREE_LISTINGS = true;

// The "package" a free ad uses: 30 days in every category, up to 12 photos, no bumps or spotlight. The length and photo count
// shown here are display only; the server (FREE_LISTING_DAYS in backend/lambda/_lib/freeListing.mjs) decides what is saved.
export const FREE_PACKAGE = { name: 'Free', price: 'Free', listingDays: 30, maxPhotos: 12, bumps: 0, bumpIntervalWeeks: null, spotlightDays: 0 };

// Live free ads one account may have: matches freeLimitFor in backend/lambda/_lib/freeListing.mjs (shown in the card text only).
export const freeLimitText = (sellerType) => (['trader', 'dealership', 'dealer'].includes(sellerType) ? 20 : 3);
