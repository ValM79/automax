// Scheduled (EventBridge, daily). Deletes ads that were saved as 'pending' before
// checkout and never paid for: still 'pending', or flipped to 'expired' by
// stripeWebhook when the Stripe session lapsed. Every activation path (Stripe
// webhook, Apple verify) stamps packageName, so an ad without one was never paid.
//
// Scan rather than a GSI query: byStatusSubsection is sparse (items missing
// `subsection` aren't indexed) and this table is small, so a daily scan is both
// cheap and complete.
import { DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../_lib/common.mjs';

const MAX_AGE_DAYS = parseInt(process.env.ABANDONED_AD_MAX_AGE_DAYS || '7', 10);

export const handler = async () => {
  const cutoffIso = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let lastKey;
  let deleted = 0;
  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: TABLES.UserAd,
        FilterExpression:
          '#status IN (:pending, :expired) AND attribute_not_exists(packageName) AND created_date < :cutoff',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':pending': 'pending', ':expired': 'expired', ':cutoff': cutoffIso },
        ProjectionExpression: 'id',
        ExclusiveStartKey: lastKey,
      })
    );
    for (const item of res.Items || []) {
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
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  console.log(`Abandoned-ad cleanup: removed ${deleted} unpaid pending/expired ad(s) older than ${MAX_AGE_DAYS}d (cutoff ${cutoffIso})`);
  return { deleted };
};
