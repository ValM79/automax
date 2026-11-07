import { packages, bikePackages } from '@/components/automarket/AdPackageSelector';

// Free launch offer: while this is true, Place Ad and "Upload your Ad" make the ad live without payment (the server function
// publishFreeAd does it and enforces the limits). The paid packages, Stripe checkout and iPhone purchase code are all still in
// place; set this to false, set FREE_LISTINGS to false in backend/lambda/_lib/freeListing.mjs, and deploy to bring payments back.
export const FREE_LISTINGS = true;

// The "package" a free ad uses: what Basic gave (60 days, 30 for the bike-priced sections), up to 12 photos, no bumps or spotlight.
// The length and photo count shown here are display only; the server decides what is actually saved.
export const freePackageFor = (isBikeCategory) => {
  const basic = (isBikeCategory ? bikePackages : packages)[0];
  return { name: 'Free', price: 'Free', listingDays: basic.listingDays, maxPhotos: basic.maxPhotos, bumps: 0, bumpIntervalWeeks: null, spotlightDays: 0 };
};

// Live free ads one account may have: matches freeLimitFor in backend/lambda/_lib/freeListing.mjs (shown in the card text only).
export const freeLimitText = (sellerType) => (['trader', 'dealership', 'dealer'].includes(sellerType) ? 20 : 3);
