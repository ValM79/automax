// Ported 1:1 from base44/functions/createCheckoutSession/entry.ts
import Stripe from 'stripe';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent, getSecrets } from '../_lib/common.mjs';

// Server-side package configuration — the client sends only the package name and
// isBikeCategory flag; ALL paid properties are resolved here so they can't be
// tampered with client-side. Replace these Stripe Price IDs with your own (create
// them in the Stripe Dashboard after moving off Base44's Stripe integration).
// Prices re-aligned 2026-09-27 to match Apple's fixed IAP price tiers (0.99/2.99/6.99
// for car, 0.99/1.99/2.99 for bike) so web/Android and iOS customers see the same
// price. The old €1/€3/€7 and €0.50/€1/€3 Price IDs are left in Stripe (never delete
// a Price with past purchases attached) but are no longer referenced here.
const PACKAGE_CONFIG = {
  Basic: { priceId: 'price_1UKQ8XLCaYSUWHrbxLP0dPCw', listingDays: 60, maxPhotos: 12, bumps: 0, bumpIntervalWeeks: 0, spotlightDays: 0 },
  Standard: { priceId: 'price_1UKQAwLCaYSUWHrblYOkaxyQ', listingDays: 72, maxPhotos: 12, bumps: 2, bumpIntervalWeeks: 4, spotlightDays: 0 },
  Premium: { priceId: 'price_1UKQDzLCaYSUWHrbdh5Arqie', listingDays: 90, maxPhotos: 12, bumps: 3, bumpIntervalWeeks: 3, spotlightDays: 5 },
};
const BIKE_PACKAGE_CONFIG = {
  Basic: { priceId: 'price_1UKQ9ZLCaYSUWHrbiUuY0P4Y', listingDays: 30, maxPhotos: 12, bumps: 0, bumpIntervalWeeks: 0, spotlightDays: 0 },
  Standard: { priceId: 'price_1UKQC5LCaYSUWHrbhECPK1QX', listingDays: 60, maxPhotos: 12, bumps: 2, bumpIntervalWeeks: 4, spotlightDays: 0 },
  Premium: { priceId: 'price_1UKQF7LCaYSUWHrbYGpX8TJ5', listingDays: 90, maxPhotos: 12, bumps: 3, bumpIntervalWeeks: 3, spotlightDays: 5 },
};

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { packageName, adId, isBikeCategory } = JSON.parse(event.body || '{}');
    const configMap = isBikeCategory ? BIKE_PACKAGE_CONFIG : PACKAGE_CONFIG;
    if (!packageName || !configMap[packageName]) return json(400, { error: 'Invalid or missing package' });
    if (!adId) return json(400, { error: 'adId is required' });

    const pkg = configMap[packageName];

    // Ownership check — only the ad's creator may initiate checkout for it.
    const adRes = await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: adId } }));
    const ad = adRes.Item;
    if (!ad) return json(404, { error: 'Ad not found' });
    if (ad.created_by_id !== user.id) return json(403, { error: 'Forbidden' });
    if (ad.status !== 'pending') return json(400, { error: 'Ad is not in a payable state' });

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
      success_url: `${rawOrigin}/place-ad?payment=success&package=${encodeURIComponent(packageName)}&listingDays=${pkg.listingDays}&maxPhotos=${pkg.maxPhotos}`,
      cancel_url: `${rawOrigin}/place-ad?payment=cancelled`,
      metadata: {
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
