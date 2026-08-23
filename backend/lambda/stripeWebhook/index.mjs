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
        try {
          await ddb.send(
            new UpdateCommand({
              TableName: TABLES.UserAd,
              Key: { id: adId },
              ConditionExpression: 'attribute_exists(id)',
              UpdateExpression:
                'SET #status = :status, packageName = :pkg, listingDays = :days, spotlight = :spotlight, paymentAmount = :amount, receiptUrl = :receipt',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'active',
                ':pkg': session.metadata?.package_name || '',
                ':days': parseInt(session.metadata?.listing_days || '0', 10),
                ':spotlight': parseInt(session.metadata?.spotlight_days || '0', 10) > 0,
                ':amount': session.amount_total || 0,
                ':receipt': session.receipt_url || '',
              },
            })
          );
          console.log(`Ad ${adId} activated after payment ${session.id}, amount: ${session.amount_total}`);
        } catch (err) {
          if (err.name === 'ConditionalCheckFailedException') {
            console.log(`Ignoring checkout.session.completed for unknown ad ${adId} (not from this deployment)`);
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
              ConditionExpression: 'attribute_exists(id)',
              UpdateExpression: 'SET #status = :status',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: { ':status': 'expired' },
            })
          );
          console.log(`Ad ${adId} marked expired after checkout session expired`);
        } catch (err) {
          if (err.name === 'ConditionalCheckFailedException') {
            console.log(`Ignoring checkout.session.expired for unknown ad ${adId} (not from this deployment)`);
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
