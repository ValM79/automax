// Ported 1:1 from base44/functions/createCheckoutSession/entry.ts
import Stripe from 'stripe';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent, getSecrets } from '../_lib/common.mjs';

// Server-side package configuration — the client sends only the package name and
// isBikeCategory flag; ALL paid properties are resolved here so they can't be
// tampered with client-side. Replace these Stripe Price IDs with your own (create
// them in the Stripe Dashboard after moving off Base44's Stripe integration).
//
// Car prices raised 2026-10-01 (0.99/2.99/6.99 -> 2.99/6.99/14.99); bike prices
// left untouched. This intentionally breaks the 2026-09-27 price parity with
// Apple's fixed IAP tiers (still 0.99/2.99/6.99 in App Store Connect) -- iOS
// isn't live yet, so nothing is mismatched for real users today, but the IAP
// tiers need updating to match before iOS ships, or iPhone customers will pay
// less than everyone else for the same package. Old Price IDs (pre-2026-10-01
// car prices, and the original €1/€3/€7 and €0.50/€1/€3 ones) are left in
// Stripe -- never delete a Price with past purchases attached -- but none are
// referenced here anymore.
const PACKAGE_CONFIG = {
  Basic: { priceId: 'price_1ULfXLLCaYSUWHrbtm9T8gW7', listingDays: 60, maxPhotos: 12, bumps: 0, bumpIntervalWeeks: 0, spotlightDays: 0 },
  Standard: { priceId: 'price_1ULfYNLCaYSUWHrbA4GGQM6s', listingDays: 72, maxPhotos: 12, bumps: 2, bumpIntervalWeeks: 4, spotlightDays: 0 },
  Premium: { priceId: 'price_1ULfZfLCaYSUWHrbZmyMqnLh', listingDays: 90, maxPhotos: 12, bumps: 3, bumpIntervalWeeks: 3, spotlightDays: 5 },
};
const BIKE_PACKAGE_CONFIG = {
  Basic: { priceId: 'price_1UKQ9ZLCaYSUWHrbiUuY0P4Y', listingDays: 30, maxPhotos: 12, bumps: 0, bumpIntervalWeeks: 0, spotlightDays: 0 },
  Standard: { priceId: 'price_1UKQC5LCaYSUWHrbhECPK1QX', listingDays: 60, maxPhotos: 12, bumps: 2, bumpIntervalWeeks: 4, spotlightDays: 0 },
  Premium: { priceId: 'price_1UKQF7LCaYSUWHrbYGpX8TJ5', listingDays: 90, maxPhotos: 12, bumps: 3, bumpIntervalWeeks: 3, spotlightDays: 5 },
};

// Subsections priced from the bike list; keep in sync with BIKE_PACKAGE_SUBSECTIONS
// in frontend/src/components/automarket/AdPackageSelector.jsx.
const BIKE_SUBSECTIONS = ['Bikes & Bicycles', 'Car Extras', 'Car Parts', 'Boat Extras', 'Other items', 'Motorbike Extras'];

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { packageName, adId, isBikeCategory: clientBikeFlag } = JSON.parse(event.body || '{}');
    if (!adId) return json(400, { error: 'adId is required' });

    // Ownership check — only the ad's creator may initiate checkout for it.
    const adRes = await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: adId } }));
    const ad = adRes.Item;
    if (!ad) return json(404, { error: 'Ad not found' });
    if (ad.created_by_id !== user.id) return json(403, { error: 'Forbidden' });
    if (!['pending', 'active', 'expired'].includes(ad.status)) return json(400, { error: 'Ad is not in a payable state' });

    // A non-pending ad being paid for is a renewal ("Upload your Ad"): the live ad
    // is left untouched until payment succeeds, then the webhook restarts its
    // countdown. The category (and so the price list) is derived from the stored
    // ad rather than trusted from the client.
    const isRenewal = ad.status !== 'pending';
    const isBikeCategory = isRenewal ? BIKE_SUBSECTIONS.includes(ad.subsection) : clientBikeFlag;

    const configMap = isBikeCategory ? BIKE_PACKAGE_CONFIG : PACKAGE_CONFIG;
    if (!packageName || !configMap[packageName]) return json(400, { error: 'Invalid or missing package' });

    const pkg = configMap[packageName];

    // Determine app origin for Stripe redirect URLs
    const originHeader = event.headers?.origin || event.headers?.Origin;
    const rawOrigin = originHeader?.startsWith('https://') ? originHeader : process.env.APP_ORIGIN;
    if (!rawOrigin) return json(400, { error: 'Could not determine origin' });

    const { STRIPE_SECRET_KEY } = await getSecrets();
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: pkg.priceId, quantity: 1 }],
      mode: 'payment',
      success_url: isRenewal
        ? `${rawOrigin}/my-ads?renewed=1`
        : `${rawOrigin}/place-ad?payment=success&package=${encodeURIComponent(packageName)}&listingDays=${pkg.listingDays}&maxPhotos=${pkg.maxPhotos}`,
      cancel_url: isRenewal ? `${rawOrigin}/my-ads` : `${rawOrigin}/place-ad?payment=cancelled`,
      metadata: {
        renewal: isRenewal ? 'true' : 'false',
        package_name: packageName,
        listing_days: String(pkg.listingDays),
        max_photos: String(pkg.maxPhotos),
        bumps: String(pkg.bumps),
        bump_interval_weeks: String(pkg.bumpIntervalWeeks),
        spotlight_days: String(pkg.spotlightDays),
        ad_id: adId,
      },
    });

    return json(200, { url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return json(500, { error: error.message });
  }
};
