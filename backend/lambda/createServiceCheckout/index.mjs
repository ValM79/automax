// Starts the Stripe payment for a Service Business listing (a number of months, see LISTING_PERIODS in
// _lib/serviceListing.mjs). The browser only says how many months: the price comes from the server list, and the listing is
// switched on later by stripeWebhook after Stripe confirms the payment, never from the browser.
import Stripe from 'stripe';
import { json, getUserFromEvent, getUserProfile, getSecrets } from '../_lib/common.mjs';
import { LISTING_PERIODS, listingComplete } from '../_lib/serviceListing.mjs';

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { months } = JSON.parse(event.body || '{}');
    const amount = LISTING_PERIODS[months];
    if (!amount) return json(400, { error: 'Invalid listing period' });

    const profile = await getUserProfile(user.id);
    if (!profile || profile.seller_type !== 'service') return json(403, { error: 'Only a Service Business account can buy a listing' });
    if (!listingComplete(profile)) return json(400, { error: 'Please add your business name, category and county first' });

    const originHeader = event.headers?.origin || event.headers?.Origin;
    const rawOrigin = originHeader?.startsWith('https://') ? originHeader : process.env.APP_ORIGIN;
    if (!rawOrigin) return json(400, { error: 'Could not determine origin' });

    const { STRIPE_SECRET_KEY } = await getSecrets();
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const label = months === 1 ? '1 month' : `${months} months`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: amount,
          product_data: { name: `AutoMax business listing, ${label}`, description: `${profile.service_category}: ${String(profile.business_name).trim()}` },
        },
      }],
      success_url: `${rawOrigin}/profile?listing=paid`,
      cancel_url: `${rawOrigin}/profile?listing=cancelled`,
      metadata: { service_listing: 'true', user_id: user.id, months: String(months), category: profile.service_category },
    });

    return json(200, { url: session.url });
  } catch (error) {
    console.error('Service checkout error:', error.message);
    return json(500, { error: 'Could not start the payment. Please try again.' });
  }
};
