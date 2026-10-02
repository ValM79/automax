// Ported 1:1 from base44/functions/stripeWebhook/entry.ts
// Configure this route's URL (https://<api-id>.execute-api.<region>.amazonaws.com/webhooks/stripe)
// as the endpoint in the Stripe Dashboard once deployed.
import Stripe from 'stripe';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getSecrets } from '../_lib/common.mjs';

export const handler = async (event) => {
  try {
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    const signature = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature'];
    if (!signature) return json(400, { error: 'Missing stripe-signature header' });

    const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = await getSecrets();
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return json(400, { error: 'Invalid signature' });
    }

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const adId = session.metadata?.ad_id;
      if (adId) {
        // Trust only verified Stripe metadata — never client-supplied values.
        // ConditionExpression guards against events for ad IDs from a different
        // deployment sharing this same Stripe account (e.g. the live Base44 site) —
        // without it, DynamoDB's default upsert would create a bogus partial record.
        // A renewal ("Upload your Ad" on an existing ad) restarts the listing: the
        // whole app keys expiry, sort order and "listed X ago" off created_date, so
        // it moves forward (the original is kept). Timestamps come from the Stripe
        // session, not the clock, so a replayed event can't push the countdown out.
        const renewal = session.metadata?.renewal === 'true';
        const paidAt = new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toISOString();
        const packageName = session.metadata?.package_name || '';
        const listingDays = parseInt(session.metadata?.listing_days || '0', 10);
        try {
          await ddb.send(
            new UpdateCommand({
              TableName: TABLES.UserAd,
              Key: { id: adId },
              // lastStripeSessionId makes a replayed event for the same session a no-op
              // (it would otherwise append a duplicate paymentHistory entry).
              ConditionExpression:
                'attribute_exists(id) AND (attribute_not_exists(lastStripeSessionId) OR lastStripeSessionId <> :sid)',
              UpdateExpression:
                'SET #status = :status, packageName = :pkg, listingDays = :days, spotlight = :spotlight, paymentAmount = :amount, receiptUrl = :receipt, lastStripeSessionId = :sid, paymentHistory = list_append(if_not_exists(paymentHistory, :emptyList), :entry)' +
                (renewal
                  ? ', originalCreatedDate = if_not_exists(originalCreatedDate, created_date), created_date = :paidAt, renewCount = if_not_exists(renewCount, :zero) + :one'
                  : ''),
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'active',
                ':pkg': packageName,
                ':days': listingDays,
                ':spotlight': parseInt(session.metadata?.spotlight_days || '0', 10) > 0,
                ':amount': session.amount_total || 0,
                ':receipt': session.receipt_url || '',
                ':sid': session.id,
                ':emptyList': [],
                ':entry': [
                  {
                    date: paidAt,
                    packageName,
                    listingDays,
                    amount: session.amount_total || 0,
                    stripeSessionId: session.id,
                    renewal,
                  },
                ],
                ...(renewal ? { ':paidAt': paidAt, ':zero': 0, ':one': 1 } : {}),
              },
            })
          );
          console.log(`Ad ${adId} ${renewal ? 'renewed' : 'activated'} after payment ${session.id}, amount: ${session.amount_total}`);
        } catch (err) {
          if (err.name === 'ConditionalCheckFailedException') {
            console.log(`Ignoring checkout.session.completed ${session.id} for ad ${adId} (unknown ad from another deployment, or already processed)`);
          } else {
            throw err;
          }
        }
      } else {
        console.error('No ad_id in session metadata for session', session.id);
      }
    } else if (stripeEvent.type === 'checkout.session.expired') {
      const session = stripeEvent.data.object;
      const adId = session.metadata?.ad_id;
      if (adId) {
        try {
          await ddb.send(
            new UpdateCommand({
              TableName: TABLES.UserAd,
              Key: { id: adId },
              // Only a still-unpaid ad is abandoned. An abandoned *renewal* checkout
              // targets an ad that is active (or expired-but-paid) and must be left alone.
              ConditionExpression: 'attribute_exists(id) AND #status = :pending',
              UpdateExpression: 'SET #status = :status',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: { ':status': 'expired', ':pending': 'pending' },
            })
          );
          console.log(`Ad ${adId} marked expired after checkout session expired`);
        } catch (err) {
          if (err.name === 'ConditionalCheckFailedException') {
            console.log(`Ignoring checkout.session.expired for ad ${adId} (unknown ad, or not pending)`);
          } else {
            throw err;
          }
        }
      }
    }

    return json(200, { received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return json(500, { error: error.message });
  }
};
