// Makes an ad live without payment during the free launch offer (see _lib/freeListing.mjs). Does the same job for a free ad that
// stripeWebhook / verifyAppleTransaction do for a paid one: it is the only place that activates an unpaid ad, so the checks live here.
import { GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent, getUserProfile } from '../_lib/common.mjs';
import { sendAdLiveEmail } from '../_lib/adEmails.mjs';
import { FREE_LISTINGS, FREE_PACKAGE_NAME, FREE_LISTING_DAYS, freeLimitFor, isLiveFreeAd } from '../_lib/freeListing.mjs';

async function countLiveFreeAds(userId, exceptAdId) {
  let count = 0;
  let key;
  const now = Date.now();
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.UserAd,
      IndexName: 'byOwner',
      KeyConditionExpression: 'created_by_id = :id',
      ExpressionAttributeValues: { ':id': userId },
      ProjectionExpression: 'id, #s, packageName, created_date, listingDays',
      ExpressionAttributeNames: { '#s': 'status' },
      ExclusiveStartKey: key,
    }));
    for (const ad of res.Items || []) if (ad.id !== exceptAdId && isLiveFreeAd(ad, now)) count++;
    key = res.LastEvaluatedKey;
  } while (key);
  return count;
}

export const handler = async (event) => {
  try {
    if (!FREE_LISTINGS) return json(403, { error: 'Free listings are not available right now.' });

    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { adId } = JSON.parse(event.body || '{}');
    if (!adId) return json(400, { error: 'adId is required' });

    // Ownership check: only the ad's creator may publish it.
    const adRes = await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: adId } }));
    const ad = adRes.Item;
    if (!ad) return json(404, { error: 'Ad not found' });
    if (ad.created_by_id !== user.id) return json(403, { error: 'Forbidden' });
    if (!['pending', 'active', 'expired'].includes(ad.status)) return json(400, { error: 'This ad cannot be published' });

    // A non-pending ad is an "Upload your Ad" renewal: it restarts the countdown, like a paid renewal does.
    const renewal = ad.status !== 'pending';

    if (user.role !== 'admin') {
      const profile = await getUserProfile(user.id);
      const limit = freeLimitFor(profile?.seller_type);
      if (Number.isFinite(limit) && (await countLiveFreeAds(user.id, adId)) >= limit) {
        return json(409, { error: `You already have ${limit} live free ads, which is the most one account can have. When one ends or is marked as sold, you can post another.` });
      }
    }

    const listingDays = FREE_LISTING_DAYS;
    const paidAt = new Date().toISOString();
    let updated;
    try {
      updated = await ddb.send(new UpdateCommand({
        TableName: TABLES.UserAd,
        Key: { id: adId },
        ReturnValues: 'ALL_NEW',
        // The status is checked again so two quick clicks cannot both go through.
        ConditionExpression: 'attribute_exists(id) AND #status = :prev',
        UpdateExpression: 'SET #status = :status, packageName = :pkg, listingDays = :days, spotlight = :spotlight, created_date = :now' +
          (renewal ? ', originalCreatedDate = if_not_exists(originalCreatedDate, created_date), renewCount = if_not_exists(renewCount, :zero) + :one' : ''),
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':prev': ad.status,
          ':status': 'active',
          ':pkg': FREE_PACKAGE_NAME,
          ':days': listingDays,
          ':spotlight': false,
          ':now': paidAt,
          ...(renewal ? { ':zero': 0, ':one': 1 } : {}),
        },
      }));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') return json(409, { error: 'This ad was just changed. Please check My Ads.' });
      throw err;
    }

    await sendAdLiveEmail({
      to: user.email || updated.Attributes?.email,
      ad: updated.Attributes,
      packageName: FREE_PACKAGE_NAME,
      listingDays,
      paidAt,
      renewal,
      free: true,
    });

    return json(200, { activated: true, renewed: renewal, listingDays });
  } catch (error) {
    console.error('Free ad publish error:', error.message);
    return json(500, { error: error.message });
  }
};
