// Scheduled (EventBridge, daily). Two sweeps over the UserAd table:
//
// 1. Abandoned drafts: ads saved as 'pending' before checkout and never paid for
//    (still 'pending', or flipped to 'expired' by stripeWebhook when the Stripe
//    session lapsed) are deleted after ABANDONED_AD_MAX_AGE_DAYS. Every
//    activation path (Stripe webhook, Apple verify) stamps packageName, so an ad
//    without one was never paid.
// 2. Paid-period expiry: 'active' ads past created_date + listingDays are marked
//    'expired', so My Ads shows the right badge and Renew button. The public
//    listings already hide them client-side; this just makes the data agree.
//    Ads without listingDays (seeded/legacy) are never touched.
//
// Scan rather than a GSI query: byStatusSubsection is sparse (items missing
// `subsection` aren't indexed) and this table is small, so a daily scan is both
// cheap and complete.
import { DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../_lib/common.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_AGE_DAYS = parseInt(process.env.ABANDONED_AD_MAX_AGE_DAYS || '7', 10);

async function scanAll(params, onItem) {
  let lastKey;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: TABLES.UserAd, ...params, ExclusiveStartKey: lastKey }));
    for (const item of res.Items || []) await onItem(item);
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
}

async function deleteAbandoned(now) {
  const cutoffIso = new Date(now - MAX_AGE_DAYS * DAY_MS).toISOString();
  let deleted = 0;
  await scanAll(
    {
      FilterExpression:
        '#status IN (:pending, :expired) AND attribute_not_exists(packageName) AND created_date < :cutoff',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':pending': 'pending', ':expired': 'expired', ':cutoff': cutoffIso },
      ProjectionExpression: 'id',
    },
    async (item) => {
      try {
        // Re-check at delete time so an ad activated by a late webhook after the
        // scan is never removed.
        await ddb.send(
          new DeleteCommand({
            TableName: TABLES.UserAd,
            Key: { id: item.id },
            ConditionExpression: '#status IN (:pending, :expired) AND attribute_not_exists(packageName)',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':pending': 'pending', ':expired': 'expired' },
          })
        );
        deleted++;
      } catch (err) {
        if (err.name !== 'ConditionalCheckFailedException') throw err;
      }
    }
  );
  return deleted;
}

async function expirePaidAds(now) {
  let expired = 0;
  await scanAll(
    {
      FilterExpression: '#status = :active AND attribute_exists(listingDays) AND attribute_exists(created_date)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
      ProjectionExpression: 'id, created_date, listingDays',
    },
    async (item) => {
      const expiresAt = Date.parse(item.created_date) + Number(item.listingDays) * DAY_MS;
      if (!Number.isFinite(expiresAt) || expiresAt >= now) return;
      try {
        await ddb.send(
          new UpdateCommand({
            TableName: TABLES.UserAd,
            Key: { id: item.id },
            ConditionExpression: '#status = :active',
            UpdateExpression: 'SET #status = :expired',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':active': 'active', ':expired': 'expired' },
          })
        );
        expired++;
      } catch (err) {
        if (err.name !== 'ConditionalCheckFailedException') throw err;
      }
    }
  );
  return expired;
}

export const handler = async () => {
  const now = Date.now();
  const deleted = await deleteAbandoned(now);
  const expired = await expirePaidAds(now);
  console.log(`Ad lifecycle: deleted ${deleted} abandoned unpaid ad(s) older than ${MAX_AGE_DAYS}d, marked ${expired} paid ad(s) expired`);
  return { deleted, expired };
};
